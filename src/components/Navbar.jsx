import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Radio, FileText, UserCog, TrendingUp, Shield, Sun, Moon, Terminal, Users, Cpu, Settings } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';

export default function Navbar({ founderProfile, user, setUser, openAuthModal, theme, setTheme }) {
  const location = useLocation();
  const [stats, setStats] = React.useState({ startups: 4, matches: 2, updates: 8 });
  const [isHoveredStat, setIsHoveredStat] = React.useState(null);

  const fetchStats = async () => {
    try {
      const startupsRes = await fetch('/api/startups/trending');
      const startupsData = startupsRes.ok ? await startupsRes.json() : { startups: [] };
      
      const matchesRes = await fetch('/api/matches');
      const matchesData = matchesRes.ok ? await matchesRes.json() : { matches: [] };
      
      const postsRes = await fetch('/api/posts');
      const postsData = postsRes.ok ? await postsRes.json() : { posts: [] };

      setStats({
        startups: startupsData.startups?.length || 4,
        matches: matchesData.matches?.length || 2,
        updates: postsData.posts?.length || 8
      });
    } catch (e) {
      console.warn('Failed to fetch navbar stats:', e);
    }
  };

  React.useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const [activeDropdown, setActiveDropdown] = React.useState(null); // 'execution' | 'intel' | null

  React.useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdown(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const coreNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/explore', label: 'Explore', icon: Users },
    { path: '/reports', label: 'Insights & Briefs', icon: FileText },
    { path: '/feed', label: 'Feed', icon: Radio },
  ];

  const executionItems = [
    { path: '/runway', label: 'Runway', icon: TrendingUp },
    { path: '/equity', label: 'Cap Table', icon: Users },
    { path: '/bounties', label: 'Bounties', icon: Cpu },
    { path: '/opportunities', label: 'Opportunities', icon: UserCog },
  ];

  const intelItems = [
    { path: '/signals', label: 'Signals', icon: Radio },
    { path: '/memory', label: 'Memory', icon: Cpu },
    { path: '/timeline', label: 'Timeline', icon: TrendingUp },
  ];

  const email = user && user.email ? user.email.toLowerCase() : '';
  const isAdmin = user && (
    user.role === 'admin' || 
    email === 'divyanshu.b.sinha@gmail.com' || 
    email === 'divyanshusunstone@gmail.com' ||
    email.startsWith('admin@')
  );

  const activeCoreNavItems = isAdmin 
    ? [...coreNavItems, { path: '/admin', label: 'Admin Console', icon: Shield }]
    : coreNavItems;

  const handleLogout = async () => {
    try {
      if (window.Clerk) {
        await window.Clerk.signOut();
      } else if (supabase) {
        await supabase.auth.signOut();
      }
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      confetti({
        particleCount: 30,
        spread: 30,
        colors: ['#EF4444', '#FCD34D', '#3B82F6']
      });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <header className="w-full bg-white border-b-[4px] border-black select-none sticky top-0 z-50">
      {/* Top Segmented Column Stats Grid */}
      <div className="grid grid-cols-12 border-b-[4px] border-black text-black">
        {/* Brand Segment */}
        <Link to="/dashboard" className="col-span-12 lg:col-span-4 flex items-center px-5 py-3.5 border-b-[4px] lg:border-b-0 lg:border-r-[4px] border-black bg-white cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="relative w-8 h-8 mr-3.5 flex-shrink-0">
            <div className="absolute w-5 h-5 rounded-full bg-[#EF4444] border-2 border-black -top-1 -right-1" />
            <svg className="absolute w-6 h-6 bottom-0 left-0" viewBox="0 0 100 100">
              <polygon points="50,10 90,90 10,90" stroke="black" strokeWidth="12" fill="#FCD34D" />
            </svg>
          </div>
          <div>
            <span className="font-outfit font-black text-xl tracking-tighter uppercase block leading-none">
              Stratify
            </span>
            <span className="font-outfit font-black text-[9px] uppercase tracking-widest text-gray-500 block mt-0.5">
              Recursive . Global Startup . OS
            </span>
          </div>
        </Link>

        {/* Startups Stat */}
        <div 
          className="col-span-3 lg:col-span-2 flex flex-col items-center justify-center p-2.5 border-r-[4px] border-black bg-white transition-all"
          onMouseEnter={() => setIsHoveredStat('startups')}
          onMouseLeave={() => setIsHoveredStat(null)}
          style={{ transform: isHoveredStat === 'startups' ? 'scale(1.02)' : 'none' }}
        >
          <span className="font-outfit font-black text-xl lg:text-2xl leading-none">
            {stats.startups}
          </span>
          <span className="font-outfit font-black text-[8px] uppercase tracking-wider text-gray-500 mt-1">
            Startups
          </span>
        </div>

        {/* Matches Stat */}
        <div 
          className="col-span-3 lg:col-span-2 flex flex-col items-center justify-center p-2.5 border-r-[4px] border-black bg-[#FCD34D] text-black transition-all"
          onMouseEnter={() => setIsHoveredStat('matches')}
          onMouseLeave={() => setIsHoveredStat(null)}
          style={{ transform: isHoveredStat === 'matches' ? 'scale(1.02)' : 'none' }}
        >
          <span className="font-outfit font-black text-xl lg:text-2xl leading-none">
            {stats.matches}
          </span>
          <span className="font-outfit font-black text-[8px] uppercase tracking-wider text-black mt-1">
            Matches
          </span>
        </div>

        {/* Updates Stat */}
        <div 
          className="col-span-3 lg:col-span-2 flex flex-col items-center justify-center p-2.5 border-r-[4px] border-black bg-[#3B82F6] text-white transition-all"
          onMouseEnter={() => setIsHoveredStat('updates')}
          onMouseLeave={() => setIsHoveredStat(null)}
          style={{ transform: isHoveredStat === 'updates' ? 'scale(1.02)' : 'none' }}
        >
          <span className="font-outfit font-black text-xl lg:text-2xl leading-none">
            {stats.updates}
          </span>
          <span className="font-outfit font-black text-[8px] uppercase tracking-wider text-white/90 mt-1">
            Updates
          </span>
        </div>

        {/* AI Engine Status */}
        <div className="col-span-3 lg:col-span-1 flex flex-col items-center justify-center p-2.5 border-r-[4px] border-black bg-[#EF4444] text-white">
          <span className="font-outfit font-black text-xs uppercase leading-none">
            Gemini
          </span>
          <span className="font-outfit font-black text-[8px] uppercase tracking-wider text-white/95 mt-1">
            AI Engine
          </span>
        </div>

        {/* State Indicator */}
        <div className="col-span-6 lg:col-span-1 flex items-center justify-center p-2.5 bg-white border-r-[4px] lg:border-r-0 border-black">
          <span className="relative flex h-2 w-2 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="font-outfit font-black text-[10px] uppercase">
            IDLE
          </span>
        </div>

        {/* Settings/Theme toggler inside grid */}
        <div className="col-span-6 lg:col-span-1 flex items-center justify-center p-2.5 bg-white border-t-[4px] lg:border-t-0 border-black">
          <div className="flex items-center border-2 border-black bg-white select-none">
            <button
              onClick={() => setTheme('light')}
              className={`p-1.5 transition-colors ${theme === 'light' ? 'bg-[#FCD34D]' : 'hover:bg-gray-100'} border-r-2 border-black cursor-pointer`}
              title="Light"
            >
              <Sun size={11} className="text-black" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-1.5 transition-colors ${theme === 'dark' ? 'bg-[#3B82F6]' : 'hover:bg-gray-100'} cursor-pointer`}
              title="Dark"
            >
              <Moon size={11} className="text-black" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs and Actions Row */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2.5 py-1.5 overflow-visible flex-wrap md:flex-nowrap flex-1">
          {activeCoreNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex-shrink-0 px-4 py-2 text-xs font-black uppercase border-[3px] border-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                  isActive
                    ? 'bg-[#EF4444] text-white shadow-none translate-x-[2px] translate-y-[2px] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none'
                    : 'bg-white text-black hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Execution Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdown(activeDropdown === 'execution' ? null : 'execution');
              }}
              className={`flex-shrink-0 px-4 py-2 text-xs font-black uppercase border-[3px] border-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 cursor-pointer ${
                executionItems.some(item => location.pathname === item.path)
                  ? 'bg-[#3B82F6] text-white'
                  : 'bg-white text-black hover:bg-gray-50'
              }`}
            >
              <span>Execution</span>
              <span className="text-[10px]">▼</span>
            </button>
            {activeDropdown === 'execution' && (
              <div className="absolute left-0 mt-2 w-48 bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-[100] py-1">
                {executionItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setActiveDropdown(null)}
                      className={`block px-4 py-2 text-xs font-black uppercase hover:bg-gray-100 transition-colors border-b-2 border-black last:border-b-0 ${
                        isActive ? 'bg-[#3B82F6]/20 text-[#3B82F6]' : 'text-black'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Memory & Intel Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdown(activeDropdown === 'intel' ? null : 'intel');
              }}
              className={`flex-shrink-0 px-4 py-2 text-xs font-black uppercase border-[3px] border-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 cursor-pointer ${
                intelItems.some(item => location.pathname === item.path)
                  ? 'bg-[#C084FC] text-black'
                  : 'bg-white text-black hover:bg-gray-50'
              }`}
            >
              <span>Intel & Memory</span>
              <span className="text-[10px]">▼</span>
            </button>
            {activeDropdown === 'intel' && (
              <div className="absolute left-0 mt-2 w-48 bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-[100] py-1">
                {intelItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setActiveDropdown(null)}
                      className={`block px-4 py-2 text-xs font-black uppercase hover:bg-gray-100 transition-colors border-b-2 border-black last:border-b-0 ${
                        isActive ? 'bg-[#C084FC]/25 text-[#C084FC] font-black' : 'text-black'
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
              className="flex items-center gap-2 px-3 py-2 bg-[#FCD34D] border-[3px] border-black text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <UserCog size={13} />
              <span>{founderProfile.role === 'vc' ? 'VC' : founderProfile.role === 'angel' ? 'Angel' : 'Founder'} Workspace</span>
            </Link>
          ) : (
            <Link
              to="/onboarding"
              className="px-3 py-2 bg-[#FCD34D] border-[3px] border-black text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Set Profile
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/settings" className="flex items-center gap-1.5 text-[10px] font-black uppercase border-[3px] border-black px-2.5 py-2 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all" title="Settings & Account">
                <Settings size={12} />
                <span className="hidden sm:inline">{user.username || user.email}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-white border-[3px] border-black text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="px-4 py-2 bg-[#3B82F6] text-white border-[3px] border-black text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
