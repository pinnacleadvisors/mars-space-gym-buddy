-- =====================================================
-- App Role Enum and User Roles Table Migration
-- This handles the app_role enum type and user_roles table
-- Run this FIRST, then run the other tables migration
-- =====================================================

-- =====================================================
-- 1. CREATE app_role ENUM TYPE
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'member');
        RAISE NOTICE 'Created app_role enum type';
    ELSE
        RAISE NOTICE 'app_role enum type already exists, skipping';
    END IF;
END $$;

-- =====================================================
-- 2. CREATE user_roles TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role text NOT NULL,  -- Start as text, will be converted to app_role after table creation
    created_at timestamptz DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. Convert role column from text to app_role enum (if needed)
-- =====================================================
DO $$ 
DECLARE
    current_type text;
BEGIN
    -- Check the actual column type using pg_type
    SELECT t.typname INTO current_type
    FROM pg_attribute a
    JOIN pg_class cl ON a.attrelid = cl.oid
    JOIN pg_type t ON a.atttypid = t.oid
    JOIN pg_namespace n ON cl.relnamespace = n.oid
    WHERE n.nspname = 'public'
    AND cl.relname = 'user_roles'
    AND a.attname = 'role'
    LIMIT 1;
    
    RAISE NOTICE 'Current role column type: %', COALESCE(current_type, 'not found');
    
    -- Only convert if it's text type
    IF current_type IS NULL OR current_type = 'text' THEN
        RAISE NOTICE 'Converting role column from text to app_role enum...';
        
        -- Step 1: Drop all policies that might depend on this column
        -- (We'll recreate them later)
        PERFORM format('DROP POLICY IF EXISTS %I ON public.user_roles', pol.policyname)
        FROM pg_policies pol
        WHERE pol.schemaname = 'public'
        AND pol.tablename = 'user_roles';
        
        -- Step 2: Validate existing values
        UPDATE public.user_roles 
        SET role = 'member'
        WHERE role NOT IN ('admin', 'staff', 'member');
        
        -- Step 3: Convert text to app_role enum
        BEGIN
            ALTER TABLE public.user_roles 
            ALTER COLUMN role TYPE app_role USING 
                CASE role
                    WHEN 'admin' THEN 'admin'::app_role
                    WHEN 'staff' THEN 'staff'::app_role
                    WHEN 'member' THEN 'member'::app_role
                    ELSE 'member'::app_role
                END;
            
            RAISE NOTICE 'Successfully converted user_roles.role from text to app_role enum';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Could not convert role column: %. Column remains as text type.', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Role column is already app_role type, skipping conversion';
    END IF;
END $$;

-- =====================================================
-- 4. CREATE has_role() FUNCTION (with RLS bypass fix)
-- Handles both text and app_role types for compatibility
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
COST 10
AS $$
    -- This query bypasses RLS because:
    -- 1. SECURITY DEFINER runs with function owner privileges (postgres role)
    -- 2. The postgres role has BYPASSRLS privilege in Supabase
    -- 3. This prevents infinite recursion when called from RLS policies
    -- Note: Handles both text and app_role types by casting to text
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role::text = _role::text
    )
$$;

-- Also create overload for app_role enum type
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
COST 10
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

COMMENT ON FUNCTION public.has_role(uuid, app_role) IS 
    'Checks if a user has a specific role. Uses RLS bypass to prevent infinite recursion when called from RLS policies.';

COMMENT ON FUNCTION public.has_role(uuid, text) IS 
    'Checks if a user has a specific role (text version for compatibility). Uses RLS bypass to prevent infinite recursion.';

-- =====================================================
-- 5. CREATE RLS POLICIES FOR user_roles
-- =====================================================
DO $$ 
BEGIN
    -- Users can view their own roles
    DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
    CREATE POLICY "Users can view own roles"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
    
    -- Users can insert their own member role (fallback if trigger fails)
    DROP POLICY IF EXISTS "Users can insert their own member role" ON public.user_roles;
    CREATE POLICY "Users can insert their own member role"
    ON public.user_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id 
        AND (role::text = 'member' OR role = 'member'::app_role)
    );
    
    -- Admins can view all roles
    DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
    CREATE POLICY "Admins can view all roles"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
    
    -- Admins can insert roles
    DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
    CREATE POLICY "Admins can insert roles"
    ON public.user_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
    
    -- Admins can update roles
    DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
    CREATE POLICY "Admins can update roles"
    ON public.user_roles
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
    
    -- Admins can delete roles
    DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
    CREATE POLICY "Admins can delete roles"
    ON public.user_roles
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'App role enum and user_roles table setup completed!';
    RAISE NOTICE 'Next: Run the other tables migration';
    RAISE NOTICE '========================================';
END $$;

