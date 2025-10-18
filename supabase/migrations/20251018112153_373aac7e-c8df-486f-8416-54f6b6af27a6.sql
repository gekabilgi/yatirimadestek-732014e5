-- Create question_variants table for deduplicated Q&A with single embeddings
CREATE TABLE IF NOT EXISTS public.question_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_question TEXT NOT NULL,
  canonical_answer TEXT NOT NULL,
  variants TEXT[] DEFAULT '{}', -- Alternative question phrasings
  embedding vector(1536) NOT NULL, -- Single embedding for canonical question
  source_document TEXT, -- Source file(s) this came from
  confidence_score FLOAT DEFAULT 1.0, -- Grouping confidence (0-1)
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_question_variants_embedding 
ON public.question_variants 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 50);

CREATE INDEX IF NOT EXISTS idx_question_variants_created_at 
ON public.question_variants(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_question_variants_source 
ON public.question_variants(source_document);

-- Enable RLS
ALTER TABLE public.question_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage question variants"
ON public.question_variants FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Public can read question variants"
ON public.question_variants FOR SELECT
TO anon, authenticated
USING (true);

-- Create similarity search function
CREATE OR REPLACE FUNCTION public.match_question_variants(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  canonical_question TEXT,
  canonical_answer TEXT,
  variants TEXT[],
  similarity FLOAT,
  source_document TEXT,
  metadata JSONB
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    qv.id,
    qv.canonical_question,
    qv.canonical_answer,
    qv.variants,
    1 - (qv.embedding <=> query_embedding) AS similarity,
    qv.source_document,
    qv.metadata
  FROM question_variants qv
  WHERE 1 - (qv.embedding <=> query_embedding) > match_threshold
  ORDER BY qv.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_question_variants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER question_variants_updated_at
BEFORE UPDATE ON public.question_variants
FOR EACH ROW
EXECUTE FUNCTION update_question_variants_updated_at();