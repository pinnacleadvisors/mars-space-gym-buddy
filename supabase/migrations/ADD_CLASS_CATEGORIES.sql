-- =====================================================
-- ADD CLASS CATEGORIES TABLE
-- This script creates the class_categories table and updates classes table
-- to support category management with images and descriptions
-- =====================================================

-- =====================================================
-- 1. CREATE class_categories TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.class_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    image_url text,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.class_categories ENABLE ROW LEVEL SECURITY;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_class_categories_updated_at ON public.class_categories;
CREATE TRIGGER update_class_categories_updated_at
    BEFORE UPDATE ON public.class_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_class_categories_name ON public.class_categories(name);
CREATE INDEX IF NOT EXISTS idx_class_categories_is_active ON public.class_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_class_categories_display_order ON public.class_categories(display_order);

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created class_categories table';
END $$;

-- =====================================================
-- 2. ADD category_id COLUMN TO classes TABLE
-- =====================================================
DO $$ 
BEGIN
    -- Add category_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'classes' 
        AND column_name = 'category_id'
    ) THEN
        ALTER TABLE public.classes 
        ADD COLUMN category_id uuid REFERENCES public.class_categories(id) ON DELETE SET NULL;
        
        -- Create index for foreign key
        CREATE INDEX IF NOT EXISTS idx_classes_category_id ON public.classes(category_id);
        
        RAISE NOTICE '✅ Added category_id column to classes table';
    ELSE
        RAISE NOTICE 'ℹ️  category_id column already exists in classes table';
    END IF;
END $$;

-- =====================================================
-- 3. CREATE RLS POLICIES FOR class_categories
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.class_categories;
DROP POLICY IF EXISTS "Admins can view all categories" ON public.class_categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.class_categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.class_categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.class_categories;

-- Policy: Anyone can view active categories
CREATE POLICY "Anyone can view active categories"
    ON public.class_categories
    FOR SELECT
    USING (is_active = true);

-- Policy: Admins can view all categories (including inactive)
CREATE POLICY "Admins can view all categories"
    ON public.class_categories
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Policy: Admins can insert categories
CREATE POLICY "Admins can insert categories"
    ON public.class_categories
    FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Policy: Admins can update categories
CREATE POLICY "Admins can update categories"
    ON public.class_categories
    FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Policy: Admins can delete categories
CREATE POLICY "Admins can delete categories"
    ON public.class_categories
    FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'::app_role));

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created RLS policies for class_categories table';
END $$;

-- =====================================================
-- 4. INSERT DEFAULT CATEGORIES (Optional - can be removed if not needed)
-- =====================================================
-- Uncomment below to insert default categories matching Third Space
/*
INSERT INTO public.class_categories (name, description, display_order, is_active) VALUES
    ('Combat', 'Combat and martial arts classes', 1, true),
    ('Cycle', 'Cycling and spin classes', 2, true),
    ('Mind & Body', 'Yoga, meditation, and mindfulness classes', 3, true),
    ('Pilates', 'Pilates and core strengthening classes', 4, true),
    ('Sports & Performance', 'Athletic training and performance classes', 5, true),
    ('Strength & Conditioning', 'Weightlifting and strength training classes', 6, true)
ON CONFLICT (name) DO NOTHING;
*/

DO $$ 
BEGIN
    RAISE NOTICE '✅ Migration completed: class_categories table created and classes table updated';
END $$;

