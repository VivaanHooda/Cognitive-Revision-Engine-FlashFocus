-- ============================================================================
-- COMPLETE DATABASE SCHEMA FIX
-- Run this entire script in Supabase SQL Editor to rebuild everything correctly
-- ============================================================================

-- 1. Clean up existing tables and functions
-- ============================================================================
drop function if exists match_document_chunks cascade;
drop function if exists get_user_documents_with_stats cascade;
drop table if exists public.document_chunks cascade;
drop table if exists public.documents cascade;
drop extension if exists vector cascade;

-- 2. Enable pgvector Extension
-- ============================================================================
create extension if not exists vector with schema public;

-- 3. Create updated_at trigger function (if not exists)
-- ============================================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 4. Documents Table
-- ============================================================================
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_path text not null,
  title text not null,
  file_size bigint,
  mime_type text default 'application/pdf',
  topic_tree jsonb,
  is_processed boolean default false,
  processing_error text,
  chunk_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_documents_user_id on public.documents (user_id);
create index idx_documents_user_processed on public.documents (user_id, is_processed);

-- RLS
alter table public.documents enable row level security;

create policy "Users can manage their own documents"
  on public.documents
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger
create trigger trg_documents_updated_at
before update on public.documents
for each row execute procedure set_updated_at();

-- 5. Document Chunks Table
-- ============================================================================
create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  content text not null,
  chunk_index integer not null,
  embedding vector(768) not null,
  token_count integer,
  created_at timestamptz default now()
);

-- Indexes
create index idx_chunks_document_id on public.document_chunks (document_id);
create index idx_chunks_embedding on public.document_chunks 
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- RLS
alter table public.document_chunks enable row level security;

create policy "Users can access chunks of their documents"
  on public.document_chunks
  using (
    exists (
      select 1 from public.documents
      where documents.id = document_chunks.document_id
      and documents.user_id = auth.uid()
    )
  );

-- 6. Semantic Search Function
-- ============================================================================
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
security definer
set search_path = public
as $$
begin
  return query
  select
    dc.id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  where 
    dc.document_id = filter_document_id
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;

grant execute on function match_document_chunks to authenticated;

-- 7. Helper Function
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

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify everything is set up correctly:

-- Check if vector extension is enabled
-- SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check if tables exist with correct columns
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('documents', 'document_chunks')
-- ORDER BY table_name, ordinal_position;

-- Check if functions exist
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('match_document_chunks', 'get_user_documents_with_stats');
