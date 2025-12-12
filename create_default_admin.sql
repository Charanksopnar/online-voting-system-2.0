-- ============================================
-- CREATE DEFAULT ADMIN ACCOUNT
-- ============================================
-- This script creates a default admin account for immediate access
-- 
-- DEFAULT CREDENTIALS:
-- Email: admin@securevote.com
-- Password: Admin@123
--
-- IMPORTANT: Change these credentials after first login!
-- ============================================

-- Step 1: Create the auth user in Supabase
-- You need to do this in Supabase Dashboard:
-- 1. Go to Authentication → Users → "Add user"
-- 2. Email: admin@securevote.com
-- 3. Password: Admin@123
-- 4. ✅ Check "Auto Confirm User"
-- 5. Click "Create user"

-- Step 2: After creating the user, find the user ID
SELECT id, email FROM auth.users WHERE email = 'admin@securevote.com';

-- Step 3: Copy the ID from above and replace 'PASTE_USER_ID_HERE' below
-- Then run this INSERT statement:

INSERT INTO public.profiles (
  id,
  email,
  first_name,
  last_name,
  role,
  age,
  dob,
  phone,
  address_state,
  address_district,
  address_city,
  electoral_roll_verified,
  verification_status,
  photo_url
)
VALUES (
  'PASTE_USER_ID_HERE',  -- Replace with actual user ID from Step 2
  'admin@securevote.com',
  'System',
  'Administrator',
  'ADMIN',
  30,
  '1994-01-01',
  '9999999999',
  'Delhi',
  'Central Delhi',
  'New Delhi',
  true,
  'APPROVED',
  'https://ui-avatars.com/api/?name=System+Admin&background=4f46e5&color=fff'
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'ADMIN',
  verification_status = 'APPROVED',
  electoral_roll_verified = true;

-- Step 4: Verify the admin account was created
SELECT id, email, first_name, last_name, role, verification_status 
FROM public.profiles 
WHERE email = 'admin@securevote.com';

-- ============================================
-- ALTERNATIVE: If you already have a user registered
-- ============================================
-- If you've already registered with a different email,
-- you can promote that account to admin instead:
--
-- UPDATE public.profiles 
-- SET role = 'ADMIN',
--     verification_status = 'APPROVED',
--     electoral_roll_verified = true
-- WHERE email = 'your-existing-email@example.com';
