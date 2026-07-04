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

 const getNavItems = () => {
 const role = founderProfile?.role || 'founder';
 
 // Core nav items
 const core = [
 { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
 { path: '/explore', label: 'Explore', icon: Users },
 ];
 
 if (role === 'founder' || role === 'vc') {
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
 if (role === 'government') {
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
 colors: ['#EF4444', '#FCD34D', '#3B82F6']
 });
 } catch (err) {
 console.error('Logout failed:', err);
 }
 };

 return (
 <header className="w-full bg-white border-b border-gray-200 select-none sticky top-0 z-50 shadow-sm">
 {/* Top OS Status Bar */}
 <div className="flex items-center justify-between px-6 py-2 border-b border-gray-100 bg-[#F8F7F4]">
 {/* Brand */}
 <Link to="/dashboard" className="flex items-center gap-3 cursor-pointer">
 <div className="w-5 h-5 rounded flex items-center justify-center bg-black text-white font-black text-xs">
 S
 </div>
 <div>
 <span className="font-outfit font-black text-sm tracking-tight uppercase block leading-none">
 Stratify
 </span>
 </div>
 </Link>

 {/* Global OS Status (Replaces massive blocks) */}
 <div className="hidden md:flex items-center gap-6 text-[10px] font-bold uppercase text-gray-500 tracking-wider">
 <div className="flex items-center gap-2">
 <span className="text-black">{stats.startups}</span> STARTUPS
 </div>
 <div className="flex items-center gap-2">
 <span className="text-black">{stats.matches}</span> MATCHES
 </div>
 <div className="flex items-center gap-2">
 <span className="text-black">{stats.updates}</span> UPDATES
 </div>
 <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-700 rounded-sm border border-green-200">
 <span className="relative flex h-1.5 w-1.5">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
 </span>
 <span>SYSTEM IDLE</span>
 </div>
 </div>

 {/* Theme Settings */}
 <div className="flex items-center gap-1">
 <button onClick={() => setTheme('light')} className={`p-1 rounded ${theme === 'light' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Light Mode">
 <Sun size={12} className="text-gray-600" />
 </button>
 <button onClick={() => setTheme('dark')} className={`p-1 rounded ${theme === 'dark' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Dark Mode">
 <Moon size={12} className="text-gray-600" />
 </button>
 </div>
 </div>

 {/* Tabs and Actions Row */}
 <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
 {/* Navigation Tabs */}
 <nav className="flex items-center gap-1 overflow-x-auto hide-scrollbar flex-1">
 {activeCoreNavItems.map((item) => {
 const isActive = location.pathname === item.path;
 return (
 <Link
 key={item.path}
 to={item.path}
 className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors rounded-t-md ${
 isActive
 ? 'text-black border-b-2 border-black font-black bg-gray-50'
 : 'text-gray-500 hover:text-black hover:bg-gray-50'
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
 className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors rounded-t-md flex items-center gap-1.5 cursor-pointer ${
 executionItems.some(item => location.pathname === item.path)
 ? 'text-black border-b-2 border-black font-black bg-gray-50'
 : 'text-gray-500 hover:text-black hover:bg-gray-50'
 }`}
 >
 <span>Execution</span>
 <span className="text-[10px]">▼</span>
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
 className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors rounded-t-md flex items-center gap-1.5 cursor-pointer ${
 intelItems.some(item => location.pathname === item.path)
 ? 'text-black border-b-2 border-black font-black bg-gray-50'
 : 'text-gray-500 hover:text-black hover:bg-gray-50'
 }`}
 >
 <span>Intel & Memory</span>
 <span className="text-[10px]">▼</span>
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
 <span>{founderProfile.role === 'vc' ? 'VC' : founderProfile.role === 'angel' ? 'Angel' : 'Founder'} Workspace</span>
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
