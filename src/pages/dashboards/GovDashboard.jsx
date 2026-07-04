import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building, MapPin, Activity, FileText, ArrowRight, ShieldCheck, Search, BookOpen
} from 'lucide-react';

export default function GovDashboard({ founderProfile, user }) {
  const [govSchemes, setGovSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded tracking-wider">
              Institution OS
            </span>
            <span className="text-sm font-medium text-gray-500">Ecosystem Health: Nominal</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {founderProfile.name}
          </h1>
          <p className="text-gray-500 mt-1 max-w-xl text-sm leading-relaxed">
            Monitor regional startup health, distribute grants, and track ecosystem signals for {founderProfile.geography || 'your mandate region'}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/explore" className="os-btn-primary">
            <Search size={16} /> Regional Map
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Quick Actions & Intelligence */}
        <div className="lg:col-span-1 space-y-6">
          <div className="os-card bg-emerald-900 text-white border-0 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
              <ShieldCheck size={120} />
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-1">Compliance & Audit</h3>
              <p className="text-emerald-200 text-xs mb-6 max-w-[200px] leading-relaxed">
                Run automated eligibility checks on regional startups.
              </p>
              <Link to="/reports" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-900 font-semibold text-xs rounded hover:bg-gray-100 transition-colors">
                Run Audit <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="os-card p-0 overflow-hidden flex flex-col">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Building size={16} className="text-gray-500" />
              <h3 className="font-bold text-sm">Institution Modules</h3>
            </div>
            <div className="divide-y divide-gray-100">
              <ModuleLink to="/explore" icon={MapPin} title="Ecosystem Directory" desc="View regional startups" />
              <ModuleLink to="/signals" icon={Activity} title="Health Signals" desc="Macro-economic tracking" />
              <ModuleLink to="/reports" icon={BookOpen} title="Impact Reports" desc="Automated impact analysis" />
            </div>
          </div>
        </div>

        {/* Right Column: Active Grants & Programs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="os-card min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-emerald-500" />
                <h3 className="font-bold">Active Programs & Grants</h3>
              </div>
              <button className="text-xs text-gray-500 hover:text-gray-900 font-medium">Manage Programs</button>
            </div>
            
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : govSchemes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {govSchemes.map(scheme => (
                  <div key={scheme.id} className="border border-gray-200 rounded-md p-4 hover:border-emerald-300 transition-colors cursor-pointer">
                    <h4 className="font-bold text-sm mb-1">{scheme.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{scheme.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded">{scheme.budget}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <Building size={20} className="text-gray-400" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">No Active Grants</h4>
                <p className="text-xs text-gray-500 max-w-sm mb-4">
                  Deploy programs to support technical founders in your mandate region.
                </p>
                <button className="os-btn">
                  Create Program
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
    <Link to={to} className="group flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors">
      <div className="p-2 bg-white border border-gray-200 rounded-md text-gray-500 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-colors">
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-sm text-gray-900 mb-0.5 group-hover:text-emerald-600 transition-colors">{title}</h4>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
    </Link>
  );
}
