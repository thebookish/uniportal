-- Seed mock data for Calendar Intelligence pilot

-- Get some existing student IDs to create calendar data for
DO $$
DECLARE
  student_rec RECORD;
  base_date DATE := CURRENT_DATE - INTERVAL '1 day' * EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + INTERVAL '1 day';
  i INTEGER;
BEGIN
  -- Loop through first 10 students
  FOR student_rec IN (SELECT id FROM public.students LIMIT 10) LOOP
    -- Create academic events (Monday-Friday schedule)
    FOR i IN 0..4 LOOP
      -- Morning lecture
      INSERT INTO public.calendar_academic_events (
        student_id, event_type, title, start_time, end_time, mandatory, day_of_week
      ) VALUES (
        student_rec.id,
        CASE WHEN i % 2 = 0 THEN 'lecture' ELSE 'seminar' END,
        CASE WHEN i = 0 THEN 'Introduction to Business' WHEN i = 1 THEN 'Statistics Lab' WHEN i = 2 THEN 'Marketing Principles' WHEN i = 3 THEN 'Economics' ELSE 'Research Methods' END,
        (base_date + (i || ' days')::INTERVAL + '09:00:00'::TIME)::TIMESTAMPTZ,
        (base_date + (i || ' days')::INTERVAL + '11:00:00'::TIME)::TIMESTAMPTZ,
        TRUE,
        i + 1
      );
      
      -- Afternoon session (not every day)
      IF i < 3 THEN
        INSERT INTO public.calendar_academic_events (
          student_id, event_type, title, start_time, end_time, mandatory, day_of_week
        ) VALUES (
          student_rec.id,
          CASE WHEN i = 0 THEN 'lab' WHEN i = 1 THEN 'lecture' ELSE 'seminar' END,
          CASE WHEN i = 0 THEN 'Computer Lab' WHEN i = 1 THEN 'Financial Accounting' ELSE 'Group Project' END,
          (base_date + (i || ' days')::INTERVAL + '14:00:00'::TIME)::TIMESTAMPTZ,
          (base_date + (i || ' days')::INTERVAL + '16:00:00'::TIME)::TIMESTAMPTZ,
          i < 2,
          i + 1
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Add work schedules for some students (creating conflicts)
DO $$
DECLARE
  student_rec RECORD;
  base_date DATE := CURRENT_DATE - INTERVAL '1 day' * EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + INTERVAL '1 day';
  counter INTEGER := 0;
BEGIN
  FOR student_rec IN (SELECT id FROM public.students LIMIT 5) LOOP
    counter := counter + 1;
    
    -- Different work patterns
    IF counter <= 2 THEN
      -- Overlapping work (conflict scenario)
      INSERT INTO public.calendar_work_events (
        student_id, event_type, title, start_time, end_time, day_of_week
      ) VALUES (
        student_rec.id,
        'work',
        'Part-time Job',
        (base_date + '1 day'::INTERVAL + '10:00:00'::TIME)::TIMESTAMPTZ,
        (base_date + '1 day'::INTERVAL + '14:00:00'::TIME)::TIMESTAMPTZ,
        2
      );
    END IF;
    
    IF counter <= 3 THEN
      -- Evening work (no conflict)
      INSERT INTO public.calendar_work_events (
        student_id, event_type, title, start_time, end_time, day_of_week
      ) VALUES (
        student_rec.id,
        'work',
        'Evening Shift',
        (base_date + '3 days'::INTERVAL + '17:00:00'::TIME)::TIMESTAMPTZ,
        (base_date + '3 days'::INTERVAL + '21:00:00'::TIME)::TIMESTAMPTZ,
        4
      );
    END IF;
    
    IF counter >= 4 THEN
      -- Heavy work schedule (multiple days)
      INSERT INTO public.calendar_work_events (
        student_id, event_type, title, start_time, end_time, day_of_week
      ) VALUES 
      (
        student_rec.id,
        'work',
        'Weekend Work',
        (base_date + '5 days'::INTERVAL + '08:00:00'::TIME)::TIMESTAMPTZ,
        (base_date + '5 days'::INTERVAL + '16:00:00'::TIME)::TIMESTAMPTZ,
        6
      ),
      (
        student_rec.id,
        'work',
        'Weekend Work',
        (base_date + '6 days'::INTERVAL + '08:00:00'::TIME)::TIMESTAMPTZ,
        (base_date + '6 days'::INTERVAL + '16:00:00'::TIME)::TIMESTAMPTZ,
        0
      );
    END IF;
  END LOOP;
END $$;

-- Add some attendance records
DO $$
DECLARE
  student_rec RECORD;
  event_rec RECORD;
  attendance_chance FLOAT;
BEGIN
  FOR student_rec IN (SELECT id FROM public.students LIMIT 10) LOOP
    -- Different attendance patterns
    attendance_chance := 0.7 + (RANDOM() * 0.3); -- 70-100% attendance
    
    FOR event_rec IN (SELECT id FROM public.calendar_academic_events WHERE student_id = student_rec.id) LOOP
      INSERT INTO public.attendance_records (
        student_id, event_id, date, present
      ) VALUES (
        student_rec.id,
        event_rec.id,
        CURRENT_DATE - (RANDOM() * 14)::INTEGER,
        RANDOM() < attendance_chance
      );
    END LOOP;
  END LOOP;
END $$;

-- Generate calendar summaries for students with events
DO $$
DECLARE
  student_rec RECORD;
  total_class NUMERIC;
  total_mandatory NUMERIC;
  total_work NUMERIC;
  calendar_json JSONB;
  week_start_date DATE;
BEGIN
  week_start_date := CURRENT_DATE - INTERVAL '1 day' * EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + INTERVAL '1 day';
  
  FOR student_rec IN (
    SELECT DISTINCT student_id FROM public.calendar_academic_events
  ) LOOP
    -- Calculate totals
    SELECT 
      COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600), 0)
    INTO total_class
    FROM public.calendar_academic_events 
    WHERE student_id = student_rec.student_id;
    
    SELECT 
      COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600), 0)
    INTO total_mandatory
    FROM public.calendar_academic_events 
    WHERE student_id = student_rec.student_id AND mandatory = TRUE;
    
    SELECT 
      COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600), 0)
    INTO total_work
    FROM public.calendar_work_events 
    WHERE student_id = student_rec.student_id;
    
    -- Build calendar JSON
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'type', 'class',
        'start', start_time,
        'end', end_time,
        'mandatory', mandatory,
        'day_of_week', day_of_week,
        'title', title
      )
    ), '[]'::jsonb)
    INTO calendar_json
    FROM public.calendar_academic_events 
    WHERE student_id = student_rec.student_id;
    
    -- Add work events
    SELECT calendar_json || COALESCE(jsonb_agg(
      jsonb_build_object(
        'type', 'work',
        'start', start_time,
        'end', end_time,
        'mandatory', FALSE,
        'day_of_week', day_of_week,
        'title', title
      )
    ), '[]'::jsonb)
    INTO calendar_json
    FROM public.calendar_work_events 
    WHERE student_id = student_rec.student_id;
    
    -- Insert summary
    INSERT INTO public.student_calendar_summary (
      student_id, week_start, total_class_hours, total_mandatory_hours, total_work_hours, weekly_calendar, free_time_blocks
    ) VALUES (
      student_rec.student_id,
      week_start_date,
      total_class,
      total_mandatory,
      total_work,
      calendar_json,
      '[]'::jsonb
    )
    ON CONFLICT (student_id, week_start) DO UPDATE SET
      total_class_hours = EXCLUDED.total_class_hours,
      total_mandatory_hours = EXCLUDED.total_mandatory_hours,
      total_work_hours = EXCLUDED.total_work_hours,
      weekly_calendar = EXCLUDED.weekly_calendar,
      updated_at = NOW();
  END LOOP;
END $$;
