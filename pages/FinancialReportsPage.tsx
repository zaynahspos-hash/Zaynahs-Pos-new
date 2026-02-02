import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Filter, Users, Download, ArrowLeft, ArrowRight, UserCheck } from 'lucide-react';

export const FinancialReportsPage: React.FC = () => {
  const { orders, expenses, purchaseOrders, users, suppliers, products, currentTenant } = useStore();
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [cashierFilter, setCashierFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');

  // Pagination for Detail Table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter Orders
  const filteredOrders = useMemo(() => {
    let result = orders.filter(o => o.status !== 'CANCELLED');
    
    // Date Filtering
    if (startDate) {
       result = result.filter(o => new Date(o.createdAt) >= new Date(startDate));
    }
    if (endDate) {
       const end = new Date(endDate);
       end.setHours(23, 59, 59);
       result = result.filter(o => new Date(o.createdAt) <= end);
    }

    // Sales Person Filtering (salespersonId)
    if (staffFilter !== 'all') {
       result = result.filter(o => o.salespersonId === staffFilter || (!o.salespersonId && o.userId === staffFilter));
    }

    // Cashier Filtering (cashierId)
    if (cashierFilter !== 'all') {
       result = result.filter(o => o.cashierId === cashierFilter);
    }

    // Product Filter (This is heavier, checks if order contains product)
    if (productFilter !== 'all') {
       result = result.filter(o => o.items.some(item => item.productId === productFilter));
    }

    // Supplier Filter (Check if order contains products from this supplier)
    if (supplierFilter !== 'all') {
        // Find products belonging to supplier
        const supplierProductIds = products.filter(p => p.supplierId === supplierFilter).map(p => p.id);
        result = result.filter(o => o.items.some(item => supplierProductIds.includes(item.productId)));
    }

    return result;
  }, [orders, startDate, endDate, staffFilter, cashierFilter, supplierFilter, productFilter, products]);

  // Calculations
  const totalSales = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCOGS = filteredOrders.reduce((sum, o) => {
     return sum + o.items.reduce((isum, item) => isum + ((item.costAtTime || item.priceAtTime * 0.7) * item.quantity), 0);
  }, 0);
  const grossProfit = totalSales - totalCOGS;
  const margin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

  // Group Sales by Sales Person (using salespersonName)
  const salesByStaff = useMemo(() => {
     const data: Record<string, number> = {};
     filteredOrders.forEach(o => {
        const name = o.salespersonName || 'Unknown';
        data[name] = (data[name] || 0) + o.totalAmount;
     });
     return Object.entries(data).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [filteredOrders]);

  // Sales Over Time Data (Sorted chronologically)
  const salesOverTime = useMemo(() => {
     const data: Record<string, { revenue: number, cost: number }> = {};
     filteredOrders.forEach(o => {
        const dateKey = new Date(o.createdAt).toLocaleDateString();
        if(!data[dateKey]) data[dateKey] = { revenue: 0, cost: 0 };
        data[dateKey].revenue += o.totalAmount;
        data[dateKey].cost += o.items.reduce((s, i) => s + ((i.costAtTime || i.priceAtTime * 0.7) * i.quantity), 0);
     });
     
     // IMPORTANT: Sort by date timestamp to ensure chronological order in charts
     return Object.entries(data)
        .map(([name, val]) => ({ name, ...val }))
        .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
  }, [filteredOrders]);

  // Pagination for Breakdown
  const totalPages = Math.ceil(salesByStaff.length / itemsPerPage);
  const paginatedStaffStats = salesByStaff.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const handleExport = (type: 'csv' | 'pdf') => {
     if (filteredOrders.length === 0) {
       alert("No data available to export.");
       return;
     }

     if (type === 'csv') {
        const headers = ['Order ID', 'Date', 'Customer', 'Sales Person', 'Cashier', 'Items Count', 'Total Amount', 'Status'];
        const rows = filteredOrders.map(o => [
           o.id,
           new Date(o.createdAt).toLocaleDateString(),
           o.customerName,
           o.salespersonName || 'N/A',
           o.cashierName || 'N/A',
           o.items.length,
           o.totalAmount.toFixed(2),
           o.status
        ]);
        
        const csvContent = [
           headers.join(','),
           ...rows.map(r => r.join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
     } else {
        // PDF Export via Window Print
        const printWindow = window.open('', '', 'width=800,height=600');
        if (!printWindow) {
           alert("Please allow popups to export PDF");
           return;
        }
        
        const html = `
           <html>
             <head>
               <title>Sales Report - ${currentTenant?.name}</title>
               <style>
                 body { font-family: sans-serif; padding: 20px; }
                 h1 { color: #333; }
                 .meta { margin-bottom: 20px; color: #666; font-size: 14px; }
                 table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                 th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                 th { background-color: #f3f4f6; font-weight: bold; }
                 .summary { display: flex; gap: 20px; margin-bottom: 20px; }
                 .box { border: 1px solid #ddd; padding: 15px; border-radius: 5px; flex: 1; text-align: center; }
                 .val { font-size: 18px; font-weight: bold; display: block; margin-top: 5px; }
               </style>
             </head>
             <body>
               <h1>Sales Report</h1>
               <div class="meta">
                 <p><strong>Store:</strong> ${currentTenant?.name}</p>
                 <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                 <p><strong>Period:</strong> ${startDate || 'Start'} to ${endDate || 'End'}</p>
               </div>
               
               <div class="summary">
                  <div class="box">Total Sales<span class="val">$${totalSales.toLocaleString()}</span></div>
                  <div class="box">Total Profit<span class="val">$${grossProfit.toLocaleString()}</span></div>
                  <div class="box">Orders<span class="val">${filteredOrders.length}</span></div>
               </div>

               <table>
                 <thead>
                   <tr>
                     <th>Order ID</th>
                     <th>Date</th>
                     <th>Customer</th>
                     <th>Sales Rep</th>
                     <th>Cashier</th>
                     <th>Total</th>
                   </tr>
                 </thead>
                 <tbody>
                   ${filteredOrders.map(o => `
                     <tr>
                       <td>${o.id}</td>
                       <td>${new Date(o.createdAt).toLocaleDateString()}</td>
                       <td>${o.customerName}</td>
                       <td>${o.salespersonName || '-'}</td>
                       <td>${o.cashierName || '-'}</td>
                       <td>$${o.totalAmount.toFixed(2)}</td>
                     </tr>
                   `).join('')}
                 </tbody>
               </table>
             </body>
           </html>
        `;
        
        printWindow.document.write(html);
        printWindow.document.close();
        
        setTimeout(() => {
           printWindow.focus();
           printWindow.print();
           printWindow.close();
        }, 500);
     }
  };

  const setPresetDate = (days: number) => {
     const end = new Date();
     const start = new Date();
     start.setDate(end.getDate() - days);
     setEndDate(end.toISOString().split('T')[0]);
     setStartDate(start.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Financial Reports</h1>
          <p className="text-slate-500 dark:text-slate-400">Advanced analytics and performance tracking.</p>
        </div>
        
        <div className="flex gap-2">
           <button onClick={() => handleExport('csv')} className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 text-sm font-medium transition-colors">
              <Download size={16}/> Export CSV
           </button>
           <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm transition-colors">
              <Download size={16}/> Export PDF
           </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 transition-colors">
         <div className="col-span-1 sm:col-span-2 flex items-center gap-2">
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm focus:ring-indigo-500" 
            />
            <span className="text-slate-400">to</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm focus:ring-indigo-500" 
            />
         </div>
         <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-2">
            <button onClick={() => { setStartDate(new Date().toISOString().split('T')[0]); setEndDate(new Date().toISOString().split('T')[0]); }} className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors">Today</button>
            <button onClick={() => setPresetDate(7)} className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors">7 Days</button>
            <button onClick={() => setPresetDate(30)} className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors">30 Days</button>
         </div>
         
         <select className="px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm" value={staffFilter} onChange={e => setStaffFilter(e.target.value)}>
            <option value="all">All Sales Reps</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
         </select>
         
         <select className="px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm" value={cashierFilter} onChange={e => setCashierFilter(e.target.value)}>
            <option value="all">All Cashiers</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
         </select>

         {/* Additional filters row if needed, or wrap */}
         <select className="px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm lg:col-span-3 xl:col-span-1" value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}>
            <option value="all">All Suppliers</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
         </select>
         <select className="px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm lg:col-span-3 xl:col-span-1" value={productFilter} onChange={e => setProductFilter(e.target.value)}>
            <option value="all">All Products</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
         </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
           <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
             <TrendingUp size={18} className="text-indigo-500" />
             <span className="text-sm font-medium">Gross Sales</span>
           </div>
           <p className="text-2xl font-bold text-slate-800 dark:text-white">${totalSales.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
           <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
             <DollarSign size={18} className="text-orange-500" />
             <span className="text-sm font-medium">Cost of Goods</span>
           </div>
           <p className="text-2xl font-bold text-slate-800 dark:text-white">${totalCOGS.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
           <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
             <TrendingUp size={18} className="text-emerald-500" />
             <span className="text-sm font-medium">Net Profit</span>
           </div>
           <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">${grossProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
           <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
             <Users size={18} className="text-blue-500" />
             <span className="text-sm font-medium">Profit Margin</span>
           </div>
           <p className="text-2xl font-bold text-slate-800 dark:text-white">{margin.toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales vs Cost Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Profitability Analysis</h3>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               {salesOverTime.length > 0 ? (
                 <BarChart data={salesOverTime}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.2} />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                   <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#f8fafc' }}
                   />
                   <Legend />
                   <Bar dataKey="revenue" name="Sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
                   <Bar dataKey="cost" name="Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                 </BarChart>
               ) : (
                 <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                    No data available for the selected period.
                 </div>
               )}
             </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Staff */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Sales by Staff Member</h3>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               {salesByStaff.length > 0 ? (
                 <PieChart>
                   <Pie
                     data={salesByStaff}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={100}
                     fill="#8884d8"
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {salesByStaff.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip formatter={(val: number) => `$${val.toLocaleString()}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#f8fafc' }}/>
                   <Legend verticalAlign="bottom" height={36}/>
                 </PieChart>
               ) : (
                 <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                    No sales data available.
                 </div>
               )}
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Staff Performance Table with Pagination */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
         <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-white">Staff Performance Breakdown</h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  <tr>
                     <th className="px-6 py-3">Staff Name</th>
                     <th className="px-6 py-3 text-right">Total Sales</th>
                     <th className="px-6 py-3 text-right">Orders Processed</th>
                     <th className="px-6 py-3 text-right">Avg. Ticket</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                  {paginatedStaffStats.map((staff, idx) => {
                     const staffOrders = filteredOrders.filter(o => o.salespersonName === staff.name || (!o.salespersonName && staff.name === 'Unknown'));
                     const count = staffOrders.length;
                     const avg = count > 0 ? staff.value / count : 0;
                     return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                           <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-200">
                              <div className="flex items-center gap-2">
                                <UserCheck size={16} className="text-indigo-500" />
                                {staff.name}
                              </div>
                           </td>
                           <td className="px-6 py-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">${staff.value.toLocaleString()}</td>
                           <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-300">{count}</td>
                           <td className="px-6 py-3 text-right text-slate-500 dark:text-slate-400">${avg.toFixed(2)}</td>
                        </tr>
                     );
                  })}
                  {salesByStaff.length === 0 && (
                     <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No data available for selected period.</td></tr>
                  )}
               </tbody>
            </table>
         </div>
         
         {/* Pagination Controls */}
         {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
               <button 
                 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                 disabled={currentPage === 1}
                 className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50"
               >
                 <ArrowLeft size={16} />
               </button>
               <span className="text-sm text-slate-600 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
               <button 
                 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                 disabled={currentPage === totalPages}
                 className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50"
               >
                 <ArrowRight size={16} />
               </button>
            </div>
         )}
      </div>
    </div>
  );
};