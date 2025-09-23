-- Create user_sessions table to track user activity
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  ip_address TEXT,
  location_country TEXT,
  location_city TEXT,
  user_agent TEXT,
  page_path TEXT,
  activity_type TEXT NOT NULL, -- 'calculation', 'search', 'page_view', 'session_start', 'session_end'
  activity_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create real_time_notifications table for admin notifications
CREATE TABLE public.real_time_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_type TEXT NOT NULL, -- 'user_activity', 'calculation_completed', 'search_performed', 'new_session'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  priority TEXT NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on real_time_notifications  
ALTER TABLE public.real_time_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for user_sessions
CREATE POLICY "Anyone can insert session data" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all sessions" 
ON public.user_sessions 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Create policies for real_time_notifications
CREATE POLICY "Admins can view all notifications" 
ON public.real_time_notifications 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "System can insert notifications" 
ON public.real_time_notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can update notifications" 
ON public.real_time_notifications 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_user_sessions_activity_type ON public.user_sessions(activity_type);
CREATE INDEX idx_user_sessions_created_at ON public.user_sessions(created_at);
CREATE INDEX idx_user_sessions_session_id ON public.user_sessions(session_id);
CREATE INDEX idx_real_time_notifications_is_read ON public.real_time_notifications(is_read);
CREATE INDEX idx_real_time_notifications_created_at ON public.real_time_notifications(created_at);
CREATE INDEX idx_real_time_notifications_type ON public.real_time_notifications(notification_type);

-- Create function to create notifications automatically
CREATE OR REPLACE FUNCTION public.create_activity_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for specific activities
  IF NEW.activity_type IN ('calculation', 'search') THEN
    INSERT INTO public.real_time_notifications (
      notification_type,
      title,
      message,
      data,
      priority
    ) VALUES (
      'user_activity',
      CASE 
        WHEN NEW.activity_type = 'calculation' THEN 'Yeni Hesaplama'
        WHEN NEW.activity_type = 'search' THEN 'Yeni Arama'
        ELSE 'Kullanıcı Aktivitesi'
      END,
      CASE 
        WHEN NEW.activity_type = 'calculation' THEN 
          COALESCE(NEW.location_city, 'Bilinmeyen') || ' konumundan yeni hesaplama yapıldı'
        WHEN NEW.activity_type = 'search' THEN 
          COALESCE(NEW.location_city, 'Bilinmeyen') || ' konumundan yeni arama yapıldı'
        ELSE 'Yeni kullanıcı aktivitesi'
      END,
      jsonb_build_object(
        'session_id', NEW.session_id,
        'ip_address', NEW.ip_address,
        'location', jsonb_build_object(
          'country', NEW.location_country,
          'city', NEW.location_city
        ),
        'page_path', NEW.page_path,
        'activity_data', NEW.activity_data
      ),
      'normal'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;