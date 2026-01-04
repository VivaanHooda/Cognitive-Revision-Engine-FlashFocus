-- ============================================================================
-- Migration: Document Ingestion & Vector Search Infrastructure
-- Created: 2026-01-04
-- Purpose: Enable pgvector, create documents/chunks tables, and semantic search
-- ============================================================================

-- 1. Enable pgvector Extension
-- Note: This requires the extension to be enabled in your Supabase project
-- Go to Database → Extensions → Enable "vector"
create extension if not exists vector with schema extensions;

-- ============================================================================
-- 2. Documents Table (Source of Truth for uploaded files)
-- ============================================================================
-- Design decisions:
-- - file_path: Path in Supabase Storage, allows re-downloading if needed
-- - topic_tree: JSONB for flexible hierarchical structure (Topic → Subtopic → Concept)
-- - is_processed: Flag to track ingestion pipeline completion
-- - processing_error: Capture failure reasons for debugging

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_path text not null,                    -- Path in Supabase Storage bucket
  title text not null,                         -- User-friendly document name
  file_size bigint,                           -- Size in bytes for quota tracking
  mime_type text default 'application/pdf',   -- For future multi-format support
  topic_tree jsonb,                           -- Hierarchical JSON curriculum
  is_processed boolean default false,         -- Ingestion complete flag
  processing_error text,                      -- Error message if processing failed
  chunk_count integer default 0,              -- Number of chunks created
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for user queries (most common access pattern)
create index if not exists idx_documents_user_id on public.documents (user_id);
create index if not exists idx_documents_user_processed on public.documents (user_id, is_processed);

-- Enable RLS
alter table public.documents enable row level security;

-- RLS Policy: Users can only access their own documents
create policy "Users can manage their own documents"
  on public.documents
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger for updated_at
create trigger trg_documents_updated_at
before update on public.documents
for each row execute procedure set_updated_at();

-- ============================================================================
-- 3. Document Chunks Table (Vector Search Index)
-- ============================================================================
-- Design decisions:
-- - embedding vector(768): Matches Gemini text-embedding-004 output dimensions
-- - chunk_index: Preserves document order for context reconstruction
-- - on delete cascade: Automatic cleanup when document is deleted

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  content text not null,                      -- The actual text chunk
  chunk_index integer not null,               -- Position in document (0-indexed)
  embedding vector(768),                      -- Gemini text-embedding-004 output
  token_count integer,                        -- Approximate token count for debugging
  created_at timestamptz default now()
);

-- Index for document lookups
create index if not exists idx_chunks_document_id on public.document_chunks (document_id);

-- HNSW index for fast approximate nearest neighbor search
-- ef_construction=64: Balance between index build time and search quality
-- m=16: Good default for 768-dimensional vectors
create index if not exists idx_chunks_embedding on public.document_chunks 
using hnsw (embedding vector_cosine_ops)
with (m = 16, ef_construction = 64);

-- Enable RLS (inherit access from parent document via join)
alter table public.document_chunks enable row level security;

-- RLS Policy: Access chunks only if user owns the parent document
create policy "Users can access chunks of their documents"
  on public.document_chunks
  using (
    exists (
      select 1 from public.documents
      where documents.id = document_chunks.document_id
      and documents.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. Semantic Search Function (RPC)
-- ============================================================================
-- Purpose: Find most similar chunks to a query embedding within a specific document
-- 
-- Parameters:
--   query_embedding: The 768-dim vector from the user's query
--   match_threshold: Minimum similarity score (0.0 to 1.0, recommend 0.7+)
--   match_count: Maximum number of results to return
--   filter_document_id: Scope search to a specific document
--
-- Returns: Table of (id, content, similarity) ordered by relevance

create or replace function match_document_chunks(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_document_id uuid
)
returns table (
  id uuid,
  content text,
  similarity float
)
language plpgsql
security definer  -- Runs with function owner's privileges for RLS bypass
set search_path = public
as $$
begin
  return query
  select
    document_chunks.id,
    document_chunks.content,
    -- Cosine similarity: 1 - cosine_distance
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where 
    document_chunks.document_id = filter_document_id
    and 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function match_document_chunks to authenticated;

-- ============================================================================
-- 5. Helper Function: Get Document with Chunks Count
-- ============================================================================

create or replace function get_user_documents_with_stats(p_user_id uuid)
returns table (
  id uuid,
  title text,
  file_path text,
  is_processed boolean,
  processing_error text,
  chunk_count integer,
  has_topic_tree boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    d.id,
    d.title,
    d.file_path,
    d.is_processed,
    d.processing_error,
    d.chunk_count,
    (d.topic_tree is not null) as has_topic_tree,
    d.created_at
  from documents d
  where d.user_id = p_user_id
  order by d.created_at desc;
end;
$$;

grant execute on function get_user_documents_with_stats to authenticated;
