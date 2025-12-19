-- Kirli cache verilerini temizle (İlgili Bilgiler, Grafit, Alternatif gibi içerikler)
DELETE FROM question_cache 
WHERE response_text LIKE '%İlgili Bilgiler%'
   OR response_text LIKE '%Grafit Zenginleştirme%'
   OR response_text LIKE '%Alternatif:%'
   OR response_text LIKE '%Çay Atıklarından Aktif Karbon%'
   OR response_text LIKE '%Su Paketleme Tesisi%'
   OR response_text LIKE '%Deri İşleme%'
   OR response_text LIKE '%Sentetik Kâğıt%'
   OR response_text LIKE '%Taş Kâğıt%';

-- İleride kirli cache girişlerini engellemek için kontrol eklenecek (kod tarafında)