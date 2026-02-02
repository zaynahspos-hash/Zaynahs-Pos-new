import React from 'react';
import { useStore } from '../store/useStore';
import { DollarSign, ShoppingBag, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const DashboardStats: React.FC = () => {
  const { orders, products, users } = useStore();

  const totalRevenue = orders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  
  const totalOrders = orders.length;
  const newCustomers = new Set(orders.map(o => o.customerName)).size;
  const lowStockProducts = products.filter(p => p.stock <= (p.lowStockThreshold || 5)).length;

  // Transform orders to chart data (simplified grouped by date)
  const chartData = React.useMemo(() => {
    const days = 7;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayRevenue = orders
        .filter(o => new Date(o.createdAt).toDateString() === d.toDateString() && o.status !== 'CANCELLED')
        .reduce((sum, o) => sum + o.totalAmount, 0);
      data.push({ name: dateStr, revenue: dayRevenue });
    }
    return data;
  }, [orders]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Store Dashboard</h1>
        <div className="flex gap-2">
           <span className="text-sm text-slate-500 dark:text-slate-400">Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`$${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
          trend="+12.5%" 
          trendUp={true} 
          icon={DollarSign} 
          color="indigo" 
        />
        <StatCard 
          title="Total Orders" 
          value={totalOrders.toString()} 
          trend="+8.2%" 
          trendUp={true} 
          icon={ShoppingBag} 
          color="blue" 
        />
        <StatCard 
          title="Active Customers" 
          value={newCustomers.toString()} 
          trend="+2.4%" 
          trendUp={true} 
          icon={Users} 
          color="orange" 
        />
        <StatCard 
          title="Low Stock Items" 
          value={lowStockProducts.toString()} 
          trend={lowStockProducts > 0 ? "Action Needed" : "Healthy"} 
          trendUp={lowStockProducts === 0} 
          icon={AlertTriangle} 
          color={lowStockProducts > 0 ? "red" : "emerald"} 
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors duration-300">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Revenue Overview (Last 7 Days)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.2} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dx={-10} tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: 'none', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  backgroundColor: '#1e293b', 
                  color: '#f8fafc' 
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#6366f1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: React.ElementType;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, trendUp, icon: Icon, color }) => {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    orange: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    red: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${colorClasses[color] || colorClasses.indigo}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        <span className={`font-medium ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
          {trend}
        </span>
      </div>
    </div>
  );
};