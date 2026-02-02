import { 
  User, Tenant, Product, Order, Category, StockLog, Supplier, 
  PurchaseOrder, Expense, Settings, Customer, Notification, 
  Plan, SubscriptionRequest, Transaction, TenantDetails, 
  Role, TenantStatus, OrderStatus, PurchaseOrderStatus
} from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Data
const MOCK_SETTINGS: Settings[] = [
  {
    id: 's1',
    tenantId: 't1',
    currency: 'PKR',
    timezone: 'Asia/Karachi',
    theme: 'light',
    taxRate: 0.05,
    receiptHeader: 'Thank you for shopping with Acme!',
    receiptFooter: 'Visit us at www.acme.com \n No refunds after 30 days.',
    showLogoOnReceipt: true,
    showCashierOnReceipt: true,
    showCustomerOnReceipt: true,
    showTaxBreakdown: true,
    showBarcode: true,
    showSalesPersonOnReceipt: true,
    autoPrintReceipt: true,
    receiptWidth: '80mm',
    receiptTemplate: 'modern',
    receiptFontSize: 12,
    receiptMargin: 10,
    requireCashier: true,
    requireSalesPerson: true
  }
];

const MOCK_TENANTS: Tenant[] = [
  {
    id: 't1',
    name: 'Acme Corp',
    email: 'contact@acme.com',
    status: TenantStatus.ACTIVE,
    subscriptionTier: 'Pro',
    subscriptionStatus: 'ACTIVE',
    createdAt: new Date().toISOString()
  }
];

const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Alice Admin',
    email: 'alice@acme.com',
    role: Role.ADMIN,
    tenantId: 't1',
    permissions: ['VIEW_DASHBOARD', 'MANAGE_PRODUCTS', 'MANAGE_ORDERS', 'MANAGE_USERS', 'MANAGE_SETTINGS'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'u2',
    name: 'Bob Cashier',
    email: 'bob@acme.com',
    role: Role.CASHIER,
    tenantId: 't1',
    permissions: ['POS_ACCESS', 'MANAGE_ORDERS'],
    createdAt: new Date().toISOString(),
    pin: '1234',
    pinRequired: true
  },
  {
    id: 'u_super',
    name: 'Tony Stark',
    email: 'tony@stark.com',
    role: Role.SUPER_ADMIN,
    tenantId: 't_super',
    createdAt: new Date().toISOString()
  }
];

const MOCK_PLANS: Plan[] = [
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
];

const MOCK_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Electronics', tenantId: 't1' },
  { id: 'c2', name: 'Fashion', tenantId: 't1' },
  { id: 'c3', name: 'Groceries', tenantId: 't1' },
  { id: 'c4', name: 'Accessories', tenantId: 't1' }
];

