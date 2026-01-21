"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2, Download, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase.client";

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

interface Document {
  id: string;
  title: string;
  topic_tree?: ConceptGraph;
}

// ============================================================================
// Full Screen Graph Page
// ============================================================================

export default function GraphPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;
  
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [generatingFlashcards, setGeneratingFlashcards] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<Array<{question: string; answer: string; difficulty?: string; hint?: string}> | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const svgRef = React.useRef<SVGSVGElement>(null);

  // Fetch document data
  useEffect(() => {
    async function fetchDocument() {
      try {
        // Get Supabase access token for authentication
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/generate-tree?documentId=${documentId}`, {
          headers,
          credentials: "include",
        });
        
        if (!response.ok) throw new Error('Failed to load document');
        const data = await response.json();
        
        console.log('📊 API Response:', data);
        console.log('📊 Topic Tree:', data.topicTree);
        console.log('📊 Nodes count:', data.topicTree?.nodes?.length);
        console.log('📊 Edges count:', data.topicTree?.edges?.length);
        console.log('📊 Edges:', data.topicTree?.edges);
        
        // Check if graph exists
        if (!data.topicTree) {
          setError('This document does not have a knowledge graph yet. Please generate it first from the Documents page.');
          setLoading(false);
          return;
        }
        
        setDocument({
          id: data.documentId,
          title: data.title,
          topic_tree: data.topicTree,
        });
        
        // Auto-expand only root (shows root + its direct children = 2 levels)
        if (data.topicTree?.nodes) {
          const rootNode = data.topicTree.nodes.find((n: ConceptNode) => n.level === 0);
          setExpandedNodes(new Set(rootNode ? [rootNode.id] : []));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    fetchDocument();
  }, [documentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-indigo-600" size={48} />
          <p className="text-gray-600">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  if (error || !document?.topic_tree) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {error ? 'Error Loading Graph' : 'No Graph Available'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'This document does not have a knowledge graph yet.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
            >
              Go Back
            </button>
            <a
              href="/"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Go to Documents
            </a>
          </div>
        </div>
      </div>
    );
  }

  const graph = document.topic_tree;

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        // Collapse: remove this node and all its descendants
        const toCollapse = getDescendants(nodeId, graph);
        toCollapse.forEach(id => next.delete(id));
        next.delete(nodeId);
      } else {
        // Expand: add this node
        next.add(nodeId);
      }
      return next;
    });
  };

  // Get all descendant node IDs
  const getDescendants = (nodeId: string, graph: ConceptGraph): string[] => {
    // Normalize to underscore format to match edge IDs
    const normalizedNodeId = nodeId.replace(/-/g, '_');
    const children = graph.edges
      .filter(e => e.from === normalizedNodeId && e.relationship === 'contains')
      .map(e => e.to.replace(/_/g, '-')); // Convert back to hyphen format
    
    const descendants: string[] = [];
    children.forEach(childId => {
      descendants.push(childId);
      descendants.push(...getDescendants(childId, graph));
    });
    
    return descendants;
  };

  // Get visible nodes (expanded nodes and their direct children)
  const getVisibleNodes = () => {
    const visible = new Set<string>();
    
    // Add all expanded nodes
    expandedNodes.forEach(nodeId => visible.add(nodeId));
    
    // Add direct children of expanded nodes
    expandedNodes.forEach(nodeId => {
      const normalizedNodeId = nodeId.replace(/-/g, '_');
      graph.edges
        .filter(e => e.from === normalizedNodeId && e.relationship === 'contains')
        .forEach(e => visible.add(e.to.replace(/_/g, '-'))); // Convert to hyphen format
    });
    
    const visibleNodes = graph.nodes.filter(n => visible.has(n.id));
    return visibleNodes;
  };

  // Calculate layout positions
  const calculateLayout = () => {
    const visibleNodes = getVisibleNodes();
    const positions: Record<string, { x: number; y: number }> = {};
    const width = 1400;
    const height = 800;
    
    // Group by level
    const nodesByLevel: Record<number, ConceptNode[]> = {};
    visibleNodes.forEach(node => {
      if (!nodesByLevel[node.level]) nodesByLevel[node.level] = [];
      nodesByLevel[node.level].push(node);
    });
    
    const levels = Object.keys(nodesByLevel).map(Number).sort((a, b) => a - b);
    const levelHeight = height / (levels.length + 1);
    
    levels.forEach((level, levelIdx) => {
      const nodesAtLevel = nodesByLevel[level];
      const levelWidth = width / (nodesAtLevel.length + 1);
      
      nodesAtLevel.forEach((node, idx) => {
        positions[node.id] = {
          x: levelWidth * (idx + 1),
          y: levelHeight * (levelIdx + 1),
        };
      });
    });
    
    return positions;
  };

  const visibleNodes = getVisibleNodes();
  const positions = calculateLayout();
  
  // Get visible edges (only between visible nodes)
  // IMPORTANT: Normalize IDs to handle hyphen/underscore mismatch
  const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
  const normalizedNodeIds = new Set(
    visibleNodes.map(n => n.id.replace(/-/g, '_'))
  );
  
  const visibleEdges = graph.edges.filter(e => {
    // Check both original and normalized formats
    const hasFrom = visibleNodeIds.has(e.from) || normalizedNodeIds.has(e.from);
    const hasTo = visibleNodeIds.has(e.to) || normalizedNodeIds.has(e.to);
    return hasFrom && hasTo;
  });
  
  console.log('🔍 Total nodes:', graph.nodes.length);
  console.log('🔍 Total edges:', graph.edges.length);
  console.log('🔍 Visible nodes:', visibleNodes.length);
  console.log('🔍 Visible node IDs:', Array.from(visibleNodeIds));
  console.log('🔍 Normalized node IDs:', Array.from(normalizedNodeIds));
  console.log('🔍 Visible edges:', visibleEdges.length);
  console.log('🔍 All edges:', graph.edges);
  console.log('🔍 Visible edges detail:', visibleEdges);

  // Check if node has children
  const hasChildren = (nodeId: string) => {
    const normalizedNodeId = nodeId.replace(/-/g, '_');
    return graph.edges.some(e => e.from === normalizedNodeId && e.relationship === 'contains');
  };

  // Generate flashcards from node
  const handleGenerateFlashcards = async (node: ConceptNode) => {
    setGeneratingFlashcards(node.id);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/generate-flashcards', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentId: documentId,
          topicLabel: node.label,
          topicDescription: node.description || node.label,
          cardCount: 8
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate flashcards');
      const data = await response.json();
      
      if (data.flashcards && data.flashcards.length > 0) {
        setFlashcards(data.flashcards);
        setCurrentCardIndex(0);
        setIsFlipped(false);
      } else {
        alert('⚠️ No flashcards generated. Try selecting a different topic.');
      }
    } catch (err) {
      alert('❌ Failed to generate flashcards. Please try again.');
      console.error('Flashcard generation error:', err);
    } finally {
      setGeneratingFlashcards(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{document.title}</h1>
              <p className="text-sm text-gray-500">
                {visibleNodes.length} of {graph.nodes.length} nodes visible · {visibleEdges.length} connections
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!selectedNode) {
                  alert('Please select a node first by clicking on it in the graph.');
                  return;
                }
                const node = graph.nodes.find(n => n.id === selectedNode);
                if (node) handleGenerateFlashcards(node);
              }}
              disabled={generatingFlashcards !== null}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
              title="Generate flashcards for selected topic"
            >
              {generatingFlashcards ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>🎴</span>
                  <span>Generate Flashcards</span>
                </>
              )}
            </button>
            <div className="w-px h-6 bg-gray-300 mx-2"></div>
            <button
              onClick={() => {
                const allNodeIds = graph.nodes.map(n => n.id);
                setExpandedNodes(new Set(allNodeIds));
              }}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              title="Expand All Nodes"
            >
              Expand All
            </button>
            <button
              onClick={() => {
                const rootNode = graph.nodes.find(n => n.type === 'root');
                setExpandedNodes(new Set(rootNode ? [rootNode.id] : []));
              }}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              title="Collapse All Nodes"
            >
              Collapse All
            </button>
            <div className="w-px h-6 bg-gray-300 mx-2"></div>
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={20} className="text-gray-600" />
            </button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={20} className="text-gray-600" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Reset Zoom"
            >
              <Maximize2 size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Graph Canvas */}
      <div className="h-[calc(100vh-88px)] overflow-auto p-8">
        <div className="max-w-screen-2xl mx-auto">
          <svg
            ref={svgRef}
            viewBox="0 0 1400 800"
            className="w-full bg-white rounded-2xl shadow-lg border border-gray-200"
            style={{ 
              height: '800px',
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s'
            }}
          >
            {/* Define arrow markers for edges */}
            <defs>
              {/* Gradients for nodes */}
              <radialGradient id="gradient-root" cx="30%" cy="30%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#4f46e5" />
              </radialGradient>
              <radialGradient id="gradient-topic" cx="30%" cy="30%">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#7c3aed" />
              </radialGradient>
              <radialGradient id="gradient-subtopic" cx="30%" cy="30%">
                <stop offset="0%" stopColor="#93c5fd" />
                <stop offset="100%" stopColor="#3b82f6" />
              </radialGradient>
              <radialGradient id="gradient-concept" cx="30%" cy="30%">
                <stop offset="0%" stopColor="#f3f4f6" />
                <stop offset="100%" stopColor="#d1d5db" />
              </radialGradient>
              
              {/* Arrow markers */}
              <marker
                id="arrow-contains"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#9ca3af" />
              </marker>
              <marker
                id="arrow-prerequisite"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#f59e0b" />
              </marker>
              <marker
                id="arrow-related"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
              </marker>
              <marker
                id="arrow-extends"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#a855f7" />
              </marker>
              
              {/* Glow filters */}
              <filter id="glow-selected">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Render edges */}
            {visibleEdges.map((edge, idx) => {
              // Normalize edge IDs to match node IDs (replace underscores with hyphens)
              const fromId = edge.from.replace(/_/g, '-');
              const toId = edge.to.replace(/_/g, '-');
              const fromPos = positions[fromId];
              const toPos = positions[toId];
              if (!fromPos || !toPos) return null;

              const colors: Record<string, string> = {
                contains: '#9ca3af',
                prerequisite: '#f59e0b',
                related: '#3b82f6',
                extends: '#a855f7',
              };

              const isHighlighted = selectedNode === fromId || selectedNode === toId;

              return (
                <g key={idx}>
                  {/* Shadow line for depth */}
                  <line
                    x1={fromPos.x}
                    y1={fromPos.y}
                    x2={toPos.x}
                    y2={toPos.y}
                    stroke="black"
                    strokeWidth={isHighlighted ? 4 : 3}
                    strokeOpacity={0.1}
                    transform="translate(2, 2)"
                  />
                  {/* Main line */}
                  <line
                    x1={fromPos.x}
                    y1={fromPos.y}
                    x2={toPos.x}
                    y2={toPos.y}
                    stroke={colors[edge.relationship]}
                    strokeWidth={isHighlighted ? 4 : 2.5}
                    strokeOpacity={isHighlighted ? 1 : 0.5}
                    markerEnd={`url(#arrow-${edge.relationship})`}
                    className="transition-all duration-300"
                    style={{
                      strokeDasharray: edge.relationship === 'related' ? '5,5' : 'none'
                    }}
                  />
                </g>
              );
            })}

            {/* Render nodes */}
            {visibleNodes.map((node) => {
              const pos = positions[node.id];
              if (!pos) return null;

              const isExpanded = expandedNodes.has(node.id);
              const isSelected = selectedNode === node.id;
              const nodeHasChildren = hasChildren(node.id);

              const colors = {
                root: { fill: 'url(#gradient-root)', stroke: '#4f46e5', text: '#ffffff' },
                topic: { fill: 'url(#gradient-topic)', stroke: '#7c3aed', text: '#ffffff' },
                subtopic: { fill: 'url(#gradient-subtopic)', stroke: '#3b82f6', text: '#ffffff' },
                concept: { fill: 'url(#gradient-concept)', stroke: '#9ca3af', text: '#1f2937' },
              };

              const color = colors[node.type];
              const radius = node.type === 'root' ? 60 : node.type === 'topic' ? 50 : 40;

              // Wrap text to fit in circle
              const wrapText = (text: string, maxWidth: number) => {
                const words = text.split(' ');
                const lines: string[] = [];
                let currentLine = '';

                words.forEach(word => {
                  const testLine = currentLine ? `${currentLine} ${word}` : word;
                  // Rough estimate: 7px per character
                  if (testLine.length * 7 > maxWidth) {
                    if (currentLine) lines.push(currentLine);
                    currentLine = word;
                  } else {
                    currentLine = testLine;
                  }
                });
                
                if (currentLine) lines.push(currentLine);
                return lines.slice(0, 2); // Max 2 lines
              };

              const textLines = wrapText(node.label, radius * 1.4);

              return (
                <g key={node.id}>
                  {/* Node circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius}
                    fill={color.fill}
                    stroke={color.stroke}
                    strokeWidth={isSelected ? 4 : 2}
                    className="cursor-pointer transition-all duration-300 hover:opacity-90"
                    onClick={(e) => {
                      setSelectedNode(isSelected ? null : node.id);
                      // Only toggle if not root and has children
                      if (nodeHasChildren && node.type !== 'root') {
                        toggleNode(node.id);
                      }
                    }}
                    style={{
                      filter: isSelected ? 'drop-shadow(0 10px 20px rgba(99, 102, 241, 0.4))' : 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
                    }}
                  />

                  {/* Expand/Collapse indicator - NOT for root node */}
                  {nodeHasChildren && node.type !== 'root' && (
                    <g>
                      <circle
                        cx={pos.x + radius - 10}
                        cy={pos.y - radius + 10}
                        r="12"
                        fill="white"
                        stroke={color.stroke}
                        strokeWidth="2"
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNode(node.id);
                        }}
                      />
                      <text
                        x={pos.x + radius - 10}
                        y={pos.y - radius + 10}
                        fill={color.stroke}
                        fontSize="16"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="pointer-events-none select-none"
                      >
                        {isExpanded ? '−' : '+'}
                      </text>
                    </g>
                  )}

                  {/* Node label with multi-line support */}
                  <text
                    x={pos.x}
                    y={pos.y}
                    fill={color.text}
                    fontSize={node.type === 'root' ? 14 : node.type === 'topic' ? 12 : 10}
                    fontWeight={node.type === 'root' ? 'bold' : 'normal'}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none select-none"
                  >
                    {textLines.map((line, i) => (
                      <tspan
                        key={i}
                        x={pos.x}
                        dy={i === 0 ? 0 : (node.type === 'root' ? 16 : node.type === 'topic' ? 14 : 12)}
                      >
                        {line}
                      </tspan>
                    ))}
                  </text>

                  {/* Selection ring */}
                  {isSelected && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius + 8}
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth={3}
                      strokeDasharray="4 4"
                      opacity={0.8}
                      filter="url(#glow-selected)"
                    >
                      <animate
                        attributeName="r"
                        from={radius + 8}
                        to={radius + 12}
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        from="0.8"
                        to="0.3"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-gray-400"></div>
              <span>Contains</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-amber-500"></div>
              <span>Prerequisite</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-500"></div>
              <span>Related</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-purple-500"></div>
              <span>Extends</span>
            </div>
            <div className="ml-4 text-gray-500">
              Select a node · Click "Generate Flashcards" button · + to expand
            </div>
          </div>
        </div>
      </div>

      {/* Flashcard Viewer Modal */}
      {flashcards && flashcards.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Generated Flashcards</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Card {currentCardIndex + 1} of {flashcards.length}
                </p>
              </div>
              <button
                onClick={() => {
                  setFlashcards(null);
                  setCurrentCardIndex(0);
                  setIsFlipped(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl text-gray-600">×</span>
              </button>
            </div>

            {/* Flashcard */}
            <div 
              className="relative bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-8 min-h-[300px] flex items-center justify-center cursor-pointer border-2 border-indigo-200 hover:border-indigo-300 transition-all"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className="text-center">
                {!isFlipped ? (
                  <>
                    <div className="text-sm font-semibold text-indigo-600 mb-4">QUESTION</div>
                    <p className="text-xl text-gray-900 leading-relaxed">
                      {flashcards[currentCardIndex].question}
                    </p>
                    {flashcards[currentCardIndex].hint && (
                      <div className="mt-6 p-4 bg-white bg-opacity-60 rounded-lg">
                        <p className="text-sm text-gray-600">
                          💡 <span className="font-medium">Hint:</span> {flashcards[currentCardIndex].hint}
                        </p>
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-6">Click to reveal answer</p>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-semibold text-purple-600 mb-4">ANSWER</div>
                    <p className="text-lg text-gray-900 leading-relaxed whitespace-pre-wrap">
                      {flashcards[currentCardIndex].answer}
                    </p>
                    {flashcards[currentCardIndex].difficulty && (
                      <div className="mt-6">
                        <span className="inline-block px-3 py-1 bg-white bg-opacity-60 rounded-full text-sm text-gray-700">
                          Difficulty: {flashcards[currentCardIndex].difficulty}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => {
                  setCurrentCardIndex(Math.max(0, currentCardIndex - 1));
                  setIsFlipped(false);
                }}
                disabled={currentCardIndex === 0}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg transition-colors font-medium"
              >
                ← Previous
              </button>
              
              <div className="flex gap-2">
                {flashcards.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentCardIndex(idx);
                      setIsFlipped(false);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentCardIndex 
                        ? 'bg-indigo-600 w-8' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => {
                  setCurrentCardIndex(Math.min(flashcards.length - 1, currentCardIndex + 1));
                  setIsFlipped(false);
                }}
                disabled={currentCardIndex === flashcards.length - 1}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg transition-colors font-medium"
              >
                Next →
              </button>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200 flex justify-center">
              <p className="text-sm text-gray-600">
                ✅ Flashcards saved! Go to <a href="/" className="text-indigo-600 hover:text-indigo-700 font-medium">Study page</a> to review with spaced repetition.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
