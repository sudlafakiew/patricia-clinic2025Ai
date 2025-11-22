-- ============================================
-- Migration: Add missing columns to existing tables
-- ============================================
-- Run this script if you get errors about missing columns
-- This will add any missing columns without affecting existing data
-- 
-- IMPORTANT: This script only works if the tables already exist.
-- If you get "relation does not exist" errors, you need to run the
-- main database setup script from DatabaseSetupGuide.tsx first.

-- Add missing columns to customers table
DO $$ 
BEGIN
    -- Check if customers table exists first
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'customers'
    ) THEN
        -- Add birth_date if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'customers' AND column_name = 'birth_date'
        ) THEN
            ALTER TABLE customers ADD COLUMN birth_date date;
        END IF;

        -- Add line_id if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'customers' AND column_name = 'line_id'
        ) THEN
            ALTER TABLE customers ADD COLUMN line_id text;
        END IF;

        -- Add address if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'customers' AND column_name = 'address'
        ) THEN
            ALTER TABLE customers ADD COLUMN address text;
        END IF;

        -- Add created_at if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'customers' AND column_name = 'created_at'
        ) THEN
            ALTER TABLE customers ADD COLUMN created_at timestamp default now();
        END IF;

        -- Add updated_at if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'customers' AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE customers ADD COLUMN updated_at timestamp default now();
        END IF;
    END IF;
END $$;

-- Add missing columns to other tables if needed
DO $$ 
BEGIN
    -- Services table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'services'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'services' AND column_name = 'created_at'
        ) THEN
            ALTER TABLE services ADD COLUMN created_at timestamp default now();
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'services' AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE services ADD COLUMN updated_at timestamp default now();
        END IF;
    END IF;

    -- Inventory table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'inventory'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'inventory' AND column_name = 'created_at'
        ) THEN
            ALTER TABLE inventory ADD COLUMN created_at timestamp default now();
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'inventory' AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE inventory ADD COLUMN updated_at timestamp default now();
        END IF;
    END IF;

    -- Courses table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'courses'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'courses' AND column_name = 'created_at'
        ) THEN
            ALTER TABLE courses ADD COLUMN created_at timestamp default now();
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'courses' AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE courses ADD COLUMN updated_at timestamp default now();
        END IF;
    END IF;
END $$;

-- Verify columns were added
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

