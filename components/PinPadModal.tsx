import React, { useState } from 'react';
import { X, Delete, Lock, Check } from 'lucide-react';

interface PinPadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
  title?: string;
  description?: string;
  verifyMode?: boolean; // If true, checks against current user PIN logic in parent
}

export const PinPadModal: React.FC<PinPadModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  title = "Security Verification", 
  description = "Enter your 4-digit PIN to continue" 
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleSubmit = () => {
    if (pin.length === 4) {
      onSuccess(pin);
      // Don't close or clear here immediately, let parent handle logic (success/fail)
      // But typically we clear state if parent decides to keep modal open (retry)
      // For this implementation, we assume parent closes modal on success.
    } else {
        setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs relative z-10 overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-slate-50 p-6 text-center border-b border-slate-100">
           <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
              <Lock className="text-indigo-600" size={24} />
           </div>
           <h3 className="text-lg font-bold text-slate-800">{title}</h3>
           <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>

        {/* Display */}
        <div className="py-6 flex justify-center">
           <div className="flex gap-4">
              {[0, 1, 2, 3].map((i) => (
                 <div 
                   key={i} 
                   className={`w-4 h-4 rounded-full transition-all duration-200 ${pin.length > i ? 'bg-indigo-600 scale-110' : 'bg-slate-200'} ${error ? 'bg-red-500 animate-shake' : ''}`}
                 />
              ))}
           </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-px bg-slate-100 border-t border-slate-200">
           {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                className="bg-white p-6 text-xl font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors focus:outline-none"
              >
                {num}
              </button>
           ))}
           <button 
             onClick={() => setPin('')}
             className="bg-white p-6 text-sm font-medium text-slate-400 hover:bg-slate-50 active:bg-slate-100 transition-colors focus:outline-none flex items-center justify-center"
           >
             Clear
           </button>
           <button
             onClick={() => handleNumberClick('0')}
             className="bg-white p-6 text-xl font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors focus:outline-none"
           >
             0
           </button>
           <button 
             onClick={handleDelete}
             className="bg-white p-6 text-slate-400 hover:text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors focus:outline-none flex items-center justify-center"
           >
             <Delete size={24} />
           </button>
        </div>

        {/* Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
           <button 
             onClick={onClose}
             className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
           >
             Cancel
           </button>
           <button 
             onClick={handleSubmit}
             disabled={pin.length !== 4}
             className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
           >
             <Check size={18} /> Confirm
           </button>
        </div>
      </div>
    </div>
  );
};