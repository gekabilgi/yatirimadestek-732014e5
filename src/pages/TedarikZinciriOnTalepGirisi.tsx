
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MainNavbar from '@/components/MainNavbar';
import { FormField } from '@/components/tedarikZinciri/FormField';
import { FileUpload } from '@/components/tedarikZinciri/FileUpload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OnTalepFormData } from '@/types/tedarikZinciri';
import { validateVKN, validatePhone, validateEmail, formatVKN, formatPhone } from '@/utils/tedarikZinciriValidation';

const TedarikZinciriOnTalepGirisi = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<OnTalepFormData>({
    firma_vergi_kimlik_no: '',
    firma_adi: '',
    iletisim_kisi: '',
    unvan: '',
    telefon: '',
    e_posta: '',
    talep_icerigi: ''
  });

  const [selectedFile, setSelectedFile] = useState<File>();
  const [errors, setErrors] = useState<Partial<OnTalepFormData>>({});

  // Check previous submissions
  const checkSpamMutation = useMutation({
    mutationFn: async (vkn: string) => {
      const { data, error } = await supabase.rpc('check_submission_spam', {
        p_identifier: vkn,
        p_submission_type: 'on_talep',
        p_cooldown_minutes: 60
      });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch previous data
  const { data: previousData, refetch: fetchPreviousData } = useQuery({
    queryKey: ['previous-on-talep', formData.firma_vergi_kimlik_no],
    queryFn: async () => {
      if (!validateVKN(formData.firma_vergi_kimlik_no)) return null;
      
      const { data, error } = await supabase
        .from('tedarik_zinciri_on_talep')
        .select('*')
        .eq('firma_vergi_kimlik_no', formData.firma_vergi_kimlik_no)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: false
  });

  // Submit form
  const submitMutation = useMutation({
    mutationFn: async (data: OnTalepFormData & { file?: File }) => {
      // Check spam first
      const isSpam = await checkSpamMutation.mutateAsync(data.firma_vergi_kimlik_no);
      if (isSpam) {
        throw new Error('Son başvurunuzdan sonra 1 saat beklemeniz gerekmektedir.');
      }

      // Insert form data
      const { data: insertData, error: insertError } = await supabase
        .from('tedarik_zinciri_on_talep')
        .insert({
          firma_vergi_kimlik_no: data.firma_vergi_kimlik_no,
          firma_adi: data.firma_adi,
          iletisim_kisi: data.iletisim_kisi,
          unvan: data.unvan || null,
          telefon: data.telefon,
          e_posta: data.e_posta,
          talep_icerigi: data.talep_icerigi
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Record submission to prevent spam
      await supabase.rpc('record_submission', {
        p_identifier: data.firma_vergi_kimlik_no,
        p_submission_type: 'on_talep'
      });

      // TODO: Handle file upload and compression to .rar format
      // TODO: Send email notification

      return insertData;
    },
    onSuccess: (data) => {
      toast({
        title: "Başarılı",
        description: "Ön talebiniz başarıyla gönderildi."
      });
      navigate(`/tedarik-zinciri-yerlilestirme-on-talep-basarili?id=${data.id}`);
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
    const newErrors: Partial<OnTalepFormData> = {};

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

    submitMutation.mutate({ ...formData, file: selectedFile });
  };

  const handleFetchPrevious = () => {
    if (!validateVKN(formData.firma_vergi_kimlik_no)) {
      toast({
        title: "Hata",
        description: "Önce geçerli bir vergi kimlik numarası giriniz",
        variant: "destructive"
      });
      return;
    }
    fetchPreviousData();
  };

  const fillFormWithPreviousData = () => {
    if (previousData) {
      setFormData({
        firma_vergi_kimlik_no: previousData.firma_vergi_kimlik_no,
        firma_adi: previousData.firma_adi,
        iletisim_kisi: previousData.iletisim_kisi,
        unvan: previousData.unvan || '',
        telefon: previousData.telefon,
        e_posta: previousData.e_posta,
        talep_icerigi: ''
      });
      toast({
        title: "Bilgiler Getirildi",
        description: "Önceki bilgileriniz forma dolduruldu"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Tedarik Zinciri Yerlileştirme Ön Talep Girişi
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormField
                label="Firma Vergi Kimlik No"
                name="firma_vergi_kimlik_no"
                value={formData.firma_vergi_kimlik_no}
                onChange={(value) => setFormData(prev => ({ ...prev, firma_vergi_kimlik_no: formatVKN(value) }))}
                error={errors.firma_vergi_kimlik_no}
                placeholder="10 veya 11 haneli vergi kimlik numarası"
                maxLength={11}
                required
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFetchPrevious}
                  disabled={!validateVKN(formData.firma_vergi_kimlik_no)}
                >
                  Önceki Bilgilerimi Getir
                </Button>
                {previousData && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={fillFormWithPreviousData}
                  >
                    Bilgileri Doldur
                  </Button>
                )}
              </div>

              <FormField
                label="Firma Adı"
                name="firma_adi"
                value={formData.firma_adi}
                onChange={(value) => setFormData(prev => ({ ...prev, firma_adi: value }))}
                error={errors.firma_adi}
                required
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
                <label className="block text-sm font-medium mb-2">Dosya Yükle (Opsiyonel)</label>
                <FileUpload
                  onFileSelect={setSelectedFile}
                  onFileRemove={() => setSelectedFile(undefined)}
                  selectedFile={selectedFile}
                  disabled={submitMutation.isPending}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? 'Gönderiliyor...' : 'Gönder'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TedarikZinciriOnTalepGirisi;
