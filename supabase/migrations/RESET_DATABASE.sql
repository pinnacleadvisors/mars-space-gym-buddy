-- =====================================================
-- RESET DATABASE - Drops all tables, functions, types, and policies
-- ⚠️ WARNING: This will DELETE ALL DATA in the public schema
-- Run this ONLY if you want to start fresh
-- =====================================================

-- Drop all triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_classes_updated_at ON public.classes;
DROP TRIGGER IF EXISTS update_user_memberships_updated_at ON public.user_memberships;
DROP TRIGGER IF EXISTS set_check_in_duration ON public.check_ins;

-- Drop all policies on all tables
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Dropped policy: %.%', pol.tablename, pol.policyname;
    END LOOP;
END $$;

-- Drop all functions
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.has_valid_membership(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS calculate_check_in_duration() CASCADE;

-- Drop all tables (in dependency order)
DROP TABLE IF EXISTS public.check_ins CASCADE;
DROP TABLE IF EXISTS public.class_bookings CASCADE;
DROP TABLE IF EXISTS public.class_sessions CASCADE;
DROP TABLE IF EXISTS public.user_memberships CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.memberships CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;

-- Drop enum type (if it exists)
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Reset complete
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database reset complete!';
    RAISE NOTICE 'All tables, functions, policies, and types have been dropped.';
    RAISE NOTICE 'You can now run the complete setup script.';
    RAISE NOTICE '========================================';
END $$;

