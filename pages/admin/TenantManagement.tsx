import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { TenantStatus, TenantDetails, Role, User } from '../../types';
import { Check, X, Search, Ban, Building2, MapPin, Phone, Mail, Package, Users, DollarSign, Calendar, Clock, CreditCard, ChevronRight, Plus } from 'lucide-react';

export const TenantManagement: React.FC = () => {
  const { allTenants, updateTenantStatus, fetchTenantDetails, extendTenantSubscription } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [details, setDetails] = useState<TenantDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Extension State
  const [extendMonths, setExtendMonths] = useState(1);
  const [isExtending, setIsExtending] = useState(false);

  // Tabs for Details Modal
  const [activeTab, setActiveTab] = useState<'info' | 'staff' | 'subscription'>('info');

  const filteredTenants = allTenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.phone?.includes(searchTerm)
  );

  const handleViewDetails = async (id: string) => {
      setSelectedTenantId(id);
      setIsLoadingDetails(true);
      const data = await fetchTenantDetails(id);
      setDetails(data);
      setIsLoadingDetails(false);
      setActiveTab('info');
  };

  const handleCloseDetails = () => {
      setSelectedTenantId(null);
      setDetails(null);
  };

  const handleExtension = async () => {
      if (selectedTenantId && extendMonths > 0) {
          if (confirm(`Are you sure you want to extend ${details?.tenant.name}'s plan by ${extendMonths} months?`)) {
              setIsExtending(true);
              await extendTenantSubscription(selectedTenantId, extendMonths);
              // Refresh details to show new date
              const data = await fetchTenantDetails(selectedTenantId);
              setDetails(data);
              setIsExtending(false);
              alert("Subscription extended successfully.");
          }
      }
  };

  // Group staff by role for better visibility
  const groupedStaff = details?.staff.reduce((acc, user) => {
      const role = user.role;
      if (!acc[role]) acc[role] = [];
      acc[role].push(user);
      return acc;
  }, {} as Record<string, User[]>);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Shop Management</h1>
          <p className="text-slate-500 dark:text-slate-400">View all shops, detailed profiles, staff lists, and manage subscriptions.</p>
        </div>
      </div>

      {/* Main List Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by shop name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Shop</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 dark:bg-slate-700 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                        {tenant.logoUrl ? <img src={tenant.logoUrl} className="w-full h-full object-contain" alt="Logo"/> : <span className="font-bold text-slate-500">{tenant.name.substring(0, 1)}</span>}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{tenant.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Created: {new Date(tenant.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm hidden md:table-cell">
                     <div className="flex flex-col gap-1 text-slate-600 dark:text-slate-300 text-xs">
                        <span className="flex items-center gap-1.5"><Mail size={12}/> {tenant.email || '-'}</span>
                        <span className="flex items-center gap-1.5"><Phone size={12}/> {tenant.phone || '-'}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                      {tenant.subscriptionTier}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                     <StatusBadge status={tenant.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                        onClick={() => handleViewDetails(tenant.id)}
                        className="flex items-center gap-1 ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
                    >
                        Details <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Detail Modal --- */}
      {selectedTenantId && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseDetails}></div>
              <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
                  
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur z-10">
                      <div className="flex items-center gap-3">
                          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                              {isLoadingDetails ? 'Loading...' : details?.tenant.name}
                          </h2>
                          {!isLoadingDetails && details && <StatusBadge status={details.tenant.status} />}
                      </div>
                      <button onClick={handleCloseDetails} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                          <X size={24} />
                      </button>
                  </div>

                  {isLoadingDetails || !details ? (
                      <div className="flex-1 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                      </div>
                  ) : (
                      <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 dark:bg-slate-900">
                          {/* Tabs Navigation */}
                          <div className="flex border-b border-slate-200 dark:border-slate-700 px-6 bg-white dark:bg-slate-800 sticky top-0 z-10">
                              <TabButton label="Shop Info & Stats" active={activeTab === 'info'} onClick={() => setActiveTab('info')} icon={Building2} />
                              <TabButton label="Staff Directory" active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} icon={Users} count={details.stats.totalStaff} />
                              <TabButton label="Plan & Subscription" active={activeTab === 'subscription'} onClick={() => setActiveTab('subscription')} icon={CreditCard} />
                          </div>

                          <div className="flex-1 overflow-y-auto p-6">
                              
                              {/* --- INFO TAB --- */}
                              {activeTab === 'info' && (
                                  <div className="space-y-6">
                                      {/* Profile Card */}
                                      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-6">
                                          <div className="w-24 h-24 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600 overflow-hidden">
                                              {details.tenant.logoUrl ? <img src={details.tenant.logoUrl} className="w-full h-full object-contain"/> : <Building2 size={40} className="text-slate-300"/>}
                                          </div>
                                          <div className="flex-1 space-y-4">
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                  <div>
                                                      <label className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Contact Email</label>
                                                      <p className="text-slate-800 dark:text-white font-medium flex items-center gap-2"><Mail size={14}/> {details.tenant.email || 'N/A'}</p>
                                                  </div>
                                                  <div>
                                                      <label className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Phone Number</label>
                                                      <p className="text-slate-800 dark:text-white font-medium flex items-center gap-2"><Phone size={14}/> {details.tenant.phone || 'N/A'}</p>
                                                  </div>
                                                  <div className="md:col-span-2">
                                                      <label className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Physical Address</label>
                                                      <p className="text-slate-800 dark:text-white font-medium flex items-center gap-2"><MapPin size={14}/> {details.tenant.address || 'N/A'}</p>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>

                                      {/* Key Stats */}
                                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mt-2">Live Performance Stats</h3>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                          <StatBox title="Total Products" value={details.stats.totalProducts.toString()} icon={Package} color="red" />
                                          <StatBox title="Lifetime Revenue" value={`Rs ${details.stats.lifetimeRevenue.toLocaleString()}`} icon={DollarSign} color="red" />
                                          <StatBox title="Total Customers" value={details.stats.totalCustomers.toString()} icon={Users} color="red" />
                                          <StatBox title="Total Orders" value={details.stats.totalOrders.toString()} icon={Calendar} color="red" />
                                      </div>

                                      {/* Actions */}
                                      <div className="flex gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                          {details.tenant.status === 'ACTIVE' ? (
                                              <button 
                                                  onClick={() => updateTenantStatus(details.tenant.id, TenantStatus.SUSPENDED)}
                                                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-medium transition-colors w-full justify-center md:w-auto"
                                              >
                                                  <Ban size={18} /> Suspend Shop Access
                                              </button>
                                          ) : (
                                              <button 
                                                  onClick={() => updateTenantStatus(details.tenant.id, TenantStatus.ACTIVE)}
                                                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 font-medium transition-colors w-full justify-center md:w-auto"
                                              >
                                                  <Check size={18} /> Reactivate Shop Access
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              )}

                              {/* --- STAFF TAB --- */}
                              {activeTab === 'staff' && (
                                  <div className="space-y-6">
                                      {Object.entries((groupedStaff || {}) as Record<string, User[]>).map(([role, users]) => (
                                          <div key={role} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                              <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                                                  <h3 className="font-bold text-slate-800 dark:text-white capitalize">{role.replace('_', ' ')}s</h3>
                                                  <span className="text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{users.length}</span>
                                              </div>
                                              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                                  {users.map(user => (
                                                      <div key={user.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-600">
                                                              {user.name.charAt(0)}
                                                          </div>
                                                          <div className="flex-1">
                                                              <h4 className="text-sm font-bold text-slate-800 dark:text-white">{user.name}</h4>
                                                              <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                                                          </div>
                                                          <div className="text-right text-xs text-slate-400">
                                                              Joined: {new Date(user.createdAt).toLocaleDateString()}
                                                          </div>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                      ))}
                                      {details.staff.length === 0 && (
                                          <div className="p-8 text-center text-slate-500">No staff members found for this shop.</div>
                                      )}
                                  </div>
                              )}

                              {/* --- SUBSCRIPTION TAB --- */}
                              {activeTab === 'subscription' && (
                                  <div className="space-y-6">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          {/* Current Plan Status */}
                                          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                              <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 dark:bg-red-900/20 rounded-bl-full -mr-8 -mt-8"></div>
                                              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase mb-4 relative z-10">Current Subscription</h3>
                                              <div className="relative z-10">
                                                  <div className="text-3xl font-extrabold text-red-600 dark:text-red-400 mb-2">{details.tenant.subscriptionTier.replace('_', ' ')}</div>
                                                  <div className="flex items-center gap-2 text-sm mb-4">
                                                      <span className="text-slate-600 dark:text-slate-300">Status:</span>
                                                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${details.tenant.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                          {details.tenant.subscriptionStatus}
                                                      </span>
                                                  </div>
                                                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
                                                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                                                          <Clock size={16} className="text-red-500" />
                                                          <span>Expires on: <strong>{details.tenant.subscriptionExpiry ? new Date(details.tenant.subscriptionExpiry).toLocaleDateString() : 'Never'}</strong></span>
                                                      </div>
                                                  </div>
                                              </div>
                                          </div>

                                          {/* Manual Extension Control */}
                                          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase mb-4">Manual Extension</h3>
                                              <div className="space-y-4">
                                                  <div>
                                                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Add Time (Months)</label>
                                                      <div className="flex items-center gap-3">
                                                          <button onClick={() => setExtendMonths(Math.max(1, extendMonths - 1))} className="p-2 border rounded-lg hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700 dark:text-white transition-colors"><div className="w-4 h-0.5 bg-current"></div></button> 
                                                          <input 
                                                              type="number" 
                                                              min="1" 
                                                              value={extendMonths} 
                                                              onChange={(e) => setExtendMonths(parseInt(e.target.value))}
                                                              className="w-20 text-center p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white font-bold"
                                                          />
                                                          <button onClick={() => setExtendMonths(extendMonths + 1)} className="p-2 border rounded-lg hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700 dark:text-white transition-colors"><Plus size={16} /></button>
                                                      </div>
                                                  </div>
                                                  <button 
                                                      onClick={handleExtension}
                                                      disabled={isExtending}
                                                      className="w-full bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                                  >
                                                      {isExtending ? 'Processing...' : 'Confirm Extension'}
                                                  </button>
                                                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                      This will add months to the existing expiry date and immediately reactivate the account if it is expired/suspended.
                                                  </p>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              )}

                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

const TabButton: React.FC<{ label: string, active: boolean, onClick: () => void, icon: React.ElementType, count?: number }> = ({ label, active, onClick, icon: Icon, count }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-4 border-b-2 font-medium text-sm transition-colors ${active ? 'border-red-600 text-red-600 dark:text-red-400 dark:border-red-400 bg-red-50/50 dark:bg-red-900/10' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
    >
        <Icon size={18} />
        {label}
        {count !== undefined && <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs font-bold">{count}</span>}
    </button>
);

const StatusBadge: React.FC<{ status: TenantStatus }> = ({ status }) => {
  const styles = {
    [TenantStatus.ACTIVE]: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    [TenantStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
    [TenantStatus.SUSPENDED]: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status}
    </span>
  );
};

const StatBox: React.FC<{ title: string, value: string, icon: React.ElementType, color: string }> = ({ title, value, icon: Icon, color }) => {
    // Red theme override for StatBox
    const colorClasses = 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400';
  
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">{title}</p>
            <div className={`p-1.5 rounded-lg ${colorClasses}`}>
                <Icon size={16} />
            </div>
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">{value}</h3>
      </div>
    );
};