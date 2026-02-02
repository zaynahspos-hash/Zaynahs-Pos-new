
-- =======================================================================================================
-- ZAYNAHS POS - COMPLETE PRODUCTION SCHEMA (A-Z RESET)
-- =======================================================================================================

-- 1. CLEANUP (Drop everything to start fresh)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- 2. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. ENUMS
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER', 'SALESMAN', 'USER');
CREATE TYPE tenant_status AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'ARCHIVED');
CREATE TYPE order_status AS ENUM ('COMPLETED', 'PENDING', 'PROCESSING', 'CANCELLED', 'RETURNED');
CREATE TYPE stock_movement_type AS ENUM ('SALE', 'RETURN', 'ADJUSTMENT', 'IN', 'OUT');

-- =======================================================================================================
-- 4. TABLES
-- =======================================================================================================

-- 4.1 TENANTS (Companies/Shops)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    logo_url TEXT,
    status TEXT DEFAULT 'ACTIVE', -- stored as text for flexibility, validated in app
    subscription_tier TEXT DEFAULT 'FREE',
    subscription_status TEXT DEFAULT 'ACTIVE',
    subscription_expiry TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.2 PROFILES (Users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'CASHIER',
    pin TEXT,
    pin_required BOOLEAN DEFAULT TRUE,
    permissions TEXT[],
    avatar_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.3 SETTINGS
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    currency TEXT DEFAULT 'USD',
    timezone TEXT DEFAULT 'UTC',
    tax_rate NUMERIC(5,4) DEFAULT 0,
    receipt_header TEXT,
    receipt_footer TEXT,
    show_logo_on_receipt BOOLEAN DEFAULT TRUE,
    show_cashier_on_receipt BOOLEAN DEFAULT TRUE,
    show_customer_on_receipt BOOLEAN DEFAULT TRUE,
    show_tax_breakdown BOOLEAN DEFAULT TRUE,
    show_barcode BOOLEAN DEFAULT TRUE,
    show_sales_person_on_receipt BOOLEAN DEFAULT TRUE,
    auto_print_receipt BOOLEAN DEFAULT TRUE,
    receipt_width TEXT DEFAULT '80mm',
    receipt_template TEXT DEFAULT 'modern',
    receipt_font_size INTEGER DEFAULT 12,
    receipt_margin INTEGER DEFAULT 10,
    require_cashier BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.4 CATALOG
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    category TEXT,
    price NUMERIC(10,2) DEFAULT 0 CHECK (price >= 0),
    cost_price NUMERIC(10,2) DEFAULT 0 CHECK (cost_price >= 0),
    stock INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    description TEXT,
    image_url TEXT,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    attributes JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.5 CRM
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    total_spent NUMERIC(12,2) DEFAULT 0,
    last_order_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.6 SALES
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'COMPLETED',
    total_amount NUMERIC(12,2) DEFAULT 0,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    discount_type TEXT,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT,
    user_id TEXT, 
    salesperson_id TEXT,
    salesperson_name TEXT,
    cashier_id TEXT,
    cashier_name TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_return BOOLEAN DEFAULT FALSE,
    return_reason TEXT,
    returned_by TEXT,
    returned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.7 LOGS & FINANCIALS
CREATE TABLE stock_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT,
    sku TEXT,
    change_amount INTEGER NOT NULL,
    final_stock INTEGER NOT NULL,
    type TEXT NOT NULL,
    reason TEXT,
    performed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category TEXT,
    amount NUMERIC(10,2) NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT,
    status TEXT DEFAULT 'ORDERED',
    total_amount NUMERIC(12,2) DEFAULT 0,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    type TEXT NOT NULL,
    value NUMERIC(10,2) NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'INFO',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    period TEXT DEFAULT 'Monthly',
    features TEXT[],
    max_users INTEGER DEFAULT 1,
    max_products INTEGER DEFAULT 50,
    tier TEXT DEFAULT 'FREE',
    description TEXT,
    highlight BOOLEAN DEFAULT FALSE
);

CREATE TABLE subscription_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    tenant_name TEXT,
    plan_id TEXT,
    plan_name TEXT,
    amount NUMERIC,
    payment_method TEXT,
    proof_url TEXT,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================================================================
-- 5. TRIGGER: AUTOMATIC PROFILE CREATION (FIXES SIGNUP)
-- =======================================================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
  new_role TEXT;
  new_name TEXT;
BEGIN
  -- Extract from metadata
  new_tenant_id := (new.raw_user_meta_data->>'tenant_id')::UUID;
  new_role := (new.raw_user_meta_data->>'role');
  new_name := (new.raw_user_meta_data->>'name');

  -- Defaults
  IF new_role IS NULL THEN new_role := 'CASHIER'; END IF;
  IF new_name IS NULL THEN new_name := 'User'; END IF;

  -- Insert Profile
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

-- Bind Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =======================================================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =======================================================================================================

-- Enable RLS on everything
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_requests ENABLE ROW LEVEL SECURITY;

-- 6.1 TENANT POLICIES (Allow Signup)
-- Anyone can insert a tenant (for signup)
CREATE POLICY "Allow public insert tenants" ON tenants FOR INSERT WITH CHECK (true);
-- Users can view their own tenant
CREATE POLICY "View own tenant" ON tenants FOR SELECT USING (id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
-- Super admin sees all
CREATE POLICY "Super admin all tenants" ON tenants FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
);

-- 6.2 PROFILE POLICIES
-- Self-read
CREATE POLICY "View own profile" ON profiles FOR SELECT USING (id = auth.uid());
-- Tenant read
CREATE POLICY "View tenant profiles" ON profiles FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
-- Admin write
CREATE POLICY "Admin manage profiles" ON profiles FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN'))
);

-- 6.3 GENERIC TENANT DATA POLICIES (Apply to all other tables)
-- Standard Policy: "Can access if record.tenant_id matches user.tenant_id"

CREATE POLICY "Access own tenant products" ON products FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Access own tenant categories" ON categories FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Access own tenant orders" ON orders FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Access own tenant customers" ON customers FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Access own tenant suppliers" ON suppliers FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Access own tenant expenses" ON expenses FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Access own tenant logs" ON stock_logs FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Access own tenant notifications" ON notifications FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Access own tenant discounts" ON discounts FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Access own tenant settings" ON settings FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Public insert settings" ON settings FOR INSERT WITH CHECK (true); -- Needed for signup

-- =======================================================================================================
-- 7. DEFAULT DATA
-- =======================================================================================================

INSERT INTO plans (id, name, price, period, features, max_users, max_products, tier, description) VALUES 
('p1', 'Starter', 0, 'Monthly', ARRAY['1 User', '50 Products', 'Basic Support'], 1, 50, 'FREE', 'Perfect for small hobbies.'),
('p2', 'Pro', 2500, 'Monthly', ARRAY['5 Users', 'Unlimited Products', 'Priority Support', 'Analytics'], 5, 10000, 'PRO', 'For growing businesses.'),
('p3', 'Enterprise', 25000, 'Yearly', ARRAY['Unlimited Users', 'API Access', 'Dedicated Manager', 'Custom Reports'], 100, 100000, 'ENTERPRISE', 'For large scale operations.');

-- Final Grant
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

