
import React, { useState } from 'react';
import { Plan } from '../types';
import { useStore } from '../store/useStore';
import { X, Upload, CheckCircle, Smartphone, Image as ImageIcon, Loader2 } from 'lucide-react';
import { compressImage } from '../services/imageCompression';
import { uploadFile } from '../services/storage';
import { APP_CONFIG } from '../config';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, plan }) => {
  const { submitSubscriptionProof } = useStore();
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressed = await compressImage(file);
        setProofFile(compressed);
        setPreviewUrl(URL.createObjectURL(compressed));
      } catch (err) {
        console.error("Compression failed", err);
        // Fallback to original if compression fails
        setProofFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile) return;

    setIsSubmitting(true);
    try {
      // Upload to Supabase 'proofs' bucket
      // Note: RLS policies in Schema enforce that only Tenant Admins can upload here
      const url = await uploadFile(proofFile, 'proofs');
      
      await submitSubscriptionProof(plan.id, plan.name, plan.price, url); // Pass the Supabase URL
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error(error);
      alert('Failed to submit proof. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md w-full">
          {isSuccess ? (
            <div className="p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Request Submitted!</h3>
              <p className="mt-2 text-slate-500">Your subscription is pending approval. You will be notified once activated.</p>
            </div>
          ) : (
            <div className="bg-white">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-800">Subscribe to {plan.name}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
              </div>

              <div className="p-6 space-y-6">
                {/* Plan Summary */}
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-emerald-900">Amount Due</span>
                    <span className="font-bold text-xl text-emerald-700">PKR {plan.price.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-emerald-600">Plan: {plan.period} Subscription</p>
                </div>

                {/* Payment Details */}
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Smartphone size={18} /> Transfer Money To:
                  </h4>
                  <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-center">
                    <p className="text-2xl font-mono font-bold text-slate-800 tracking-wider select-all">{APP_CONFIG.payment.accountNumber}</p>
                    <p className="text-sm font-medium text-slate-600 mt-1">{APP_CONFIG.payment.accountTitle}</p>
                    
                    <div className="flex justify-center gap-3 mt-4">
                        <img src={APP_CONFIG.assets.logos.jazzcash} className="h-8 object-contain" alt="JazzCash" title="JazzCash" />
                        <img src={APP_CONFIG.assets.logos.easypaisa} className="h-8 object-contain" alt="EasyPaisa" title="EasyPaisa" />
                        <img src={APP_CONFIG.assets.logos.sadapay} className="h-8 object-contain" alt="SadaPay" title="SadaPay" />
                        <img src={APP_CONFIG.assets.logos.nayapay} className="h-8 object-contain" alt="Nayapay" title="Nayapay" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-center">Please transfer the exact amount.</p>
                </div>

                {/* Proof Upload */}
                <form onSubmit={handleSubmit}>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Upload Payment Proof (Screenshot)</label>
                  
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:bg-slate-50 transition-colors relative cursor-pointer">
                    <div className="space-y-1 text-center">
                      {isCompressing ? (
                        <div className="py-8 flex flex-col items-center text-emerald-600">
                           <Loader2 size={24} className="animate-spin mb-2"/>
                           <span className="text-sm font-medium">Optimizing image...</span>
                        </div>
                      ) : previewUrl ? (
                        <div className="relative">
                           <img src={previewUrl} className="mx-auto h-32 object-contain rounded-md" alt="Proof" />
                           <button 
                             type="button" 
                             onClick={(e) => { e.preventDefault(); setProofFile(null); setPreviewUrl(null); }}
                             className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                           >
                             <X size={12}/>
                           </button>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
                          <div className="flex text-sm text-slate-600">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none">
                              <span>Upload a file</span>
                              <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-slate-500">Auto-compressed to WebP</p>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!proofFile || isSubmitting || isCompressing}
                    className="mt-6 w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmitting ? 'Uploading & Submitting...' : 'Submit Payment'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
