import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Radio, FileText, UserCog, TrendingUp } from 'lucide-react';

export default function Navbar({ founderProfile }) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'OS Dashboard', icon: LayoutDashboard },
    { path: '/signals', label: 'Signals Hub', icon: Radio },
    { path: '/runway', label: 'Runway Planner', icon: TrendingUp },
    { path: '/reports', label: 'Reports', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F8F7F4] border-b-[3px] border-black select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-[#A3E635] border-[3px] border-black px-3 py-1 font-outfit font-black text-lg tracking-tighter uppercase transform -rotate-2 group-hover:rotate-0 transition-transform shadow-neo-button">
            NeuralBI
          </div>
          <span className="font-outfit font-black text-sm uppercase tracking-wider hidden sm:inline-block ml-1">
            Founder Strategy OS
          </span>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2 h-full py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-black uppercase border-[3px] border-black transition-all ${
                  isActive
                    ? 'bg-[#C084FC] translate-x-[2px] translate-y-[2px] shadow-none'
                    : 'bg-white hover:bg-[#F1EFEB] shadow-neo-button active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                }`}
              >
                <Icon size={16} />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profile indicator */}
        <div className="flex items-center gap-3">
          {founderProfile ? (
            <Link
              to="/onboarding"
              className="flex items-center gap-2 px-3 py-2 bg-[#F472B6] border-[3px] border-black text-xs font-black uppercase shadow-neo-button hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] transition-all"
            >
              <UserCog size={14} />
              <span className="hidden lg:inline">{founderProfile.industry}</span>
            </Link>
          ) : (
            <Link
              to="/onboarding"
              className="px-3 py-2 bg-[#FB923C] border-[3px] border-black text-xs font-black uppercase shadow-neo-button hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Set Profile
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
