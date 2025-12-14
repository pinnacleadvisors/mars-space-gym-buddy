-- Function to get user emails for admin use
-- This function allows admins to retrieve user emails from auth.users
-- Requires SECURITY DEFINER to access auth schema

CREATE OR REPLACE FUNCTION get_user_emails()
RETURNS TABLE(id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Check if the current user has admin role
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can access user emails';
  END IF;

  -- Return user IDs and emails from auth.users
  RETURN QUERY
  SELECT 
    au.id,
    au.email::text
  FROM auth.users au
  WHERE au.email IS NOT NULL;
END;
$$;

-- Grant execute permission to authenticated users (RLS will check admin role)
GRANT EXECUTE ON FUNCTION get_user_emails() TO authenticated;

