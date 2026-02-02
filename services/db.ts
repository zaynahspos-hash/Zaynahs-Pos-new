
import Dexie, { Table } from 'dexie';
import { Product, Order, Tenant, User, Category, Supplier, Customer, Notification, PurchaseOrder, Expense, Settings, StockLog, Transaction, Plan, StockMovementType, Discount } from '../types';

/**
 * Offline Database using Dexie (IndexedDB wrapper).
 * Acts as a local cache for the entire application to support PWA functionality.
 */
class POSDatabase extends Dexie {
  // Core Entities
  tenants!: Table<Tenant>;
  users!: Table<User>;
  settings!: Table<Settings>;
  
  // Operational Data
  products!: Table<Product>;
  categories!: Table<Category>;
  stockLogs!: Table<StockLog>;
  orders!: Table<Order>;
  
  // CRM & Partners
  customers!: Table<Customer>;
  suppliers!: Table<Supplier>;
  
  // Financials
  purchaseOrders!: Table<PurchaseOrder>;
  expenses!: Table<Expense>;
  transactions!: Table<Transaction>;
  plans!: Table<Plan>;
  discounts!: Table<Discount>;
  
  // System
  notifications!: Table<Notification>;
  
  // Offline Queue
  pendingOrders!: Table<Order>;
  pendingSync!: Table<{ id: string; table: string; action: 'create' | 'update' | 'delete'; data: any; timestamp: number }>;

  constructor() {
    super('SaaS_Nexus_POS_DB_V2');
    
    // Define schema
    // Bumped to version 3 to include discounts
    (this as any).version(3).stores({
      tenants: 'id, status',
      users: 'id, tenantId, email',
      settings: 'id, tenantId',
      products: 'id, tenantId, name, sku, category',
      categories: 'id, tenantId',
      stockLogs: 'id, tenantId, productId',
      orders: 'id, tenantId, status, createdAt',
      customers: 'id, tenantId, email, phone',
      suppliers: 'id, tenantId',
      purchaseOrders: 'id, tenantId, status',
      expenses: 'id, tenantId, date',
      transactions: 'id, tenantId, date',
      plans: 'id',
      discounts: 'id, tenantId, code',
      notifications: 'id, tenantId, read',
      pendingOrders: 'id, tenantId',
      pendingSync: 'id, table, timestamp'
    });
  }
}

export const db = new POSDatabase();

