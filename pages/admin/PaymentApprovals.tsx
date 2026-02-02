import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { CheckCircle, XCircle, Image as ImageIcon, Filter, Search, Clock, Check, X, CreditCard, Calendar } from 'lucide-react';

export const PaymentApprovals: React.FC = () => {
  const { subscriptionRequests, approveSubscription, rejectSubscription } = useStore();
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRequests = subscriptionRequests.filter(req => {
    const matchesStatus = statusFilter === 'ALL' ? true : req.status === statusFilter;
    const matchesSearch = 
        req.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        req.planName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'APPROVED': return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 w-fit"><Check size={12}/> Approved</span>;
          case 'REJECTED': return <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded border border-red-200 flex items-center gap-1 w-fit"><X size={12}/> Rejected</span>;
          default: return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1 w-fit"><Clock size={12}/> Pending</span>;
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Payment Approvals</h1>
          <p className="text-slate-500 dark:text-slate-400">Review and manage manual subscription payment proofs.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-slate-900/50">
           <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by Tenant or Plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
              />
           </div>
           
           <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        statusFilter === status 
                        ? 'bg-red-600 text-white shadow-sm' 
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                    }`}
                  >
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
              ))}
           </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tenant</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plan Details</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Payment Proof</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                 {filteredRequests.length === 0 ? (
                    <tr>
                       <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                          No {statusFilter.toLowerCase()} requests found.
                       </td>
                    </tr>
                 ) : (
                    filteredRequests.map(req => (
                       <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-6 py-4">
                             <div className="font-bold text-slate-800 dark:text-white">{req.tenantName}</div>
                             <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Clock size={10} /> {new Date(req.createdAt).toLocaleDateString()}
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="text-sm text-slate-800 dark:text-slate-200 font-medium">{req.planName}</div>
                             <div className="text-xs text-slate-500 dark:text-slate-400">{req.paymentMethod}</div>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                             Rs {req.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                             <button 
                               onClick={() => setSelectedProof(req.proofUrl)}
                               className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-red-600 dark:text-red-400 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium border border-slate-200 dark:border-slate-600"
                             >
                                <ImageIcon size={16} /> View Image
                             </button>
                          </td>
                          <td className="px-6 py-4">
                             {getStatusBadge(req.status)}
                          </td>
                          <td className="px-6 py-4 text-right">
                             {req.status === 'PENDING' && (
                                <div className="flex items-center justify-end gap-2">
                                   <button 
                                     onClick={() => approveSubscription(req.id)}
                                     className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800" 
                                     title="Approve"
                                   >
                                      <CheckCircle size={20}/>
                                   </button>
                                   <button 
                                     onClick={() => rejectSubscription(req.id)}
                                     className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800" 
                                     title="Reject"
                                   >
                                      <XCircle size={20}/>
                                   </button>
                                </div>
                             )}
                          </td>
                       </tr>
                    ))
                 )}
              </tbody>
           </table>
        </div>
      </div>

      {/* Proof Viewer Modal */}
      {selectedProof && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={() => setSelectedProof(null)}>
            <div className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700 shadow-2xl">
               <button className="absolute -top-4 -right-4 bg-white dark:bg-slate-700 rounded-full p-2 text-slate-800 dark:text-white shadow-lg border border-slate-200 dark:border-slate-600" onClick={() => setSelectedProof(null)}>
                  <X size={24}/>
               </button>
               <img src={selectedProof} alt="Payment Proof" className="max-w-full max-h-[85vh] rounded" />
            </div>
         </div>
      )}
    </div>
  );
};