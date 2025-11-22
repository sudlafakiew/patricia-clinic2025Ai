-- ============================================
-- Migration: Add photos column to treatment_records
-- and create storage bucket for treatment photos
-- ============================================
-- Run this script if you want to enable photo storage for treatment records
-- 
-- NOTE: The app can work WITHOUT this migration. Photos will be uploaded to
-- Supabase Storage but not linked in the database (graceful degradation).
-- This migration makes the photo URLs persistent in the database.

-- Add photos column to treatment_records if it doesn't exist
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'treatment_records'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'treatment_records' AND column_name = 'photos'
        ) THEN
            ALTER TABLE treatment_records ADD COLUMN photos text[] DEFAULT '{}';
        END IF;
    END IF;
END $$;

-- Note: To enable Storage bucket access in your React app:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create a new bucket called "treatment-photos" (make it public or private as needed)
-- 3. Set RLS policies:
--
-- Example: Allow authenticated users to upload to their own customer folder:
-- CREATE POLICY "Users can upload treatment photos"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'treatment-photos'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );
--
-- Example: Allow public access to view treatment photos:
-- CREATE POLICY "Public can view treatment photos"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'treatment-photos');
--
-- Verify the column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'treatment_records'
AND column_name = 'photos';
