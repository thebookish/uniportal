CREATE TABLE IF NOT EXISTS public.content_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('video', 'document', 'guide', 'faq')),
  url TEXT,
  file_path TEXT,
  stage TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_resources_type ON public.content_resources(type);
CREATE INDEX idx_content_resources_stage ON public.content_resources(stage);

CREATE TRIGGER update_content_resources_updated_at BEFORE UPDATE ON public.content_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.content_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view content resources" ON public.content_resources FOR SELECT USING (true);
CREATE POLICY "Staff can manage content resources" ON public.content_resources FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid())
);
