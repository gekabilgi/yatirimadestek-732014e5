
-- Create exchange_rates table to store daily TCMB exchange rates
CREATE TABLE public.exchange_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL UNIQUE,
  usd_buying numeric NOT NULL,
  usd_selling numeric NOT NULL,
  eur_buying numeric NOT NULL,
  eur_selling numeric NOT NULL,
  gbp_buying numeric NOT NULL,
  gbp_selling numeric NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (everyone can view exchange rates)
CREATE POLICY "Public can view exchange rates" 
  ON public.exchange_rates 
  FOR SELECT 
  USING (true);

-- Create policy for edge function to insert/update rates
CREATE POLICY "Edge function can manage exchange rates" 
  ON public.exchange_rates 
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index on date for faster queries
CREATE INDEX idx_exchange_rates_date ON public.exchange_rates (date DESC);
