import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Save, ArrowLeft } from 'lucide-react';

interface PreRequest {
  id: string;
  on_request_id: string;
  firma_adi: string;
  vergi_kimlik_no: string;
}

interface ProductData {
  id?: string;
  pre_request_id: string;
  urun_grubu_adi: string;
  urun_aciklamasi: string;
  basvuru_son_tarihi: string;
  minimum_yerlilik_orani: number;
  minimum_deneyim: number;
  firma_olcegi: string;
}

const TZYProductAdd = () => {
  const { taxId } = useParams<{ taxId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [preRequest, setPreRequest] = useState<PreRequest | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [formData, setFormData] = useState<ProductData>({
    pre_request_id: '',
    urun_grubu_adi: '',
    urun_aciklamasi: '',
    basvuru_son_tarihi: '',
    minimum_yerlilik_orani: 50,
    minimum_deneyim: 3,
    firma_olcegi: ''
  });

  const [characterCount, setCharacterCount] = useState({
    urun_grubu_adi: 0,
    urun_aciklamasi: 0
  });

  useEffect(() => {
    if (location.state?.preRequest) {
      setPreRequest(location.state.preRequest);
      setFormData(prev => ({ ...prev, pre_request_id: location.state.preRequest.id }));
    } else if (location.state?.product) {
      // Edit mode
      const product = location.state.product;
      setIsEditMode(true);
      setFormData(product);
      setCharacterCount({
        urun_grubu_adi: product.urun_grubu_adi.length,
        urun_aciklamasi: product.urun_aciklamasi.length
      });
      if (location.state.preRequest) {
        setPreRequest(location.state.preRequest);
      }
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
        .select('id, on_request_id, firma_adi, vergi_kimlik_no')
        .eq('on_request_id', taxId)
        .single();

      if (error) throw error;
      if (data) {
        setPreRequest(data);
        setFormData(prev => ({ ...prev, pre_request_id: data.id }));
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

  const handleInputChange = (field: keyof ProductData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'urun_grubu_adi' || field === 'urun_aciklamasi') {
      setCharacterCount(prev => ({
        ...prev,
        [field]: String(value).length
      }));
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.urun_grubu_adi.trim()) {
      toast({
        title: "Hata",
        description: "Ürün/Ürün Grubu Adı gereklidir.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.urun_aciklamasi.trim()) {
      toast({
        title: "Hata",
        description: "Ürün Açıklaması gereklidir.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.basvuru_son_tarihi) {
      toast({
        title: "Hata",
        description: "Başvuru Son Tarihi gereklidir.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const productData = {
        pre_request_id: formData.pre_request_id,
        urun_grubu_adi: formData.urun_grubu_adi,
        urun_aciklamasi: formData.urun_aciklamasi,
        basvuru_son_tarihi: formData.basvuru_son_tarihi,
        minimum_yerlilik_orani: formData.minimum_yerlilik_orani || 50,
        minimum_deneyim: formData.minimum_deneyim || 3,
        firma_olcegi: formData.firma_olcegi || 'Küçük'
      };

      let error;
      if (isEditMode && formData.id) {
        ({ error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', formData.id));
      } else {
        ({ error } = await supabase
          .from('products')
          .insert([productData]));
      }

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: `Ürün başarıyla ${isEditMode ? 'güncellendi' : 'eklendi'}.`,
      });
      
      navigate('/admin/tzyutl');
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Hata",
        description: `Ürün ${isEditMode ? 'güncellenirken' : 'eklenirken'} bir hata oluştu.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateTimeForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6  mt-16">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/tzyutl')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Geri Dön</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {preRequest?.firma_adi} - Tedarik Zinciri Yerlileştirme Ürün {isEditMode ? 'Düzenle' : 'Ekleme'}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode ? 'Ürün bilgilerini güncelleyin' : 'Yeni ürün talep bilgilerini girin'}
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Ürün Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pre_request_id">Ön Talep ID</Label>
                <Input
                  id="pre_request_id"
                  value={preRequest?.on_request_id || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div>
                <Label htmlFor="urun_grubu_adi">
                  Ürün / Ürün Grubu Adı * ({characterCount.urun_grubu_adi}/255)
                </Label>
                <Input
                  id="urun_grubu_adi"
                  value={formData.urun_grubu_adi}
                  onChange={(e) => {
                    if (e.target.value.length <= 255) {
                      handleInputChange('urun_grubu_adi', e.target.value);
                    }
                  }}
                  maxLength={255}
                  placeholder="Ürün veya ürün grubu adını girin"
                  required
                />
              </div>

              <div>
                <Label htmlFor="basvuru_son_tarihi">Başvuru Son Tarihi *</Label>
                <Input
                  id="basvuru_son_tarihi"
                  type="datetime-local"
                  value={formatDateTimeForInput(formData.basvuru_son_tarihi)}
                  onChange={(e) => handleInputChange('basvuru_son_tarihi', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="urun_aciklamasi">
                  Ürün Açıklaması * ({characterCount.urun_aciklamasi}/1000)
                </Label>
                <Textarea
                  id="urun_aciklamasi"
                  value={formData.urun_aciklamasi}
                  onChange={(e) => {
                    if (e.target.value.length <= 1000) {
                      handleInputChange('urun_aciklamasi', e.target.value);
                    }
                  }}
                  maxLength={1000}
                  rows={5}
                  placeholder="Ürün gereksinimleri, kullanım alanları, teknolojik açıklama, standartlar, malzeme kaliteleri vb."
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gereksinimler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="minimum_yerlilik_orani">
                  Minimum Sertifikalı Yerli İçerik Oranı (%)
                </Label>
                <Input
                  id="minimum_yerlilik_orani"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.minimum_yerlilik_orani}
                  onChange={(e) => handleInputChange('minimum_yerlilik_orani', parseInt(e.target.value) || 0)}
                  placeholder="0-100 arası değer"
                />
              </div>

              <div>
                <Label htmlFor="minimum_deneyim">
                  Tedarikçi Minimum Deneyim (Yıl)
                </Label>
                <Input
                  id="minimum_deneyim"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.minimum_deneyim}
                  onChange={(e) => handleInputChange('minimum_deneyim', parseInt(e.target.value) || 0)}
                  placeholder="0-100 arası değer"
                />
              </div>

              <div>
                <Label htmlFor="firma_olcegi">Minimum Arzu Edilen Firma Büyüklüğü</Label>
                <Select
                  value={formData.firma_olcegi}
                  onValueChange={(value) => handleInputChange('firma_olcegi', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Firma büyüklüğü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mikro">Mikro</SelectItem>
                    <SelectItem value="Küçük">Küçük</SelectItem>
                    <SelectItem value="Orta">Orta</SelectItem>
                    <SelectItem value="Büyük">Büyük</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
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
            <span>{isEditMode ? 'Güncelle' : 'Kaydet'}</span>
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TZYProductAdd;