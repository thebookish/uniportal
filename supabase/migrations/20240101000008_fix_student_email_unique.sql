-- Drop the global unique constraint on email
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_email_key;

-- Create a composite unique constraint for email + university_id
-- This allows the same email to exist in different universities
ALTER TABLE public.students 
ADD CONSTRAINT students_email_university_unique UNIQUE (email, university_id);
