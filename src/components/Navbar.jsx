import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Radio, FileText, UserCog, TrendingUp, Shield, Users, Cpu, Settings, Calendar, BrainCircuit, Sun, Moon, Search } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';

export default function Navbar({ founderProfile, user, setUser, openAuthModal, theme, setTheme }) {
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = React.useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = React.useState(false);

  const email = user?.email ? user.email.toLowerCase() : '';
  const ADMIN_EMAILS = ['divyanshu.b.sinha@gmail.com', 'divyanshusunstone@gmail.com'];
  const isAdmin = user && !!user.emailVerified && (
    user.role === 'admin' || 
    ADMIN_EMAILS.includes(email)
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
    
    const core = [
      { path: '/dashboard', label: 'Workspace', icon: LayoutDashboard },
      { path: '/explore', label: 'Startup Graph', icon: Users },
      { path: '/feed', label: 'Community', icon: Radio },
      { path: '/intelligence', label: 'Intelligence', icon: FileText },
    ];

    if (role === 'founder') {
      core.push({ path: '/opportunities', label: 'Capital', icon: UserCog });
    } else if (role === 'vc' || role === 'angel') {
      core.push({ path: '/signals', label: 'Deal Signals', icon: TrendingUp });
    } else {
      core.push({ path: '/opportunities', label: 'Programs', icon: UserCog });
    }

    if (isAdmin) {
      core.push({ path: '/admin', label: 'Admin', icon: Shield });
    }
    return core;
  };

  const getToolItems = () => {
    return [
      { path: '/runway', label: 'Runway Planner', icon: TrendingUp },
      { path: '/equity', label: 'Cap Table', icon: Users },
      { path: '/bounties', label: 'Bounty Board', icon: Cpu },
      { path: '/timeline', label: 'Milestone Timeline', icon: Calendar },
      { path: '/memory', label: 'Founder Memory', icon: BrainCircuit },
      { path: '/signals', label: 'Market Signals', icon: Radio },
    ];
  };

  const activeCoreNavItems = getNavItems();
  const toolItems = getToolItems();

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
    <header className="w-full bg-canvas/95 backdrop-blur-md border-b border-DEFAULT sticky top-12 z-50 transition-colors">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-3 focus:bg-accent focus:text-black focus:font-bold focus:rounded-md"
      >
        Skip to main content
      </a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer group">
          <div className="w-7 h-7 rounded-lg bg-surface-dark flex items-center justify-center text-white font-outfit font-black text-sm group-hover:scale-105 transition-transform shadow-sm">
            S
          </div>
          <span className="font-outfit font-black text-base tracking-tight uppercase">
            Stratify
          </span>
          <span className="bg-accent text-[#111] text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider scale-90 flex-shrink-0">
            Beta
          </span>
        </Link>

        {/* Mobile menu trigger */}
        <button
          type="button"
          className="inline-flex md:hidden items-center rounded-lg border border-DEFAULT px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-secondary"
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
          className={`${isMobileMenuOpen ? 'flex absolute top-full left-0 right-0 bg-canvas border-b border-DEFAULT p-4 shadow-xl' : 'hidden'} md:flex md:static md:p-0 md:bg-transparent md:border-none md:shadow-none w-full md:w-auto flex-col md:flex-row items-stretch md:items-center gap-1.5 md:gap-1 lg:gap-2 md:flex-1 md:justify-center`}
        >
          {activeCoreNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-2.5 py-1.5 text-left md:text-center text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'text-text-primary border-black dark:border-white font-black'
                    : 'text-text-secondary hover:text-text-primary border-transparent'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Tools Dropdown */}
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdown(activeDropdown === 'tools' ? null : 'tools');
              }}
              aria-expanded={activeDropdown === 'tools'}
              aria-haspopup="menu"
              aria-label="Toggle execution and tools dropdown"
              className={`px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                toolItems.some(item => location.pathname === item.path)
                  ? 'text-text-primary border-black dark:border-white font-black'
                  : 'text-text-secondary hover:text-text-primary border-transparent'
              }`}
            >
              <span>Execution</span>
              <span className="text-[8px] opacity-70">▼</span>
            </button>
            {activeDropdown === 'tools' && (
              <div className="absolute left-0 top-full mt-1.5 w-52 bg-card border border-light shadow-xl z-[100] py-1.5 rounded-xl animate-slide-up" role="menu">
                {toolItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setActiveDropdown(null)}
                      className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold uppercase hover:bg-hover transition-colors ${
                        isActive ? 'text-text-primary font-black bg-hover' : 'text-text-secondary'
                      }`}
                    >
                      <Icon size={13} className="text-text-muted" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Right side controls: Search, Theme Toggle, Profile */}
        <div className={`${isMobileMenuOpen ? 'flex mt-3 pt-3 border-t border-DEFAULT' : 'hidden'} md:flex md:mt-0 md:pt-0 md:border-none items-center justify-end gap-2.5 sm:gap-3 flex-shrink-0 relative`}>
          {/* Cmd+K Search Pill */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-DEFAULT bg-card hover:bg-hover transition-all cursor-pointer text-text-secondary hover:text-text-primary text-xs font-semibold select-none shadow-sm"
          >
            <Search size={13} className="text-text-muted" />
            <span>Search</span>
            <kbd className="font-mono text-[9px] bg-canvas border border-light px-1.5 py-0.5 rounded text-text-muted">⌘K</kbd>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 rounded-full border border-DEFAULT bg-card hover:bg-hover flex items-center justify-center transition-all cursor-pointer text-text-secondary hover:text-text-primary shadow-sm"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
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
                  <div className="px-4 py-3 border-b border-light">
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
                      to="/walkthrough"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-hover hover:text-text-primary transition-colors"
                    >
                      <Calendar size={14} className="text-text-muted" />
                      Book Walkthrough
                    </Link>
                    <Link
                      to="/upgrade"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-hover hover:text-text-primary transition-colors"
                    >
                      <Cpu size={14} className="text-text-muted" />
                      Membership & Tier
                    </Link>
                  </div>

                  <div className="border-t border-light my-1"></div>

                  {/* Logout */}
                  <div className="px-2 py-1">
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/walkthrough"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-DEFAULT text-xs font-semibold uppercase hover:bg-hover transition-colors text-text-secondary"
              >
                <Calendar size={13} className="text-accent" />
                <span>Walkthrough</span>
              </Link>
              <button
                onClick={openAuthModal}
                className="os-btn-primary text-xs py-1.5 px-3.5"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
