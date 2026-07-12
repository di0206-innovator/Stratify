import React from 'react';

export default function BentoCard({ 
 children, 
 title, 
 badge, 
 badgeColor = 'bg-emerald-500', 
 className = 'h-full', 
 colSpan = 'col-span-12', 
 rowSpan = '' 
}) {
 return (
 <div className={`os-card flex flex-col justify-between ${colSpan} ${rowSpan} ${className}`}>
 {(title || badge) && (
 <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4 select-none">
 {title && <h2 className="text-sm font-bold tracking-wide uppercase text-gray-800">{title}</h2>}
 {badge && (
 <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm ${badgeColor.replace('bg-', 'bg-opacity-20 text-').replace(']', '').replace('[', '')} bg-gray-100 text-gray-600 border border-gray-200`}>
 {badge}
 </span>
)}
 </div>
)}
 <div className="flex-auto flex flex-col">
 {children}
 </div>
 </div>
);
}
