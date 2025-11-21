# Database Schema Setup Guide

This guide provides step-by-step instructions to manually set up the database schema in Supabase Dashboard. Follow these steps in order.

**📋 Reference**: For the current schema state, check `src/types/database.ts` (auto-generated from Supabase)

**🚀 Quick Start**: If you want to reset and start fresh, use the SQL scripts:
1. Run `supabase/migrations/RESET_DATABASE.sql` to drop everything
2. Run `supabase/migrations/COMPLETE_SCHEMA_SETUP.sql` to set up everything from scratch

---

## Prerequisites

1. **Expose `public` schema in Supabase Dashboard**:
   - Go to: **Settings → API**
   - Under "Exposed schemas", ensure `public` is in the list (along with `api`)
   - Click "Save"

2. **Verify your Supabase project is active and accessible**

---

## Step 1: Create `app_role` Enum Type

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this SQL:

```sql
-- Create app_role enum type
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'member');
        RAISE NOTICE 'Created app_role enum type';
    ELSE
        RAISE NOTICE 'app_role enum type already exists';
    END IF;
END $$;
```

**Verify**: Check that the enum exists by running:
```sql
SELECT typname FROM pg_type WHERE typname = 'app_role';
```

---

## Step 2: Create `update_updated_at_column()` Function

1. Go to **SQL Editor**
2. Run this SQL:

```sql
-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
```

---

## Step 3: Reset Database (Optional - If Starting Fresh)

**⚠️ WARNING**: This will DELETE ALL DATA in the `public` schema. Only run this if you want to start completely fresh.

If you want to reset everything and start clean:

1. Go to **SQL Editor**
2. Run the contents of `supabase/migrations/RESET_DATABASE.sql`
   - This drops all tables, functions, policies, triggers, and the enum type
   - All data will be lost

**OR** if you want to convert an existing `text` column to `app_role` enum (without resetting):

```sql
-- Convert user_roles.role from text to app_role enum
-- This MUST drop ALL policies on ALL tables that use has_role() function first

DO $$ 
DECLARE
    pol record;
BEGIN
    -- Step 1: Drop has_role() function first (it's used by policies)
    DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
    DROP FUNCTION IF EXISTS public.has_role(uuid, text) CASCADE;
    
    -- Step 2: Drop ALL policies on ALL tables (they depend on role column indirectly)
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
    
    -- Step 3: Validate existing values (update invalid ones to 'member')
    UPDATE public.user_roles 
    SET role = 'member'
    WHERE role::text NOT IN ('admin', 'staff', 'member');
    
    -- Step 4: Convert text to app_role enum
    ALTER TABLE public.user_roles 
    ALTER COLUMN role TYPE app_role USING 
        CASE role::text
            WHEN 'admin' THEN 'admin'::app_role
            WHEN 'staff' THEN 'staff'::app_role
            WHEN 'member' THEN 'member'::app_role
            ELSE 'member'::app_role
        END;
    
    RAISE NOTICE 'Successfully converted user_roles.role from text to app_role enum';
    RAISE NOTICE 'You must now recreate has_role() function and all RLS policies';
END $$;
```

---

## Step 4: Create `has_role()` Function (CRITICAL - Prevents Infinite Recursion)

1. Go to **SQL Editor**
2. Run this SQL:

```sql
-- Create has_role() function with RLS bypass to prevent infinite recursion
-- This function MUST be created AFTER the role column is app_role type
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
COST 10
AS $$
    -- This query bypasses RLS because SECURITY DEFINER runs with postgres role privileges
    -- The postgres role has BYPASSRLS privilege in Supabase
    -- This prevents infinite recursion when called from RLS policies
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.has_role(uuid, app_role) IS 
    'Checks if a user has a specific role. Uses RLS bypass to prevent infinite recursion when called from RLS policies.';
```

**⚠️ IMPORTANT**: 
- This function MUST use `SECURITY DEFINER` to bypass RLS, otherwise it will cause infinite recursion when used in RLS policies.
- The `user_roles.role` column MUST be of type `app_role` (not `text`) for this function to work.
- If you get an error about "operator does not exist: text = app_role", it means the column is still `text` type - go back to Step 3.

