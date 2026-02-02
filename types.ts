
export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
  SALESMAN: 'SALESMAN',
  USER: 'USER'
} as const;
export type Role = typeof Role[keyof typeof Role];

export type Permission = 
  | 'VIEW_DASHBOARD' | 'POS_ACCESS' | 'MANAGE_PRODUCTS' | 'MANAGE_ORDERS' 
  | 'MANAGE_CUSTOMERS' | 'MANAGE_SUPPLIERS' | 'MANAGE_EXPENSES' 
  | 'VIEW_REPORTS' | 'MANAGE_USERS' | 'MANAGE_SETTINGS' | 'MANAGE_DISCOUNTS';

export const TenantStatus = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  SUSPENDED: 'SUSPENDED'
} as const;
export type TenantStatus = typeof TenantStatus[keyof typeof TenantStatus];

export const OrderStatus = {
  COMPLETED: 'COMPLETED',
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED'
} as const;
export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

export const PurchaseOrderStatus = {
  DRAFT: 'DRAFT',
  ORDERED: 'ORDERED',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED'
} as const;
export type PurchaseOrderStatus = typeof PurchaseOrderStatus[keyof typeof PurchaseOrderStatus];

export const StockMovementType = {
  SALE: 'SALE',
  RETURN: 'RETURN',
  ADJUSTMENT: 'ADJUSTMENT',
  IN: 'IN',
  OUT: 'OUT'
} as const;
export type StockMovementType = typeof StockMovementType[keyof typeof StockMovementType];

export type OrderItemType = 'SALE' | 'RETURN';

export type ReceiptWidth = '58mm' | '80mm' | 'A4';
export type ReceiptTemplate = 'modern' | 'classic' | 'bold' | 'minimal';
export type BarcodeFormat = 'CODE128' | 'CODE39';
export type BarcodeGenerationType = 'SEQUENTIAL' | 'RANDOM';
export type BarcodePrefixType = 'NONE' | 'FIXED';
export type LabelFormat = 'A4_30' | 'THERMAL_50x30' | 'THERMAL_40x20';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string;
  permissions?: Permission[];
  avatarUrl?: string;
  pin?: string;
  pinRequired?: boolean;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  status: TenantStatus;
  subscriptionTier: string;
  subscriptionStatus: string;
  subscriptionExpiry?: string;
  createdAt: string;
}

export interface Settings {
  id: string;
  tenantId: string;
  currency: string;
  timezone: string;
  theme: 'light' | 'dark';
  taxRate: number;
  
  receiptHeader?: string;
  receiptFooter?: string;
  showLogoOnReceipt: boolean;
  showCashierOnReceipt: boolean;
  showCustomerOnReceipt: boolean;
  showTaxBreakdown: boolean;
  showBarcode: boolean;
  showSalesPersonOnReceipt: boolean;
  autoPrintReceipt?: boolean;

  receiptWidth?: ReceiptWidth;
  receiptTemplate?: ReceiptTemplate;
  receiptFontSize?: number;
  receiptMargin?: number;

  barcodeFormat?: BarcodeFormat;
  barcodeGenerationStrategy?: BarcodeGenerationType;
  barcodePrefixType?: BarcodePrefixType;
  barcodeCustomPrefix?: string;
  barcodeNextSequence?: number;
  barcodeLabelFormat?: LabelFormat;
  barcodeShowPrice?: boolean;
  barcodeShowName?: boolean;
  
  requireSalesPerson?: boolean;
  requireCashier?: boolean;
}

export interface Discount {
  id: string;
  tenantId?: string;
  name: string;
  code?: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  active: boolean;
  createdAt?: string;
}

export interface ProductAttribute {
  name: string;
  options: string[];
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  costPrice?: number;
  stock: number;
  lowStockThreshold?: number;
  description?: string;
  imageUrl?: string;
  supplierId?: string;
  attributes?: ProductAttribute[];
  createdAt?: string; 
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  tenantId?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  priceAtTime: number;
  costAtTime?: number;
  type: OrderItemType;
  selectedVariants?: Record<string, string>;
  imageUrl?: string;
}

export interface Order {
  id: string;
  tenantId: string;
  customerName: string;
  customerId?: string;
  salespersonId?: string;
  salespersonName?: string;
  cashierId?: string;
  cashierName?: string;
  items: OrderItem[];
  totalAmount: number;
  discountAmount?: number;
  discountType?: 'PERCENT' | 'FIXED';
  status: OrderStatus;
  isReturn?: boolean;
  returnReason?: string;
  returnedBy?: string;
  returnedAt?: string;
  createdAt: string;
  userId?: string; 
}

export interface Customer {
  id: string;
  tenantId?: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  totalSpent: number;
  lastOrderDate?: Date | string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  tenantId?: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  tenantId?: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  totalAmount: number;
  createdAt: string;
}

export interface Expense {
  id: string;
  tenantId?: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export interface StockLog {
  id: string;
  tenantId: string;
  productId: string;
  productName: string;
  sku: string;
  changeAmount: number;
  finalStock: number;
  type: StockMovementType;
  reason: string;
  performedBy: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  tenantId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  read: boolean;
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  period: 'Monthly' | 'Quarterly' | 'Yearly';
  features: string[];
  maxUsers: number;
  maxProducts: number;
  highlight?: boolean;
  tier: string;
  description: string;
}

export interface SubscriptionRequest {
  id: string;
  tenantId: string;
  tenantName: string;
  planId: string;
  planName: string;
  amount: number;
  paymentMethod: string;
  proofUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface Transaction {
  id: string;
  tenantId: string;
  amount: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  date: string;
}

export interface TenantDetails {
  tenant: Tenant;
  stats: {
    totalProducts: number;
    lifetimeRevenue: number;
    totalCustomers: number;
    totalOrders: number;
    totalStaff: number;
  };
  staff: User[];
}

export interface AppState {
  currentTenant: Tenant | null;
  settings: Settings | null;
  user: User | null;
  tenants: Tenant[];
  users: User[];
  products: Product[];
  categories: Category[];
  stockLogs: StockLog[];
  orders: Order[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  expenses: Expense[];
  customers: Customer[];
  notifications: Notification[];
  plans: Plan[];
  discounts: Discount[];
  
  // Admin specific
  allTenants: Tenant[];
  transactions: Transaction[];
  subscriptionRequests: SubscriptionRequest[];

  isLoading: boolean;
  searchQuery: string;
  theme: 'light' | 'dark';
}
