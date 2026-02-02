import { create } from 'zustand';
import { Product, OrderItem, Customer, OrderItemType } from '../types';

interface CartItem extends OrderItem {
  stock: number; // Keep track of available stock for validation
  imageUrl?: string; // Added for display in POS
}

interface CartSession {
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  customerId?: string;
  salespersonId?: string;
  salespersonName?: string;
  cashierId?: string;
  cashierName?: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  globalReturnMode: boolean;
  lastUpdated: number;
}

interface CartState {
  // Slots System
  sessions: CartSession[]; // Array of 3 sessions
  activeSlot: number; // 0, 1, 2

  // Global Settings (Shared across slots or specific to current)
  taxRate: number;

  // Actions
  setActiveSlot: (index: number) => void;
  addItem: (product: Product, variants?: Record<string, string>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  
  // Session Setters (Update active session)
  setCustomer: (customer?: Customer) => void;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setSalesperson: (id: string, name: string) => void;
  setCashier: (id: string, name: string) => void;
  setDiscount: (type: 'PERCENT' | 'FIXED', value: number) => void;
  toggleGlobalReturnMode: () => void;
  setTaxRate: (rate: number) => void;

  // Getters (Computed for ACTIVE slot)
  activeItems: () => CartItem[];
  subtotal: () => number;
  tax: () => number;
  discountAmount: () => number;
  total: () => number;
  getItemCount: (productId: string) => number;
}

// Helper to compare variants
const areVariantsEqual = (v1?: Record<string, string>, v2?: Record<string, string>) => {
    if (!v1 && !v2) return true;
    if (!v1 || !v2) return false;
    const keys1 = Object.keys(v1);
    const keys2 = Object.keys(v2);
    if (keys1.length !== keys2.length) return false;
    return keys1.every(key => v1[key] === v2[key]);
};

// Initial empty session factory function
const getEmptySession = (): CartSession => ({
    items: [],
    customerName: '',
    customerPhone: '',
    customerId: undefined,
    salespersonId: undefined,
    salespersonName: undefined,
    cashierId: undefined,
    cashierName: undefined,
    discountType: 'FIXED',
    discountValue: 0,
    globalReturnMode: false,
    lastUpdated: Date.now()
});

export const useCartStore = create<CartState>((set, get) => ({
  sessions: [
      getEmptySession(), 
      getEmptySession(), 
      getEmptySession()
  ],
  activeSlot: 0,
  taxRate: 0.08,

  setActiveSlot: (index) => set({ activeSlot: index }),

  addItem: (product, variants) => {
    const { sessions, activeSlot } = get();
    const currentSession = sessions[activeSlot];
    const { items, globalReturnMode } = currentSession;
    
    const typeToAdd: OrderItemType = globalReturnMode ? 'RETURN' : 'SALE';
    
    // Check existing
    const existing = items.find(i => 
        i.productId === product.id && 
        i.type === typeToAdd && 
        areVariantsEqual(i.selectedVariants, variants)
    );

    let newItems;
    if (existing) {
      if (typeToAdd === 'SALE' && existing.quantity >= product.stock) return; // Stock limit
      
      newItems = items.map(i => 
          (i.id === existing.id) ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      newItems = [...items, {
          id: `ci_${Date.now()}_${Math.random()}`,
          productId: product.id,
          productName: product.name,
          priceAtTime: product.price,
          costAtTime: product.costPrice || (product.price * 0.7), 
          quantity: 1,
          stock: product.stock,
          type: typeToAdd,
          imageUrl: product.imageUrl,
          selectedVariants: variants
      }];
    }

    const newSessions = [...sessions];
    newSessions[activeSlot] = { ...currentSession, items: newItems, lastUpdated: Date.now() };
    set({ sessions: newSessions });
  },

  removeItem: (itemId) => {
    const { sessions, activeSlot } = get();
    const newItems = sessions[activeSlot].items.filter(i => i.id !== itemId);
    const newSessions = [...sessions];
    newSessions[activeSlot] = { ...sessions[activeSlot], items: newItems, lastUpdated: Date.now() };
    set({ sessions: newSessions });
  },

  updateQuantity: (itemId, delta) => {
    const { sessions, activeSlot } = get();
    const newItems = sessions[activeSlot].items.map(i => {
        if (i.id === itemId) {
          const newQty = i.quantity + delta;
          if (newQty > 0) {
             if (i.type === 'SALE' && newQty > i.stock) return i;
             return { ...i, quantity: newQty };
          }
        }
        return i;
    });
    const newSessions = [...sessions];
    newSessions[activeSlot] = { ...sessions[activeSlot], items: newItems, lastUpdated: Date.now() };
    set({ sessions: newSessions });
  },

  clearCart: () => {
      // Use get() to access the most current state safely
      const { sessions, activeSlot } = get();
      
      // Get the current session to preserve staff info
      const currentSession = sessions[activeSlot];
      if (!currentSession) return;

      // Create a brand new session object with empty items
      const resetSession: CartSession = {
          items: [], // Explicitly empty
          customerName: '',
          customerPhone: '',
          customerId: undefined,
          
          // Preserve Staff Info
          salespersonId: currentSession.salespersonId,
          salespersonName: currentSession.salespersonName,
          cashierId: currentSession.cashierId,
          cashierName: currentSession.cashierName,
          
          discountType: 'FIXED',
          discountValue: 0,
          globalReturnMode: false,
          lastUpdated: Date.now()
      };

      // Update the sessions array at the specific index
      const newSessions = [...sessions];
      newSessions[activeSlot] = resetSession;

      // Set the new state
      set({ sessions: newSessions });
  },

  // --- Session Setters ---
  setCustomer: (customer) => {
      const { sessions, activeSlot } = get();
      const newSessions = [...sessions];
      newSessions[activeSlot] = { 
          ...sessions[activeSlot], 
          customerId: customer?.id, 
          customerName: customer?.name || '', 
          customerPhone: customer?.phone || '' 
      };
      set({ sessions: newSessions });
  },

  setCustomerName: (name) => {
      const { sessions, activeSlot } = get();
      const newSessions = [...sessions];
      newSessions[activeSlot] = { ...sessions[activeSlot], customerName: name, customerId: undefined };
      set({ sessions: newSessions });
  },

  setCustomerPhone: (phone) => {
      const { sessions, activeSlot } = get();
      const newSessions = [...sessions];
      newSessions[activeSlot] = { ...sessions[activeSlot], customerPhone: phone };
      set({ sessions: newSessions });
  },

  setSalesperson: (id, name) => {
      const { sessions, activeSlot } = get();
      const newSessions = [...sessions];
      newSessions[activeSlot] = { ...sessions[activeSlot], salespersonId: id, salespersonName: name };
      set({ sessions: newSessions });
  },

  setCashier: (id, name) => {
      const { sessions, activeSlot } = get();
      const newSessions = [...sessions];
      newSessions[activeSlot] = { ...sessions[activeSlot], cashierId: id, cashierName: name };
      set({ sessions: newSessions });
  },

  setDiscount: (type, value) => {
      const val = isNaN(value) ? 0 : value;
      const { sessions, activeSlot } = get();
      const newSessions = [...sessions];
      newSessions[activeSlot] = { ...sessions[activeSlot], discountType: type, discountValue: val };
      set({ sessions: newSessions });
  },

  toggleGlobalReturnMode: () => {
      const { sessions, activeSlot } = get();
      const newSessions = [...sessions];
      newSessions[activeSlot] = { ...sessions[activeSlot], globalReturnMode: !sessions[activeSlot].globalReturnMode };
      set({ sessions: newSessions });
  },

  setTaxRate: (rate) => set({ taxRate: rate }),

  // --- Getters ---
  activeItems: () => get().sessions[get().activeSlot].items,

  subtotal: () => {
    const items = get().sessions[get().activeSlot].items;
    return items.reduce((s, item) => {
        const sign = item.type === 'RETURN' ? -1 : 1;
        return s + (item.priceAtTime * item.quantity * sign);
    }, 0);
  },

  discountAmount: () => {
    const { discountType, discountValue } = get().sessions[get().activeSlot];
    const sub = get().subtotal();
    if (sub <= 0) return 0;
    
    let calculated = discountType === 'PERCENT' ? sub * (discountValue / 100) : discountValue;
    return Math.min(calculated, sub);
  },

  tax: () => {
    const { taxRate } = get();
    const sub = get().subtotal();
    const disc = get().discountAmount();
    return (sub - disc) * taxRate;
  },

  total: () => {
    return get().subtotal() - get().discountAmount() + get().tax();
  },

  getItemCount: (productId: string) => {
      const items = get().sessions[get().activeSlot].items;
      return items
        .filter(i => i.productId === productId)
        .reduce((sum, i) => sum + i.quantity, 0);
  }
}));