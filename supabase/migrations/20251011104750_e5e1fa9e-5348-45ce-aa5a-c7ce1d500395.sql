-- Add context fields to user_sessions table for detailed activity tracking
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS search_term TEXT,
ADD COLUMN IF NOT EXISTS incentive_type TEXT,
ADD COLUMN IF NOT EXISTS investment_topic TEXT,
ADD COLUMN IF NOT EXISTS module_name TEXT;

-- Add index for faster queries on module_name
CREATE INDEX IF NOT EXISTS idx_user_sessions_module_name ON public.user_sessions(module_name);

-- Add comment for documentation
COMMENT ON COLUMN public.user_sessions.search_term IS 'Search term used in Sektör Bazlı Teşvik Sorgulama';
COMMENT ON COLUMN public.user_sessions.incentive_type IS 'Selected incentive type in Türkiye Yüzyılı Teşvik Hesaplamaları';
COMMENT ON COLUMN public.user_sessions.investment_topic IS 'Investment topic when Yerel Kalkınma Hamlesi is selected';
COMMENT ON COLUMN public.user_sessions.module_name IS 'Name of the module where activity occurred';