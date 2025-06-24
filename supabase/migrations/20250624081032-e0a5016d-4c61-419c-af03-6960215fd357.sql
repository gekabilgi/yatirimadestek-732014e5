
-- Remove empty rows from glossary_terms table
-- This will delete rows where term or definition is null, empty string, or only whitespace
DELETE FROM public.glossary_terms 
WHERE 
  term IS NULL 
  OR definition IS NULL 
  OR TRIM(term) = '' 
  OR TRIM(definition) = '';
