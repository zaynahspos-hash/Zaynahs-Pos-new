import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Users, Building2, CreditCard, DollarSign, CheckCircle, XCircle, Image as ImageIcon, Trash2, AlertTriangle, Play } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export const SuperDashboard: React.FC = () => {
  const { allTenants, transactions, subscriptionRequests, approveSubscription, rejectSubscription, runRetentionPolicy } = useStore();
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [retentionResults, setRetentionResults] = useState<{ deleted: string[], warned: string[] } | null>(null);

  const totalRevenue = transactions.reduce((sum, t) => t.status === 'SUCCESS' ? sum + t.amount : sum, 0);
  const totalTenants = allTenants.length;
  const pendingTenants = allTenants.filter(t => t.status === 'PENDING').length;
  const activeTenants = allTenants.filter(t => t.status === 'ACTIVE').length;
  const pendingSubscriptions = subscriptionRequests.filter(r => r.status === 'PENDING');

  // Mock data for charts
  const revenueData = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 5000 },
    { name: 'Apr', revenue: 2780 },
    { name: 'May', revenue: 1890 },
    { name: 'Jun', revenue: 2390 },
    { name: 'Jul', revenue: 3490 },
  ];

  const tenantGrowthData = [
    { name: 'Jan', active: 10, pending: 2 },
    { name: 'Feb', active: 15, pending: 3 },
    { name: 'Mar', active: 22, pending: 1 },
    { name: 'Apr', active: 28, pending: 5 },
    { name: 'May', active: 35, pending: 4 },
  ];

  const handleRunRetention = async () => {
      if(confirm("Are you sure you want to run the data retention policy? This will DELETE inactive tenants (6+ months offline) and warn others.")) {
          const res = await runRetentionPolicy();
          setRetentionResults(res);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Super Admin Dashboard</h1>
          <p className="text-slate-500">Platform-wide overview and analytics.</p>
        </div>
        <div className="flex gap-2">
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center">
                 v2.2.0 (Stable)
            </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Platform Revenue" value={`Rs ${totalRevenue.toLocaleString()}`} icon={DollarSign} color="red" />
        <StatCard title="Total Tenants" value={totalTenants.toString()} icon={Building2} color="orange" />
        <StatCard title="Pending Approvals" value={pendingSubscriptions.length.toString()} icon={Users} color="amber" />
        <StatCard title="Active Subscriptions" value={activeTenants.toString()} icon={CreditCard} color="rose" />
      </div>

      {/* System Maintenance / Retention Console */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
         <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-red-50/50">
            <div className="flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={20} />
                <div>
                    <h3 className="font-bold text-slate-800">System Maintenance & Data Retention</h3>
                    <p className="text-xs text-slate-500">Manage inactive users and storage cleanup</p>
                </div>
            </div>
            <button 
                onClick={handleRunRetention}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm text-sm font-medium"
            >
                <Play size={16} /> Run Cleanup Policy
            </button>
         </div>
         <div className="p-6">
            <p className="text-sm text-slate-600 mb-4">
                <strong>Policy:</strong> Tenants inactive for &gt;5 months receive a warning email. Tenants inactive for &gt;6 months or with expired trials (&gt;1 month) are automatically deleted along with all DB records and Cloudinary photos.
            </p>
            {retentionResults && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                    <h4 className="font-semibold text-slate-800 text-sm">Last Run Results:</h4>
                    {retentionResults.deleted.length > 0 ? (
                        <div className="flex items-start gap-2 text-red-600 text-sm">
                            <Trash2 size={16} className="mt-0.5" />
                            <span>Deleted: {retentionResults.deleted.join(', ')} (Cloudinary assets destroyed)</span>
                        </div>
                    ) : <p className="text-sm text-slate-500 italic">No tenants met deletion criteria.</p>}
                    
                    {retentionResults.warned.length > 0 ? (
                        <div className="flex items-start gap-2 text-orange-600 text-sm">
                            <AlertTriangle size={16} className="mt-0.5" />
                            <span>Warning Emails Sent: {retentionResults.warned.join(', ')}</span>
                        </div>
                    ) : <p className="text-sm text-slate-500 italic">No warnings sent.</p>}
                </div>
            )}
         </div>
      </div>

      {/* Subscription Approvals */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Pending Subscription Requests</h3>
         </div>
         {pendingSubscriptions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No pending requests.</div>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                     <tr>
                        <th className="px-6 py-3">Tenant</th>
                        <th className="px-6 py-3">Plan</th>
                        <th className="px-6 py-3">Amount</th>
                        <th className="px-6 py-3">Method</th>
                        <th className="px-6 py-3">Proof</th>
                        <th className="px-6 py-3 text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                     {pendingSubscriptions.map(req => (
                        <tr key={req.id} className="hover:bg-slate-50">
                           <td className="px-6 py-3 font-medium text-slate-800">{req.tenantName}</td>
                           <td className="px-6 py-3">{req.planName}</td>
                           <td className="px-6 py-3 font-bold text-slate-700">Rs {req.amount.toLocaleString()}</td>
                           <td className="px-6 py-3 text-slate-500">{req.paymentMethod}</td>
                           <td className="px-6 py-3">
                              <button 
                                onClick={() => setSelectedProof(req.proofUrl)}
                                className="flex items-center gap-1 text-red-600 hover:underline"
                              >
                                 <ImageIcon size={16}/> View
                              </button>
                           </td>
                           <td className="px-6 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                 <button 
                                   onClick={() => approveSubscription(req.id)}
                                   className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200" title="Approve"
                                 >
                                    <CheckCircle size={18}/>
                                 </button>
                                 <button 
                                   onClick={() => rejectSubscription(req.id)}
                                   className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200" title="Reject"
                                 >
                                    <XCircle size={18}/>
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Revenue Growth</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `${val}`} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#ef4444" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Tenant Acquisition</h3>
          <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tenantGrowthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Legend />
                <Bar dataKey="active" fill="#ef4444" radius={[4, 4, 0, 0]} name="Active Tenants" />
                <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Proof Preview Modal */}
      {selectedProof && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={() => setSelectedProof(null)}>
            <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-lg p-2">
               <button className="absolute -top-4 -right-4 bg-white rounded-full p-2 text-slate-800 shadow-lg" onClick={() => setSelectedProof(null)}>
                  <XCircle size={24}/>
               </button>
               <img src={selectedProof} alt="Payment Proof" className="max-w-full max-h-[85vh] rounded" />
            </div>
         </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string, icon: React.ElementType, color: string }> = ({ title, value, icon: Icon, color }) => {
  const colorClasses: Record<string, string> = {
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${colorClasses[color] || 'bg-red-50 text-red-600'}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};