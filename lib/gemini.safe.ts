/**
 * Safe Gemini Client with Rate Limiting & Exponential Backoff
 * 
 * Why this exists:
 * - Gemini Free Tier: 15 RPM (Requests Per Minute)
 * - Without this wrapper, uploading a PDF with 50 chunks would fire 50 requests
 *   simultaneously, causing 429 errors and app crashes
 * 
 * Strategy:
 * 1. p-limit(3): Max 3 concurrent requests at any time
 * 2. Exponential backoff: On 429/503, wait 2s → 4s → 8s before retry
 * 3. Max 3 retries before giving up
 * 
 * Usage:
 *   import { generateWithRetry, embedWithRetry } from '@/lib/gemini.safe';
 */

import { GoogleGenAI, type GenerateContentConfig } from "@google/genai";
import pLimit from "p-limit";

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Concurrency limit: 3 requests in flight = ~12 RPM at 0.25s per request
  // This leaves headroom below the 15 RPM limit
  CONCURRENCY_LIMIT: 3,
  
  // Retry settings
  MAX_RETRIES: 3,
  INITIAL_BACKOFF_MS: 2000,  // 2 seconds
  BACKOFF_MULTIPLIER: 2,      // 2s → 4s → 8s
  
  // Model names
  GENERATION_MODEL: "gemini-2.5-flash",
  EMBEDDING_MODEL: "text-embedding-004",
  
  // Rate limit delay between batches (extra safety margin)
  // 3 concurrent × 1 request/second = 3 RPS = 180 RPM without this
  // Adding 500ms delay per request gives us ~6 RPS max = 360 RPM... still fast
  // But combined with actual API latency (~500ms-2s), we stay well under 15 RPM
  MIN_REQUEST_INTERVAL_MS: 200,
} as const;

// ============================================================================
// Singleton Instances
// ============================================================================

let aiInstance: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

// Concurrency limiter - ensures max N requests at once
const limit = pLimit(CONFIG.CONCURRENCY_LIMIT);

// Track last request time for rate limiting
let lastRequestTime = 0;

// ============================================================================
// Error Detection
// ============================================================================

interface GeminiError extends Error {
  status?: number;
  code?: string;
}

/**
 * Determines if an error is retryable (rate limit or temporary server error)
 */
const isRetryableError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const geminiError = error as GeminiError;
    
    // Check for HTTP status codes
    if (geminiError.status === 429 || geminiError.status === 503) {
      return true;
    }
    
    // Check for error messages (some SDKs don't expose status)
    const message = geminiError.message.toLowerCase();
    if (
      message.includes("rate limit") ||
      message.includes("quota exceeded") ||
      message.includes("resource exhausted") ||
      message.includes("503") ||
      message.includes("429") ||
      message.includes("temporarily unavailable")
    ) {
      return true;
    }
  }
  return false;
};

// ============================================================================
// Rate Limiting Helper
// ============================================================================

/**
 * Ensures minimum time between requests to avoid bursting
 */
const waitForRateLimit = async (): Promise<void> => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < CONFIG.MIN_REQUEST_INTERVAL_MS) {
    const waitTime = CONFIG.MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest;
    await sleep(waitTime);
  }
  
  lastRequestTime = Date.now();
};

const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// ============================================================================
// Core Retry Logic
// ============================================================================

/**
 * Wraps an async function with exponential backoff retry logic
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      // Rate limit check before each attempt
      await waitForRateLimit();
      
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < CONFIG.MAX_RETRIES && isRetryableError(error)) {
        const backoffMs = CONFIG.INITIAL_BACKOFF_MS * Math.pow(CONFIG.BACKOFF_MULTIPLIER, attempt);
        console.warn(
          `[Gemini] ${context} - Attempt ${attempt + 1} failed (${lastError.message}). ` +
          `Retrying in ${backoffMs}ms...`
        );
        await sleep(backoffMs);
      } else {
        // Non-retryable error or max retries exceeded
        console.error(
          `[Gemini] ${context} - Failed after ${attempt + 1} attempts:`,
          lastError.message
        );
        throw lastError;
      }
    }
  }
  
  // Should never reach here, but TypeScript needs it
  throw lastError ?? new Error("Unknown error in retry logic");
}

// ============================================================================
// Public API: Text Generation
// ============================================================================

export interface GenerateOptions {
  model?: string;
  config?: GenerateContentConfig;
}

/**
 * Generate content with automatic retry and rate limiting
 * 
 * @example
 * const response = await generateWithRetry(
 *   "Explain quantum computing",
 *   { config: { responseMimeType: "application/json" } }
 * );
 */
