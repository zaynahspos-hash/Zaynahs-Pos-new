import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Role, Permission } from '../types';
import { Plus, Trash2, Mail, Shield, User as UserIcon, X, Edit2, Check, KeyRound, LogOut, AlertTriangle, Settings2, Lock } from 'lucide-react';
import { PinPadModal } from '../components/PinPadModal';

const ALL_PERMISSIONS: { key: Permission, label: string }[] = [
  { key: 'VIEW_DASHBOARD', label: 'View Dashboard Stats' },
  { key: 'POS_ACCESS', label: 'Access POS Terminal' },
  { key: 'MANAGE_PRODUCTS', label: 'Manage Products & Inventory' },
  { key: 'MANAGE_ORDERS', label: 'Manage Orders & Returns' },
  { key: 'MANAGE_CUSTOMERS', label: 'Manage Customers (CRM)' },
  { key: 'MANAGE_SUPPLIERS', label: 'Manage Suppliers' },
  { key: 'MANAGE_EXPENSES', label: 'Manage Expenses' },
  { key: 'VIEW_REPORTS', label: 'View Financial Reports' },
  { key: 'MANAGE_USERS', label: 'Manage Staff Members' },
  { key: 'MANAGE_SETTINGS', label: 'Manage Store Settings' },
];

const ROLE_TEMPLATES: Record<string, Permission[]> = {
  [Role.ADMIN]: ALL_PERMISSIONS.map(p => p.key),
  [Role.MANAGER]: ['VIEW_DASHBOARD', 'MANAGE_PRODUCTS', 'MANAGE_ORDERS', 'MANAGE_SUPPLIERS', 'MANAGE_EXPENSES', 'VIEW_REPORTS', 'MANAGE_CUSTOMERS', 'MANAGE_USERS'],
  [Role.CASHIER]: ['POS_ACCESS', 'MANAGE_ORDERS'],
  [Role.SALESMAN]: ['POS_ACCESS', 'MANAGE_CUSTOMERS', 'MANAGE_ORDERS'],
  [Role.USER]: []
};

// Roles available for assignment by a Tenant Admin
const ASSIGNABLE_ROLES = [Role.CASHIER, Role.SALESMAN, Role.MANAGER, Role.ADMIN, Role.USER];

