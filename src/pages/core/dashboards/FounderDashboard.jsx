import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, MapPin, FileText, ArrowRight, BookOpen, ExternalLink, Activity, Target, Zap, Clock, TrendingUp
} from 'lucide-react';

export default function FounderDashboard({ founderProfile, user, openAuthModal, currentReport, setCurrentReport }) {
  const [myStartup, setMyStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const [decisionsCount, setDecisionsCount] = useState(0);

  useEffect(() => {
    const handleOutsideClick = () => {
      setIsActionDropdownOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

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

    const fetchDecisions = async () => {
      try {
        const res = await fetch('/api/decisions');
        if (res.ok) {
          const data = await res.json();
          setDecisionsCount(data.decisions?.length || 0);
        }
      } catch (e) {
        console.error('Failed to load decisions:', e);
      }
    };

    fetchData();
    if (user) {
      fetchDecisions();
    }
  }, [user]);

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-10 space-y-8 animate-fade-in">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-200/60">
        <div>
          <div className="flex items-center gap-3 mb-2.5">
            <span className="px-2.5 py-1 bg-[#C8E64A]/15 border border-[#C8E64A]/30 text-[#111] text-[10px] font-bold uppercase rounded tracking-wider font-outfit">
              Founder OS
            </span>
            <span className="text-xs font-semibold text-gray-400">Status: Active</span>
          </div>
          <h1 className="text-3xl font-outfit font-black tracking-tight text-[#111]">
            {myStartup ? myStartup.name : founderProfile.name}
          </h1>
          <p className="text-gray-500 mt-2 max-w-xl text-sm leading-relaxed">
            {myStartup ? myStartup.pitch : 'Initialize your startup graph to unlock automated intelligence.'}
          </p>
        </div>
        <div className="flex items-center gap-3 relative">
          <Link to={`/startups/${myStartup?.id || 'my'}`} className="os-btn select-none">
            View Public Profile
          </Link>
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsActionDropdownOpen(!isActionDropdownOpen);
              }}
              className="os-btn-primary flex items-center gap-1.5 select-none"
            >
              New Strategic Action <span className="text-[9px]">▼</span>
            </button>
            {isActionDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 shadow-xl rounded-xl z-50 py-1" onClick={(e) => e.stopPropagation()}>
                <Link to="/intelligence" onClick={() => setIsActionDropdownOpen(false)} className="block px-4 py-2.5 text-xs font-bold uppercase text-gray-700 hover:bg-[#C8E64A]/15 hover:text-black transition-colors">
                  💡 Generate brief / report
                </Link>
                <Link to="/runway" onClick={() => setIsActionDropdownOpen(false)} className="block px-4 py-2.5 text-xs font-bold uppercase text-gray-700 hover:bg-[#C8E64A]/15 hover:text-black transition-colors">
                  📊 Simulate runway Burn
                </Link>
                <Link to="/memory" onClick={() => setIsActionDropdownOpen(false)} className="block px-4 py-2.5 text-xs font-bold uppercase text-gray-700 hover:bg-[#C8E64A]/15 hover:text-black transition-colors">
                  🧠 Log hypothesis memory
                </Link>
                <Link to="/bounties" onClick={() => setIsActionDropdownOpen(false)} className="block px-4 py-2.5 text-xs font-bold uppercase text-gray-700 hover:bg-[#C8E64A]/15 hover:text-black transition-colors">
                  🛠️ Post micro bounty task
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
        <div className="os-card bg-white p-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Stratify Validation Score</p>
            <h3 className="text-3xl font-outfit font-black text-[#111]">{myStartup?.score || founderProfile.score || 10} <span className="text-xs text-gray-400 font-light">/ 100</span></h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#C8E64A]/10 border border-[#C8E64A]/30 flex items-center justify-center text-[#111]">
            <Target size={18} />
          </div>
        </div>

        <div className="os-card bg-white p-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Active Bounties</p>
            <h3 className="text-3xl font-outfit font-black text-[#111]">2 <span className="text-xs text-gray-400 font-light">Tasks</span></h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Zap size={18} />
          </div>
        </div>

        <div className="os-card bg-white p-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Logged Memories</p>
            <h3 className="text-3xl font-outfit font-black text-[#111]">{decisionsCount} <span className="text-xs text-gray-400 font-light">Pivots</span></h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <BookOpen size={18} />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Actions & Agent */}
        <div className="lg:col-span-1 space-y-6">
          <div className="os-card bg-[#1A1A1A] text-white border-0 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
              <Zap size={120} />
            </div>
            <div className="relative z-10">
              <h3 className="font-outfit font-bold text-lg mb-1.5 text-white">Intelligence Agent</h3>
              <p className="text-gray-400 text-xs mb-6 max-w-[200px] leading-relaxed">
                Generate reports, validate hypotheses, or analyze competitors instantly.
              </p>
              <Link to="/intelligence" className="inline-flex items-center gap-2 px-4 py-2 bg-[#C8E64A] text-[#111] font-semibold text-xs rounded hover:bg-[#B5D235] transition-colors shadow-sm">
                Open Workspace <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="os-card p-0 overflow-hidden flex flex-col">
            <div className="bg-[#FAF9F6] px-4 py-3.5 border-b border-gray-200/60 flex items-center gap-2">
              <Compass size={16} className="text-gray-400" />
              <h3 className="font-outfit font-bold text-sm">Strategic Modules</h3>
            </div>
            <div className="divide-y divide-gray-200/60">
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
            <div className="os-card flex flex-col justify-between h-44">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-gray-400" />
                  <h3 className="font-outfit font-bold text-base text-[#111]">Timeline</h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  Log critical company milestones, product launches, and fundraises to your graph.
                </p>
              </div>
              <Link to="/timeline" className="text-xs font-semibold text-[#111] hover:underline flex items-center gap-1">
                View Timeline <ArrowRight size={14} />
              </Link>
            </div>

            <div className="os-card flex flex-col justify-between h-44">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={16} className="text-gray-400" />
                  <h3 className="font-outfit font-bold text-base text-[#111]">Market Signals</h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  Monitor competitors, ecosystem news, and funding rounds relevant to your industry.
                </p>
              </div>
              <Link to="/signals" className="text-xs font-semibold text-[#111] hover:underline flex items-center gap-1">
                Explore Signals <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="os-card min-h-[300px]">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200/60">
              <h3 className="font-outfit font-bold text-base text-[#111]">Active Briefs & Reports</h3>
              <Link to="/intelligence" className="text-xs text-gray-500 hover:text-gray-900 font-medium">View All</Link>
            </div>
            
            {/* Empty State */}
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText size={20} className="text-gray-400" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">No Active Reports</h4>
              <p className="text-xs text-gray-500 max-w-sm mb-5 leading-relaxed">
                Start a new intelligence task to generate market research, validate a pivot, or prepare an investor memo.
              </p>
              <Link to="/intelligence" className="os-btn">
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
