import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Radio, FileText, UserCog, TrendingUp, Shield, Users, Cpu, Settings } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';

export default function Navbar({ founderProfile, user, setUser, openAuthModal, theme, setTheme }) {
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = React.useState(null);

  const email = user?.email ? user.email.toLowerCase() : '';
  const isAdmin = user && (
    user.role === 'admin' || 
    email === 'divyanshu.b.sinha@gmail.com' || 
    email === 'divyanshusunstone@gmail.com' ||
    email.startsWith('admin@')
  );

  React.useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdown(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const getNavItems = () => {
    const role = founderProfile?.role || 'founder';
    
    // Core nav items
    const core = [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/explore', label: 'Explore', icon: Users },
    ];
    
    if (role === 'founder' || role === 'vc' || role === 'institution') {
      core.push({ path: '/intelligence', label: 'Insights & Briefs', icon: FileText });
    }
    
    core.push({ path: '/feed', label: 'Feed', icon: Radio });
    
    if (isAdmin) {
      core.push({ path: '/admin', label: 'Admin Console', icon: Shield });
    }
    return core;
  };

  const getExecutionItems = () => {
    const role = founderProfile?.role || 'founder';
    if (role !== 'founder') return [];
    return [
      { path: '/runway', label: 'Runway', icon: TrendingUp },
      { path: '/equity', label: 'Cap Table', icon: Users },
      { path: '/bounties', label: 'Bounties', icon: Cpu },
      { path: '/opportunities', label: 'Opportunities', icon: UserCog },
    ];
  };

  const getIntelItems = () => {
    const role = founderProfile?.role || 'founder';
    if (role === 'institution' || role === 'government') {
      return [
        { path: '/opportunities', label: 'Programs & Grants', icon: UserCog },
        { path: '/timeline', label: 'Timeline', icon: TrendingUp },
      ];
    }
    if (role === 'vc') {
      return [
        { path: '/signals', label: 'Signals', icon: Radio },
        { path: '/timeline', label: 'Timeline', icon: TrendingUp },
      ];
    }
    return [
      { path: '/signals', label: 'Signals', icon: Radio },
      { path: '/memory', label: 'Memory', icon: Cpu },
      { path: '/timeline', label: 'Timeline', icon: TrendingUp },
    ];
  };

  const activeCoreNavItems = getNavItems();
  const executionItems = getExecutionItems();
  const intelItems = getIntelItems();

  const handleLogout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      confetti({
        particleCount: 30,
        spread: 30,
        colors: ['#C8E64A', '#FAF9F6', '#111111']
      });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <header className="w-full bg-[#FAF9F6] border-b border-gray-200 select-none sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer">
          <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] flex items-center justify-center text-white font-outfit font-black text-sm">
            S
          </div>
          <span className="font-outfit font-black text-base tracking-tight uppercase">
            Stratify
          </span>
          <span className="bg-[#C8E64A] text-black text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider scale-90 flex-shrink-0">
            Beta
          </span>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto hide-scrollbar flex-1 justify-center">
          {activeCoreNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                  isActive
                    ? 'text-black border-black font-black'
                    : 'text-gray-500 hover:text-black border-transparent'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Execution Dropdown */}
          {executionItems.length > 0 && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'execution' ? null : 'execution');
                }}
                className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1 cursor-pointer ${
                  executionItems.some(item => location.pathname === item.path)
                    ? 'text-black border-black font-black'
                    : 'text-gray-500 hover:text-black border-transparent'
                }`}
              >
                <span>Execution</span>
                <span className="text-[9px]">▼</span>
              </button>
              {activeDropdown === 'execution' && (
                <div className="absolute left-0 mt-1 w-48 bg-white border border-gray-200 shadow-lg z-[100] py-1 rounded-md">
                  {executionItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setActiveDropdown(null)}
                        className={`block px-4 py-2 text-xs font-semibold uppercase hover:bg-gray-50 transition-colors ${
                          isActive ? 'text-black font-black bg-gray-50' : 'text-gray-600'
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Memory & Intel Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdown(activeDropdown === 'intel' ? null : 'intel');
              }}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1 cursor-pointer ${
                intelItems.some(item => location.pathname === item.path)
                  ? 'text-black border-black font-black'
                  : 'text-gray-500 hover:text-black border-transparent'
              }`}
            >
              <span>Intel & Memory</span>
              <span className="text-[9px]">▼</span>
            </button>
            {activeDropdown === 'intel' && (
              <div className="absolute left-0 mt-1 w-48 bg-white border border-gray-200 shadow-lg z-[100] py-1 rounded-md">
                {intelItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setActiveDropdown(null)}
                      className={`block px-4 py-2 text-xs font-semibold uppercase hover:bg-gray-50 transition-colors ${
                        isActive ? 'text-black font-black bg-gray-50' : 'text-gray-600'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Profile & Auth Status */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {founderProfile ? (
            <Link
              to="/onboarding"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors"
            >
              <UserCog size={14} />
              <span className="hidden sm:inline">{founderProfile.role === 'vc' ? 'VC' : founderProfile.role === 'angel' ? 'Angel' : 'Founder'} Workspace</span>
            </Link>
          ) : (
            <Link
              to="/onboarding"
              className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors"
            >
              Set Profile
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/settings" className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-black transition-colors" title="Settings & Account">
                <Settings size={14} />
                <span className="hidden sm:inline">{user.username || user.email}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="os-btn bg-white border-gray-300 hover:bg-gray-50 text-xs py-1"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="os-btn-primary text-xs py-1.5"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