export const UsersPage: React.FC = () => {
  const { users, inviteUser, removeUser, updateUserRole, updateUserPin, updateUserPassword, leaveCurrentTenant, user: currentUser } = useStore();
  
  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<{ name: string; email: string; password: string; role: Role }>({ name: '', email: '', password: '', role: Role.CASHIER });
  const [passwordForm, setPasswordForm] = useState({ userId: '', newPassword: '' });
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [editingUser, setEditingUser] = useState<{ id: string, role: Role } | null>(null);
  const [selectedUserForPin, setSelectedUserForPin] = useState<string | null>(null);

  // Initialize permissions when role changes in invite form
  useEffect(() => {
    if (isInviteModalOpen && !editingUser) {
       setSelectedPermissions(ROLE_TEMPLATES[formData.role] || []);
    }
  }, [formData.role, isInviteModalOpen]);

  const handleRoleChange = (role: Role) => {
    setFormData(prev => ({ ...prev, role }));
    setSelectedPermissions(ROLE_TEMPLATES[role] || []);
  };

  const togglePermission = (perm: Permission) => {
    setSelectedPermissions(prev => 
      prev.includes(perm) 
        ? prev.filter(p => p !== perm) 
        : [...prev, perm]
    );
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.password) {
        alert("Please provide a password for the new staff member.");
        return;
    }
    await inviteUser({ ...formData, permissions: selectedPermissions });
    setIsInviteModalOpen(false);
    setFormData({ name: '', email: '', password: '', role: Role.CASHIER });
  };

  const handleEditRole = (user: any) => {
    // Prevent editing Super Admin if you are not one
    if (user.role === Role.SUPER_ADMIN && currentUser?.role !== Role.SUPER_ADMIN) {
        alert("You cannot edit a Super Admin.");
        return;
    }

    setEditingUser({ id: user.id, role: user.role });
    setFormData({ name: user.name, email: user.email, password: '', role: user.role });
    setSelectedPermissions(user.permissions || ROLE_TEMPLATES[user.role as Role] || []);
    setIsEditModalOpen(true);
  };

  const handleUpdateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      await updateUserRole(editingUser.id, formData.role, selectedPermissions);
      setIsEditModalOpen(false);
      setEditingUser(null);
    }
  };

  const handleOpenPinModal = (userId: string) => {
      setSelectedUserForPin(userId);
      setPinModalOpen(true);
  };

  const handleSetPin = async (pin: string) => {
      if (selectedUserForPin) {
          await updateUserPin(selectedUserForPin, pin);
          setPinModalOpen(false);
          setSelectedUserForPin(null);
          alert("PIN updated successfully.");
      }
  };

  const handleOpenPasswordModal = (userId: string) => {
      setPasswordForm({ userId, newPassword: '' });
      setIsPasswordModalOpen(true);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!passwordForm.newPassword) return;
      try {
          await updateUserPassword(passwordForm.userId, passwordForm.newPassword);
          setIsPasswordModalOpen(false);
          alert("Password updated successfully.");
      } catch (e) {
          alert("Failed to update password.");
      }
  };

  const handleUnlinkSelf = async () => {
    if (confirm("Are you sure you want to unlink your account from this store? You will lose access immediately.")) {
       await leaveCurrentTenant();
    }
  };

  const roleColors = {
    [Role.SUPER_ADMIN]: 'bg-slate-900 text-white border-slate-700 dark:bg-slate-950 dark:border-slate-800',
    [Role.ADMIN]: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    [Role.MANAGER]: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    [Role.CASHIER]: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    [Role.SALESMAN]: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    [Role.USER]: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
  };

  // Only Admin or Super Admin can manage pins/users
  const canManageUsers = currentUser?.role === Role.ADMIN || currentUser?.role === Role.SUPER_ADMIN;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Store Staff Management</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage permissions, roles, and access for your business.</p>
        </div>
        
        {canManageUsers && (
            <button 
            onClick={() => {
                setFormData({ name: '', email: '', password: '', role: Role.CASHIER });
                setIsInviteModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            >
            <Plus size={18} />
            <span>Add Staff Member</span>
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {users.map((u) => {
            const isSuperUser = u.role === Role.SUPER_ADMIN;
            // If current user is NOT super admin, they shouldn't mess with super admin users in the list
            const canEditThisUser = canManageUsers && !isSuperUser; 

            return (
                <div key={u.id} className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border flex flex-col md:flex-row items-start md:items-center gap-4 transition-colors ${isSuperUser ? 'border-indigo-100 bg-indigo-50/10 dark:border-indigo-900 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                    <img 
                    src={u.avatarUrl} 
                    alt={u.name} 
                    className="w-12 h-12 rounded-full border-2 border-slate-100 dark:border-slate-700"
                    />
                    <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-800 dark:text-white truncate">
                                {u.name}
                                {currentUser?.id === u.id && <span className="ml-2 text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-600">You</span>}
                            </h3>
                            {isSuperUser && (
                                <span title="Super Admin Protected">
                                    <Lock size={12} className="text-amber-500" />
                                </span>
                            )}
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${roleColors[u.role] || roleColors[Role.USER]}`}>
                            <Shield size={10} /> {u.role.replace('_', ' ')}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate mb-2">
                        <Mail size={12} /> {u.email}
                    </p>
                    
                    {/* Permission Tags */}
                    <div className="flex flex-wrap gap-1">
                        {u.permissions?.slice(0, 5).map(p => (
                            <span key={p} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 capitalize">
                            {p.replace('MANAGE_', '').replace('VIEW_', '').replace('_', ' ').toLowerCase()}
                            </span>
                        ))}
                        {(u.permissions?.length || 0) > 5 && (
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                            +{(u.permissions?.length || 0) - 5} more
                            </span>
                        )}
                        {isSuperUser && (
                            <span className="text-[10px] bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 font-medium">
                                Full System Access
                            </span>
                        )}
                    </div>
                    </div>
                    
                    <div className="flex items-center border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 pt-3 md:pt-0 md:pl-4 gap-2 w-full md:w-auto mt-2 md:mt-0 justify-end">
                        {/* PIN & Password Management */}
                        {canEditThisUser && (
                            <>
                                <button 
                                    onClick={() => handleOpenPasswordModal(u.id)}
                                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-900"
                                    title="Reset Password"
                                >
                                    <Lock size={18} />
                                </button>
                                <button 
                                    onClick={() => handleOpenPinModal(u.id)}
                                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors border border-transparent hover:border-orange-100 dark:hover:border-orange-900"
                                    title="Set/Reset PIN"
                                >
                                    <KeyRound size={18} />
                                </button>
                            </>
                        )}

                        {/* Edit & Delete (Cannot edit self here, use profile settings) */}
                        {currentUser?.id !== u.id ? (
                            canEditThisUser && (
                                <>
                                    <button 
                                    onClick={() => handleEditRole(u)}
                                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900"
                                    title="Edit Role & Permissions"
                                    >
                                    <Settings2 size={18} />
                                    </button>
                                    <button 
                                    onClick={() => { if(confirm('Remove this user from the store?')) removeUser(u.id); }}
                                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900"
                                    title="Remove User"
                                    >
                                    <Trash2 size={18} />
                                    </button>
                                </>
                            )
                        ) : (
                            <button 
                                onClick={handleUnlinkSelf}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg text-sm font-medium border border-red-100 dark:border-red-900"
                            >
                                <LogOut size={16} /> Leave Store
                            </button>
                        )}
                    </div>
                </div>
            )
        })}
      </div>

      {/* Invite / Edit Modal */}
      {(isInviteModalOpen || isEditModalOpen) && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setIsInviteModalOpen(false); setIsEditModalOpen(false); }}></div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
               <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">{isEditModalOpen ? 'Edit Permissions' : 'Add Staff Member'}</h3>
                  <button onClick={() => { setIsInviteModalOpen(false); setIsEditModalOpen(false); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <X size={20} />
                  </button>
               </div>
               
               <form onSubmit={isEditModalOpen ? handleUpdateRoleSubmit : handleInviteSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                  {!isEditModalOpen && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="text" required
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                            placeholder="Jane Doe"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address (Login ID)</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="email" required
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                            placeholder="jane@company.com"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="password" required
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                            placeholder="Min. 6 chars"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assign Role</label>
                    <select 
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                      value={formData.role}
                      onChange={e => handleRoleChange(e.target.value as Role)}
                    >
                      {ASSIGNABLE_ROLES.map(role => (
                          <option key={role} value={role}>{role.charAt(0) + role.slice(1).toLowerCase().replace('_', ' ')}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Selecting a role will auto-fill the recommended permissions below.</p>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                     <label className="block text-sm font-bold text-slate-800 dark:text-white mb-3">Granular Permissions</label>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ALL_PERMISSIONS.map(perm => (
                           <label key={perm.key} className="flex items-start gap-2.5 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-colors">
                              <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${selectedPermissions.includes(perm.key) ? 'bg-emerald-600 border-emerald-600' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}>
                                 {selectedPermissions.includes(perm.key) && <Check size={14} className="text-white" />}
                              </div>
                              <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={selectedPermissions.includes(perm.key)}
                                onChange={() => togglePermission(perm.key)}
                              />
                              <span className="text-sm text-slate-600 dark:text-slate-300 leading-tight select-none">{perm.label}</span>
                           </label>
                        ))}
                     </div>
                  </div>
               </form>

               <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <button onClick={isEditModalOpen ? handleUpdateRoleSubmit : handleInviteSubmit} className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm">
                    {isEditModalOpen ? 'Update Permissions' : 'Create Account'}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Password Reset Modal */}
      {isPasswordModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsPasswordModalOpen(false)}></div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">Reset Password</h3>
                  <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <X size={20} />
                  </button>
               </div>
               
               <form onSubmit={handlePasswordReset} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                    <input 
                        type="password" required
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                        value={passwordForm.newPassword}
                        onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        placeholder="Enter new password"
                        autoFocus
                    />
                  </div>
                  <button type="submit" className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700">
                    Update Password
                  </button>
               </form>
            </div>
         </div>
      )}

      {/* Pin Pad Modal for Admin Setting PIN */}
      {pinModalOpen && (
          <PinPadModal 
            isOpen={pinModalOpen}
            onClose={() => setPinModalOpen(false)}
            onSuccess={handleSetPin}
            title="Set Staff PIN"
            description="Create a new 4-digit PIN for this user."
          />
      )}
    </div>
  );
};