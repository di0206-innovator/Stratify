import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Activity, TrendingUp, Search, Crosshair, ArrowRight, Briefcase, Target
} from 'lucide-react';

export default function VCDashboard({ founderProfile, user }) {
  const [trendingStartups, setTrendingStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [thesisKeyword, setThesisKeyword] = useState('');

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

  const filteredStartups = trendingStartups.filter(startup => {
    if (!thesisKeyword.trim()) return true;
    const kw = thesisKeyword.toLowerCase().trim();
    return (
      (startup.name || '').toLowerCase().includes(kw) ||
      (startup.pitch || '').toLowerCase().includes(kw) ||
      (startup.industry || '').toLowerCase().includes(kw) ||
      (startup.stage || '').toLowerCase().includes(kw)
    );
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-10 space-y-8 animate-fade-in">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-200/60">
        <div>
          <div className="flex items-center gap-3 mb-2.5">
            <span className="px-2.5 py-1 bg-[#C8E64A]/15 border border-[#C8E64A]/30 text-[#111] text-[10px] font-bold uppercase rounded tracking-wider font-outfit">
              Investor OS
            </span>
            <span className="text-xs font-semibold text-gray-400">Pipeline Active</span>
          </div>
          <h1 className="text-3xl font-outfit font-black tracking-tight text-[#111]">
            {founderProfile.name}
          </h1>
          <p className="text-gray-500 mt-2 max-w-xl text-sm leading-relaxed">
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
          <div className="os-card bg-[#1A1A1A] text-white border-0 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
              <Crosshair size={120} />
            </div>
            <div className="relative z-10 space-y-4">
              <div>
                <h3 className="font-outfit font-bold text-lg mb-1.5 text-white">Thesis Matcher</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Enter focus keywords to instantly filter deal flow pipeline matching your investment thesis.
                </p>
              </div>
              <input
                type="text"
                value={thesisKeyword}
                onChange={(e) => setThesisKeyword(e.target.value)}
                placeholder="e.g. SaaS, Seed, India, AI"
                className="w-full text-xs px-3 py-2 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none transition-all font-semibold font-outfit"
              />
            </div>
          </div>

          <div className="os-card p-0 overflow-hidden flex flex-col">
            <div className="bg-[#FAF9F6] px-4 py-3.5 border-b border-gray-200/60 flex items-center gap-2">
              <Briefcase size={16} className="text-gray-400" />
              <h3 className="font-outfit font-bold text-sm">Investor Modules</h3>
            </div>
            <div className="divide-y divide-gray-200/60">
              <ModuleLink to="/explore" icon={Search} title="Deal Flow" desc="Discover and filter startups" />
              <ModuleLink to="/signals" icon={Activity} title="Market Signals" desc="Track sector trends & news" />
              <ModuleLink to="/intelligence" icon={Target} title="Diligence Reports" desc="AI generated analysis" />
            </div>
          </div>
        </div>

        {/* Right Column: Trending & Pipeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="os-card min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200/60">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-gray-400" />
                <h3 className="font-outfit font-bold text-base text-[#111]">
                  {thesisKeyword.trim() ? `Matching Thesis Pipeline (${filteredStartups.length})` : 'Trending in your Thesis'}
                </h3>
              </div>
              <Link to="/explore" className="text-xs text-gray-500 hover:text-gray-900 font-medium">View Pipeline</Link>
            </div>
            
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredStartups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStartups.map(startup => (
                  <div key={startup.id} className="border border-gray-200 rounded-lg p-4 hover:border-black transition-colors cursor-pointer bg-white">
                    <h4 className="font-bold text-sm mb-1 text-[#111]">{startup.name}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{startup.pitch}</p>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded">{startup.stage}</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded">{startup.industry}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Users size={20} className="text-gray-400" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">No Matching Deals</h4>
                <p className="text-xs text-gray-500 max-w-sm mb-5 leading-relaxed">
                  No startups match your current focus keywords. Try updating your filters or exploring the graph.
                </p>
                <button onClick={() => setThesisKeyword('')} className="os-btn">
                  Clear Filters
                </button>
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
    <Link to={to} className="group flex items-start gap-4 p-4 hover:bg-gray-100/50 transition-colors">
      <div className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 group-hover:text-black group-hover:border-black transition-colors">
        <Icon size={16} />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-sm text-gray-900 mb-0.5 group-hover:text-black transition-colors">{title}</h4>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
    </Link>
  );
}
