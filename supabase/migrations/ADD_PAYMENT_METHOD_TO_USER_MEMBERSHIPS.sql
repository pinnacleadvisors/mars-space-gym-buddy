-- Migration: Add payment_method and stripe_subscription_id to user_memberships
-- Purpose: Track payment method (stripe, cash, staff, family, other) and Stripe subscription ID
-- Run this in Supabase Dashboard SQL Editor

-- Add payment_method column
ALTER TABLE public.user_memberships 
ADD COLUMN IF NOT EXISTS payment_method text 
CHECK (payment_method IN ('stripe', 'cash', 'other', 'staff', 'family') OR payment_method IS NULL);

-- Add stripe_subscription_id column to track Stripe subscriptions
ALTER TABLE public.user_memberships 
ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Add index for faster lookups on stripe_subscription_id
CREATE INDEX IF NOT EXISTS idx_user_memberships_stripe_subscription_id 
ON public.user_memberships(stripe_subscription_id) 
WHERE stripe_subscription_id IS NOT NULL;

-- Add index for payment_method lookups
CREATE INDEX IF NOT EXISTS idx_user_memberships_payment_method 
ON public.user_memberships(payment_method) 
WHERE payment_method IS NOT NULL;

-- Add comment to document the columns
COMMENT ON COLUMN public.user_memberships.payment_method IS 'Payment method: stripe, cash, staff, family, or other. NULL for legacy records.';
COMMENT ON COLUMN public.user_memberships.stripe_subscription_id IS 'Stripe subscription ID for Stripe-paid memberships. NULL for non-Stripe memberships.';

DO $$ 
BEGIN
    RAISE NOTICE '✅ Added payment_method and stripe_subscription_id columns to user_memberships table';
END $$;

