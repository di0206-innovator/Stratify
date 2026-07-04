import React, { useState, useEffect } from 'react';
import { 
 Rocket, GraduationCap, Building2, Gift, Filter, Search,
 ExternalLink, MapPin, Briefcase, Calendar, ChevronDown, RefreshCw,
 Globe, Sparkles
} from 'lucide-react';

const TYPE_CONFIG = {
 accelerator: { icon: Rocket, color: 'bg-[#FB923C]', label: 'Accelerator' },
 grant: { icon: Gift, color: 'bg-emerald-500', label: 'Grant' },
 program: { icon: Building2, color: 'bg-purple-600', label: 'Program' },
 competition: { icon: Sparkles, color: 'bg-[#F472B6]', label: 'Competition' },
 role: { icon: Briefcase, color: 'bg-[#60A5FA]', label: 'Role' },
};

export default function Opportunities({ founderProfile }) {
 const [opportunities, setOpportunities] = useState([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState('');
 const [typeFilter, setTypeFilter] = useState('all');
 const [geoFilter, setGeoFilter] = useState('');
 const [showFilters, setShowFilters] = useState(false);

 const fetchOpportunities = async () => {
 setLoading(true);
 try {
 const params = new URLSearchParams();
 if (typeFilter !== 'all') params.set('type', typeFilter);
 if (founderProfile?.geography) params.set('geography', founderProfile.geography);
 if (founderProfile?.industry) params.set('industry', founderProfile.industry);
 if (founderProfile?.startupStage) params.set('stage', founderProfile.startupStage);

 const res = await fetch(`/api/opportunities?${params.toString()}`);
 if (res.ok) {
 const data = await res.json();
 setOpportunities(data.opportunities || []);
 }
 } catch (e) {
 console.error('Failed to fetch opportunities:', e);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchOpportunities();
 }, [typeFilter]);

 const filteredOpportunities = opportunities.filter(opp => {
 if (!search) return true;
 const q = search.toLowerCase();
 return (
 (opp.title || '').toLowerCase().includes(q) ||
 (opp.organization || '').toLowerCase().includes(q) ||
 (opp.description || '').toLowerCase().includes(q) ||
 (opp.industries || '').toLowerCase().includes(q)
);
 });

 const typeOptions = [
 { value: 'all', label: 'All Types' },
 { value: 'accelerator', label: 'Accelerators' },
 { value: 'grant', label: 'Grants' },
 { value: 'program', label: 'Programs' },
 { value: 'competition', label: 'Competitions' },
 ];

 return (
 <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
 {/* Header */}
 <div className="bg-white p-6 -hard select-none">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="bg-[#FB923C] p-3.5 text-black">
 <Rocket size={22} strokeWidth={3} />
 </div>
 <div>
 <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Opportunities</h1>
 <p className="text-sm font-bold text-gray-500">
 Grants, accelerators, programs matched to your startup profile.
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <span className="bg-emerald-500 px-3 py-1 font-black text-xs uppercase">
 {filteredOpportunities.length} found
 </span>
 <button
 onClick={fetchOpportunities}
 className="bg-white p-2 hover: transition-all"
 >
 <RefreshCw size={16} strokeWidth={3} />
 </button>
 </div>
 </div>
 </div>

 {/* Search & Filters */}
 <div className="bg-white p-4 -hard">
 <div className="flex flex-col md:flex-row gap-3">
 <div className="flex-1 relative">
 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 <input
 type="text"
 value={search}
 onChange={e => setSearch(e.target.value)}
 placeholder="Search opportunities..."
 className="w-full pl-10 pr-4 py-2 font-bold text-sm focus:outline-none focus:border-[#A3E635]"
 />
 </div>
 <div className="flex gap-2 flex-wrap">
 {typeOptions.map(opt => (
 <button
 key={opt.value}
 onClick={() => setTypeFilter(opt.value)}
 className={`px-3 py-2 font-black text-xs uppercase transition-all ${
 typeFilter === opt.value
 ? 'bg-emerald-500 translate-x-[-2px] translate-y-[-2px]'
 : 'bg-white hover:bg-gray-50'
 }`}
 >
 {opt.label}
 </button>
))}
 </div>
 </div>

 {founderProfile && (
 <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t-2 border-dashed border-gray-200">
 <span className="text-[10px] font-black text-gray-400 uppercase self-center mr-1">Matched for:</span>
 {founderProfile.geography && (
 <span className="bg-gray-100 border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1">
 <MapPin size={10} /> {founderProfile.geography}
 </span>
)}
 {founderProfile.industry && (
 <span className="bg-gray-100 border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1">
 <Briefcase size={10} /> {founderProfile.industry}
 </span>
)}
 {founderProfile.startupStage && (
 <span className="bg-gray-100 border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1">
 <GraduationCap size={10} /> {founderProfile.startupStage}
 </span>
)}
 </div>
)}
 </div>

 {/* Opportunities Grid */}
 {loading ? (
 <div className="text-center py-16">
 <div className="w-10 h-10 border-t-transparent rounded-full animate-spin mx-auto" />
 <p className="font-outfit font-black text-xs tracking-wider uppercase mt-4">Scanning global programs...</p>
 </div>
) : filteredOpportunities.length === 0 ? (
 <div className="bg-white p-12 text-center">
 <div className="bg-[#FB923C] p-4 inline-block mb-4">
 <Rocket size={32} strokeWidth={3} className="text-black" />
 </div>
 <h3 className="font-black text-xl uppercase mb-2">No Matches Found</h3>
 <p className="font-bold text-gray-500 text-sm max-w-md mx-auto">
 Try adjusting your filters or search terms. More opportunities are added regularly.
 </p>
 </div>
) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {filteredOpportunities.map((opp, idx) => {
 const config = TYPE_CONFIG[opp.type] || TYPE_CONFIG.program;
 const Icon = config.icon;
 return (
 <div
 key={opp.id || idx}
 className="bg-white p-5 -hard hover:translate-x-[-2px] hover:translate-y-[-2px] hover: transition-all flex flex-col"
 >
 <div className="flex items-start gap-3 mb-3">
 <div className={`${config.color} border-[2px] border-black p-2.5 flex-shrink-0`}>
 <Icon size={18} strokeWidth={3} className="text-black" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between gap-2">
 <h3 className="font-black text-base uppercase truncate">{opp.title}</h3>
 <span className={`${config.color} border-[2px] border-black px-2 py-0.5 text-[10px] font-black uppercase flex-shrink-0`}>
 {config.label}
 </span>
 </div>
 {opp.organization && (
 <p className="text-xs font-bold text-gray-500 mt-0.5">{opp.organization}</p>
)}
 </div>
 </div>

 <p className="text-sm font-medium text-gray-600 mb-3 line-clamp-3 flex-1">{opp.description}</p>

 {opp.matchReason && (
 <div className="w-full mt-2 mb-3 text-xs font-bold text-gray-700 bg-[#FEF08A] border-[2px] border-black p-2">
 <span className="uppercase text-[9px] font-black mr-1 bg-black text-white px-1 py-0.5">MATCH</span>
 {opp.matchReason}
 </div>
)}

 <div className="flex flex-wrap gap-1.5 mb-3">
 {opp.geography && (
 <span className="bg-gray-100 border-[2px] border-black px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1">
 <Globe size={10} /> {opp.geography}
 </span>
)}
 {opp.industries && opp.industries !== 'Any' && (
 <span className="bg-gray-100 border-[2px] border-black px-2 py-0.5 text-[10px] font-black uppercase">
 {opp.industries.split(',').slice(0, 2).join(', ')}
 </span>
)}
 {opp.deadline && (
 <span className="bg-gray-100 border-[2px] border-black px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1">
 <Calendar size={10} /> {opp.deadline}
 </span>
)}
 </div>

 {opp.link && (
 <a
 href={opp.link}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center gap-2 bg-black text-white px-4 py-2 font-black text-xs uppercase tracking-wider hover:bg-gray-800 transition-colors w-fit"
 >
 Apply Now <ExternalLink size={12} />
 </a>
)}
 </div>
);
 })}
 </div>
)}
 </div>
);
}
