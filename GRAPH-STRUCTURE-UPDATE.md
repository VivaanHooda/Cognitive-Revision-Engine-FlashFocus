# Knowledge Graph Structure Update

## Overview
Transformed the topic tree from a hierarchical tree structure to an interactive **graph-based knowledge map** with nodes and edges showing concept relationships.

## What Changed

### 1. Data Structure (Backend)

**Before:**
```typescript
interface TopicNode {
  name: string;
  children?: TopicNode[];
}
```

**After:**
```typescript
interface ConceptGraph {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

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
```

### 2. AI Prompt (Gemini)

Now generates a **knowledge graph** with:
- **Nodes**: Concepts with unique IDs and types
- **Edges**: Relationships between concepts
  - `contains`: Hierarchical containment
  - `prerequisite`: Must learn before
  - `related`: Connected concepts
  - `extends`: Builds upon

### 3. UI Components

#### New Graph Visualization
- **Hierarchy View**: Nodes organized by level (0-3)
- **Connections View**: Show all relationships for each concept
- **Interactive**: Click nodes to see their connections
- **Visual Cues**:
  - ⚡ Prerequisite (amber)
  - ⟷ Related (blue)
  - ↗ Extends (purple)
  - → Contains (gray)

#### Features
- Color-coded by node type:
  - **Root**: Purple gradient (main topic)
  - **Topic**: Violet background
  - **Subtopic**: Blue background
  - **Concept**: White background
- Toggle between Hierarchy and Connections views
- Expandable connections on click
- Connection count badges
- Smooth animations

### 4. Backward Compatibility

The system supports **both formats**:
- New documents: Generate as graph
- Old documents: Still display as tree
- Auto-detection: Checks for `nodes` and `edges` properties

## Usage

1. **Upload a PDF** to the Documents section
2. **Click "Generate with AI"** on the document
3. **View the graph**:
   - Switch between Hierarchy/Connections views
   - Click nodes to expand their relationships
   - See prerequisite chains and related concepts

## Example Output

For a Number Theory document:
```json
{
  "nodes": [
    { "id": "root", "label": "Number Theory Fundamentals", "type": "root", "level": 0 },
    { "id": "divisibility", "label": "Divisibility", "type": "topic", "level": 1 },
    { "id": "div-def", "label": "Divisibility Definition", "type": "subtopic", "level": 2 },
    { "id": "gcd", "label": "Greatest Common Divisor", "type": "topic", "level": 1 },
    { "id": "euclidean", "label": "Euclidean Algorithm", "type": "concept", "level": 2 }
  ],
  "edges": [
    { "from": "root", "to": "divisibility", "relationship": "contains" },
    { "from": "divisibility", "to": "div-def", "relationship": "contains" },
    { "from": "div-def", "to": "gcd", "relationship": "prerequisite", "label": "foundation for" },
    { "from": "gcd", "to": "euclidean", "relationship": "contains" }
  ]
}
```

## Benefits

✅ **Better Learning Paths**: See prerequisites clearly
✅ **Discover Connections**: Find related concepts
✅ **Visual Understanding**: Graph structure mirrors mental models
✅ **Notebook-Style**: Like Obsidian or Roam Research
✅ **Interactive Exploration**: Click to navigate concept network

## Files Modified

1. [app/api/generate-tree/route.ts](app/api/generate-tree/route.ts)
   - Updated types and validation
   - New prompt for graph generation
   - Normalization for graph structure

2. [components/DocumentsView.tsx](components/DocumentsView.tsx)
   - New `ConceptGraphView` component
   - Graph visualization with interactions
   - Backward compatible with tree view

3. [app/globals.css](app/globals.css)
   - Scale animations for hover effects

## Next Steps

To regenerate existing documents with the new format:
1. Open a document with an existing topic tree
2. Click the **"Regenerate"** button at the bottom
3. The new graph structure will be generated

## Technical Notes

- Model used: `gemini-1.5-flash`
- Graph stored in same `topic_tree` JSONB column
- Type checking ensures valid relationships
- Node IDs are slugified for consistency
