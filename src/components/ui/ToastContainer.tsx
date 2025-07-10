import React from 'react';
import { useToastStore } from '@/stores/toastStore';

const ToastContainer: React.FC = () => {
  const toasts = useToastStore(s => s.toasts);

  return (
    <div className="fixed top-4 right-4 z-[10000] space-y-2">
      {toasts.map(t => (
        <div key={t.id} className={`px-4 py-2 rounded shadow-lg text-white animate-fade-in ${
          t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-red-600' : 'bg-slate-700'
        }`}>
          {t.message}
        </div>
      ))}
    </div>
  );
};

export default ToastContainer; 