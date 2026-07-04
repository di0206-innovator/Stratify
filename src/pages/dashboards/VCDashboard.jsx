import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
 Users, Activity, TrendingUp, Search, Crosshair, ArrowRight, MapPin, Target, Briefcase
} from 'lucide-react';

export default function VCDashboard({ founderProfile, user }) {
 const [trendingStartups, setTrendingStartups] = useState([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const fetchData = async () => {
 try {
 const res = await fetch('/api/startups/trending');
 if (res.ok) {
 const data = await res.json();
 setTrendingStartups(data.startups || []);
 }
 } catch (err) {
 console.error('Failed to load trending startups:', err);
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
 <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold uppercase rounded tracking-wider">
 Investor OS
 </span>
 <span className="text-sm font-medium text-gray-500">Pipeline Active</span>
 </div>
 <h1 className="text-3xl font-bold tracking-tight text-gray-900">
 {founderProfile.name}
 </h1>
 <p className="text-gray-500 mt-1 max-w-xl text-sm leading-relaxed">
 Manage your deal flow, monitor portfolio signals, and discover new founders matching your {founderProfile.industry} thesis.
 </p>
 </div>
 <div className="flex items-center gap-3">
 <Link to="/explore" className="os-btn-primary">
 <Search size={16} /> Explore Graph
 </Link>
 </div>
 </div>

 {/* Main Grid */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* Left Column: Quick Actions & Intelligence */}
 <div className="lg:col-span-1 space-y-6">
 <div className="os-card bg-purple-900 text-white border-0 shadow-lg relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
 <Crosshair size={120} />
 </div>
 <div className="relative z-10">
 <h3 className="font-bold text-lg mb-1">Thesis Matcher</h3>
 <p className="text-purple-200 text-xs mb-6 max-w-[200px] leading-relaxed">
 Run compatibility scores against inbound pitch briefs.
 </p>
 <Link to="/explore" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-purple-900 font-semibold text-xs rounded hover:bg-gray-100 transition-colors">
 Run Analysis <ArrowRight size={14} />
 </Link>
 </div>
 </div>

 <div className="os-card p-0 overflow-hidden flex flex-col">
 <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
 <Briefcase size={16} className="text-gray-500" />
 <h3 className="font-bold text-sm">Investor Modules</h3>
 </div>
 <div className="divide-y divide-gray-100">
 <ModuleLink to="/explore" icon={Search} title="Deal Flow" desc="Discover and filter startups" />
 <ModuleLink to="/signals" icon={Activity} title="Market Signals" desc="Track sector trends & news" />
 <ModuleLink to="/reports" icon={Target} title="Diligence Reports" desc="AI generated analysis" />
 </div>
 </div>
 </div>

 {/* Right Column: Trending & Pipeline */}
 <div className="lg:col-span-2 space-y-6">
 <div className="os-card min-h-[400px] flex flex-col">
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-2">
 <TrendingUp size={18} className="text-purple-500" />
 <h3 className="font-bold">Trending in your Thesis</h3>
 </div>
 <Link to="/explore" className="text-xs text-gray-500 hover:text-gray-900 font-medium">View Pipeline</Link>
 </div>
 
 {loading ? (
 <div className="flex-1 flex items-center justify-center">
 <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
 </div>
) : trendingStartups.length > 0 ? (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {trendingStartups.map(startup => (
 <div key={startup.id} className="border border-gray-200 rounded-md p-4 hover:border-purple-300 transition-colors cursor-pointer">
 <h4 className="font-bold text-sm mb-1">{startup.name}</h4>
 <p className="text-xs text-gray-500 line-clamp-2 mb-3">{startup.pitch}</p>
 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded">{startup.stage}</span>
 <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded">{startup.industry}</span>
 </div>
 </div>
))}
 </div>
) : (
 <div className="flex-1 flex flex-col items-center justify-center text-center">
 <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
 <Users size={20} className="text-gray-400" />
 </div>
 <h4 className="font-semibold text-gray-900 mb-1">No Active Deals</h4>
 <p className="text-xs text-gray-500 max-w-sm mb-4">
 Adjust your thesis filters or explore the graph to find startups matching your criteria.
 </p>
 <Link to="/explore" className="os-btn">
 Open Deal Flow
 </Link>
 </div>
)}
 </div>
 </div>

 </div>
 </div>
);
}

function ModuleLink({ to, icon: Icon, title, desc }) {
 return (
 <Link to={to} className="group flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors">
 <div className="p-2 bg-white border border-gray-200 rounded-md text-gray-500 group-hover:text-purple-600 group-hover:border-purple-200 transition-colors">
 <Icon size={18} />
 </div>
 <div className="flex-1">
 <h4 className="font-semibold text-sm text-gray-900 mb-0.5 group-hover:text-purple-600 transition-colors">{title}</h4>
 <p className="text-xs text-gray-500">{desc}</p>
 </div>
 </Link>
);
}
