-- =====================================================
-- ADD REWARD CLAIMS TABLE
-- This migration adds support for tracking reward claims via QR codes
-- =====================================================

-- =====================================================
-- CREATE reward_claims TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reward_claims (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    claimed_at timestamp with time zone NOT NULL DEFAULT now(),
    qr_code_data jsonb, -- Store the QR code data that was used
    qr_timestamp bigint, -- Store the timestamp from QR code
    qr_session_id text, -- Store the session ID from QR code
    reward_type text DEFAULT 'free_drink' CHECK (reward_type IN ('free_drink', 'other')),
    created_at timestamp with time zone DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reward_claims_user_id ON public.reward_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_claims_claimed_at ON public.reward_claims(claimed_at);
CREATE INDEX IF NOT EXISTS idx_reward_claims_qr_timestamp_session ON public.reward_claims(qr_timestamp, qr_session_id);

ALTER TABLE public.reward_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reward_claims
-- Users can only see their own reward claims
CREATE POLICY "Users can view their own reward claims"
    ON public.reward_claims
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own reward claims (when claiming via QR)
CREATE POLICY "Users can insert their own reward claims"
    ON public.reward_claims
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all reward claims
CREATE POLICY "Admins can view all reward claims"
    ON public.reward_claims
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert reward claims (for staff scanning member QR codes)
CREATE POLICY "Admins can insert reward claims"
    ON public.reward_claims
    FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created reward_claims table with RLS policies';
END $$;

-- =====================================================
-- CREATE FUNCTION: claim_reward()
-- Validates and records a reward claim
-- =====================================================
CREATE OR REPLACE FUNCTION public.claim_reward(
    _user_id uuid,
    _qr_timestamp bigint,
    _qr_session_id text,
    _reward_type text DEFAULT 'free_drink'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _result jsonb;
    _last_claim_time timestamptz;
    _hours_since_last_claim numeric;
BEGIN
    -- Check if QR code is valid (not expired - 5 minutes)
    IF (EXTRACT(EPOCH FROM now()) * 1000) - _qr_timestamp > 300000 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'QR code has expired'
        );
    END IF;

    -- Check if this QR code was already used (prevent replay attacks)
    IF EXISTS (
        SELECT 1
        FROM public.reward_claims
        WHERE user_id = _user_id
        AND qr_timestamp = _qr_timestamp
        AND qr_session_id = _qr_session_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'This QR code has already been used'
        );
    END IF;

    -- Insert the reward claim
    INSERT INTO public.reward_claims (
        user_id,
        qr_timestamp,
        qr_session_id,
        reward_type,
        qr_code_data
    ) VALUES (
        _user_id,
        _qr_timestamp,
        _qr_session_id,
        _reward_type,
        jsonb_build_object(
            'timestamp', _qr_timestamp,
            'session_id', _qr_session_id,
            'reward_type', _reward_type
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Reward claimed successfully',
        'claimed_at', now()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_reward(uuid, bigint, text, text) TO authenticated;

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created claim_reward() function';
END $$;

