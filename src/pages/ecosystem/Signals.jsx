import React, { useState, useEffect } from 'react';
import { Radio, AlertCircle, Compass, Search, RefreshCw, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';
import AuthGate from '../../components/AuthGate';

export default function Signals({ founderProfile, user, openAuthModal }) {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [impactFilter, setImpactFilter] = useState('all');
  const [mode, setMode] = useState('demo');

  const fetchSignals = async () => {
    if (!founderProfile) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/signals/history');
      if (!response.ok) {
        throw new Error(`Failed to fetch signal history: HTTP ${response.status}`);
      }
      const data = await response.json();
      setSignals(data.history || data.signals || []);
      setMode('live');
    } catch (err) {
      setError(err.message || 'Failed to sync with signal history.');
    } finally {
      setLoading(false);
    }
  };

  const sweepSignals = async () => {
    if (!founderProfile) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/signals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          founderProfile: founderProfile,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to sweep signals: HTTP ${response.status}`);
      }

      await fetchSignals();

      confetti({
        particleCount: 50,
        spread: 40,
        colors: ['#C8E64A', '#1A1A1A', '#FAF9F6']
      });
    } catch (err) {
      setError(err.message || 'Failed to sync with signal feeds.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, [founderProfile]);

  const filteredSignals = signals.filter((sig) => {
    const matchesSearch = 
      sig.title?.toLowerCase().includes(search.toLowerCase()) || 
      sig.description?.toLowerCase().includes(search.toLowerCase()) || 
      sig.type?.toLowerCase().includes(search.toLowerCase());
    
    const matchesSentiment = 
      sentimentFilter === 'all' || 
      sig.sentiment?.toLowerCase() === sentimentFilter.toLowerCase();
    
    const matchesImpact = 
      impactFilter === 'all' || 
      sig.impact?.toLowerCase() === impactFilter.toLowerCase();

    return matchesSearch && matchesSentiment && matchesImpact;
  });

  const getSentimentStyles = (sentiment) => {
    switch (sentiment?.toUpperCase()) {
      case 'POSITIVE':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'NEGATIVE':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  const getImpactStyles = (impact) => {
    switch (impact?.toUpperCase()) {
      case 'HIGH':
        return 'bg-[#C8E64A]/10 text-[#111] border-[#C8E64A]/30';
      case 'MEDIUM':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-400 border-gray-100';
    }
  };

  return (
    <AuthGate user={user} openAuthModal={openAuthModal} message="Sign in to sweep live market signals and track competitor activity for your startup.">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-200/60 select-none">
          <div className="flex items-center gap-3">
            <div className="bg-[#1A1A1A] p-3 text-white rounded-lg">
              <Radio size={24} className={loading ? 'animate-pulse' : ''} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-outfit font-black tracking-tight">Signals Hub</h1>
              <p className="font-inter text-gray-500 mt-1 text-xs sm:text-sm">
                Active sector sweeps and real-time competitor feeds.
              </p>
            </div>
          </div>
          
          {founderProfile && (
            <button
              onClick={sweepSignals}
              disabled={loading}
              className="os-btn-primary flex items-center gap-2"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>SWEEP FEEDS</span>
            </button>
          )}
        </div>

        {!founderProfile ? (
          <div className="os-card p-12 text-center bg-white space-y-4 max-w-xl mx-auto select-none">
            <AlertCircle size={40} className="mx-auto text-gray-300" />
            <h2 className="text-xl font-outfit font-bold tracking-tight">No Active Profile</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Set up your industry and geography in Onboarding to start monitoring sector signals.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Filter Bar (Col span: 12) */}
            <div className="col-span-12 os-card bg-[#FAF9F6] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 select-none">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search signals..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="os-input pl-10 py-2 text-sm w-full"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Sentiment filter */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-gray-400">Sentiment</span>
                  <select
                    value={sentimentFilter}
                    onChange={(e) => setSentimentFilter(e.target.value)}
                    className="os-input py-1.5 px-3 text-xs w-36"
                  >
                    <option value="all">All Sentiments</option>
                    <option value="positive">Positive</option>
                    <option value="negative">Negative</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>

                {/* Impact filter */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-gray-400">Impact</span>
                  <select
                    value={impactFilter}
                    onChange={(e) => setImpactFilter(e.target.value)}
                    className="os-input py-1.5 px-3 text-xs w-36"
                  >
                    <option value="all">All Impacts</option>
                    <option value="high">High Impact</option>
                    <option value="medium">Medium Impact</option>
                    <option value="low">Low Impact</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Feeds Source Indicator */}
            <div className="col-span-12 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 select-none">
              <span>MODE: {mode === 'live' ? '⚡ LIVE REAL-TIME WEB' : '📁 SIMULATED HISTORICAL FEED'}</span>
              <span>SHOWING {filteredSignals.length} OF {signals.length} SIGNALS</span>
            </div>

            {/* Signals Stream (Col span: 12) */}
            <div className="col-span-12 space-y-4">
              {loading && signals.length === 0 ? (
                <div className="os-card p-16 text-center bg-white space-y-4 select-none">
                  <RefreshCw size={36} className="mx-auto animate-spin text-black" />
                  <span className="font-outfit font-bold uppercase text-xs">Sweeping internet news for {founderProfile.industry}...</span>
                </div>
              ) : error ? (
                <div className="os-card p-6 bg-red-50 border border-red-200 text-[#EF4444] flex items-start gap-3 rounded-xl">
                  <AlertCircle size={20} className="shrink-0" />
                  <div>
                    <span className="uppercase text-xs font-bold block mb-1">Network Error</span>
                    <p className="text-xs font-semibold">{error}</p>
                  </div>
                </div>
              ) : filteredSignals.length === 0 ? (
                <div className="os-card p-16 text-center bg-white space-y-4 select-none">
                  <Compass size={36} className="mx-auto text-gray-300" />
                  <span className="font-outfit font-bold uppercase text-xs tracking-wider">No signals found matching filters</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSignals.map((sig, index) => (
                    <div
                      key={index}
                      className="os-card bg-white flex flex-col md:flex-row md:items-start gap-5 p-5 relative group"
                    >
                      {/* Left: Signal metadata */}
                      <div className="md:w-36 shrink-0 space-y-2 select-none">
                        <span className="inline-flex items-center px-2 py-1 rounded text-[9px] font-bold border border-gray-200 w-full text-center tracking-wider block justify-center bg-gray-50 text-gray-500 overflow-hidden truncate">
                          {sig.type || 'SIGNAL'}
                        </span>
                        
                        <div className="flex gap-2 w-full">
                          <span className={`border px-2 py-0.5 text-[8px] font-bold uppercase rounded-md tracking-wide text-center flex-1 ${getSentimentStyles(sig.sentiment)}`}>
                            {sig.sentiment || 'Neutral'}
                          </span>
                          <span className={`border px-2 py-0.5 text-[8px] font-bold uppercase rounded-md tracking-wide text-center flex-1 ${getImpactStyles(sig.impact)}`}>
                            {sig.impact || 'Low'}
                          </span>
                        </div>
                      </div>

                      {/* Right: Content */}
                      <div className="flex-1 space-y-2">
                        <h3 className="font-outfit font-bold text-base md:text-lg text-black uppercase tracking-tight leading-tight group-hover:underline">
                          {sig.title}
                        </h3>
                        <p className="text-xs md:text-sm font-semibold font-inter text-gray-700 leading-relaxed font-light">
                          {sig.description}
                        </p>

                        {/* Source */}
                        {sig.source && (
                          <div className="pt-2 flex items-center justify-end select-none">
                            {sig.source.url ? (
                              <a
                                href={sig.source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-gray-450 hover:text-black transition-colors"
                              >
                                <span>Grounding Source: {sig.source.title}</span>
                                <ExternalLink size={10} />
                              </a>
                            ) : (
                              <span className="text-[10px] font-semibold uppercase text-gray-400">
                                Grounding Source: {sig.source.title}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AuthGate>
  );
}
