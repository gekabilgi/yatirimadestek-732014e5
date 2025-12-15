import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PROVINCES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin',
  'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa',
  'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Isparta',
  'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir',
  'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla',
  'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop',
  'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van',
  'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman', 'Şırnak',
  'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
];

export const NewsletterSubscribeForm = () => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    ad: '',
    soyad: '',
    telefon: '',
    email: '',
    il: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.ad || !formData.soyad || !formData.email || !formData.il) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('bulten_uyeler')
        .insert({
          ad: formData.ad,
          soyad: formData.soyad,
          telefon: formData.telefon || null,
          email: formData.email,
          il: formData.il
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Bu e-posta adresi zaten kayıtlı');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Bülten kaydınız başarıyla oluşturuldu!');
      setFormData({ ad: '', soyad: '', telefon: '', email: '', il: '' });
      setOpen(false);
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Kayıt sırasında bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-primary/10 hover:bg-primary/20 border-primary/30">
          <Bell className="w-4 h-4" />
          Desteklerden Haberdar Ol
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Destek Bülteni Aboneliği
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ad">Adı *</Label>
              <Input
                id="ad"
                value={formData.ad}
                onChange={(e) => setFormData(prev => ({ ...prev, ad: e.target.value }))}
                placeholder="Adınız"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="soyad">Soyadı *</Label>
              <Input
                id="soyad"
                value={formData.soyad}
                onChange={(e) => setFormData(prev => ({ ...prev, soyad: e.target.value }))}
                placeholder="Soyadınız"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">E-posta *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="ornek@email.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="telefon">Telefon</Label>
            <Input
              id="telefon"
              value={formData.telefon}
              onChange={(e) => setFormData(prev => ({ ...prev, telefon: e.target.value }))}
              placeholder="05XX XXX XX XX"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="il">İl *</Label>
            <Select
              value={formData.il}
              onValueChange={(value) => setFormData(prev => ({ ...prev, il: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="İl seçiniz" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {PROVINCES.map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              'Abone Ol'
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            Destek programları ve duyurular hakkında bilgilendirileceksiniz.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};
