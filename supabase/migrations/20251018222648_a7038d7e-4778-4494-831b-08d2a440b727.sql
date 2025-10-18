-- Make embedding column nullable to allow importing data before generating embeddings
ALTER TABLE public.question_variants 
ALTER COLUMN embedding DROP NOT NULL;

-- Add explanatory comment
COMMENT ON COLUMN public.question_variants.embedding IS 
  'Vector embedding for semantic search. Can be NULL initially and populated later via batch regeneration using the regenerate embeddings feature.';