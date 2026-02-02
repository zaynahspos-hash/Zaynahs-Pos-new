
/*
  ========================================================================================================
  ZAYNAHS POS - ENTERPRISE PRODUCTION SCHEMA (FINAL V6.0 - SIGNUP FIXED)
  ========================================================================================================
*/

-- =======================================================================================================
-- 1. EXTENSIONS & CONFIGURATION
-- =======================================================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
SET timezone = 'UTC';

-- =======================================================================================================
-- 2. ENUMERATED TYPES
-- =======================================================================================================
-- Safely drop types to ensure updates are applied
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER', 'SALESMAN', 'USER');

DROP TYPE IF EXISTS tenant_status CASCADE;
CREATE TYPE tenant_status AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'ARCHIVED');

DROP TYPE IF EXISTS order_status CASCADE;
CREATE TYPE order_status AS ENUM ('COMPLETED', 'PENDING', 'PROCESSING', 'CANCELLED', 'RETURNED');

DROP TYPE IF EXISTS stock_movement_type CASCADE;
CREATE TYPE stock_movement_type AS ENUM ('SALE', 'RETURN', 'ADJUSTMENT', 'IN', 'OUT');

DROP TYPE IF EXISTS sub_status CASCADE;
CREATE TYPE sub_status AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING_APPROVAL');

DROP TYPE IF EXISTS po_status CASCADE;
CREATE TYPE po_status AS ENUM ('DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED');

-- =======================================================================================================
-- 3. CORE TABLES (Defined early for dependencies)
-- =======================================================================================================

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
    subscription_status sub_status DEFAULT 'ACTIVE',
    subscription_expiry TIMESTAMPTZ,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'CASHIER',
    pin TEXT CHECK (length(pin) >= 4),
    pin_required BOOLEAN DEFAULT TRUE,
    permissions TEXT[],
    avatar_url TEXT,
    preferences JSONB DEFAULT '{"theme": "light"}'::jsonb,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================================================================
-- 4. HELPER FUNCTIONS (CRITICAL: Must be defined before Policies)
-- =======================================================================================================

-- Function to get the current user's tenant_id
CREATE OR REPLACE FUNCTION get_my_tenant_id() RETURNS UUID AS $$ 
    SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1; 
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to check if current user is SUPER_ADMIN
CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$ 
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'); 
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to check if current user is ADMIN (Tenant Owner)
CREATE OR REPLACE FUNCTION is_tenant_admin() RETURNS BOOLEAN AS $$ 
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'); 
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Audit Logging Function
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,
    table_name TEXT NOT NULL,
    record_id UUID,
    operation TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT,
    ip_address TEXT
);

CREATE OR REPLACE FUNCTION process_audit_log() RETURNS TRIGGER AS $$
DECLARE
    current_tenant_id UUID;
    user_id UUID;
