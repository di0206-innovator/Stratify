import React from 'react';

export default function BentoCard({ 
 children, 
 title, 
 badge, 
 badgeColor = 'bg-emerald-500', 
 className = 'h-auto', 
 colSpan = 'col-span-12', 
 rowSpan = '' 
}) {
 return (
 <div className={`os-card flex flex-col ${colSpan} ${rowSpan} ${className}`}>
 {(title || badge) && (
 <div className="flex items-center justify-between border-b border-light pb-3 mb-4 select-none flex-shrink-0">
 {title && <h2 className="text-sm font-bold tracking-wide uppercase text-text-primary">{title}</h2>}
 {badge && (
 <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm border ${
    badgeColor.includes('text-') ? badgeColor : `${badgeColor} text-white border-transparent`
  }`}>
 {badge}
 </span>
)}
 </div>
)}
 <div className="flex flex-col w-full min-h-0">
 {children}
 </div>
 </div>
);
}
