import React, { useState, useEffect } from 'react';
import { Search, Briefcase, Users, Rocket, Globe, TrendingUp } from 'lucide-react';
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
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8 animate-fade-in text-[#111]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-200/60 select-none">
        <div className="flex items-center gap-3">
          <div className="bg-[#1A1A1A] p-3 text-white rounded-lg">
            <Globe size={24} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-outfit font-black tracking-tight">Explore Ecosystem</h1>
            <p className="font-inter text-gray-500 mt-1 text-xs sm:text-sm">
              Discover startups, founders, investors, and ecosystem partners.
            </p>
          </div>
        </div>
        
        <div className="flex bg-gray-200/50 p-1.5 w-full md:w-auto rounded-xl">
          <button
            onClick={() => setActiveTab('startups')}
            className={`flex-1 md:flex-none px-6 py-2 font-outfit font-bold text-xs uppercase tracking-wider transition-all rounded-lg cursor-pointer ${
              activeTab === 'startups' ? 'bg-[#C8E64A] text-black shadow-sm' : 'text-gray-500 hover:text-black'
            }`}
          >
            Startups
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={`flex-1 md:flex-none px-6 py-2 font-outfit font-bold text-xs uppercase tracking-wider transition-all rounded-lg cursor-pointer ${
              activeTab === 'people' ? 'bg-[#C8E64A] text-black shadow-sm' : 'text-gray-500 hover:text-black'
            }`}
          >
            People
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-gray-200 p-4 rounded-xl flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="os-input pl-10 pr-4 py-2 font-semibold text-sm focus:outline-none"
          />
        </div>
        
        {activeTab === 'startups' ? (
          <select 
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value)}
            className="os-input md:w-44 px-4 py-2 font-semibold text-sm focus:outline-none"
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
            className="os-input md:w-44 px-4 py-2 font-semibold text-sm focus:outline-none"
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
          <div className="w-10 h-10 border border-black border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-outfit font-bold text-xs tracking-wider uppercase mt-4">Loading ecosystem data...</p>
        </div>
      ) : activeTab === 'startups' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStartups.map(startup => (
            <Link 
              key={startup.id} 
              to={`/startups/${startup.id}`}
              className="os-card bg-white hover:border-black transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-3 border-b border-gray-100 pb-2">
                  <h3 className="font-outfit font-bold text-base text-[#111] truncate pr-2 group-hover:underline">{startup.name || 'Unnamed Startup'}</h3>
                  {startup.score > 0 && (
                    <span className="bg-[#C8E64A]/20 border border-[#C8E64A]/30 px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-full flex items-center gap-1 shrink-0">
                      <TrendingUp size={10} /> {startup.score}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed font-light">
                  {startup.pitch || startup.problem || 'No description provided.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-gray-100/50">
                {startup.stage && (
                  <span className="bg-gray-50 border border-gray-200 px-2 py-0.5 text-[9px] font-bold uppercase rounded-md text-gray-500 flex items-center gap-1">
                    <Rocket size={10} /> {startup.stage}
                  </span>
                )}
                {startup.industry && (
                  <span className="bg-gray-50 border border-gray-200 px-2 py-0.5 text-[9px] font-bold uppercase rounded-md text-gray-500 flex items-center gap-1">
                    <Briefcase size={10} /> {startup.industry}
                  </span>
                )}
                {startup.matchReason && (
                  <div className="w-full mt-3 text-xs font-semibold text-gray-800 bg-[#C8E64A]/10 border border-[#C8E64A]/30 p-2.5 rounded-lg">
                    <span className="uppercase text-[9px] font-bold mr-1 bg-black text-white px-1.5 py-0.5 rounded">MATCH</span>
                    {startup.matchReason}
                  </div>
                )}
              </div>
            </Link>
          ))}
          {filteredStartups.length === 0 && (
            <div className="col-span-full border border-dashed border-gray-300 p-16 text-center bg-white rounded-2xl select-none">
              <span className="block text-[9px] font-bold uppercase text-gray-400 mb-2 tracking-wider">ECOSYSTEM EXPLORER</span>
              <h4 className="font-outfit font-bold text-lg text-black mb-1">No Startups Found</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                Adjust your industry/stage filters above, or define a new workspace vertical to bootstrap deal flow.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPeople.map(person => (
            <div 
              key={person.id}
              className="os-card bg-white flex items-center gap-4 p-5 hover:border-black transition-all"
            >
              <div className="w-12 h-12 bg-black text-[#C8E64A] rounded-full flex items-center justify-center font-outfit font-black text-lg shrink-0">
                {(person.name || 'A')[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-outfit font-bold text-base text-[#111] truncate leading-snug">{person.name || 'Anonymous User'}</h3>
                <span className="bg-gray-50 border border-gray-200 px-2 py-0.5 text-[9px] font-bold uppercase rounded-md text-gray-500 inline-block mt-1">
                  {person.role || 'Member'}
                </span>
              </div>
              <button 
                onClick={() => handleConnect(person.id)}
                disabled={person.requested || matchingId === person.id}
                className="ml-auto os-btn bg-[#FAF9F6] border-gray-200 hover:border-black text-xs font-semibold py-1.5"
              >
                {person.requested ? 'Sent' : (matchingId === person.id ? '...' : 'Connect')}
              </button>
            </div>
          ))}
          {filteredPeople.length === 0 && (
            <div className="col-span-full border border-dashed border-gray-300 p-16 text-center bg-white rounded-2xl select-none">
              <span className="block text-[9px] font-bold uppercase text-gray-400 mb-2 tracking-wider">ECOSYSTEM REGISTRY</span>
              <h4 className="font-outfit font-bold text-lg text-black mb-1">No Members Found</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                Try searching for other keywords, or build consensus by initiating outbound partnership invites.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
