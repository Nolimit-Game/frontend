create extension if not exists "pgcrypto";
set search_path = public, extensions;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'zaidlameer8@gmail.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"],"role":"superadmin"}'::jsonb,
  '{"full_name":"Superadmin"}'::jsonb,
  now(),
  now()
where not exists (
  select 1
  from auth.users
  where email = 'zaidlameer8@gmail.com'
);
