"use client";

import React, { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase.client";
import {
  FileText,
  Upload,
  Loader2,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Sparkles,
  X,
  AlertCircle,
  CheckCircle2,
  FolderTree,
  Clock,
  Trash2,
  RefreshCw,
} from "lucide-react";

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

interface Document {
  id: string;
  title: string;
  file_path: string;
  is_processed: boolean;
  processing_error?: string;
  chunk_count: number;
  created_at: string;
  topic_tree?: ConceptGraph | TopicNode; // Can be graph or legacy tree
}

interface DocumentsViewProps {
  userId: string;
  onStudyDocument?: (documentId: string, documentTitle: string) => void;
}

// ============================================================================
// Concept Graph Component (New)
// ============================================================================

const relationshipColors = {
  contains: "text-gray-400",
  prerequisite: "text-amber-500",
  related: "text-blue-500",
  extends: "text-purple-500",
};

const relationshipIcons = {
  contains: "→",
  prerequisite: "⚡",
  related: "⟷",
  extends: "↗",
};

interface GraphNodeProps {
  node: ConceptNode;
  edges: ConceptEdge[];
  allNodes: ConceptNode[];
  onNodeClick: (nodeId: string) => void;
  selectedNode: string | null;
}

const GraphNode: React.FC<GraphNodeProps> = ({ node, edges, allNodes, onNodeClick, selectedNode }) => {
  const isSelected = selectedNode === node.id;
  const outgoingEdges = edges.filter(e => e.from === node.id);
  const incomingEdges = edges.filter(e => e.to === node.id);
  
  const typeStyles = {
    root: "bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-indigo-300 shadow-lg scale-110",
    topic: "bg-gradient-to-br from-violet-100 to-purple-100 text-gray-900 border-violet-300",
    subtopic: "bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-800 border-blue-200",
    concept: "bg-white text-gray-700 border-gray-300",
  };

  return (
    <div className={`relative transition-all duration-200 ${isSelected ? 'z-10' : 'z-0'}`}>
      {/* Node */}
      <div
        onClick={() => onNodeClick(node.id)}
        className={`
          px-4 py-3 rounded-xl border-2 cursor-pointer transition-all duration-200
          ${typeStyles[node.type]}
          ${isSelected ? 'ring-4 ring-indigo-200 shadow-xl scale-105' : 'hover:shadow-md hover:scale-102'}
        `}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-60 uppercase tracking-wide">{node.type}</span>
        </div>
        <div className="font-semibold mt-1">{node.label}</div>
        {node.description && (
          <div className="text-xs opacity-75 mt-1">{node.description}</div>
        )}
      </div>

      {/* Connection Count Badges */}
      {(outgoingEdges.length > 0 || incomingEdges.length > 0) && (
        <div className="absolute -top-2 -right-2 flex gap-1">
          {outgoingEdges.length > 0 && (
            <span className="bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow">
              {outgoingEdges.length}
            </span>
          )}
        </div>
      )}

      {/* Outgoing Edges (shown when selected) */}
      {isSelected && outgoingEdges.length > 0 && (
        <div className="mt-3 space-y-1.5 animate-fade-in">
          {outgoingEdges.map((edge, idx) => {
            const targetNode = allNodes.find(n => n.id === edge.to);
            if (!targetNode) return null;
            
            return (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  onNodeClick(edge.to);
                }}
                className="flex items-center gap-2 text-sm pl-4 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border-l-2 border-gray-200"
              >
                <span className={`text-lg ${relationshipColors[edge.relationship]}`}>
                  {relationshipIcons[edge.relationship]}
                </span>
                <span className="text-xs font-medium text-gray-500 uppercase">
                  {edge.relationship}
                </span>
                {edge.label && (
                  <span className="text-xs italic text-gray-400">
                    ({edge.label})
                  </span>
                )}
                <span className="text-gray-700 font-medium">→ {targetNode.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface ConceptGraphViewProps {
  graph: ConceptGraph;
}

const ConceptGraphView: React.FC<ConceptGraphViewProps> = ({ graph }) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'hierarchy' | 'list'>('graph');
  const svgRef = React.useRef<SVGSVGElement>(null);

  // Calculate positions for force-directed layout
  const calculateLayout = React.useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const width = 1000;
    const height = 600;
    
    // Group nodes by level for hierarchical layout
    const nodesByLevel = graph.nodes.reduce((acc, node) => {
      if (!acc[node.level]) acc[node.level] = [];
      acc[node.level].push(node);
      return acc;
    }, {} as Record<number, ConceptNode[]>);
    
    const levels = Object.keys(nodesByLevel).map(Number).sort((a, b) => a - b);
    const levelHeight = height / (levels.length + 1);
    
    // Position nodes in a hierarchical layout
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
  }, [graph]);

  // Group nodes by level for hierarchy view
  const nodesByLevel = graph.nodes.reduce((acc, node) => {
    if (!acc[node.level]) acc[node.level] = [];
    acc[node.level].push(node);
    return acc;
  }, {} as Record<number, ConceptNode[]>);

  const levels = Object.keys(nodesByLevel).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('graph')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'graph'
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🕸️ Network Graph
          </button>
          <button
            onClick={() => setViewMode('hierarchy')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'hierarchy'
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📊 Hierarchy
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📋 List
          </button>
        </div>
        <div className="text-sm text-gray-500">
          {graph.nodes.length} nodes · {graph.edges.length} connections
        </div>
      </div>

      {/* Graph Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-amber-500">⚡</span>
          <span className="text-gray-600">Prerequisite</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-blue-500">⟷</span>
          <span className="text-gray-600">Related</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-purple-500">↗</span>
          <span className="text-gray-600">Extends</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400">→</span>
          <span className="text-gray-600">Contains</span>
        </div>
      </div>

      {/* Network Graph View - ACTUAL VISUAL GRAPH */}
      {viewMode === 'graph' && (
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          <svg
            ref={svgRef}
            viewBox="0 0 1000 600"
            className="w-full h-[600px]"
            style={{ background: 'linear-gradient(to bottom, #f9fafb, #ffffff)' }}
          >
            {/* Define arrow markers for edges */}
            <defs>
              <marker
                id="arrowhead-contains"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#9ca3af" />
              </marker>
              <marker
                id="arrowhead-prerequisite"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#f59e0b" />
              </marker>
              <marker
                id="arrowhead-related"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
              </marker>
              <marker
                id="arrowhead-extends"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#a855f7" />
              </marker>
            </defs>

            {/* Render edges (connections) */}
            {graph.edges.map((edge, idx) => {
              const fromPos = calculateLayout[edge.from];
              const toPos = calculateLayout[edge.to];
              if (!fromPos || !toPos) return null;

              const edgeColors = {
                contains: '#9ca3af',
                prerequisite: '#f59e0b',
                related: '#3b82f6',
                extends: '#a855f7',
              };

              const isHighlighted = selectedNode === edge.from || selectedNode === edge.to;

              return (
                <g key={idx}>
                  <line
                    x1={fromPos.x}
                    y1={fromPos.y}
                    x2={toPos.x}
                    y2={toPos.y}
                    stroke={edgeColors[edge.relationship]}
                    strokeWidth={isHighlighted ? 3 : 2}
                    strokeOpacity={isHighlighted ? 1 : 0.6}
                    markerEnd={`url(#arrowhead-${edge.relationship})`}
                  />
                  {edge.label && isHighlighted && (
                    <text
                      x={(fromPos.x + toPos.x) / 2}
                      y={(fromPos.y + toPos.y) / 2}
                      fill={edgeColors[edge.relationship]}
                      fontSize="10"
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Render nodes */}
            {graph.nodes.map((node) => {
              const pos = calculateLayout[node.id];
              if (!pos) return null;

              const isSelected = selectedNode === node.id;
              const nodeColors = {
                root: { fill: '#6366f1', stroke: '#4f46e5', text: '#ffffff' },
                topic: { fill: '#a78bfa', stroke: '#8b5cf6', text: '#ffffff' },
                subtopic: { fill: '#93c5fd', stroke: '#3b82f6', text: '#1e3a8a' },
                concept: { fill: '#ffffff', stroke: '#d1d5db', text: '#374151' },
              };

              const colors = nodeColors[node.type];
              const radius = node.type === 'root' ? 50 : node.type === 'topic' ? 40 : 35;

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNode(isSelected ? null : node.id)}
                  className="cursor-pointer"
                  style={{ transition: 'all 0.3s' }}
                >
                  {/* Node circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius}
                    fill={colors.fill}
                    stroke={colors.stroke}
                    strokeWidth={isSelected ? 4 : 2}
                    opacity={isSelected ? 1 : 0.9}
                  />
                  
                  {/* Node label */}
                  <text
                    x={pos.x}
                    y={pos.y}
                    fill={colors.text}
                    fontSize={node.type === 'root' ? 14 : 11}
                    fontWeight={node.type === 'root' ? 'bold' : 'normal'}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none select-none"
                  >
                    {node.label.length > 20 ? node.label.substring(0, 20) + '...' : node.label}
                  </text>

                  {/* Selection ring */}
                  {isSelected && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius + 5}
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      opacity={0.6}
                    >
                      <animate
                        attributeName="r"
                        from={radius + 5}
                        to={radius + 10}
                        dur="1s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Selected node info */}
          {selectedNode && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              {(() => {
                const node = graph.nodes.find(n => n.id === selectedNode);
                const outgoing = graph.edges.filter(e => e.from === selectedNode);
                const incoming = graph.edges.filter(e => e.to === selectedNode);
                if (!node) return null;

                return (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded font-semibold">
                        {node.type.toUpperCase()}
                      </span>
                      <span className="font-bold text-gray-900">{node.label}</span>
                    </div>
                    {node.description && (
                      <p className="text-sm text-gray-600 mb-2">{node.description}</p>
                    )}
                    <div className="flex gap-4 text-sm">
                      <div className="text-gray-500">
                        <span className="font-medium">{outgoing.length}</span> outgoing
                      </div>
                      <div className="text-gray-500">
                        <span className="font-medium">{incoming.length}</span> incoming
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Hierarchy View */}
      {viewMode === 'hierarchy' && (
        <div className="space-y-6">
          {levels.map(level => (
            <div key={level} className="animate-fade-in">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Level {level}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nodesByLevel[level].map(node => (
                  <GraphNode
                    key={node.id}
                    node={node}
                    edges={graph.edges}
                    allNodes={graph.nodes}
                    onNodeClick={setSelectedNode}
                    selectedNode={selectedNode}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connections View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {graph.nodes.map(node => {
            const connections = graph.edges.filter(e => e.from === node.id || e.to === node.id);
            if (connections.length === 0) return null;

            return (
              <div key={node.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                    node.type === 'root' ? 'bg-indigo-100 text-indigo-700' :
                    node.type === 'topic' ? 'bg-violet-100 text-violet-700' :
                    node.type === 'subtopic' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {node.label}
                  </div>
                  <span className="text-xs text-gray-400">
                    {connections.length} connection{connections.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-2 pl-4">
                  {connections.map((edge, idx) => {
                    const isOutgoing = edge.from === node.id;
                    const otherNode = graph.nodes.find(n => n.id === (isOutgoing ? edge.to : edge.from));
                    if (!otherNode) return null;

                    return (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className={relationshipColors[edge.relationship]}>
                          {relationshipIcons[edge.relationship]}
                        </span>
                        <span className="text-xs font-medium text-gray-500">
                          {edge.relationship}
                        </span>
                        {edge.label && (
                          <span className="text-xs italic text-gray-400">
                            ({edge.label})
                          </span>
                        )}
                        <span className="text-gray-700">
                          {isOutgoing ? '→' : '←'} {otherNode.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Topic Tree Component (Legacy)
// ============================================================================

interface TreeNodeProps {
  node: TopicNode;
  depth: number;
  isLast: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, depth, isLast }) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  const depthColors = [
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
  ];

  const depthBgColors = [
    "bg-indigo-50 border-indigo-200",
    "bg-violet-50 border-violet-200",
    "bg-purple-50 border-purple-200",
  ];

  return (
    <div className="animate-fade-in">
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-all cursor-pointer hover:bg-gray-50 group ${
          depth === 0 ? "mb-1" : ""
        }`}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {/* Expand/Collapse Icon */}
        {hasChildren ? (
          <button className="p-0.5 hover:bg-gray-200 rounded transition-colors">
            {isExpanded ? (
              <ChevronDown size={16} className="text-gray-400" />
            ) : (
              <ChevronRight size={16} className="text-gray-400" />
            )}
          </button>
        ) : (
          <div className="w-5" /> // Spacer
        )}

        {/* Depth Indicator */}
        <div
          className={`w-2 h-2 rounded-full ${depthColors[Math.min(depth, 2)]}`}
        />

        {/* Node Name */}
        <span
          className={`font-medium transition-colors ${
            depth === 0
              ? "text-gray-900 text-base"
              : depth === 1
              ? "text-gray-800 text-sm"
              : "text-gray-600 text-sm"
          } group-hover:text-indigo-600`}
        >
          {node.name}
        </span>

        {/* Children Count Badge */}
        {hasChildren && (
          <span className="text-xs text-gray-400 ml-auto">
            {node.children!.length}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-6 border-l-2 border-gray-100 pl-2">
          {node.children!.map((child, idx) => (
            <TreeNode
              key={`${child.name}-${idx}`}
              node={child}
              depth={depth + 1}
              isLast={idx === node.children!.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Upload Modal Component
// ============================================================================

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (doc: Document) => void;
  userId: string;
}

const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadComplete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === "application/pdf") {
      setFile(droppedFile);
      setTitle(droppedFile.name.replace(/\.pdf$/i, ""));
      setError(null);
    } else {
      setError("Please upload a PDF file");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.type === "application/pdf") {
      setFile(selectedFile);
      setTitle(selectedFile.name.replace(/\.pdf$/i, ""));
      setError(null);
    } else {
      setError("Please upload a PDF file");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress("Uploading file...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title || file.name.replace(/\.pdf$/i, ""));

      setUploadProgress("Processing document...");

      // Get Supabase access token for authentication
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error("Please log in again to upload documents.");
      }
      
      const token = session.access_token;

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
        headers,
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Upload failed");
      }

      setUploadProgress("Complete!");

      // Create document object from response
      const newDoc: Document = {
        id: data.documentId,
        title: data.title,
        file_path: "",
        is_processed: true,
        chunk_count: data.chunkCount,
        created_at: new Date().toISOString(),
      };

      setTimeout(() => {
        onUploadComplete(newDoc);
        resetModal();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setIsUploading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setTitle("");
    setIsUploading(false);
    setUploadProgress("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <Upload size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Upload Document
              </h2>
              <p className="text-xs text-gray-500">
                PDF files up to 20MB
              </p>
            </div>
          </div>
          <button
            onClick={resetModal}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!file ? (
            // Drop Zone
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                isDragging
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <FileText
                size={48}
                className={`mx-auto mb-4 ${
                  isDragging ? "text-indigo-500" : "text-gray-300"
                }`}
              />
              <p className="text-gray-600 mb-2">
                Drag & drop your PDF here, or
              </p>
              <label className="inline-block">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <span className="text-indigo-600 font-medium cursor-pointer hover:text-indigo-700">
                  browse files
                </span>
              </label>
            </div>
          ) : (
            // File Selected
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="p-2 bg-red-100 rounded-lg text-red-600">
                  <FileText size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {!isUploading && (
                  <button
                    onClick={() => setFile(null)}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for this document"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  disabled={isUploading}
                />
              </div>

              {isUploading && (
                <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl">
                  <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
                  <span className="text-indigo-700 font-medium">
                    {uploadProgress}
                  </span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <button
            onClick={resetModal}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload & Process
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Document Detail Modal (Topic Tree View)
// ============================================================================

interface DocumentDetailModalProps {
  document: Document | null;
  onClose: () => void;
  onGenerateTree: (docId: string) => Promise<void>;
  isGenerating: boolean;
  onStudyDocument?: (documentId: string, documentTitle: string) => void;
}

const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document,
  onClose,
  onGenerateTree,
  isGenerating,
  onStudyDocument,
}) => {
  if (!document) return null;

  const hasTopicTree = Boolean(
    document.topic_tree && 
    (('nodes' in document.topic_tree && document.topic_tree.nodes.length > 0) || 
     ('name' in document.topic_tree && document.topic_tree.name))
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex justify-between items-start">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-white rounded-xl shadow-sm text-indigo-600">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {document.title}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(document.created_at).toLocaleDateString()}
                </span>
                {document.chunk_count > 0 && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                    {document.chunk_count} chunks
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {hasTopicTree ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FolderTree size={32} className="text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Knowledge Graph Ready
              </h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                Interactive concept map with {document.topic_tree && 'nodes' in document.topic_tree ? document.topic_tree.nodes.length : '0'} concepts and their connections
              </p>
              <div className="flex gap-3 justify-center">
                <a
                  href={`/graph/${document.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200"
                >
                  <FolderTree size={20} />
                  Open Full Screen Graph
                </a>
                {onStudyDocument && (
                  <button
                    onClick={() => {
                      onStudyDocument(document.id, document.title);
                      onClose();
                    }}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-green-200"
                  >
                    <BookOpen size={20} />
                    Study Cards
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles size={32} className="text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Generate Concept Graph
              </h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Use AI to analyze this document and create an interactive
                knowledge graph with concepts and their relationships.
              </p>
              <button
                onClick={() => onGenerateTree(document.id)}
                disabled={isGenerating}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 mx-auto shadow-lg shadow-indigo-200"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Analyzing Document...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Generate with AI
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {hasTopicTree && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <button
              onClick={() => onGenerateTree(document.id)}
              disabled={isGenerating}
              className="text-gray-500 hover:text-indigo-600 font-medium text-sm flex items-center gap-1"
            >
              <RefreshCw size={14} className={isGenerating ? "animate-spin" : ""} />
              Regenerate
            </button>
            <button
              onClick={onClose}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Main Documents View Component
// ============================================================================

export const DocumentsView: React.FC<DocumentsViewProps> = ({ userId, onStudyDocument }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isGeneratingTree, setIsGeneratingTree] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch documents on mount
  React.useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      // Wait a bit for session to be ready after login
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get auth token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.warn("No session available when fetching documents");
        setDocuments([]);
        setIsLoading(false);
        return;
      }
      
      const token = session?.access_token;

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/ingest", {
        headers,
        credentials: "include",
      });
      const data = await response.json();

      if (response.ok) {
        setDocuments(data.documents || []);
      } else {
        if (response.status === 401) {
          console.warn("Unauthorized when fetching documents, session may have expired");
          setDocuments([]);
        } else {
          setError(data.error);
        }
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
      setError("Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadComplete = (newDoc: Document) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleSelectDocument = async (doc: Document) => {
    // If we don't have the topic tree yet, fetch it
    if (!doc.topic_tree) {
      try {
        // Get auth token
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
          `/api/generate-tree?documentId=${doc.id}`,
          {
            headers,
            credentials: "include",
          }
        );
        const data = await response.json();

        if (response.ok && data.topicTree) {
          const updatedDoc = { ...doc, topic_tree: data.topicTree };
          setDocuments((prev) =>
            prev.map((d) => (d.id === doc.id ? updatedDoc : d))
          );
          setSelectedDocument(updatedDoc);
          return;
        }
      } catch (err) {
        // Ignore, we'll show the generate button
      }
    }

    setSelectedDocument(doc);
  };

  const handleGenerateTree = async (docId: string) => {
    setIsGeneratingTree(true);
    try {
      // Get auth token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/generate-tree", {
        method: "POST",
        headers,
        body: JSON.stringify({ documentId: docId }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.topicTree) {
        const updatedDoc = {
          ...documents.find((d) => d.id === docId)!,
          topic_tree: data.topicTree,
        };
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? updatedDoc : d))
        );
        setSelectedDocument(updatedDoc);
      } else {
        throw new Error(data.error || "Failed to generate topic tree");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate tree");
    } finally {
      setIsGeneratingTree(false);
    }
  };

  const handleDeleteDocument = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this document?")) return;

    // Optimistic update
    setDocuments((prev) => prev.filter((d) => d.id !== docId));

    // TODO: Add delete API endpoint when needed
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500 mt-1">
            Upload PDFs and explore their structure
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-md font-medium"
        >
          <Upload size={20} />
          <span>Upload PDF</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <span className="text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No documents yet</h3>
          <p className="text-gray-500 mb-4">
            Upload a PDF to get started with AI-powered analysis
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="text-indigo-600 font-medium hover:text-indigo-700"
          >
            Upload your first document →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => handleSelectDocument(doc)}
              className="group bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
            >
              {/* Accent */}
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg text-indigo-600">
                  <FileText size={22} />
                </div>
                <button
                  onClick={(e) => handleDeleteDocument(doc.id, e)}
                  className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100"
                  title="Delete Document"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight line-clamp-2">
                {doc.title}
              </h3>

              {/* Status */}
              <div className="flex items-center gap-2 mb-4">
                {doc.is_processed ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">
                    <CheckCircle2 size={12} />
                    Processed
                  </span>
                ) : doc.processing_error ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-md">
                    <AlertCircle size={12} />
                    Error
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md">
                    <Clock size={12} />
                    Processing
                  </span>
                )}

                {doc.topic_tree && (
                  <span className="flex items-center gap-1 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                    <FolderTree size={12} />
                    Tree Ready
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">
                  {new Date(doc.created_at).toLocaleDateString()}
                </span>
                <span className="text-indigo-600 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                  View <ChevronRight size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadComplete={handleUploadComplete}
        userId={userId}
      />

      <DocumentDetailModal
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
        onGenerateTree={handleGenerateTree}
        isGenerating={isGeneratingTree}
        onStudyDocument={onStudyDocument}
      />
    </div>
  );
};
