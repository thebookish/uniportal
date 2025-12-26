-- Create demo admin user
-- Password: password
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@worldlynk.edu',
  '$2a$10$rqiU7W5yLLnKJ8K8vN5zKOXxJ5F5F5F5F5F5F5F5F5F5F5F5F5F5F',
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Create corresponding profile
INSERT INTO public.users (auth_id, name, email, role) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Admin User',
  'admin@worldlynk.edu',
  'super_admin'
) ON CONFLICT (email) DO NOTHING;
