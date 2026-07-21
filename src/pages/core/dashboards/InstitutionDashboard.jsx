import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building, MapPin, Activity, FileText, ArrowRight, ShieldCheck, Search, BookOpen, Plus, X, Landmark
} from 'lucide-react';

export default function InstitutionDashboard({ founderProfile, user }) {
  const [govSchemes, setGovSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [programSearch, setProgramSearch] = useState('');
  const [newProgram, setNewProgram] = useState({
    title: '',
    description: '',
    budget: '',
    geography: founderProfile?.geography || 'Any',
    industry: 'Any'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/gov-schemes');
        if (res.ok) {
          const data = await res.json();
          setGovSchemes(data.schemes || []);
        }
      } catch (err) {
        console.error('Failed to load schemes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateProgram = async (e) => {
    e.preventDefault();
    if (!newProgram.title || !newProgram.description) return;
    
    try {
      const res = await fetch('/api/gov-schemes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProgram)
      });
      if (res.ok) {
        const data = await res.json();
        setGovSchemes(prev => [data.scheme, ...prev]);
        setIsCreateModalOpen(false);
        setNewProgram({
          title: '',
          description: '',
          budget: '',
          geography: founderProfile?.geography || 'Any',
          industry: 'Any'
        });
      }
    } catch (err) {
      console.error('Failed to deploy program:', err);
    }
  };

  const filteredSchemes = govSchemes.filter(scheme => {
    const term = programSearch.toLowerCase().trim();
    if (!term) return true;
    return (
      (scheme.name || scheme.title || '').toLowerCase().includes(term) ||
      (scheme.description || '').toLowerCase().includes(term) ||
      (scheme.geography || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-10 space-y-8 animate-fade-in relative">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-light">
        <div>
          <div className="flex items-center gap-3 mb-2.5">
            <span className="px-2.5 py-1 bg-accent/15 border border-[#C8E64A]/30 text-text-primary text-[10px] font-bold uppercase rounded tracking-wider font-outfit">
              Institution OS
            </span>
            <span className="text-xs font-semibold text-text-muted">Ecosystem Health: Nominal</span>
          </div>
          <h1 className="text-3xl font-outfit font-black tracking-tight text-text-primary">
            {founderProfile.name}
          </h1>
          <p className="text-text-secondary mt-2 max-w-xl text-sm leading-relaxed">
            Monitor regional startup health, distribute grants, and track ecosystem signals for {founderProfile.geography || 'your mandate region'}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/explore" className="os-btn">
            <Search size={14} className="inline mr-1" /> Explore Directory
          </Link>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="os-btn-primary flex items-center gap-1.5"
          >
            <Plus size={14} /> Deploy New Program
          </button>
        </div>
      </div>

      {/* Stats Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
        <div className="os-card bg-card p-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-black uppercase text-text-muted tracking-wider mb-1">Mandate Region Score</p>
            <h3 className="text-3xl font-outfit font-black text-text-primary">84% <span className="text-xs text-text-muted font-light">Average</span></h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-accent/10 border border-[#C8E64A]/30 flex items-center justify-center text-text-primary">
            <Activity size={18} />
          </div>
        </div>

        <div className="os-card bg-card p-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-black uppercase text-text-muted tracking-wider mb-1">Deployed Programs</p>
            <h3 className="text-3xl font-outfit font-black text-text-primary">{govSchemes.length} <span className="text-xs text-text-muted font-light">Active</span></h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Building size={18} />
          </div>
        </div>

        <div className="os-card bg-card p-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-black uppercase text-text-muted tracking-wider mb-1">Ecosystem Grants Deployed</p>
            <h3 className="text-3xl font-outfit font-black text-text-primary">$4.5M <span className="text-xs text-text-muted font-light">Allocated</span></h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <FileText size={18} />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Quick Actions & Intelligence */}
        <div className="lg:col-span-1 space-y-6">
          <div className="os-card bg-[#1A1A1A] text-white border-0 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
              <ShieldCheck size={120} />
            </div>
            <div className="relative z-10">
              <h3 className="font-outfit font-bold text-lg mb-1.5 text-white">Compliance & Audit</h3>
              <p className="text-text-muted text-xs mb-6 max-w-[200px] leading-relaxed">
                Run automated eligibility checks on regional startups.
              </p>
              <Link to="/intelligence" className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-[#111] font-semibold text-xs rounded hover:bg-accent-hover transition-colors shadow-sm">
                Run Audit <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="os-card p-0 overflow-hidden flex flex-col">
            <div className="bg-canvas px-4 py-3.5 border-b border-light flex items-center gap-2">
              <Building size={16} className="text-text-muted" />
              <h3 className="font-outfit font-bold text-sm">Institution Modules</h3>
            </div>
            <div className="divide-y divide-gray-200/60">
              <ModuleLink to="/explore" icon={MapPin} title="Ecosystem Directory" desc="View regional startups" />
              <ModuleLink to="/signals" icon={Activity} title="Health Signals" desc="Macro-economic tracking" />
              <ModuleLink to="/intelligence" icon={BookOpen} title="Impact Reports" desc="Automated impact analysis" />
            </div>
          </div>
        </div>

        {/* Right Column: Active Grants & Programs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="os-card min-h-[400px] flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-3 border-b border-light">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-text-muted" />
                <h3 className="font-outfit font-bold text-base text-text-primary">Active Programs & Grants ({filteredSchemes.length})</h3>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="text" 
                  value={programSearch}
                  onChange={(e) => setProgramSearch(e.target.value)}
                  placeholder="Filter programs..."
                  className="px-2.5 py-1 text-xs border border-gray-250 rounded-lg focus:outline-none focus:border-black font-semibold font-outfit"
                />
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="text-xs text-text-secondary hover:text-text-primary font-semibold hover:underline whitespace-nowrap"
                >
                  + New Program
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredSchemes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSchemes.map(scheme => (
                  <div key={scheme.id} className="border border-gray-250 rounded-lg p-5 hover:border-DEFAULT transition-colors cursor-pointer bg-card flex flex-col justify-between group shadow-sm">
                    <div>
                      <h4 className="font-outfit font-bold text-sm mb-2 text-text-primary group-hover:text-text-primary leading-snug">{scheme.name || scheme.title}</h4>
                      <p className="text-xs text-text-secondary line-clamp-3 mb-4 leading-relaxed font-light">{scheme.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
                      <span className="px-2.5 py-0.5 bg-accent/25 border border-[#C8E64A]/40 text-black text-[9px] font-black uppercase rounded-md">
                        {scheme.incentive || scheme.budget}
                      </span>
                      <span className="px-2 py-0.5 bg-hover border border-light text-text-secondary text-[9px] font-bold uppercase rounded-md flex items-center gap-1">
                        <MapPin size={8} /> {scheme.geography}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Building size={20} className="text-text-muted" />
                </div>
                <h4 className="font-semibold text-text-primary mb-1">No Active Grants</h4>
                <p className="text-xs text-text-secondary max-w-sm mb-5 leading-relaxed">
                  Deploy programs or adjust your search filter to find regional programs.
                </p>
                <button onClick={() => setIsCreateModalOpen(true)} className="os-btn">
                  Create Program
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deploy Program Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-card border border-light shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="bg-canvas border-b border-light px-6 py-4 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <Landmark className="text-text-secondary" size={18} />
                <h3 className="font-outfit font-black text-sm uppercase tracking-wide">Deploy New Grant Program</h3>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateProgram} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-text-secondary tracking-wider mb-1.5">Program Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. DeepTech Commercialization Grant Scheme"
                  value={newProgram.title}
                  onChange={e => setNewProgram(prev => ({ ...prev, title: e.target.value }))}
                  className="os-input"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-text-secondary tracking-wider mb-1.5">Description & Scope *</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Provide details about funding scope, target founders, and application guidelines..."
                  value={newProgram.description}
                  onChange={e => setNewProgram(prev => ({ ...prev, description: e.target.value }))}
                  className="os-input resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-text-secondary tracking-wider mb-1.5">Incentive / Budget *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Up to $100k non-dilutive"
                    value={newProgram.budget}
                    onChange={e => setNewProgram(prev => ({ ...prev, budget: e.target.value }))}
                    className="os-input"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-text-secondary tracking-wider mb-1.5">Geography Mandate</label>
                  <input 
                    type="text" 
                    placeholder="e.g. India, EU, Global"
                    value={newProgram.geography}
                    onChange={e => setNewProgram(prev => ({ ...prev, geography: e.target.value }))}
                    className="os-input"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 select-none">
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-card border border-gray-250 text-gray-650 font-outfit font-bold text-xs uppercase tracking-wider rounded-lg hover:border-DEFAULT cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-accent text-[#111] border-0 font-outfit font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-accent-hover cursor-pointer shadow-sm"
                >
                  Deploy Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ModuleLink({ to, icon: Icon, title, desc }) {
  return (
    <Link to={to} className="group flex items-start gap-4 p-4 hover:bg-hover transition-colors">
      <div className="p-2 bg-card border border-light rounded-lg text-text-muted group-hover:text-text-primary group-hover:border-DEFAULT transition-colors">
        <Icon size={16} />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-sm text-text-primary mb-0.5 group-hover:text-text-primary transition-colors">{title}</h4>
        <p className="text-xs text-text-secondary">{desc}</p>
      </div>
    </Link>
  );
}
