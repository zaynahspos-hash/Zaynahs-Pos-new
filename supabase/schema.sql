
/*
  ========================================================================================================
  ZAYNAHS POS - COMPLETE PRODUCTION SCHEMA (REBUILT & FIXED)
  Based on Enterprise Standards & Nextera POS Architecture
  ========================================================================================================
*/

-- 1. RESET PUBLIC SCHEMA (OPTIONAL: Use carefully if you want a clean slate)
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO public;

-- 2. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. ENUMS (Types)
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER', 'SALESMAN', 'USER');

DROP TYPE IF EXISTS tenant_status CASCADE;
CREATE TYPE tenant_status AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'ARCHIVED');

DROP TYPE IF EXISTS order_status CASCADE;
CREATE TYPE order_status AS ENUM ('COMPLETED', 'PENDING', 'PROCESSING', 'CANCELLED', 'RETURNED');

DROP TYPE IF EXISTS stock_movement_type CASCADE;
CREATE TYPE stock_movement_type AS ENUM ('SALE', 'RETURN', 'ADJUSTMENT', 'IN', 'OUT');

DROP TYPE IF EXISTS payment_method_type CASCADE;
CREATE TYPE payment_method_type AS ENUM ('CASH', 'CARD', 'TRANSFER', 'CREDIT');

-- =======================================================================================================
-- 4. TABLES
-- =======================================================================================================

