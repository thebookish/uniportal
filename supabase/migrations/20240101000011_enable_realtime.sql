-- Enable realtime for ai_alerts table
ALTER TABLE public.ai_alerts REPLICA IDENTITY FULL;

-- Enable realtime for students table  
ALTER TABLE public.students REPLICA IDENTITY FULL;

-- Enable realtime for communications table
ALTER TABLE public.communications REPLICA IDENTITY FULL;

-- Enable realtime for onboarding_tasks table
ALTER TABLE public.onboarding_tasks REPLICA IDENTITY FULL;

-- Add tables to realtime publication
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
  public.ai_alerts,
  public.students,
  public.communications,
  public.onboarding_tasks;
