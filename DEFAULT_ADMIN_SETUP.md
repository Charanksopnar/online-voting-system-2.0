# Default Admin Account Setup

## 🔐 Default Credentials

**Email:** `admin@securevote.com`  
**Password:** `Admin@123`

> ⚠️ **IMPORTANT:** Change these credentials immediately after your first login for security!

---

## 📋 Setup Instructions

Follow these steps to create the default admin account:

### Step 1: Create User in Supabase Dashboard

1. Open your **Supabase Dashboard**
2. Navigate to **Authentication** → **Users**
3. Click **"Add user"** button
4. Enter the following details:
   - **Email:** `admin@securevote.com`
   - **Password:** `Admin@123`
   - ✅ **Check "Auto Confirm User"**
5. Click **"Create user"**

### Step 2: Run SQL Script

1. Go to **SQL Editor** in Supabase Dashboard
2. Open the file [`create_default_admin.sql`](file:///d:/evote%202.0/create_default_admin.sql)
3. Follow the instructions in the SQL file to complete the setup

### Step 3: Login

1. Go to `http://localhost:5173`
2. Navigate to the **Admin Login** page
3. Use the credentials above to log in

---

## 🔄 Alternative: Promote Existing User

If you already have a registered account, you can promote it to admin instead:

```sql
UPDATE public.profiles 
SET role = 'ADMIN',
    verification_status = 'APPROVED',
    electoral_roll_verified = true
WHERE email = 'your-email@example.com';
```

---

## 🛡️ Security Recommendations

After logging in with the default credentials:

1. **Change the password immediately**
2. **Update the email** to your actual admin email
3. **Delete or disable** this default account once you've created your own admin account
