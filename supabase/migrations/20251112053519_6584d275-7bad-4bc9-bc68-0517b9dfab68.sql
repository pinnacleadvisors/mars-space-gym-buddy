-- Create user_memberships table to track which users have which memberships
CREATE TABLE public.user_memberships (
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

-- Enable RLS on user_memberships
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_memberships
CREATE POLICY "Users can view their own memberships"
  ON public.user_memberships
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user memberships"
  ON public.user_memberships
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert user memberships"
  ON public.user_memberships
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update user memberships"
  ON public.user_memberships
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete user memberships"
  ON public.user_memberships
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to update updated_at
CREATE TRIGGER update_user_memberships_updated_at
  BEFORE UPDATE ON public.user_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if user has valid membership
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