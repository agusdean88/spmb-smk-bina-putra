import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, type = 'danger' }) => {
  if (!isOpen) return null;

  const colors = {
    danger: {
      icon: 'bg-rose-100 text-rose-600',
      button: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200',
    },
    warning: {
      icon: 'bg-amber-100 text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200',
    }
  };

  const theme = colors[type] || colors.danger;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-zoom-in">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className={`p-3 rounded-2xl ${theme.icon}`}>
              <AlertTriangle size={24} />
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all">
              <X size={20} />
            </button>
          </div>
          
          <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-500 leading-relaxed">{message}</p>
        </div>
        
        <div className="p-6 bg-slate-50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-all shadow-sm"
          >
            Batal
          </button>
          <button 
            onClick={onConfirm}
            className={`flex-1 px-6 py-3 text-white rounded-xl font-bold transition-all shadow-lg ${theme.button}`}
          >
            {confirmText || 'Konfirmasi'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
