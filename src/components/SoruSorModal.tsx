import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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

interface SoruSorModalProps {
  trigger?: React.ReactNode;
}

const SoruSorModal = ({ trigger }: SoruSorModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, session } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    province: undefined as string | undefined,
    question: '',
    kvkkAccepted: false
  });

  // Auto-fill authenticated user's email if available
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

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
      // Check for spam submissions
      const { data: spamCheck } = await supabase.rpc('check_submission_spam', {
        p_identifier: formData.email,
        p_submission_type: 'qna_submission',
        p_cooldown_minutes: 60
      });

      if (spamCheck) {
        toast.error('Çok sık soru gönderiyorsunuz. Lütfen 1 saat bekleyip tekrar deneyin.');
        setLoading(false);
        return;
      }

      // Insert the question directly - RLS will enforce user ownership
      const { error: insertError } = await supabase
        .from('soru_cevap')
        .insert({
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          province: formData.province,
          question: formData.question,
          category: null,
          answered: false,
          sent_to_ydo: false,
          sent_to_user: false
        });

      if (insertError) {
        console.error('Error inserting question:', insertError);
        toast.error('Soru gönderilirken bir hata oluştu. Lütfen tekrar deneyiniz.');
        return;
      }

      // Record the submission for spam prevention
      await supabase.rpc('record_submission', {
        p_identifier: formData.email,
        p_submission_type: 'qna_submission'
      });

      // Send notifications via edge function
      const { error: emailError } = await supabase.functions.invoke('send-qna-notifications', {
        body: {
          type: 'submit_question',
          questionData: {
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone || '',
            province: formData.province,
            question: formData.question
          }
        }
      });

      if (emailError) {
        console.error('Error sending email notifications:', emailError);
        // Don't show error to user as question was saved successfully
      }

      toast.success('Sorunuz başarıyla gönderildi. En kısa sürede yanıtlanacaktır.');
      setFormData({
        fullName: '',
        email: user?.email || '',
        phone: '',
        province: undefined,
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

  const defaultTrigger = (
    <Button 
      size="lg"
      className="px-10 py-5 text-xl bg-gradient-to-r from-primary to-blue-600 
                 hover:from-primary/90 hover:to-blue-500 
                 shadow-lg hover:shadow-xl 
                 animate-chatbot-pulse
                 transition-all duration-300
                 group"
    >
      <MessageSquare className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
      Soru Sor
      <span className="ml-2 inline-flex items-center justify-center px-2.5 py-1 
                       text-sm font-semibold bg-white/20 rounded-full">
        Uzman
      </span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Yatırım Desteği Hakkında Soru Sor</DialogTitle>
        </DialogHeader>
        
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                disabled={!!user}
                className={user ? "bg-muted" : ""}
              />
              {user && (
                <p className="text-xs text-muted-foreground">
                  Giriş yaptığınız e-posta adresi otomatik olarak kullanılmaktadır.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
              <Select 
                value={formData.province} 
                onValueChange={(value) => handleInputChange('province', value)}
              >
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
            <Label htmlFor="kvkk" className="text-xs sm:text-sm leading-5">
              Kişisel verilerimin işlenmesine yönelik{' '}
              <a href="#" className="text-primary underline">
                KVKK Aydınlatma Metni
              </a>
              'ni okudum ve kabul ediyorum. *
            </Label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 h-11"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-11"
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