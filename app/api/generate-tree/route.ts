/**
 * Topic Tree Generation API Endpoint
 * 
 * POST /api/generate-tree
 * 
 * Generates a hierarchical topic tree from a document using Gemini AI.
 * Strategy: "Long Context" - sends first 50,000 characters directly to the model.
 * 
 * Why Long Context instead of RAG?
 * - Topic tree generation needs holistic understanding of document structure
 * - RAG would fragment context and miss the overall organization
 * - Gemini 1.5 Flash handles 50k chars (~12k tokens) easily
 * 
 * Request body:
 *   { documentId: string } - UUID of the document to process
 * 
 * Response:
 *   { topicTree: { name: string, children: [...] } }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractDocumentText } from "@/lib/ingest";
import { generateJSONWithRetry } from "@/lib/gemini.safe";

// ============================================================================
// Route Configuration - Increase timeout for long document processing
// ============================================================================

export const maxDuration = 300; // 5 minutes (Vercel Pro)
export const dynamic = 'force-dynamic'; // Disable caching
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Maximum characters to send to Gemini for topic tree generation
  MAX_CONTEXT_LENGTH: 50000,
  
  // Storage bucket name
  STORAGE_BUCKET: "documents",
} as const;

// ============================================================================
// Types
// ============================================================================

interface ConceptNode {
  id: string;
  label: string;
  type: 'root' | 'topic' | 'subtopic' | 'concept';
  description?: string;
  level: number;
}

interface ConceptEdge {
  from: string;
  to: string;
  relationship: 'contains' | 'prerequisite' | 'related' | 'extends';
  label?: string;
}

interface ConceptGraph {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

// Legacy support
interface TopicNode {
  name: string;
  children?: TopicNode[];
}

interface TopicTreeResponse {
  name: string;
  children: TopicNode[];
}

// ============================================================================
// Supabase Client
// ============================================================================

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

// ============================================================================
// Helper Functions
// ============================================================================

function getAccessToken(request: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  
  // Check Supabase auth cookies
  const cookies = request.cookies.getAll();
  for (const cookie of cookies) {
    // Check for any sb- cookie that contains 'auth'
    if (cookie.name.startsWith('sb-') && cookie.name.includes('auth')) {
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

/**
 * Build the prompt for topic tree generation
 * 
 * Why this specific prompt structure?
 * - Clear constraints (max depth 3) prevent overly complex trees
 * - JSON-only output ensures parseable response
 * - Examples guide the model toward desired format
 */
function buildTopicTreePrompt(documentText: string): string {
  return `You are an expert curriculum designer and knowledge graph architect analyzing educational content.

Analyze the following document text and create a CONCISE, HIGH-LEVEL CONCEPT GRAPH.

CRITICAL CONSTRAINTS:
1. MAX 25 NODES TOTAL. Priority is High-Level Structure over detail.
2. Levels:
   - Level 0: Root (1 node)
   - Level 1: Main Topics (3-6 nodes)
   - Level 2: Subtopics (2-4 per topic, ONLY key subtopics)
   - Level 3: DO NOT GENERATE Level 3 nodes yet. Keep it breadth-first.

RULES:
1. Create nodes for: root document, topics, and subtopics only.
2. Each node has: id (unique slug), label (display name), type, and level.
3. Create edges showing relationships: contains, prerequisite, related, extends.
4. Add prerequisite edges when one concept must be learned before another.
5. Keep labels concise (2-5 words).

OUTPUT FORMAT (strict JSON only, no markdown):
{
  "nodes": [
    { "id": "root", "label": "Number Theory Fundamentals", "type": "root", "level": 0 },
    { "id": "divisibility", "label": "Divisibility", "type": "topic", "level": 1 },
    { "id": "gcd", "label": "GCD", "type": "topic", "level": 1 },
    { "id": "div-algo", "label": "Division Algorithm", "type": "subtopic", "level": 2 }
  ],
  "edges": [
    { "from": "root", "to": "divisibility", "relationship": "contains" },
    { "from": "root", "to": "gcd", "relationship": "contains" },
    { "from": "divisibility", "to": "div-algo", "relationship": "contains" },
    { "from": "divisibility", "to": "gcd", "relationship": "prerequisite" }
  ]
}

DOCUMENT TEXT:
---
${documentText}
---

Return ONLY the JSON structure, no additional text or explanation.`;
}

/**
 * Validate the generated concept graph structure
 */
