import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Upload, Save, Plus, Building2 } from 'lucide-react';

interface PreRequest {
  id: string;
  on_request_id: string;
  firma_adi: string;
  unvan: string;
  vergi_kimlik_no: string;
  iletisim_kisisi: string;
  telefon: string;
  e_posta: string;
  talep_icerigi: string;
  status: string;
  firma_kisa_adi: string;
  logo_url: string;
}

const TZYCompanyEdit = () => {
  const { taxId } = useParams<{ taxId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  
  const [formData, setFormData] = useState<PreRequest>({
    id: '',
    on_request_id: '',
    firma_adi: '',
    unvan: '',
    vergi_kimlik_no: '',
    iletisim_kisisi: '',
    telefon: '',
    e_posta: '',
    talep_icerigi: '',
    status: '',
    firma_kisa_adi: '',
    logo_url: ''
  });

  useEffect(() => {
    if (location.state?.preRequest) {
      const preRequest = location.state.preRequest;
      setFormData(preRequest);
      setCharacterCount(preRequest.firma_kisa_adi?.length || 0);
    } else if (taxId) {
      fetchPreRequest();
    }
  }, [taxId, location.state]);

  const fetchPreRequest = async () => {
    if (!taxId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pre_requests')
        .select('*')
        .eq('vergi_kimlik_no', taxId)
        .single();

      if (error) throw error;
      if (data) {
        setFormData(data);
        setCharacterCount(data.firma_kisa_adi?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching pre-request:', error);
      toast({
        title: "Hata",
        description: "Firma bilgileri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PreRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'firma_kisa_adi') {
      setCharacterCount(value.length);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Hata",
        description: "Sadece PNG, JPG, JPEG ve SVG dosyaları kabul edilir.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (3MB)
    if (file.size > 3 * 1024 * 1024) {
      toast({
        title: "Hata",
        description: "Dosya boyutu 3MB'dan küçük olmalıdır.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${formData.vergi_kimlik_no}_logo_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('program-files')
        .upload(`company-logos/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('program-files')
        .getPublicUrl(uploadData.path);

      setFormData(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      
      toast({
        title: "Başarılı",
        description: "Logo başarıyla yüklendi.",
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Hata",
        description: "Logo yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('pre_requests')
        .update({
          firma_kisa_adi: formData.firma_kisa_adi,
          logo_url: formData.logo_url,
          firma_adi: formData.firma_adi,
          unvan: formData.unvan,
          iletisim_kisisi: formData.iletisim_kisisi,
          telefon: formData.telefon,
          e_posta: formData.e_posta,
          talep_icerigi: formData.talep_icerigi
        })
        .eq('id', formData.id);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Firma bilgileri başarıyla güncellendi.",
      });
      
      navigate('/admin/tzyotl');
    } catch (error) {
      console.error('Error updating pre-request:', error);
      toast({
        title: "Hata",
        description: "Bilgiler güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    navigate(`/admin/tzyue/${formData.vergi_kimlik_no}`, {
      state: { preRequest: formData }
    });
  };

  if (loading && !formData.id) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Firma Bilgileri Düzenle"
        description="Firma bilgilerini güncelleyin ve ürün ekleme işlemlerine erişin"
        icon={Building2}
      />
      
      <div className="p-6 space-y-6">

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Temel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="on_request_id">Ön Talep ID</Label>
                <Input
                  id="on_request_id"
                  value={formData.on_request_id || 'N/A'}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              
              <div>
                <Label htmlFor="firma_adi">Firma Adı</Label>
                <Input
                  id="firma_adi"
                  value={formData.firma_adi}
                  onChange={(e) => handleInputChange('firma_adi', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="unvan">Ünvan</Label>
                <Input
                  id="unvan"
                  value={formData.unvan}
                  onChange={(e) => handleInputChange('unvan', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="vergi_kimlik_no">Vergi Kimlik No</Label>
                <Input
                  id="vergi_kimlik_no"
                  value={formData.vergi_kimlik_no}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div>
                <Label htmlFor="firma_kisa_adi">
                  Firma Kısa Adı ({characterCount}/40)
                </Label>
                <Input
                  id="firma_kisa_adi"
                  value={formData.firma_kisa_adi}
                  onChange={(e) => {
                    if (e.target.value.length <= 40) {
                      handleInputChange('firma_kisa_adi', e.target.value);
                    }
                  }}
                  maxLength={40}
                  placeholder="Maksimum 40 karakter"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>İletişim Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="iletisim_kisisi">İletişim Kişisi</Label>
                <Input
                  id="iletisim_kisisi"
                  value={formData.iletisim_kisisi}
                  onChange={(e) => handleInputChange('iletisim_kisisi', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="telefon">Telefon</Label>
                <Input
                  id="telefon"
                  value={formData.telefon}
                  onChange={(e) => handleInputChange('telefon', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="e_posta">E-posta</Label>
                <Input
                  id="e_posta"
                  type="email"
                  value={formData.e_posta}
                  onChange={(e) => handleInputChange('e_posta', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="logo_upload">Logo Yükle</Label>
                <div className="space-y-2">
                  <Input
                    id="logo_upload"
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                  />
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG, JPEG, SVG - Maksimum 3MB
                  </p>
                  {formData.logo_url && (
                    <div className="mt-2">
                      <img
                        src={formData.logo_url}
                        alt="Company Logo"
                        className="h-16 w-auto object-contain border rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Talep İçeriği</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="talep_icerigi">Talep İçeriği</Label>
            <Textarea
              id="talep_icerigi"
              value={formData.talep_icerigi}
              onChange={(e) => handleInputChange('talep_icerigi', e.target.value)}
              rows={4}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            onClick={handleAddProduct}
            className="flex items-center space-x-2"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Ürün Ekle</span>
          </Button>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Kaydet</span>
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TZYCompanyEdit;