---

## Step 4: Create Tables

### Table: `user_roles`

**⚠️ IMPORTANT**: The `role` column MUST be of type `app_role` (enum), NOT `text`. If you create it as `text`, you'll need to convert it later (see Step 3).

1. Go to **Table Editor** → Click "New table"
2. **Table name**: `user_roles`
3. **Enable Row Level Security**: ✅ Yes (but don't create policies yet - do that in Step 7)
4. **Columns**:
   - `id` (uuid, primary key, default: `gen_random_uuid()`)
   - `user_id` (uuid, references: `auth.users(id)`, on delete: CASCADE, NOT NULL)
   - `role` (app_role, NOT NULL) ← **CRITICAL: Use the enum type, NOT text**
   - `created_at` (timestamptz, default: `now()`)
5. **Unique constraints**: Add unique constraint on (`user_id`, `role`)

**Or via SQL Editor**:
```sql
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,  -- MUST be app_role enum type, NOT text
    created_at timestamptz DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
```

**Note**: If the table already exists with `role` as `text` type, you MUST convert it to `app_role` before creating the `has_role()` function (see Step 3).

---

### Table: `profiles`

1. Go to **Table Editor** → Click "New table"
2. **Table name**: `profiles`
3. **Enable Row Level Security**: ✅ Yes
4. **Columns**:
   - `id` (uuid, primary key, references: `auth.users(id)`, on delete: CASCADE)
   - `full_name` (text, nullable)
   - `avatar_url` (text, nullable)
   - `phone` (text, nullable)
   - `emergency_contact` (text, nullable)
   - `emergency_contact_phone` (text, nullable)
   - `date_of_birth` (date, nullable)
   - `address` (text, nullable)
   - `health_notes` (text, nullable)
   - `created_at` (timestamptz, default: `now()`, NOT NULL)
   - `updated_at` (timestamptz, default: `now()`, NOT NULL)

**Or via SQL Editor**:
```sql
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    emergency_contact TEXT,
    emergency_contact_phone TEXT,
    date_of_birth DATE,
    address TEXT,
    health_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

---

### Table: `classes`

1. Go to **Table Editor** → Click "New table"
2. **Table name**: `classes`
3. **Enable Row Level Security**: ✅ Yes
4. **Columns**:
   - `id` (uuid, primary key, default: `gen_random_uuid()`)
   - `name` (text, NOT NULL)
   - `description` (text, nullable)
   - `instructor` (text, NOT NULL)
   - `schedule` (text, NOT NULL)
   - `duration` (integer, NOT NULL) ← duration in minutes
   - `capacity` (integer, default: 20, NOT NULL)
   - `category` (text, nullable)
   - `image_url` (text, nullable)
   - `is_active` (boolean, default: true)
   - `created_at` (timestamptz, default: `now()`)
   - `updated_at` (timestamptz, default: `now()`)

---

### Table: `class_sessions`

1. Go to **Table Editor** → Click "New table"
2. **Table name**: `class_sessions`
3. **Enable Row Level Security**: ✅ Yes
4. **Columns**:
   - `id` (uuid, primary key, default: `gen_random_uuid()`)
   - `class_id` (uuid, references: `classes(id)`, on delete: SET NULL, nullable) ← Links session to class template
   - `name` (text, NOT NULL)
   - `instructor` (text, nullable)
   - `start_time` (timestamptz, NOT NULL)
   - `end_time` (timestamptz, NOT NULL)
   - `capacity` (integer, nullable)
   - `created_at` (timestamptz, default: `now()`)
5. **Indexes**: Create index on `class_id` for better query performance

---

### Table: `class_bookings`

**⚠️ IMPORTANT**: `class_id` references `class_sessions`, NOT `classes`

1. Go to **Table Editor** → Click "New table"
2. **Table name**: `class_bookings`
3. **Enable Row Level Security**: ✅ Yes
4. **Columns**:
   - `id` (uuid, primary key, default: `gen_random_uuid()`)
   - `user_id` (uuid, references: `profiles(id)`, on delete: CASCADE, NOT NULL)
   - `class_id` (uuid, references: `class_sessions(id)`, on delete: CASCADE, NOT NULL) ← **References class_sessions, NOT classes**
   - `status` (text, default: 'booked', nullable)
   - `created_at` (timestamptz, default: `now()`)

---

### Table: `memberships`

1. Go to **Table Editor** → Click "New table"
2. **Table name**: `memberships`
3. **Enable Row Level Security**: ✅ Yes
4. **Columns**:
   - `id` (uuid, primary key, default: `gen_random_uuid()`)
   - `name` (text, unique, NOT NULL)
   - `price` (numeric(10,2), NOT NULL)
   - `duration_days` (integer, NOT NULL)
   - `access_level` (text, nullable)
   - `created_at` (timestamptz, default: `now()`)
5. **Unique constraints**: Add unique constraint on `name`

---

### Table: `user_memberships`

1. Go to **Table Editor** → Click "New table"
2. **Table name**: `user_memberships`
3. **Enable Row Level Security**: ✅ Yes
4. **Columns**:
   - `id` (uuid, primary key, default: `gen_random_uuid()`)
   - `user_id` (uuid, references: `profiles(id)`, on delete: CASCADE, NOT NULL)
   - `membership_id` (uuid, references: `memberships(id)`, on delete: CASCADE, NOT NULL)
   - `start_date` (timestamptz, default: `now()`, NOT NULL)
   - `end_date` (timestamptz, NOT NULL)
   - `status` (text, default: 'active') ← Add CHECK constraint: `status IN ('active', 'expired', 'cancelled')`
   - `payment_status` (text, default: 'paid') ← Add CHECK constraint: `payment_status IN ('paid', 'pending', 'failed')`
   - `created_at` (timestamptz, default: `now()`)
   - `updated_at` (timestamptz, default: `now()`)
5. **Check constraints**: 
   - `status` must be one of: 'active', 'expired', 'cancelled'
   - `payment_status` must be one of: 'paid', 'pending', 'failed'

---

### Table: `check_ins`

1. Go to **Table Editor** → Click "New table"
2. **Table name**: `check_ins`
3. **Enable Row Level Security**: ✅ Yes
4. **Columns**:
   - `id` (uuid, primary key, default: `gen_random_uuid()`)
   - `user_id` (uuid, references: `profiles(id)`, on delete: CASCADE, NOT NULL)
   - `check_in_time` (timestamptz, default: `now()`, NOT NULL)
   - `check_out_time` (timestamptz, nullable)
   - `duration_minutes` (integer, nullable) ← Auto-calculated by trigger
   - `location` (text, nullable)
   - `created_at` (timestamptz, default: `now()`)

---

## Step 5: Create Additional Functions

### Function: `has_valid_membership()`

Go to **SQL Editor** and run:

```sql
CREATE OR REPLACE FUNCTION public.has_valid_membership(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_memberships
        WHERE user_id = _user_id
        AND status = 'active'
        AND payment_status = 'paid'
        AND end_date > now()
    )
$$;

GRANT EXECUTE ON FUNCTION public.has_valid_membership(uuid) TO authenticated;
```

---

### Function: `calculate_check_in_duration()`

Go to **SQL Editor** and run:

```sql
CREATE OR REPLACE FUNCTION calculate_check_in_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.check_out_time IS NOT NULL AND NEW.check_in_time IS NOT NULL THEN
        NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 60;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### Function: `handle_new_user()`

Go to **SQL Editor** and run:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert profile (ignore if already exists)
    INSERT INTO public.profiles (id, full_name)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', '')
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Assign default 'member' role (ignore if already exists)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'member'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the auth.users insert
        RAISE WARNING 'Error in handle_new_user for user %: %', new.id, SQLERRM;
        RETURN new;
END;
$$;
```

---

## Step 6: Create Triggers

### Trigger: `on_auth_user_created`

Go to **SQL Editor** and run:

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

---

### Trigger: `update_profiles_updated_at`

Go to **SQL Editor** and run:

```sql
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
```

---

### Trigger: `update_classes_updated_at`

Go to **SQL Editor** and run:

```sql
DROP TRIGGER IF EXISTS update_classes_updated_at ON public.classes;
CREATE TRIGGER update_classes_updated_at
    BEFORE UPDATE ON public.classes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
```

---

### Trigger: `update_user_memberships_updated_at`

Go to **SQL Editor** and run:

```sql
DROP TRIGGER IF EXISTS update_user_memberships_updated_at ON public.user_memberships;
CREATE TRIGGER update_user_memberships_updated_at
    BEFORE UPDATE ON public.user_memberships
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
```

---

### Trigger: `set_check_in_duration`

Go to **SQL Editor** and run:

```sql
DROP TRIGGER IF EXISTS set_check_in_duration ON public.check_ins;
CREATE TRIGGER set_check_in_duration
    BEFORE INSERT OR UPDATE ON public.check_ins
    FOR EACH ROW
    EXECUTE FUNCTION calculate_check_in_duration();
```

---

## Step 7: Create RLS Policies

### RLS Policies for `user_roles`

Go to **Authentication → Policies** (or **Table Editor → user_roles → RLS**)

1. **Policy: "Users can view own roles"**
   - Type: SELECT
   - Target roles: `authenticated`
   - USING expression: `auth.uid() = user_id`

2. **Policy: "Users can insert their own member role"**
   - Type: INSERT
   - Target roles: `authenticated`
   - WITH CHECK expression: `auth.uid() = user_id AND role = 'member'::app_role`

3. **Policy: "Admins can view all roles"**
   - Type: SELECT
   - Target roles: `authenticated`
   - USING expression: `public.has_role(auth.uid(), 'admin')`

4. **Policy: "Admins can insert roles"**
   - Type: INSERT
   - Target roles: `authenticated`
   - WITH CHECK expression: `public.has_role(auth.uid(), 'admin')`

5. **Policy: "Admins can update roles"**
   - Type: UPDATE
   - Target roles: `authenticated`
   - USING expression: `public.has_role(auth.uid(), 'admin')`

6. **Policy: "Admins can delete roles"**
   - Type: DELETE
   - Target roles: `authenticated`
   - USING expression: `public.has_role(auth.uid(), 'admin')`

---

### RLS Policies for `profiles`

1. **Policy: "Users can view their own profile"**
   - Type: SELECT
   - Target roles: `authenticated`
   - USING expression: `auth.uid() = id`

2. **Policy: "Users can update their own profile"**
   - Type: UPDATE
   - Target roles: `authenticated`
   - USING expression: `auth.uid() = id`

3. **Policy: "Users can insert their own profile"**
   - Type: INSERT
   - Target roles: `authenticated`
   - WITH CHECK expression: `auth.uid() = id`

4. **Policy: "Admins can view all profiles"**
   - Type: SELECT
   - Target roles: `authenticated`
   - USING expression: `public.has_role(auth.uid(), 'admin')`

5. **Policy: "Admins can update all profiles"**
   - Type: UPDATE
   - Target roles: `authenticated`
   - USING expression: `public.has_role(auth.uid(), 'admin')`

6. **Policy: "Admins can insert profiles"**
   - Type: INSERT
   - Target roles: `authenticated`
   - WITH CHECK expression: `public.has_role(auth.uid(), 'admin')`

7. **Policy: "Admins can delete profiles"**
   - Type: DELETE
   - Target roles: `authenticated`
   - USING expression: `public.has_role(auth.uid(), 'admin')`

---

### RLS Policies for `classes`

1. **Policy: "Anyone can view active classes"**
   - Type: SELECT
   - Target roles: `anon`, `authenticated`
   - USING expression: `is_active = true`

2. **Policy: "Admins can view all classes"**
   - Type: SELECT
   - Target roles: `authenticated`
   - USING expression: `public.has_role(auth.uid(), 'admin')`

3. **Policy: "Admins can insert classes"**
   - Type: INSERT
   - Target roles: `authenticated`
   - WITH CHECK expression: `public.has_role(auth.uid(), 'admin')`

4. **Policy: "Admins can update classes"**
   - Type: UPDATE
   - Target roles: `authenticated`
   - USING expression: `public.has_role(auth.uid(), 'admin')`

5. **Policy: "Admins can delete classes"**
   - Type: DELETE
   - Target roles: `authenticated`
   - USING expression: `public.has_role(auth.uid(), 'admin')`

---

### RLS Policies for `class_sessions`

1. **Policy: "Anyone can view class sessions"**
   - Type: SELECT
   - Target roles: `anon`, `authenticated`
   - USING expression: `true`

2. **Policy: "Admins can insert class sessions"**
   - Type: INSERT
   - Target roles: `authenticated`
   - WITH CHECK expression: `public.has_role(auth.uid(), 'admin')`

3. **Policy: "Admins can update class sessions"**
   - Type: UPDATE
   - Target roles: `authenticated`
   - USING expression: `public.has_role(auth.uid(), 'admin')`

4. **Policy: "Admins can delete class sessions"**
   - Type: DELETE
   - Target roles: `authenticated`
   - USING expression: `public.has_role(auth.uid(), 'admin')`

---

### RLS Policies for `class_bookings`

1. **Policy: "Users can view their own bookings"**
   - Type: SELECT
   - Target roles: `authenticated`
   - USING expression: `auth.uid() = user_id`

2. **Policy: "Admins can view all bookings"**
   - Type: SELECT
   - Target roles: `authenticated`
   - USING expression: `public.has_role(auth.uid(), 'admin')`

3. **Policy: "Users can insert their own bookings"**
   - Type: INSERT
   - Target roles: `authenticated`
   - WITH CHECK expression: `auth.uid() = user_id`

4. **Policy: "Users can update their own bookings"**
   - Type: UPDATE
   - Target roles: `authenticated`
   - USING expression: `auth.uid() = user_id`

5. **Policy: "Admins can update all bookings"**
   - Type: UPDATE
   - Target roles: `authenticated`
   - USING expression: `public.has_role(auth.uid(), 'admin')`

6. **Policy: "Users can delete their own bookings"**
   - Type: DELETE
   - Target roles: `authenticated`
   - USING expression: `auth.uid() = user_id`

7. **Policy: "Admins can delete all bookings"**
   - Type: DELETE
   - Target roles: `authenticated`
   - USING expression: `public.has_role(auth.uid(), 'admin')`

---

### RLS Policies for `memberships`

1. **Policy: "Anyone can view memberships"**
   - Type: SELECT
   - Target roles: `anon`, `authenticated`
   - USING expression: `true`

2. **Policy: "Admins can insert memberships"**
   - Type: INSERT
   - Target roles: `authenticated`
   - WITH CHECK expression: `public.has_role(auth.uid(), 'admin')`

3. **Policy: "Admins can update memberships"**
   - Type: UPDATE
   - Target roles: `authenticated`
   - USING expression: `public.has_role(auth.uid(), 'admin')`

4. **Policy: "Admins can delete memberships"**
   - Type: DELETE
   - Target roles: `authenticated`
   - USING expression: `public.has_role(auth.uid(), 'admin')`

---

### RLS Policies for `user_memberships`

1. **Policy: "Users can view their own memberships"**
   - Type: SELECT
   - Target roles: `authenticated`
   - USING expression: `auth.uid() = user_id`

2. **Policy: "Admins can view all user memberships"**
   - Type: SELECT
   - Target roles: `authenticated`
   - USING expression: `public.has_role(auth.uid(), 'admin')`

3. **Policy: "Admins can insert user memberships"**
   - Type: INSERT
   - Target roles: `authenticated`
   - WITH CHECK expression: `public.has_role(auth.uid(), 'admin')`

4. **Policy: "Admins can update user memberships"**
   - Type: UPDATE
   - Target roles: `authenticated`
   - USING expression: `public.has_role(auth.uid(), 'admin')`

5. **Policy: "Admins can delete user memberships"**
   - Type: DELETE
   - Target roles: `authenticated`
   - USING expression: `public.has_role(auth.uid(), 'admin')`

---

### RLS Policies for `check_ins`

1. **Policy: "Users can view their own check-ins"**
   - Type: SELECT
   - Target roles: `authenticated`
   - USING expression: `auth.uid() = user_id`

2. **Policy: "Admins can view all check-ins"**
   - Type: SELECT
   - Target roles: `authenticated`
   - USING expression: `public.has_role(auth.uid(), 'admin')`

3. **Policy: "Users can insert their own check-ins"**
   - Type: INSERT
   - Target roles: `authenticated`
   - WITH CHECK expression: `auth.uid() = user_id`

4. **Policy: "Users can update their own check-ins"**
   - Type: UPDATE
   - Target roles: `authenticated`
   - USING expression: `auth.uid() = user_id`

5. **Policy: "Admins can update all check-ins"**
   - Type: UPDATE
   - Target roles: `authenticated`
   - USING expression: `public.has_role(auth.uid(), 'admin')`

6. **Policy: "Admins can delete all check-ins"**
   - Type: DELETE
   - Target roles: `authenticated`
   - USING expression: `public.has_role(auth.uid(), 'admin')`

---

## Step 8: Create Indexes

Go to **SQL Editor** and run:

```sql
-- Index for class_sessions.class_id (improves query performance)
CREATE INDEX IF NOT EXISTS idx_class_sessions_class_id 
ON public.class_sessions(class_id);
```

---

## Step 9: Verify Setup

Run these queries in **SQL Editor** to verify everything is set up correctly:

### Check Tables Exist:
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Expected tables:
- `check_ins`
- `class_bookings`
- `class_sessions`
- `classes`
- `memberships`
- `profiles`
- `user_memberships`
- `user_roles`

### Check Enum Type Exists:
```sql
SELECT typname FROM pg_type WHERE typname = 'app_role';
```

Should return: `app_role`

### Check Functions Exist:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;
```

Expected functions:
- `calculate_check_in_duration`
- `handle_new_user`
- `has_role`
- `has_valid_membership`
- `update_updated_at_column`

### Check Foreign Key Relationship (class_bookings → class_sessions):
```sql
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table
FROM pg_constraint 
WHERE conname = 'class_bookings_class_id_fkey';
```

Should show: `class_bookings.class_id` → `class_sessions.id` (NOT `classes.id`)

### Check RLS is Enabled:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should have `rowsecurity = true`

---

## Common Issues & Solutions

### Issue: "infinite recursion detected in policy for relation 'user_roles'"

**Solution**: The `has_role()` function MUST use `SECURITY DEFINER`. This allows it to bypass RLS when checking roles, preventing infinite recursion. Make sure the function is created exactly as shown in Step 3.

### Issue: "Could not find a relationship between 'class_bookings' and 'class_sessions'"

**Solution**: Verify that `class_bookings.class_id` references `class_sessions(id)`, NOT `classes(id)`. Check the foreign key constraint in Step 9.

### Issue: "operator does not exist: text = app_role"

**Solution**: Ensure the `user_roles.role` column is of type `app_role` (enum), not `text`. If it's currently `text`, you'll need to:
1. Drop all policies on `user_roles`
2. Drop the `has_role()` function
3. Convert the column type from `text` to `app_role`
4. Recreate the function and policies

### Issue: Function `has_role()` not found

**Solution**: Make sure you created the function in Step 3 before creating any RLS policies that use it.

---

## Notes

- **Schema Reference**: The current schema state is reflected in `src/types/database.ts` (auto-generated)
- **Foreign Keys**: Always verify foreign key relationships match the code expectations
- **RLS Policies**: All policies use `has_role()` for admin checks - this function MUST exist and use `SECURITY DEFINER`
- **Triggers**: The `handle_new_user()` trigger automatically creates profiles and assigns 'member' role on user signup

---

## Next Steps

After setting up the schema:
1. Test user signup - verify profile and role are created automatically
2. Test admin access - create a user with 'admin' role and verify admin policies work
3. Test bookings - verify the `class_bookings.class_id` → `class_sessions.id` relationship works
4. Run `npm run sync:types` to update `src/types/database.ts` with the current schema