export const offlineService = {
  /**
   * Syncs all data from the API to local IndexedDB.
   * This ensures the app works completely offline after the first load.
   */
  cacheAllData: async (data: {
    tenants?: Tenant[],
    users?: User[],
    products?: Product[],
    categories?: Category[],
    orders?: Order[],
    customers?: Customer[],
    suppliers?: Supplier[],
    settings?: Settings,
    stockLogs?: StockLog[],
    purchaseOrders?: PurchaseOrder[],
    expenses?: Expense[],
    notifications?: Notification[],
    plans?: Plan[],
    discounts?: Discount[]
  }) => {
    try {
      await (db as any).transaction('rw', 
        db.tenants, db.users, db.products, db.categories, db.orders, 
        db.customers, db.suppliers, db.settings, db.stockLogs, 
        db.purchaseOrders, db.expenses, db.notifications, db.plans, db.discounts,
        async () => {
          if (data.tenants) await db.tenants.bulkPut(data.tenants);
          if (data.users) await db.users.bulkPut(data.users);
          if (data.products) await db.products.bulkPut(data.products);
          if (data.categories) await db.categories.bulkPut(data.categories);
          if (data.orders) await db.orders.bulkPut(data.orders);
          if (data.customers) await db.customers.bulkPut(data.customers);
          if (data.suppliers) await db.suppliers.bulkPut(data.suppliers);
          if (data.settings) await db.settings.put(data.settings);
          if (data.stockLogs) await db.stockLogs.bulkPut(data.stockLogs);
          if (data.purchaseOrders) await db.purchaseOrders.bulkPut(data.purchaseOrders);
          if (data.expenses) await db.expenses.bulkPut(data.expenses);
          if (data.notifications) await db.notifications.bulkPut(data.notifications);
          if (data.plans) await db.plans.bulkPut(data.plans);
          if (data.discounts) await db.discounts.bulkPut(data.discounts);
      });
      console.log('📦 Local Cache Updated Successfully');
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  },

  /**
   * Load entire state from local DB.
   * Used when offline or for fast initial render.
   */
  loadLocalState: async (tenantId: string) => {
    const [
      products, orders, users, categories, 
      customers, suppliers, stockLogs, 
      purchaseOrders, expenses, notifications, settingsArray, plans, discounts
    ] = await Promise.all([
      db.products.where('tenantId').equals(tenantId).toArray(),
      db.orders.where('tenantId').equals(tenantId).reverse().sortBy('createdAt'),
      db.users.where('tenantId').equals(tenantId).toArray(),
      db.categories.where('tenantId').equals(tenantId).toArray(),
      db.customers.where('tenantId').equals(tenantId).toArray(),
      db.suppliers.where('tenantId').equals(tenantId).toArray(),
      db.stockLogs.where('tenantId').equals(tenantId).reverse().sortBy('createdAt'),
      db.purchaseOrders.where('tenantId').equals(tenantId).reverse().sortBy('createdAt'),
      db.expenses.where('tenantId').equals(tenantId).reverse().sortBy('date'),
      db.notifications.where('tenantId').equals(tenantId).reverse().sortBy('createdAt'),
      db.settings.where('tenantId').equals(tenantId).toArray(),
      db.plans.toArray(),
      db.discounts.where('tenantId').equals(tenantId).toArray()
    ]);

    return {
      products, orders, users, categories,
      customers, suppliers, stockLogs,
      purchaseOrders, expenses, notifications, plans, discounts,
      settings: settingsArray[0] || null
    };
  },

  syncProducts: async (products: Product[]) => {
    await db.products.bulkPut(products);
  },

  searchProducts: async (tenantId: string, query: string): Promise<Product[]> => {
    const normalize = (str: string) => str.toLowerCase();
    const q = normalize(query);

    return await db.products
      .where('tenantId')
      .equals(tenantId)
      .filter(p => normalize(p.name).includes(q) || normalize(p.sku).includes(q))
      .toArray();
  },

  /**
   * ATOMIC OFFLINE TRANSACTION
   * Saves order, updates product stock, and writes stock logs locally in one transaction.
   * This ensures data consistency if the browser is closed before sync.
   */
  processOfflineOrder: async (order: Order) => {
    return await (db as any).transaction('rw', db.orders, db.pendingOrders, db.products, db.stockLogs, async () => {
      // 1. Save Order to History and Pending Queue
      await db.orders.put(order);
      await db.pendingOrders.put(order);

      // 2. Update Stock & Create Logs for each item
      for (const item of order.items) {
        const product = await db.products.get(item.productId);
        if (product) {
          const isReturn = item.type === 'RETURN';
          const quantityChange = isReturn ? item.quantity : -item.quantity; // Returns increase stock, Sales decrease
          const newStock = product.stock + quantityChange;
          
          // Update Product Stock locally
          await db.products.update(item.productId, { stock: newStock });

          // Create Local Stock Log
          await db.stockLogs.add({
            id: `sl_off_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            tenantId: order.tenantId,
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            changeAmount: quantityChange,
            finalStock: newStock,
            type: isReturn ? StockMovementType.RETURN : StockMovementType.SALE,
            reason: `Offline Order #${(order.id || '???').slice(-6)}`,
            performedBy: order.salespersonName || 'Offline User',
            createdAt: new Date().toISOString()
          });
        }
      }
      console.log('✅ Offline Transaction Committed:', order.id);
    });
  },

  getPendingOrders: async () => {
    return await db.pendingOrders.toArray();
  },

  clearPendingOrder: async (id: string) => {
    await db.pendingOrders.delete(id);
  }
};
