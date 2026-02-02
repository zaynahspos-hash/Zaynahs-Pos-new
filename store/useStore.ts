
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

// Helper to map camelCase App types to snake_case for DB (Recursive)
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
  
  // Inventory Actions
  refreshProducts: () => Promise<void>;
  addProduct: (product: Partial<Product>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  refreshCategories: () => Promise<void>;
  addCategory: (category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  refreshStockLogs: () => Promise<void>;
  
  // Order Actions
  refreshOrders: () => Promise<void>;
  addOrder: (order: Partial<Order>) => Promise<Order>;
  updateOrderStatus: (id: string, status: OrderStatus, additionalData?: { returnReason?: string; returnedBy?: string }) => Promise<void>;

  // User Actions
  refreshUsers: () => Promise<void>;
  inviteUser: (user: Partial<User> & { password?: string }) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  updateUserRole: (id: string, role: Role, permissions: Permission[]) => Promise<void>;
  updateUserPin: (targetUserId: string, newPin: string) => Promise<void>;
  updateUserPassword: (targetUserId: string, newPass: string) => Promise<void>;
  verifyUserPin: (pin: string) => Promise<boolean>;
  leaveCurrentTenant: () => Promise<void>;

  // Settings Actions
  updateTenantProfile: (id: string, updates: Partial<Tenant>) => Promise<void>;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;

  // Supplier Actions
  refreshSuppliers: () => Promise<void>;
  addSupplier: (supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  // Customer Actions (CRM)
  refreshCustomers: () => Promise<void>;
  addCustomer: (customer: Partial<Customer>) => Promise<Customer>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  // Notification Actions
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // Purchase Order Actions
  refreshPurchaseOrders: () => Promise<void>;
  addPurchaseOrder: (po: Partial<PurchaseOrder>) => Promise<void>;
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrderStatus) => Promise<void>;

  // Expense Actions
  refreshExpenses: () => Promise<void>;
  addExpense: (expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Discount Actions (New)
  refreshDiscounts: () => Promise<void>;
  addDiscount: (discount: Partial<Discount>) => Promise<void>;
  deleteDiscount: (id: string) => Promise<void>;

  // Admin & Subscription Actions
  loadAdminData: () => Promise<void>;
  fetchTenantDetails: (tenantId: string) => Promise<TenantDetails | null>;
  updateTenantStatus: (id: string, status: TenantStatus) => Promise<void>;
  extendTenantSubscription: (tenantId: string, months: number) => Promise<void>;
  submitSubscriptionProof: (planId: string, planName: string, amount: number, proofUrl: string) => Promise<void>;
  approveSubscription: (requestId: string) => Promise<void>;
  rejectSubscription: (requestId: string) => Promise<void>;
  runRetentionPolicy: () => Promise<{ deleted: string[], warned: string[] }>;

  // Auth Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, companyName: string) => Promise<void>;
  logout: () => void;
  
  // Theme
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
  
  // Super Admin Data
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

  isLoading: false, 
  searchQuery: '',
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',

  // Actions
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
    // ... (offline sync logic omitted for brevity, similar to previous)
  },

  loadInitialData: async () => {
    const { currentTenant, user } = get();
    // If Super Admin, allow loading even without currentTenant (dashboard mode)
    if (!currentTenant && user?.role !== Role.SUPER_ADMIN) return;

    set({ isLoading: true });

    try {
      // 1. Load Local First (Dexie) if a tenant is selected
      if (currentTenant) {
          const localData = await offlineService.loadLocalState(currentTenant.id);
          set({ ...localData, isLoading: localData.products.length === 0 });
      }

      // 2. Fetch from Supabase
      if (navigator.onLine) {
        
        // Super Admin Data
        if (user?.role === Role.SUPER_ADMIN) {
            get().loadAdminData();
        }

        // Tenant Specific Data
        if (currentTenant) {
            const { data: products } = await supabase.from('products').select('*').eq('tenant_id', currentTenant.id);
            const { data: orders } = await supabase.from('orders').select('*').eq('tenant_id', currentTenant.id).order('created_at', { ascending: false });
            const { data: users } = await supabase.from('profiles').select('*').eq('tenant_id', currentTenant.id);
            const { data: categories } = await supabase.from('categories').select('*').eq('tenant_id', currentTenant.id);
            const { data: customers } = await supabase.from('customers').select('*').eq('tenant_id', currentTenant.id);
            const { data: settings } = await supabase.from('settings').select('*').eq('tenant_id', currentTenant.id).single();
            const { data: expenses } = await supabase.from('expenses').select('*').eq('tenant_id', currentTenant.id).order('date', { ascending: false });
            const { data: suppliers } = await supabase.from('suppliers').select('*').eq('tenant_id', currentTenant.id);
            const { data: purchaseOrders } = await supabase.from('purchase_orders').select('*').eq('tenant_id', currentTenant.id).order('created_at', { ascending: false });
            const { data: stockLogs } = await supabase.from('stock_logs').select('*').eq('tenant_id', currentTenant.id).order('created_at', { ascending: false }).limit(50);
            const { data: notifications } = await supabase.from('notifications').select('*').eq('tenant_id', currentTenant.id).order('created_at', { ascending: false }).limit(20);
            const { data: discounts } = await supabase.from('discounts').select('*').eq('tenant_id', currentTenant.id);

            // Update State with Mapped Data
            const mappedProducts = mapKeys(products || []);
            const mappedOrders = mapKeys(orders || []);
            const mappedUsers = mapKeys(users || []);
            const mappedCategories = mapKeys(categories || []);
            const mappedCustomers = mapKeys(customers || []);
            const mappedSettings = settings ? mapKeys(settings) : null;
            const mappedExpenses = mapKeys(expenses || []);
            const mappedSuppliers = mapKeys(suppliers || []);
            const mappedPOs = mapKeys(purchaseOrders || []);
            const mappedLogs = mapKeys(stockLogs || []);
            const mappedNotifs = mapKeys(notifications || []);
            const mappedDiscounts = mapKeys(discounts || []);

            set({
                products: mappedProducts,
                orders: mappedOrders,
                users: mappedUsers,
                categories: mappedCategories,
                customers: mappedCustomers,
                settings: mappedSettings,
                expenses: mappedExpenses,
                suppliers: mappedSuppliers,
                purchaseOrders: mappedPOs,
                stockLogs: mappedLogs,
                notifications: mappedNotifs,
                discounts: mappedDiscounts,
                isLoading: false
            });

            // Sync to Dexie
            await offlineService.cacheAllData({
                products: mappedProducts,
                orders: mappedOrders,
                users: mappedUsers,
                categories: mappedCategories,
                customers: mappedCustomers,
                settings: mappedSettings,
                expenses: mappedExpenses,
                suppliers: mappedSuppliers,
                purchaseOrders: mappedPOs,
                stockLogs: mappedLogs,
                notifications: mappedNotifs,
                discounts: mappedDiscounts
            });
        } else {
            set({ isLoading: false });
        }
      }
    } catch (error) {
      console.error('Data load failed', error);
      set({ isLoading: false });
    }
  },

  // --- Inventory ---
  refreshProducts: async () => {
      const { data } = await supabase.from('products').select('*').eq('tenant_id', get().currentTenant?.id);
      set({ products: mapKeys(data) });
  },

  addProduct: async (product) => {
      const cleanProduct = JSON.parse(JSON.stringify(product));
      cleanProduct.tenantId = get().currentTenant?.id;
      const dbPayload = toSnakeCase(cleanProduct);
      const { data, error } = await supabase.from('products').insert(dbPayload).select().single();
      if (!error && data) {
          const newProduct = mapKeys(data);
          set(state => ({ products: [...state.products, newProduct] }));
      }
  },

  updateProduct: async (id, updates) => {
      const dbPayload = toSnakeCase(updates);
      await supabase.from('products').update(dbPayload).eq('id', id);
      set(state => ({
          products: state.products.map(p => p.id === id ? { ...p, ...updates } : p)
      }));
  },

  deleteProduct: async (id) => {
      await supabase.from('products').delete().eq('id', id);
      set(state => ({ products: state.products.filter(p => p.id !== id) }));
  },

  // --- Orders ---
  refreshOrders: async () => {
      const { data } = await supabase.from('orders').select('*').eq('tenant_id', get().currentTenant?.id).order('created_at', { ascending: false });
      set({ orders: mapKeys(data) });
  },

  addOrder: async (order) => {
      // ... (Order adding logic from previous version)
      const isOnline = navigator.onLine;
      const cleanOrder = JSON.parse(JSON.stringify(order));
      
      if (!cleanOrder.id) cleanOrder.id = crypto.randomUUID();
      cleanOrder.tenantId = get().currentTenant?.id;

      if (isOnline) {
          const dbPayload = toSnakeCase(cleanOrder);
          delete dbPayload.id;

          const { data, error } = await supabase.from('orders').insert(dbPayload).select().single();
          
          if (!error && data) {
              const newOrder = mapKeys(data);
              set(state => ({ orders: [newOrder, ...state.orders] }));
              
              if (newOrder.status === 'COMPLETED') {
                  for (const item of newOrder.items) {
                      const product = get().products.find(p => p.id === item.productId);
                      if (product) {
                          const change = item.type === 'RETURN' ? item.quantity : -item.quantity;
                          const newStock = product.stock + change;
                          await get().updateProduct(product.id, { stock: newStock });
                          
                          const logPayload = toSnakeCase({
                              tenantId: get().currentTenant?.id,
                              productId: product.id,
                              productName: product.name,
                              sku: product.sku,
                              changeAmount: change,
                              finalStock: newStock,
                              type: item.type === 'RETURN' ? 'RETURN' : 'SALE',
                              reason: `Order #${newOrder.id.slice(-6)}`,
                              performedBy: get().user?.name || 'Staff'
                          });
                          await supabase.from('stock_logs').insert(logPayload);
                      }
                  }
              }
              return newOrder;
          }
      } 
      
      await offlineService.processOfflineOrder(cleanOrder as Order);
      set(state => ({ orders: [cleanOrder as Order, ...state.orders] }));
      return cleanOrder as Order;
  },

  updateOrderStatus: async (id, status, additionalData) => {
      const updates = { status, ...additionalData };
      const dbPayload = toSnakeCase(updates);
      if (status === OrderStatus.RETURNED) dbPayload.returned_at = new Date();

      await supabase.from('orders').update(dbPayload).eq('id', id);
      
      if (status === OrderStatus.RETURNED) {
          const order = get().orders.find(o => o.id === id);
          if (order) {
              for (const item of order.items) {
                  const product = get().products.find(p => p.id === item.productId);
                  if (product) {
                      const newStock = product.stock + item.quantity;
                      await get().updateProduct(product.id, { stock: newStock });
                      
                      const logPayload = toSnakeCase({
                          tenantId: get().currentTenant?.id,
                          productId: product.id,
                          productName: product.name,
                          sku: product.sku,
                          changeAmount: item.quantity,
                          finalStock: newStock,
                          type: 'RETURN',
                          reason: `Return Order #${order.id.slice(-6)}: ${additionalData?.returnReason}`,
                          performedBy: additionalData?.returnedBy || 'Staff'
                      });
                      await supabase.from('stock_logs').insert(logPayload);
                  }
              }
          }
      }

      set(state => ({
          orders: state.orders.map(o => o.id === id ? { ...o, status, ...additionalData } : o)
      }));
  },

  // --- Categories ---
  refreshCategories: async () => {
      const { data } = await supabase.from('categories').select('*').eq('tenant_id', get().currentTenant?.id);
      set({ categories: mapKeys(data) });
  },
  addCategory: async (category) => {
      const dbPayload = toSnakeCase({ ...category, tenantId: get().currentTenant?.id });
      const { data } = await supabase.from('categories').insert(dbPayload).select().single();
      if(data) set(state => ({ categories: [...state.categories, mapKeys(data)] }));
  },
  deleteCategory: async (id) => {
      await supabase.from('categories').delete().eq('id', id);
      set(state => ({ categories: state.categories.filter(c => c.id !== id) }));
  },

  // --- Stock Logs ---
  refreshStockLogs: async () => {
      const { data } = await supabase.from('stock_logs').select('*').eq('tenant_id', get().currentTenant?.id).order('created_at', { ascending: false }).limit(50);
      set({ stockLogs: mapKeys(data) });
  },

  // --- Users ---
  refreshUsers: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('tenant_id', get().currentTenant?.id);
      set({ users: mapKeys(data) });
  },
  inviteUser: async (userData) => {
      const dbPayload = toSnakeCase({
          ...userData,
          tenantId: get().currentTenant?.id,
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=random`
      });
      delete dbPayload.password; 
      
      const { data } = await supabase.from('profiles').insert(dbPayload).select().single();
      if (data) set(state => ({ users: [...state.users, mapKeys(data)] }));
  },
  removeUser: async (id) => {
      await supabase.from('profiles').delete().eq('id', id);
      set(state => ({ users: state.users.filter(u => u.id !== id) }));
  },
  updateUser: async (id, data) => {
      const dbPayload = toSnakeCase(data);
      await supabase.from('profiles').update(dbPayload).eq('id', id);
      set(state => ({ users: state.users.map(u => u.id === id ? { ...u, ...data } : u) }));
  },
  updateUserRole: async (id, role, permissions) => {
      await get().updateUser(id, { role, permissions });
  },
  updateUserPin: async (id, pin) => {
      await get().updateUser(id, { pin });
  },
  updateUserPassword: async (id, newPass) => {
      if (id === get().user?.id) {
          await supabase.auth.updateUser({ password: newPass });
      }
  },
  verifyUserPin: async (pin) => {
      const user = get().user;
      return user?.pin === pin;
  },
  leaveCurrentTenant: async () => {
      get().logout();
  },

  // --- Settings ---
  updateTenantProfile: async (id, updates) => {
      const dbPayload = toSnakeCase(updates);
      await supabase.from('tenants').update(dbPayload).eq('id', id);
      set(state => ({ currentTenant: state.currentTenant ? { ...state.currentTenant, ...updates } : null }));
  },
  updateSettings: async (updates) => {
      const dbPayload = toSnakeCase(updates);
      await supabase.from('settings').update(dbPayload).eq('tenant_id', get().currentTenant?.id);
      const { data } = await supabase.from('settings').select('*').eq('tenant_id', get().currentTenant?.id).single();
      if(data) set({ settings: mapKeys(data) });
  },

  // --- Suppliers ---
  refreshSuppliers: async () => {
      const { data } = await supabase.from('suppliers').select('*').eq('tenant_id', get().currentTenant?.id);
      set({ suppliers: mapKeys(data) });
  },
  addSupplier: async (sup) => {
      const dbPayload = toSnakeCase({ ...sup, tenantId: get().currentTenant?.id });
      const { data } = await supabase.from('suppliers').insert(dbPayload).select().single();
      if(data) set(state => ({ suppliers: [...state.suppliers, mapKeys(data)] }));
  },
  deleteSupplier: async (id) => {
      await supabase.from('suppliers').delete().eq('id', id);
      set(state => ({ suppliers: state.suppliers.filter(s => s.id !== id) }));
  },

  // --- Customers ---
  refreshCustomers: async () => {
      const { data } = await supabase.from('customers').select('*').eq('tenant_id', get().currentTenant?.id);
      set({ customers: mapKeys(data) });
  },
  addCustomer: async (cust) => {
      const dbPayload = toSnakeCase({ ...cust, tenantId: get().currentTenant?.id });
      const { data } = await supabase.from('customers').insert(dbPayload).select().single();
      if(data) {
          const newC = mapKeys(data);
          set(state => ({ customers: [...state.customers, newC] }));
          return newC;
      }
      return cust as Customer;
  },
  updateCustomer: async (id, updates) => {
      const dbPayload = toSnakeCase(updates);
      await supabase.from('customers').update(dbPayload).eq('id', id);
      set(state => ({ customers: state.customers.map(c => c.id === id ? { ...c, ...updates } : c) }));
  },
  deleteCustomer: async (id) => {
      await supabase.from('customers').delete().eq('id', id);
      set(state => ({ customers: state.customers.filter(c => c.id !== id) }));
  },

  // --- Notifications ---
  refreshNotifications: async () => {
      const { data } = await supabase.from('notifications').select('*').eq('tenant_id', get().currentTenant?.id).order('created_at', { ascending: false });
      set({ notifications: mapKeys(data) });
  },
  markNotificationRead: async (id) => {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
      set(state => ({
          notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      }));
  },
  markAllNotificationsRead: async () => {
      await supabase.from('notifications').update({ read: true }).eq('tenant_id', get().currentTenant?.id);
      set(state => ({
          notifications: state.notifications.map(n => ({ ...n, read: true }))
      }));
  },

  // --- Purchase Orders ---
  refreshPurchaseOrders: async () => {
      const { data } = await supabase.from('purchase_orders').select('*').eq('tenant_id', get().currentTenant?.id).order('created_at', { ascending: false });
      set({ purchaseOrders: mapKeys(data) });
  },
  addPurchaseOrder: async (po) => {
      const dbPayload = toSnakeCase({ ...po, tenantId: get().currentTenant?.id });
      const { data } = await supabase.from('purchase_orders').insert(dbPayload).select().single();
      if(data) set(state => ({ purchaseOrders: [mapKeys(data), ...state.purchaseOrders] }));
  },
  updatePurchaseOrderStatus: async (id, status) => {
      await supabase.from('purchase_orders').update({ status }).eq('id', id);
      
      if (status === PurchaseOrderStatus.RECEIVED) {
          const po = get().purchaseOrders.find(p => p.id === id);
          if (po) {
              for (const item of po.items) {
                  const product = get().products.find(p => p.id === item.productId);
                  if (product) {
                      const newStock = product.stock + item.quantity;
                      await get().updateProduct(product.id, { stock: newStock, costPrice: item.unitCost });
                      
                      const logPayload = toSnakeCase({
                          tenantId: get().currentTenant?.id,
                          productId: product.id,
                          productName: product.name,
                          sku: product.sku,
                          changeAmount: item.quantity,
                          finalStock: newStock,
                          type: 'IN',
                          reason: `PO Received #${po.id.slice(-6)}`,
                          performedBy: get().user?.name || 'Staff'
                      });
                      await supabase.from('stock_logs').insert(logPayload);
                  }
              }
          }
      }

      set(state => ({
          purchaseOrders: state.purchaseOrders.map(p => p.id === id ? { ...p, status } : p)
      }));
  },

  // --- Expenses ---
  refreshExpenses: async () => {
      const { data } = await supabase.from('expenses').select('*').eq('tenant_id', get().currentTenant?.id).order('date', { ascending: false });
      set({ expenses: mapKeys(data) });
  },
  addExpense: async (exp) => {
      const dbPayload = toSnakeCase({ ...exp, tenantId: get().currentTenant?.id });
      const { data } = await supabase.from('expenses').insert(dbPayload).select().single();
      if(data) set(state => ({ expenses: [mapKeys(data), ...state.expenses] }));
  },
  deleteExpense: async (id) => {
      await supabase.from('expenses').delete().eq('id', id);
      set(state => ({ expenses: state.expenses.filter(e => e.id !== id) }));
  },

  // --- Discounts ---
  refreshDiscounts: async () => {
      const { data } = await supabase.from('discounts').select('*').eq('tenant_id', get().currentTenant?.id);
      set({ discounts: mapKeys(data) });
  },
  addDiscount: async (discount) => {
      const dbPayload = toSnakeCase({ ...discount, tenantId: get().currentTenant?.id });
      const { data } = await supabase.from('discounts').insert(dbPayload).select().single();
      if(data) set(state => ({ discounts: [...state.discounts, mapKeys(data)] }));
  },
  deleteDiscount: async (id) => {
      await supabase.from('discounts').delete().eq('id', id);
      set(state => ({ discounts: state.discounts.filter(d => d.id !== id) }));
  },

  // --- Admin ---
  loadAdminData: async () => {
      const { data: tenants } = await supabase.from('tenants').select('*');
      const { data: reqs } = await supabase.from('subscription_requests').select('*');
      
      const mappedTenants = mapKeys(tenants || []);
      const mappedReqs = mapKeys(reqs || []);
      
      const transactions: Transaction[] = mappedReqs
        .filter((r: SubscriptionRequest) => r.status === 'APPROVED')
        .map((r: SubscriptionRequest) => ({
            id: r.id,
            tenantId: r.tenantId,
            amount: r.amount,
            status: 'SUCCESS',
            date: r.createdAt
        }));

      set({ 
          allTenants: mappedTenants, 
          subscriptionRequests: mappedReqs,
          transactions: transactions 
      });
  },
  fetchTenantDetails: async (tenantId) => {
      const { data: tenant } = await supabase.from('tenants').select('*').eq('id', tenantId).single();
      const { data: users } = await supabase.from('profiles').select('*').eq('tenant_id', tenantId);
      const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId);
      const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId);
      
      const { data: orders } = await supabase.from('orders').select('total_amount').eq('tenant_id', tenantId);
      const revenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

      return {
          tenant: mapKeys(tenant),
          staff: mapKeys(users || []),
          stats: {
              totalProducts: productCount || 0,
              totalOrders: orderCount || 0,
              lifetimeRevenue: revenue,
              totalCustomers: 0, 
              totalStaff: users?.length || 0
          }
      };
  },
  updateTenantStatus: async (id, status) => {
      await supabase.from('tenants').update({ status }).eq('id', id);
      set(state => ({
          allTenants: state.allTenants.map(t => t.id === id ? { ...t, status } : t),
          currentTenant: state.currentTenant?.id === id ? { ...state.currentTenant, status } : state.currentTenant
      }));
  },
  extendTenantSubscription: async (tenantId, months) => {
      const tenant = get().allTenants.find(t => t.id === tenantId);
      if (tenant) {
          const currentExpiry = tenant.subscriptionExpiry ? new Date(tenant.subscriptionExpiry) : new Date();
          currentExpiry.setMonth(currentExpiry.getMonth() + months);
          const updates = { 
              subscription_expiry: currentExpiry.toISOString(),
              subscription_status: 'ACTIVE'
          };
          await supabase.from('tenants').update(updates).eq('id', tenantId);
          get().loadAdminData();
      }
  },
  submitSubscriptionProof: async (planId, planName, amount, proofUrl) => {
      const dbPayload = toSnakeCase({
          tenantId: get().currentTenant?.id,
          tenantName: get().currentTenant?.name,
          planId, planName, amount,
          paymentMethod: 'Manual Transfer',
          proofUrl,
          status: 'PENDING'
      });
      
      const { data } = await supabase.from('subscription_requests').insert(dbPayload).select().single();
      if(data) set(state => ({ subscriptionRequests: [...state.subscriptionRequests, mapKeys(data)] }));
  },
  approveSubscription: async (requestId) => {
      await supabase.from('subscription_requests').update({ status: 'APPROVED' }).eq('id', requestId);
      
      const req = get().subscriptionRequests.find(r => r.id === requestId);
      if(req) {
          const { data: tenant } = await supabase.from('tenants').select('subscription_expiry').eq('id', req.tenantId).single();
          const currentExpiry = tenant?.subscription_expiry ? new Date(tenant.subscription_expiry) : new Date();
          currentExpiry.setMonth(currentExpiry.getMonth() + 1);
          
          await supabase.from('tenants').update({ 
              subscription_tier: req.planName, 
              subscription_status: 'ACTIVE',
              subscription_expiry: currentExpiry.toISOString()
          }).eq('id', req.tenantId);
          
          get().loadAdminData();
      }
  },
  rejectSubscription: async (requestId) => {
      await supabase.from('subscription_requests').update({ status: 'REJECTED' }).eq('id', requestId);
      get().loadAdminData();
  },
  runRetentionPolicy: async () => ({ deleted: [], warned: [] }),

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
