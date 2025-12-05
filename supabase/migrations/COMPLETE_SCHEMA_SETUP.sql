-- =====================================================
-- COMPLETE DATABASE SCHEMA SETUP
-- This script sets up the entire database schema from scratch
-- Based on src/types/database.ts and ROADMAP.md
-- 
-- Run this AFTER running RESET_DATABASE.sql (if resetting)
-- Or run this if starting fresh
-- =====================================================

-- =====================================================
-- 1. CREATE app_role ENUM TYPE
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'member');
        RAISE NOTICE '✅ Created app_role enum type';
    ELSE
        RAISE NOTICE 'ℹ️  app_role enum type already exists';
    END IF;
END $$;

-- =====================================================
-- 2. CREATE update_updated_at_column() FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created update_updated_at_column() function';
END $$;

-- =====================================================
-- 3. CREATE user_roles TABLE (with app_role enum type)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,  -- CRITICAL: Must be app_role enum, NOT text
    created_at timestamptz DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created user_roles table with app_role enum type';
END $$;

-- =====================================================
-- 4. CREATE has_role() FUNCTION (with RLS bypass fix)
-- Must be created BEFORE RLS policies to prevent infinite recursion
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
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
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

COMMENT ON FUNCTION public.has_role(uuid, app_role) IS 
    'Checks if a user has a specific role. Uses RLS bypass to prevent infinite recursion when called from RLS policies.';

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created has_role() function with RLS bypass';
END $$;

-- =====================================================
-- 5. CREATE profiles TABLE
-- =====================================================
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

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created profiles table';
END $$;

-- =====================================================
-- 6. CREATE classes TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.classes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    instructor text NOT NULL,
    schedule text NOT NULL,
    duration integer NOT NULL,
    capacity integer NOT NULL DEFAULT 20,
    category text,
    image_url text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_classes_updated_at ON public.classes;
CREATE TRIGGER update_classes_updated_at
    BEFORE UPDATE ON public.classes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created classes table';
END $$;

-- =====================================================
-- 7. CREATE class_sessions TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.class_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
    name text NOT NULL,
    instructor text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    capacity integer,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_class_sessions_class_id ON public.class_sessions(class_id);

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created class_sessions table';
END $$;

-- =====================================================
-- 8. CREATE class_bookings TABLE
-- IMPORTANT: class_id references class_sessions, NOT classes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.class_bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    class_id uuid REFERENCES public.class_sessions(id) ON DELETE CASCADE NOT NULL,
    status text DEFAULT 'booked',
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.class_bookings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created class_bookings table with correct foreign key to class_sessions';
END $$;

-- =====================================================
-- 9. CREATE memberships TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    price numeric(10,2) NOT NULL,
    duration_days integer NOT NULL,
    access_level text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created memberships table';
END $$;

-- =====================================================
-- 10. CREATE user_memberships TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    membership_id uuid REFERENCES public.memberships(id) ON DELETE CASCADE NOT NULL,
    start_date timestamp with time zone NOT NULL DEFAULT now(),
    end_date timestamp with time zone NOT NULL,
    status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    payment_status text DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'failed')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_user_memberships_updated_at ON public.user_memberships;
CREATE TRIGGER update_user_memberships_updated_at
    BEFORE UPDATE ON public.user_memberships
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created user_memberships table';
END $$;

-- =====================================================
-- 11. CREATE check_ins TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.check_ins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    check_in_time timestamp with time zone NOT NULL DEFAULT now(),
    check_out_time timestamp with time zone,
    duration_minutes integer,
    location text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION calculate_check_in_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.check_out_time IS NOT NULL AND NEW.check_in_time IS NOT NULL THEN
        NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 60;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_check_in_duration ON public.check_ins;
CREATE TRIGGER set_check_in_duration
    BEFORE INSERT OR UPDATE ON public.check_ins
    FOR EACH ROW
    EXECUTE FUNCTION calculate_check_in_duration();

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created check_ins table';
END $$;

-- =====================================================
-- 12. CREATE has_valid_membership() FUNCTION
-- =====================================================
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

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created has_valid_membership() function';
END $$;

-- =====================================================
-- 13. CREATE handle_new_user() TRIGGER FUNCTION
-- =====================================================
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created handle_new_user() trigger';
END $$;

-- =====================================================
-- 14. CREATE ALL RLS POLICIES
-- =====================================================

-- RLS Policies for user_roles
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
    CREATE POLICY "Users can view own roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can insert their own member role" ON public.user_roles;
    CREATE POLICY "Users can insert their own member role"
    ON public.user_roles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id AND role = 'member'::app_role);
    
    DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
    CREATE POLICY "Admins can view all roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
    CREATE POLICY "Admins can insert roles"
    ON public.user_roles FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
    CREATE POLICY "Admins can update roles"
    ON public.user_roles FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
    CREATE POLICY "Admins can delete roles"
    ON public.user_roles FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
END $$;

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created RLS policies for user_roles';
END $$;

-- RLS Policies for profiles
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
    CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);
    
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
    
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
    CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);
    
    DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
    CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
    CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
    CREATE POLICY "Admins can insert profiles"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
    CREATE POLICY "Admins can delete profiles"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
END $$;

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created RLS policies for profiles';
END $$;

