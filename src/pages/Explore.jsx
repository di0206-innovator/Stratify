import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, GraduationCap, Building2, Users, Rocket, ChevronRight, Globe, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Explore({ user, founderProfile }) {
 const [startups, setStartups] = useState([]);
 const [people, setPeople] = useState([]);
 const [loading, setLoading] = useState(true);
 const [matchingId, setMatchingId] = useState(null);
 const [activeTab, setActiveTab] = useState('startups'); // 'startups' or 'people'
 const [search, setSearch] = useState('');
 
 // Filters
 const [stageFilter, setStageFilter] = useState('all');
 const [roleFilter, setRoleFilter] = useState('all');

 useEffect(() => {
 fetchExploreData();
 }, [activeTab]);

 const fetchExploreData = async () => {
 setLoading(true);
 try {
 if (activeTab === 'startups') {
 const res = await fetch('/api/explore/startups?limit=50');
 if (res.ok) {
 const data = await res.json();
 setStartups(data.startups || []);
 }
 } else {
 const res = await fetch('/api/explore/people');
 if (res.ok) {
 const data = await res.json();
 setPeople(data.people || []);
 }
 }
 } catch (e) {
 console.error('Fetch error:', e);
 } finally {
 setLoading(false);
 }
 };

 const handleConnect = async (personId) => {
 setMatchingId(personId);
 try {
 const res = await fetch('/api/matches', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ receiverId: personId })
 });
 if (res.ok) {
 setPeople(prev => prev.map(p => p.id === personId ? { ...p, requested: true } : p));
 }
 } catch (e) {
 console.error('Failed to match:', e);
 } finally {
 setMatchingId(null);
 }
 };

 const filteredStartups = startups.filter(s => {
 const q = search.toLowerCase();
 const matchSearch = (s.name || '').toLowerCase().includes(q) || (s.pitch || '').toLowerCase().includes(q);
 const matchStage = stageFilter === 'all' || (s.stage || '').toLowerCase() === stageFilter.toLowerCase();
 return matchSearch && matchStage;
 });

 const filteredPeople = people.filter(p => {
 const q = search.toLowerCase();
 const matchSearch = (p.name || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q);
 const matchRole = roleFilter === 'all' || p.role === roleFilter;
 return matchSearch && matchRole;
 });

 return (
 <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
 {/* Header */}
 <div className="bg-white p-6 -hard">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="bg-[#60A5FA] p-3.5 text-black">
 <Globe size={22} strokeWidth={3} />
 </div>
 <div>
 <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Explore Ecosystem</h1>
 <p className="text-sm font-bold text-gray-500">
 Discover startups, founders, investors, and ecosystem partners.
 </p>
 </div>
 </div>
 
 <div className="flex bg-gray-100 p-1 w-full md:w-auto">
 <button
 onClick={() => setActiveTab('startups')}
 className={`flex-1 md:flex-none px-6 py-2 font-black text-sm uppercase transition-colors ${
 activeTab === 'startups' ? 'bg-emerald-500 border-[2px] border-black -sm' : 'hover:bg-gray-200'
 }`}
 >
 Startups
 </button>
 <button
 onClick={() => setActiveTab('people')}
 className={`flex-1 md:flex-none px-6 py-2 font-black text-sm uppercase transition-colors ${
 activeTab === 'people' ? 'bg-emerald-500 border-[2px] border-black -sm' : 'hover:bg-gray-200'
 }`}
 >
 People
 </button>
 </div>
 </div>
 </div>

 {/* Filters & Search */}
 <div className="bg-white p-4 -hard flex flex-col md:flex-row gap-3">
 <div className="flex-1 relative">
 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 <input
 type="text"
 value={search}
 onChange={e => setSearch(e.target.value)}
 placeholder={`Search ${activeTab}...`}
 className="w-full pl-10 pr-4 py-2 font-bold text-sm focus:outline-none focus:border-[#A3E635]"
 />
 </div>
 
 {activeTab === 'startups' ? (
 <select 
 value={stageFilter}
 onChange={e => setStageFilter(e.target.value)}
 className=" px-4 py-2 font-black text-sm uppercase focus:outline-none"
 >
 <option value="all">All Stages</option>
 <option value="ideation">Ideation</option>
 <option value="mvp">MVP</option>
 <option value="launched">Launched</option>
 <option value="scaling">Scaling</option>
 </select>
) : (
 <select
 value={roleFilter}
 onChange={e => setRoleFilter(e.target.value)}
 className=" px-4 py-2 font-black text-sm uppercase focus:outline-none"
 >
 <option value="all">All Roles</option>
 <option value="founder">Founders</option>
 <option value="investor">Investors</option>
 <option value="mentor">Mentors</option>
 </select>
)}
 </div>

 {/* Grid */}
 {loading ? (
 <div className="text-center py-16">
 <div className="w-10 h-10 border-t-transparent rounded-full animate-spin mx-auto" />
 <p className="font-outfit font-black text-xs tracking-wider uppercase mt-4">Loading ecosystem data...</p>
 </div>
) : activeTab === 'startups' ? (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {filteredStartups.map(startup => (
 <Link 
 key={startup.id} 
 to={`/startups/${startup.id}`}
 className="bg-white p-5 -hard hover:translate-x-[-2px] hover:translate-y-[-2px] hover: transition-all flex flex-col group"
 >
 <div className="flex items-start justify-between mb-2">
 <h3 className="font-black text-lg uppercase truncate pr-2 group-hover:text-[#60A5FA] transition-colors">{startup.name || 'Unnamed Startup'}</h3>
 {startup.score > 0 && (
 <span className="bg-emerald-500 border-[2px] border-black px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1 shrink-0">
 <TrendingUp size={10} /> {startup.score}
 </span>
)}
 </div>
 <p className="text-sm font-medium text-gray-600 mb-4 line-clamp-2 flex-1">
 {startup.pitch || startup.problem || 'No description provided.'}
 </p>
 <div className="flex flex-wrap gap-1.5 mt-auto">
 {startup.stage && (
 <span className="bg-gray-100 border-[2px] border-black px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1">
 <Rocket size={10} /> {startup.stage}
 </span>
)}
 {startup.industry && (
 <span className="bg-gray-100 border-[2px] border-black px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1">
 <Briefcase size={10} /> {startup.industry}
 </span>
)}
 {startup.matchReason && (
 <div className="w-full mt-2 text-xs font-bold text-gray-700 bg-[#FEF08A] border-[2px] border-black p-2">
 <span className="uppercase text-[9px] font-black mr-1 bg-black text-white px-1 py-0.5">MATCH</span>
 {startup.matchReason}
 </div>
)}
 </div>
 </Link>
))}
 {filteredStartups.length === 0 && (
 <div className="col-span-full border-2 border-dashed border-gray-400 p-12 text-center bg-white font-outfit select-none">
 <span className="block text-[10px] font-black uppercase text-gray-400 mb-2">ECOSYSTEM EXPLORER</span>
 <h4 className="font-black text-lg uppercase text-black mb-1">No Startups Found</h4>
 <p className="font-bold text-gray-500 text-xs max-w-sm mx-auto leading-relaxed">
 Adjust your industry/stage filters above, or define a new workspace vertical to bootstrap deal flow.
 </p>
 </div>
)}
 </div>
) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {filteredPeople.map(person => (
 <div 
 key={person.id}
 className="bg-white p-5 -hard flex items-center gap-4"
 >
 <div className="w-12 h-12 bg-[#F472B6] rounded-full flex items-center justify-center text-white font-black text-xl shrink-0">
 {(person.name || 'A')[0].toUpperCase()}
 </div>
 <div className="min-w-0 flex-1">
 <h3 className="font-black text-base uppercase truncate">{person.name || 'Anonymous User'}</h3>
 <span className="bg-gray-100 border-[2px] border-black px-2 py-0.5 text-[10px] font-black uppercase inline-block mt-1">
 {person.role || 'Member'}
 </span>
 </div>
 <button 
 onClick={() => handleConnect(person.id)}
 disabled={person.requested || matchingId === person.id}
 className="ml-auto px-4 py-2 bg-emerald-500 text-xs font-black uppercase hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-x-[2px] disabled:translate-y-[2px]"
 >
 {person.requested ? 'Sent' : (matchingId === person.id ? '...' : 'Connect')}
 </button>
 </div>
))}
 {filteredPeople.length === 0 && (
 <div className="col-span-full border-2 border-dashed border-gray-400 p-12 text-center bg-white font-outfit select-none">
 <span className="block text-[10px] font-black uppercase text-gray-400 mb-2">ECOSYSTEM REGISTRY</span>
 <h4 className="font-black text-lg uppercase text-black mb-1">No Members Found</h4>
 <p className="font-bold text-gray-500 text-xs max-w-sm mx-auto leading-relaxed">
 Try searching for other keywords, or build consensus by initiating outbound partnership invites.
 </p>
 </div>
)}
 </div>
)}
 </div>
);
}
