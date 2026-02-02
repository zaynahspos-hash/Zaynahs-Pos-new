
import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  History, 
  Users, 
  Settings, 
  ChevronDown,
  Hexagon,
  Scan,
  X, 
  Shield,
  CreditCard,
  Building,
  Truck,
  Receipt,
  PieChart,
  ClipboardList,
  Contact,
  ClipboardCheck,
  LogOut,
  User as UserIcon,
  Ticket
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { Permission, Role } from '../types';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  end?: boolean;
  permission?: Permission;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { currentTenant, tenants, setTenant, user, logout } = useStore();
  const [isTenantMenuOpen, setIsTenantMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isSuperAdmin = user?.role === Role.SUPER_ADMIN;

  // --- TENANT / SHOP OWNER NAVIGATION ---
  const shopNavGroups: { title: string; items: NavItem[] }[] = [
    {
      title: 'Operations',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/app', end: true, permission: 'VIEW_DASHBOARD' },
        { icon: Scan, label: 'POS Terminal', path: '/app/pos', permission: 'POS_ACCESS' },
        { icon: History, label: 'Sales History', path: '/app/sales', permission: 'MANAGE_ORDERS' },
        { icon: Package, label: 'Products', path: '/app/products', permission: 'MANAGE_PRODUCTS' },
      ]
    },
    {
      title: 'CRM',
      items: [
        { icon: Contact, label: 'Customers', path: '/app/customers', permission: 'MANAGE_CUSTOMERS' },
      ]
    },
    {
      title: 'Purchasing',
      items: [
        { icon: Truck, label: 'Suppliers', path: '/app/suppliers', permission: 'MANAGE_SUPPLIERS' },
        { icon: ClipboardList, label: 'Purchase Orders', path: '/app/purchase-orders', permission: 'MANAGE_PRODUCTS' },
      ]
    },
    {
      title: 'Financials',
      items: [
        { icon: Receipt, label: 'Expenses', path: '/app/expenses', permission: 'MANAGE_EXPENSES' },
        { icon: PieChart, label: 'Reports', path: '/app/reports', permission: 'VIEW_REPORTS' },
      ]
    },
    {
      title: 'Administration',
      items: [
        { icon: Users, label: 'Store Staff', path: '/app/users', permission: 'MANAGE_USERS' },
        { icon: Ticket, label: 'Discounts', path: '/app/discounts', permission: 'MANAGE_SETTINGS' },
        { icon: Settings, label: 'Store Settings', path: '/app/settings', permission: 'MANAGE_SETTINGS' },
        { icon: CreditCard, label: 'Billing & Plan', path: '/app/settings?tab=billing', permission: 'MANAGE_SETTINGS' },
      ]
    }
  ];

  // --- SUPER ADMIN (PLATFORM OWNER) NAVIGATION ---
  // Strictly the 3 tabs requested: Payment Approvals, All Users Info, Plan Management
  const superAdminItems: NavItem[] = [
    { icon: ClipboardCheck, label: 'Payment Approvals', path: '/app/admin/payments' },
    { icon: Building, label: 'All Users Info', path: '/app/admin/tenants' }, 
    { icon: CreditCard, label: 'Plan Management', path: '/app/admin/plans' },
  ];

  const hasPermission = (permission?: Permission) => {
    if (!user) return false;
    if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) return true;
    if (!permission) return true;
    return user.permissions?.includes(permission);
  };

  const renderNavGroup = (title: string, items: NavItem[]) => {
    const visibleItems = items.filter(item => hasPermission(item.permission as Permission));

    if (visibleItems.length === 0) return null;

    return (
      <div className="mb-6" key={title}>
        <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{title}</p>
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={() => {
              if (window.innerWidth < 1024 && onClose) onClose();
            }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group mb-1 ${
                isActive 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' 
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`
            }
          >
            <item.icon size={20} className="shrink-0" />
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      <div 
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Container */}
      <aside className={`
        w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white lg:hidden"
        >
          <X size={20} />
        </button>

        {/* HEADER SECTION */}
        <div className="p-4 border-b border-slate-800 mt-8 lg:mt-0">
          {isSuperAdmin ? (
            // --- SUPER ADMIN HEADER (RED THEME) ---
            <div className="flex items-center gap-3 w-full p-2 rounded-lg bg-red-900/30 border border-red-500/30">
               <div className="w-10 h-10 rounded-md bg-red-600 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20">
                  <Shield className="text-white" size={24} />
               </div>
               <div className="flex-1 overflow-hidden">
                  <h3 className="text-sm font-bold text-white truncate">Super Admin</h3>
                  <p className="text-xs text-red-300 truncate">Platform Control</p>
               </div>
            </div>
          ) : (
            // --- TENANT HEADER (Switchable) ---
            <div className="relative">
              <button 
                onClick={() => setIsTenantMenuOpen(!isTenantMenuOpen)}
                className="flex items-center w-full gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center shrink-0 overflow-hidden">
                  {currentTenant?.logoUrl ? (
                     <img src={currentTenant.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                     <span className="text-emerald-600 font-bold text-lg">{currentTenant?.name.substring(0, 1) || 'T'}</span>
                  )}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <h3 className="text-sm font-semibold text-white truncate">{currentTenant?.name || 'Select Tenant'}</h3>
                  <p className="text-xs text-slate-500 truncate">{currentTenant?.subscriptionTier} Plan</p>
                </div>
                {tenants.length > 1 && <ChevronDown size={16} className={`transition-transform ${isTenantMenuOpen ? 'rotate-180' : ''}`} />}
              </button>

              {/* Tenant Dropdown */}
              {isTenantMenuOpen && tenants.length > 1 && (
                <div className="absolute top-full left-0 w-full mt-2 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden z-50">
                  {tenants.map(tenant => (
                    <button
                      key={tenant.id}
                      onClick={() => {
                        setTenant(tenant);
                        setIsTenantMenuOpen(false);
                        if (onClose) onClose();
                      }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-700 transition-colors flex items-center gap-2 ${currentTenant?.id === tenant.id ? 'text-emerald-400 bg-slate-700/50' : 'text-slate-300'}`}
                    >
                       <div className="w-6 h-6 rounded flex items-center justify-center bg-slate-900 overflow-hidden shrink-0">
                          {tenant.logoUrl ? (
                             <img src={tenant.logoUrl} className="w-full h-full object-contain" />
                          ) : (
                             <Hexagon size={14} className={currentTenant?.id === tenant.id ? 'text-emerald-500' : 'text-slate-500'} />
                          )}
                       </div>
                       <span className="truncate">{tenant.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 overflow-y-auto py-6">
          {isSuperAdmin ? (
             <div className="mb-6">
               <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Management</p>
               {superAdminItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    onClick={() => {
                      if (window.innerWidth < 1024 && onClose) onClose();
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group mb-1 ${
                        isActive 
                          ? 'bg-red-600 text-white shadow-md shadow-red-500/20' 
                          : 'hover:bg-slate-800 hover:text-white text-slate-400'
                      }`
                    }
                  >
                    <item.icon size={20} className="shrink-0" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </NavLink>
                ))}
             </div>
          ) : (
             <>
               {shopNavGroups.map(group => renderNavGroup(group.title, group.items))}
             </>
          )}
        </nav>

        {/* USER PROFILE SECTION */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold border border-slate-600">
              {user?.name ? user.name.substring(0, 1).toUpperCase() : <UserIcon size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.role.replace('_', ' ')}</p>
            </div>
            <button 
              onClick={() => { logout(); navigate('/login'); }}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
