
-- =================================================================
-- FIX: AUTOMATIC PROFILE CREATION TRIGGER
-- Run this in Supabase SQL Editor
-- =================================================================

-- 1. Create a function that runs when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
  new_role TEXT;
  new_name TEXT;
BEGIN
  -- Extract metadata passed from the client during signUp
  new_tenant_id := (new.raw_user_meta_data->>'tenant_id')::UUID;
  new_role := (new.raw_user_meta_data->>'role');
  new_name := (new.raw_user_meta_data->>'name');

  -- Default values if missing
  IF new_role IS NULL THEN new_role := 'CASHIER'; END IF;
  IF new_name IS NULL THEN new_name := 'New User'; END IF;

  -- Insert into profiles automatically
  INSERT INTO public.profiles (id, tenant_id, name, email, role, permissions, avatar_url)
  VALUES (
    new.id,
    new_tenant_id,
    new_name,
    new.email,
    new_role,
    CASE 
      WHEN new_role = 'ADMIN' THEN ARRAY['VIEW_DASHBOARD', 'MANAGE_PRODUCTS', 'MANAGE_ORDERS', 'MANAGE_USERS', 'MANAGE_SETTINGS']
      ELSE ARRAY['POS_ACCESS'] 
    END,
    'https://ui-avatars.com/api/?name=' || replace(new_name, ' ', '+') || '&background=random'
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach the trigger to the auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Ensure permissions are correct
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
