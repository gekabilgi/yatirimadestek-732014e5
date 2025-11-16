-- Create incentive_queries table for tracking slot-filling state
CREATE TABLE IF NOT EXISTS public.incentive_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'collecting' CHECK (status IN ('collecting', 'completed', 'cancelled')),
  sector TEXT,
  sector_nace TEXT,
  province TEXT,
  district TEXT,
  osb_status TEXT CHECK (osb_status IN ('İÇİ', 'DIŞI', NULL)),
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id)
);

-- Create index for faster session lookups
CREATE INDEX IF NOT EXISTS idx_incentive_queries_session ON public.incentive_queries(session_id);

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_incentive_queries_status ON public.incentive_queries(status);

-- Enable RLS
ALTER TABLE public.incentive_queries ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read (for public chatbot usage)
CREATE POLICY "Allow public read access to incentive queries"
  ON public.incentive_queries
  FOR SELECT
  TO public
  USING (true);

-- RLS Policy: Anyone can insert (for public chatbot usage)
CREATE POLICY "Allow public insert access to incentive queries"
  ON public.incentive_queries
  FOR INSERT
  TO public
  WITH CHECK (true);

-- RLS Policy: Anyone can update (for public chatbot usage)
CREATE POLICY "Allow public update access to incentive queries"
  ON public.incentive_queries
  FOR UPDATE
  TO public
  USING (true);

-- Add trigger for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_incentive_queries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_incentive_queries_updated_at
  BEFORE UPDATE ON public.incentive_queries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_incentive_queries_updated_at();