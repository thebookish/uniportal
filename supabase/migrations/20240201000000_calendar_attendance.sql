-- Calendar & Attendance Intelligence Tables

-- Academic timetable events
CREATE TABLE IF NOT EXISTS public.calendar_academic_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('lecture', 'seminar', 'lab')),
  title TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  mandatory BOOLEAN DEFAULT TRUE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work/personal calendar events
CREATE TABLE IF NOT EXISTS public.calendar_work_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('work', 'personal')),
  title TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  recurring BOOLEAN DEFAULT FALSE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance records
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.calendar_academic_events(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  present BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student weekly calendar summary (normalized)
CREATE TABLE IF NOT EXISTS public.student_calendar_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  total_class_hours NUMERIC DEFAULT 0,
  total_mandatory_hours NUMERIC DEFAULT 0,
  total_work_hours NUMERIC DEFAULT 0,
  free_time_blocks JSONB DEFAULT '[]',
  weekly_calendar JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, week_start)
);

-- Timetable feasibility scores
CREATE TABLE IF NOT EXISTS public.timetable_feasibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  feasibility_score INTEGER NOT NULL CHECK (feasibility_score >= 0 AND feasibility_score <= 100),
  score_band TEXT NOT NULL CHECK (score_band IN ('feasible', 'strained', 'at_risk')),
  factors JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, week_start)
);

-- Calendar conflicts detected
CREATE TABLE IF NOT EXISTS public.calendar_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  conflict_type TEXT NOT NULL CHECK (conflict_type IN ('class_work_overlap', 'unrealistic_transition', 'excessive_sessions', 'day_exceeds_hours')),
  day TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  details TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance viability risk predictions
CREATE TABLE IF NOT EXISTS public.attendance_viability_risk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  risk_type TEXT NOT NULL DEFAULT 'attendance_viability_risk',
  weeks_to_risk INTEGER NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),
  reasons JSONB DEFAULT '[]',
  recommendation TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_calendar_academic_student ON public.calendar_academic_events(student_id);
CREATE INDEX idx_calendar_academic_day ON public.calendar_academic_events(day_of_week);
CREATE INDEX idx_calendar_work_student ON public.calendar_work_events(student_id);
CREATE INDEX idx_attendance_student ON public.attendance_records(student_id);
CREATE INDEX idx_attendance_date ON public.attendance_records(date);
CREATE INDEX idx_calendar_summary_student ON public.student_calendar_summary(student_id);
CREATE INDEX idx_calendar_summary_week ON public.student_calendar_summary(week_start);
CREATE INDEX idx_feasibility_student ON public.timetable_feasibility(student_id);
CREATE INDEX idx_feasibility_score ON public.timetable_feasibility(feasibility_score);
CREATE INDEX idx_conflicts_student ON public.calendar_conflicts(student_id);
CREATE INDEX idx_conflicts_severity ON public.calendar_conflicts(severity);
CREATE INDEX idx_viability_risk_student ON public.attendance_viability_risk(student_id);
CREATE INDEX idx_viability_risk_active ON public.attendance_viability_risk(active);

-- Triggers for updated_at
CREATE TRIGGER update_calendar_academic_events_updated_at
  BEFORE UPDATE ON public.calendar_academic_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_work_events_updated_at
  BEFORE UPDATE ON public.calendar_work_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_calendar_summary_updated_at
  BEFORE UPDATE ON public.student_calendar_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timetable_feasibility_updated_at
  BEFORE UPDATE ON public.timetable_feasibility
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_conflicts_updated_at
  BEFORE UPDATE ON public.calendar_conflicts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_viability_risk_updated_at
  BEFORE UPDATE ON public.attendance_viability_risk
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.timetable_feasibility;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_conflicts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_viability_risk;
