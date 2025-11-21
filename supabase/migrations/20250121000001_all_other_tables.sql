-- =====================================================
-- All Other Tables Migration
-- Creates all remaining tables, functions, triggers, and RLS policies
-- Based on src/types/database.ts and ROADMAP.md implementations
-- 
-- IMPORTANT: Run 20250121000000_app_role_enum_setup.sql FIRST
-- =====================================================

-- =====================================================
-- 1. CREATE update_updated_at_column() FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =====================================================
-- 2. CREATE profiles TABLE
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

-- RLS Policies for profiles
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
    CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);
    
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);
    
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
    CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);
    
    DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
    CREATE POLICY "Admins can view all profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
    CREATE POLICY "Admins can update all profiles"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
    CREATE POLICY "Admins can insert profiles"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
    CREATE POLICY "Admins can delete profiles"
    ON public.profiles
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
END $$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 3. CREATE classes TABLE
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

-- RLS Policies for classes
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view active classes" ON public.classes;
    CREATE POLICY "Anyone can view active classes"
    ON public.classes
    FOR SELECT
    USING (is_active = true);
    
    DROP POLICY IF EXISTS "Admins can view all classes" ON public.classes;
    CREATE POLICY "Admins can view all classes"
    ON public.classes
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can insert classes" ON public.classes;
    CREATE POLICY "Admins can insert classes"
    ON public.classes
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can update classes" ON public.classes;
    CREATE POLICY "Admins can update classes"
    ON public.classes
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can delete classes" ON public.classes;
    CREATE POLICY "Admins can delete classes"
    ON public.classes
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
END $$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_classes_updated_at ON public.classes;
CREATE TRIGGER update_classes_updated_at
    BEFORE UPDATE ON public.classes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 4. CREATE class_sessions TABLE
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

-- RLS Policies for class_sessions
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view class sessions" ON public.class_sessions;
    CREATE POLICY "Anyone can view class sessions"
    ON public.class_sessions
    FOR SELECT
    USING (true);
    
    DROP POLICY IF EXISTS "Admins can insert class sessions" ON public.class_sessions;
    CREATE POLICY "Admins can insert class sessions"
    ON public.class_sessions
    FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can update class sessions" ON public.class_sessions;
    CREATE POLICY "Admins can update class sessions"
    ON public.class_sessions
    FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can delete class sessions" ON public.class_sessions;
    CREATE POLICY "Admins can delete class sessions"
    ON public.class_sessions
    FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
END $$;

-- Index for better query performance
CREATE INDEX IF NOT EXISTS idx_class_sessions_class_id ON public.class_sessions(class_id);

-- =====================================================
-- 5. CREATE class_bookings TABLE
-- IMPORTANT: class_id references class_sessions, not classes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.class_bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    class_id uuid REFERENCES public.class_sessions(id) ON DELETE CASCADE NOT NULL,
    status text DEFAULT 'booked',
    created_at timestamp with time zone DEFAULT now()
);

