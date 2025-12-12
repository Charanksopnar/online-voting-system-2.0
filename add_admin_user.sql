-- ============================================
-- ADD ADMIN USER TO SUPABASE
-- ============================================

-- METHOD 1: Promote an existing user to ADMIN
-- Replace 'user@example.com' with the actual email address
UPDATE public.profiles 
SET role = 'ADMIN',
    verification_status = 'APPROVED',
    electoral_roll_verified = true
WHERE email = 'user@example.com';

-- Verify the update
SELECT id, email, first_name, last_name, role, verification_status 
FROM public.profiles 
WHERE email = 'user@example.com';

-- ============================================
-- METHOD 2: Create a complete admin profile manually
-- (Use this if you created a user via Supabase Dashboard)
-- ============================================

-- Step 1: First create the user in Supabase Dashboard:
--   Dashboard → Authentication → Users → "Add user"
--   - Email: admin@example.com
--   - Password: (your secure password)
--   - Auto Confirm User: ✅ (check this)

-- Step 2: Find the user ID
SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- Step 3: Insert or update the profile (replace 'USER_ID_HERE' with actual ID from step 2)
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
  'USER_ID_HERE',  -- Replace with actual user ID from auth.users
  'admin@example.com',
  'Admin',
  'User',
  'ADMIN',
  30,
  '1994-01-01',
  '9999999999',
  'Delhi',
  'Central Delhi',
  'New Delhi',
  true,
  'APPROVED',
  'https://ui-avatars.com/api/?name=Admin+User&background=4f46e5'
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'ADMIN',
  verification_status = 'APPROVED',
  electoral_roll_verified = true;

-- ============================================
-- METHOD 3: Quick admin promotion by user ID
-- ============================================

-- If you know the user ID directly
UPDATE public.profiles 
SET role = 'ADMIN',
    verification_status = 'APPROVED',
    electoral_roll_verified = true
WHERE id = 'paste-user-id-here';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- List all admin users
SELECT id, email, first_name, last_name, role, verification_status, created_at
FROM public.profiles 
WHERE role = 'ADMIN'
ORDER BY created_at DESC;

-- Count users by role
SELECT role, COUNT(*) as count
FROM public.profiles
GROUP BY role;