const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', tenantId: 't1', name: 'Wireless Headphones', sku: 'WH-001', category: 'Electronics', price: 150.00, stock: 45, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80', description: 'Noise cancelling' },
  { id: 'p2', tenantId: 't1', name: 'Smart Watch Series 5', sku: 'SW-005', category: 'Electronics', price: 299.99, stock: 20, imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80' },
  { id: 'p3', tenantId: 't1', name: 'Running Shoes', sku: 'RS-101', category: 'Fashion', price: 89.50, stock: 12, imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80' },
  { id: 'p4', tenantId: 't1', name: 'Cotton T-Shirt', sku: 'TS-002', category: 'Fashion', price: 25.00, stock: 100, imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80' },
  { id: 'p5', tenantId: 't1', name: 'Organic Coffee Beans', sku: 'CB-500', category: 'Groceries', price: 18.00, stock: 50, imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&q=80' },
  { id: 'p6', tenantId: 't1', name: 'Mechanical Keyboard', sku: 'MK-88', category: 'Electronics', price: 120.00, stock: 8, imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b91a226?w=500&q=80' },
  { id: 'p7', tenantId: 't1', name: 'Sunglasses', sku: 'SG-22', category: 'Fashion', price: 150.00, stock: 30, imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80' },
  { id: 'p8', tenantId: 't1', name: 'Leather Wallet', sku: 'LW-01', category: 'Accessories', price: 45.00, stock: 25, imageUrl: 'https://images.unsplash.com/photo-1627123424574-18bd03b4e5e9?w=500&q=80' },
];

// In-memory storage for mock operations
let products: Product[] = [...MOCK_PRODUCTS];
let orders: Order[] = [];
let categories: Category[] = [...MOCK_CATEGORIES];
let notifications: Notification[] = [];
let subscriptionRequests: SubscriptionRequest[] = [];

export const mockDb = {
  authenticate: async (email: string, password: string): Promise<{ user: User, tenant: Tenant } | null> => {
    await delay(500);
    const user = MOCK_USERS.find(u => u.email === email);
    // In real app, verify password. Here, mock pass.
    if (user) {
      const tenant = MOCK_TENANTS.find(t => t.id === user.tenantId);
      if (tenant) return { user, tenant };
    }
    return null;
  },

  registerTenant: async (companyName: string, adminName: string, email: string) => {
    await delay(800);
    const newTenant: Tenant = {
      id: `t_${Date.now()}`,
      name: companyName,
      email,
      status: TenantStatus.ACTIVE,
      subscriptionTier: 'FREE',
      subscriptionStatus: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    
    const newUser: User = {
      id: `u_${Date.now()}`,
      name: adminName,
      email,
      role: Role.ADMIN,
      tenantId: newTenant.id,
      permissions: ['VIEW_DASHBOARD', 'MANAGE_PRODUCTS', 'MANAGE_ORDERS', 'MANAGE_USERS', 'MANAGE_SETTINGS'],
      createdAt: new Date().toISOString()
    };

    MOCK_TENANTS.push(newTenant);
    MOCK_USERS.push(newUser);
    return { user: newUser, tenant: newTenant };
  },

  getTenantNotifications: async (tenantId: string): Promise<Notification[]> => {
    await delay(200);
    return notifications.filter(n => n.tenantId === tenantId);
  },

  getTenantProducts: async (tenantId: string): Promise<Product[]> => {
    await delay(200);
    return products.filter(p => p.tenantId === tenantId);
  },

  getTenantCategories: async (tenantId: string): Promise<Category[]> => {
    await delay(200);
    return categories.filter(c => c.tenantId === tenantId);
  },

  getTenantOrders: async (tenantId: string): Promise<Order[]> => {
    await delay(200);
    return orders.filter(o => o.tenantId === tenantId);
  },

  getPlans: async (): Promise<Plan[]> => {
    await delay(100);
    return MOCK_PLANS;
  },

  getAllTenants: async (): Promise<Tenant[]> => {
    await delay(300);
    return MOCK_TENANTS;
  },

  getTransactions: async (): Promise<Transaction[]> => {
    await delay(300);
    return [];
  },

  getSubscriptionRequests: async (): Promise<SubscriptionRequest[]> => {
    await delay(300);
    return subscriptionRequests;
  },

  getTenantDetails: async (tenantId: string): Promise<TenantDetails | null> => {
    await delay(300);
    const tenant = MOCK_TENANTS.find(t => t.id === tenantId);
    if (!tenant) return null;
    
    const tenantUsers = MOCK_USERS.filter(u => u.tenantId === tenantId);
    const tenantOrders = orders.filter(o => o.tenantId === tenantId);
    const tenantProducts = products.filter(p => p.tenantId === tenantId);

    return {
      tenant,
      stats: {
        totalProducts: tenantProducts.length,
        lifetimeRevenue: tenantOrders.reduce((sum, o) => sum + o.totalAmount, 0),
        totalCustomers: 0, // Mock
        totalOrders: tenantOrders.length,
        totalStaff: tenantUsers.length
      },
      staff: tenantUsers
    };
  },

  getTenantSettings: async (tenantId: string): Promise<Settings> => {
     await delay(200);
     const settings = MOCK_SETTINGS.find(s => s.tenantId === tenantId);
     if (settings) return settings;
     return {
         id: `s_${Date.now()}`,
         tenantId,
         currency: 'PKR',
         timezone: 'Asia/Karachi',
         theme: 'light',
         taxRate: 0,
         showLogoOnReceipt: true,
         showCashierOnReceipt: true,
         showCustomerOnReceipt: true,
         showTaxBreakdown: true,
         showBarcode: true,
         showSalesPersonOnReceipt: true,
         autoPrintReceipt: true,
         receiptWidth: '80mm',
         receiptTemplate: 'modern',
         receiptFontSize: 12,
         receiptMargin: 10
     };
  },

  updateTenantStatus: async (id: string, status: TenantStatus) => {
    await delay(300);
    const tenant = MOCK_TENANTS.find(t => t.id === id);
    if (tenant) tenant.status = status;
  },

  extendTenantSubscription: async (tenantId: string, months: number) => {
    await delay(300);
    const tenant = MOCK_TENANTS.find(t => t.id === tenantId);
    if (tenant) {
      const currentExpiry = tenant.subscriptionExpiry ? new Date(tenant.subscriptionExpiry) : new Date();
      currentExpiry.setMonth(currentExpiry.getMonth() + months);
      tenant.subscriptionExpiry = currentExpiry.toISOString();
      tenant.subscriptionStatus = 'ACTIVE';
    }
  },

  createSubscriptionRequest: async (req: Partial<SubscriptionRequest>) => {
    await delay(300);
    subscriptionRequests.push({
      id: `sr_${Date.now()}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      ...req
    } as SubscriptionRequest);
  },

  approveSubscription: async (requestId: string) => {
    await delay(300);
    const req = subscriptionRequests.find(r => r.id === requestId);
    if (req) {
      req.status = 'APPROVED';
      // Also update tenant status
      const tenant = MOCK_TENANTS.find(t => t.id === req.tenantId);
      if (tenant) {
        tenant.subscriptionStatus = 'ACTIVE';
        tenant.subscriptionTier = req.planName;
        // Extend by 1 month or year based on plan logic (omitted for brevity)
      }
    }
  },

  rejectSubscription: async (requestId: string) => {
    await delay(300);
    const req = subscriptionRequests.find(r => r.id === requestId);
    if (req) req.status = 'REJECTED';
  },

  runRetentionPolicy: async () => {
    await delay(1000);
    return { deleted: [], warned: [] };
  },

  updateUser: async (id: string, data: Partial<User>) => {
    await delay(200);
    const idx = MOCK_USERS.findIndex(u => u.id === id);
    if (idx !== -1) {
      MOCK_USERS[idx] = { ...MOCK_USERS[idx], ...data };
    }
  },

  markNotificationRead: async (id: string) => {
    const n = notifications.find(notif => notif.id === id);
    if (n) n.read = true;
  },

  markAllNotificationsRead: async (tenantId: string) => {
    notifications.forEach(n => {
      if (n.tenantId === tenantId) n.read = true;
    });
  }
};