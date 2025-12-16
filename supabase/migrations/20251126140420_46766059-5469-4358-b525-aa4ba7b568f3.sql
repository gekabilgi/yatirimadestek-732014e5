-- Add admin settings for RAG mode selection
INSERT INTO admin_settings (setting_key, category, setting_value, setting_value_text, description)
VALUES 
  ('chatbot_rag_mode', 'chatbot', 0, 'gemini_file_search', 'Chatbot RAG mode: gemini_file_search or custom_rag'),
  ('active_custom_rag_store', 'chatbot', 0, NULL, 'Active Custom RAG store ID')
ON CONFLICT (setting_key) DO NOTHING;

-- Custom RAG Stores table
CREATE TABLE IF NOT EXISTS custom_rag_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  embedding_model TEXT NOT NULL DEFAULT 'gemini',
  embedding_dimensions INTEGER NOT NULL DEFAULT 768,
  chunk_size INTEGER DEFAULT 500,
  chunk_overlap INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom RAG Documents table
CREATE TABLE IF NOT EXISTS custom_rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES custom_rag_stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  original_content TEXT,
  custom_metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  chunks_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, name)
);

-- Custom RAG Chunks table with pgvector (1536 dimensions - works with indexing)
CREATE TABLE IF NOT EXISTS custom_rag_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES custom_rag_documents(id) ON DELETE CASCADE,
  store_id UUID REFERENCES custom_rag_stores(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  token_count INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_crc_store_id ON custom_rag_chunks(store_id);
CREATE INDEX IF NOT EXISTS idx_crc_document_id ON custom_rag_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_crc_embedding ON custom_rag_chunks USING hnsw (embedding vector_cosine_ops);

-- RLS Policies
ALTER TABLE custom_rag_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_rag_chunks ENABLE ROW LEVEL SECURITY;

-- Admins can manage everything
CREATE POLICY "Admins can manage custom_rag_stores" ON custom_rag_stores FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage custom_rag_documents" ON custom_rag_documents FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage custom_rag_chunks" ON custom_rag_chunks FOR ALL USING (is_admin(auth.uid()));

-- Public can read from active stores
CREATE POLICY "Public can read active custom_rag_stores" ON custom_rag_stores FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read documents from active stores" ON custom_rag_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM custom_rag_stores WHERE custom_rag_stores.id = custom_rag_documents.store_id AND custom_rag_stores.is_active = true)
);
CREATE POLICY "Public can read chunks from active stores" ON custom_rag_chunks FOR SELECT USING (
  EXISTS (SELECT 1 FROM custom_rag_stores WHERE custom_rag_stores.id = custom_rag_chunks.store_id AND custom_rag_stores.is_active = true)
);

-- Search function with no chunk limit (30+ chunks vs Gemini's 5)
CREATE OR REPLACE FUNCTION match_custom_rag_chunks(
  query_embedding vector(1536),
  p_store_id uuid,
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 30
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  document_name text,
  content text,
  chunk_index int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.document_id,
    d.display_name as document_name,
    c.content,
    c.chunk_index,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM custom_rag_chunks c
  JOIN custom_rag_documents d ON d.id = c.document_id
  WHERE c.store_id = p_store_id
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;