-- If table already exists with wrong foreign key, fix it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'class_bookings_class_id_fkey'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        -- Check if the foreign key references the wrong table
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu 
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.table_name = 'class_bookings'
            AND tc.constraint_name = 'class_bookings_class_id_fkey'
            AND ccu.table_name = 'classes'
        ) THEN
            -- Drop the wrong foreign key constraint
            ALTER TABLE public.class_bookings 
            DROP CONSTRAINT IF EXISTS class_bookings_class_id_fkey;
            
            -- Add the correct foreign key to class_sessions
            ALTER TABLE public.class_bookings
            ADD CONSTRAINT class_bookings_class_id_fkey
            FOREIGN KEY (class_id) 
            REFERENCES public.class_sessions(id) 
            ON DELETE CASCADE;
            
            RAISE NOTICE 'Fixed class_bookings.class_id foreign key to reference class_sessions';
        END IF;
    END IF;
    
    -- If table exists but no foreign key, add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'class_bookings_class_id_fkey'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE public.class_bookings
        ADD CONSTRAINT class_bookings_class_id_fkey
        FOREIGN KEY (class_id) 
        REFERENCES public.class_sessions(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Added class_bookings.class_id foreign key to reference class_sessions';
    END IF;
END $$;

ALTER TABLE public.class_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for class_bookings
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own bookings" ON public.class_bookings;
    CREATE POLICY "Users can view their own bookings"
    ON public.class_bookings
    FOR SELECT
    USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Admins can view all bookings" ON public.class_bookings;
    CREATE POLICY "Admins can view all bookings"
    ON public.class_bookings
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Users can insert their own bookings" ON public.class_bookings;
    CREATE POLICY "Users can insert their own bookings"
    ON public.class_bookings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can update their own bookings" ON public.class_bookings;
    CREATE POLICY "Users can update their own bookings"
    ON public.class_bookings
    FOR UPDATE
    USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Admins can update all bookings" ON public.class_bookings;
    CREATE POLICY "Admins can update all bookings"
    ON public.class_bookings
    FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.class_bookings;
    CREATE POLICY "Users can delete their own bookings"
    ON public.class_bookings
    FOR DELETE
    USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Admins can delete all bookings" ON public.class_bookings;
    CREATE POLICY "Admins can delete all bookings"
    ON public.class_bookings
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
END $$;

-- =====================================================
-- 6. CREATE memberships TABLE
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

-- RLS Policies for memberships
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view memberships" ON public.memberships;
    CREATE POLICY "Anyone can view memberships"
    ON public.memberships
    FOR SELECT
    USING (true);
    
    DROP POLICY IF EXISTS "Admins can insert memberships" ON public.memberships;
    CREATE POLICY "Admins can insert memberships"
    ON public.memberships
    FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can update memberships" ON public.memberships;
    CREATE POLICY "Admins can update memberships"
    ON public.memberships
    FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can delete memberships" ON public.memberships;
    CREATE POLICY "Admins can delete memberships"
    ON public.memberships
    FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
END $$;

-- =====================================================
-- 7. CREATE user_memberships TABLE
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

-- RLS Policies for user_memberships
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own memberships" ON public.user_memberships;
    CREATE POLICY "Users can view their own memberships"
    ON public.user_memberships
    FOR SELECT
    USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Admins can view all user memberships" ON public.user_memberships;
    CREATE POLICY "Admins can view all user memberships"
    ON public.user_memberships
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can insert user memberships" ON public.user_memberships;
    CREATE POLICY "Admins can insert user memberships"
    ON public.user_memberships
    FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can update user memberships" ON public.user_memberships;
    CREATE POLICY "Admins can update user memberships"
    ON public.user_memberships
    FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can delete user memberships" ON public.user_memberships;
    CREATE POLICY "Admins can delete user memberships"
    ON public.user_memberships
    FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
END $$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_user_memberships_updated_at ON public.user_memberships;
CREATE TRIGGER update_user_memberships_updated_at
    BEFORE UPDATE ON public.user_memberships
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 8. CREATE has_valid_membership() FUNCTION
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

-- =====================================================
-- 9. CREATE check_ins TABLE
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

-- RLS Policies for check_ins
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own check-ins" ON public.check_ins;
    CREATE POLICY "Users can view their own check-ins"
    ON public.check_ins
    FOR SELECT
    USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Admins can view all check-ins" ON public.check_ins;
    CREATE POLICY "Admins can view all check-ins"
    ON public.check_ins
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Users can insert their own check-ins" ON public.check_ins;
    CREATE POLICY "Users can insert their own check-ins"
    ON public.check_ins
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can update their own check-ins" ON public.check_ins;
    CREATE POLICY "Users can update their own check-ins"
    ON public.check_ins
    FOR UPDATE
    USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Admins can update all check-ins" ON public.check_ins;
    CREATE POLICY "Admins can update all check-ins"
    ON public.check_ins
    FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can delete all check-ins" ON public.check_ins;
    CREATE POLICY "Admins can delete all check-ins"
    ON public.check_ins
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
END $$;

-- Function to calculate check-in duration
CREATE OR REPLACE FUNCTION calculate_check_in_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.check_out_time IS NOT NULL AND NEW.check_in_time IS NOT NULL THEN
        NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 60;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for duration calculation
DROP TRIGGER IF EXISTS set_check_in_duration ON public.check_ins;
CREATE TRIGGER set_check_in_duration
    BEFORE INSERT OR UPDATE ON public.check_ins
    FOR EACH ROW
    EXECUTE FUNCTION calculate_check_in_duration();

-- =====================================================
-- 10. CREATE handle_new_user() TRIGGER FUNCTION
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
    -- Handle both text and app_role types
    BEGIN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (new.id, 'member'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
    EXCEPTION
        WHEN OTHERS THEN
            -- Fallback: try as text if enum doesn't work
            BEGIN
                INSERT INTO public.user_roles (user_id, role)
                VALUES (new.id, 'member')
                ON CONFLICT (user_id, role) DO NOTHING;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE WARNING 'Could not insert role for user %: %', new.id, SQLERRM;
            END;
    END;
    
    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the auth.users insert
        RAISE WARNING 'Error in handle_new_user for user %: %', new.id, SQLERRM;
        RETURN new;
END;
$$;

-- Create or replace trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All other tables migration completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - profiles';
    RAISE NOTICE '  - classes';
    RAISE NOTICE '  - class_sessions';
    RAISE NOTICE '  - class_bookings';
    RAISE NOTICE '  - memberships';
    RAISE NOTICE '  - user_memberships';
    RAISE NOTICE '  - check_ins';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '  - update_updated_at_column()';
    RAISE NOTICE '  - has_valid_membership()';
    RAISE NOTICE '  - calculate_check_in_duration()';
    RAISE NOTICE '  - handle_new_user()';
    RAISE NOTICE '';
    RAISE NOTICE 'All RLS policies and triggers have been created.';
END $$;

