-- Question Cache Table for frequently asked questions
CREATE TABLE question_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash TEXT NOT NULL UNIQUE,
  normalized_query TEXT NOT NULL,
  original_query TEXT NOT NULL,
  response_text TEXT NOT NULL,
  grounding_chunks JSONB,
  support_cards JSONB,
  hit_count INTEGER DEFAULT 1,
  last_hit_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  source TEXT DEFAULT 'gemini',
  search_metadata JSONB
);

CREATE INDEX idx_question_cache_hash ON question_cache(query_hash);
CREATE INDEX idx_question_cache_expires ON question_cache(expires_at);
CREATE INDEX idx_question_cache_hits ON question_cache(hit_count DESC);

-- Enable RLS
ALTER TABLE question_cache ENABLE ROW LEVEL SECURITY;

-- Policies for question_cache
CREATE POLICY "Public can read cache entries"
ON question_cache FOR SELECT
USING (true);

CREATE POLICY "System can insert cache entries"
ON question_cache FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update cache entries"
ON question_cache FOR UPDATE
USING (true);

CREATE POLICY "Admins can delete cache entries"
ON question_cache FOR DELETE
USING (is_admin(auth.uid()));

-- Hybrid Search Analytics Table
CREATE TABLE hybrid_search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  query TEXT NOT NULL,
  query_hash TEXT,
  
  -- Search Performance Metrics
  total_response_time_ms INTEGER,
  embedding_time_ms INTEGER,
  qv_search_time_ms INTEGER,
  vertex_search_time_ms INTEGER,
  support_search_time_ms INTEGER,
  
  -- Match Results
  qv_match_count INTEGER DEFAULT 0,
  qv_best_similarity FLOAT,
  qv_match_type TEXT,
  vertex_has_results BOOLEAN DEFAULT false,
  support_match_count INTEGER DEFAULT 0,
  
  -- Cache Performance
  cache_hit BOOLEAN DEFAULT false,
  cache_key TEXT,
  
  -- Query Analysis
  query_expanded BOOLEAN DEFAULT false,
  expanded_queries_count INTEGER DEFAULT 0,
  keywords_extracted INTEGER DEFAULT 0,
  
  -- Response Quality
  response_source TEXT,
  response_length INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hybrid_analytics_date ON hybrid_search_analytics(created_at);
CREATE INDEX idx_hybrid_analytics_session ON hybrid_search_analytics(session_id);
CREATE INDEX idx_hybrid_analytics_cache ON hybrid_search_analytics(cache_hit);
CREATE INDEX idx_hybrid_analytics_match_type ON hybrid_search_analytics(qv_match_type);

-- Enable RLS
ALTER TABLE hybrid_search_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for analytics
CREATE POLICY "System can insert analytics"
ON hybrid_search_analytics FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can read analytics"
ON hybrid_search_analytics FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete analytics"
ON hybrid_search_analytics FOR DELETE
USING (is_admin(auth.uid()));

-- Cache Statistics View
CREATE OR REPLACE VIEW cache_statistics_view AS
SELECT 
  COUNT(*) as total_cached_queries,
  COALESCE(SUM(hit_count), 0) as total_cache_hits,
  COALESCE(AVG(hit_count), 0) as avg_hits_per_query,
  COUNT(*) FILTER (WHERE hit_count > 5) as popular_queries,
  COUNT(*) FILTER (WHERE expires_at < now()) as expired_entries,
  COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours') as new_today
FROM question_cache;

-- Grant access to the view
GRANT SELECT ON cache_statistics_view TO authenticated;
GRANT SELECT ON cache_statistics_view TO anon;