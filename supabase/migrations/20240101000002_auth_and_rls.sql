-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = auth_id);

-- Programs policies
CREATE POLICY "Anyone can view programs" ON public.programs FOR SELECT USING (true);
CREATE POLICY "Admins can manage programs" ON public.programs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND role IN ('super_admin', 'admissions', 'academic_manager')
  )
);

-- Students policies
CREATE POLICY "Anyone can view students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Staff can manage students" ON public.students FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid()
  )
);

-- Documents policies
CREATE POLICY "Anyone can view documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Staff can manage documents" ON public.documents FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid()
  )
);

-- AI Alerts policies
CREATE POLICY "Anyone can view alerts" ON public.ai_alerts FOR SELECT USING (true);
CREATE POLICY "Staff can manage alerts" ON public.ai_alerts FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid()
  )
);

-- Communications policies
CREATE POLICY "Anyone can view communications" ON public.communications FOR SELECT USING (true);
CREATE POLICY "Staff can manage communications" ON public.communications FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid()
  )
);

-- Metrics policies
CREATE POLICY "Anyone can view metrics" ON public.metrics FOR SELECT USING (true);
CREATE POLICY "Admins can manage metrics" ON public.metrics FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND role IN ('super_admin', 'marketing')
  )
);

-- Create onboarding tasks table
CREATE TABLE IF NOT EXISTS public.onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')) DEFAULT 'pending',
  due_date DATE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_onboarding_tasks_student ON public.onboarding_tasks(student_id);
CREATE INDEX idx_onboarding_tasks_status ON public.onboarding_tasks(status);

CREATE TRIGGER update_onboarding_tasks_updated_at BEFORE UPDATE ON public.onboarding_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view onboarding tasks" ON public.onboarding_tasks FOR SELECT USING (true);
CREATE POLICY "Staff can manage onboarding tasks" ON public.onboarding_tasks FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid()
  )
);

-- Create automation rules table
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('time_based', 'event_based', 'condition_based')),
  trigger_config JSONB NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('send_email', 'send_sms', 'create_alert', 'assign_counselor', 'update_stage')),
  action_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_automation_rules_active ON public.automation_rules(is_active);

CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON public.automation_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view automation rules" ON public.automation_rules FOR SELECT USING (true);
CREATE POLICY "Admins can manage automation rules" ON public.automation_rules FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND role IN ('super_admin', 'admissions')
  )
);

-- Create lifecycle stage counts view
CREATE OR REPLACE VIEW public.lifecycle_stage_counts AS
SELECT 
  stage,
  COUNT(*) as count
FROM public.students
GROUP BY stage;
