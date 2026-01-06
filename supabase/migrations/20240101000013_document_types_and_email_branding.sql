-- Create document_types table for configurable document requirements
CREATE TABLE IF NOT EXISTS public.document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT true,
  category TEXT DEFAULT 'general',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add default document types for universities
INSERT INTO public.document_types (university_id, name, description, is_required, category, display_order)
SELECT 
  u.id,
  dt.name,
  dt.description,
  dt.is_required,
  dt.category,
  dt.display_order
FROM public.universities u
CROSS JOIN (VALUES
  ('Academic Transcript', 'Official academic transcripts from previous institution', true, 'academic', 1),
  ('ID Document', 'Government-issued ID (passport, national ID)', true, 'identity', 2),
  ('English Proficiency', 'IELTS, TOEFL, or equivalent test results', true, 'language', 3),
  ('Personal Statement', 'Statement of purpose/personal essay', false, 'application', 4),
  ('Letters of Recommendation', 'Academic or professional references', false, 'application', 5),
  ('CV/Resume', 'Current curriculum vitae', false, 'application', 6),
  ('Financial Documents', 'Bank statements or sponsorship letters', true, 'financial', 7),
  ('Visa Documents', 'Current visa or immigration documents', false, 'immigration', 8),
  ('Health Insurance', 'Proof of health insurance coverage', false, 'health', 9),
  ('Vaccination Records', 'Immunization history', false, 'health', 10)
) AS dt(name, description, is_required, category, display_order);

-- Add branding fields to universities table
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS email_logo_url TEXT;
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS email_footer_text TEXT DEFAULT 'This is an official communication from the university admissions office.';
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS brand_primary_color TEXT DEFAULT '#F97316';
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS brand_secondary_color TEXT DEFAULT '#111827';
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS address TEXT;

-- Add more fields to email_templates for better customization
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS trigger_stage TEXT;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS description TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_document_types_university ON public.document_types(university_id);

-- Add trigger for updated_at
CREATE TRIGGER update_document_types_updated_at BEFORE UPDATE ON public.document_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
