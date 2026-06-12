import React from 'react';

export default function BentoCard({ 
  children, 
  title, 
  badge, 
  badgeColor = 'bg-[#A3E635]', 
  className = '', 
  colSpan = 'col-span-12', 
  rowSpan = '' 
}) {
  return (
    <div className={`neo-card flex flex-col justify-between overflow-hidden h-full ${colSpan} ${rowSpan} ${className}`}>
      {(title || badge) && (
        <div className="flex items-center justify-between border-b-[3px] border-black pb-3 mb-4 select-none">
          {title && <h2 className="text-base sm:text-lg font-black tracking-tight uppercase">{title}</h2>}
          {badge && (
            <span className={`neo-badge ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
      )}
      <div className="flex-1 flex flex-col min-h-0">
        {children}
      </div>
    </div>
  );
}
