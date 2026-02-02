
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

    // 2. Fetch Profile
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    // --- RECOVERY BLOCK START ---
    // If profile is missing but User exists (caused by previous errors), try to recover it using metadata
    if (!profile) {
       console.warn("Profile missing. Attempting recovery...");
       const meta = authData.user.user_metadata;
       
       if (meta && meta.tenant_id) {
           // Attempt to insert profile on the fly
           const { data: newProfile, error: recoveryError } = await supabase
            .from('profiles')
            .insert({
                id: authData.user.id,
                tenant_id: meta.tenant_id,
                name: meta.name || 'Recovered User',
                email: authData.user.email,
                role: meta.role || 'ADMIN',
                permissions: ['VIEW_DASHBOARD', 'MANAGE_PRODUCTS', 'MANAGE_ORDERS', 'MANAGE_USERS', 'MANAGE_SETTINGS'],
                avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(meta.name || 'User')}&background=random`
            })
            .select()
            .single();
            
            if (!recoveryError && newProfile) {
                profile = newProfile;
            } else {
                console.error("Recovery failed:", recoveryError);
            }
       }
    }
    // --- RECOVERY BLOCK END ---

    if (!profile) {
       throw new Error('Profile not found. If this persists, please sign up again with a different email.');
    }

    // 3. Fetch Tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', profile.tenant_id)
      .single();

    if (tenantError || !tenant) throw new Error('Company data not found.');

    // 4. Map to App Types
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
    // 1. Generate IDs Client-Side
    const tenantId = crypto.randomUUID();
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 10000);

    // 2. Insert Tenant (Publicly allowed via RLS)
    const { error: tenantError } = await supabase
        .from('tenants')
        .insert({
            id: tenantId,
            name: companyName,
            slug: slug,
            subscription_tier: 'FREE',
            status: 'ACTIVE'
        });

    if (tenantError) {
        console.error('Tenant Creation Failed:', tenantError);
        throw new Error('Failed to create company. Please try again.');
    }

    // 3. Create Auth User
    // IMPORTANT: We pass tenant_id, role, and name in 'data'. 
    // The SQL TRIGGER we created will use this to automatically create the Profile.
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { 
                name: name,
                tenant_id: tenantId,
                role: Role.ADMIN
            }
        }
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('Account creation failed.');

    // 4. Insert Default Settings (Public RLS)
    await supabase.from('settings').insert({
        tenant_id: tenantId,
        currency: 'PKR',
        timezone: 'Asia/Karachi'
    });

    // 5. Construct Response
    // Since the profile is created by the database trigger, we construct the object manually for immediate UI feedback
    return {
        user: {
            id: authData.user.id,
            name: name,
            email: email,
            role: Role.ADMIN,
            tenantId: tenantId,
            permissions: ['VIEW_DASHBOARD', 'MANAGE_PRODUCTS', 'MANAGE_ORDERS', 'MANAGE_USERS', 'MANAGE_SETTINGS'],
            createdAt: new Date().toISOString()
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
        console.error("Session check failed", e);
        return null;
    }
  }
};
