import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useCartStore } from '../store/cartStore';
import { Product, Order, OrderStatus } from '../types';
import { ShoppingCart, Search, Trash2, Plus, Minus, CreditCard, RotateCcw, ScanLine, X, User as UserIcon, Tag, AlertTriangle, Layers } from 'lucide-react';
import { BarcodeScanner } from '../components/pos/BarcodeScanner';
import { printReceipt } from '../components/pos/Receipt';
import { offlineService } from '../services/db';

export const POSPage: React.FC = () => {
  const { products, customers, categories, currentTenant, addOrder, settings, user } = useStore();
  const { 
    addItem, removeItem, updateQuantity, clearCart, 
    subtotal, total, tax, discountAmount, 
    setCustomer, setDiscount, toggleGlobalReturnMode, 
    sessions, activeSlot, setActiveSlot 
  } = useCartStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  
  // Mobile Cart Toggle
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Directly access items from session state to ensure reactivity
  const currentSession = sessions[activeSlot];
  const cartItems = currentSession.items;

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        // Focus search
        document.getElementById('pos-search')?.focus();
      } else if (e.key === 'F8') {
        e.preventDefault();
        setShowCheckoutModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleScan = (code: string) => {
    const product = products.find(p => p.sku === code || p.id === code);
    if (product) {
      addItem(product);
      // Play beep sound
      const audio = new Audio('/beep.mp3'); 
      audio.play().catch(() => {});
    } else {
      alert(`Product not found: ${code}`);
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setIsProcessing(true);

    try {
      const newOrder: Partial<Order> = {
        items: cartItems,
        totalAmount: total(),
        discountAmount: discountAmount(),
        discountType: currentSession.discountType,
        status: OrderStatus.COMPLETED,
        customerId: currentSession.customerId,
        customerName: currentSession.customerName || 'Walk-in Customer',
        salespersonId: currentSession.salespersonId || user?.id,
        salespersonName: currentSession.salespersonName || user?.name,
        cashierId: user?.id,
        cashierName: user?.name,
        tenantId: currentTenant?.id,
        createdAt: new Date().toISOString()
      };

      const createdOrder = await addOrder(newOrder);
      
      if (createdOrder && settings?.autoPrintReceipt !== false && currentTenant) {
         printReceipt(createdOrder, currentTenant, settings);
      }
      
      clearCart();
      setShowCheckoutModal(false);
      setAmountPaid('');
      setIsMobileCartOpen(false);
    } catch (error) {
      console.error(error);
      alert('Transaction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearCart = () => {
    // Removed window.confirm to prevent browser blocking and ensure immediate action
    if (cartItems.length > 0) {
        clearCart();
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-slate-100 dark:bg-slate-900 gap-4">
      {/* Left Side: Product Catalog */}
      <div className={`flex-1 flex flex-col min-w-0 ${isMobileCartOpen ? 'hidden lg:flex' : 'flex'}`}>
        
        {/* Session / Slot Selector */}
        <div className="grid grid-cols-3 gap-3 mb-4">
            {sessions.map((session, idx) => {
                const count = session.items.reduce((sum, item) => sum + item.quantity, 0);
                const isActive = activeSlot === idx;
                return (
                    <button
                        key={idx}
                        onClick={() => setActiveSlot(idx)}
                        className={`
                            relative flex items-center justify-between px-3 py-3 rounded-xl border shadow-sm transition-all
                            ${isActive 
                                ? 'bg-emerald-600 border-emerald-600 text-white ring-2 ring-emerald-200 dark:ring-emerald-900/50' 
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-700'
                            }
                        `}
                    >
                        <div className="flex flex-col items-start min-w-0">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                                Slot {idx + 1}
                            </span>
                            <span className="text-xs font-semibold truncate w-full text-left">
                                {session.customerName || 'Walk-in'}
                            </span>
                        </div>
                        
                        <div className={`
                            flex items-center justify-center px-2 py-1 rounded-lg text-xs font-bold ml-2 shrink-0
                            ${isActive ? 'bg-white/20 text-white' : (count > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-700')}
                        `}>
                            {count > 0 ? `${count} Items` : 'Empty'}
                        </div>
                    </button>
                );
            })}
        </div>

        {/* Top Controls */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 space-y-4">
           <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                 <input 
                   id="pos-search"
                   type="text" 
                   placeholder="Search products (F2)" 
                   className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   autoFocus
                 />
              </div>
              <button 
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center justify-center gap-2 bg-slate-800 dark:bg-slate-700 text-white px-6 py-3 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors shadow-sm"
              >
                 <ScanLine size={20} /> <span className="hidden sm:inline">Scan</span>
              </button>
           </div>

           {/* Category Chips */}
           <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              <button 
                onClick={() => setSelectedCategory('ALL')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === 'ALL' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
              >
                All Items
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.name ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
                >
                  {cat.name}
                </button>
              ))}
           </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-2">
           <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                 <div 
                   key={product.id}
                   onClick={() => addItem(product)}
                   className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md cursor-pointer transition-all active:scale-95 flex flex-col h-full"
                 >
                    <div className="aspect-square bg-slate-100 dark:bg-slate-700 rounded-lg mb-3 overflow-hidden relative">
                       {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                       ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-2xl bg-slate-50 dark:bg-slate-800">{product.name.substring(0,2).toUpperCase()}</div>
                       )}
                       <div className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded backdrop-blur-sm">
                          {product.stock} left
                       </div>
                    </div>
                    <div className="mt-auto">
                       <h4 className="font-semibold text-slate-800 dark:text-white text-sm line-clamp-2 leading-tight mb-1">{product.name}</h4>
                       <div className="flex justify-between items-center">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">${product.price}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{product.sku}</span>
                       </div>
                    </div>
                 </div>
              ))}
              {filteredProducts.length === 0 && (
                 <div className="col-span-full flex flex-col items-center justify-center text-slate-400 py-12">
                    <Search size={48} className="mb-2 opacity-20" />
                    <p>No products found</p>
                 </div>
              )}
           </div>
        </div>
      </div>

      {/* Right Side: Cart / Checkout */}
      <div className={`w-full lg:w-[400px] bg-white dark:bg-slate-800 flex flex-col border-l border-slate-200 dark:border-slate-700 shadow-xl lg:shadow-none fixed lg:static inset-0 z-40 transition-transform duration-300 ${isMobileCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
         
         {/* Cart Header */}
         <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
            <div className="flex gap-2">
               <button onClick={() => setIsMobileCartOpen(false)} className="lg:hidden p-2 -ml-2 text-slate-500"><X size={20}/></button>
               <h2 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <ShoppingCart size={20}/> Current Sale
               </h2>
            </div>
            {/* Slots moved to main area */}
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded">
                    Slot {activeSlot + 1} Active
                </span>
            </div>
         </div>

         {/* Customer Selector */}
         <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 p-2 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" onClick={() => {
                const name = prompt("Enter customer name:", currentSession.customerName);
                if (name !== null) setCustomer(name ? { id: '', name, totalSpent: 0, phone: '', createdAt: '', email: '' } : undefined);
            }}>
               <UserIcon size={18} className="text-slate-500 dark:text-slate-400" />
               <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1 truncate">
                  {currentSession.customerName || 'Walk-in Customer'}
               </span>
               <Tag size={16} className="text-slate-400" />
            </div>
         </div>

         {/* Cart Items */}
         <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
            {cartItems.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <ShoppingCart size={64} className="opacity-10" />
                  <p className="text-sm">Cart is empty</p>
                  <p className="text-xs text-slate-400 text-center max-w-[200px]">Scan items or tap on products to add to sale</p>
               </div>
            ) : (
               cartItems.map(item => (
                  <div key={item.id} className={`flex gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border shadow-sm ${item.type === 'RETURN' ? 'border-red-200 bg-red-50/50' : 'border-slate-100 dark:border-slate-700'}`}>
                     <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden shrink-0">
                        {item.imageUrl && <img src={item.imageUrl} className="w-full h-full object-cover" />}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                           <h4 className="font-medium text-sm text-slate-800 dark:text-white truncate">{item.productName}</h4>
                           <button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-500"><X size={14}/></button>
                        </div>
                        <div className="flex justify-between items-end">
                           <div className="text-xs text-slate-500 dark:text-slate-400">
                              ${item.priceAtTime} x 
                           </div>
                           <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-700 rounded-lg px-1">
                              <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"><Minus size={12}/></button>
                              <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"><Plus size={12}/></button>
                           </div>
                           <div className="font-bold text-slate-800 dark:text-white">
                              ${(item.priceAtTime * item.quantity).toFixed(2)}
                           </div>
                        </div>
                     </div>
                  </div>
               ))
            )}
         </div>

         {/* Footer Actions & Totals */}
         <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 shadow-lg z-10">
            <div className="space-y-2 mb-4 text-sm">
               <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span>${subtotal().toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1 cursor-pointer" onClick={() => setDiscount('FIXED', prompt('Discount amount:', '0') ? parseFloat(prompt('Discount amount:', '0') || '0') : 0)}>Discount (Edit)</span>
                  <span className="text-red-500">-${discountAmount().toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Tax</span>
                  <span>${tax().toFixed(2)}</span>
               </div>
               <div className="flex justify-between font-bold text-lg text-slate-800 dark:text-white pt-2 border-t border-dashed border-slate-200 dark:border-slate-600">
                  <span>Total</span>
                  <span>${total().toFixed(2)}</span>
               </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
               <button onClick={handleClearCart} className="col-span-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg flex flex-col items-center justify-center p-2 hover:bg-red-100 transition-colors">
                  <Trash2 size={18} />
                  <span className="text-[10px] font-bold mt-1">Clear</span>
               </button>
               <button onClick={toggleGlobalReturnMode} className={`col-span-1 rounded-lg flex flex-col items-center justify-center p-2 transition-colors ${currentSession.globalReturnMode ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}>
                  <RotateCcw size={18} />
                  <span className="text-[10px] font-bold mt-1">{currentSession.globalReturnMode ? 'Return On' : 'Return'}</span>
               </button>
               <button 
                 onClick={() => setShowCheckoutModal(true)}
                 disabled={cartItems.length === 0}
                 className="col-span-2 bg-emerald-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
               >
                  <CreditCard size={20} />
                  <span className="font-bold text-lg">Pay</span>
               </button>
            </div>
         </div>
      </div>

      {/* Floating Cart Button (Mobile) */}
      {!isMobileCartOpen && (
         <button 
           onClick={() => setIsMobileCartOpen(true)}
           className="lg:hidden fixed bottom-4 right-4 bg-emerald-600 text-white p-4 rounded-full shadow-2xl z-30 flex items-center justify-center"
         >
            <ShoppingCart size={24} />
            {cartItems.length > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cartItems.length}</span>}
         </button>
      )}

      {/* Barcode Scanner Modal */}
      {isScannerOpen && <BarcodeScanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />}

      {/* Checkout Modal */}
      {showCheckoutModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
               <div className="p-6 text-center border-b border-slate-100 dark:border-slate-700">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Checkout</h3>
                  <p className="text-slate-500 dark:text-slate-400">Complete the transaction</p>
               </div>
               <div className="p-8">
                  <div className="text-center mb-8">
                     <p className="text-sm text-slate-500 uppercase tracking-wide font-semibold mb-2">Total Amount Due</p>
                     <h1 className="text-5xl font-extrabold text-emerald-600 dark:text-emerald-400">${total().toFixed(2)}</h1>
                  </div>

                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cash Received</label>
                        <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                           <input 
                             type="number" 
                             className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-xl font-bold text-slate-800 dark:text-white focus:border-emerald-500 outline-none transition-colors"
                             value={amountPaid}
                             onChange={e => setAmountPaid(e.target.value)}
                             autoFocus
                             placeholder="0.00"
                           />
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-3 gap-2">
                        {[10, 20, 50, 100].map(amt => (
                           <button 
                             key={amt} 
                             onClick={() => setAmountPaid(amt.toString())}
                             className="py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-slate-600"
                           >
                              ${amt}
                           </button>
                        ))}
                     </div>

                     {parseFloat(amountPaid) >= total() && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 flex justify-between items-center animate-in slide-in-from-top-2">
                           <span className="font-bold text-emerald-800 dark:text-emerald-300">Change Due:</span>
                           <span className="font-bold text-xl text-emerald-700 dark:text-emerald-400">${(parseFloat(amountPaid) - total()).toFixed(2)}</span>
                        </div>
                     )}
                  </div>
               </div>
               <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex gap-3">
                  <button 
                    onClick={() => setShowCheckoutModal(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold hover:bg-white dark:hover:bg-slate-800 transition-colors"
                  >
                     Cancel
                  </button>
                  <button 
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="flex-[2] py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                     {isProcessing ? 'Processing...' : 'Confirm Payment'}
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};