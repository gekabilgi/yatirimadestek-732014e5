import type { FormBranding, FormSettings, FieldOption, ValidationRules } from '@/types/formBuilder';

interface TemplateField {
  name: string;
  label: string;
  field_type: string;
  is_required: boolean;
  display_order: number;
  placeholder?: string;
  help_text?: string;
  options?: FieldOption[];
  validation_rules?: ValidationRules;
}

export interface FormTemplatePreset {
  id: string;
  name: string;
  description: string;
  category: 'survey' | 'feedback' | 'contact' | 'registration' | 'application';
  categoryLabel: string;
  icon: string;
  fields: TemplateField[];
  branding: Partial<FormBranding>;
  settings?: Partial<FormSettings>;
}

export const FORM_TEMPLATE_PRESETS: FormTemplatePreset[] = [
  {
    id: 'customer-survey',
    name: 'Müşteri Memnuniyet Anketi',
    description: 'Müşteri memnuniyetini ölçmek için profesyonel anket şablonu',
    category: 'survey',
    categoryLabel: 'Anket',
    icon: 'ClipboardList',
    branding: {
      show_header: true,
      header_title: 'MÜŞTERİ',
      header_subtitle: 'MEMNUNİYET ANKETİ',
      accent_color: '#0d9488',
      background_color: '#f0fdfa',
      show_corner_decorations: true,
      show_date_badge: true,
      company_name: 'ŞİRKET ADI',
    },
    fields: [
      {
        name: 'customer_name',
        label: 'Adınız Soyadınız',
        field_type: 'text',
        is_required: true,
        display_order: 1,
        placeholder: 'Tam adınızı giriniz',
      },
      {
        name: 'customer_email',
        label: 'E-posta Adresiniz',
        field_type: 'email',
        is_required: true,
        display_order: 2,
        placeholder: 'ornek@email.com',
      },
      {
        name: 'service_type',
        label: 'Hangi hizmetimizi kullandınız?',
        field_type: 'select',
        is_required: true,
        display_order: 3,
        options: [
          { label: 'Danışmanlık', value: 'consulting' },
          { label: 'Eğitim', value: 'training' },
          { label: 'Teknik Destek', value: 'support' },
          { label: 'Diğer', value: 'other' },
        ],
      },
      {
        name: 'satisfaction_rating',
        label: 'Genel memnuniyet düzeyiniz nedir?',
        field_type: 'radio',
        is_required: true,
        display_order: 4,
        options: [
          { label: 'Çok Memnun', value: '5' },
          { label: 'Memnun', value: '4' },
          { label: 'Orta', value: '3' },
          { label: 'Memnun Değil', value: '2' },
          { label: 'Hiç Memnun Değil', value: '1' },
        ],
      },
      {
        name: 'recommendation',
        label: 'Bizi başkalarına tavsiye eder misiniz?',
        field_type: 'radio',
        is_required: true,
        display_order: 5,
        options: [
          { label: 'Kesinlikle Evet', value: 'definitely' },
          { label: 'Muhtemelen', value: 'probably' },
          { label: 'Emin Değilim', value: 'unsure' },
          { label: 'Hayır', value: 'no' },
        ],
      },
      {
        name: 'comments',
        label: 'Ek görüş ve önerileriniz',
        field_type: 'textarea',
        is_required: false,
        display_order: 6,
        placeholder: 'Deneyiminiz hakkında detaylı bilgi paylaşabilirsiniz...',
      },
    ],
  },
  {
    id: 'feedback-form',
    name: 'Geri Bildirim Formu',
    description: 'Ürün veya hizmet geri bildirimi toplamak için ideal form',
    category: 'feedback',
    categoryLabel: 'Geri Bildirim',
    icon: 'MessageSquare',
    branding: {
      show_header: true,
      header_title: 'GERİ',
      header_subtitle: 'BİLDİRİM FORMU',
      accent_color: '#7c3aed',
      background_color: '#faf5ff',
      show_corner_decorations: true,
      show_date_badge: true,
      company_name: 'ŞİRKET ADI',
    },
    fields: [
      {
        name: 'reviewer_name',
        label: 'Adınız',
        field_type: 'text',
        is_required: true,
        display_order: 1,
      },
      {
        name: 'purchase_date',
        label: 'İşlem Tarihi',
        field_type: 'date',
        is_required: true,
        display_order: 2,
      },
      {
        name: 'product_service',
        label: 'Ürün/Hizmet',
        field_type: 'text',
        is_required: true,
        display_order: 3,
        placeholder: 'Hangi ürün veya hizmet hakkında?',
      },
      {
        name: 'overall_rating',
        label: 'Genel Değerlendirme (1-5)',
        field_type: 'radio',
        is_required: true,
        display_order: 4,
        options: [
          { label: '1 - Çok Kötü', value: '1' },
          { label: '2 - Kötü', value: '2' },
          { label: '3 - Orta', value: '3' },
          { label: '4 - İyi', value: '4' },
          { label: '5 - Çok İyi', value: '5' },
        ],
      },
      {
        name: 'would_recommend',
        label: 'Tavsiye Puanı (1-10)',
        field_type: 'select',
        is_required: true,
        display_order: 5,
        options: Array.from({ length: 10 }, (_, i) => ({
          label: `${i + 1}`,
          value: `${i + 1}`,
        })),
      },
      {
        name: 'detailed_feedback',
        label: 'Detaylı Geri Bildirim',
        field_type: 'textarea',
        is_required: true,
        display_order: 6,
        placeholder: 'Lütfen deneyiminizi detaylı olarak paylaşın...',
      },
    ],
  },
  {
    id: 'contact-form',
    name: 'İletişim Formu',
    description: 'Basit ve etkili iletişim formu şablonu',
    category: 'contact',
    categoryLabel: 'İletişim',
    icon: 'Mail',
    branding: {
      show_header: true,
      header_title: 'BİZE',
      header_subtitle: 'ULAŞIN',
      accent_color: '#2563eb',
      background_color: '#eff6ff',
      show_corner_decorations: true,
      show_date_badge: false,
      company_name: 'ŞİRKET ADI',
    },
    fields: [
      {
        name: 'full_name',
        label: 'Ad Soyad',
        field_type: 'text',
        is_required: true,
        display_order: 1,
      },
      {
        name: 'email',
        label: 'E-posta',
        field_type: 'email',
        is_required: true,
        display_order: 2,
      },
      {
        name: 'phone',
        label: 'Telefon',
        field_type: 'phone',
        is_required: false,
        display_order: 3,
      },
      {
        name: 'subject',
        label: 'Konu',
        field_type: 'select',
        is_required: true,
        display_order: 4,
        options: [
          { label: 'Genel Bilgi', value: 'general' },
          { label: 'Satış', value: 'sales' },
          { label: 'Destek', value: 'support' },
          { label: 'İş Birliği', value: 'partnership' },
          { label: 'Diğer', value: 'other' },
        ],
      },
      {
        name: 'message',
        label: 'Mesajınız',
        field_type: 'textarea',
        is_required: true,
        display_order: 5,
        placeholder: 'Mesajınızı buraya yazın...',
      },
    ],
  },
  {
    id: 'event-registration',
    name: 'Etkinlik Kayıt Formu',
    description: 'Etkinlik, seminer veya eğitim kayıtları için profesyonel form',
    category: 'registration',
    categoryLabel: 'Kayıt',
    icon: 'Calendar',
    branding: {
      show_header: true,
      header_title: 'ETKİNLİK',
      header_subtitle: 'KAYIT FORMU',
      accent_color: '#ea580c',
      background_color: '#fff7ed',
      show_corner_decorations: true,
      show_date_badge: true,
      company_name: 'ORGANİZATÖR',
    },
    fields: [
      {
        name: 'participant_name',
        label: 'Katılımcı Ad Soyad',
        field_type: 'text',
        is_required: true,
        display_order: 1,
      },
      {
        name: 'participant_email',
        label: 'E-posta Adresi',
        field_type: 'email',
        is_required: true,
        display_order: 2,
      },
      {
        name: 'participant_phone',
        label: 'Telefon Numarası',
        field_type: 'phone',
        is_required: true,
        display_order: 3,
      },
      {
        name: 'company',
        label: 'Kurum/Şirket',
        field_type: 'text',
        is_required: false,
        display_order: 4,
      },
      {
        name: 'job_title',
        label: 'Görev/Unvan',
        field_type: 'text',
        is_required: false,
        display_order: 5,
      },
      {
        name: 'session_preference',
        label: 'Tercih Edilen Oturum',
        field_type: 'checkbox',
        is_required: true,
        display_order: 6,
        options: [
          { label: 'Sabah Oturumu (09:00-12:00)', value: 'morning' },
          { label: 'Öğleden Sonra (14:00-17:00)', value: 'afternoon' },
          { label: 'Workshop (17:30-19:00)', value: 'workshop' },
        ],
      },
      {
        name: 'dietary_requirements',
        label: 'Özel Diyet İhtiyacı',
        field_type: 'select',
        is_required: false,
        display_order: 7,
        options: [
          { label: 'Yok', value: 'none' },
          { label: 'Vejetaryen', value: 'vegetarian' },
          { label: 'Vegan', value: 'vegan' },
          { label: 'Glutensiz', value: 'gluten-free' },
          { label: 'Diğer', value: 'other' },
        ],
      },
      {
        name: 'special_notes',
        label: 'Özel Notlar',
        field_type: 'textarea',
        is_required: false,
        display_order: 8,
        placeholder: 'Varsa özel isteklerinizi belirtiniz...',
      },
    ],
  },
  {
    id: 'application-form',
    name: 'Başvuru Formu',
    description: 'İş başvurusu veya proje başvurusu için kapsamlı form',
    category: 'application',
    categoryLabel: 'Başvuru',
    icon: 'FileText',
    branding: {
      show_header: true,
      header_title: 'BAŞVURU',
      header_subtitle: 'FORMU',
      accent_color: '#059669',
      background_color: '#ecfdf5',
      show_corner_decorations: true,
      show_date_badge: true,
      company_name: 'KURUM ADI',
    },
    fields: [
      {
        name: 'applicant_name',
        label: 'Ad Soyad',
        field_type: 'text',
        is_required: true,
        display_order: 1,
      },
      {
        name: 'applicant_email',
        label: 'E-posta',
        field_type: 'email',
        is_required: true,
        display_order: 2,
      },
      {
        name: 'applicant_phone',
        label: 'Telefon',
        field_type: 'phone',
        is_required: true,
        display_order: 3,
      },
      {
        name: 'birth_date',
        label: 'Doğum Tarihi',
        field_type: 'date',
        is_required: true,
        display_order: 4,
      },
      {
        name: 'education_level',
        label: 'Eğitim Düzeyi',
        field_type: 'select',
        is_required: true,
        display_order: 5,
        options: [
          { label: 'Lise', value: 'high_school' },
          { label: 'Ön Lisans', value: 'associate' },
          { label: 'Lisans', value: 'bachelor' },
          { label: 'Yüksek Lisans', value: 'master' },
          { label: 'Doktora', value: 'phd' },
        ],
      },
      {
        name: 'experience_years',
        label: 'Deneyim (Yıl)',
        field_type: 'number',
        is_required: true,
        display_order: 6,
        placeholder: '0',
      },
      {
        name: 'skills',
        label: 'Yetenekler/Uzmanlık Alanları',
        field_type: 'textarea',
        is_required: true,
        display_order: 7,
        placeholder: 'Sahip olduğunuz yetenekleri ve uzmanlık alanlarını belirtiniz...',
      },
      {
        name: 'motivation',
        label: 'Başvuru Motivasyonunuz',
        field_type: 'textarea',
        is_required: true,
        display_order: 8,
        placeholder: 'Neden başvurmak istiyorsunuz?',
      },
      {
        name: 'cv_file',
        label: 'CV/Özgeçmiş (PDF)',
        field_type: 'file',
        is_required: false,
        display_order: 9,
        help_text: 'Maksimum 5MB, PDF formatında',
      },
      {
        name: 'terms_accepted',
        label: 'Şartları kabul ediyorum',
        field_type: 'checkbox',
        is_required: true,
        display_order: 10,
        options: [
          { label: 'Kişisel verilerimin işlenmesini ve başvurumun değerlendirilmesini kabul ediyorum.', value: 'accepted' },
        ],
      },
    ],
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'Tümü' },
  { id: 'survey', label: 'Anket' },
  { id: 'feedback', label: 'Geri Bildirim' },
  { id: 'contact', label: 'İletişim' },
  { id: 'registration', label: 'Kayıt' },
  { id: 'application', label: 'Başvuru' },
];
