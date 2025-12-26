CREATE TABLE IF NOT EXISTS public.obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  requirement TEXT NOT NULL,
  current_value TEXT,
  status TEXT CHECK (status IN ('met', 'warning', 'breach')) DEFAULT 'met',
  consequence TEXT,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_obligations_student ON public.obligations(student_id);
CREATE INDEX idx_obligations_status ON public.obligations(status);

CREATE TRIGGER update_obligations_updated_at BEFORE UPDATE ON public.obligations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.obligations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view obligations" ON public.obligations FOR SELECT USING (true);
CREATE POLICY "Staff can manage obligations" ON public.obligations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid())
);
