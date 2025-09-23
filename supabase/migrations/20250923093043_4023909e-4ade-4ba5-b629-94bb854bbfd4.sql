-- Create trigger to automatically create notifications
CREATE TRIGGER trigger_create_activity_notification
  AFTER INSERT ON public.user_sessions
  FOR EACH ROW EXECUTE FUNCTION public.create_activity_notification();

-- Add REPLICA IDENTITY FULL for real-time updates
ALTER TABLE public.real_time_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.user_sessions REPLICA IDENTITY FULL;

-- Add the tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.real_time_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions;