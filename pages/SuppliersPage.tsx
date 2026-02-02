import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Truck, Plus, Trash2, Mail, Phone, MapPin, X } from 'lucide-react';
import { Supplier } from '../types';

export const SuppliersPage: React.FC = () => {
  const { suppliers, addSupplier, deleteSupplier } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addSupplier(formData);
    setIsModalOpen(false);
    setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Suppliers</h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Manage your product suppliers and vendors.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Add Supplier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.length === 0 ? (
           <div className="col-span-full text-center py-12 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed transition-colors">
             <Truck size={48} className="mx-auto mb-3 opacity-20" />
             <p>No suppliers added yet.</p>
           </div>
        ) : (
          suppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 p-2.5 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{supplier.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{supplier.contactPerson}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { if(confirm('Delete supplier?')) deleteSupplier(supplier.id); }}
                  className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {supplier.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" />
                    <a href={`mailto:${supplier.email}`} className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline">{supplier.email}</a>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-slate-400 mt-0.5" />
                    <span>{supplier.address}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden border dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Add New Supplier</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact Person</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.contactPerson}
                  onChange={e => setFormData({...formData, contactPerson: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input 
                    type="tel" 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                <textarea 
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                ></textarea>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm">
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};