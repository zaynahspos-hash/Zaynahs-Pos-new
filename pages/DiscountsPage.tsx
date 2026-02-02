
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Discount } from '../types';
import { Ticket, Plus, Trash2, Tag, Percent, X, ToggleLeft, ToggleRight } from 'lucide-react';

export const DiscountsPage: React.FC = () => {
  const { discounts, addDiscount, deleteDiscount } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Discount>>({
    name: '',
    code: '',
    type: 'PERCENT',
    value: 0,
    active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDiscount(formData);
    setIsModalOpen(false);
    setFormData({ name: '', code: '', type: 'PERCENT', value: 0, active: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Discount Rules</h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Manage coupons, sales, and automatic discounts.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Add Discount</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {discounts.length === 0 ? (
           <div className="col-span-full text-center py-12 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed transition-colors">
             <Ticket size={48} className="mx-auto mb-3 opacity-20" />
             <p>No discount rules created yet.</p>
           </div>
        ) : (
          discounts.map((discount) => (
            <div key={discount.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-all duration-300 relative overflow-hidden">
              <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase rounded-bl-lg ${discount.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                  {discount.active ? 'Active' : 'Inactive'}
              </div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2.5 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <Tag size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{discount.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{discount.code || 'Automatic'}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-end justify-between">
                 <div>
                    <span className="text-3xl font-bold text-slate-800 dark:text-white">
                        {discount.type === 'FIXED' ? '$' : ''}{discount.value}{discount.type === 'PERCENT' ? '%' : ''}
                    </span>
                    <span className="text-sm text-slate-500 ml-1">OFF</span>
                 </div>
                 <button 
                  onClick={() => { if(confirm('Delete discount rule?')) deleteDiscount(discount.id); }}
                  className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Discount Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden border dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Create Discount</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Discount Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g. Summer Sale"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Coupon Code (Optional)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                  placeholder="e.g. SUMMER20"
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                  <select 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as any})}
                  >
                      <option value="PERCENT">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Value</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={formData.value}
                    onChange={e => setFormData({...formData, value: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                 <button 
                   type="button" 
                   onClick={() => setFormData(prev => ({ ...prev, active: !prev.active }))}
                   className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.active ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-600'}`}
                 >
                   <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.active ? 'translate-x-6' : 'translate-x-1'}`} />
                 </button>
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active Status</span>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm">
                  Create Discount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
