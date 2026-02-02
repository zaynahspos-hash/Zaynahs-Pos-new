import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Order, OrderStatus } from '../types';
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, Package, Printer, Calendar, ArrowLeft, ArrowRight, RotateCcw, AlertTriangle } from 'lucide-react';
import { printReceipt } from '../components/pos/Receipt';
import { PinPadModal } from '../components/PinPadModal';

export const OrdersPage: React.FC = () => {
  const { orders, updateOrderStatus, currentTenant, settings, user: currentUser, verifyUserPin } = useStore();
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Date Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Return Flow States
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isReturnReasonModalOpen, setIsReturnReasonModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [orderToReturn, setOrderToReturn] = useState<Order | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'ALL' || order.status === filterStatus;
    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (order.id && order.id.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(order.createdAt) >= new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59); // End of day
      matchesDate = matchesDate && new Date(order.createdAt) <= end;
    }

    return matchesStatus && matchesSearch && matchesDate;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED: return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300';
      case OrderStatus.PROCESSING: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case OrderStatus.RETURNED: return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const handlePrintInvoice = (order: Order) => {
    if (currentTenant) {
       // Passing true for 'isReprint' flag
       printReceipt(order, currentTenant, settings, true);
    }
  };

  // --- Return Logic ---

  const initiateReturn = (order: Order) => {
      setOrderToReturn(order);
      // Check if PIN is required
      // We check two things: Global 'requireCashier' setting (as per prompt) OR User-specific 'pinRequired'
      // To satisfy "if enabled from setting", we check settings.requireCashier.
      // Additionally, we respect the user's specific security config.
      const requiresPin = settings?.requireCashier || currentUser?.pinRequired !== false;

      if (requiresPin) {
          setIsPinModalOpen(true);
      } else {
          // If no PIN required, go straight to reason
          setIsReturnReasonModalOpen(true);
      }
  };

  const handlePinSuccess = async (pin: string) => {
      const isValid = await verifyUserPin(pin);
      if (isValid) {
          setIsPinModalOpen(false);
          setIsReturnReasonModalOpen(true);
      } else {
          alert("Invalid PIN. Access Denied.");
      }
  };

  const confirmReturn = async () => {
      if (orderToReturn && returnReason.trim()) {
          await updateOrderStatus(orderToReturn.id, OrderStatus.RETURNED, {
              returnReason: returnReason,
              returnedBy: currentUser?.name || 'Unknown Staff'
          });
          
          setIsReturnReasonModalOpen(false);
          setReturnReason('');
          setOrderToReturn(null);
          setSelectedOrder(null); // Close detail view
          alert("Order processed as returned.");
      } else {
          alert("Please enter a reason for the return.");
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Sales History</h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">View and manage past transactions.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col xl:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by ID or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
               <input 
                 type="date" 
                 value={startDate} 
                 onChange={e => setStartDate(e.target.value)}
                 className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-emerald-500 focus:border-emerald-500"
               />
               <span className="text-slate-400">-</span>
               <input 
                 type="date" 
                 value={endDate} 
                 onChange={e => setEndDate(e.target.value)}
                 className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-emerald-500 focus:border-emerald-500"
               />
            </div>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {['ALL', 'COMPLETED', 'PROCESSING', 'PENDING', 'CANCELLED', 'RETURNED'].map((status) => (
               <button
                  key={status}
                  onClick={() => setFilterStatus(status as any)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    filterStatus === status 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                  }`}
               >
                 {status.charAt(0) + status.slice(1).toLowerCase()}
               </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">Order ID</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Customer</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Date</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Total</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">Status</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No sales found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr key={order.id || Math.random()} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-mono font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap hidden sm:table-cell">
                      #{order.id ? order.id.slice(-6).toUpperCase() : '---'}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-slate-800 dark:text-slate-200 font-medium">
                      {order.customerName}
                      <div className="sm:hidden mt-1">
                         <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase ${getStatusColor(order.status)}`}>
                           {order.status}
                         </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap hidden md:table-cell">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-bold text-slate-800 dark:text-white">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                       <button 
                         onClick={() => setSelectedOrder(order)}
                         className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 text-sm font-medium"
                       >
                         View
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
             <button 
               onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
               disabled={currentPage === 1}
               className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50"
             >
               <ArrowLeft size={16} />
             </button>
             <span className="text-sm text-slate-600 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
             <button 
               onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
               disabled={currentPage === totalPages}
               className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50"
             >
               <ArrowRight size={16} />
             </button>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
             <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setSelectedOrder(null)}>
              <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full mx-4 sm:mx-auto">
               
               <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                 <div>
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white">Order Details</h3>
                   <p className="text-sm text-slate-500 dark:text-slate-400">#{selectedOrder.id || '---'}</p>
                 </div>
                 <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                   <XCircle size={24} />
                 </button>
               </div>

               <div className="p-6">
                 <div className="flex flex-col sm:flex-row justify-between mb-8 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Customer</p>
                      <p className="font-medium text-slate-800 dark:text-white">{selectedOrder.customerName}</p>
                      {selectedOrder.salespersonName && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Staff: {selectedOrder.salespersonName}</p>}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Date</p>
                      <p className="font-medium text-slate-800 dark:text-white">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                 </div>

                 {/* Return Information Section */}
                 {selectedOrder.status === OrderStatus.RETURNED && (
                     <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 rounded-lg p-4">
                         <h4 className="text-sm font-bold text-red-800 dark:text-red-300 flex items-center gap-2 mb-2">
                             <RotateCcw size={16} /> Return Information
                         </h4>
                         <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                             <p><strong>Reason:</strong> {selectedOrder.returnReason || 'No reason provided.'}</p>
                             <p><strong>Processed By:</strong> {selectedOrder.returnedBy || 'Unknown'}</p>
                             {selectedOrder.returnedAt && <p><strong>Time:</strong> {new Date(selectedOrder.returnedAt).toLocaleString()}</p>}
                         </div>
                     </div>
                 )}

                 <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden mb-6">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                         <tr>
                           <th className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Item</th>
                           <th className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">Qty</th>
                           <th className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">Price</th>
                           <th className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">Total</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                         {selectedOrder.items.map(item => (
                           <tr key={item.id} className="dark:text-slate-300">
                             <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-200">{item.productName}</td>
                             <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 text-right">{item.quantity}</td>
                             <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 text-right">${item.priceAtTime.toFixed(2)}</td>
                             <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-white text-right">${(item.priceAtTime * item.quantity).toFixed(2)}</td>
                           </tr>
                         ))}
                       </tbody>
                       <tfoot className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
                         {selectedOrder.discountAmount && selectedOrder.discountAmount > 0 && (
                           <tr>
                             <td colSpan={3} className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 text-right">Discount {selectedOrder.discountType === 'PERCENT' ? '(%)' : '($)'}</td>
                             <td className="px-4 py-2 text-sm text-red-500 dark:text-red-400 text-right">-${selectedOrder.discountAmount.toFixed(2)}</td>
                           </tr>
                         )}
                         <tr>
                           <td colSpan={3} className="px-4 py-3 text-sm font-bold text-slate-800 dark:text-white text-right">Total Amount</td>
                           <td className="px-4 py-3 text-sm font-bold text-slate-800 dark:text-white text-right">${selectedOrder.totalAmount.toFixed(2)}</td>
                         </tr>
                       </tfoot>
                    </table>
                 </div>

                 <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700 gap-4">
                    <button
                      onClick={() => handlePrintInvoice(selectedOrder)}
                      className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors order-2 sm:order-1"
                    >
                      <Printer size={18} />
                      <span className="text-sm font-medium">Reprint Receipt</span>
                    </button>
                    <div className="flex flex-wrap gap-3 justify-end w-full sm:w-auto order-1 sm:order-2">
                      {selectedOrder.status === OrderStatus.PENDING && (
                        <button 
                          onClick={() => { updateOrderStatus(selectedOrder.id, OrderStatus.PROCESSING); setSelectedOrder(null); }}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex-1 sm:flex-none"
                        >
                          Mark as Processing
                        </button>
                      )}
                      {selectedOrder.status === OrderStatus.PROCESSING && (
                        <button 
                          onClick={() => { updateOrderStatus(selectedOrder.id, OrderStatus.COMPLETED); setSelectedOrder(null); }}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex-1 sm:flex-none"
                        >
                          Mark as Completed
                        </button>
                      )}
                      {selectedOrder.status === OrderStatus.COMPLETED && (
                         <button 
                          onClick={() => initiateReturn(selectedOrder)}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-400 rounded-lg text-sm font-medium flex-1 sm:flex-none flex items-center gap-2 justify-center border border-slate-200 dark:border-slate-600"
                        >
                          <RotateCcw size={16}/> Return
                        </button>
                      )}
                      {selectedOrder.status !== OrderStatus.CANCELLED && selectedOrder.status !== OrderStatus.COMPLETED && selectedOrder.status !== OrderStatus.RETURNED && (
                        <button 
                          onClick={() => { updateOrderStatus(selectedOrder.id, OrderStatus.CANCELLED); setSelectedOrder(null); }}
                          className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium flex-1 sm:flex-none"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Security PIN Modal */}
      <PinPadModal 
        isOpen={isPinModalOpen} 
        onClose={() => setIsPinModalOpen(false)} 
        onSuccess={handlePinSuccess}
        title="Manager Approval Required"
        description="Enter PIN to authorize this return."
      />

      {/* Return Reason Modal */}
      {isReturnReasonModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsReturnReasonModalOpen(false)}></div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 relative z-10 w-full max-w-sm shadow-2xl animate-in zoom-in-95 border dark:border-slate-700">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                          <RotateCcw size={20} className="text-red-500"/> Confirm Return
                      </h3>
                      <button onClick={() => setIsReturnReasonModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                          <XCircle size={20}/>
                      </button>
                  </div>
                  
                  <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-lg text-xs flex gap-2">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <p>Warning: This action will refund the total amount and restore stock. This cannot be undone.</p>
                  </div>

                  <div className="space-y-3">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Reason for Return <span className="text-red-500">*</span>
                      </label>
                      <textarea 
                          className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
                          rows={3}
                          placeholder="e.g. Defective item, Customer changed mind..."
                          value={returnReason}
                          onChange={(e) => setReturnReason(e.target.value)}
                          autoFocus
                      ></textarea>
                  </div>

                  <div className="mt-6 flex gap-3">
                      <button 
                          onClick={() => setIsReturnReasonModalOpen(false)}
                          className="flex-1 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={confirmReturn}
                          disabled={!returnReason.trim()}
                          className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                      >
                          Process Return
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};