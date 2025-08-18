-- Create admin_settings table for configurable parameters
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value NUMERIC NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Only admins can view admin settings" 
ON public.admin_settings 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can insert admin settings" 
ON public.admin_settings 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Only admins can update admin settings" 
ON public.admin_settings 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can delete admin settings" 
ON public.admin_settings 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Insert default SGK premium rates
INSERT INTO public.admin_settings (setting_key, setting_value, description, category) VALUES
('sgk_employer_premium_rate', 4355.92, 'SGK işveren primi oranı', 'incentive_calculation'),
('sgk_employee_premium_rate', 3640.77, 'SGK çalışan primi oranı', 'incentive_calculation');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();