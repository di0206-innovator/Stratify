import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Radio, FileText, UserCog, TrendingUp, Shield, Users, Cpu, Settings, Calendar, BrainCircuit, Sun, Moon } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';

export default function Navbar({ founderProfile, user, setUser, openAuthModal, theme, setTheme }) {
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = React.useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = React.useState(false);

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
      setIsProfileDropdownOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  React.useEffect(() => {
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [location.pathname]);

  React.useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setActiveDropdown(null);
        setIsMobileMenuOpen(false);
        setIsProfileDropdownOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
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
      { path: '/runway', label: 'Runway Planner', icon: TrendingUp },
      { path: '/equity', label: 'Cap Table', icon: Users },
      { path: '/bounties', label: 'Bounties', icon: Cpu },
      { path: '/opportunities', label: 'Opportunities', icon: UserCog },
      { path: '/timeline', label: 'Timeline', icon: Calendar },
      { path: '/memory', label: 'Founder Memory', icon: BrainCircuit },
    ];
  };

  const getIntelItems = () => {
    const role = founderProfile?.role || 'founder';
    // Always include the intelligence workspace
    const base = [
      { path: '/intelligence', label: 'Insights & Briefs', icon: FileText },
      { path: '/signals', label: 'Market Signals', icon: Radio },
    ];
    if (role === 'institution' || role === 'government') {
      return [
        ...base,
        { path: '/opportunities', label: 'Programs & Grants', icon: UserCog },
        { path: '/timeline', label: 'Timeline', icon: TrendingUp },
      ];
    }
    if (role === 'vc') {
      return [
        ...base,
        { path: '/timeline', label: 'Timeline', icon: TrendingUp },
      ];
    }
    return [
      ...base,
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
    <header className="w-full bg-canvas border-b border-DEFAULT sticky top-12 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 min-h-16 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer">
          <div className="w-7 h-7 rounded-lg bg-surface-dark flex items-center justify-center text-white font-outfit font-black text-sm">
            S
          </div>
          <span className="font-outfit font-black text-base tracking-tight uppercase">
            Stratify
          </span>
          <span className="bg-accent text-[#111] text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider scale-90 flex-shrink-0">
            Beta
          </span>
        </Link>

        <button
          type="button"
          className="inline-flex md:hidden items-center rounded-lg border border-DEFAULT px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-secondary"
          onClick={() => setIsMobileMenuOpen((value) => !value)}
          aria-expanded={isMobileMenuOpen}
          aria-controls="primary-navigation"
          aria-label="Toggle navigation menu"
        >
          Menu
        </button>

        {/* Navigation Tabs */}
        <nav
          id="primary-navigation"
          aria-label="Primary navigation"
          className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex w-full md:w-auto flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-1 md:flex-1 md:justify-center order-3 md:order-none`}
        >
          {activeCoreNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 text-left md:text-center text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'text-black border-black font-black'
                    : 'text-text-secondary hover:text-text-primary border-transparent'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Execution Dropdown */}
          {executionItems.length > 0 && (
            <div className="relative flex items-center">
              <Link
                to="/runway"
                className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
                  executionItems.some(item => location.pathname === item.path)
                    ? 'text-black border-black font-black'
                    : 'text-text-secondary hover:text-text-primary border-transparent'
                }`}
              >
                Execution
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'execution' ? null : 'execution');
                }}
                aria-expanded={activeDropdown === 'execution'}
                aria-haspopup="menu"
                aria-label="Toggle execution dropdown"
                className={`p-2 -ml-1 text-xs font-semibold transition-colors flex items-center cursor-pointer ${
                  executionItems.some(item => location.pathname === item.path)
                    ? 'text-black'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="text-[9px]">▼</span>
              </button>
              {activeDropdown === 'execution' && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-card border border-light shadow-lg z-[100] py-1 rounded-md" role="menu">
                  {executionItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setActiveDropdown(null)}
                        className={`block px-4 py-2 text-xs font-semibold uppercase hover:bg-hover transition-colors ${
                          isActive ? 'text-black font-black bg-hover' : 'text-text-secondary'
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
          <div className="relative flex items-center">
            <Link
              to="/intelligence"
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
                intelItems.some(item => location.pathname === item.path)
                  ? 'text-black border-black font-black'
                  : 'text-text-secondary hover:text-text-primary border-transparent'
              }`}
            >
              Intel & Memory
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdown(activeDropdown === 'intel' ? null : 'intel');
              }}
              aria-expanded={activeDropdown === 'intel'}
              aria-haspopup="menu"
              aria-label="Toggle intel and memory dropdown"
              className={`p-2 -ml-1 text-xs font-semibold transition-colors flex items-center cursor-pointer ${
                intelItems.some(item => location.pathname === item.path)
                  ? 'text-black'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className="text-[9px]">▼</span>
            </button>
            {activeDropdown === 'intel' && (
              <div className="absolute left-0 top-full mt-1 w-48 bg-card border border-light shadow-lg z-[100] py-1 rounded-md" role="menu">
                {intelItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setActiveDropdown(null)}
                      className={`block px-4 py-2 text-xs font-semibold uppercase hover:bg-hover transition-colors ${
                        isActive ? 'text-black font-black bg-hover' : 'text-text-secondary'
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

        {/* Theme Toggle & Profile & Auth Status */}
        <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex w-full md:w-auto items-center justify-between md:justify-end gap-3 flex-shrink-0 order-4 md:order-none relative`}>
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg border border-DEFAULT bg-card hover:bg-hover transition-all cursor-pointer text-text-secondary hover:text-text-primary"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsProfileDropdownOpen(!isProfileDropdownOpen);
                  setActiveDropdown(null);
                }}
                aria-expanded={isProfileDropdownOpen}
                aria-haspopup="menu"
                aria-label="Toggle profile menu"
                className="flex items-center gap-2 p-1 rounded-full border border-DEFAULT hover:border-text-primary bg-card transition-all cursor-pointer shadow-sm select-none"
              >
                <div className="w-8 h-8 rounded-full bg-surface-dark text-accent flex items-center justify-center font-outfit font-black text-xs uppercase shadow-sm">
                  {(user.username || user.email || 'U')[0].toUpperCase()}
                </div>
                <span className="hidden sm:inline font-outfit font-bold text-xs uppercase px-1 text-text-secondary">{user.username || user.email.split('@')[0]}</span>
                <span className="text-[9px] text-text-muted pr-1">▼</span>
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-DEFAULT shadow-xl rounded-xl z-[120] py-2 animate-slide-up" onClick={(e) => e.stopPropagation()}>
                  {/* Profile Header */}
                  <div className="px-4 py-3 border-b border-gray-150">
                    <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Signed in as</p>
                    <p className="text-xs font-bold text-text-primary truncate mt-0.5">{user.email}</p>
                    {founderProfile ? (
                      <span className="inline-block mt-2 px-2.5 py-0.5 bg-accent-muted border border-accent/30 text-text-primary text-[9px] font-black uppercase rounded-md tracking-wider">
                        {founderProfile.role === 'vc' ? 'VC / Investor' : founderProfile.role === 'institution' ? 'Institution Partner' : 'Startup Founder'}
                      </span>
                    ) : (
                      <span className="inline-block mt-2 px-2.5 py-0.5 bg-hover border border-DEFAULT text-text-muted text-[9px] font-black uppercase rounded-md tracking-wider">
                        Profile Pending
                      </span>
                    )}
                  </div>

                  {/* Menu Items */}
                  <div className="py-1 border-b border-DEFAULT">
                    <Link
                      to="/dashboard"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-hover hover:text-text-primary transition-colors"
                    >
                      <LayoutDashboard size={14} className="text-text-muted" />
                      Dashboard Home
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-hover hover:text-text-primary transition-colors"
                    >
                      <Settings size={14} className="text-text-muted" />
                      Settings & Account
                    </Link>
                    <Link
                      to="/onboarding"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-hover hover:text-text-primary transition-colors"
                    >
                      <UserCog size={14} className="text-text-muted" />
                      Switch Workspace Role
                    </Link>
                  </div>

                  <div className="border-t border-gray-150 my-1"></div>

                  {/* Logout */}
                  <div className="px-2 py-1">
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
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
