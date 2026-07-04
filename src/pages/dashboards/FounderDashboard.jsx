import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
 Play, Compass, MapPin, FileText, ArrowRight, BookOpen, ExternalLink, Activity, Target, Zap, Clock, TrendingUp
} from 'lucide-react';
import AgentConsole from '../../components/AgentConsole';

export default function FounderDashboard({ founderProfile, user, openAuthModal, currentReport, setCurrentReport }) {
 const [myStartup, setMyStartup] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const fetchData = async () => {
 try {
 const myStartupRes = await fetch('/api/startups/my');
 if (myStartupRes.ok) {
 const msData = await myStartupRes.json();
 setMyStartup(msData.startup);
 }
 } catch (err) {
 console.error('Failed to load startup data:', err);
 } finally {
 setLoading(false);
 }
 };
 fetchData();
 }, []);

 return (
 <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
 {/* Header Area */}
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
 <div>
 <div className="flex items-center gap-3 mb-2">
 <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded tracking-wider">
 Founder OS
 </span>
 <span className="text-sm font-medium text-gray-500">Status: Active</span>
 </div>
 <h1 className="text-3xl font-bold tracking-tight text-gray-900">
 {myStartup ? myStartup.name : founderProfile.name}
 </h1>
 <p className="text-gray-500 mt-1 max-w-xl text-sm leading-relaxed">
 {myStartup ? myStartup.pitch : 'Initialize your startup graph to unlock automated intelligence.'}
 </p>
 </div>
 <div className="flex items-center gap-3">
 <Link to="/startups/my" className="os-btn">
 View Public Profile
 </Link>
 <button className="os-btn-primary">
 New Strategic Action
 </button>
 </div>
 </div>

 {/* Main Grid */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Left Column: Quick Actions & Agent */}
 <div className="lg:col-span-1 space-y-6">
 <div className="os-card bg-gray-900 text-white border-0 shadow-lg relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
 <Zap size={120} />
 </div>
 <div className="relative z-10">
 <h3 className="font-bold text-lg mb-1">Intelligence Agent</h3>
 <p className="text-gray-400 text-xs mb-6 max-w-[200px] leading-relaxed">
 Generate reports, validate hypotheses, or analyze competitors instantly.
 </p>
 <Link to="/reports" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold text-xs rounded hover:bg-gray-100 transition-colors">
 Open Workspace <ArrowRight size={14} />
 </Link>
 </div>
 </div>

 <div className="os-card p-0 overflow-hidden flex flex-col">
 <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
 <Compass size={16} className="text-gray-500" />
 <h3 className="font-bold text-sm">Strategic Modules</h3>
 </div>
 <div className="divide-y divide-gray-100">
 <ModuleLink to="/runway" icon={TrendingUp} title="Runway Planner" desc="Simulate burn & scenarios" />
 <ModuleLink to="/equity" icon={Target} title="Equity Planner" desc="Manage cap table splits" />
 <ModuleLink to="/memory" icon={BookOpen} title="Founder Memory" desc="Log validated hypotheses" />
 <ModuleLink to="/bounties" icon={Zap} title="Micro Bounties" desc="Outsource small tasks" />
 </div>
 </div>
 </div>

 {/* Right Column: Timeline & Signals */}
 <div className="lg:col-span-2 space-y-6">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 <div className="os-card flex flex-col">
 <div className="flex items-center gap-2 mb-4">
 <Clock size={18} className="text-blue-500" />
 <h3 className="font-bold">Timeline</h3>
 </div>
 <p className="text-xs text-gray-500 mb-6 flex-1">
 Log critical company milestones, product launches, and fundraises to your graph.
 </p>
 <Link to="/timeline" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
 View Timeline <ArrowRight size={14} />
 </Link>
 </div>

 <div className="os-card flex flex-col">
 <div className="flex items-center gap-2 mb-4">
 <Activity size={18} className="text-purple-500" />
 <h3 className="font-bold">Market Signals</h3>
 </div>
 <p className="text-xs text-gray-500 mb-6 flex-1">
 Monitor competitors, ecosystem news, and funding rounds relevant to your industry.
 </p>
 <Link to="/signals" className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1">
 Explore Signals <ArrowRight size={14} />
 </Link>
 </div>
 </div>

 <div className="os-card min-h-[300px]">
 <div className="flex items-center justify-between mb-6">
 <h3 className="font-bold">Active Briefs & Reports</h3>
 <Link to="/reports" className="text-xs text-gray-500 hover:text-gray-900 font-medium">View All</Link>
 </div>
 
 {/* Empty State */}
 <div className="flex flex-col items-center justify-center py-12 text-center">
 <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
 <FileText size={20} className="text-gray-400" />
 </div>
 <h4 className="font-semibold text-gray-900 mb-1">No Active Reports</h4>
 <p className="text-xs text-gray-500 max-w-sm mb-4">
 Start a new intelligence task to generate market research, validate a pivot, or prepare an investor memo.
 </p>
 <Link to="/reports" className="os-btn">
 Create Report
 </Link>
 </div>
 </div>
 </div>
 </div>
 </div>
);
}

function ModuleLink({ to, icon: Icon, title, desc }) {
 return (
 <Link to={to} className="group flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors">
 <div className="p-2 bg-white border border-gray-200 rounded-md text-gray-500 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
 <Icon size={18} />
 </div>
 <div className="flex-1">
 <h4 className="font-semibold text-sm text-gray-900 mb-0.5 group-hover:text-blue-600 transition-colors">{title}</h4>
 <p className="text-xs text-gray-500">{desc}</p>
 </div>
 </Link>
);
}
