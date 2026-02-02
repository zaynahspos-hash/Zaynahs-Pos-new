import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Search, Filter, Edit2, Trash2, Tag, History, Package, AlertTriangle, ArrowUp, ArrowDown, ScanLine } from 'lucide-react';
import { Product } from '../types';
import { ProductFormModal } from './ProductFormModal';
import { BarcodePrintModal } from './BarcodePrintModal';

// Defined TabButton component to fix the error
const TabButton: React.FC<{ isActive: boolean, onClick: () => void, icon: any, label: string }> = ({ isActive, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
      isActive 
        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' 
        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
    }`}
  >
    <Icon size={18} />
    <span className="font-medium text-sm">{label}</span>
  </button>
);

type Tab = 'products' | 'categories' | 'logs';

export const ProductList: React.FC = () => {
  const { products, categories, stockLogs, settings, addProduct, updateProduct, deleteProduct, addCategory, deleteCategory } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [barcodeProducts, setBarcodeProducts] = useState<Product[]>([]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = stockLogs.filter(l => 
    l.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleAddProduct = () => {
    setEditingProduct(undefined);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(id);
    }
  };

  const handleAddCategory = async () => {
    const name = prompt('Enter category name:');
    if (name) {
      const description = prompt('Enter description (optional):') || '';
      await addCategory({ name, description });
    }
  };

  const handlePrintAll = () => {
      setBarcodeProducts(filteredProducts);
      setIsBarcodeModalOpen(true);
  };

  const handlePrintSingle = (product: Product) => {
      setBarcodeProducts([product]);
      setIsBarcodeModalOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">Inventory Management</h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Track products, organize categories, and audit stock.</p>
        </div>
        
        {activeTab === 'products' && (
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={handlePrintAll}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm font-medium"
            >
              <ScanLine size={18} />
              <span className="hidden sm:inline">Print Barcodes</span>
              <span className="sm:hidden">Barcodes</span>
            </button>
            <button 
              onClick={handleAddProduct}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-medium"
            >
              <Plus size={18} />
              <span>Add Product</span>
            </button>
          </div>
        )}
        
        {activeTab === 'categories' && (
          <button 
            onClick={handleAddCategory}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>Add Category</span>
          </button>
        )}
      </div>

      {/* Scrollable Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar -mx-3 sm:mx-0 px-3 sm:px-0">
        <nav className="-mb-px flex space-x-6 min-w-max">
          <TabButton 
            isActive={activeTab === 'products'} 
            onClick={() => setActiveTab('products')} 
            icon={Package} 
            label="Products" 
          />
          <TabButton 
            isActive={activeTab === 'categories'} 
            onClick={() => setActiveTab('categories')} 
            icon={Tag} 
            label="Categories" 
          />
          <TabButton 
            isActive={activeTab === 'logs'} 
            onClick={() => setActiveTab('logs')} 
            icon={History} 
            label="Stock History" 
          />
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        {/* Toolbar (Common for Products & Logs) */}
        {activeTab !== 'categories' && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder={activeTab === 'products' ? "Search products..." : "Search logs..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <Filter size={16} />
              <span>Filter</span>
            </button>
          </div>
        )}

        {/* --- PRODUCTS TABLE --- */}
        {activeTab === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Product</th>
                  <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell whitespace-nowrap">SKU</th>
                  <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">Stock</th>
                  <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Price</th>
                  <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Category</th>
                  <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-600">
                          {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover"/> : <Package size={20} className="text-slate-400"/>}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 dark:text-slate-200 truncate text-sm">{product.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 lg:hidden truncate">{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-300 hidden lg:table-cell">
                      {product.sku}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${product.stock <= (product.lowStockThreshold || 5) ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
                        {product.stock} units
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-bold text-slate-800 dark:text-white">
                      ${product.price}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300 hidden md:table-cell">
                      {product.category}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handlePrintSingle(product)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Print Barcode">
                          <ScanLine size={16} />
                        </button>
                        <button onClick={() => handleEditProduct(product)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- CATEGORIES TABLE --- */}
        {activeTab === 'categories' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Products</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{cat.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{cat.description || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {products.filter(p => p.category === cat.name).length} items
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { if(confirm('Delete category?')) deleteCategory(cat.id); }} className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- STOCK LOGS TABLE --- */}
        {activeTab === 'logs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Change</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Final Stock</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-slate-200">
                      {log.productName}
                      <span className="block text-xs text-slate-400 font-mono">{log.sku}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        log.type === 'IN' || log.type === 'RETURN' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                        log.type === 'OUT' || log.type === 'SALE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold ${log.changeAmount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {log.changeAmount > 0 ? '+' : ''}{log.changeAmount}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-200 font-medium">
                      {log.finalStock}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
                      {log.reason || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {log.performedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProductFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={editingProduct ? (data) => updateProduct(editingProduct.id, data) : addProduct}
        initialData={editingProduct}
        categories={categories}
      />

      <BarcodePrintModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        products={barcodeProducts}
        settings={settings}
      />
    </div>
  );
};