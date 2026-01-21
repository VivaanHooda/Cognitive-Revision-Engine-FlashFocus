# Topic → Content → Flashcards Architecture

## 🔗 How Topics Connect to Document Content

### Architecture Flow

```
User clicks node in graph
        ↓
   "Process Management"
        ↓
   Semantic Search (embeddings)
        ↓
   Find top 5-10 relevant chunks
        ↓
   Combine chunk content
        ↓
   Send to Gemini with topic
        ↓
   Generate flashcards
```

## 📊 Data Flow

### 1. Knowledge Graph (JSONB)
```json
{
  "nodes": [
    {
      "id": "process-mgmt",
      "label": "Process Management",
      "type": "topic",
      "description": "Managing processes in OS"
    }
  ]
}
```

### 2. Document Chunks (Vector DB)
```sql
document_chunks:
- content: "A process is a program in execution..."
- embedding: [0.123, -0.456, ...] (768 dims)
- chunk_index: 0
```

### 3. Semantic Search (Connects them!)
```sql
SELECT content, chunk_index, 
       1 - (embedding <=> query_embedding) as similarity
FROM document_chunks
WHERE document_id = ?
ORDER BY similarity DESC
LIMIT 10
```

## 💡 Usage Examples

### Example 1: Get Content for a Topic

```typescript
// From graph page - user clicks node
const response = await fetch('/api/topic-content', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    documentId: '5384af71-faa8-4df9-af6e-bb533393edda',
    topicLabel: 'Process Management',
    topicDescription: 'Managing processes in operating systems',
    limit: 5
  })
});

const data = await response.json();
// Returns:
{
  "success": true,
  "topic": "Process Management",
  "chunks": [
    {
      "id": "uuid...",
      "content": "A process is a program in execution...",
      "similarity": 0.87,
      "chunkIndex": 0
    }
  ]
}
```

### Example 2: Generate Flashcards from Topic

```typescript
// User clicks "Generate Flashcards" on a node
const response = await fetch('/api/generate-flashcards', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    documentId: '5384af71-faa8-4df9-af6e-bb533393edda',
    topicLabel: 'Process Synchronization',
    topicDescription: 'Concurrency and synchronization primitives',
    cardCount: 8
  })
});

const data = await response.json();
// Returns:
{
  "success": true,
  "topic": "Process Synchronization",
  "flashcards": [
    {
      "question": "What is a semaphore?",
      "answer": "A semaphore is a synchronization primitive...",
      "difficulty": "medium",
      "hint": "Think about shared resource access control"
    }
  ],
  "sourceChunks": 10
}
```

## 🎯 Integration Points

### Add to Graph Page

```typescript
// In app/graph/[documentId]/page.tsx

// When user clicks a node
const handleGenerateFlashcards = async (node: ConceptNode) => {
  setLoading(true);
  
  try {
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
        topicDescription: node.description,
        cardCount: 5
      })
    });
    
    const data = await response.json();
    
    // Show flashcards in modal or navigate to study page
    setFlashcards(data.flashcards);
    setShowFlashcardModal(true);
    
  } catch (error) {
    console.error('Failed to generate flashcards:', error);
  } finally {
    setLoading(false);
  }
};
```

## 🔍 Why This Works

### Semantic Search Benefits
1. **Intelligent Matching**: Finds relevant content even if exact words don't match
2. **Context-Aware**: Understands "process scheduling" relates to "CPU allocation"
3. **Ranked Results**: Gets most relevant chunks first
4. **Topic-Scoped**: Only searches within the document

### Example Matches
```
Topic: "Memory Management"
  → Finds chunks about:
    - "Virtual memory"
    - "Page tables"
    - "Memory allocation algorithms"
    - "Heap vs stack"
  → Even if "memory management" isn't in the text!
```

## 🚀 Next Steps

### To add flashcard generation to your graph:

1. **Add button to node info panel**
   ```tsx
   <button onClick={() => handleGenerateFlashcards(selectedNode)}>
     🃏 Generate Flashcards
   </button>
   ```

2. **Show flashcards in modal**
   ```tsx
   {showFlashcards && (
     <FlashcardModal 
       cards={flashcards}
       topic={selectedNode.label}
       onClose={() => setShowFlashcards(false)}
     />
   )}
   ```

3. **Save to deck** (optional)
   - POST to `/api/decks` to create/update deck
   - Store flashcards in your existing deck system

## 📈 Performance

- Semantic search: ~50-100ms (HNSW index)
- Flashcard generation: ~2-3 seconds (Gemini API)
- Total: ~3 seconds for 5 flashcards

## 🎨 UX Flow

```
1. User views graph
2. Clicks "Process Synchronization" node
3. Clicks "🃏 Generate Flashcards" button
4. Loading spinner (3 seconds)
5. Modal shows 5-8 flashcards
6. User can:
   - Review flashcards
   - Save to deck
   - Generate more
   - Study now
```

This architecture keeps your graph nodes clean (just structure) while dynamically linking them to content via semantic search! 🎯