-- RLS Policies for classes
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view active classes" ON public.classes;
    CREATE POLICY "Anyone can view active classes"
    ON public.classes FOR SELECT
    USING (is_active = true);
    
    DROP POLICY IF EXISTS "Admins can view all classes" ON public.classes;
    CREATE POLICY "Admins can view all classes"
    ON public.classes FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can insert classes" ON public.classes;
    CREATE POLICY "Admins can insert classes"
    ON public.classes FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can update classes" ON public.classes;
    CREATE POLICY "Admins can update classes"
    ON public.classes FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can delete classes" ON public.classes;
    CREATE POLICY "Admins can delete classes"
    ON public.classes FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
END $$;

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created RLS policies for classes';
END $$;

-- RLS Policies for class_sessions
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view class sessions" ON public.class_sessions;
    CREATE POLICY "Anyone can view class sessions"
    ON public.class_sessions FOR SELECT
    USING (true);
    
    DROP POLICY IF EXISTS "Admins can insert class sessions" ON public.class_sessions;
    CREATE POLICY "Admins can insert class sessions"
    ON public.class_sessions FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can update class sessions" ON public.class_sessions;
    CREATE POLICY "Admins can update class sessions"
    ON public.class_sessions FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can delete class sessions" ON public.class_sessions;
    CREATE POLICY "Admins can delete class sessions"
    ON public.class_sessions FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
END $$;

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created RLS policies for class_sessions';
END $$;

-- RLS Policies for class_bookings
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own bookings" ON public.class_bookings;
    CREATE POLICY "Users can view their own bookings"
    ON public.class_bookings FOR SELECT
    USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Admins can view all bookings" ON public.class_bookings;
    CREATE POLICY "Admins can view all bookings"
    ON public.class_bookings FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Users can insert their own bookings" ON public.class_bookings;
    CREATE POLICY "Users can insert their own bookings"
    ON public.class_bookings FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can update their own bookings" ON public.class_bookings;
    CREATE POLICY "Users can update their own bookings"
    ON public.class_bookings FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Admins can update all bookings" ON public.class_bookings;
    CREATE POLICY "Admins can update all bookings"
    ON public.class_bookings FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.class_bookings;
    CREATE POLICY "Users can delete their own bookings"
    ON public.class_bookings FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Admins can delete all bookings" ON public.class_bookings;
    CREATE POLICY "Admins can delete all bookings"
    ON public.class_bookings FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
END $$;

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created RLS policies for class_bookings';
END $$;

-- RLS Policies for memberships
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view memberships" ON public.memberships;
    CREATE POLICY "Anyone can view memberships"
    ON public.memberships FOR SELECT
    USING (true);
    
    DROP POLICY IF EXISTS "Admins can insert memberships" ON public.memberships;
    CREATE POLICY "Admins can insert memberships"
    ON public.memberships FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can update memberships" ON public.memberships;
    CREATE POLICY "Admins can update memberships"
    ON public.memberships FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can delete memberships" ON public.memberships;
    CREATE POLICY "Admins can delete memberships"
    ON public.memberships FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
END $$;

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created RLS policies for memberships';
END $$;

-- RLS Policies for user_memberships
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own memberships" ON public.user_memberships;
    CREATE POLICY "Users can view their own memberships"
    ON public.user_memberships FOR SELECT
    USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Admins can view all user memberships" ON public.user_memberships;
    CREATE POLICY "Admins can view all user memberships"
    ON public.user_memberships FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can insert user memberships" ON public.user_memberships;
    CREATE POLICY "Admins can insert user memberships"
    ON public.user_memberships FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can update user memberships" ON public.user_memberships;
    CREATE POLICY "Admins can update user memberships"
    ON public.user_memberships FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can delete user memberships" ON public.user_memberships;
    CREATE POLICY "Admins can delete user memberships"
    ON public.user_memberships FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
END $$;

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created RLS policies for user_memberships';
END $$;

-- RLS Policies for check_ins
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own check-ins" ON public.check_ins;
    CREATE POLICY "Users can view their own check-ins"
    ON public.check_ins FOR SELECT
    USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Admins can view all check-ins" ON public.check_ins;
    CREATE POLICY "Admins can view all check-ins"
    ON public.check_ins FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Users can insert their own check-ins" ON public.check_ins;
    CREATE POLICY "Users can insert their own check-ins"
    ON public.check_ins FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can update their own check-ins" ON public.check_ins;
    CREATE POLICY "Users can update their own check-ins"
    ON public.check_ins FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Admins can update all check-ins" ON public.check_ins;
    CREATE POLICY "Admins can update all check-ins"
    ON public.check_ins FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can delete all check-ins" ON public.check_ins;
    CREATE POLICY "Admins can delete all check-ins"
    ON public.check_ins FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
END $$;

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created RLS policies for check_ins';
END $$;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Database schema setup completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Verify tables: SELECT tablename FROM pg_tables WHERE schemaname = ''public'';';
    RAISE NOTICE '2. Verify enum: SELECT typname FROM pg_type WHERE typname = ''app_role'';';
    RAISE NOTICE '3. Verify foreign key: class_bookings.class_id should reference class_sessions';
    RAISE NOTICE '4. Test signup: Create a new user and verify profile/role are created';
    RAISE NOTICE '5. Create an admin user: INSERT INTO user_roles (user_id, role) VALUES (user_uuid, ''admin'');';
    RAISE NOTICE '';
    RAISE NOTICE 'Run: npm run sync:types to update src/types/database.ts';
    RAISE NOTICE '========================================';
END $$;