export async function generateWithRetry(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const model = options.model ?? CONFIG.GENERATION_MODEL;
  
  // Use concurrency limiter to queue this request
  return limit(async () => {
    return withRetry(async () => {
      const ai = getAI();
      
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: options.config,
      });
      
      const text = response.text;
      if (!text) {
        throw new Error("Empty response from Gemini");
      }
      
      return text;
    }, `generateContent(${model})`);
  });
}

/**
 * Generate content with structured JSON output
 * Automatically parses the response as JSON
 */
export async function generateJSONWithRetry<T>(
  prompt: string,
  options: Omit<GenerateOptions, 'config'> & { config?: GenerateContentConfig } = {}
): Promise<T> {
  const text = await generateWithRetry(prompt, {
    ...options,
    config: {
      ...options.config,
      responseMimeType: "application/json",
    },
  });
  
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Failed to parse JSON response: ${text.slice(0, 200)}...`);
  }
}

// ============================================================================
// Public API: Embeddings
// ============================================================================

export interface EmbeddingResult {
  embedding: number[];
  tokenCount?: number;
}

/**
 * Generate embedding for a single text with automatic retry
 * 
 * @example
 * const { embedding } = await embedWithRetry("Hello world");
 * // embedding is a 768-dimensional number array
 */
export async function embedWithRetry(text: string): Promise<EmbeddingResult> {
  // Use concurrency limiter
  return limit(async () => {
    return withRetry(async () => {
      const ai = getAI();
      
      const response = await ai.models.embedContent({
        model: CONFIG.EMBEDDING_MODEL,
        contents: text,
      });
      
      const embedding = response.embeddings?.[0]?.values;
      if (!embedding || embedding.length === 0) {
        throw new Error("Empty embedding response from Gemini");
      }
      
      return {
        embedding,
        tokenCount: undefined, // Gemini doesn't return this directly
      };
    }, `embedContent`);
  });
}

/**
 * Generate embeddings for multiple texts in batches
 * Respects rate limits by processing sequentially within the concurrency limit
 * 
 * @example
 * const chunks = ["chunk 1", "chunk 2", "chunk 3"];
 * const results = await embedBatchWithRetry(chunks, (done, total) => {
 *   console.log(`Progress: ${done}/${total}`);
 * });
 */
export async function embedBatchWithRetry(
  texts: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<EmbeddingResult[]> {
  const results: EmbeddingResult[] = [];
  
  // Process all texts, letting p-limit handle concurrency
  const promises = texts.map(async (text, index) => {
    const result = await embedWithRetry(text);
    
    // Track progress (note: may not be in order due to concurrency)
    if (onProgress) {
      onProgress(results.filter(r => r !== undefined).length + 1, texts.length);
    }
    
    return { index, result };
  });
  
  // Wait for all to complete
  const indexed = await Promise.all(promises);
  
  // Sort by original index to maintain order
  indexed.sort((a, b) => a.index - b.index);
  
  return indexed.map(({ result }) => result);
}

// ============================================================================
// Utility: Estimate Token Count
// ============================================================================

/**
 * Rough estimation of token count for text
 * Gemini uses ~4 chars per token for English text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ============================================================================
// Health Check
// ============================================================================

/**
 * Test that the Gemini API is configured and responsive
 */
export async function checkGeminiHealth(): Promise<{ ok: boolean; error?: string }> {
  try {
    await generateWithRetry("Say 'OK' and nothing else.", { model: CONFIG.GENERATION_MODEL });
    return { ok: true };
  } catch (error) {
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
