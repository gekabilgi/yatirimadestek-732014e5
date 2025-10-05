-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table for storing document chunks with embeddings
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(768), -- Using 768 dimensions for Gemini embeddings
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage knowledge base"
ON public.knowledge_base
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Public can read knowledge base for search"
ON public.knowledge_base
FOR SELECT
TO authenticated
USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_knowledge_base_filename ON public.knowledge_base(filename);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_created_at ON public.knowledge_base(created_at DESC);

-- Create vector similarity search index (IVFFlat for better performance)
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding 
ON public.knowledge_base 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Function for similarity search
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  filename text,
  content text,
  similarity float
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_base.id,
    knowledge_base.filename,
    knowledge_base.content,
    1 - (knowledge_base.embedding <=> query_embedding) AS similarity
  FROM knowledge_base
  WHERE 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_base.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Table for tracking document uploads
CREATE TABLE IF NOT EXISTS public.document_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  chunks_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.document_uploads ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage document uploads"
ON public.document_uploads
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create index
CREATE INDEX IF NOT EXISTS idx_document_uploads_status ON public.document_uploads(status);
CREATE INDEX IF NOT EXISTS idx_document_uploads_created_at ON public.document_uploads(created_at DESC);