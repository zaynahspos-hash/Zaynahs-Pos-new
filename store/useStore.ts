
import { create } from 'zustand';
import { AppState, Tenant, User, Product, Order, Role, TenantStatus, Category, StockLog, OrderStatus, Supplier, PurchaseOrder, Expense, PurchaseOrderStatus, Settings, Customer, Notification, SubscriptionRequest, Permission, TenantDetails, Transaction, Plan, Discount } from '../types';
import { authService } from '../services/authService';
import { offlineService } from '../services/db';
import { supabase } from '../lib/supabase';

// Helper to map snake_case DB results to camelCase App types
const mapKeys = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(mapKeys);
    if (obj !== null && typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
            const camelKey = key.replace(/_([a-z])/g, (g: string) => g[1].toUpperCase());
            newObj[camelKey] = mapKeys(obj[key]);
        }
        return newObj;
    }
    return obj;
};

// Helper to map camelCase App types to snake_case for DB
const toSnakeCase = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(toSnakeCase);
    if (obj !== null && typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
            const snakeKey = key.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`);
            newObj[snakeKey] = toSnakeCase(obj[key]);
        }
        return newObj;
    }
    return obj;
};

interface StoreActions {
  setTenant: (tenant: Tenant) => void;
  loadInitialData: () => Promise<void>;
  syncOfflineData: () => Promise<void>;
  
  // Inventory
  refreshProducts: () => Promise<void>;
  addProduct: (product: Partial<Product>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  refreshCategories: () => Promise<void>;
  addCategory: (category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  refreshStockLogs: () => Promise<void>;
  
  // Orders
  refreshOrders: () => Promise<void>;
  addOrder: (order: Partial<Order>) => Promise<Order>;
  updateOrderStatus: (id: string, status: OrderStatus, additionalData?: { returnReason?: string; returnedBy?: string }) => Promise<void>;

  // Users
  refreshUsers: () => Promise<void>;
  inviteUser: (user: Partial<User> & { password?: string }) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  updateUserRole: (id: string, role: Role, permissions: Permission[]) => Promise<void>;
  updateUserPin: (targetUserId: string, newPin: string) => Promise<void>;
  updateUserPassword: (targetUserId: string, newPass: string) => Promise<void>;
  verifyUserPin: (pin: string) => Promise<boolean>;
  leaveCurrentTenant: () => Promise<void>;

  // Settings
  updateTenantProfile: (id: string, updates: Partial<Tenant>) => Promise<void>;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;

  // Suppliers & Customers
  refreshSuppliers: () => Promise<void>;
  addSupplier: (supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  refreshCustomers: () => Promise<void>;
  addCustomer: (customer: Partial<Customer>) => Promise<Customer>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  // Notifications
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // Financials
  refreshPurchaseOrders: () => Promise<void>;
  addPurchaseOrder: (po: Partial<PurchaseOrder>) => Promise<void>;
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrderStatus) => Promise<void>;
  refreshExpenses: () => Promise<void>;
  addExpense: (expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  refreshDiscounts: () => Promise<void>;
  addDiscount: (discount: Partial<Discount>) => Promise<void>;
  deleteDiscount: (id: string) => Promise<void>;

  // Admin
  loadAdminData: () => Promise<void>;
  fetchTenantDetails: (tenantId: string) => Promise<TenantDetails | null>;
  updateTenantStatus: (id: string, status: TenantStatus) => Promise<void>;
  extendTenantSubscription: (tenantId: string, months: number) => Promise<void>;
  submitSubscriptionProof: (planId: string, planName: string, amount: number, proofUrl: string) => Promise<void>;
  approveSubscription: (requestId: string) => Promise<void>;
  rejectSubscription: (requestId: string) => Promise<void>;
  runRetentionPolicy: () => Promise<{ deleted: string[], warned: string[] }>;

  // Auth
  checkSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, companyName: string) => Promise<void>;
  logout: () => void;
  
  toggleTheme: () => void;
}

type Store = AppState & StoreActions & { isAuthenticated: boolean; isOnline: boolean };

export const useStore = create<Store>((set, get) => ({
  // Initial State
  isAuthenticated: false,
  isOnline: navigator.onLine,
  currentTenant: null,
  settings: null,
  user: null,
  tenants: [],
  users: [],
  products: [],
  categories: [],
  stockLogs: [],
  orders: [],
  suppliers: [],
  purchaseOrders: [],
  expenses: [],
  customers: [],
  notifications: [],
  discounts: [],
  
  allTenants: [],
  transactions: [],
  plans: [
    {
      id: 'p1',
      name: 'Starter',
      price: 0,
      period: 'Monthly',
      features: ['1 User', '50 Products', 'Basic Support'],
      maxUsers: 1,
      maxProducts: 50,
      tier: 'FREE',
      description: 'Perfect for small hobbies.'
    },
    {
      id: 'p2',
      name: 'Pro',
      price: 2500,
      period: 'Monthly',
      features: ['5 Users', 'Unlimited Products', 'Priority Support'],
      maxUsers: 5,
      maxProducts: 10000,
      highlight: true,
      tier: 'PRO',
      description: 'For growing businesses.'
    },
    {
      id: 'p3',
      name: 'Enterprise',
      price: 25000,
      period: 'Yearly',
      features: ['Unlimited Users', 'API Access', 'Dedicated Account Manager'],
      maxUsers: 100,
      maxProducts: 100000,
      tier: 'ENTERPRISE',
      description: 'For large scale operations.'
    }
  ], 
  subscriptionRequests: [],

  isLoading: true, 
  searchQuery: '',
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',

  setTenant: (tenant: Tenant) => {
    set({ currentTenant: tenant, isLoading: true });
    get().loadInitialData(); 
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    set({ theme: newTheme });
    localStorage.setItem('theme', newTheme);
  },

  syncOfflineData: async () => {
     // Placeholder for Dexie sync logic
  },

  loadInitialData: async () => {
    const { currentTenant, user } = get();
    // Allow admin data load without current tenant, but require user
    if (!user) return;

    set({ isLoading: true });

    try {
      if (currentTenant) {
          const localData = await offlineService.loadLocalState(currentTenant.id);
          set({ ...localData, isLoading: localData.products.length === 0 });
      }

      if (navigator.onLine) {
        if (user?.role === Role.SUPER_ADMIN) {
            get().loadAdminData();
        }

        if (currentTenant) {
            const [products, orders, users, categories, customers, settings, expenses, suppliers, purchaseOrders, stockLogs, notifications, discounts] = await Promise.all([
                supabase.from('products').select('*').eq('tenant_id', currentTenant.id),
                supabase.from('orders').select('*').eq('tenant_id', currentTenant.id).order('created_at', { ascending: false }),
                supabase.from('profiles').select('*').eq('tenant_id', currentTenant.id),
                supabase.from('categories').select('*').eq('tenant_id', currentTenant.id),
                supabase.from('customers').select('*').eq('tenant_id', currentTenant.id),
                supabase.from('settings').select('*').eq('tenant_id', currentTenant.id).single(),
                supabase.from('expenses').select('*').eq('tenant_id', currentTenant.id).order('date', { ascending: false }),
                supabase.from('suppliers').select('*').eq('tenant_id', currentTenant.id),
                supabase.from('purchase_orders').select('*').eq('tenant_id', currentTenant.id).order('created_at', { ascending: false }),
                supabase.from('stock_logs').select('*').eq('tenant_id', currentTenant.id).order('created_at', { ascending: false }).limit(50),
                supabase.from('notifications').select('*').eq('tenant_id', currentTenant.id).order('created_at', { ascending: false }).limit(20),
                supabase.from('discounts').select('*').eq('tenant_id', currentTenant.id)
            ]);

            const mappedData = {
                products: mapKeys(products.data || []),
                orders: mapKeys(orders.data || []),
                users: mapKeys(users.data || []),
                categories: mapKeys(categories.data || []),
                customers: mapKeys(customers.data || []),
                settings: settings.data ? mapKeys(settings.data) : null,
                expenses: mapKeys(expenses.data || []),
                suppliers: mapKeys(suppliers.data || []),
                purchaseOrders: mapKeys(purchaseOrders.data || []),
                stockLogs: mapKeys(stockLogs.data || []),
                notifications: mapKeys(notifications.data || []),
                discounts: mapKeys(discounts.data || []),
                isLoading: false
            };

            set(mappedData);
            await offlineService.cacheAllData(mappedData);
        } else {
            set({ isLoading: false });
        }
      }
    } catch (error) {
      console.error('Data load failed', error);
      set({ isLoading: false });
    }
  },

  // --- CRUD ACTIONS (Abbreviated for brevity, logic remains identical to previous except utilizing supabase directly) ---
  refreshProducts: async () => { const { data } = await supabase.from('products').select('*').eq('tenant_id', get().currentTenant?.id); set({ products: mapKeys(data) }); },
  addProduct: async (product) => {
      const clean = JSON.parse(JSON.stringify(product));
      clean.tenantId = get().currentTenant?.id;
      const { data } = await supabase.from('products').insert(toSnakeCase(clean)).select().single();
      if (data) set(state => ({ products: [...state.products, mapKeys(data)] }));
  },
  updateProduct: async (id, updates) => {
      await supabase.from('products').update(toSnakeCase(updates)).eq('id', id);
      set(state => ({ products: state.products.map(p => p.id === id ? { ...p, ...updates } : p) }));
  },
  deleteProduct: async (id) => {
      await supabase.from('products').delete().eq('id', id);
      set(state => ({ products: state.products.filter(p => p.id !== id) }));
  },
  
  // Orders
  refreshOrders: async () => { const { data } = await supabase.from('orders').select('*').eq('tenant_id', get().currentTenant?.id).order('created_at', { ascending: false }); set({ orders: mapKeys(data) }); },
  addOrder: async (order) => {
      const cleanOrder = JSON.parse(JSON.stringify(order));
      if (!cleanOrder.id) cleanOrder.id = crypto.randomUUID();
      cleanOrder.tenantId = get().currentTenant?.id;
      
      const payload = toSnakeCase(cleanOrder);
      delete payload.id; // Let DB generate or handle UUID if needed, but we generated one client side? 
      // Supabase UUID default is safer, but we need ID for offline. 
      // Actually, let's keep ID if generated.
      const { data, error } = await supabase.from('orders').insert({ ...payload, id: cleanOrder.id }).select().single();
      
      if (!error && data) {
          const newOrder = mapKeys(data);
          set(state => ({ orders: [newOrder, ...state.orders] }));
          // Stock Update Logic
          if (newOrder.status === 'COMPLETED') {
              for (const item of newOrder.items) {
                  const product = get().products.find(p => p.id === item.productId);
                  if (product) {
                      const change = item.type === 'RETURN' ? item.quantity : -item.quantity;
                      const newStock = product.stock + change;
                      await get().updateProduct(product.id, { stock: newStock });
                      await supabase.from('stock_logs').insert(toSnakeCase({
                          tenantId: get().currentTenant?.id,
                          productId: product.id, productName: product.name, sku: product.sku,
                          changeAmount: change, finalStock: newStock,
                          type: item.type === 'RETURN' ? 'RETURN' : 'SALE',
                          reason: `Order #${newOrder.id.slice(-6)}`, performedBy: get().user?.name
                      }));
                  }
              }
          }
          return newOrder;
      }
      return cleanOrder;
  },
  updateOrderStatus: async (id, status, additionalData) => {
      const updates = { status, ...additionalData };
      const dbPayload = toSnakeCase(updates);
      if (status === OrderStatus.RETURNED) dbPayload.returned_at = new Date();
      await supabase.from('orders').update(dbPayload).eq('id', id);
      set(state => ({ orders: state.orders.map(o => o.id === id ? { ...o, status, ...additionalData } : o) }));
  },

  // Categories
  refreshCategories: async () => { const { data } = await supabase.from('categories').select('*').eq('tenant_id', get().currentTenant?.id); set({ categories: mapKeys(data) }); },
  addCategory: async (c) => { const { data } = await supabase.from('categories').insert(toSnakeCase({...c, tenantId: get().currentTenant?.id})).select().single(); if(data) set(s => ({ categories: [...s.categories, mapKeys(data)] })); },
  deleteCategory: async (id) => { await supabase.from('categories').delete().eq('id', id); set(s => ({ categories: s.categories.filter(c => c.id !== id) })); },

  // Stock Logs
  refreshStockLogs: async () => { const { data } = await supabase.from('stock_logs').select('*').eq('tenant_id', get().currentTenant?.id).order('created_at', { ascending: false }).limit(50); set({ stockLogs: mapKeys(data) }); },

  // Users
  refreshUsers: async () => { const { data } = await supabase.from('profiles').select('*').eq('tenant_id', get().currentTenant?.id); set({ users: mapKeys(data) }); },
  inviteUser: async (u) => { 
      const payload = toSnakeCase({ ...u, tenantId: get().currentTenant?.id, avatarUrl: `https://ui-avatars.com/api/?name=${u.name}&background=random` });
      delete payload.password;
      const { data } = await supabase.from('profiles').insert(payload).select().single();
      if(data) set(s => ({ users: [...s.users, mapKeys(data)] }));
  },
  removeUser: async (id) => { await supabase.from('profiles').delete().eq('id', id); set(s => ({ users: s.users.filter(u => u.id !== id) })); },
  updateUser: async (id, d) => { await supabase.from('profiles').update(toSnakeCase(d)).eq('id', id); set(s => ({ users: s.users.map(u => u.id === id ? { ...u, ...d } : u) })); },
  updateUserRole: async (id, role, permissions) => get().updateUser(id, { role, permissions }),
  updateUserPin: async (id, pin) => get().updateUser(id, { pin }),
  updateUserPassword: async (id, newPass) => { if(id === get().user?.id) await supabase.auth.updateUser({ password: newPass }); },
  verifyUserPin: async (pin) => get().user?.pin === pin,
  leaveCurrentTenant: async () => get().logout(),

  // Settings
  updateTenantProfile: async (id, updates) => { await supabase.from('tenants').update(toSnakeCase(updates)).eq('id', id); set(s => ({ currentTenant: s.currentTenant ? { ...s.currentTenant, ...updates } : null })); },
  updateSettings: async (updates) => { await supabase.from('settings').update(toSnakeCase(updates)).eq('tenant_id', get().currentTenant?.id); const { data } = await supabase.from('settings').select('*').eq('tenant_id', get().currentTenant?.id).single(); if(data) set({ settings: mapKeys(data) }); },

  // Suppliers & Customers
  refreshSuppliers: async () => { const { data } = await supabase.from('suppliers').select('*').eq('tenant_id', get().currentTenant?.id); set({ suppliers: mapKeys(data) }); },
  addSupplier: async (s) => { const { data } = await supabase.from('suppliers').insert(toSnakeCase({...s, tenantId: get().currentTenant?.id})).select().single(); if(data) set(st => ({ suppliers: [...st.suppliers, mapKeys(data)] })); },
  deleteSupplier: async (id) => { await supabase.from('suppliers').delete().eq('id', id); set(s => ({ suppliers: s.suppliers.filter(i => i.id !== id) })); },
  refreshCustomers: async () => { const { data } = await supabase.from('customers').select('*').eq('tenant_id', get().currentTenant?.id); set({ customers: mapKeys(data) }); },
  addCustomer: async (c) => { const { data } = await supabase.from('customers').insert(toSnakeCase({...c, tenantId: get().currentTenant?.id})).select().single(); if(data) { const nc = mapKeys(data); set(s => ({ customers: [...s.customers, nc] })); return nc; } return c as Customer; },
  updateCustomer: async (id, u) => { await supabase.from('customers').update(toSnakeCase(u)).eq('id', id); set(s => ({ customers: s.customers.map(c => c.id === id ? { ...c, ...u } : c) })); },
  deleteCustomer: async (id) => { await supabase.from('customers').delete().eq('id', id); set(s => ({ customers: s.customers.filter(c => c.id !== id) })); },

  // Other Actions
  refreshNotifications: async () => { const { data } = await supabase.from('notifications').select('*').eq('tenant_id', get().currentTenant?.id).order('created_at', { ascending: false }); set({ notifications: mapKeys(data) }); },
  markNotificationRead: async (id) => { await supabase.from('notifications').update({ read: true }).eq('id', id); set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) })); },
  markAllNotificationsRead: async () => { await supabase.from('notifications').update({ read: true }).eq('tenant_id', get().currentTenant?.id); set(s => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) })); },
  
  refreshPurchaseOrders: async () => { const { data } = await supabase.from('purchase_orders').select('*').eq('tenant_id', get().currentTenant?.id).order('created_at', { ascending: false }); set({ purchaseOrders: mapKeys(data) }); },
  addPurchaseOrder: async (po) => { const { data } = await supabase.from('purchase_orders').insert(toSnakeCase({...po, tenantId: get().currentTenant?.id})).select().single(); if(data) set(s => ({ purchaseOrders: [mapKeys(data), ...s.purchaseOrders] })); },
  updatePurchaseOrderStatus: async (id, status) => { await supabase.from('purchase_orders').update({ status }).eq('id', id); set(s => ({ purchaseOrders: s.purchaseOrders.map(p => p.id === id ? { ...p, status } : p) })); },
  
  refreshExpenses: async () => { const { data } = await supabase.from('expenses').select('*').eq('tenant_id', get().currentTenant?.id).order('date', { ascending: false }); set({ expenses: mapKeys(data) }); },
  addExpense: async (e) => { const { data } = await supabase.from('expenses').insert(toSnakeCase({...e, tenantId: get().currentTenant?.id})).select().single(); if(data) set(s => ({ expenses: [mapKeys(data), ...s.expenses] })); },
  deleteExpense: async (id) => { await supabase.from('expenses').delete().eq('id', id); set(s => ({ expenses: s.expenses.filter(e => e.id !== id) })); },
  
  refreshDiscounts: async () => { const { data } = await supabase.from('discounts').select('*').eq('tenant_id', get().currentTenant?.id); set({ discounts: mapKeys(data) }); },
  addDiscount: async (d) => { const { data } = await supabase.from('discounts').insert(toSnakeCase({...d, tenantId: get().currentTenant?.id})).select().single(); if(data) set(s => ({ discounts: [...s.discounts, mapKeys(data)] })); },
  deleteDiscount: async (id) => { await supabase.from('discounts').delete().eq('id', id); set(s => ({ discounts: s.discounts.filter(d => d.id !== id) })); },

  // Admin
  loadAdminData: async () => {
      const { data: tenants } = await supabase.from('tenants').select('*');
      const { data: reqs } = await supabase.from('subscription_requests').select('*');
      set({ allTenants: mapKeys(tenants || []), subscriptionRequests: mapKeys(reqs || []) });
  },
  fetchTenantDetails: async (tenantId) => {
      const { data: tenant } = await supabase.from('tenants').select('*').eq('id', tenantId).single();
      const { data: users } = await supabase.from('profiles').select('*').eq('tenant_id', tenantId);
      const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId);
      const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId);
      const { data: orders } = await supabase.from('orders').select('total_amount').eq('tenant_id', tenantId);
      const revenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      return { tenant: mapKeys(tenant), staff: mapKeys(users || []), stats: { totalProducts: productCount || 0, totalOrders: orderCount || 0, lifetimeRevenue: revenue, totalCustomers: 0, totalStaff: users?.length || 0 } };
  },
  updateTenantStatus: async (id, status) => { await supabase.from('tenants').update({ status }).eq('id', id); set(s => ({ allTenants: s.allTenants.map(t => t.id === id ? { ...t, status } : t) })); },
  extendTenantSubscription: async (tenantId, months) => {
      const tenant = get().allTenants.find(t => t.id === tenantId);
      if (tenant) {
          const currentExpiry = tenant.subscriptionExpiry ? new Date(tenant.subscriptionExpiry) : new Date();
          currentExpiry.setMonth(currentExpiry.getMonth() + months);
          await supabase.from('tenants').update({ subscription_expiry: currentExpiry.toISOString(), subscription_status: 'ACTIVE' }).eq('id', tenantId);
          get().loadAdminData();
      }
  },
  submitSubscriptionProof: async (planId, planName, amount, proofUrl) => {
      const { data } = await supabase.from('subscription_requests').insert(toSnakeCase({
          tenantId: get().currentTenant?.id, tenantName: get().currentTenant?.name,
          planId, planName, amount, paymentMethod: 'Manual Transfer', proofUrl, status: 'PENDING'
      })).select().single();
      if(data) set(s => ({ subscriptionRequests: [...s.subscriptionRequests, mapKeys(data)] }));
  },
  approveSubscription: async (requestId) => {
      await supabase.from('subscription_requests').update({ status: 'APPROVED' }).eq('id', requestId);
      const req = get().subscriptionRequests.find(r => r.id === requestId);
      if(req) {
          const { data: tenant } = await supabase.from('tenants').select('subscription_expiry').eq('id', req.tenantId).single();
          const currentExpiry = tenant?.subscription_expiry ? new Date(tenant.subscription_expiry) : new Date();
          currentExpiry.setMonth(currentExpiry.getMonth() + 1);
          await supabase.from('tenants').update({ subscription_tier: req.planName, subscription_status: 'ACTIVE', subscription_expiry: currentExpiry.toISOString() }).eq('id', req.tenantId);
          get().loadAdminData();
      }
  },
  rejectSubscription: async (requestId) => { await supabase.from('subscription_requests').update({ status: 'REJECTED' }).eq('id', requestId); get().loadAdminData(); },
  runRetentionPolicy: async () => ({ deleted: [], warned: [] }),

  // Auth Methods
  checkSession: async () => {
      set({ isLoading: true });
      const data = await authService.checkSession();
      if (data) {
          set({ user: data.user, currentTenant: data.tenant, isAuthenticated: true });
          await get().loadInitialData();
      } else {
          set({ isLoading: false });
      }
  },
  login: async (email, password) => {
    const { user, tenant } = await authService.login(email, password);
    set({ user, currentTenant: tenant, isAuthenticated: true });
    get().loadInitialData();
  },
  signup: async (name, email, password, companyName) => {
    const { user, tenant } = await authService.signup(name, email, password, companyName);
    set({ user, currentTenant: tenant, isAuthenticated: true });
    get().loadInitialData();
  },
  logout: () => {
    authService.logout();
    set({ isAuthenticated: false, user: null, currentTenant: null });
  }
}));
