-- Add search_source column to hybrid_search_analytics table
ALTER TABLE hybrid_search_analytics 
ADD COLUMN IF NOT EXISTS search_source text DEFAULT 'chatbot';

-- Add index for faster filtering by source
CREATE INDEX IF NOT EXISTS idx_hybrid_search_analytics_search_source 
ON hybrid_search_analytics(search_source);

-- Comment for documentation
COMMENT ON COLUMN hybrid_search_analytics.search_source IS 'Source of the search: chatbot, support_search, investment_search, glossary_search, incentive_query';