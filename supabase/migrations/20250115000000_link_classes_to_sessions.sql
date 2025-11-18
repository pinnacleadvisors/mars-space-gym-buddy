-- Add class_id column to class_sessions to link sessions to class templates
ALTER TABLE public.class_sessions
ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_class_sessions_class_id ON public.class_sessions(class_id);

-- Add comment to explain the relationship
COMMENT ON COLUMN public.class_sessions.class_id IS 'References the class template this session is based on. NULL if session was created independently.';

