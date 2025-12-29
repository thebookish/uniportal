-- Add permissions column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
  "dashboard": true,
  "students": true,
  "admissions": true,
  "communications": false,
  "reports": false,
  "settings": false
}'::jsonb;

-- Update existing users to have full permissions (backward compatibility)
UPDATE public.users 
SET permissions = '{
  "dashboard": true,
  "students": true,
  "admissions": true,
  "communications": true,
  "reports": true,
  "settings": true
}'::jsonb
WHERE permissions IS NULL OR permissions = '{}'::jsonb;
