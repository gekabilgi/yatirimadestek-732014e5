
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { FormField } from '@/components/tedarikZinciri/FormField';
import { FileUpload } from '@/components/tedarikZinciri/FileUpload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TedarikZinciriOnTalep, OnTalepFormData } from '@/types/tedarikZinciri';
import { validateVKN, validatePhone, validateEmail, formatVKN, formatPhone } from '@/utils/tedarikZinciriValidation';

const AdminTZOnTalepDuzenle = () => {
  const { vkn } = useParams<{ vkn: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<OnTalepFormData & { firma_kisa_adi: string }>({
    firma_vergi_kimlik_no: '',
    firma_adi: '',
    iletisim_kisi: '',
    unvan: '',
    telefon: '',
    e_posta: '',
    talep_icerigi: '',
    firma_kisa_adi: ''
  });

  const [logoFile, setLogoFile] = useState<File>();
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string>('');
  const [errors, setErrors] = useState<Partial<OnTalepFormData & { firma_kisa_adi: string }>>({});

  // Fetch existing data
  const { data: onTalepData, isLoading } = useQuery({
    queryKey: ['admin-on-talep-edit', vkn],
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

  // Update form when data loads
  useEffect(() => {
    if (onTalepData) {
      setFormData({
        firma_vergi_kimlik_no: onTalepData.firma_vergi_kimlik_no,
        firma_adi: onTalepData.firma_adi,
        iletisim_kisi: onTalepData.iletisim_kisi,
        unvan: onTalepData.unvan || '',
        telefon: onTalepData.telefon,
        e_posta: onTalepData.e_posta,
        talep_icerigi: onTalepData.talep_icerigi,
        firma_kisa_adi: onTalepData.firma_kisa_adi || ''
      });
      setCurrentLogoUrl(onTalepData.logo_url || '');
    }
  }, [onTalepData]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { logo?: File }) => {
      if (!onTalepData) throw new Error('No data to update');

      let logoUrl = currentLogoUrl;
      
      // Handle logo upload if new file selected
      if (data.logo) {
        const fileExt = data.logo.name.split('.').pop();
        const fileName = `logo-${onTalepData.id}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('program-files')
          .upload(fileName, data.logo, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('program-files')
          .getPublicUrl(fileName);

        logoUrl = publicUrl;
      }

      const { error } = await supabase
        .from('tedarik_zinciri_on_talep')
        .update({
          firma_adi: data.firma_adi,
          iletisim_kisi: data.iletisim_kisi,
          unvan: data.unvan || null,
          telefon: data.telefon,
          e_posta: data.e_posta,
          talep_icerigi: data.talep_icerigi,
          firma_kisa_adi: data.firma_kisa_adi || null,
          logo_url: logoUrl || null
        })
        .eq('id', onTalepData.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Ön talep başarıyla güncellendi."
      });
      queryClient.invalidateQueries({ queryKey: ['admin-on-talep-list'] });
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
    const newErrors: Partial<typeof formData> = {};

    if (!validateVKN(formData.firma_vergi_kimlik_no)) {
      newErrors.firma_vergi_kimlik_no = 'Geçerli bir vergi kimlik numarası giriniz (10-11 haneli)';
    }
    if (!formData.firma_adi.trim()) {
      newErrors.firma_adi = 'Firma adı zorunludur';
    }
    if (!formData.iletisim_kisi.trim()) {
      newErrors.iletisim_kisi = 'İletişim kişisi zorunludur';
    }
    if (!validatePhone(formData.telefon)) {
      newErrors.telefon = 'Geçerli bir telefon numarası giriniz (0 olmadan)';
    }
    if (!validateEmail(formData.e_posta)) {
      newErrors.e_posta = 'Geçerli bir e-posta adresi giriniz';
    }
    if (formData.firma_kisa_adi && formData.firma_kisa_adi.length > 40) {
      newErrors.firma_kisa_adi = 'Firma kısa adı 40 karakterden fazla olamaz';
    }
    if (!formData.talep_icerigi.trim()) {
      newErrors.talep_icerigi = 'Talep içeriği zorunludur';
    }
    if (formData.talep_icerigi.length > 1000) {
      newErrors.talep_icerigi = 'Talep içeriği 1000 karakterden fazla olamaz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    updateMutation.mutate({ ...formData, logo: logoFile });
  };

  const handleAddProduct = () => {
    if (onTalepData) {
      navigate(`/admin/tzurunilanekle-${onTalepData.firma_vergi_kimlik_no}`);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ön Talep Düzenle</h1>
            <p className="text-gray-600">VKN: {onTalepData.firma_vergi_kimlik_no}</p>
          </div>
          <Button onClick={handleAddProduct} className="bg-green-600 hover:bg-green-700">
            Yeni Ürün Ekle
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Firma Bilgileri</CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormField
                label="Firma Vergi Kimlik No"
                name="firma_vergi_kimlik_no"
                value={formData.firma_vergi_kimlik_no}
                onChange={(value) => setFormData(prev => ({ ...prev, firma_vergi_kimlik_no: formatVKN(value) }))}
                error={errors.firma_vergi_kimlik_no}
                disabled={true}
                required
              />

              <FormField
                label="Firma Adı"
                name="firma_adi"
                value={formData.firma_adi}
                onChange={(value) => setFormData(prev => ({ ...prev, firma_adi: value }))}
                error={errors.firma_adi}
                required
              />

              <FormField
                label="Firma Kısa Adı"
                name="firma_kisa_adi"
                value={formData.firma_kisa_adi}
                onChange={(value) => setFormData(prev => ({ ...prev, firma_kisa_adi: value }))}
                error={errors.firma_kisa_adi}
                maxLength={40}
                placeholder="Maksimum 40 karakter"
              />

              <FormField
                label="İletişim Kişisi"
                name="iletisim_kisi"
                value={formData.iletisim_kisi}
                onChange={(value) => setFormData(prev => ({ ...prev, iletisim_kisi: value }))}
                error={errors.iletisim_kisi}
                required
              />

              <FormField
                label="Unvan"
                name="unvan"
                value={formData.unvan}
                onChange={(value) => setFormData(prev => ({ ...prev, unvan: value }))}
                error={errors.unvan}
              />

              <FormField
                label="Telefon"
                name="telefon"
                type="tel"
                value={formData.telefon}
                onChange={(value) => setFormData(prev => ({ ...prev, telefon: formatPhone(value) }))}
                error={errors.telefon}
                placeholder="5XX XXX XX XX (0 olmadan)"
                maxLength={10}
                required
              />

              <FormField
                label="E-Posta"
                name="e_posta"
                type="email"
                value={formData.e_posta}
                onChange={(value) => setFormData(prev => ({ ...prev, e_posta: value }))}
                error={errors.e_posta}
                required
              />

              <FormField
                label="Talep İçeriği"
                name="talep_icerigi"
                type="textarea"
                value={formData.talep_icerigi}
                onChange={(value) => setFormData(prev => ({ ...prev, talep_icerigi: value }))}
                error={errors.talep_icerigi}
                placeholder="Talebinizi detaylı olarak açıklayınız..."
                maxLength={1000}
                showCounter
                required
              />

              <div>
                <label className="block text-sm font-medium mb-2">
                  Firma Logosu
                  <span className="text-gray-500 ml-1">(Maksimum 3MB, JPG/PNG/SVG)</span>
                </label>
                {currentLogoUrl && (
                  <div className="mb-3">
                    <img 
                      src={currentLogoUrl} 
                      alt="Mevcut Logo" 
                      className="w-20 h-20 object-contain border border-gray-300 rounded"
                    />
                    <p className="text-sm text-gray-500 mt-1">Mevcut logo</p>
                  </div>
                )}
                <FileUpload
                  onFileSelect={setLogoFile}
                  onFileRemove={() => setLogoFile(undefined)}
                  selectedFile={logoFile}
                  disabled={updateMutation.isPending}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Güncelleniyor...' : 'Güncelle'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/tzontaleplistesi')}
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

export default AdminTZOnTalepDuzenle;
