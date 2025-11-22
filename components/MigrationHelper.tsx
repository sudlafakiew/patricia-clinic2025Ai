import React, { useState } from 'react';
import { Database, Copy, Check, AlertTriangle, ExternalLink } from 'lucide-react';

const MigrationHelper: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const migrationScript = `
-- ============================================
-- Migration: Add missing columns to existing tables
-- ============================================
-- Run this script if you get errors about missing columns
-- This will add any missing columns without affecting existing data

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
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(migrationScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-3xl border border-yellow-100">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={40} className="text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Missing Database Columns</h1>
          <p className="text-gray-500 mt-2 max-w-lg">
            ฐานข้อมูลของคุณขาดคอลัมน์บางตัวที่จำเป็นสำหรับการทำงานของระบบ
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4 text-sm text-red-800">
            <strong>⚠️ หมายเหตุ:</strong> หากคุณเห็น error "relation does not exist" แสดงว่าตารางยังไม่ได้ถูกสร้าง 
            กรุณารัน SQL script หลักจากหน้า Database Setup Guide ก่อน
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 mb-6 flex gap-3">
          <AlertTriangle className="text-yellow-600 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <strong>วิธีแก้ไข:</strong> รัน SQL script ด้านล่างใน Supabase SQL Editor เพื่อเพิ่มคอลัมน์ที่ขาดหายไป
          </div>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Migration SQL Script</h3>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy SQL'}
          </button>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 overflow-auto max-h-96 mb-8 border border-gray-800">
          <pre className="text-xs md:text-sm text-green-400 font-mono whitespace-pre">
            {migrationScript}
          </pre>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">1</div>
            <p className="text-gray-700">Copy the SQL script above.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">2</div>
            <p className="text-gray-700">
              Go to <a href="https://supabase.com/dashboard/project/_/sql/new" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                Supabase SQL Editor <ExternalLink size={14} />
              </a>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">3</div>
            <p className="text-gray-700">Paste the code and click <strong>RUN</strong>.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">4</div>
            <p className="text-gray-700">Refresh this page.</p>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full mt-8 bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-800 transition font-bold shadow-lg"
        >
          I have run the migration, Refresh Page
        </button>
      </div>
    </div>
  );
};

export default MigrationHelper;

