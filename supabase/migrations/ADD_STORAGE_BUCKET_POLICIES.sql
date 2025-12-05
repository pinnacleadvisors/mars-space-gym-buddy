-- =====================================================
-- ADD STORAGE BUCKET POLICIES
-- This script creates storage buckets and RLS policies for image uploads
-- Buckets: avatars, class-images, category-images
-- =====================================================

-- =====================================================
-- 1. CREATE STORAGE BUCKETS (if they don't exist)
-- =====================================================
-- Note: Buckets must be created manually in Supabase Dashboard first
-- Storage > Buckets > New Bucket
-- Or use the Supabase CLI/MCP to create them
-- This script only creates the policies

-- =====================================================
-- 2. AVATARS BUCKET POLICIES
-- =====================================================

-- Policy: Authenticated users can upload their own avatars
-- File path format: avatars/{user_id}-{timestamp}.{ext}
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
CREATE POLICY "Users can upload their own avatars"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'avatars' AND
        name LIKE 'avatars/' || auth.uid()::text || '-%'
    );

-- Policy: Authenticated users can update their own avatars
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'avatars' AND
        name LIKE 'avatars/' || auth.uid()::text || '-%'
    )
    WITH CHECK (
        bucket_id = 'avatars' AND
        name LIKE 'avatars/' || auth.uid()::text || '-%'
    );

-- Policy: Authenticated users can delete their own avatars
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'avatars' AND
        name LIKE 'avatars/' || auth.uid()::text || '-%'
    );

-- Policy: Anyone can view avatars (public read)
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'avatars');

-- Policy: Admins can manage all avatars
DROP POLICY IF EXISTS "Admins can manage all avatars" ON storage.objects;
CREATE POLICY "Admins can manage all avatars"
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (
        bucket_id = 'avatars' AND
        public.has_role(auth.uid(), 'admin')
    )
    WITH CHECK (
        bucket_id = 'avatars' AND
        public.has_role(auth.uid(), 'admin')
    );

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created avatars bucket policies';
END $$;

-- =====================================================
-- 3. CLASS-IMAGES BUCKET POLICIES
-- =====================================================

-- Policy: Admins can upload class images
-- File path format: {class_id}/{class_id}-{timestamp}.{ext}
-- Note: Folder name is the class_id, file name starts with class_id
DROP POLICY IF EXISTS "Admins can upload class images" ON storage.objects;
CREATE POLICY "Admins can upload class images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'class-images' AND
        public.has_role(auth.uid(), 'admin')
    );

-- Policy: Admins can update class images
DROP POLICY IF EXISTS "Admins can update class images" ON storage.objects;
CREATE POLICY "Admins can update class images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'class-images' AND
        public.has_role(auth.uid(), 'admin')
    )
    WITH CHECK (
        bucket_id = 'class-images' AND
        public.has_role(auth.uid(), 'admin')
    );

-- Policy: Admins can delete class images
DROP POLICY IF EXISTS "Admins can delete class images" ON storage.objects;
CREATE POLICY "Admins can delete class images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'class-images' AND
        public.has_role(auth.uid(), 'admin')
    );

-- Policy: Anyone can view class images (public read)
DROP POLICY IF EXISTS "Anyone can view class images" ON storage.objects;
CREATE POLICY "Anyone can view class images"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'class-images');

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created class-images bucket policies';
END $$;

-- =====================================================
-- 4. CATEGORY-IMAGES BUCKET POLICIES
-- =====================================================

-- Policy: Admins can upload category images
-- File path format: {category_id}/{category_id}-{timestamp}.{ext}
-- Note: Folder name is the category_id, file name starts with category_id
DROP POLICY IF EXISTS "Admins can upload category images" ON storage.objects;
CREATE POLICY "Admins can upload category images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'category-images' AND
        public.has_role(auth.uid(), 'admin')
    );

-- Policy: Admins can update category images
DROP POLICY IF EXISTS "Admins can update category images" ON storage.objects;
CREATE POLICY "Admins can update category images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'category-images' AND
        public.has_role(auth.uid(), 'admin')
    )
    WITH CHECK (
        bucket_id = 'category-images' AND
        public.has_role(auth.uid(), 'admin')
    );

-- Policy: Admins can delete category images
DROP POLICY IF EXISTS "Admins can delete category images" ON storage.objects;
CREATE POLICY "Admins can delete category images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'category-images' AND
        public.has_role(auth.uid(), 'admin')
    );

-- Policy: Anyone can view category images (public read)
DROP POLICY IF EXISTS "Anyone can view category images" ON storage.objects;
CREATE POLICY "Anyone can view category images"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'category-images');

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created category-images bucket policies';
END $$;

DO $$ 
BEGIN
    RAISE NOTICE '✅ Migration completed: Storage bucket policies created';
    RAISE NOTICE '⚠️  IMPORTANT: Make sure the buckets (avatars, class-images, category-images) exist in Supabase Storage';
    RAISE NOTICE '    If they don''t exist, create them in Dashboard: Storage > Buckets > New Bucket';
END $$;

