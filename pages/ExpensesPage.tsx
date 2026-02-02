import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Expense } from '../types';
import { Receipt, Plus, Trash2, Calendar, DollarSign, X, Filter } from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const { expenses, addExpense, deleteExpense } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Expense>>({
    description: '',
    category: 'General',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const categories = ['General', 'Rent', 'Utilities', 'Payroll', 'Marketing', 'Inventory', 'Maintenance'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addExpense({
      ...formData,
      date: new Date(formData.date!).toISOString()
    });
    setIsModalOpen(false);
    setFormData({ description: '', category: 'General', amount: 0, date: new Date().toISOString().split('T')[0] });
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Expenses</h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Track company spending and operational costs.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Record Expense</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                  <DollarSign size={24} />
               </div>
               <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Expenses</p>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">${totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
               </div>
            </div>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap hidden sm:table-cell">Date</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">Description</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap hidden md:table-cell">Category</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">Amount</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800">
                    No expenses recorded.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap hidden sm:table-cell">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-slate-800 dark:text-slate-200">
                      {expense.description}
                      <div className="flex gap-2 mt-1 sm:hidden">
                         <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 uppercase">{expense.category}</span>
                         <span className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(expense.date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-slate-800 dark:text-white whitespace-nowrap">
                      ${expense.amount.toFixed(2)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                      <button 
                        onClick={() => deleteExpense(expense.id)}
                        className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden mx-4 border dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Record Expense</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="e.g. Office Supplies"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount ($)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm">
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};