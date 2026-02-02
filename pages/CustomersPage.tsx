import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Customer } from '../types';
import { Search, Plus, User, Mail, Phone, MapPin, Calendar, Edit2, Trash2, X, ShoppingBag } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const { customers, orders, addCustomer, updateCustomer, deleteCustomer } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '', email: '', phone: '', address: ''
  });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const customerOrders = viewingCustomer ? orders.filter(o => o.customerId === viewingCustomer.id) : [];

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData(customer);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phone: '', address: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, formData);
    } else {
      await addCustomer(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Customer Directory</h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Manage customer relationships and history.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Customer List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">Customer</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap hidden md:table-cell">Contact</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap hidden lg:table-cell">Last Order</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">Total Spent</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                            <User size={20} />
                         </div>
                         <div className="min-w-0">
                           <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[120px] sm:max-w-xs">{customer.name}</p>
                           <p className="text-xs text-slate-500 dark:text-slate-400 md:hidden truncate max-w-[120px]">{customer.email}</p>
                           <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block lg:hidden">{new Date(customer.createdAt).toLocaleDateString()}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-slate-600 dark:text-slate-300 hidden md:table-cell">
                       <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5"><Mail size={12}/> {customer.email || 'N/A'}</span>
                          {customer.phone && <span className="flex items-center gap-1.5"><Phone size={12}/> {customer.phone}</span>}
                       </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap hidden lg:table-cell">
                      {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-slate-800 dark:text-white whitespace-nowrap">
                      ${customer.totalSpent.toFixed(2)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right whitespace-nowrap">
                       <div className="flex justify-end gap-1 sm:gap-2">
                          <button 
                             onClick={() => setViewingCustomer(customer)}
                             className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded"
                             title="View History"
                          >
                            <ShoppingBag size={16} />
                          </button>
                          <button 
                             onClick={() => handleEdit(customer)}
                             className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                             onClick={() => { if(confirm('Delete customer?')) deleteCustomer(customer.id); }}
                             className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden mx-4 border dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
               <h3 className="font-bold text-lg text-slate-800 dark:text-white">{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                 <input type="text" required className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                   value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                 <input type="email" required className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                   value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                 <input type="tel" className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                   value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                 <textarea rows={2} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                   value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
               </div>
               <button type="submit" className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 mt-2">
                 Save Customer
               </button>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {viewingCustomer && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewingCustomer(null)}></div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] mx-4 border dark:border-slate-700">
               <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">{viewingCustomer.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{viewingCustomer.email}</p>
                  </div>
                  <button onClick={() => setViewingCustomer(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X size={20}/></button>
               </div>
               <div className="p-6 overflow-y-auto">
                 <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2"><ShoppingBag size={18}/> Order History</h4>
                 {customerOrders.length === 0 ? (
                   <div className="text-center py-8 text-slate-400 dark:text-slate-500 border border-dashed rounded-lg border-slate-200 dark:border-slate-700">No orders found.</div>
                 ) : (
                   <div className="space-y-4">
                      {customerOrders.map(order => (
                         <div key={order.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                               <div>
                                  <span className="font-mono text-sm text-slate-500 dark:text-slate-400">#{order.id ? order.id.slice(-6).toUpperCase() : '---'}</span>
                                  <span className="mx-2 text-slate-300 dark:text-slate-600">|</span>
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{new Date(order.createdAt).toLocaleDateString()}</span>
                               </div>
                               <span className="font-bold text-slate-800 dark:text-white">${order.totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                               <span className="text-xs text-slate-500 dark:text-slate-400">{order.items.length} items</span>
                               <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                               }`}>{order.status}</span>
                            </div>
                         </div>
                      ))}
                   </div>
                 )}
               </div>
            </div>
         </div>
      )}
    </div>
  );
};