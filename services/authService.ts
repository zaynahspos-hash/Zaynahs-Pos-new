
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

    return await authService.getUserProfile(authData.user.id, authData.user.email || email);
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

    // 3. Create Auth User (Metadata triggers profile creation)
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
    
    // 4. Insert Default Settings
    await supabase.from('settings').insert({
        tenant_id: tenantId,
        currency: 'PKR',
        timezone: 'Asia/Karachi'
    });

    // 5. Construct Initial State immediately (Trigger is async)
    return {
        user: {
            id: authData.user?.id || 'temp',
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
    localStorage.removeItem('sb-refresh-token');
    return Promise.resolve();
  },

  checkSession: async (): Promise<{ user: User; tenant: Tenant } | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    try {
        return await authService.getUserProfile(session.user.id, session.user.email || '');
    } catch (e) {
        console.error("Session restoration failed:", e);
        return null;
    }
  },

  // Helper to fetch profile + tenant
  getUserProfile: async (userId: string, email: string) => {
    // Fetch Profile
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile) {
       console.warn("Profile missing on login/check.");
       throw new Error('User profile not found.');
    }

    // Fetch Tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', profile.tenant_id)
      .single();

    if (tenantError || !tenant) throw new Error('Company data not found.');

    return {
        user: {
            id: profile.id,
            name: profile.name,
            email: email,
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
  },

  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/#/reset-password',
    });
    if (error) throw error;
  },

  updatePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }
};
