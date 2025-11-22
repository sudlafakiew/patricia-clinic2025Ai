import React, { useState } from 'react';
import { Database, Copy, Check, ExternalLink, AlertTriangle } from 'lucide-react';

const DatabaseSetupGuide: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const sqlScript = `
-- ============================================
-- Patricia Clinic Manager - Database Setup
-- ============================================
-- This script creates all required tables and sets up Row Level Security (RLS)
-- for admin users to manage all data.

-- 1. User Roles Table (for admin management)
create table if not exists user_roles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique not null,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- 2. Inventory Table
create table if not exists inventory (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  quantity int default 0,
  unit text,
  min_level int default 10,
  price_per_unit decimal default 0,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- 3. Services Table
create table if not exists services (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price decimal default 0,
  duration_minutes int default 30,
  category text,
  consumables jsonb,
  image_url text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- 4. Courses Table
create table if not exists courses (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price decimal default 0,
  total_units int default 1,
  description text,
  consumables jsonb,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- 5. Customers Table
create table if not exists customers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text,
  email text,
  birth_date date,
  notes text,
  line_id text,
  address text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- 6. Customer Courses Table
create table if not exists customer_courses (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references customers(id) on delete cascade,
  course_id uuid references courses(id),
  course_name text,
  total_units int,
  remaining_units int,
  purchase_date timestamp default now(),
  expiry_date timestamp,
  active boolean default true,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- 7. Treatment Records Table
create table if not exists treatment_records (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references customers(id) on delete cascade,
  date timestamp default now(),
  treatment_name text,
  details text,
  doctor_name text,
  units_used int default 0,
  doctor_fee decimal default 0,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- 8. Transactions Table
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp default now(),
  customer_id uuid references customers(id) on delete set null,
  total_amount decimal,
  payment_method text,
  items jsonb,
  updated_at timestamp default now()
);

-- 9. Appointments Table
create table if not exists appointments (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references customers(id) on delete cascade,
  service_id uuid,
  date date,
  time text,
  status text,
  doctor_name text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
alter table user_roles enable row level security;
alter table inventory enable row level security;
alter table services enable row level security;
alter table courses enable row level security;
alter table customers enable row level security;
alter table customer_courses enable row level security;
alter table treatment_records enable row level security;
alter table transactions enable row level security;
alter table appointments enable row level security;

-- ============================================
-- Helper Function: Check if user is admin
-- ============================================
create or replace function is_admin(user_id uuid)
returns boolean as $$
  select exists (
    select 1 from user_roles
    where user_roles.user_id = is_admin.user_id
    and user_roles.role = 'admin'
  );
$$ language sql security definer;

-- ============================================
-- RLS Policies for user_roles
-- ============================================
-- Admins can view all roles
create policy "Admins can view all user roles"
  on user_roles for select
  using (is_admin(auth.uid()));

-- Admins can insert roles
create policy "Admins can insert user roles"
  on user_roles for insert
  with check (is_admin(auth.uid()));

-- Admins can update roles
create policy "Admins can update user roles"
  on user_roles for update
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- Admins can delete roles
create policy "Admins can delete user roles"
  on user_roles for delete
  using (is_admin(auth.uid()));

-- Users can view their own role
create policy "Users can view own role"
  on user_roles for select
  using (auth.uid() = user_id);

-- ============================================
-- RLS Policies for inventory
-- ============================================
create policy "Admins can manage inventory"
  on inventory for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ============================================
-- RLS Policies for services
-- ============================================
create policy "Admins can manage services"
  on services for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ============================================
-- RLS Policies for courses
-- ============================================
create policy "Admins can manage courses"
  on courses for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ============================================
-- RLS Policies for customers
-- ============================================
create policy "Admins can manage customers"
  on customers for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ============================================
-- RLS Policies for customer_courses
-- ============================================
create policy "Admins can manage customer courses"
  on customer_courses for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ============================================
-- RLS Policies for treatment_records
-- ============================================
create policy "Admins can manage treatment records"
  on treatment_records for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ============================================
-- RLS Policies for transactions
-- ============================================
create policy "Admins can manage transactions"
  on transactions for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ============================================
-- RLS Policies for appointments
-- ============================================
create policy "Admins can manage appointments"
  on appointments for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ============================================
-- IMPORTANT: Set First Admin User
-- ============================================
-- After running this script and creating your first user account:
-- 
-- 1. Go to Supabase Dashboard &gt; Authentication &gt; Users
-- 2. Copy the User ID (UUID) of the user you want to make admin
-- 3. Run this SQL in Supabase SQL Editor:
-- 
-- INSERT INTO user_roles (user_id, role)
-- VALUES ('PASTE_USER_ID_HERE', 'admin');
-- 
-- Or set the first user as admin automatically:
-- INSERT INTO user_roles (user_id, role)
-- SELECT id, 'admin' FROM auth.users 
-- WHERE id NOT IN (SELECT user_id FROM user_roles)
-- LIMIT 1;
-- 
-- ============================================
-- If you get "column does not exist" errors
-- ============================================
-- If you see errors like "Could not find the 'birth_date' column",
-- run the migration script from: migrations/add_missing_columns.sql
-- This will add any missing columns to existing tables.
-- 
-- ============================================
-- Verify RLS is working
-- ============================================
-- Test that RLS policies are active:
-- SELECT * FROM user_roles; -- Should only show your own role or all if admin
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-3xl border border-red-100">
        <div className="flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Database size={40} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Database Tables Missing</h1>
            <p className="text-gray-500 mt-2 max-w-lg">
                The connection to Supabase is successful, but the required tables (Inventory, Customers, etc.) were not found.
            </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 flex gap-3">
            <AlertTriangle className="text-blue-600 flex-shrink-0" />
            <div className="text-sm text-blue-800">
                <strong>Action Required:</strong> You need to run the SQL script below in your Supabase Dashboard to create the database structure.
            </div>
        </div>

        <div className="mb-4 flex justify-between items-center">
            <h3 className="font-bold text-gray-700">SQL Query Script</h3>
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

        <div className="bg-gray-900 rounded-xl p-4 overflow-auto max-h-80 mb-8 border border-gray-800">
            <pre className="text-xs md:text-sm text-green-400 font-mono whitespace-pre">
                {sqlScript}
            </pre>
        </div>

        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">1</div>
                <p className="text-gray-700">Copy the SQL script above.</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">2</div>
                <p className="text-gray-700">Go to <a href="https://supabase.com/dashboard/project/_/sql/new" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Supabase SQL Editor <ExternalLink size={14}/></a></p>
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
            I have run the SQL, Refresh Page
        </button>
      </div>
    </div>
  );
};

export default DatabaseSetupGuide;