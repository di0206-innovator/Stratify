import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function BetaBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('stratify_beta_banner_dismissed');
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('stratify_beta_banner_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="w-full bg-[#1A1A1A] text-white py-2 px-4 text-xs font-medium select-none flex items-center justify-between z-55 sticky top-0 border-b border-gray-800">
      <div className="flex-1 flex items-center justify-center gap-2 text-center">
        <span className="bg-[#C8E64A] text-black text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider scale-90 flex-shrink-0">
          Beta OS
        </span>
        <span className="text-gray-300">
          Stratify is in active beta production. Features are subject to major updates.
        </span>
        <a 
          href="https://www.linkedin.com/in/divyanshu-sinha-46074126b/"
          target="_blank"
          rel="noopener noreferrer" 
          className="text-[#C8E64A] hover:underline underline-offset-2 font-semibold ml-1 inline-flex items-center gap-0.5"
        >
          Report Issues
        </a>
      </div>
      <button 
        onClick={handleDismiss} 
        className="text-gray-400 hover:text-white transition-colors cursor-pointer p-0.5 rounded hover:bg-gray-800 flex-shrink-0"
        aria-label="Dismiss banner"
      >
        <X size={14} />
      </button>
    </div>
  );
}
