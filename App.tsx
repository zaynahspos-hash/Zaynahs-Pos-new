
import React, { useEffect, useState, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { DashboardStats } from './components/DashboardStats';
import { ProductList } from './components/ProductList';
import { OrdersPage } from './pages/OrdersPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { PurchaseOrdersPage } from './pages/PurchaseOrdersPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { FinancialReportsPage } from './pages/FinancialReportsPage';
import { CustomersPage } from './pages/CustomersPage';
import { DiscountsPage } from './pages/DiscountsPage';
import { TenantManagement } from './pages/admin/TenantManagement';
import { SubscriptionPlans } from './pages/admin/SubscriptionPlans';
import { PaymentApprovals } from './pages/admin/PaymentApprovals';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { POSPage } from './pages/POSPage';
import { LandingPage } from './pages/LandingPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { useStore } from './store/useStore';
import { NotificationsPanel } from './components/NotificationsPanel';
import { Bell, Search, Menu, LogOut, Wifi, WifiOff, Moon, Sun, Package, User, ShoppingBag, X } from 'lucide-react';
import { Role } from './types';
import { APP_CONFIG } from './config';

interface TopBarProps {
  onMenuClick: () => void;
  onNotificationsClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick, onNotificationsClick }) => {
  const { logout, user, notifications, theme, toggleTheme, products, customers, orders } = useStore();
  const unreadCount = notifications.filter(n => !n.read).length;
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ products: any[], customers: any[], orders: any[] }>({ products: [], customers: [], orders: [] });
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Super Admin view shouldn't have global store search
  const isSuperAdmin = user?.role === Role.SUPER_ADMIN;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle Search Logic
  useEffect(() => {
    if (isSuperAdmin) return; // Disable for Super Admin

    if (!searchQuery.trim()) {
      setSearchResults({ products: [], customers: [], orders: [] });
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    
    const matchedProducts = products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || p.sku.toLowerCase().includes(lowerQuery)
    ).slice(0, 3);

    const matchedCustomers = customers.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) || c.phone.includes(lowerQuery)
    ).slice(0, 3);

    const matchedOrders = orders.filter(o => 
      (o.id && o.id.toLowerCase().includes(lowerQuery)) || o.customerName.toLowerCase().includes(lowerQuery)
    ).slice(0, 3);

    setSearchResults({ products: matchedProducts, customers: matchedCustomers, orders: matchedOrders });
  }, [searchQuery, products, customers, orders, isSuperAdmin]);

  // Click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 transition-colors duration-300">
      {/* Mobile Menu Trigger */}
      <button 
        onClick={onMenuClick}
        className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg -ml-2 transition-colors"
        aria-label="Open Menu"
      >
        <Menu size={24} />
      </button>

      {/* Global Search - Hidden for Super Admin */}
      {!isSuperAdmin ? (
        <div className="hidden md:flex flex-col relative w-full max-w-sm lg:max-w-md mx-4" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search products, orders, customers..." 
              className="w-full pl-10 pr-10 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-slate-900 dark:text-white placeholder-slate-400"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
              onFocus={() => setShowResults(true)}
            />
            {searchQuery && (
              <button 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => { setSearchQuery(''); setSearchResults({ products: [], customers: [], orders: [] }); }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showResults && searchQuery && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              {/* Products */}
              {searchResults.products.length > 0 && (
                <div className="p-2">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 mb-1 uppercase tracking-wider">Products</h4>
                  {searchResults.products.map(p => (
                    <Link key={p.id} to="/app/products" onClick={() => setShowResults(false)} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg group">
                        <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-600 flex items-center justify-center shrink-0">
                          {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover rounded" /> : <Package size={14} className="text-slate-400"/>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600">{p.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{p.sku}</p>
                        </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Customers */}
              {searchResults.customers.length > 0 && (
                <div className="p-2 border-t border-slate-100 dark:border-slate-700">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 mb-1 uppercase tracking-wider">Customers</h4>
                  {searchResults.customers.map(c => (
                    <Link key={c.id} to="/app/customers" onClick={() => setShowResults(false)} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg group">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                          <User size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600">{c.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{c.phone}</p>
                        </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Orders */}
              {searchResults.orders.length > 0 && (
                <div className="p-2 border-t border-slate-100 dark:border-slate-700">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 mb-1 uppercase tracking-wider">Orders</h4>
                  {searchResults.orders.map(o => (
                    <Link key={o.id} to="/app/orders" onClick={() => setShowResults(false)} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg group">
                        <div className="w-8 h-8 rounded bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0 text-orange-600 dark:text-orange-400">
                          <ShoppingBag size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-orange-600">Order #{o.id.slice(-6).toUpperCase()}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{o.customerName} • ${o.totalAmount}</p>
                        </div>
                    </Link>
                  ))}
                </div>
              )}

              {searchResults.products.length === 0 && searchResults.customers.length === 0 && searchResults.orders.length === 0 && (
                <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1"></div>
      )}

      {/* Mobile Title (visible when search is hidden) */}
      <div className="md:hidden font-semibold text-slate-700 dark:text-slate-200 flex-1 text-center truncate px-2">
        {user?.email ? user.email.split('@')[0] : APP_CONFIG.name}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div title={isOnline ? "Online" : "Offline"} className={`p-2 rounded-full ${isOnline ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
           {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
        </div>

        {!isSuperAdmin && (
          <button 
            onClick={onNotificationsClick}
            className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
            )}
          </button>
        )}
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
        
        <div className="flex items-center gap-2">
           <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block">{user?.name}</span>
           <button 
            onClick={logout}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" 
            title="Logout"
           >
             <LogOut size={18} />
           </button>
        </div>
      </div>
    </header>
  );
};

const DashboardLayout: React.FC = () => {
  const { loadInitialData, syncOfflineData, isLoading, theme } = useStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Apply Theme Class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    // Initial Load
    loadInitialData();

    // Online/Offline Sync Listeners
    const handleOnline = () => {
      console.log('App is online. Syncing data...');
      syncOfflineData();
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [loadInitialData, syncOfflineData]);

   if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <NotificationsPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
      
      {/* Main Content Wrapper */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen transition-all duration-300 ml-0 w-full">
        <TopBar 
          onMenuClick={() => setIsSidebarOpen(true)} 
          onNotificationsClick={() => setIsNotificationsOpen(true)}
        />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto pb-20 lg:pb-0 w-full">
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

// Intelligent Redirect Component
const DashboardIndex = () => {
  const { user } = useStore();
  if (user?.role === Role.SUPER_ADMIN) {
    return <Navigate to="/app/admin/payments" replace />;
  }
  return <DashboardStats />;
};

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Protected Dashboard Routes - Namespaced under /app */}
        <Route path="/app" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          {/* Index Route - Intelligent Redirect */}
          <Route index element={
            <ProtectedRoute>
              <DashboardIndex />
            </ProtectedRoute>
          } />
          
          <Route path="pos" element={
            <ProtectedRoute requiredPermission="POS_ACCESS">
              <POSPage />
            </ProtectedRoute>
          } />
          
          <Route path="sales" element={
            <ProtectedRoute requiredPermission="MANAGE_ORDERS">
              <OrdersPage />
            </ProtectedRoute>
          } />
          
          <Route path="products" element={
            <ProtectedRoute requiredPermission="MANAGE_PRODUCTS">
              <ProductList />
            </ProtectedRoute>
          } />
          
          <Route path="orders" element={<Navigate to="sales" replace />} />
          
          <Route path="users" element={
            <ProtectedRoute requiredPermission="MANAGE_USERS">
              <UsersPage />
            </ProtectedRoute>
          } />
          
          <Route path="settings" element={
            <ProtectedRoute requiredPermission="MANAGE_SETTINGS">
              <SettingsPage />
            </ProtectedRoute>
          } />

          <Route path="discounts" element={
            <ProtectedRoute requiredPermission="MANAGE_SETTINGS">
              <DiscountsPage />
            </ProtectedRoute>
          } />
          
          <Route path="subscription" element={<SubscriptionPlans />} />
          
          <Route path="customers" element={
            <ProtectedRoute requiredPermission="MANAGE_CUSTOMERS">
              <CustomersPage />
            </ProtectedRoute>
          } />
          
          <Route path="suppliers" element={
            <ProtectedRoute requiredPermission="MANAGE_SUPPLIERS">
              <SuppliersPage />
            </ProtectedRoute>
          } />
          
          <Route path="purchase-orders" element={
            <ProtectedRoute requiredPermission="MANAGE_PRODUCTS">
              <PurchaseOrdersPage />
            </ProtectedRoute>
          } />
          
          <Route path="expenses" element={
            <ProtectedRoute requiredPermission="MANAGE_EXPENSES">
              <ExpensesPage />
            </ProtectedRoute>
          } />
          
          <Route path="reports" element={
            <ProtectedRoute requiredPermission="VIEW_REPORTS">
              <FinancialReportsPage />
            </ProtectedRoute>
          } />

          {/* Super Admin Routes - Role Strict */}
          <Route path="admin" element={<Navigate to="/app/admin/payments" replace />} />
          
          <Route path="admin/tenants" element={
            <ProtectedRoute requiredRole={Role.SUPER_ADMIN}>
              <TenantManagement />
            </ProtectedRoute>
          } />
          <Route path="admin/plans" element={
            <ProtectedRoute requiredRole={Role.SUPER_ADMIN}>
              <SubscriptionPlans />
            </ProtectedRoute>
          } />
          <Route path="admin/payments" element={
            <ProtectedRoute requiredRole={Role.SUPER_ADMIN}>
              <PaymentApprovals />
            </ProtectedRoute>
          } />
        </Route>

        {/* Catch all - Redirect to Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
