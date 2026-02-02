
-- =================================================================
-- FIX SIGNUP ERRORS (RLS POLICIES)
-- Run this in Supabase SQL Editor
-- =================================================================

-- 1. Enable Anonymous Tenant Creation (The Shop)
DROP POLICY IF EXISTS "Allow public creation of tenants" ON tenants;
CREATE POLICY "Allow public creation of tenants" 
ON tenants 
FOR INSERT 
WITH CHECK (true); 
-- 'true' means anyone (even unauthenticated users) can insert a row.

-- 2. Enable Authenticated Profile Creation (The User)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
CREATE POLICY "Enable insert for authenticated users only" 
ON profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);
-- Ensures a user can only create a profile for themselves.

-- 3. Ensure Settings Creation is Allowed
DROP POLICY IF EXISTS "Allow creation of settings" ON settings;
CREATE POLICY "Allow creation of settings" 
ON settings 
FOR INSERT 
WITH CHECK (true);

-- 4. Grant Permissions to anon/public role (Just in case defaults are strict)
GRANT INSERT ON tenants TO anon, authenticated, service_role;
GRANT INSERT ON profiles TO anon, authenticated, service_role;
GRANT INSERT ON settings TO anon, authenticated, service_role;
