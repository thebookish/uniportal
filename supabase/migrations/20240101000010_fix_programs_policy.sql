-- Fix programs policy to allow all staff to manage programs
DROP POLICY IF EXISTS "Admins can manage programs" ON public.programs;

CREATE POLICY "Staff can manage programs" ON public.programs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid()
  )
);

-- Ensure university isolation for programs
DROP POLICY IF EXISTS "Anyone can view programs" ON public.programs;

CREATE POLICY "Users can view programs from their university" ON public.programs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND (university_id = programs.university_id OR programs.university_id IS NULL)
  )
);
