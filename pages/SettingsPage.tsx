
import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Receipt, Printer, RotateCcw, Save, Loader2, CreditCard, Building2, Bell, Lock, Database, Download, Upload, Image as ImageIcon } from 'lucide-react';
import { printReceipt } from '../components/pos/Receipt';
import { ReceiptTemplate, ReceiptWidth } from '../types';
import { uploadFile } from '../services/storage';
import { compressImage } from '../services/imageCompression';

// Internal Components
const Toggle: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
    <button 
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

const ReceiptPreview: React.FC<{
  width: string;
  template: string;
  fontSize: number;
  margin: number;
  logo: string | null;
  tenant: any;
  header: string;
  footer: string;
  showCashier: boolean;
  showCustomer: boolean;
  showSalesPerson: boolean;
  showTax: boolean;
  showBarcode: boolean;
  taxRate: number;
}> = (props) => {
  const widthClass = props.width === '58mm' ? 'w-[58mm]' : (props.width === '80mm' ? 'w-[80mm]' : 'w-[100%]');
  
  return (
    <div className={`bg-white text-black p-4 shadow-lg ${widthClass} text-[12px] font-mono leading-tight mx-auto transition-all duration-300`} style={{ fontFamily: props.template === 'modern' ? 'sans-serif' : 'monospace' }}>
       {/* Header */}
       <div className="text-center mb-2">
          {props.logo && <img src={props.logo} className="h-10 mx-auto mb-1 grayscale opacity-80" alt="Logo"/>}
          <div className="font-bold text-sm">{props.tenant?.name || 'Store Name'}</div>
          <div>{props.tenant?.address || '123 Main St, City'}</div>
          <div>{props.tenant?.phone || 'Tel: 000-000-0000'}</div>
          {props.header && <div className="mt-1 italic border-t border-dashed pt-1">{props.header}</div>}
       </div>

       {/* Meta */}
       <div className="border-b border-dashed border-black pb-1 mb-1">
          <div className="flex justify-between"><span>Date:</span><span>{new Date().toLocaleDateString()}</span></div>
          <div className="flex justify-between font-bold"><span>Order:</span><span>#12345</span></div>
          {props.showSalesPerson && <div className="flex justify-between"><span>Server:</span><span>Alice</span></div>}
          {props.showCashier && <div className="flex justify-between"><span>Cashier:</span><span>Bob</span></div>}
          {props.showCustomer && <div className="flex justify-between font-bold mt-1"><span>Customer:</span><span>John Doe</span></div>}
       </div>

       {/* Items */}
       <table className="w-full text-left mb-2">
          <thead>
             <tr className="border-b border-black">
                <th className="py-1">Item</th>
                <th className="text-center py-1">Qty</th>
                <th className="text-right py-1">Price</th>
             </tr>
          </thead>
          <tbody>
             <tr>
                <td className="py-1">Headphones</td>
                <td className="text-center">1</td>
                <td className="text-right">120.00</td>
             </tr>
             <tr>
                <td className="py-1">USB Cable</td>
                <td className="text-center">2</td>
                <td className="text-right">30.00</td>
             </tr>
          </tbody>
       </table>

       {/* Totals */}
       <div className="border-t border-black pt-1 space-y-1">
          <div className="flex justify-between"><span>Subtotal</span><span>150.00</span></div>
          <div className="flex justify-between text-red-600"><span>Discount</span><span>-10.00</span></div>
          {props.showTax && <div className="flex justify-between"><span>Tax ({(props.taxRate * 100).toFixed(0)}%)</span><span>{(140 * props.taxRate).toFixed(2)}</span></div>}
          <div className="flex justify-between font-bold text-sm border-t border-dashed border-black pt-1 mt-1">
             <span>TOTAL</span>
             <span>{(140 * (1 + props.taxRate)).toFixed(2)}</span>
          </div>
       </div>

       {/* Footer */}
       <div className="text-center mt-3 pt-2 border-t border-dashed border-black">
          {props.footer || 'Thank you!'}
          {props.showBarcode && <div className="mt-2 font-bold tracking-widest text-xs">*ORD-12345*</div>}
       </div>
    </div>
  );
};