BEGIN
    user_id := auth.uid();
    BEGIN
        IF (TG_OP = 'DELETE') THEN current_tenant_id := OLD.tenant_id;
        ELSE current_tenant_id := NEW.tenant_id; END IF;
    EXCEPTION WHEN OTHERS THEN current_tenant_id := NULL; END;
    
    INSERT INTO audit_logs (tenant_id, table_name, record_id, operation, old_values, new_values, changed_by)
    VALUES (
        current_tenant_id, 
        TG_TABLE_NAME, 
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END, 
        TG_OP, 
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END, 
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END, 
        user_id
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================================================================================================
-- 5. REMAINING TABLES
-- =======================================================================================================

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

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
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
    tax_id TEXT,
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT,
    status po_status DEFAULT 'ORDERED',
    total_amount NUMERIC(12,2) DEFAULT 0,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category TEXT,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
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

CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    currency TEXT DEFAULT 'USD',
    timezone TEXT DEFAULT 'UTC',
    theme TEXT DEFAULT 'light',
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
    barcode_generation_strategy TEXT DEFAULT 'SEQUENTIAL',
    barcode_prefix_type TEXT DEFAULT 'NONE',
    barcode_custom_prefix TEXT,
    barcode_next_sequence INTEGER DEFAULT 1000,
    barcode_label_format TEXT DEFAULT 'A4_30',
    barcode_show_price BOOLEAN DEFAULT TRUE,
    barcode_show_name BOOLEAN DEFAULT TRUE,
    require_cashier BOOLEAN DEFAULT TRUE,
    require_sales_person BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- =======================================================================================================
-- 6. STORAGE & POLICIES
-- =======================================================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('proofs', 'proofs', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT DO NOTHING;

-- Storage Policies (Drop first to be safe)
DROP POLICY IF EXISTS "Tenant Admins upload proofs" ON storage.objects;
CREATE POLICY "Tenant Admins upload proofs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'proofs');

DROP POLICY IF EXISTS "Super Admin view proofs" ON storage.objects;
CREATE POLICY "Super Admin view proofs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'proofs' AND is_super_admin());

DROP POLICY IF EXISTS "Public view products" ON storage.objects;
CREATE POLICY "Public view products" ON storage.objects FOR SELECT USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Tenant upload products" ON storage.objects;
CREATE POLICY "Tenant upload products" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'products');

DROP POLICY IF EXISTS "Tenant update products" ON storage.objects;
CREATE POLICY "Tenant update products" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Tenant delete products" ON storage.objects;
CREATE POLICY "Tenant delete products" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Public view logos" ON storage.objects;
CREATE POLICY "Public view logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "Tenant upload logos" ON storage.objects;
CREATE POLICY "Tenant upload logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'logos');

-- =======================================================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =======================================================================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Tenants Policies
DROP POLICY IF EXISTS "Super Admins view all tenants" ON tenants;
CREATE POLICY "Super Admins view all tenants" ON tenants FOR SELECT USING (is_super_admin());

DROP POLICY IF EXISTS "Super Admins update all tenants" ON tenants;
CREATE POLICY "Super Admins update all tenants" ON tenants FOR UPDATE USING (is_super_admin());

DROP POLICY IF EXISTS "Users view own tenant" ON tenants;
CREATE POLICY "Users view own tenant" ON tenants FOR SELECT USING (id = get_my_tenant_id());

DROP POLICY IF EXISTS "Tenant Admins update own tenant" ON tenants;
CREATE POLICY "Tenant Admins update own tenant" ON tenants FOR UPDATE USING (id = get_my_tenant_id() AND is_tenant_admin());

-- CRITICAL FIX: Allow anyone (even unauthenticated) to create a tenant for signup
DROP POLICY IF EXISTS "Allow public creation of tenants" ON tenants;
CREATE POLICY "Allow public creation of tenants" ON tenants FOR INSERT WITH CHECK (true);

-- Profiles Policies
DROP POLICY IF EXISTS "View tenant profiles" ON profiles;
CREATE POLICY "View tenant profiles" ON profiles FOR SELECT USING (tenant_id = get_my_tenant_id() OR is_super_admin());

DROP POLICY IF EXISTS "User update own profile" ON profiles;
CREATE POLICY "User update own profile" ON profiles FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins manage profiles" ON profiles;
CREATE POLICY "Admins manage profiles" ON profiles FOR ALL USING (tenant_id = get_my_tenant_id() AND is_tenant_admin());

-- CRITICAL FIX: Allow authenticated user to insert THEIR OWN profile (Signup Step 2)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
CREATE POLICY "Enable insert for authenticated users only" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Products Policies
DROP POLICY IF EXISTS "View products" ON products;
CREATE POLICY "View products" ON products FOR SELECT USING (tenant_id = get_my_tenant_id());

DROP POLICY IF EXISTS "Manage products" ON products;
CREATE POLICY "Manage products" ON products FOR ALL USING (tenant_id = get_my_tenant_id() AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER', 'SALESMAN')));

-- Orders Policies
DROP POLICY IF EXISTS "View orders" ON orders;
CREATE POLICY "View orders" ON orders FOR SELECT USING (tenant_id = get_my_tenant_id());

DROP POLICY IF EXISTS "Create orders" ON orders;
CREATE POLICY "Create orders" ON orders FOR INSERT WITH CHECK (tenant_id = get_my_tenant_id());

DROP POLICY IF EXISTS "Update orders" ON orders;
CREATE POLICY "Update orders" ON orders FOR UPDATE USING (tenant_id = get_my_tenant_id());

-- Customers
DROP POLICY IF EXISTS "Manage customers" ON customers;
CREATE POLICY "Manage customers" ON customers FOR ALL USING (tenant_id = get_my_tenant_id());

-- Categories
DROP POLICY IF EXISTS "Manage categories" ON categories;
CREATE POLICY "Manage categories" ON categories FOR ALL USING (tenant_id = get_my_tenant_id());

-- Suppliers
DROP POLICY IF EXISTS "Manage suppliers" ON suppliers;
CREATE POLICY "Manage suppliers" ON suppliers FOR ALL USING (tenant_id = get_my_tenant_id());

-- Expenses
DROP POLICY IF EXISTS "Manage expenses" ON expenses;
CREATE POLICY "Manage expenses" ON expenses FOR ALL USING (tenant_id = get_my_tenant_id());

-- POs
DROP POLICY IF EXISTS "Manage POs" ON purchase_orders;
CREATE POLICY "Manage POs" ON purchase_orders FOR ALL USING (tenant_id = get_my_tenant_id());

-- Notifications
DROP POLICY IF EXISTS "Manage notifications" ON notifications;
CREATE POLICY "Manage notifications" ON notifications FOR ALL USING (tenant_id = get_my_tenant_id());

-- Settings Policies (Must handle INSERT for new tenants)
DROP POLICY IF EXISTS "View settings" ON settings;
CREATE POLICY "View settings" ON settings FOR SELECT USING (tenant_id = get_my_tenant_id());

DROP POLICY IF EXISTS "Manage settings" ON settings;
CREATE POLICY "Manage settings" ON settings FOR ALL USING (tenant_id = get_my_tenant_id() AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER')));

-- Allow Public/Tenant to create initial settings
DROP POLICY IF EXISTS "Allow creation of settings" ON settings;
CREATE POLICY "Allow creation of settings" ON settings FOR INSERT WITH CHECK (true);

-- Admin/Sub Policies
DROP POLICY IF EXISTS "Create sub request" ON subscription_requests;
CREATE POLICY "Create sub request" ON subscription_requests FOR INSERT WITH CHECK (tenant_id = get_my_tenant_id());

DROP POLICY IF EXISTS "View own sub requests" ON subscription_requests;
CREATE POLICY "View own sub requests" ON subscription_requests FOR SELECT USING (tenant_id = get_my_tenant_id());

DROP POLICY IF EXISTS "Super Admin manage requests" ON subscription_requests;
CREATE POLICY "Super Admin manage requests" ON subscription_requests FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "View own transactions" ON transactions;
CREATE POLICY "View own transactions" ON transactions FOR SELECT USING (tenant_id = get_my_tenant_id());

DROP POLICY IF EXISTS "Super Admin manage transactions" ON transactions;
CREATE POLICY "Super Admin manage transactions" ON transactions FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "Public view plans" ON plans;
CREATE POLICY "Public view plans" ON plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super Admin manage plans" ON plans;
CREATE POLICY "Super Admin manage plans" ON plans FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "View audit logs" ON audit_logs;
CREATE POLICY "View audit logs" ON audit_logs FOR SELECT USING (tenant_id = get_my_tenant_id() OR is_super_admin());

-- Discount Policies
DROP POLICY IF EXISTS "View discounts" ON discounts;
CREATE POLICY "View discounts" ON discounts FOR SELECT USING (tenant_id = get_my_tenant_id());

DROP POLICY IF EXISTS "Manage discounts" ON discounts;
CREATE POLICY "Manage discounts" ON discounts FOR ALL USING (tenant_id = get_my_tenant_id());

-- =======================================================================================================
-- 8. TRIGGERS & SEED DATA
-- =======================================================================================================

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

DROP TRIGGER IF EXISTS update_settings_modtime ON settings;
CREATE TRIGGER update_settings_modtime BEFORE UPDATE ON settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_discounts_modtime ON discounts;
CREATE TRIGGER update_discounts_modtime BEFORE UPDATE ON discounts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS audit_products_trigger ON products;
CREATE TRIGGER audit_products_trigger AFTER INSERT OR UPDATE OR DELETE ON products FOR EACH ROW EXECUTE PROCEDURE process_audit_log();

DROP TRIGGER IF EXISTS audit_orders_trigger ON orders;
CREATE TRIGGER audit_orders_trigger AFTER INSERT OR UPDATE OR DELETE ON orders FOR EACH ROW EXECUTE PROCEDURE process_audit_log();

DROP TRIGGER IF EXISTS audit_settings_trigger ON settings;
CREATE TRIGGER audit_settings_trigger AFTER UPDATE ON settings FOR EACH ROW EXECUTE PROCEDURE process_audit_log();

DROP TRIGGER IF EXISTS audit_profiles_trigger ON profiles;
CREATE TRIGGER audit_profiles_trigger AFTER INSERT OR UPDATE OR DELETE ON profiles FOR EACH ROW EXECUTE PROCEDURE process_audit_log();

-- Seed Plans
INSERT INTO plans (id, name, price, period, features, max_users, max_products, tier, description) VALUES 
('p1', 'Starter', 0, 'Monthly', ARRAY['1 User', '50 Products', 'Basic Support'], 1, 50, 'FREE', 'Perfect for small hobbies.'),
('p2', 'Pro', 2500, 'Monthly', ARRAY['5 Users', 'Unlimited Products', 'Priority Support', 'Analytics'], 5, 10000, 'PRO', 'For growing businesses.'),
('p3', 'Enterprise', 25000, 'Yearly', ARRAY['Unlimited Users', 'API Access', 'Dedicated Manager', 'Custom Reports'], 100, 100000, 'ENTERPRISE', 'For large scale operations.')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, features = EXCLUDED.features;