function validateConceptGraph(data: any): data is ConceptGraph {
  if (!data || typeof data !== "object") {
    return false;
  }
  
  // Check nodes array
  if (!Array.isArray(data.nodes) || data.nodes.length === 0) {
    return false;
  }
  
  // Validate each node
  for (const node of data.nodes) {
    if (!node.id || !node.label || !node.type || typeof node.level !== 'number') {
      return false;
    }
    if (!['root', 'topic', 'subtopic', 'concept'].includes(node.type)) {
      return false;
    }
  }
  
  // Check edges array
  if (!Array.isArray(data.edges)) {
    return false;
  }
  
  // Validate each edge
  const nodeIds = new Set(data.nodes.map((n: ConceptNode) => n.id));
  for (const edge of data.edges) {
    if (!edge.from || !edge.to || !edge.relationship) {
      return false;
    }
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      return false;
    }
    if (!['contains', 'prerequisite', 'related', 'extends'].includes(edge.relationship)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Legacy validation for old tree format
 */
function validateTopicTree(tree: unknown): tree is TopicTreeResponse {
  if (!tree || typeof tree !== "object") return false;
  
  const t = tree as Record<string, unknown>;
  if (typeof t.name !== "string" || t.name.length === 0) return false;
  
  if (t.children !== undefined) {
    if (!Array.isArray(t.children)) return false;
    
    for (const child of t.children) {
      if (!validateTopicTree(child)) return false;
    }
  }
  
  return true;
}

/**
 * Clean and normalize the concept graph
 */
function normalizeConceptGraph(graph: ConceptGraph): ConceptGraph {
  return {
    nodes: graph.nodes.map(node => ({
      id: node.id.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      label: node.label.trim(),
      type: node.type,
      level: node.level,
      ...(node.description && { description: node.description.trim() })
    })),
    edges: graph.edges.map(edge => ({
      from: edge.from.trim(),
      to: edge.to.trim(),
      relationship: edge.relationship,
      ...(edge.label && { label: edge.label.trim() })
    }))
  };
}

/**
 * Legacy: Clean and normalize the topic tree
 */
function normalizeTopicTree(node: TopicNode, depth: number = 0): TopicNode {
  const result: TopicNode = {
    name: node.name.trim(),
  };
  
  if (node.children && node.children.length > 0 && depth < 2) {
    result.children = node.children.map(child => 
      normalizeTopicTree(child, depth + 1)
    );
  }
  
  return result;
}

// ============================================================================
// Request Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
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
    
    // 2. Parse request
    const body = await request.json();
    const { documentId } = body;
    
    if (!documentId || typeof documentId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid documentId" },
        { status: 400 }
      );
    }
    
    // 3. Verify document ownership
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, file_path, topic_tree, user_id")
      .eq("id", documentId)
      .single();
    
    if (docError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }
    
    if (document.user_id !== user.id) {
      return NextResponse.json(
        { error: "You don't have access to this document" },
        { status: 403 }
      );
    }
    
    // 4. Check if topic tree already exists
    if (document.topic_tree) {
      return NextResponse.json({
        success: true,
        topicTree: document.topic_tree,
        cached: true,
      });
    }
    
    // 5. Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(CONFIG.STORAGE_BUCKET)
      .download(document.file_path);
    
    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: `Failed to download document: ${downloadError?.message ?? "Unknown error"}` },
        { status: 500 }
      );
    }
    
    // 6. Extract text from PDF
    const fileBuffer = Buffer.from(await fileData.arrayBuffer());
    const documentText = await extractDocumentText(fileBuffer, CONFIG.MAX_CONTEXT_LENGTH);
    
    if (documentText.length < 100) {
      return NextResponse.json(
        { error: "Document contains too little text to generate a topic tree" },
        { status: 400 }
      );
    }
    
    // 7. Generate concept graph using Gemini
    console.log(`[API] Generating concept graph for ${documentText.length} chars...`);
    const startTime = Date.now();
    const prompt = buildTopicTreePrompt(documentText);
    
    let conceptGraph: ConceptGraph;
    try {
      conceptGraph = await generateJSONWithRetry<ConceptGraph>(prompt, {
        model: "gemini-2.5-flash",
      });
      const duration = Date.now() - startTime;
      console.log(`[API] Concept graph generated in ${duration}ms`);
      console.log(`[API] Generated ${conceptGraph.nodes?.length || 0} nodes and ${conceptGraph.edges?.length || 0} edges`);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[API] Concept graph generation failed after ${duration}ms:`, error);
      return NextResponse.json(
        { 
          error: "Failed to generate concept graph",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
    
    // 8. Validate response
    if (!validateConceptGraph(conceptGraph)) {
      console.error("[API] Invalid concept graph structure:", conceptGraph);
      return NextResponse.json(
        { error: "AI generated an invalid concept graph structure" },
        { status: 500 }
      );
    }
    
    // 9. Normalize the graph
    const normalizedGraph = normalizeConceptGraph(conceptGraph);
    
    // 10. Save to database
    console.log(`[API] Saving concept graph to database...`);
    const { error: updateError } = await supabase
      .from("documents")
      .update({ topic_tree: normalizedGraph })
      .eq("id", documentId);
    
    if (updateError) {
      console.error("[API] Failed to save concept graph:", updateError);
      // Return the graph anyway since generation succeeded
    } else {
      console.log(`[API] Concept graph saved successfully`);
    }
    
    console.log(`[API] Returning concept graph with ${normalizedGraph.nodes.length} nodes`);
    return NextResponse.json({
      success: true,
      topicTree: normalizedGraph,
      cached: false,
      stats: {
        nodes: normalizedGraph.nodes.length,
        edges: normalizedGraph.edges.length,
      }
    });
    
  } catch (error) {
    console.error("[API] /api/generate-tree error:", error);
    
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
// GET: Fetch existing topic tree for a document
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const supabase = getAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    
    // Fetch document with topic tree
    const { data: document, error } = await supabase
      .from("documents")
      .select("id, title, topic_tree, user_id")
      .eq("id", documentId)
      .single();
    
    if (error || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    
    if (document.user_id !== user.id) {
      return NextResponse.json(
        { error: "You don't have access to this document" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      {
        documentId: document.id,
        title: document.title,
        topicTree: document.topic_tree,
        hasTopicTree: document.topic_tree !== null,
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
    console.error("[API] /api/generate-tree GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
