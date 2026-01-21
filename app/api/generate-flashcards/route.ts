/**
 * API Route: Generate flashcards for a topic/concept
 * 
 * Flow:
 * 1. Get relevant content for the topic (semantic search)
 * 2. Send content + topic to Gemini
 * 3. Generate Q&A flashcards
 * 4. Return structured flashcards
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase.server";
import { embedWithRetry, generateJSONWithRetry } from "@/lib/gemini.safe";

// ============================================================================
// Types
// ============================================================================

interface Flashcard {
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hint?: string;
}

// ============================================================================
// Types
// ============================================================================

interface ConceptGraph {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    level: number;
    description?: string;
  }>;
  edges: Array<{
    from: string;
    to: string;
    relationship: 'contains' | 'prerequisite' | 'related' | 'extends';
    label?: string;
  }>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract topic context from the document's concept graph
 */
async function extractTopicContext(
  supabase: any,
  documentId: string,
  topicId: string,
  topicLabel: string,
  topicDescription?: string
): Promise<TopicContext> {
  // Fetch document with topic tree
  const { data: doc } = await supabase
    .from("documents")
    .select("topic_tree")
    .eq("id", documentId)
    .single();
  
  const context: TopicContext = {
    topic: topicLabel,
    description: topicDescription,
  };
  
  if (!doc?.topic_tree) {
    return context;
  }
  
  const topicTree = doc.topic_tree as ConceptGraph;
  
  if (!topicTree.nodes || !topicTree.edges) {
    return context;
  }
  
  // Find the current node by ID or label
  const currentNode = topicTree.nodes.find(
    n => n.id === topicId || n.label === topicLabel
  );
  
  if (!currentNode) {
    return context;
  }
  
  // Extract parent topics (nodes that contain this node)
  const parentIds = topicTree.edges
    .filter(e => e.to === currentNode.id && e.relationship === 'contains')
    .map(e => e.from);
  
  context.parentTopics = topicTree.nodes
    .filter(n => parentIds.includes(n.id))
    .map(n => n.label);
  
  // Extract sibling topics (nodes with same parent)
  const siblings = topicTree.edges
    .filter(e => parentIds.includes(e.from) && e.to !== currentNode.id && e.relationship === 'contains')
    .map(e => e.to);
  
  context.siblingTopics = topicTree.nodes
    .filter(n => siblings.includes(n.id))
    .map(n => n.label)
    .slice(0, 5); // Limit to 5 siblings
  
  // Extract child topics (nodes contained by this node)
  const childIds = topicTree.edges
    .filter(e => e.from === currentNode.id && e.relationship === 'contains')
    .map(e => e.to);
  
  context.childTopics = topicTree.nodes
    .filter(n => childIds.includes(n.id))
    .map(n => n.label);
  
  return context;
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

interface TopicContext {
  topic: string;
  description?: string;
  parentTopics?: string[];
  siblingTopics?: string[];
  childTopics?: string[];
}

function buildFlashcardPrompt(
  context: TopicContext,
  content: string,
  count: number = 5
): string {
  const hierarchyContext = buildHierarchyContext(context);
  
  return `You are an expert educator creating flashcards for spaced repetition and REVISION purposes.

🎯 CRITICAL: This is for REVISION, not exploration. Questions MUST be strictly limited to the specific topic below.

TARGET TOPIC: ${context.topic}
${context.description ? `DESCRIPTION: ${context.description}\n` : ''}
${hierarchyContext}

RELEVANT CONTENT FROM DOCUMENT:
---
${content}
---

STRICT REQUIREMENTS FOR REVISION:
1. ✅ ONLY create questions directly about "${context.topic}"
2. ❌ DO NOT ask about parent topics (${context.parentTopics?.join(', ') || 'broader concepts'})
3. ❌ DO NOT ask about sibling topics (${context.siblingTopics?.join(', ') || 'related concepts'})
4. ❌ DO NOT ask about child topics (${context.childTopics?.join(', ') || 'subtopics'}) unless they're essential to understanding this topic
5. ✅ Questions must be answerable using ONLY the provided content
6. ✅ Focus on definitions, key concepts, and relationships within "${context.topic}"
7. ✅ Questions should be self-contained (no "this" or "that" references)
8. ✅ Mix difficulty: easy (recall), medium (application), hard (analysis)
9. ✅ Add hints for medium/hard questions
10. ✅ Answers should be 2-4 sentences

BAD EXAMPLE (too broad):
Q: "What are all the components of an operating system?"
❌ This asks about the parent topic, not the specific concept

GOOD EXAMPLE (focused):
Q: "What is the primary purpose of ${context.topic}?"
✅ Directly targets the specific topic for revision

OUTPUT FORMAT (strict JSON only, no markdown):
{
  "flashcards": [
    {
      "question": "What is a process in operating systems?",
      "answer": "A process is a program in execution. It includes the program code, current activity, and allocated resources.",
      "difficulty": "easy",
      "hint": "Think about the difference between a program and its running instance"
    }
  ]
}

Return ONLY the JSON structure, no additional text.`;
}

function buildHierarchyContext(context: TopicContext): string {
  const parts: string[] = [];
  
  if (context.parentTopics && context.parentTopics.length > 0) {
    parts.push(`PARENT CONTEXT: ${context.parentTopics.join(' → ')} → [${context.topic}]`);
  }
  
  if (context.siblingTopics && context.siblingTopics.length > 0) {
    parts.push(`RELATED TOPICS (avoid): ${context.siblingTopics.join(', ')}`);
  }
  
  if (context.childTopics && context.childTopics.length > 0) {
    parts.push(`SUBTOPICS (mention only if essential): ${context.childTopics.join(', ')}`);
  }
  
  return parts.length > 0 ? '\n' + parts.join('\n') + '\n' : '';
}

// ============================================================================
// POST: Generate flashcards for a topic
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const accessToken = getAccessToken(request);
    console.log("[API] /api/generate-flashcards - Token found:", !!accessToken, "Length:", accessToken?.length || 0);
    
    if (!accessToken) {
      console.error("[API] /api/generate-flashcards - No access token found");
      return NextResponse.json({ error: "Unauthorized - No token" }, { status: 401 });
    }
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (authError) {
      console.error("[API] /api/generate-flashcards - Auth error:", authError.message);
      return NextResponse.json({ error: `Unauthorized - ${authError.message}` }, { status: 401 });
    }
    
    if (!user) {
      console.error("[API] /api/generate-flashcards - No user found from token");
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 });
    }
    
    console.log("[API] /api/generate-flashcards - User authenticated:", user.id);
    
    // 2. Parse request
    let body;
    try {
      const text = await request.text();
      console.log("[API] Request body text:", text.substring(0, 200));
      body = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error("[API] Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    
    const { documentId, topicLabel, topicDescription, topicId, cardCount = 5 } = body;
    
    if (!documentId || !topicLabel) {
      console.error("[API] Missing required fields:", { documentId, topicLabel });
      return NextResponse.json(
        { error: "Missing documentId or topicLabel" },
        { status: 400 }
      );
    }
    
    // 3. Verify document ownership
    const { data: document, error: docError } = await supabaseAdmin
      .from("documents")
      .select("id, user_id, title")
      .eq("id", documentId)
      .single();
    
    if (docError || !document || document.user_id !== user.id) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    
    // 4. Get relevant content via semantic search
    const searchQuery = topicDescription 
      ? `${topicLabel}: ${topicDescription}`
      : topicLabel;
    
    console.log(`[API] Finding content for flashcards: "${searchQuery}"`);
    
    const embeddingResult = await embedWithRetry(searchQuery);
    const queryEmbedding = embeddingResult.embedding;
    
    const { data: chunks, error: searchError } = await supabaseAdmin.rpc(
      "match_document_chunks",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.5, // Lower threshold for more results
        match_count: 10, // Get more chunks for better context
        filter_document_id: documentId,
      }
    );
    
    if (searchError || !chunks || chunks.length === 0) {
      console.error("[API] Semantic search error:", searchError);
      return NextResponse.json(
        { error: "No relevant content found for this topic" },
        { status: 404 }
      );
    }
    
    // 5. Combine top chunks into context
    const combinedContent = chunks
      .slice(0, 5) // Top 5 most relevant
      .map((chunk: any) => chunk.content)
      .join("\n\n");
    
    console.log(`[API] Using ${chunks.length} chunks, combined length: ${combinedContent.length}`);
    
    // 6. Extract topic hierarchy from document's topic_tree
    const topicContext = await extractTopicContext(
      supabaseAdmin,
      documentId,
      topicId || topicLabel,
      topicLabel,
      topicDescription
    );
    
    console.log(`[API] Topic context:`, topicContext);
    
    // 7. Generate flashcards with Gemini using full context
    const prompt = buildFlashcardPrompt(topicContext, combinedContent, cardCount);
    
    let result: { flashcards: Flashcard[] };
    try {
      result = await generateJSONWithRetry<{ flashcards: Flashcard[] }>(prompt, {
        model: "gemini-2.5-flash",
      });
    } catch (error) {
      console.error("[API] Flashcard generation failed:", error);
      return NextResponse.json(
        { 
          error: "Failed to generate flashcards",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
    
    // 8. Validate and return
    if (!result.flashcards || result.flashcards.length === 0) {
      return NextResponse.json(
        { error: "No flashcards generated" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      topic: topicLabel,
      flashcards: result.flashcards.map(card => ({
        front: card.question,
        back: card.answer,
        difficulty: card.difficulty,
        hint: card.hint,
      })),
      documentTitle: document.title,
      sourceChunks: chunks.length,
    });
    
  } catch (error) {
    console.error("[API] /api/generate-flashcards error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
