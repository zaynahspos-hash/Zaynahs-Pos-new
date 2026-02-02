import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Check, Edit2, Shield, Star, Clock } from 'lucide-react';
import { SubscriptionModal } from '../../components/SubscriptionModal';
import { Plan, Role } from '../../types';

export const SubscriptionPlans: React.FC = () => {
  const { plans, user, currentTenant } = useStore();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const handleSubscribe = (plan: Plan) => {
    setSelectedPlan(plan);
  };

  const isSuperAdmin = user?.role === Role.SUPER_ADMIN;

  return (
    <div className="space-y-8 pb-10">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900">Simple, Transparent Pricing</h1>
        <p className="text-slate-500 mt-2">Choose the plan that fits your business needs. Upgrade anytime.</p>
        
        {currentTenant?.subscriptionStatus === 'PENDING_APPROVAL' && (
           <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg inline-block text-sm font-medium">
              You have a pending subscription request. Waiting for admin approval.
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`bg-white rounded-2xl shadow-sm border flex flex-col overflow-hidden relative transition-all hover:shadow-lg ${plan.highlight ? 'border-indigo-500 ring-2 ring-indigo-500 ring-offset-2 scale-105 z-10' : 'border-slate-200'}`}
          >
             {plan.highlight && (
                <div className="bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider py-1.5 text-center">
                   Best Value
                </div>
             )}
             
             {isSuperAdmin && (
               <div className="absolute top-4 right-4 opacity-50 hover:opacity-100 transition-opacity">
                  <button className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg">
                      <Edit2 size={16} />
                  </button>
               </div>
             )}

            <div className="p-8 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
              <p className="text-sm text-slate-500 mt-1 h-10">{plan.description}</p>
              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-extrabold text-slate-900">
                   {plan.price === 0 ? 'Free' : `Rs ${plan.price.toLocaleString()}`}
                </span>
                {plan.price > 0 && <span className="ml-1 text-slate-500 text-sm">/{plan.period === 'Monthly' ? 'mo' : (plan.period === 'Quarterly' ? 'qtr' : 'yr')}</span>}
              </div>
            </div>
            
            <div className="flex-1 p-8 bg-slate-50/30 flex flex-col">
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-emerald-500" />
                    </div>
                    <p className="ml-3 text-sm text-slate-700">{feature}</p>
                  </li>
                ))}
                <li className="flex items-start pt-4 border-t border-slate-100">
                   <div className="flex-shrink-0">
                      <Shield className="h-5 w-5 text-indigo-400" />
                   </div>
                   <div className="ml-3 text-sm">
                      <span className="font-semibold text-slate-900">Limits:</span>
                      <p className="text-slate-500">{plan.maxUsers} Users • {plan.maxProducts} Products</p>
                   </div>
                </li>
              </ul>
              
              {!isSuperAdmin && (
                 <button 
                   onClick={() => handleSubscribe(plan)}
                   disabled={currentTenant?.subscriptionTier === plan.tier}
                   className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                      currentTenant?.subscriptionTier === plan.tier 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : (plan.highlight ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400')
                   }`}
                 >
                    {currentTenant?.subscriptionTier === plan.tier ? 'Current Plan' : 'Select Plan'}
                 </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <SubscriptionModal 
          isOpen={!!selectedPlan} 
          onClose={() => setSelectedPlan(null)} 
          plan={selectedPlan} 
        />
      )}
    </div>
  );
};