-- 4.1 TENANTS (Companies/Shops)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    email TEXT,
    phone TEXT,
    address TEXT,
    logo_url TEXT,
    website TEXT,
    status tenant_status DEFAULT 'ACTIVE',
    subscription_tier TEXT DEFAULT 'FREE',
    subscription_status TEXT DEFAULT 'ACTIVE',
    subscription_expiry TIMESTAMPTZ,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.2 PROFILES (Users linked to Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'CASHIER', -- stored as text to allow flexibility, checked against enum in logic
    pin TEXT CHECK (length(pin) >= 4),
    pin_required BOOLEAN DEFAULT TRUE,
    permissions TEXT[],
    avatar_url TEXT,
    preferences JSONB DEFAULT '{"theme": "light"}'::jsonb,
    last_login_at TIMESTAMPTZ,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.3 SETTINGS
CREATE TABLE IF NOT EXISTS settings (
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
    barcode_format TEXT DEFAULT 'CODE128',
    require_cashier BOOLEAN DEFAULT TRUE,
    require_sales_person BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.4 CATALOG (Categories, Suppliers, Products)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    barcode TEXT,
    category TEXT,
    price NUMERIC(10,2) DEFAULT 0 CHECK (price >= 0),
    cost_price NUMERIC(10,2) DEFAULT 0 CHECK (cost_price >= 0),
    stock INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    track_stock BOOLEAN DEFAULT TRUE,
    description TEXT,
    image_url TEXT,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    attributes JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_sku_per_tenant UNIQUE (tenant_id, sku)
);

-- 4.5 CRM (Customers)
CREATE TABLE IF NOT EXISTS customers (
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

-- 4.6 SALES (Orders)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'COMPLETED',
    payment_status TEXT DEFAULT 'PAID',
    payment_method TEXT DEFAULT 'CASH',
    total_amount NUMERIC(12,2) DEFAULT 0,
    subtotal NUMERIC(12,2) DEFAULT 0,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    discount_type TEXT,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT DEFAULT 'Walk-in Customer',
    user_id TEXT, -- User who created the order (can be null if external)
    salesperson_id TEXT,
    salesperson_name TEXT,
    cashier_id TEXT,
    cashier_name TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_return BOOLEAN DEFAULT FALSE,
    return_reason TEXT,
    returned_by TEXT,
    returned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.7 INVENTORY LOGS
CREATE TABLE IF NOT EXISTS stock_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT,
    sku TEXT,
    change_amount INTEGER NOT NULL,
    final_stock INTEGER NOT NULL,
    type stock_movement_type NOT NULL,
    reason TEXT,
    performed_by TEXT,
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.8 FINANCIALS (Expenses, POs)
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category TEXT,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT,
    status TEXT DEFAULT 'ORDERED',
    total_amount NUMERIC(12,2) DEFAULT 0,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.9 PROMOTIONS
CREATE TABLE IF NOT EXISTS discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    type TEXT NOT NULL CHECK (type IN ('PERCENT', 'FIXED')),
    value NUMERIC(10,2) NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.10 SYSTEM (Notifications, Plans, Requests)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'INFO',
    link TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    period TEXT DEFAULT 'Monthly',
    features TEXT[],
    max_users INTEGER DEFAULT 1,
    max_products INTEGER DEFAULT 50,
    tier TEXT DEFAULT 'FREE',
    description TEXT,
    highlight BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    tenant_name TEXT,
    plan_id TEXT,
    plan_name TEXT,
    amount NUMERIC,
    payment_method TEXT,
    proof_url TEXT,
    status TEXT DEFAULT 'PENDING',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'SUCCESS',
    date TIMESTAMPTZ DEFAULT NOW(),
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================================================================
-- 5. FUNCTIONS & TRIGGERS
-- =======================================================================================================

-- Helper: Get current user's tenant
CREATE OR REPLACE FUNCTION get_my_tenant_id() RETURNS UUID AS $$ 
    SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1; 
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: Check Super Admin
CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$ 
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'); 
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Trigger: Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers
DROP TRIGGER IF EXISTS update_tenants_modtime ON tenants;
CREATE TRIGGER update_tenants_modtime BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_modtime ON products;
CREATE TRIGGER update_products_modtime BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_modtime ON orders;
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_modtime ON customers;
CREATE TRIGGER update_customers_modtime BEFORE UPDATE ON customers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_modtime ON profiles;
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =======================================================================================================
-- 6. ROW LEVEL SECURITY (RLS) - THE CRITICAL PART
-- =======================================================================================================

-- Enable RLS on all tables
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
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 6.1 TENANTS POLICIES
-- Allow ANYONE (including anonymous) to create a tenant. This is essential for signup.
DROP POLICY IF EXISTS "Allow public creation of tenants" ON tenants;
CREATE POLICY "Allow public creation of tenants" ON tenants FOR INSERT WITH CHECK (true);

-- Users can view their own tenant
DROP POLICY IF EXISTS "View own tenant" ON tenants;
CREATE POLICY "View own tenant" ON tenants FOR SELECT USING (id = get_my_tenant_id());

-- Super Admins can do anything
DROP POLICY IF EXISTS "Super Admin full access tenants" ON tenants;
CREATE POLICY "Super Admin full access tenants" ON tenants FOR ALL USING (is_super_admin());

-- 6.2 PROFILES POLICIES
-- Users can insert their OWN profile (linked to auth.uid)
DROP POLICY IF EXISTS "Insert own profile" ON profiles;
CREATE POLICY "Insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can view profiles in their tenant
DROP POLICY IF EXISTS "View tenant profiles" ON profiles;
CREATE POLICY "View tenant profiles" ON profiles FOR SELECT USING (tenant_id = get_my_tenant_id());

-- Admins can update profiles in their tenant
DROP POLICY IF EXISTS "Admin update tenant profiles" ON profiles;
CREATE POLICY "Admin update tenant profiles" ON profiles FOR UPDATE USING (
    tenant_id = get_my_tenant_id() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN'))
);

-- 6.3 SETTINGS POLICIES
-- Allow creation (for signup)
DROP POLICY IF EXISTS "Allow creation of settings" ON settings;
CREATE POLICY "Allow creation of settings" ON settings FOR INSERT WITH CHECK (true);

-- View/Update own settings
DROP POLICY IF EXISTS "Manage own settings" ON settings;
CREATE POLICY "Manage own settings" ON settings FOR ALL USING (tenant_id = get_my_tenant_id());

-- 6.4 GENERIC TENANT DATA POLICIES (Products, Orders, Customers, etc.)
-- We apply a standard policy: Access allowed if tenant_id matches the user's tenant_id

-- Products
CREATE POLICY "Tenant isolation products" ON products FOR ALL USING (tenant_id = get_my_tenant_id());
-- Orders
CREATE POLICY "Tenant isolation orders" ON orders FOR ALL USING (tenant_id = get_my_tenant_id());
-- Customers
CREATE POLICY "Tenant isolation customers" ON customers FOR ALL USING (tenant_id = get_my_tenant_id());
-- Suppliers
CREATE POLICY "Tenant isolation suppliers" ON suppliers FOR ALL USING (tenant_id = get_my_tenant_id());
-- Categories
CREATE POLICY "Tenant isolation categories" ON categories FOR ALL USING (tenant_id = get_my_tenant_id());
-- Expenses
CREATE POLICY "Tenant isolation expenses" ON expenses FOR ALL USING (tenant_id = get_my_tenant_id());
-- POs
CREATE POLICY "Tenant isolation pos" ON purchase_orders FOR ALL USING (tenant_id = get_my_tenant_id());
-- Stock Logs
CREATE POLICY "Tenant isolation logs" ON stock_logs FOR ALL USING (tenant_id = get_my_tenant_id());
-- Notifications
CREATE POLICY "Tenant isolation notifications" ON notifications FOR ALL USING (tenant_id = get_my_tenant_id());
-- Discounts
CREATE POLICY "Tenant isolation discounts" ON discounts FOR ALL USING (tenant_id = get_my_tenant_id());

-- 6.5 STORAGE POLICIES (If you use Supabase Storage)
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('proofs', 'proofs', false) ON CONFLICT DO NOTHING;

-- Allow authenticated users to upload to buckets
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('products', 'logos', 'proofs'));
CREATE POLICY "Allow public view products" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Allow public view logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');

-- =======================================================================================================
-- 7. SEED DATA (Plans)
-- =======================================================================================================
INSERT INTO plans (id, name, price, period, features, max_users, max_products, tier, description) VALUES 
('p1', 'Starter', 0, 'Monthly', ARRAY['1 User', '50 Products', 'Basic Support'], 1, 50, 'FREE', 'Perfect for small hobbies.'),
('p2', 'Pro', 2500, 'Monthly', ARRAY['5 Users', 'Unlimited Products', 'Priority Support', 'Analytics'], 5, 10000, 'PRO', 'For growing businesses.'),
('p3', 'Enterprise', 25000, 'Yearly', ARRAY['Unlimited Users', 'API Access', 'Dedicated Manager', 'Custom Reports'], 100, 100000, 'ENTERPRISE', 'For large scale operations.')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price;

-- Grant permissions (just in case)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

