/**
 * Document Ingestion Pipeline
 * 
 * Flow:
 * 1. Parse PDF → Extract raw text
 * 2. Clean text → Remove excessive whitespace, normalize encoding
 * 3. Chunk text → Split into semantic units (1000 chars, 200 overlap)
 * 4. Embed chunks → Generate 768-dim vectors via Gemini
 * 5. Store → Insert into document_chunks table
 * 
 * Why these specific values?
 * - chunkSize: 1000 → ~250 tokens, good balance of context and specificity
 * - chunkOverlap: 200 → Ensures no sentence is cut off without context
 * - embedding dim: 768 → Matches Gemini text-embedding-004 output
 */

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { embedBatchWithRetry, estimateTokens } from "./gemini.safe";
import { supabaseAdmin } from "./supabase.server";

// Dynamic import for pdf-parse (CommonJS module)
// This is loaded lazily to avoid Next.js bundling issues
let pdfParse: any = null;
async function loadPdfParse() {
  if (!pdfParse) {
    pdfParse = (await import("pdf-parse")).default;
  }
  return pdfParse;
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Chunking parameters
  CHUNK_SIZE: 1000,        // Characters per chunk
  CHUNK_OVERLAP: 200,      // Overlap between chunks for context continuity
  
  // Batch processing
  EMBEDDING_BATCH_SIZE: 10, // Process N chunks at a time for progress updates
  
  // Text cleaning
  MAX_CONSECUTIVE_NEWLINES: 2,
  
  // Limits
  MAX_DOCUMENT_SIZE_MB: 20,
  MAX_CHUNKS_PER_DOCUMENT: 500,
} as const;

// ============================================================================
// Types
// ============================================================================

export interface ProcessingResult {
  success: boolean;
  documentId: string;
  chunkCount: number;
  error?: string;
  processingTimeMs: number;
}

export interface ProcessingProgress {
  stage: "parsing" | "chunking" | "embedding" | "storing" | "complete" | "error";
  progress: number;  // 0-100
  message: string;
}

type ProgressCallback = (progress: ProcessingProgress) => void;

// ============================================================================
// Text Extraction
// ============================================================================

/**
 * Extract text content from a PDF buffer
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const parser = await loadPdfParse();
    const data = await parser(buffer);
    
    if (!data || !data.text) {
      throw new Error("PDF parser returned no text content");
    }
    
    return data.text;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[PDF Parser Error]:", errorMsg);
    throw new Error(
      `PDF parsing failed: ${errorMsg}`
    );
  }
}

// ============================================================================
// Text Cleaning
// ============================================================================

/**
 * Clean extracted text for better embedding quality
 * 
 * Why each step matters:
 * - Normalize whitespace: PDFs often have weird spacing from column layouts
 * - Remove excessive newlines: Page breaks create artificial separations
 * - Trim lines: Prevent leading/trailing spaces from affecting embeddings
 */
function cleanText(text: string): string {
  return text
    // Replace multiple spaces with single space
    .replace(/ +/g, " ")
    // Replace multiple newlines with max 2
    .replace(/\n{3,}/g, "\n\n")
    // Remove carriage returns
    .replace(/\r/g, "")
    // Trim each line
    .split("\n")
    .map(line => line.trim())
    .join("\n")
    // Final trim
    .trim();
}

// ============================================================================
// Text Chunking
// ============================================================================

/**
 * Split text into overlapping chunks using RecursiveCharacterTextSplitter
 * 
 * Why Recursive?
 * - Tries to split on paragraphs first, then sentences, then words
 * - Results in more semantically coherent chunks than fixed-size splitting
 */
async function chunkText(text: string): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CONFIG.CHUNK_SIZE,
    chunkOverlap: CONFIG.CHUNK_OVERLAP,
    // Separators in order of preference
    separators: ["\n\n", "\n", ". ", " ", ""],
  });
  
  const docs = await splitter.createDocuments([text]);
  return docs.map(doc => doc.pageContent);
}

// ============================================================================
// Database Operations
// ============================================================================

interface ChunkInsert {
  document_id: string;
  content: string;
  chunk_index: number;
  embedding: string; // Postgres expects array as string like '[0.1, 0.2, ...]'
  token_count: number;
}

/**
 * Insert chunks with embeddings into the database
 */
async function storeChunks(
  documentId: string,
  chunks: string[],
  embeddings: number[][]
): Promise<void> {
  const inserts: ChunkInsert[] = chunks.map((content, index) => ({
    document_id: documentId,
    content,
    chunk_index: index,
    // Format embedding as Postgres vector literal
    embedding: `[${embeddings[index].join(",")}]`,
    token_count: estimateTokens(content),
  }));
  
  // Insert in batches to avoid hitting Supabase payload limits
  const BATCH_SIZE = 50;
  for (let i = 0; i < inserts.length; i += BATCH_SIZE) {
    const batch = inserts.slice(i, i + BATCH_SIZE);
    
    const { error } = await supabaseAdmin
      .from("document_chunks")
      .insert(batch);
    
    if (error) {
      throw new Error(`Failed to insert chunks: ${error.message}`);
    }
  }
}

/**
 * Update document status after processing
 */
