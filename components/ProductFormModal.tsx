
import React, { useState, useEffect } from 'react';
import { X, Upload, AlertCircle, Plus, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { Product, Category, ProductAttribute } from '../types';
import { useStore } from '../store/useStore';
import { compressImage } from '../services/imageCompression';
import { uploadFile } from '../services/storage';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Product>) => Promise<void>;
  initialData?: Product;
  categories: Category[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  categories 
}) => {
  const { suppliers, addCategory, addSupplier } = useStore();
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    category: 'General',
    supplierId: '',
    price: 0,
    costPrice: 0,
    stock: 0,
    description: '',
    imageUrl: '',
    lowStockThreshold: 10,
    attributes: []
  });

  // Variant Input State
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrValues, setNewAttrValues] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [compressionStatus, setCompressionStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        sku: '',
        category: 'General',
        supplierId: suppliers[0]?.id || '',
        price: 0,
        costPrice: 0,
        stock: 0,
        description: '',
        imageUrl: '',
        lowStockThreshold: 10,
        attributes: []
      });
    }
  }, [initialData, suppliers, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await onSubmit({
          ...formData,
          category: formData.category || 'General',
          imageUrl: formData.imageUrl || `https://placehold.co/300x200?text=${encodeURIComponent(formData.name || 'Product')}`
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleAddAttribute = () => {
      if (!newAttrName || !newAttrValues) return;
      const options = newAttrValues.split(',').map(s => s.trim()).filter(Boolean);
      if (options.length === 0) return;

      const newAttr: ProductAttribute = {
          name: newAttrName,
          options: options
      };

      setFormData(prev => ({
          ...prev,
          attributes: [...(prev.attributes || []), newAttr]
      }));

      setNewAttrName('');
      setNewAttrValues('');
  };

  const handleRemoveAttribute = (index: number) => {
      setFormData(prev => ({
          ...prev,
          attributes: prev.attributes?.filter((_, i) => i !== index)
      }));
  };

  const handleQuickAddCategory = async () => {
    const name = prompt("Enter new category name:");
    if (name) {
      try {
        await addCategory({ name, description: 'Created via quick add' });
        // Manually update local state to reflect change immediately if prop lag occurs
        setFormData(prev => ({ ...prev, category: name }));
      } catch (e) {
        alert("Failed to add category");
      }
    }
  };

  const handleImageUpload = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
              setIsUploading(true);
              setCompressionStatus('Optimizing...');
              
              try {
                  // 1. Compress
                  const compressedFile = await compressImage(file);
                  setCompressionStatus('Uploading...');
                  
                  // 2. Upload to Supabase 'products' bucket
                  const url = await uploadFile(compressedFile, 'products');
                  
                  setFormData(prev => ({ ...prev, imageUrl: url }));
                  setIsUploading(false);
                  setCompressionStatus('');
                  
              } catch (err) {
                  console.error('Upload failed', err);
                  setError('Failed to upload image. Check network.');
                  setIsUploading(false);
                  setCompressionStatus('');
              }
          }
      };
      input.click();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl w-full mx-4 border dark:border-slate-700">
          <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {initialData ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-500 bg-slate-50 dark:bg-slate-700 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form id="productForm" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Image Upload */}
                <div className="col-span-1 sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Product Image</label>
                    <div className="flex items-center gap-4">
                        <div className="h-24 w-24 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden relative group">
                            {formData.imageUrl ? (
                                <img src={formData.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                                <ImageIcon className="text-slate-400" />
                            )}
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white text-xs">
                                    <Loader2 className="w-5 h-5 animate-spin mb-1" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <button 
                                type="button" 
                                onClick={handleImageUpload}
                                disabled={isUploading}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:ring-2 focus:ring-indigo-500"
                            >
                                <Upload size={16} />
                                {isUploading ? compressionStatus : 'Upload Photo'}
                            </button>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                Max 2MB. Auto-optimized to WebP.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Product Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="e.g. Wireless Headphones"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">SKU</label>
                  <input
                    type="text"
                    name="sku"
                    required
                    value={formData.sku}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm"
                    placeholder="e.g. WH-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category (Optional)</label>
                  <div className="flex gap-2">
                    <select
                      name="category"
                      value={formData.category || 'General'}
                      onChange={handleChange}
                      className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="General">General</option>
                      {categories.filter(c => c.name !== 'General').map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    <button 
                      type="button" 
                      onClick={handleQuickAddCategory}
                      className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800"
                      title="Add New Category"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sale Price ($)</label>
                  <input
                    type="number"
                    name="price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    name="stock"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Attributes / Variants Section */}
                <div className="col-span-1 sm:col-span-2 border-t border-slate-100 dark:border-slate-700 pt-4">
                    <label className="block text-sm font-bold text-slate-800 dark:text-white mb-3">Product Variants / Options</label>
                    <p className="text-xs text-slate-500 mb-3">Define variants (e.g. Size, Color) here. You can select them at checkout.</p>
                    
                    {/* List Existing Attributes */}
                    <div className="space-y-2 mb-4">
                        {formData.attributes?.map((attr, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                                <div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{attr.name}:</span>
                                    <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">{attr.options.join(', ')}</span>
                                </div>
                                <button type="button" onClick={() => handleRemoveAttribute(idx)} className="text-red-500 hover:text-red-700 p-1">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add New Attribute */}
                    <div className="flex flex-col sm:flex-row gap-3 items-end bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                        <div className="flex-1 w-full">
                            <label className="text-xs text-indigo-700 dark:text-indigo-300 font-bold mb-1 block">Option Name</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Size" 
                                className="w-full px-3 py-1.5 rounded border border-indigo-200 dark:border-indigo-800 text-sm"
                                value={newAttrName}
                                onChange={e => setNewAttrName(e.target.value)}
                            />
                        </div>
                        <div className="flex-[2] w-full">
                            <label className="text-xs text-indigo-700 dark:text-indigo-300 font-bold mb-1 block">Values (comma separated)</label>
                            <input 
                                type="text" 
                                placeholder="e.g. S, M, L, XL" 
                                className="w-full px-3 py-1.5 rounded border border-indigo-200 dark:border-indigo-800 text-sm"
                                value={newAttrValues}
                                onChange={e => setNewAttrValues(e.target.value)}
                            />
                        </div>
                        <button 
                            type="button" 
                            onClick={handleAddAttribute}
                            disabled={!newAttrName || !newAttrValues}
                            className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                        >
                            Add
                        </button>
                    </div>
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="Product details..."
                  ></textarea>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3 border-t border-slate-100 dark:border-slate-700">
            <button
              type="submit"
              form="productForm"
              disabled={isLoading || isUploading}
              className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:w-auto sm:text-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Product'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-lg border border-slate-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
