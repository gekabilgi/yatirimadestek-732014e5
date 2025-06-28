
-- Drop both existing tables
DROP TABLE IF EXISTS public.sector_search CASCADE;
DROP TABLE IF EXISTS public.sector_search1 CASCADE;

-- Create a fresh sector_search table with proper structure
CREATE TABLE public.sector_search (
  id SERIAL PRIMARY KEY,
  nace_kodu TEXT NOT NULL,
  sektor TEXT NOT NULL,
  hedef_yatirim BOOLEAN DEFAULT false,
  oncelikli_yatirim BOOLEAN DEFAULT false,
  yuksek_teknoloji BOOLEAN DEFAULT false,
  orta_yuksek_teknoloji BOOLEAN DEFAULT false,
  sartlar TEXT,
  bolge_1 BIGINT,
  bolge_2 BIGINT,
  bolge_3 BIGINT,
  bolge_4 BIGINT,
  bolge_5 BIGINT,
  bolge_6 BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better search performance
CREATE INDEX idx_sector_search_nace_kodu ON public.sector_search(nace_kodu);
CREATE INDEX idx_sector_search_sektor ON public.sector_search(sektor);

-- Add some sample data for testing (you can remove this after adding real data)
INSERT INTO public.sector_search (nace_kodu, sektor, hedef_yatirim, oncelikli_yatirim, yuksek_teknoloji, orta_yuksek_teknoloji, sartlar, bolge_1, bolge_2, bolge_3, bolge_4, bolge_5, bolge_6) VALUES
('05.10.01', 'Taş kömürü madenciliği', false, false, false, false, null, 500000, 300000, 200000, 150000, 100000, 50000),
('13.10.01', 'Pamuklu dokuma sanayii', true, false, false, false, 'Minimum 10 milyon TL yatırım', 2000000, 1500000, 1000000, 750000, 500000, 250000),
('26.11.01', 'Elektronik devre kartları imalatı', false, false, true, false, null, 1000000, 750000, 500000, 375000, 250000, 125000);
