import React, { useState, useEffect } from 'react';
import { Search, Briefcase, Users, Rocket, Globe, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Explore({ user, founderProfile }) {
  const [startups, setStartups] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matchingId, setMatchingId] = useState(null);
  const [activeTab, setActiveTab] = useState('startups'); // 'startups' or 'people'
  const [search, setSearch] = useState('');
  const [searchMeta, setSearchMeta] = useState(null);
  
  // Filters
  const [stageFilter, setStageFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchExploreData();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [activeTab, search, stageFilter, roleFilter]);

  const fetchExploreData = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams();
      const trimmedSearch = search.trim();
      if (trimmedSearch) queryParams.set('search', trimmedSearch);

      if (activeTab === 'startups') {
        if (stageFilter && stageFilter !== 'all') queryParams.set('stage', stageFilter);
        queryParams.set('limit', '50');

        const res = await fetch(`/api/explore/startups?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setStartups(data.startups || []);
          setSearchMeta(data.meta || null);
        } else {
          setStartups([]);
          setSearchMeta(null);
          setError('Could not load startup search results right now.');
        }
      } else {
        if (roleFilter && roleFilter !== 'all') queryParams.set('role', roleFilter);

        const res = await fetch(`/api/explore/people?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setPeople(data.people || []);
          setSearchMeta(null);
        } else {
          setPeople([]);
          setError('Could not load people search results right now.');
        }
      }
    } catch (e) {
      console.error('Fetch error:', e);
      if (activeTab === 'startups') {
        setStartups([]);
        setSearchMeta(null);
      } else {
        setPeople([]);
      }
      setError('Something went wrong while loading explore results.');
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

  const filteredPeople = people.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = (p.name || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || p.role === roleFilter;
    return matchSearch && matchRole;
  });

  const StartupCardWrapper = ({ startup, children }) => {
    if (startup.externalUrl) {
      return (
        <a
          href={startup.externalUrl}
          target="_blank"
          rel="noreferrer"
          className="os-card bg-card hover:border-DEFAULT transition-all flex flex-col justify-between group"
        >
          {children}
        </a>
      );
    }

    return (
      <Link
        to={`/startups/${startup.id}`}
        className="os-card bg-card hover:border-DEFAULT transition-all flex flex-col justify-between group"
      >
        {children}
      </Link>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8 animate-fade-in text-text-primary">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-light select-none">
        <div className="flex items-center gap-3">
          <div className="bg-[#1A1A1A] p-3 text-white rounded-lg">
            <Globe size={24} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-outfit font-black tracking-tight">Explore Ecosystem</h1>
            <p className="font-inter text-text-secondary mt-1 text-xs sm:text-sm">
              Discover startups, founders, investors, and ecosystem partners.
            </p>
          </div>
        </div>
        
        <div className="flex bg-hover p-1.5 w-full md:w-auto rounded-xl">
          <button
            onClick={() => setActiveTab('startups')}
            className={`flex-1 md:flex-none px-6 py-2 font-outfit font-bold text-xs uppercase tracking-wider transition-all rounded-lg cursor-pointer ${
              activeTab === 'startups' ? 'bg-accent text-[#111] shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Startups
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={`flex-1 md:flex-none px-6 py-2 font-outfit font-bold text-xs uppercase tracking-wider transition-all rounded-lg cursor-pointer ${
              activeTab === 'people' ? 'bg-accent text-[#111] shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            People
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-card border border-light p-4 rounded-xl flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={activeTab === 'startups' ? 'Search any startup, company, sector, or founder...' : `Search ${activeTab}...`}
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
            <option value="idea">Idea</option>
            <option value="seed">Seed</option>
            <option value="mvp">MVP</option>
            <option value="launched">Launched</option>
            <option value="scaling">Scaling</option>
            <option value="growth">Growth / Unicorn</option>
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

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
          {error}
        </div>
      )}

      {activeTab === 'startups' && (
        <div className="rounded-xl border border-light bg-canvas px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">Startup Search</p>
            <p className="text-sm text-text-primary">
              {search.trim()
                ? `Searching the startup graph${searchMeta?.localMatches ? '' : ' and the live web'} for "${search.trim()}".`
                : 'Use this like startup-specific search: company names, sectors, products, founders, investors, or markets.'}
            </p>
          </div>
          {searchMeta?.mode === 'startup_search' && (
            <span className="shrink-0 rounded-full border border-[#C8E64A]/40 bg-accent/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-text-primary">
              Real-time startup search
            </span>
          )}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border border-black border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-outfit font-bold text-xs tracking-wider uppercase mt-4">Loading ecosystem data...</p>
        </div>
      ) : activeTab === 'startups' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {startups.map(startup => (
            <StartupCardWrapper
              key={startup.id} 
              startup={startup}
            >
              <div>
                <div className="flex items-start justify-between mb-3 border-b border-light pb-2">
                  <h3 className="font-outfit font-bold text-base text-text-primary truncate pr-2 group-hover:underline">{startup.name || 'Unnamed Startup'}</h3>
                  {startup.score > 0 && (
                    <span className="bg-accent/20 border border-[#C8E64A]/30 px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-full flex items-center gap-1 shrink-0">
                      <TrendingUp size={10} /> {startup.score}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary mb-4 line-clamp-2 leading-relaxed font-light">
                  {startup.pitch || startup.problem || 'No description provided.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-light">
                {startup.stage && (
                  <span className="bg-hover border border-light px-2 py-0.5 text-[9px] font-bold uppercase rounded-md text-text-secondary flex items-center gap-1">
                    <Rocket size={10} /> {startup.stage}
                  </span>
                )}
                {startup.industry && (
                  <span className="bg-hover border border-light px-2 py-0.5 text-[9px] font-bold uppercase rounded-md text-text-secondary flex items-center gap-1">
                    <Briefcase size={10} /> {startup.industry}
                  </span>
                )}
                {startup.matchReason && (
                  <div className="w-full mt-3 text-xs font-semibold text-text-primary bg-accent/10 border border-[#C8E64A]/30 p-2.5 rounded-lg">
                    <span className="uppercase text-[9px] font-bold mr-1 bg-black text-white px-1.5 py-0.5 rounded">MATCH</span>
                    {startup.matchReason}
                  </div>
                )}
                {startup.sourceType === 'web_search' && (
                  <div className="w-full mt-3 text-xs font-semibold text-text-primary bg-sky-500/10 border border-sky-500/30 p-2.5 rounded-lg">
                    <span className="uppercase text-[9px] font-bold mr-1 bg-sky-600 text-white px-1.5 py-0.5 rounded">WEB</span>
                    Live startup search result
                  </div>
                )}
                {search.trim() && startup.searchScore > 0 && (
                  <div className="w-full mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                    Search relevance {startup.searchScore}
                  </div>
                )}
              </div>
            </StartupCardWrapper>
          ))}
          {startups.length === 0 && (
            <div className="col-span-full border border-dashed border-DEFAULT p-16 text-center bg-card rounded-2xl select-none">
              <span className="block text-[9px] font-bold uppercase text-text-muted mb-2 tracking-wider">ECOSYSTEM EXPLORER</span>
              <h4 className="font-outfit font-bold text-lg text-text-primary mb-1">No Startups Found</h4>
              <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
                Try another keyword, or broaden the stage filter to search across more of the mapped ecosystem.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPeople.map(person => (
            <div 
              key={person.id}
              className="os-card bg-card flex items-center gap-4 p-5 hover:border-DEFAULT transition-all"
            >
              <div className="w-12 h-12 bg-black text-[#C8E64A] rounded-full flex items-center justify-center font-outfit font-black text-lg shrink-0">
                {(person.name || 'A')[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-outfit font-bold text-base text-text-primary truncate leading-snug">{person.name || 'Anonymous User'}</h3>
                <span className="bg-hover border border-light px-2 py-0.5 text-[9px] font-bold uppercase rounded-md text-text-secondary inline-block mt-1">
                  {person.role || 'Member'}
                </span>
              </div>
              <button 
                onClick={() => handleConnect(person.id)}
                disabled={person.requested || matchingId === person.id}
                className="ml-auto os-btn bg-canvas border-light hover:border-DEFAULT text-xs font-semibold py-1.5"
              >
                {person.requested ? 'Sent' : (matchingId === person.id ? '...' : 'Connect')}
              </button>
            </div>
          ))}
          {filteredPeople.length === 0 && (
            <div className="col-span-full border border-dashed border-DEFAULT p-16 text-center bg-card rounded-2xl select-none">
              <span className="block text-[9px] font-bold uppercase text-text-muted mb-2 tracking-wider">ECOSYSTEM REGISTRY</span>
              <h4 className="font-outfit font-bold text-lg text-text-primary mb-1">No Members Found</h4>
              <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
                Try searching for other keywords, or build consensus by initiating outbound partnership invites.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