const DEFAULT_RECEIPT_SETTINGS = {
  receiptHeader: 'Thank you for shopping!',
  receiptFooter: 'No returns without receipt.\nVisit us again!',
  showLogoOnReceipt: true,
  showCashierOnReceipt: true,
  showSalesPersonOnReceipt: true,
  showCustomerOnReceipt: true,
  showTaxBreakdown: true,
  showBarcode: true,
  autoPrintReceipt: true,
  receiptWidth: '80mm' as ReceiptWidth,
  receiptTemplate: 'modern' as ReceiptTemplate,
  receiptFontSize: 12,
  receiptMargin: 10
};

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, currentTenant, updateTenantProfile, updateUserPassword, user } = useStore();
  const [activeTab, setActiveTab] = useState<'general' | 'receipt' | 'billing' | 'notifications' | 'security' | 'data'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // General Settings State
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('UTC');
  const [taxRate, setTaxRate] = useState('0');
  const [storeName, setStoreName] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeAddress, setStoreAddress] = useState('');

  // Receipt Settings State
  const [receiptHeader, setReceiptHeader] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [showLogo, setShowLogo] = useState(true);
  const [showCashier, setShowCashier] = useState(true);
  const [showSalesPerson, setShowSalesPerson] = useState(true);
  const [showCustomer, setShowCustomer] = useState(true);
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(true);
  
  const [receiptWidth, setReceiptWidth] = useState<ReceiptWidth>('80mm');
  const [receiptTemplate, setReceiptTemplate] = useState<ReceiptTemplate>('modern');
  const [receiptFontSize, setReceiptFontSize] = useState(12);
  const [receiptMargin, setReceiptMargin] = useState(10);

  // Security
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (settings) {
      setCurrency(settings.currency);
      setTimezone(settings.timezone);
      setTaxRate((settings.taxRate * 100).toString());
      
      setReceiptHeader(settings.receiptHeader || '');
      setReceiptFooter(settings.receiptFooter || '');
      setShowLogo(settings.showLogoOnReceipt);
      setShowCashier(settings.showCashierOnReceipt);
      setShowSalesPerson(settings.showSalesPersonOnReceipt);
      setShowCustomer(settings.showCustomerOnReceipt);
      setShowTaxBreakdown(settings.showTaxBreakdown);
      setShowBarcode(settings.showBarcode);
      setAutoPrintReceipt(settings.autoPrintReceipt ?? true);
      
      setReceiptWidth(settings.receiptWidth || '80mm');
      setReceiptTemplate(settings.receiptTemplate || 'modern');
      setReceiptFontSize(settings.receiptFontSize || 12);
      setReceiptMargin(settings.receiptMargin || 10);
    }
    if (currentTenant) {
        setStoreName(currentTenant.name);
        setStorePhone(currentTenant.phone || '');
        setStoreAddress(currentTenant.address || '');
    }
  }, [settings, currentTenant]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (activeTab === 'general') {
         await updateSettings({
            currency,
            timezone,
            taxRate: parseFloat(taxRate) / 100
         });
         // Update Tenant details too
         if (currentTenant) {
             await updateTenantProfile(currentTenant.id, {
                 name: storeName,
                 phone: storePhone,
                 address: storeAddress
             });
         }
      } else if (activeTab === 'receipt') {
         await updateSettings({
            receiptHeader,
            receiptFooter,
            showLogoOnReceipt: showLogo,
            showCashierOnReceipt: showCashier,
            showSalesPersonOnReceipt: showSalesPerson,
            showCustomerOnReceipt: showCustomer,
            showTaxBreakdown,
            showBarcode,
            autoPrintReceipt,
            receiptWidth,
            receiptTemplate,
            receiptFontSize,
            receiptMargin
         });
      } else if (activeTab === 'security') {
         if (newPassword && user) {
             await updateUserPassword(user.id, newPassword);
             alert("Password updated successfully!");
             setNewPassword('');
         }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !currentTenant) return;

      setIsUploadingLogo(true);
      try {
          const compressed = await compressImage(file);
          const url = await uploadFile(compressed, 'logos');
          await updateTenantProfile(currentTenant.id, { logoUrl: url });
      } catch (err) {
          console.error(err);
          alert('Failed to upload logo');
      } finally {
          setIsUploadingLogo(false);
      }
  };

  const handleResetReceiptDefaults = async () => {
    if(confirm('Reset receipt settings to defaults?')) {
        await updateSettings(DEFAULT_RECEIPT_SETTINGS);
    }
  };

  const handleTestPrint = () => {
      // Mock Order for testing print
      const mockOrder: any = {
          id: 'TEST-123',
          createdAt: new Date().toISOString(),
          customerName: 'Test Customer',
          salespersonName: 'Staff Member',
          cashierName: 'Cashier',
          totalAmount: 123.45,
          discountAmount: 0,
          items: [
              { productName: 'Test Item 1', quantity: 1, priceAtTime: 100, type: 'SALE' },
              { productName: 'Test Item 2', quantity: 2, priceAtTime: 11.725, type: 'SALE' }
          ],
          status: 'COMPLETED'
      };
      
      const tempSettings = {
          ...settings,
          receiptHeader, receiptFooter, showLogoOnReceipt: showLogo,
          showCashierOnReceipt: showCashier, showSalesPersonOnReceipt: showSalesPerson,
          showCustomerOnReceipt: showCustomer, showTaxBreakdown, showBarcode,
          receiptWidth, receiptTemplate, receiptFontSize, receiptMargin,
          currency, taxRate: parseFloat(taxRate) / 100,
          id: settings?.id || 'temp', tenantId: settings?.tenantId || 'temp', theme: 'light' as const
      };

      if (currentTenant) {
          printReceipt(mockOrder, currentTenant, tempSettings);
      }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400">Configure your store preferences.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-70"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18} />}
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex md:flex-col overflow-x-auto md:overflow-visible">
           {[
             { id: 'general', label: 'General & Branding', icon: Building2 },
             { id: 'receipt', label: 'Receipt Design', icon: Receipt },
             { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
             { id: 'notifications', label: 'Notifications', icon: Bell },
             { id: 'security', label: 'Security', icon: Lock },
             { id: 'data', label: 'Data Management', icon: Database },
           ].map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)} 
               className={`flex items-center gap-3 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-slate-800 text-emerald-600 border-l-4 border-emerald-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-l-4 border-transparent'}`}
             >
                <tab.icon size={18}/> {tab.label}
             </button>
           ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
           
           {/* GENERAL TAB */}
           {activeTab === 'general' && (
              <div className="max-w-xl space-y-8">
                 {/* Branding Section */}
                 <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Store Identity</h3>
                    <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
                        <div className="h-20 w-20 bg-white dark:bg-slate-600 rounded-lg border border-slate-300 dark:border-slate-500 flex items-center justify-center overflow-hidden relative">
                            {currentTenant?.logoUrl ? (
                                <img src={currentTenant.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <ImageIcon className="text-slate-400" size={32} />
                            )}
                            {isUploadingLogo && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <Loader2 className="text-white animate-spin" size={20} />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium text-slate-800 dark:text-white mb-1">Store Logo</h4>
                            <p className="text-xs text-slate-500 mb-3">Used on receipts and dashboard header. Max 2MB.</p>
                            <label className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                                <Upload size={16} /> Upload New
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploadingLogo} />
                            </label>
                        </div>
                    </div>
                 </div>

                 {/* Basic Info */}
                 <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Store Details</h3>
                    <div className="grid grid-cols-1 gap-4">
                       <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Store Name</label>
                          <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                          <input type="text" value={storePhone} onChange={e => setStorePhone(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" placeholder="+1234567890" />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                          <textarea rows={2} value={storeAddress} onChange={e => setStoreAddress(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" placeholder="123 Main St..." />
                       </div>
                    </div>
                 </div>

                 {/* Regional */}
                 <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Regional & Tax</h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Currency Code</label>
                          <input type="text" value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tax Rate (%)</label>
                          <input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                       </div>
                    </div>
                 </div>
              </div>
           )}

           {/* RECEIPT TAB */}
           {activeTab === 'receipt' && (
              <div className="flex flex-col lg:flex-row gap-8 h-full">
                 <div className="flex-1 space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Receipt Customization</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Tailor the look of your printed receipts.</p>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Receipt Header</label>
                           <textarea rows={2} value={receiptHeader} onChange={e => setReceiptHeader(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" placeholder="e.g. Welcome!" />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Receipt Footer</label>
                           <textarea rows={2} value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" placeholder="e.g. Thank you!" />
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 space-y-1">
                        <Toggle label="Auto-Print Receipt" checked={autoPrintReceipt} onChange={setAutoPrintReceipt} />
                        <div className="h-px bg-slate-200 dark:bg-slate-600 my-2"></div>
                        <Toggle label="Show Store Logo" checked={showLogo} onChange={setShowLogo} />
                        <Toggle label="Show Cashier Name" checked={showCashier} onChange={setShowCashier} />
                        <Toggle label="Show Sales Person" checked={showSalesPerson} onChange={setShowSalesPerson} />
                        <Toggle label="Show Customer" checked={showCustomer} onChange={setShowCustomer} />
                        <Toggle label="Show Tax Breakdown" checked={showTaxBreakdown} onChange={setShowTaxBreakdown} />
                        <Toggle label="Print Barcode" checked={showBarcode} onChange={setShowBarcode} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Paper Width</label>
                           <select value={receiptWidth} onChange={e => setReceiptWidth(e.target.value as ReceiptWidth)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                              <option value="58mm">58mm (Thermal)</option>
                              <option value="80mm">80mm (Thermal)</option>
                              <option value="A4">A4 (Standard)</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Template Style</label>
                           <select value={receiptTemplate} onChange={e => setReceiptTemplate(e.target.value as ReceiptTemplate)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                              <option value="modern">Modern</option>
                              <option value="classic">Classic Mono</option>
                              <option value="bold">Bold Impact</option>
                              <option value="minimal">Minimalist</option>
                           </select>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={handleTestPrint} className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex items-center gap-2 text-sm font-bold border border-indigo-200 dark:border-indigo-800">
                            <Printer size={16}/> Test Print
                        </button>
                        <button type="button" onClick={handleResetReceiptDefaults} className="px-4 py-2 text-sm text-red-600 hover:text-red-700 flex items-center gap-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                            <RotateCcw size={14}/> Reset Defaults
                        </button>
                    </div>
                 </div>

                 {/* Preview Panel */}
                 <div className="w-full lg:w-[400px] bg-slate-100 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col">
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2"><Printer size={14}/> Live Preview</h4>
                     <div className="flex-1 flex items-center justify-center overflow-auto bg-slate-200/50 dark:bg-black/20 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                         <ReceiptPreview 
                            width={receiptWidth}
                            template={receiptTemplate}
                            fontSize={receiptFontSize}
                            margin={receiptMargin}
                            logo={currentTenant?.logoUrl || null}
                            tenant={currentTenant}
                            header={receiptHeader}
                            footer={receiptFooter}
                            showCashier={showCashier}
                            showCustomer={showCustomer}
                            showSalesPerson={showSalesPerson}
                            showTax={showTaxBreakdown}
                            showBarcode={showBarcode}
                            taxRate={parseFloat(taxRate) / 100}
                         />
                     </div>
                 </div>
              </div>
           )}

           {/* BILLING TAB */}
           {activeTab === 'billing' && (
              <div className="max-w-xl space-y-6">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white">Subscription & Plan</h3>
                 <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-700/20">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Current Plan</p>
                    <h2 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{currentTenant?.subscriptionTier}</h2>
                    <div className="mt-4 flex gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${currentTenant?.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {currentTenant?.subscriptionStatus}
                        </span>
                        <span className="text-sm text-slate-500">Expires: {currentTenant?.subscriptionExpiry ? new Date(currentTenant.subscriptionExpiry).toLocaleDateString() : 'Never'}</span>
                    </div>
                 </div>
                 <div className="text-center py-10 text-slate-500">
                     <p>To upgrade or change your plan, please contact sales.</p>
                 </div>
              </div>
           )}

           {/* NOTIFICATIONS TAB */}
           {activeTab === 'notifications' && (
              <div className="max-w-xl space-y-6">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white">Email Notifications</h3>
                 <div className="space-y-4">
                    <Toggle label="Low Stock Alerts" checked={true} onChange={() => {}} />
                    <Toggle label="Daily Sales Summary" checked={false} onChange={() => {}} />
                    <Toggle label="New Order Alerts" checked={true} onChange={() => {}} />
                    <Toggle label="Login Security Alerts" checked={true} onChange={() => {}} />
                 </div>
                 <p className="text-xs text-slate-500 italic mt-4">Note: These are global settings for your account.</p>
              </div>
           )}

           {/* SECURITY TAB */}
           {activeTab === 'security' && (
              <div className="max-w-xl space-y-6">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white">Account Security</h3>
                 <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200 mb-4">
                    <p>Change your login password here. For staff PINs, please visit the <strong>Store Staff</strong> page.</p>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      placeholder="Enter new password"
                    />
                 </div>
                 <div className="pt-2">
                    <p className="text-xs text-slate-500 mb-2">Passwords must be at least 6 characters long.</p>
                 </div>
              </div>
           )}

           {/* DATA TAB */}
           {activeTab === 'data' && (
              <div className="max-w-xl space-y-6">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white">Data Management</h3>
                 <div className="grid gap-4">
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold text-slate-800 dark:text-white">Export Sales Data</h4>
                            <p className="text-xs text-slate-500">Download a CSV of all orders</p>
                        </div>
                        <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium flex items-center gap-2">
                            <Download size={16}/> Export CSV
                        </button>
                    </div>
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold text-slate-800 dark:text-white">Export Product Catalog</h4>
                            <p className="text-xs text-slate-500">Download inventory list</p>
                        </div>
                        <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium flex items-center gap-2">
                            <Download size={16}/> Export CSV
                        </button>
                    </div>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
