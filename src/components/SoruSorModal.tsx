import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PROVINCES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin',
  'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa',
  'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkâri', 'Hatay', 'Isparta',
  'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir',
  'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla',
  'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt',
  'Sinop', 'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak',
  'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman',
  'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
];

const SoruSorModal = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    province: '',
    question: '',
    kvkkAccepted: false
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.kvkkAccepted) {
      toast.error('KVKK sözleşmesini kabul etmeniz gerekmektedir.');
      return;
    }

    if (!formData.fullName || !formData.email || !formData.province || !formData.question) {
      toast.error('Lütfen tüm zorunlu alanları doldurunuz.');
      return;
    }

    setLoading(true);

    try {
      // Use the edge function to submit the question to bypass RLS
      const { data, error } = await supabase.functions.invoke('send-qna-notifications', {
        body: {
          type: 'submit_question',
          questionData: {
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone || null,
            province: formData.province,
            question: formData.question
          }
        }
      });

      if (error) throw error;

      toast.success('Sorunuz başarıyla gönderildi. En kısa sürede yanıtlanacaktır.');
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        province: '',
        question: '',
        kvkkAccepted: false
      });
      setOpen(false);
    } catch (error) {
      console.error('Error submitting question:', error);
      toast.error('Soru gönderilirken bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="lg"
          className="px-8 py-3 text-lg"
        >
          <MessageSquare className="mr-2 h-5 w-5" />
          Soru Sor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Yatırım Desteği Hakkında Soru Sor</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Ad Soyad *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Adınızı ve soyadınızı giriniz"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-posta Adresi *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="ornek@email.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon Numarası</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="05XX XXX XX XX"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="province">İl *</Label>
              <Select value={formData.province} onValueChange={(value) => handleInputChange('province', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="İl seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question">Sorunuz *</Label>
            <Textarea
              id="question"
              value={formData.question}
              onChange={(e) => handleInputChange('question', e.target.value)}
              placeholder="Yatırım destekleri hakkında merak ettiğiniz konuları detaylı bir şekilde yazınız..."
              rows={6}
              required
            />
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="kvkk"
              checked={formData.kvkkAccepted}
              onCheckedChange={(checked) => handleInputChange('kvkkAccepted', checked === true)}
            />
            <Label htmlFor="kvkk" className="text-sm leading-5">
              Kişisel verilerimin işlenmesine yönelik{' '}
              <a href="#" className="text-primary underline">
                KVKK Aydınlatma Metni
              </a>
              'ni okudum ve kabul ediyorum. *
            </Label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                "Gönderiliyor..."
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Soruyu Gönder
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SoruSorModal;
