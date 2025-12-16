
-- Form Templates table
CREATE TABLE public.form_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{
    "theme": "default",
    "success_message": "Form başarıyla gönderildi. Teşekkür ederiz!",
    "submit_button_text": "Gönder",
    "show_progress": false,
    "email_notifications": false,
    "notification_emails": [],
    "auto_response": false,
    "auto_response_subject": "",
    "auto_response_body": ""
  }'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Form Fields table
CREATE TABLE public.form_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.form_templates(id) ON DELETE CASCADE,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'email', 'phone', 'number', 'date', 'select', 'radio', 'checkbox', 'file', 'heading', 'paragraph', 'divider')),
  label TEXT NOT NULL,
  name TEXT NOT NULL,
  placeholder TEXT,
  help_text TEXT,
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  options JSONB DEFAULT '[]'::jsonb,
  validation_rules JSONB DEFAULT '{}'::jsonb,
  conditional_logic JSONB DEFAULT null,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Form Submissions table
CREATE TABLE public.form_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.form_templates(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'processed', 'archived')),
  submitter_email TEXT,
  submitter_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form_templates
CREATE POLICY "Admins can manage form templates"
ON public.form_templates FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Public can view active form templates"
ON public.form_templates FOR SELECT
USING (is_active = true AND is_public = true);

-- RLS Policies for form_fields
CREATE POLICY "Admins can manage form fields"
ON public.form_fields FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Public can view fields of active public forms"
ON public.form_fields FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.form_templates
  WHERE form_templates.id = form_fields.form_id
  AND form_templates.is_active = true
  AND form_templates.is_public = true
));

-- RLS Policies for form_submissions
CREATE POLICY "Admins can manage form submissions"
ON public.form_submissions FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Anyone can submit to active public forms"
ON public.form_submissions FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.form_templates
  WHERE form_templates.id = form_submissions.form_id
  AND form_templates.is_active = true
  AND form_templates.is_public = true
));

-- Indexes for performance
CREATE INDEX idx_form_templates_slug ON public.form_templates(slug);
CREATE INDEX idx_form_templates_active ON public.form_templates(is_active);
CREATE INDEX idx_form_fields_form_id ON public.form_fields(form_id);
CREATE INDEX idx_form_fields_order ON public.form_fields(form_id, display_order);
CREATE INDEX idx_form_submissions_form_id ON public.form_submissions(form_id);
CREATE INDEX idx_form_submissions_status ON public.form_submissions(status);
CREATE INDEX idx_form_submissions_created ON public.form_submissions(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_form_templates_updated_at
BEFORE UPDATE ON public.form_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_form_fields_updated_at
BEFORE UPDATE ON public.form_fields
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
