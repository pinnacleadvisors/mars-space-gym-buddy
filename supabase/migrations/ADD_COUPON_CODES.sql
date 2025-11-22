-- =====================================================
-- ADD COUPON CODES AND USAGE TRACKING
-- This migration adds support for discount/referral codes
-- =====================================================

-- =====================================================
-- CREATE coupon_type ENUM
-- =====================================================
DO $$ BEGIN
    CREATE TYPE public.coupon_type AS ENUM ('percentage', 'money_off');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- CREATE coupon_codes TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.coupon_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text UNIQUE NOT NULL,
    type public.coupon_type NOT NULL,
    value numeric(10, 2) NOT NULL, -- Percentage (0-100) or amount in pounds
    description text,
    is_active boolean DEFAULT true,
    usage_limit integer, -- Optional limit on number of uses (NULL = unlimited)
    valid_from timestamp with time zone DEFAULT now(),
    valid_until timestamp with time zone, -- NULL = no expiration
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_coupon_codes_code ON public.coupon_codes(code);
CREATE INDEX IF NOT EXISTS idx_coupon_codes_is_active ON public.coupon_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_coupon_codes_valid_dates ON public.coupon_codes(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupon_codes_created_by ON public.coupon_codes(created_by);

-- =====================================================
-- CREATE coupon_usage TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id uuid REFERENCES public.coupon_codes(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    used_at timestamp with time zone DEFAULT now(),
    order_id text, -- For future Stripe integration
    created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON public.coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_used_at ON public.coupon_usage(used_at);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES FOR coupon_codes
-- =====================================================

-- Anyone can view active coupon codes (for public use)
CREATE POLICY "Anyone can view active coupon codes"
    ON public.coupon_codes
    FOR SELECT
    USING (is_active = true AND (valid_until IS NULL OR valid_until > now()) AND valid_from <= now());

-- Admins can view all coupon codes
CREATE POLICY "Admins can view all coupon codes"
    ON public.coupon_codes
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert coupon codes
CREATE POLICY "Admins can insert coupon codes"
    ON public.coupon_codes
    FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update coupon codes
CREATE POLICY "Admins can update coupon codes"
    ON public.coupon_codes
    FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete coupon codes
CREATE POLICY "Admins can delete coupon codes"
    ON public.coupon_codes
    FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS POLICIES FOR coupon_usage
-- =====================================================

-- Users can view their own coupon usage
CREATE POLICY "Users can view their own coupon usage"
    ON public.coupon_usage
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own coupon usage (when using a coupon)
CREATE POLICY "Users can insert their own coupon usage"
    ON public.coupon_usage
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all coupon usage
CREATE POLICY "Admins can view all coupon usage"
    ON public.coupon_usage
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert coupon usage (for manual tracking)
CREATE POLICY "Admins can insert coupon usage"
    ON public.coupon_usage
    FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TRIGGER FUNCTION: update_updated_at_column
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_coupon_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE TRIGGER: update updated_at on coupon_codes
-- =====================================================
DROP TRIGGER IF EXISTS update_coupon_codes_updated_at ON public.coupon_codes;
CREATE TRIGGER update_coupon_codes_updated_at
    BEFORE UPDATE ON public.coupon_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_coupon_codes_updated_at();

-- =====================================================
-- FUNCTION: get_coupon_usage_count
-- Returns the number of times a coupon has been used
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_coupon_usage_count(_coupon_id uuid)
RETURNS integer AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.coupon_usage
        WHERE coupon_id = _coupon_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: is_coupon_valid
-- Checks if a coupon code is valid (active, within date range, not exceeded usage limit)
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_coupon_valid(_code text)
RETURNS boolean AS $$
DECLARE
    _coupon public.coupon_codes;
    _usage_count integer;
BEGIN
    -- Get coupon by code
    SELECT * INTO _coupon
    FROM public.coupon_codes
    WHERE code = _code;

    -- Coupon doesn't exist
    IF _coupon IS NULL THEN
        RETURN false;
    END IF;

    -- Coupon is not active
    IF _coupon.is_active = false THEN
        RETURN false;
    END IF;

    -- Check date validity
    IF _coupon.valid_from > now() THEN
        RETURN false;
    END IF;

    IF _coupon.valid_until IS NOT NULL AND _coupon.valid_until < now() THEN
        RETURN false;
    END IF;

    -- Check usage limit
    IF _coupon.usage_limit IS NOT NULL THEN
        _usage_count := public.get_coupon_usage_count(_coupon.id);
        IF _usage_count >= _coupon.usage_limit THEN
            RETURN false;
        END IF;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

