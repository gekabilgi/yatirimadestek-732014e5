export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'email' 
  | 'phone' 
  | 'number' 
  | 'date' 
  | 'select' 
  | 'radio' 
  | 'checkbox' 
  | 'file' 
  | 'heading' 
  | 'paragraph' 
  | 'divider';

export interface FieldOption {
  label: string;
  value: string;
}

export interface ValidationRules {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
  maxFileSize?: number; // in bytes
  allowedFileTypes?: string[];
}

export interface ConditionalLogic {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains';
  value: string;
  action: 'show' | 'hide';
}

export interface FormField {
  id: string;
  form_id: string;
  field_type: FieldType;
  label: string;
  name: string;
  placeholder?: string;
  help_text?: string;
  is_required: boolean;
  display_order: number;
  options: FieldOption[];
  validation_rules: ValidationRules;
  conditional_logic?: ConditionalLogic;
  created_at: string;
  updated_at: string;
}

export type DisplayMode = 'standalone' | 'integrated';

export type HeaderLayout = 'centered' | 'left-image' | 'right-image';

export interface FormBranding {
  show_header: boolean;
  header_title?: string;
  header_subtitle?: string;
  header_image_url?: string;
  logo_url?: string;
  accent_color?: string;
  background_color?: string;
  header_layout: HeaderLayout;
}

export const DEFAULT_BRANDING: FormBranding = {
  show_header: false,
  header_layout: 'centered',
};

export interface FormSettings {
  theme: 'default' | 'minimal' | 'bordered';
  success_message: string;
  submit_button_text: string;
  show_progress: boolean;
  email_notifications: boolean;
  notification_emails: string[];
  auto_response: boolean;
  auto_response_subject: string;
  auto_response_body: string;
}

export interface FormTemplate {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  is_public: boolean;
  display_mode: DisplayMode;
  settings: FormSettings;
  branding: FormBranding;
  created_by?: string;
  created_at: string;
  updated_at: string;
  fields?: FormField[];
}

export interface FormSubmission {
  id: string;
  form_id: string;
  data: Record<string, any>;
  status: 'new' | 'viewed' | 'processed' | 'archived';
  submitter_email?: string;
  submitter_ip?: string;
  created_at: string;
}

export const FIELD_TYPE_INFO: Record<FieldType, { label: string; icon: string; isDecorative: boolean }> = {
  text: { label: 'Metin', icon: 'Type', isDecorative: false },
  textarea: { label: 'Uzun Metin', icon: 'AlignLeft', isDecorative: false },
  email: { label: 'E-posta', icon: 'Mail', isDecorative: false },
  phone: { label: 'Telefon', icon: 'Phone', isDecorative: false },
  number: { label: 'Sayı', icon: 'Hash', isDecorative: false },
  date: { label: 'Tarih', icon: 'Calendar', isDecorative: false },
  select: { label: 'Açılır Liste', icon: 'ChevronDown', isDecorative: false },
  radio: { label: 'Tek Seçim', icon: 'Circle', isDecorative: false },
  checkbox: { label: 'Çoklu Seçim', icon: 'CheckSquare', isDecorative: false },
  file: { label: 'Dosya Yükleme', icon: 'Upload', isDecorative: false },
  heading: { label: 'Başlık', icon: 'Heading', isDecorative: true },
  paragraph: { label: 'Açıklama', icon: 'FileText', isDecorative: true },
  divider: { label: 'Ayırıcı', icon: 'Minus', isDecorative: true },
};
