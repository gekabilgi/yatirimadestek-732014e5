
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { FormField } from '@/components/tedarikZinciri/FormField';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TedarikZinciriOnTalep, UrunTalepFormData } from '@/types/tedarikZinciri';
import { FIRMA_OLCEGI_OPTIONS } from '@/utils/tedarikZinciriValidation';

const AdminTZUrunIlanEkle = () => {
  const { vkn, productId } = useParams<{ vkn: string; productId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<UrunTalepFormData>({
    urun_grubu_adi: '',
    basvuru_son_tarihi: '',
    urun_aciklamasi: '',
    minimum_yerlilik_orani: 0,
    minimum_deneyim: 0,
    firma_olcegi: 'Mikro'
  });

  const [errors, setErrors] = useState<Partial<UrunTalepFormData>>({});

  // Fetch on_talep data
  const { data: onTalepData } = useQuery({
    queryKey: ['admin-on-talep', vkn],
    queryFn: async () => {
      if (!vkn) throw new Error('VKN parameter missing');
      
      const { data, error } = await supabase
        .from('tedarik_zinciri_on_talep')
        .select('*')
        .eq('firma_vergi_kimlik_no', vkn)
        .single();

      if (error) throw error;
      return data as TedarikZinciriOnTalep;
    },
    enabled: !!vkn
  });

  // Fetch existing product data if editing
  const { data: productData } = useQuery({
    queryKey: ['admin-product', productId],
    queryFn: async () => {
      if (!productId) return null;
      
      const { data, error } = await supabase
        .from('tedarik_zinciri_urun_talep')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!productId
  });

  // Update form when product data loads
  useEffect(() => {
    if (productData) {
      setFormData({
        urun_grubu_adi: productData.urun_grubu_adi,
        basvuru_son_tarihi: productData.basvuru_son_tarihi,
        urun_aciklamasi: productData.urun_aciklamasi,
        minimum_yerlilik_orani: productData.minimum_yerlilik_orani,
        minimum_deneyim: productData.minimum_deneyim,
        firma_olcegi: productData.firma_olcegi
      });
    }
  }, [productData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: UrunTalepFormData) => {
      if (!onTalepData) throw new Error('Ön talep bulunamadı');

      if (productId) {
        // Update existing product
        const { error } = await supabase
          .from('tedarik_zinciri_urun_talep')
          .update({
            urun_grubu_adi: data.urun_grubu_adi,
            basvuru_son_tarihi: data.basvuru_son_tarihi,
            urun_aciklamasi: data.urun_aciklamasi,
            minimum_yerlilik_orani: data.minimum_yerlilik_orani,
            minimum_deneyim: data.minimum_deneyim,
            firma_olcegi: data.firma_olcegi
          })
          .eq('id', productId);

        if (error) throw error;
      } else {
        // Create new product
        const { error } = await supabase
          .from('tedarik_zinciri_urun_talep')
          .insert({
            on_talep_id: onTalepData.id,
            urun_grubu_adi: data.urun_grubu_adi,
            basvuru_son_tarihi: data.basvuru_son_tarihi,
            urun_aciklamasi: data.urun_aciklamasi,
            minimum_yerlilik_orani: data.minimum_yerlilik_orani,
            minimum_deneyim: data.minimum_deneyim,
            firma_olcegi: data.firma_olcegi
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: productId ? "Ürün talebi güncellendi." : "Ürün talebi eklendi."
      });
      queryClient.invalidateQueries({ queryKey: ['admin-product-list'] });
      navigate('/admin/tzuruntaleplistesi');
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<UrunTalepFormData> = {};

    if (!formData.urun_grubu_adi.trim()) {
      newErrors.urun_grubu_adi = 'Ürün grubu adı zorunludur';
    }
    if (!formData.basvuru_son_tarihi) {
      newErrors.basvuru_son_tarihi = 'Başvuru son tarihi zorunludur';
    }
    if (!formData.urun_aciklamasi.trim()) {
      newErrors.urun_aciklamasi = 'Ürün açıklaması zorunludur';
    }
    if (formData.urun_aciklamasi.length > 1000) {
      newErrors.urun_aciklamasi = 'Ürün açıklaması 1000 karakterden fazla olamaz';
    }
    if (formData.minimum_yerlilik_orani < 0 || formData.minimum_yerlilik_orani > 100) {
      newErrors.minimum_yerlilik_orani = 'Yerlilik oranı 0-100 arasında olmalıdır';
    }
    if (formData.minimum_deneyim < 0 || formData.minimum_deneyim > 100) {
      newErrors.minimum_deneyim = 'Minimum deneyim 0-100 arasında olmalıdır';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    saveMutation.mutate(formData);
  };

  if (!onTalepData) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <p className="text-red-600">Ön talep bulunamadı</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {productId ? 'Ürün Talebi Düzenle' : 'Yeni Ürün Talebi'}
          </h1>
          <p className="text-gray-600">
            Firma: {onTalepData.firma_adi} | VKN: {onTalepData.firma_vergi_kimlik_no}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ürün Bilgileri</CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormField
                label="Ürün Grubu Adı"
                name="urun_grubu_adi"
                value={formData.urun_grubu_adi}
                onChange={(value) => setFormData(prev => ({ ...prev, urun_grubu_adi: value }))}
                error={errors.urun_grubu_adi}
                required
              />

              <FormField
                label="Başvuru Son Tarihi"
                name="basvuru_son_tarihi"
                type="date"
                value={formData.basvuru_son_tarihi}
                onChange={(value) => setFormData(prev => ({ ...prev, basvuru_son_tarihi: value }))}
                error={errors.basvuru_son_tarihi}
                required
              />

              <FormField
                label="Ürün Açıklaması"
                name="urun_aciklamasi"
                type="textarea"
                value={formData.urun_aciklamasi}
                onChange={(value) => setFormData(prev => ({ ...prev, urun_aciklamasi: value }))}
                error={errors.urun_aciklamasi}
                placeholder="Ürün detaylarını açıklayınız..."
                maxLength={1000}
                showCounter
                required
              />

              <FormField
                label="Minimum Yerlilik Oranı (%)"
                name="minimum_yerlilik_orani"
                type="number"
                value={formData.minimum_yerlilik_orani}
                onChange={(value) => setFormData(prev => ({ ...prev, minimum_yerlilik_orani: parseInt(value) || 0 }))}
                error={errors.minimum_yerlilik_orani}
                placeholder="0-100 arası"
                required
              />

              <FormField
                label="Minimum Deneyim (Yıl)"
                name="minimum_deneyim"
                type="number"
                value={formData.minimum_deneyim}
                onChange={(value) => setFormData(prev => ({ ...prev, minimum_deneyim: parseInt(value) || 0 }))}
                error={errors.minimum_deneyim}
                placeholder="0-100 arası"
                required
              />

              <FormField
                label="Hedef Firma Ölçeği"
                name="firma_olcegi"
                type="select"
                value={formData.firma_olcegi}
                onChange={(value) => setFormData(prev => ({ ...prev, firma_olcegi: value as typeof formData.firma_olcegi }))}
                error={errors.firma_olcegi}
                options={[...FIRMA_OLCEGI_OPTIONS]}
                required
              />

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/tzuruntaleplistesi')}
                >
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminTZUrunIlanEkle;
