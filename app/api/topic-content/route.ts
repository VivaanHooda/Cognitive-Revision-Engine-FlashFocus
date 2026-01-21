/**
 * API Route: Get relevant content for a topic/concept
 * 
 * How it works:
 * 1. Take a topic label from the graph (e.g., "Process Management")
 * 2. Use semantic search to find most relevant chunks
 * 3. Return chunks that can be used for flashcard generation
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase.server";
import { embedWithRetry } from "@/lib/gemini.safe";

// ============================================================================
// Types
// ============================================================================

interface ConceptGraph {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    level: number;
  }>;
  edges: Array<{
    from: string;
    to: string;
    relationship: 'contains' | 'prerequisite' | 'related' | 'extends';
  }>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract parent context to improve search relevance
 */
function extractParentContext(
  topicTree: any,
  topicId: string,
  topicLabel: string
): string | null {
  if (!topicTree?.nodes || !topicTree?.edges) {
    return null;
  }
  
  const graph = topicTree as ConceptGraph;
  const currentNode = graph.nodes.find(
    n => n.id === topicId || n.label === topicLabel
  );
  
  if (!currentNode) {
    return null;
  }
  
  // Find parent nodes
  const parentIds = graph.edges
    .filter(e => e.to === currentNode.id && e.relationship === 'contains')
    .map(e => e.from);
  
  const parents = graph.nodes
    .filter(n => parentIds.includes(n.id))
    .map(n => n.label);
  
  return parents.length > 0 ? parents.join(' > ') : null;
}

function getAccessToken(request: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  
  // Check Supabase auth cookies
  const cookies = request.cookies.getAll();
  for (const cookie of cookies) {
    // Check for any sb- cookie that contains 'auth'
    if (cookie.name.startsWith("sb-") && cookie.name.includes("auth")) {
      try {
        // Try parsing as JSON
        const parsed = JSON.parse(cookie.value);
        if (parsed?.access_token) {
          return parsed.access_token;
        }
      } catch (e) {
        // If not JSON, treat as raw token
        if (cookie.value && cookie.value.length > 20) {
          return cookie.value;
        }
      }
    }
  }
  
  return null;
}

// ============================================================================
// POST: Get content for a topic
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // 2. Parse request
    const body = await request.json();
    const { documentId, topicLabel, topicDescription, topicId, limit = 5 } = body;
    
    if (!documentId || !topicLabel) {
      return NextResponse.json(
        { error: "Missing documentId or topicLabel" },
        { status: 400 }
      );
    }
    
    // 3. Verify document ownership and get topic tree
    const { data: document, error: docError } = await supabaseAdmin
      .from("documents")
      .select("id, user_id, title, topic_tree")
      .eq("id", documentId)
      .single() as { data: any; error: any };
    
    if (docError || !document || document.user_id !== user.id) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    
    // 4. Create enhanced search query from topic with hierarchy context
    let searchQuery = topicDescription 
      ? `${topicLabel}: ${topicDescription}`
      : topicLabel;
    
    // Enhance query with parent context if available
    if (document.topic_tree && topicId) {
      const parentContext = extractParentContext(document.topic_tree, topicId, topicLabel);
      if (parentContext) {
        searchQuery = `${parentContext} > ${searchQuery}`;
      }
    }
    
    console.log(`[API] Searching for content related to: "${searchQuery}"`);
    
    // 5. Generate embedding for the topic
    const embeddingResult = await embedWithRetry(searchQuery);
    const queryEmbedding = embeddingResult.embedding;
    
    // 6. Semantic search: Find most relevant chunks
    const { data: chunks, error: searchError } = await supabaseAdmin.rpc(
      "match_document_chunks",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.5, // Lower threshold for broader matches
        match_count: limit,
        filter_document_id: documentId,
      } as any
    ) as { data: any[] | null; error: any };
    
    if (searchError) {
      console.error("[API] Semantic search error:", searchError);
      return NextResponse.json(
        { error: "Search failed", details: searchError.message },
        { status: 500 }
      );
    }
    
    // 7. Return relevant content
    return NextResponse.json({
      success: true,
      topic: topicLabel,
      chunks: (chunks || []).map((chunk: any) => ({
        id: chunk.id,
        content: chunk.content,
        similarity: chunk.similarity,
        chunkIndex: chunk.chunk_index,
      })),
      documentTitle: document.title,
    });
    
  } catch (error) {
    console.error("[API] /api/topic-content error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
