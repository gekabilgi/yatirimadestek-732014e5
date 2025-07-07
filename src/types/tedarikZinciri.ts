
export interface TedarikZinciriOnTalep {
  id: number;
  firma_vergi_kimlik_no: string;
  firma_adi: string;
  iletisim_kisi: string;
  unvan?: string;
  telefon: string;
  e_posta: string;
  talep_icerigi: string;
  firma_kisa_adi?: string;
  logo_url?: string;
  dokuman_url?: string;
  created_at: string;
  updated_at: string;
  random_string: string;
}

export interface TedarikZinciriUrunTalep {
  id: number;
  on_talep_id: number;
  urun_grubu_adi: string;
  basvuru_son_tarihi: string;
  urun_aciklamasi: string;
  minimum_yerlilik_orani: number;
  minimum_deneyim: number;
  firma_olcegi: 'Mikro' | 'Küçük' | 'Orta' | 'Büyük';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TedarikZinciriTedarikciBasvuru {
  id: number;
  urun_talep_id: number;
  firma_vergi_kimlik_no: string;
  firma_adi: string;
  iletisim_kisi: string;
  unvan?: string;
  telefon: string;
  e_posta: string;
  il: string;
  firma_olcegi: 'Mikro' | 'Küçük' | 'Orta' | 'Büyük';
  talep_icerigi: string;
  dokuman_url?: string;
  created_at: string;
}

export interface OnTalepFormData {
  firma_vergi_kimlik_no: string;
  firma_adi: string;
  iletisim_kisi: string;
  unvan: string;
  telefon: string;
  e_posta: string;
  talep_icerigi: string;
}

export interface TedarikciBasvuruFormData {
  firma_vergi_kimlik_no: string;
  firma_adi: string;
  iletisim_kisi: string;
  unvan: string;
  telefon: string;
  e_posta: string;
  il: string;
  firma_olcegi: 'Mikro' | 'Küçük' | 'Orta' | 'Büyük';
  talep_icerigi: string;
}

export interface UrunTalepFormData {
  urun_grubu_adi: string;
  basvuru_son_tarihi: string;
  urun_aciklamasi: string;
  minimum_yerlilik_orani: number;
  minimum_deneyim: number;
  firma_olcegi: 'Mikro' | 'Küçük' | 'Orta' | 'Büyük';
}
