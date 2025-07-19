-- Create table for tracking app statistics
CREATE TABLE public.app_statistics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_name text NOT NULL UNIQUE,
  stat_value bigint NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_statistics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view statistics" 
ON public.app_statistics 
FOR SELECT 
USING (true);

CREATE POLICY "System can update statistics" 
ON public.app_statistics 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Insert initial statistics
INSERT INTO public.app_statistics (stat_name, stat_value) VALUES 
('search_clicks', 0),
('calculation_clicks', 0);

-- Create function to increment statistics
CREATE OR REPLACE FUNCTION public.increment_stat(stat_name_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.app_statistics (stat_name, stat_value, updated_at)
  VALUES (stat_name_param, 1, now())
  ON CONFLICT (stat_name)
  DO UPDATE SET 
    stat_value = app_statistics.stat_value + 1,
    updated_at = now();
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_app_statistics_updated_at
BEFORE UPDATE ON public.app_statistics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();