import React, { useState, useRef } from 'react';
import { Product, Settings } from '../types';
import { X, Printer, Minus, Plus } from 'lucide-react';

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  settings: Settings | null;
}

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({ isOpen, onClose, products, settings }) => {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    products.reduce((acc, p) => ({ ...acc, [p.id]: 1 }), {})
  );
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (!isOpen) return null;

  const updateQty = (id: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta)
    }));
  };

  const handlePrint = () => {
    const content = generatePrintContent();
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-10000px';
    const format = settings?.barcodeLabelFormat || 'A4_30';
    // Set iframe width to match thermal roll width if applicable
    iframe.style.width = format.includes('THERMAL') ? (format === 'THERMAL_50x30' ? '50mm' : '40mm') : '210mm';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(content);
      doc.close();
      
      // Wait for fonts to load
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
           document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  };

  const generatePrintContent = () => {
    const format = settings?.barcodeLabelFormat || 'A4_30';
    const font = settings?.barcodeFormat === 'CODE128' ? '"Libre Barcode 128", cursive' : '"Libre Barcode 39", cursive';
    const showPrice = settings?.barcodeShowPrice ?? true;
    const showName = settings?.barcodeShowName ?? true;

    // Collect all items based on quantities
    const itemsToPrint: Product[] = [];
    products.forEach(p => {
      const qty = quantities[p.id] || 0;
      for(let i=0; i<qty; i++) itemsToPrint.push(p);
    });

    let css = '';
    let body = '';

    if (format === 'A4_30') {
        css = `
            @page { size: A4; margin: 5mm; }
            body { 
                font-family: 'Inter', sans-serif; 
                margin: 0; padding: 0; 
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                grid-auto-rows: 25.4mm; 
                gap: 2mm;
            }
            .label {
                border: 1px dashed #ddd; 
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 2px;
                overflow: hidden;
                box-sizing: border-box;
                height: 100%;
            }
            @media print {
               .label { border: none; outline: 1px dotted #ccc; } 
            }
        `;
    } else {
        // Thermal Roll - Exact dimensions
        const w = format === 'THERMAL_50x30' ? '50mm' : '40mm';
        const h = format === 'THERMAL_50x30' ? '30mm' : '20mm';
        css = `
            @page { size: ${w} ${h}; margin: 0; }
            body { 
                font-family: 'Inter', sans-serif; 
                margin: 0; padding: 1mm;
                width: ${w};
                height: ${h};
            }
            .label {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                page-break-after: always;
                box-sizing: border-box;
            }
            .label:last-child { page-break-after: auto; }
        `;
    }

    body = itemsToPrint.map(p => `
        <div class="label">
            ${showName ? `<div style="font-size: 10px; font-weight: bold; white-space: nowrap; overflow: hidden; width: 95%; text-overflow: ellipsis; line-height: 1.1;">${p.name}</div>` : ''}
            <div style="font-family: ${font}; font-size: ${format.includes('THERMAL') ? '24px' : '36px'}; margin: 0; line-height: 1;">${p.sku}</div>
            <div style="font-size: 9px; font-family: monospace;">${p.sku}</div>
            ${showPrice ? `<div style="font-size: 11px; font-weight: bold; margin-top: 1px;">$${p.price.toFixed(2)}</div>` : ''}
        </div>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Barcodes</title>
            <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+128&family=Libre+Barcode+39&family=Inter:wght@400;600&display=swap" rel="stylesheet">
            <style>${css}</style>
        </head>
        <body>${body}</body>
        </html>
    `;
  };

  const totalLabels = Object.values(quantities).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl relative z-10 flex flex-col max-h-[85vh] border dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Print Barcodes</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Format: {settings?.barcodeLabelFormat || 'A4_30'} • Type: {settings?.barcodeFormat || 'CODE128'}</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X size={20}/></button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-white dark:bg-slate-800">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        <tr>
                            <th className="px-4 py-2">Product</th>
                            <th className="px-4 py-2">SKU</th>
                            <th className="px-4 py-2 text-center">Quantity</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                        {products.map(p => (
                            <tr key={p.id} className="dark:text-slate-200">
                                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{p.name}</td>
                                <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">{p.sku}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-3">
                                        <button onClick={() => updateQty(p.id, -1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400"><Minus size={16}/></button>
                                        <span className="w-8 text-center font-medium">{quantities[p.id] || 0}</span>
                                        <button onClick={() => updateQty(p.id, 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400"><Plus size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Labels: {totalLabels}</span>
                <button 
                    onClick={handlePrint}
                    disabled={totalLabels === 0}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors"
                >
                    <Printer size={18} /> Print Labels
                </button>
            </div>
        </div>
    </div>
  );
};