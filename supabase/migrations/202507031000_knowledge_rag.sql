-- Knowledge RAG: chunked embeddings for per-utterance retrieval

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id   TEXT NOT NULL,
  document_name TEXT NOT NULL,
  chunk_index   INT NOT NULL,
  content       TEXT NOT NULL,
  token_count   INT,
  embedding     vector(1536),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS knowledge_chunks_user_idx
  ON public.knowledge_chunks (user_id);

CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx
  ON public.knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own knowledge chunks" ON public.knowledge_chunks;
CREATE POLICY "Users manage own knowledge chunks"
  ON public.knowledge_chunks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
  query_embedding vector(1536),
  match_user_id UUID,
  match_count INT DEFAULT 3,
  match_threshold FLOAT DEFAULT 0.72
)
RETURNS TABLE (
  id UUID,
  document_name TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    kc.id,
    kc.document_name,
    kc.content,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_chunks kc
  WHERE kc.user_id = match_user_id
    AND kc.embedding IS NOT NULL
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;
