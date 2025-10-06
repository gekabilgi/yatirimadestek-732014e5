-- Update knowledge_base table to use 1536 dimensions for OpenAI embeddings
-- Drop existing vector column and recreate with new dimensions
ALTER TABLE public.knowledge_base 
DROP COLUMN IF EXISTS embedding;

ALTER TABLE public.knowledge_base 
ADD COLUMN embedding vector(1536);

-- Recreate the index for the new vector dimension
CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx 
ON public.knowledge_base 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);