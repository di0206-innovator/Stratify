import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldAlert, ExternalLink, Lock, Check, Copy, Globe, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import BentoCard from '../components/BentoCard';

export default function PitchBrief({ mode = 'builder', founderProfile }) {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [briefId, setBriefId] = useState('');
  const [pitch, setPitch] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [whitelistInput, setWhitelistInput] = useState('');
  const [deckUrl, setDeckUrl] = useState('');
  const [showRunway, setShowRunway] = useState(true);
  const [score, setScore] = useState(10);

  useEffect(() => {
    if (mode === 'builder') {
      fetchMyBrief();
    } else {
      fetchPublicBrief();
    }
  }, [id, mode]);

  const fetchMyBrief = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/briefs');
      if (res.ok) {
        const data = await res.json();
        if (data.briefs && data.briefs.length > 0) {
          const b = data.briefs[0];
          setBriefId(b.id);
          setPitch(b.pitch);
          setProblem(b.problem);
          setSolution(b.solution);
          setIsPublic(b.isPublic);
          setWhitelistInput(b.whitelist ? b.whitelist.join(', ') : '');
          setDeckUrl(b.deckUrl);
          setShowRunway(b.showRunway);
        }
      }
    } catch (e) {
      console.error('Failed to load my brief:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicBrief = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/briefs/${id}`);
      if (res.ok) {
        const data = await res.json();
        const b = data.brief;
        setBriefId(b.id);
        setPitch(b.pitch);
        setProblem(b.problem);
        setSolution(b.solution);
        setIsPublic(b.isPublic);
        setDeckUrl(b.deckUrl);
        setShowRunway(b.showRunway);
        setScore(b.score || 10);
      } else {
        if (res.status === 403) {
          setError({ type: 'UNAUTHORIZED', message: 'Access denied. You are not on the investor whitelist for this strategic data room.' });
        } else {
          setError({ type: 'NOT_FOUND', message: 'The requested pitch brief or data room was not found.' });
        }
      }
    } catch (e) {
      setError({ type: 'ERROR', message: 'Failed to establish connection to data room.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const whitelist = whitelistInput
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    try {
      const res = await fetch('/api/briefs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pitch,
          problem,
          solution,
          isPublic,
          whitelist,
          deckUrl,
          showRunway
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBriefId(data.brief.id);
        confetti({
          particleCount: 80,
          spread: 50,
          colors: ['#C8E64A', '#1A1A1A', '#FAF9F6']
        });
      }
    } catch (err) {
      console.error('Failed to save brief:', err);
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/brief/${briefId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center">
        <RefreshCw size={36} className="mx-auto animate-spin text-black" />
        <span className="font-outfit font-bold text-xs uppercase tracking-wider mt-4 block">Accessing Strategic Vault...</span>
      </div>
    );
  }

  // Whitelist Lock Screen
  if (error && error.type === 'UNAUTHORIZED') {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 relative z-10">
        <div className="os-card bg-white p-8 sm:p-12 text-center select-none space-y-6">
          <div className="inline-flex p-4 bg-red-50 border border-red-200 text-red-650 rounded-full">
            <Lock size={40} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-outfit font-black uppercase tracking-tight text-black">
              Restricted Data Room
            </h1>
            <span className="inline-block bg-red-50 border border-red-200 text-red-600 px-2.5 py-1 rounded-md font-bold text-[9px] uppercase tracking-wider mt-2">
              Whitelist Authorization Required
            </span>
          </div>
          <p className="text-xs text-gray-500 font-semibold max-w-sm mx-auto leading-relaxed font-inter font-light">
            {error.message}
          </p>
          <div className="border border-gray-205 p-4 bg-[#FAF9F6] max-w-sm mx-auto text-left rounded-xl">
            <span className="text-[9px] font-bold uppercase text-gray-400 block mb-1 tracking-wide">Access Protocol</span>
            <p className="text-xs text-gray-500 leading-relaxed font-light">
              Only whitelisted investor emails or domains (e.g. fund-address.com) configured by the founder can unlock these credentials.
            </p>
          </div>
          <div>
            <Link to="/" className="os-btn px-4 py-2 text-xs font-semibold rounded-lg select-none">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Not Found Error
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 relative z-10">
        <div className="os-card bg-white p-8 sm:p-12 text-center select-none space-y-6">
          <div className="inline-flex p-4 bg-amber-50 border border-amber-200 text-amber-600 rounded-full">
            <ShieldAlert size={40} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-outfit font-black uppercase tracking-tight text-black">
              Vault Error
            </h1>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed font-inter font-light mt-2">
              {error.message}
            </p>
          </div>
          <div>
            <Link to="/" className="os-btn px-4 py-2 text-xs font-semibold rounded-lg bg-black text-white hover:bg-gray-800 border-0">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 1. PUBLIC VIEW MODE
  if (mode === 'public') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 relative z-10 space-y-8 text-[#111] animate-fade-in">
        {/* Startup Pitch Header */}
        <div className="os-card bg-[#1A1A1A] text-white p-8 select-none relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full transform translate-x-20 -translate-y-20 font-outfit"></div>
          
          <div className="relative z-10 space-y-2">
            <div className="flex gap-2">
              <span className="inline-block bg-[#C8E64A]/10 border border-[#C8E64A]/30 text-white px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md">
                Grounded Strategic Brief
              </span>
              <span className="inline-block bg-white/10 border border-white/20 text-white px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1">
                <Globe size={10} className="text-[#C8E64A]" /> {isPublic ? 'PUBLIC DATA ROOM' : 'RESTRICTED VAULT'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-outfit font-black tracking-tight uppercase leading-none">
              {pitch ? pitch.split(' ').slice(0, 3).join(' ') : 'STEALTH'} BRIEF
            </h1>
            <p className="text-xs text-gray-300 font-light mt-1.5 uppercase font-mono">
              Live Network Score: <span className="font-bold text-[#C8E64A]">{score}</span>
            </p>
          </div>

          {deckUrl && (
            <a
              href={deckUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 inline-flex items-center gap-2 px-5 py-3 bg-[#C8E64A] text-black font-outfit font-bold text-xs uppercase hover:bg-[#B5D235] transition-all cursor-pointer rounded-lg border-0 shadow-sm"
            >
              <ExternalLink size={14} />
              <span>ACCESS PITCH SLIDES</span>
            </a>
          )}
        </div>

        {/* Pitch Data Rows */}
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-6 flex flex-col justify-stretch">
            <BentoCard title="The Problem Statement" badge="PAIN POINT AUDIT" badgeColor="bg-black">
              <div className="border border-gray-200 p-5 bg-[#FAF9F6] rounded-xl flex-1 text-left">
                <p className="text-xs text-gray-500 font-light font-inter leading-relaxed whitespace-pre-wrap">
                  {problem || 'No problem statement defined.'}
                </p>
              </div>
            </BentoCard>
          </div>

          <div className="col-span-12 md:col-span-6 flex flex-col justify-stretch">
            <BentoCard title="The Solution Wedge" badge="PRODUCT DEFENSE" badgeColor="bg-black">
              <div className="border border-gray-200 p-5 bg-[#FAF9F6] rounded-xl flex-1 text-left">
                <p className="text-xs text-gray-500 font-light font-inter leading-relaxed whitespace-pre-wrap">
                  {solution || 'No solution details defined.'}
                </p>
              </div>
            </BentoCard>
          </div>

          {/* Runway indicators if visibility toggled */}
          {showRunway && (
            <div className="col-span-12">
              <BentoCard title="Strategic Runway Posture" badge="VERIFIED LIVE GRAPH" badgeColor="bg-black">
                <div className="border border-gray-200 p-6 bg-white rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 text-left">
                  <div className="space-y-1 text-center sm:text-left select-none">
                    <h4 className="font-outfit font-bold text-sm text-black uppercase">Financial Health Verified</h4>
                    <p className="text-xs text-gray-500 font-semibold leading-relaxed font-light font-inter max-w-lg">
                      This startup has linked their interactive runway tools. The live forecast demonstrates sustainable capitalization loops.
                    </p>
                  </div>
                  <Link to="/runway" className="os-btn bg-[#C8E64A] hover:bg-[#B5D235] text-black font-outfit font-bold text-xs uppercase px-4 py-2.5 rounded-lg border-0 shadow-sm">
                    Open Runway Planner
                  </Link>
                </div>
              </BentoCard>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. BUILDER MODE
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 relative z-10 space-y-8 text-[#111] animate-fade-in">
      {/* Title */}
      <div className="os-card bg-[#1A1A1A] text-white p-8 sm:p-12 mb-8 select-none relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full transform translate-x-20 -translate-y-20"></div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-outfit font-black tracking-tight text-white uppercase leading-none">
            Pitch Brief & Data Room
          </h1>
          <p className="font-inter text-gray-300 mt-2 text-xs sm:text-sm font-light">
            Build whitelisted briefs, manage investor access, and share verified startup scores.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Side: Builder Form */}
        <div className="col-span-12 lg:col-span-7">
          <BentoCard title="Compile Pitch Brief" badge="DATA ROOM SETTINGS" badgeColor="bg-black">
            <form onSubmit={handleSave} className="space-y-4">
              {/* Pitch */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wide mb-1.5">Elevator Pitch</label>
                <input
                  type="text"
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  placeholder="e.g. Decentralized cold brew subscription networks..."
                  required
                  className="os-input"
                />
              </div>

              {/* Problem */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wide mb-1.5">The Problem</label>
                <textarea
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="What customer gap does your startup address?"
                  rows={3}
                  required
                  className="os-input resize-none"
                />
              </div>

              {/* Solution */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wide mb-1.5">The Solution</label>
                <textarea
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="How does your product validate customer retention?"
                  rows={3}
                  required
                  className="os-input resize-none"
                />
              </div>

              {/* Pitch Slides Link */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wide mb-1.5">Pitch Deck Link (Slideshare, PDF URL)</label>
                <input
                  type="url"
                  value={deckUrl}
                  onChange={(e) => setDeckUrl(e.target.value)}
                  placeholder="https://..."
                  className="os-input"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="border border-gray-200 p-4 bg-[#FAF9F6] rounded-xl select-none text-left flex flex-col justify-between">
                  <span className="block text-[9px] font-bold uppercase text-gray-400 mb-1.5 tracking-wide">Runway Visibility</span>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-gray-700">
                    <input
                      type="checkbox"
                      checked={showRunway}
                      onChange={(e) => setShowRunway(e.target.checked)}
                      className="accent-black cursor-pointer w-4 h-4 rounded border-gray-300"
                    />
                    <span>Show Runway</span>
                  </label>
                </div>

                <div className="border border-gray-200 p-4 bg-[#FAF9F6] rounded-xl select-none text-left flex flex-col justify-between">
                  <span className="block text-[9px] font-bold uppercase text-gray-400 mb-1.5 tracking-wide">Access Scope</span>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-gray-700">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="accent-black cursor-pointer w-4 h-4 rounded border-gray-300"
                    />
                    <span>Open Publicly</span>
                  </label>
                </div>
              </div>

              {/* Whitelist Configuration (if not public) */}
              {!isPublic && (
                <div className="border border-gray-200 p-4 bg-[#FAF9F6] rounded-xl text-left animate-slide-up">
                  <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wide mb-1.5">
                    Investor Whitelist (Comma-separated emails or domains)
                  </label>
                  <input
                    type="text"
                    value={whitelistInput}
                    onChange={(e) => setWhitelistInput(e.target.value)}
                    placeholder="e.g. partner@sequoia.com, tigerglobal.com, angelinvestor@gmail.com"
                    className="os-input bg-white"
                  />
                  <span className="block text-[9px] font-semibold text-gray-400 mt-1 leading-normal">
                    Whitelists filter emails or entire email domains automatically.
                  </span>
                </div>
              )}

              <div className="pt-2 select-none">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-[#C8E64A] text-black font-outfit font-bold text-xs uppercase hover:bg-[#B5D235] transition-all rounded-lg border-0 shadow-sm"
                >
                  <span>{saving ? 'COMPILING VAULT...' : 'SAVE & COMPILE BRIEF'}</span>
                </button>
              </div>
            </form>
          </BentoCard>
        </div>

        {/* Right Side: Data Room Access Hub */}
        <div className="col-span-12 lg:col-span-5">
          <BentoCard title="Access Hub" badge="DISTRIBUTION CENTER" badgeColor="bg-black">
            {briefId ? (
              <div className="space-y-4 h-full flex flex-col justify-between">
                <div className="space-y-4 select-none">
                  <div className="border border-gray-200 p-4 bg-[#FAF9F6] rounded-xl text-left">
                    <span className="text-[9px] font-bold uppercase text-gray-400 block mb-1 tracking-wide">Vault Status</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${isPublic ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="font-outfit font-bold text-[10px] uppercase text-[#111] tracking-wide leading-none">
                        {isPublic ? 'PUBLIC ACCESS ACTIVE' : 'RESTRICTED ACCESS ACTIVE'}
                      </span>
                    </div>
                  </div>

                  <div className="border border-gray-200 p-4 bg-[#FAF9F6] rounded-xl text-left">
                    <span className="text-[9px] font-bold uppercase text-gray-400 block mb-2 tracking-wide">Direct Data Room Link</span>
                    <div className="flex items-center gap-2 border border-gray-250 bg-white px-3 py-2 rounded-lg select-all">
                      <span className="font-mono text-[10px] truncate flex-1 text-black font-semibold">
                        {window.location.origin}/brief/{briefId}
                      </span>
                      <button
                        onClick={copyLink}
                        className="p-1 hover:bg-gray-50 rounded border border-gray-200 cursor-pointer text-gray-550 transition-colors"
                        title="Copy Link"
                      >
                        {copied ? <Check size={14} className="text-[#C8E64A]" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 bg-[#FAF9F6] rounded-xl p-6 flex flex-col items-center justify-center text-center py-8">
                  <Globe size={32} className="text-black mb-3" />
                  <h4 className="font-outfit font-bold text-xs uppercase tracking-wide">Open Public Preview</h4>
                  <p className="text-[10px] text-gray-500 font-semibold mb-4 leading-normal max-w-[200px] mx-auto font-inter">
                    Analyze how whitelisted investors see your presentation.
                  </p>
                  <Link
                    to={`/brief/${briefId}`}
                    className="os-btn-primary px-4 py-2 text-xs font-semibold select-none"
                  >
                    Launch Data Room
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 font-outfit font-bold text-xs uppercase select-none border border-dashed border-gray-300 rounded-xl">
                Save your first brief to compile the data room distribution links.
              </div>
            )}
          </BentoCard>
        </div>
      </div>
    </div>
  );
}
