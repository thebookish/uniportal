-- University profile table
CREATE TABLE IF NOT EXISTS public.university_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#F97316',
  secondary_color TEXT DEFAULT '#111827',
  campuses TEXT[] DEFAULT '{}',
  departments TEXT[] DEFAULT '{}',
  setup_completed BOOLEAN DEFAULT FALSE,
  setup_step INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_university_profile_updated_at BEFORE UPDATE ON public.university_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.university_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view university profile" ON public.university_profile FOR SELECT USING (true);
CREATE POLICY "Admins can manage university profile" ON public.university_profile FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Communication templates table
CREATE TABLE IF NOT EXISTS public.communication_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'in_app')),
  trigger_stage TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_communication_templates_type ON public.communication_templates(type);
CREATE INDEX idx_communication_templates_stage ON public.communication_templates(trigger_stage);

CREATE TRIGGER update_communication_templates_updated_at BEFORE UPDATE ON public.communication_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.communication_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view templates" ON public.communication_templates FOR SELECT USING (true);
CREATE POLICY "Staff can manage templates" ON public.communication_templates FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid())
);

-- Team invitations table
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admissions', 'international_office', 'student_success', 'marketing', 'academic_manager', 'finance')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
  invited_by UUID REFERENCES public.users(id),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX idx_team_invitations_status ON public.team_invitations(status);

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view invitations" ON public.team_invitations FOR SELECT USING (true);
CREATE POLICY "Admins can manage invitations" ON public.team_invitations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'super_admin')
);

-- AI settings table
CREATE TABLE IF NOT EXISTS public.ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_threshold_high INTEGER DEFAULT 70,
  risk_threshold_moderate INTEGER DEFAULT 40,
  engagement_threshold_low INTEGER DEFAULT 40,
  inactivity_days_warning INTEGER DEFAULT 5,
  inactivity_days_critical INTEGER DEFAULT 10,
  auto_alerts_enabled BOOLEAN DEFAULT TRUE,
  auto_recommendations_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_ai_settings_updated_at BEFORE UPDATE ON public.ai_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view AI settings" ON public.ai_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage AI settings" ON public.ai_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'super_admin')
);

-- Insert default AI settings
INSERT INTO public.ai_settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;

-- Add quality_score to students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 50 CHECK (quality_score >= 0 AND quality_score <= 100);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'direct';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_quality_score ON public.students(quality_score);
CREATE INDEX IF NOT EXISTS idx_students_source ON public.students(source);
