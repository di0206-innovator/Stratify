import React, { useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const styles = {
    success: 'bg-green-500/10 border-green-500/30 text-green-800',
    error: 'bg-red-500/10 border-red-500/30 text-red-800',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-800',
  };

  const icons = {
    success: <CheckCircle2 size={18} className="text-green-500" />,
    error: <AlertCircle size={18} className="text-red-500" />,
    info: <Info size={18} className="text-blue-500" />,
  };

  return (
    <div 
      role="status" 
      aria-live="polite" 
      className={`fixed bottom-6 right-6 flex items-start gap-3 p-4 border rounded-xl shadow-lg z-50 animate-slide-up ${styles[type]}`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {icons[type]}
      </div>
      <div className="flex-1 mr-4 font-inter text-sm font-medium">
        {message}
      </div>
      <button 
        onClick={onClose} 
        aria-label="Close notification" 
        className="opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
      >
        <X size={16} />
      </button>
    </div>
  );
}
