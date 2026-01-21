/**
 * Document Ingestion API Endpoint
 * 
 * POST /api/ingest
 * 
 * Accepts a PDF file upload, stores it in Supabase Storage,
 * creates a document record, and initiates the processing pipeline.
 * 
 * Flow:
 * 1. Authenticate user via session cookie
 * 2. Validate file (type, size)
 * 3. Upload to Supabase Storage
 * 4. Create document record
 * 5. Process document (extract, chunk, embed)
 * 6. Return document ID and status
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processDocument } from "@/lib/ingest";

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  MAX_FILE_SIZE_MB: 20,
  ALLOWED_MIME_TYPES: ["application/pdf"] as string[],
  STORAGE_BUCKET: "documents",
} as const;

// ============================================================================
// Supabase Clients
// ============================================================================

// Admin client for storage operations (bypasses RLS)
const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error("Missing Supabase configuration");
  }
  
  return createClient(url, key, {
    auth: { persistSession: false },
  });
};

// User client for RLS-protected operations
const getUserClient = (accessToken: string) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error("Missing Supabase configuration");
  }
  
  return createClient(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract access token from request cookies or Authorization header
 */
function getAccessToken(request: NextRequest): string | null {
  // First check Authorization header (most reliable)
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    console.log("[API] Found token in Authorization header (length:", token.length, ")");
    return token;
  }
  
  // Check for Supabase auth cookies
  const cookies = request.cookies.getAll();
  console.log("[API] Available cookies:", cookies.map(c => c.name).join(", "));
  
  // Supabase stores auth tokens in cookies with base64-encoded JSON
  for (const cookie of cookies) {
    if (cookie.name.startsWith('sb-') && cookie.name.includes('auth-token')) {
      console.log("[API] Found Supabase cookie:", cookie.name, "value length:", cookie.value.length);
      try {
        // Decode base64 if needed
        let parsed = cookie.value;
        
        // Check if it looks like base64
        if (cookie.value.length > 100 && !cookie.value.startsWith('{')) {
          try {
            const decoded = Buffer.from(cookie.value, 'base64').toString('utf-8');
            parsed = decoded;
            console.log("[API] Decoded base64 cookie");
          } catch (e) {
            // Not base64, use as-is
          }
        }
        
        // Try parsing as JSON
        const json = JSON.parse(parsed);
        if (json?.access_token) {
          console.log("[API] Extracted access_token from cookie JSON");
          return json.access_token;
        }
      } catch (e) {
        console.log("[API] Failed to parse cookie:", e);
        // Don't use malformed cookie values
      }
    }
  }
  
  console.log("[API] No access token found in request");
  return null;
}

/**
 * Generate a unique file path in storage
 */
function generateFilePath(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${userId}/${timestamp}_${sanitizedName}`;
}

// ============================================================================
// Request Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      console.error("[API] No access token found in request");
      console.error("[API] Cookies:", request.cookies.getAll().map(c => c.name));
      return NextResponse.json(
        { error: "Unauthorized - No access token found. Please log in." },
        { status: 401 }
      );
    }
    
    // Get user from token
    const supabase = getAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.error("[API] Auth error:", authError?.message || "No user found");
      console.error("[API] This usually means the session has expired. User should log out and log back in.");
      return NextResponse.json(
        { error: "Session expired. Please log out and log back in." },
        { status: 401 }
      );
    }
    
    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }
    
    // 3. Validate file
    if (!CONFIG.ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Only PDF files are allowed.` },
        { status: 400 }
      );
    }
    
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > CONFIG.MAX_FILE_SIZE_MB) {
      return NextResponse.json(
        { error: `File too large: ${sizeMB.toFixed(1)}MB exceeds ${CONFIG.MAX_FILE_SIZE_MB}MB limit` },
        { status: 400 }
      );
    }
    
    // 4. Upload to Supabase Storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const filePath = generateFilePath(user.id, file.name);
    
    const { error: uploadError } = await supabase.storage
      .from(CONFIG.STORAGE_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });
    
    if (uploadError) {
      // Check if it's a bucket not found error
      if (uploadError.message.includes("not found")) {
        return NextResponse.json(
          { error: "Storage bucket not configured. Please create a 'documents' bucket in Supabase." },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }
    
    // 5. Create document record
    const documentTitle = title || file.name.replace(/\.pdf$/i, "");
    
    const { data: document, error: insertError } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        file_path: filePath,
        title: documentTitle,
        file_size: file.size,
        mime_type: file.type,
        is_processed: false,
      })
      .select("id")
      .single();
    
    if (insertError) {
      // Clean up uploaded file on failure
      await supabase.storage.from(CONFIG.STORAGE_BUCKET).remove([filePath]);
      
      return NextResponse.json(
        { error: `Failed to create document record: ${insertError.message}` },
        { status: 500 }
      );
    }
    
    // 6. Process document (async but we wait for it)
    // In production, you might want to use a background job queue
    console.log(`[API] Starting document processing for ${document.id}`);
    console.log(`[API] File size: ${(file.size / 1024).toFixed(2)} KB`);
    console.log(`[API] File type: ${file.type}`);
    
    const result = await processDocument(fileBuffer, document.id);
    
    if (!result.success) {
      console.error(`[API] Document processing failed:`, result.error);
      return NextResponse.json(
        { 
          error: "Document processing failed",
          details: result.error,
          documentId: document.id,
        },
        { status: 500 }
      );
    }
    
    console.log(`[API] Document processed successfully: ${result.chunkCount} chunks in ${result.processingTimeMs}ms`);
    
    // 7. Return success response
    return NextResponse.json({
      success: true,
      documentId: document.id,
      title: documentTitle,
      chunkCount: result.chunkCount,
      processingTimeMs: result.processingTimeMs,
    });
    
  } catch (error) {
    console.error("[API] /api/ingest error:", error);
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET: List user's documents
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const supabase = getAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Fetch user's documents
    const { data: documents, error } = await supabase
      .from("documents")
      .select("id, title, file_path, is_processed, processing_error, chunk_count, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch documents: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      {
        documents: documents ?? [],
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
    
  } catch (error) {
    console.error("[API] /api/ingest GET error:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE: Remove a document and its related data
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const supabase = getAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get documentId from query params
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");
    
    if (!documentId) {
      return NextResponse.json(
        { error: "Missing documentId parameter" },
        { status: 400 }
      );
    }
    
    // Fetch document to verify ownership and get file_path
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("id, user_id, file_path")
      .eq("id", documentId)
      .single();
    
    if (fetchError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }
    
    // Verify user owns the document
    if (document.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - you don't own this document" },
        { status: 403 }
      );
    }
    
    // Delete document chunks (will cascade delete via FK)
    const { error: chunksError } = await supabase
      .from("document_chunks")
      .delete()
      .eq("document_id", documentId);
    
    if (chunksError) {
      console.error("[API] Error deleting chunks:", chunksError);
      // Continue anyway - document might not have chunks
    }
    
    // Delete the document record
    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId);
    
    if (deleteError) {
      return NextResponse.json(
        { error: `Failed to delete document: ${deleteError.message}` },
        { status: 500 }
      );
    }
    
    // Delete file from storage
    if (document.file_path) {
      const { error: storageError } = await supabase.storage
        .from(CONFIG.STORAGE_BUCKET)
        .remove([document.file_path]);
      
      if (storageError) {
        console.error("[API] Error deleting file from storage:", storageError);
        // Don't fail the request if storage deletion fails
      }
    }
    
    return NextResponse.json(
      { success: true, message: "Document deleted successfully" },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
    
  } catch (error) {
    console.error("[API] /api/ingest DELETE error:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
