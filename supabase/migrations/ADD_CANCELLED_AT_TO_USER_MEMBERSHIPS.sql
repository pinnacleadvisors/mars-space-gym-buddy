-- Add cancelled_at column to user_memberships table
-- This column tracks when a user cancels their membership (for non-Stripe payment methods)
-- Allows admins to see cancellation requests and manually handle direct debits, invoices, etc.

ALTER TABLE user_memberships 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ NULL;

-- Add comment to explain the column
COMMENT ON COLUMN user_memberships.cancelled_at IS 'Timestamp when user requested cancellation. Used for non-Stripe payment methods (direct debit, cash, invoice) to track cancellation requests for manual processing.';

