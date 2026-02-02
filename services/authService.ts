
import { User, Tenant, Role } from '../types';
import { supabase } from '../lib/supabase';

export const authService = {
  login: async (email: string, password: string): Promise<{ user: User; tenant: Tenant }> => {
    // 1. Supabase Login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('No user data returned');

    // 2. Fetch Profile & Tenant
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) throw new Error('Profile not found. Please contact support.');

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', profile.tenant_id)
      .single();

    if (tenantError) throw new Error('Tenant not found');

    // 3. Map to App Types (Snake to Camel)
    const mappedUser: User = {
        id: profile.id,
        name: profile.name,
        email: authData.user.email || '',
        role: profile.role as any,
        tenantId: profile.tenant_id,
        permissions: profile.permissions,
        avatarUrl: profile.avatar_url,
        pin: profile.pin,
        pinRequired: profile.pin_required,
        createdAt: profile.created_at
    };

    const mappedTenant: Tenant = {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        email: tenant.email,
        status: tenant.status,
        subscriptionTier: tenant.subscription_tier,
        subscriptionStatus: tenant.subscription_status,
        logoUrl: tenant.logo_url,
        address: tenant.address,
        phone: tenant.phone,
        createdAt: tenant.created_at
    };

    return { user: mappedUser, tenant: mappedTenant };
  },

  signup: async (name: string, email: string, password: string, companyName: string): Promise<{ user: User; tenant: Tenant }> => {
    // 1. Generate Tenant ID Client-Side
    // This avoids the need to .select() the tenant back, which fails RLS for anonymous users
    const tenantId = crypto.randomUUID();
    const tenantSlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);

    // 2. Create Tenant (Without Select)
    const { error: tenantError } = await supabase
        .from('tenants')
        .insert({
            id: tenantId,
            name: companyName,
            slug: tenantSlug,
            subscription_tier: 'FREE'
        });

    if (tenantError) throw new Error('Failed to create company record: ' + tenantError.message);

    // 3. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name } 
        }
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('Auth creation failed');

    // 4. Create Profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
            id: authData.user.id,
            tenant_id: tenantId,
            name: name,
            role: Role.ADMIN,
            permissions: ['VIEW_DASHBOARD', 'MANAGE_PRODUCTS', 'MANAGE_ORDERS', 'MANAGE_USERS', 'MANAGE_SETTINGS'],
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
        })
        .select()
        .single();

    if (profileError) {
        // Rollback attempt (optional, but good practice)
        // await supabase.auth.signOut();
        throw new Error('Failed to create user profile: ' + profileError.message);
    }

    // 5. Settings
    await supabase.from('settings').insert({ tenant_id: tenantId });

    // Map result
    return {
        user: {
            id: profile.id,
            name: profile.name,
            email: email,
            role: profile.role as any,
            tenantId: profile.tenant_id,
            permissions: profile.permissions,
            createdAt: profile.created_at
        },
        tenant: {
            id: tenantId,
            name: companyName,
            status: 'ACTIVE',
            subscriptionTier: 'FREE',
            subscriptionStatus: 'ACTIVE',
            createdAt: new Date().toISOString()
        }
    };
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('sb-access-token');
    return Promise.resolve();
  },

  checkSession: async (): Promise<{ user: User; tenant: Tenant } | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    try {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (!profile) return null;

        const { data: tenant } = await supabase.from('tenants').select('*').eq('id', profile.tenant_id).single();
        if (!tenant) return null;

        return {
            user: {
                id: profile.id,
                name: profile.name,
                email: session.user.email || '',
                role: profile.role as any,
                tenantId: profile.tenant_id,
                permissions: profile.permissions,
                avatarUrl: profile.avatar_url,
                pin: profile.pin,
                pinRequired: profile.pin_required,
                createdAt: profile.created_at
            },
            tenant: {
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                email: tenant.email,
                status: tenant.status,
                subscriptionTier: tenant.subscription_tier,
                subscriptionStatus: tenant.subscription_status,
                logoUrl: tenant.logo_url,
                address: tenant.address,
                phone: tenant.phone,
                createdAt: tenant.created_at
            }
        };
    } catch (e) {
        return null;
    }
  }
};
