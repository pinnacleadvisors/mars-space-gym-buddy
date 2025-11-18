-- Add missing RLS policies identified in audit
-- Migration: Add Missing RLS Policies
-- Date: 2025-01-15

-- 1. Add admin view all roles policy (needed for admin dashboard)
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Add admin delete bookings policy (needed for booking management)
CREATE POLICY "Admins can delete all bookings"
ON public.class_bookings
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Add admin delete check-ins policy (needed for data corrections)
CREATE POLICY "Admins can delete all check-ins"
ON public.check_ins
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add comments for documentation
COMMENT ON POLICY "Admins can view all roles" ON public.user_roles IS 
  'Allows admins to view all user roles for admin dashboard functionality';

COMMENT ON POLICY "Admins can delete all bookings" ON public.class_bookings IS 
  'Allows admins to delete any booking for management purposes (e.g., cancellations, corrections)';

COMMENT ON POLICY "Admins can delete all check-ins" ON public.check_ins IS 
  'Allows admins to delete any check-in for data corrections and cleanup';