async function updateDocumentStatus(
  documentId: string,
  status: {
    is_processed: boolean;
    chunk_count?: number;
    processing_error?: string | null;
  }
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("documents")
    .update(status)
    .eq("id", documentId);
  
  if (error) {
    throw new Error(`Failed to update document status: ${error.message}`);
  }
}

// ============================================================================
// Main Processing Function
// ============================================================================

/**
 * Process a PDF document: extract, chunk, embed, and store
 * 
 * @param fileBuffer - The raw PDF file buffer
 * @param documentId - The UUID of the document record in the database
 * @param onProgress - Optional callback for progress updates
 * 
 * @example
 * const result = await processDocument(buffer, "uuid-here", (progress) => {
 *   console.log(`${progress.stage}: ${progress.progress}% - ${progress.message}`);
 * });
 */
export async function processDocument(
  fileBuffer: Buffer,
  documentId: string,
  onProgress?: ProgressCallback
): Promise<ProcessingResult> {
  const startTime = Date.now();
  
  const report = (stage: ProcessingProgress["stage"], progress: number, message: string) => {
    onProgress?.({ stage, progress, message });
  };
  
  try {
    // Validate file size
    const sizeMB = fileBuffer.length / (1024 * 1024);
    if (sizeMB > CONFIG.MAX_DOCUMENT_SIZE_MB) {
      throw new Error(
        `File too large: ${sizeMB.toFixed(1)}MB exceeds ${CONFIG.MAX_DOCUMENT_SIZE_MB}MB limit`
      );
    }
    
    // Stage 1: Parse PDF
    console.log(`[Ingest] Starting PDF extraction for document ${documentId}`);
    report("parsing", 10, "Extracting text from PDF...");
    const rawText = await extractTextFromPDF(fileBuffer);
    
    if (!rawText || rawText.trim().length < 100) {
      console.error("[Ingest] PDF extraction resulted in empty or too little text");
      throw new Error("PDF appears to be empty or contains too little text");
    }
    
    console.log(`[Ingest] Extracted ${rawText.length} characters from PDF`);
    
    // Stage 2: Clean text
    report("chunking", 20, "Cleaning and chunking text...");
    const cleanedText = cleanText(rawText);
    console.log(`[Ingest] Cleaned text: ${cleanedText.length} characters`);
    
    // Stage 3: Chunk text
    const chunks = await chunkText(cleanedText);
    
    if (chunks.length === 0) {
      console.error("[Ingest] Text chunking resulted in zero chunks");
      throw new Error("No text chunks could be created from document");
    }
    
    if (chunks.length > CONFIG.MAX_CHUNKS_PER_DOCUMENT) {
      console.error(`[Ingest] Too many chunks: ${chunks.length}`);
      throw new Error(
        `Document too large: ${chunks.length} chunks exceeds ${CONFIG.MAX_CHUNKS_PER_DOCUMENT} limit`
      );
    }
    
    console.log(`[Ingest] Created ${chunks.length} chunks`);
    report("embedding", 30, `Generating embeddings for ${chunks.length} chunks...`);
    
    // Stage 4: Generate embeddings with progress tracking
    const embeddingResults = await embedBatchWithRetry(chunks, (completed, total) => {
      const embeddingProgress = 30 + Math.floor((completed / total) * 50);
      report("embedding", embeddingProgress, `Embedded ${completed}/${total} chunks...`);
    });
    
    const embeddings = embeddingResults.map(r => r.embedding);
    
    // Stage 5: Store in database
    report("storing", 85, "Saving to database...");
    await storeChunks(documentId, chunks, embeddings);
    
    // Update document status
    report("storing", 95, "Updating document status...");
    await updateDocumentStatus(documentId, {
      is_processed: true,
      chunk_count: chunks.length,
      processing_error: null,
    });
    
    report("complete", 100, "Processing complete!");
    
    return {
      success: true,
      documentId,
      chunkCount: chunks.length,
      processingTimeMs: Date.now() - startTime,
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    report("error", 0, errorMessage);
    
    // Try to update document with error status
    try {
      await updateDocumentStatus(documentId, {
        is_processed: false,
        processing_error: errorMessage,
      });
    } catch {
      // Ignore error update failures
    }
    
    return {
      success: false,
      documentId,
      chunkCount: 0,
      error: errorMessage,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

// ============================================================================
// Utility: Extract Text Only (for Topic Tree Generation)
// ============================================================================

/**
 * Extract and clean text from a PDF without chunking/embedding
 * Used for topic tree generation which uses the raw text
 * 
 * @param fileBuffer - The raw PDF file buffer
 * @param maxLength - Maximum characters to return (default: 50000)
 */
export async function extractDocumentText(
  fileBuffer: Buffer,
  maxLength: number = 50000
): Promise<string> {
  const rawText = await extractTextFromPDF(fileBuffer);
  const cleanedText = cleanText(rawText);
  
  // Return first N characters for topic tree generation
  if (cleanedText.length > maxLength) {
    return cleanedText.slice(0, maxLength);
  }
  
  return cleanedText;
}

// ============================================================================
// Re-export types for external use
// ============================================================================

export type { ProgressCallback };
