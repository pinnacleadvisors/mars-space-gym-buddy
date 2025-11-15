-- Create memberships table
CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  price numeric(10,2),
  duration_days integer,
  access_level text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on memberships
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- RLS policies for memberships
CREATE POLICY "Anyone can view memberships"
  ON public.memberships
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert memberships"
  ON public.memberships
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update memberships"
  ON public.memberships
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete memberships"
  ON public.memberships
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create check_ins table
CREATE TABLE public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  check_in_time timestamp with time zone NOT NULL DEFAULT now(),
  check_out_time timestamp with time zone,
  duration_minutes integer,
  location text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on check_ins
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- RLS policies for check_ins
CREATE POLICY "Users can view their own check-ins"
  ON public.check_ins
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all check-ins"
  ON public.check_ins
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own check-ins"
  ON public.check_ins
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own check-ins"
  ON public.check_ins
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all check-ins"
  ON public.check_ins
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to calculate duration
CREATE OR REPLACE FUNCTION calculate_check_in_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_out_time IS NOT NULL AND NEW.check_in_time IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for duration calculation
CREATE TRIGGER set_check_in_duration
  BEFORE INSERT OR UPDATE ON public.check_ins
  FOR EACH ROW
  EXECUTE FUNCTION calculate_check_in_duration();

-- Create class_sessions table
CREATE TABLE public.class_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  instructor text,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  capacity integer,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on class_sessions
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for class_sessions
CREATE POLICY "Anyone can view class sessions"
  ON public.class_sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert class sessions"
  ON public.class_sessions
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update class sessions"
  ON public.class_sessions
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete class sessions"
  ON public.class_sessions
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create class_bookings table
CREATE TABLE public.class_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  class_id uuid REFERENCES public.class_sessions(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'booked',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on class_bookings
ALTER TABLE public.class_bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies for class_bookings
CREATE POLICY "Users can view their own bookings"
  ON public.class_bookings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
  ON public.class_bookings
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own bookings"
  ON public.class_bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON public.class_bookings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all bookings"
  ON public.class_bookings
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete their own bookings"
  ON public.class_bookings
  FOR DELETE
  USING (auth.uid() = user_id);