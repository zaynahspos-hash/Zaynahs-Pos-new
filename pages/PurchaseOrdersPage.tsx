import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { PurchaseOrderStatus, PurchaseOrderItem } from '../types';
import { ClipboardList, Plus, Search, Eye, X, Check, FileText } from 'lucide-react';

export const PurchaseOrdersPage: React.FC = () => {
  const { purchaseOrders, suppliers, products, addPurchaseOrder, updatePurchaseOrderStatus } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  
  // New PO State
  const [supplierId, setSupplierId] = useState('');
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([]);
  const [currentItemId, setCurrentItemId] = useState('');
  const [currentQty, setCurrentQty] = useState(1);
  const [currentCost, setCurrentCost] = useState(0);

  const handleAddItem = () => {
    if (!currentItemId || currentQty <= 0) return;
    const product = products.find(p => p.id === currentItemId);
    if (!product) return;

    const newItem: PurchaseOrderItem = {
      id: `poi_${Date.now()}`,
      productId: product.id,
      productName: product.name,
      quantity: currentQty,
      unitCost: currentCost || product.price * 0.6,
      totalCost: (currentCost || product.price * 0.6) * currentQty
    };

    setPoItems([...poItems, newItem]);
    setCurrentItemId('');
    setCurrentQty(1);
    setCurrentCost(0);
  };

  const handleCreatePO = async () => {
    if (!supplierId || poItems.length === 0) return;
    const supplier = suppliers.find(s => s.id === supplierId);
    
    await addPurchaseOrder({
      supplierId,
      supplierName: supplier?.name || 'Unknown',
      status: PurchaseOrderStatus.ORDERED,
      items: poItems,
      totalAmount: poItems.reduce((sum, i) => sum + i.totalCost, 0),
    });

    setIsModalOpen(false);
    // Reset state
    setSupplierId('');
    setPoItems([]);
  };

  const getStatusColor = (status: PurchaseOrderStatus) => {
    switch(status) {
      case PurchaseOrderStatus.RECEIVED: return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case PurchaseOrderStatus.ORDERED: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case PurchaseOrderStatus.DRAFT: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
      case PurchaseOrderStatus.CANCELLED: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-slate-100 dark:bg-slate-700';
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Purchase Orders</h1>
          <p className="text-slate-500 dark:text-slate-400">Track outgoing stock orders to suppliers.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>New Order</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                 <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">PO #</th>
                 <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Supplier</th>
                 <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Date</th>
                 <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total</th>
                 <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                 <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
               {purchaseOrders.length === 0 ? (
                 <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800">
                     No purchase orders found.
                   </td>
                 </tr>
               ) : (
                 purchaseOrders.map((po) => (
                   <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                     <td className="px-6 py-4 font-mono text-sm text-slate-700 dark:text-slate-300">{po.id ? po.id.slice(-6).toUpperCase() : '---'}</td>
                     <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{po.supplierName}</td>
                     <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{new Date(po.createdAt).toLocaleDateString()}</td>
                     <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">${po.totalAmount.toFixed(2)}</td>
                     <td className="px-6 py-4">
                       <span className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(po.status)}`}>
                         {po.status}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                       <button onClick={() => setSelectedPO(po)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium text-sm">View</button>
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
          </table>
        </div>
      </div>

      {/* Create PO Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Create Purchase Order</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
               <div className="mb-6">
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Supplier</label>
                 <select 
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                 >
                   <option value="">-- Choose Supplier --</option>
                   {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
               </div>

               <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-700/30 mb-6">
                 <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Add Items</h4>
                 <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Product</label>
                      <select 
                        className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                        value={currentItemId}
                        onChange={e => setCurrentItemId(e.target.value)}
                      >
                         <option value="">Select Product</option>
                         {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                      </select>
                    </div>
                    <div className="w-24">
                       <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Qty</label>
                       <input 
                         type="number" min="1"
                         className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                         value={currentQty}
                         onChange={e => setCurrentQty(parseInt(e.target.value))}
                       />
                    </div>
                    <div className="w-24">
                       <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Unit Cost</label>
                       <input 
                         type="number" min="0" step="0.01"
                         className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                         value={currentCost}
                         onChange={e => setCurrentCost(parseFloat(e.target.value))}
                         placeholder="Auto"
                       />
                    </div>
                    <button 
                      onClick={handleAddItem}
                      className="bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-700 dark:hover:bg-slate-600 text-sm"
                    >
                      Add
                    </button>
                 </div>
               </div>

               {poItems.length > 0 && (
                 <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                   <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="px-4 py-2 text-slate-600 dark:text-slate-300">Product</th>
                          <th className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">Qty</th>
                          <th className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">Cost</th>
                          <th className="px-4 py-2 text-right text-slate-600 dark:text-slate-300">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {poItems.map((item, idx) => (
                           <tr key={idx}>
                             <td className="px-4 py-2 text-slate-800 dark:text-slate-200">{item.productName}</td>
                             <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-400">{item.quantity}</td>
                             <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-400">${item.unitCost.toFixed(2)}</td>
                             <td className="px-4 py-2 text-right font-medium text-slate-800 dark:text-white">${item.totalCost.toFixed(2)}</td>
                           </tr>
                        ))}
                      </tbody>
                   </table>
                 </div>
               )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
              <span className="font-bold text-lg text-slate-800 dark:text-white">Total: ${poItems.reduce((sum, i) => sum + i.totalCost, 0).toFixed(2)}</span>
              <button 
                onClick={handleCreatePO}
                disabled={!supplierId || poItems.length === 0}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View PO Modal */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedPO(null)}></div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl relative z-10 overflow-hidden border dark:border-slate-700">
             <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                <div>
                   <h3 className="font-bold text-lg text-slate-800 dark:text-white">Order #{selectedPO.id ? selectedPO.id.slice(-6).toUpperCase() : '---'}</h3>
                   <p className="text-sm text-slate-500 dark:text-slate-400">{selectedPO.supplierName} • {new Date(selectedPO.createdAt).toLocaleDateString()}</p>
                </div>
                <button onClick={() => setSelectedPO(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X size={20} />
                </button>
             </div>
             
             <div className="p-6">
                <div className="flex items-center justify-between mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
                   <div>
                     <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold mb-1">Status</p>
                     <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedPO.status)}`}>
                        {selectedPO.status === PurchaseOrderStatus.RECEIVED && <Check size={14} />}
                        {selectedPO.status}
                     </span>
                   </div>
                   {selectedPO.status === PurchaseOrderStatus.ORDERED && (
                      <button 
                        onClick={() => { updatePurchaseOrderStatus(selectedPO.id, PurchaseOrderStatus.RECEIVED); setSelectedPO({...selectedPO, status: PurchaseOrderStatus.RECEIVED}); }}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm"
                      >
                        Receive Inventory
                      </button>
                   )}
                </div>

                <table className="w-full text-left text-sm border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Item</th>
                      <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Qty</th>
                      <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Unit Cost</th>
                      <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {selectedPO.items.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{item.productName}</td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">${item.unitCost.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-white">${item.totalCost.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-900/50 font-bold border-t border-slate-200 dark:border-slate-700">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right text-slate-800 dark:text-white">Total</td>
                      <td className="px-4 py-3 text-right text-slate-800 dark:text-white">${selectedPO.totalAmount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};