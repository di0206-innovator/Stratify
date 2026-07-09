import React, { useState, useEffect } from 'react';
import { 
  Rocket, Gift, Building2, Briefcase, Calendar, RefreshCw,
  Globe, Sparkles, MapPin, Search
} from 'lucide-react';

const TYPE_CONFIG = {
  accelerator: { icon: Rocket, color: 'bg-[#C8E64A]/25 text-black border-[#C8E64A]/40', label: 'Accelerator' },
  grant: { icon: Gift, color: 'bg-green-50 text-green-700 border-green-200', label: 'Grant' },
  program: { icon: Building2, color: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Program' },
  competition: { icon: Sparkles, color: 'bg-[#C8E64A]/10 text-black border-[#C8E64A]/30', label: 'Competition' },
  role: { icon: Briefcase, color: 'bg-gray-50 text-gray-500 border-gray-200', label: 'Role' },
};

export default function Opportunities({ founderProfile }) {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

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
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8 animate-fade-in text-[#111]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-200/60 select-none">
        <div className="flex items-center gap-3">
          <div className="bg-[#1A1A1A] p-3 text-white rounded-lg">
            <Rocket size={24} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-outfit font-black tracking-tight">Opportunities</h1>
            <p className="font-inter text-gray-500 mt-1 text-xs sm:text-sm">
              Grants, accelerators, programs matched to your startup profile.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-[#C8E64A]/25 border border-[#C8E64A]/40 text-black px-3 py-1.5 font-bold text-xs uppercase rounded-full shadow-sm">
            {filteredOpportunities.length} found
          </span>
          <button
            onClick={fetchOpportunities}
            className="os-btn p-2 border-gray-250 rounded-lg hover:border-black"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-gray-200 p-4 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search opportunities..."
              className="os-input pl-10 pr-4 py-2 font-semibold text-sm focus:outline-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap select-none">
            {typeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setTypeFilter(opt.value)}
                className={`px-3 py-1.5 font-outfit font-bold text-xs uppercase tracking-wider rounded-lg transition-all border cursor-pointer ${
                  typeFilter === opt.value
                    ? 'bg-[#C8E64A] text-black border-transparent shadow-sm'
                    : 'bg-white border-gray-250 text-gray-550 hover:border-black'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {founderProfile && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-dashed border-gray-200 select-none">
            <span className="text-[10px] font-bold text-gray-400 uppercase self-center mr-1">Matched for:</span>
            {founderProfile.geography && (
              <span className="bg-gray-50 border border-gray-200 px-2 py-0.5 text-[9px] font-bold uppercase rounded-md text-gray-500 flex items-center gap-1.5">
                <MapPin size={10} /> {founderProfile.geography}
              </span>
            )}
            {founderProfile.industry && (
              <span className="bg-gray-50 border border-gray-200 px-2 py-0.5 text-[9px] font-bold uppercase rounded-md text-gray-500 flex items-center gap-1.5">
                <Briefcase size={10} /> {founderProfile.industry}
              </span>
            )}
            {founderProfile.startupStage && (
              <span className="bg-gray-50 border border-gray-200 px-2 py-0.5 text-[9px] font-bold uppercase rounded-md text-gray-500 flex items-center gap-1.5">
                <Rocket size={10} /> {founderProfile.startupStage}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Opportunities Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border border-black border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-outfit font-bold text-xs tracking-wider uppercase mt-4">Scanning global programs...</p>
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="os-card bg-white p-16 text-center max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Rocket size={24} className="text-gray-400" />
          </div>
          <h3 className="font-outfit font-bold text-lg text-black">No Matches Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
            Try adjusting your filters or search terms. More opportunities are added regularly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOpportunities.map((opp, idx) => {
            const config = TYPE_CONFIG[opp.type] || TYPE_CONFIG.program;
            const Icon = config.icon;
            return (
              <div
                key={opp.id || idx}
                className="os-card bg-white p-5 hover:border-black transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`${config.color} border border-transparent p-2.5 rounded-lg flex-shrink-0 flex items-center justify-center`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-outfit font-bold text-base text-[#111] leading-tight truncate">{opp.title}</h3>
                        <span className={`${config.color} border border-transparent px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-md flex-shrink-0`}>
                          {config.label}
                        </span>
                      </div>
                      {opp.organization && (
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{opp.organization}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-4 leading-relaxed font-light font-inter">{opp.description}</p>

                  {opp.matchReason && (
                    <div className="w-full mt-3 mb-4 text-xs font-semibold text-gray-800 bg-[#C8E64A]/10 border border-[#C8E64A]/30 p-2.5 rounded-lg">
                      <span className="uppercase text-[9px] font-bold mr-1 bg-black text-white px-1.5 py-0.5 rounded">MATCH</span>
                      {opp.matchReason}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100/50">
                  <div className="flex flex-wrap gap-1.5 select-none">
                    {opp.geography && (
                      <span className="bg-gray-50 border border-gray-200 px-2 py-0.5 text-[9px] font-bold uppercase rounded-md text-gray-500 flex items-center gap-1">
                        <Globe size={10} /> {opp.geography}
                      </span>
                    )}
                    {opp.deadline && (
                      <span className="bg-gray-50 border border-gray-200 px-2 py-0.5 text-[9px] font-bold uppercase rounded-md text-gray-500 flex items-center gap-1">
                        <Calendar size={10} /> {opp.deadline}
                      </span>
                    )}
                  </div>

                  {opp.link && (
                    <a
                      href={opp.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="os-btn-primary py-1.5 px-3.5 text-xs font-semibold select-none flex items-center gap-1.5"
                    >
                      Apply <Calendar size={12} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
