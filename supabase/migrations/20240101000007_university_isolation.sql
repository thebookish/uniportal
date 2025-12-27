-- Add university_id to all tables for multi-tenancy

-- Create universities table
CREATE TABLE IF NOT EXISTS public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add university_id to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE;

-- Add university_id to programs table
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE;

-- Add university_id to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE;

-- Add university_id to documents table
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE;

-- Add university_id to ai_alerts table  
ALTER TABLE public.ai_alerts ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE;

-- Add university_id to communications table
ALTER TABLE public.communications ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE;

-- Add university_id to metrics table
ALTER TABLE public.metrics ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE;

-- Add university_id to onboarding_tasks table
ALTER TABLE public.onboarding_tasks ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE;

-- Add university_id to automation_rules table
ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE;

-- Add university_id to team_invitations table
ALTER TABLE public.team_invitations ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE;

-- Add university_id to content_resources table (if exists)
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_resources') THEN
    ALTER TABLE public.content_resources ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add university_id to university_settings table (if exists)
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'university_settings') THEN
    ALTER TABLE public.university_settings ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add university_id to obligations table (if exists)
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'obligations') THEN
    ALTER TABLE public.obligations ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for university_id
CREATE INDEX IF NOT EXISTS idx_users_university ON public.users(university_id);
CREATE INDEX IF NOT EXISTS idx_programs_university ON public.programs(university_id);
CREATE INDEX IF NOT EXISTS idx_students_university ON public.students(university_id);
CREATE INDEX IF NOT EXISTS idx_documents_university ON public.documents(university_id);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_university ON public.ai_alerts(university_id);
CREATE INDEX IF NOT EXISTS idx_communications_university ON public.communications(university_id);
CREATE INDEX IF NOT EXISTS idx_metrics_university ON public.metrics(university_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_university ON public.onboarding_tasks(university_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_university ON public.automation_rules(university_id);

-- Create LMS integrations table
CREATE TABLE IF NOT EXISTS public.lms_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('canvas', 'moodle', 'blackboard', 'brightspace', 'd2l', 'schoology', 'google_classroom', 'custom')),
  name TEXT NOT NULL,
  api_url TEXT NOT NULL,
  api_key_encrypted TEXT,
  client_id TEXT,
  client_secret_encrypted TEXT,
  oauth_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT CHECK (sync_status IN ('idle', 'syncing', 'success', 'error')),
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create external data sources table
CREATE TABLE IF NOT EXISTS public.external_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('crm', 'sis', 'hr', 'finance', 'survey', 'analytics', 'webhook', 'api', 'csv_import')),
  name TEXT NOT NULL,
  description TEXT,
  api_url TEXT,
  api_key_encrypted TEXT,
  auth_type TEXT CHECK (auth_type IN ('none', 'api_key', 'oauth2', 'basic', 'bearer')),
  settings JSONB DEFAULT '{}',
  field_mappings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_frequency TEXT CHECK (sync_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'manual')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sync logs table for tracking data imports
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  source_id UUID REFERENCES public.external_sources(id) ON DELETE CASCADE,
  lms_id UUID REFERENCES public.lms_integrations(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('started', 'in_progress', 'completed', 'failed')),
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_details JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables TEXT[] DEFAULT '{}',
  category TEXT CHECK (category IN ('welcome', 'reminder', 'alert', 'invitation', 'notification', 'marketing', 'custom')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email queue table for actual sending
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  to_name TEXT,
  from_email TEXT,
  from_name TEXT,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  template_id UUID REFERENCES public.email_templates(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'bounced')),
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lms_integrations_university ON public.lms_integrations(university_id);
CREATE INDEX IF NOT EXISTS idx_external_sources_university ON public.external_sources(university_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_university ON public.sync_logs(university_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_university ON public.email_templates(university_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_university ON public.email_queue(university_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);

-- Add triggers for updated_at
CREATE TRIGGER update_universities_updated_at BEFORE UPDATE ON public.universities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lms_integrations_updated_at BEFORE UPDATE ON public.lms_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_external_sources_updated_at BEFORE UPDATE ON public.external_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
