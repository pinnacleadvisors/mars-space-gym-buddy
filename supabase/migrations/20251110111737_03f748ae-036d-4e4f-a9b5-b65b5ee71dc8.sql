-- Allow admins to view all classes (including inactive ones)
CREATE POLICY "Admins can view all classes"
ON public.classes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));