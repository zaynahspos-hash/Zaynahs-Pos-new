import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const config = { 
      fps: 10, 
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0 
    };
    
    // Safety check to ensure DOM element exists before init
    if (document.getElementById('reader')) {
      scannerRef.current = new Html5QrcodeScanner("reader", config, false);
      
      scannerRef.current.render(
        (decodedText) => {
          onScan(decodedText);
          // Optional: Close on first successful scan
          // onClose(); 
        },
        (errorMessage) => {
          // ignore scan errors, they happen when no code is in frame
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 z-10 bg-white/80 p-2 rounded-full hover:bg-white text-slate-800"
        >
          <X size={20} />
        </button>
        <div className="p-4 bg-slate-900 text-white text-center">
          <h3 className="font-semibold">Scan Product Barcode</h3>
        </div>
        <div id="reader" className="w-full h-auto bg-slate-100 min-h-[300px]"></div>
        <div className="p-4 text-center text-sm text-slate-500">
          Point camera at a barcode or QR code
        </div>
      </div>
    </div>
  );
};