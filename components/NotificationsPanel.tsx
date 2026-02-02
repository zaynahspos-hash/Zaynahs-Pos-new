import React from 'react';
import { useStore } from '../store/useStore';
import { X, Check, Bell, AlertTriangle, Info, CheckCircle } from 'lucide-react';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useStore();

  const getIcon = (type: string) => {
    switch(type) {
      case 'WARNING': return <AlertTriangle size={18} className="text-amber-500" />;
      case 'ERROR': return <AlertTriangle size={18} className="text-red-500" />;
      case 'SUCCESS': return <CheckCircle size={18} className="text-emerald-500" />;
      default: return <Info size={18} className="text-blue-500" />;
    }
  };

  return (
    <>
       <div 
         className={`fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
         onClick={onClose}
       />
       <div className={`fixed top-0 right-0 bottom-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col h-full">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <div className="flex items-center gap-2">
                 <Bell size={18} className="text-slate-600" />
                 <h3 className="font-bold text-slate-800">Notifications</h3>
               </div>
               <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                 <X size={20} />
               </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-3">
               {notifications.length === 0 ? (
                 <div className="text-center py-10 text-slate-400">
                   <Bell size={48} className="mx-auto mb-2 opacity-20" />
                   <p>No notifications.</p>
                 </div>
               ) : (
                 notifications.map(n => (
                   <div 
                     key={n.id} 
                     onClick={() => markNotificationRead(n.id)}
                     className={`p-3 rounded-xl border transition-colors cursor-pointer ${n.read ? 'bg-white border-slate-100 opacity-60' : 'bg-indigo-50/50 border-indigo-100'}`}
                   >
                      <div className="flex gap-3">
                         <div className="mt-0.5">{getIcon(n.type)}</div>
                         <div>
                           <h4 className={`text-sm font-semibold ${n.read ? 'text-slate-600' : 'text-slate-800'}`}>{n.title}</h4>
                           <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                           <p className="text-[10px] text-slate-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                         </div>
                      </div>
                   </div>
                 ))
               )}
             </div>

             {notifications.some(n => !n.read) && (
               <div className="p-4 border-t border-slate-100">
                 <button 
                   onClick={() => markAllNotificationsRead()}
                   className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                 >
                   <Check size={16} />
                   Mark all as read
                 </button>
               </div>
             )}
          </div>
       </div>
    </>
  );
};