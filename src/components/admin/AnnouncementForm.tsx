import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AnnouncementFormData } from '@/types/announcement';
import { institutionLogos } from '@/data/institutionLogos';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AnnouncementFormProps {
  initialData?: Partial<AnnouncementFormData>;
  onSubmit: (data: AnnouncementFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const AnnouncementForm: React.FC<AnnouncementFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading
}) => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AnnouncementFormData>({
    defaultValues: {
      institution_logo: initialData?.institution_logo || '',
      institution_name: initialData?.institution_name || '',
      title: initialData?.title || '',
      detail: initialData?.detail || '',
      announcement_date: initialData?.announcement_date || new Date().toISOString().split('T')[0],
      external_link: initialData?.external_link || '',
      is_active: initialData?.is_active ?? true,
      display_order: initialData?.display_order ?? 0,
    }
  });

  const selectedLogo = watch('institution_logo');
  const isActive = watch('is_active');
  const announcementDate = watch('announcement_date');

  const handleLogoChange = (logoPath: string) => {
    setValue('institution_logo', logoPath);
    const institution = institutionLogos.find(i => i.logoPath === logoPath);
    if (institution) {
      setValue('institution_name', institution.name);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="institution_logo">Kurum Logosu *</Label>
        <Select value={selectedLogo} onValueChange={handleLogoChange}>
          <SelectTrigger>
            <SelectValue placeholder="Kurum seçiniz" />
          </SelectTrigger>
          <SelectContent>
            {institutionLogos.map((institution) => (
              <SelectItem key={institution.id} value={institution.logoPath}>
                <div className="flex items-center gap-2">
                  <img src={institution.logoPath} alt={institution.name} className="w-6 h-6 object-contain" />
                  <span>{institution.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.institution_logo && <p className="text-sm text-destructive">Kurum logosu gereklidir</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="institution_name">Kurum Adı</Label>
        <Input
          id="institution_name"
          {...register('institution_name')}
          readOnly
          className="bg-muted"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Duyuru Başlığı *</Label>
        <Input
          id="title"
          {...register('title', {
            required: 'Başlık gereklidir',
            minLength: { value: 10, message: 'Başlık en az 10 karakter olmalıdır' },
            maxLength: { value: 200, message: 'Başlık en fazla 200 karakter olabilir' }
          })}
          placeholder="Örn: İPARD III (2021-2027) Onuncu Başvuru Çağrı Dönemi İlan Edilmiştir"
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="detail">Duyuru Detayı *</Label>
        <Textarea
          id="detail"
          {...register('detail', {
            required: 'Detay gereklidir',
            minLength: { value: 50, message: 'Detay en az 50 karakter olmalıdır' }
          })}
          placeholder="Duyurunun detaylı açıklaması..."
          rows={6}
        />
        {errors.detail && <p className="text-sm text-destructive">{errors.detail.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Duyuru Tarihi *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !announcementDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {announcementDate ? format(new Date(announcementDate), "d MMMM yyyy", { locale: tr }) : <span>Tarih seçiniz</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={announcementDate ? new Date(announcementDate) : undefined}
              onSelect={(date) => setValue('announcement_date', date ? format(date, 'yyyy-MM-dd') : '')}
              disabled={(date) => date > new Date() || date < new Date('2020-01-01')}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="external_link">Harici Link (İsteğe Bağlı)</Label>
        <Input
          id="external_link"
          {...register('external_link', {
            pattern: { value: /^https?:\/\/.+/, message: 'Geçerli bir URL giriniz' }
          })}
          placeholder="https://example.com"
          type="url"
        />
        {errors.external_link && <p className="text-sm text-destructive">{errors.external_link.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="display_order">Görüntülenme Sırası</Label>
        <Input
          id="display_order"
          type="number"
          {...register('display_order', { valueAsNumber: true })}
          placeholder="0"
        />
        <p className="text-sm text-muted-foreground">Düşük sayılar önce görüntülenir</p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_active"
          checked={isActive}
          onCheckedChange={(checked) => setValue('is_active', checked as boolean)}
        />
        <Label htmlFor="is_active" className="cursor-pointer">
          Duyuru Aktif
        </Label>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          İptal
        </Button>
      </div>
    </form>
  );
};
