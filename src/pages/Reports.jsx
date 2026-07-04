import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Trash2, Calendar, Lock, LogIn, AlertCircle, Compass, ClipboardList, Shield, Globe, Copy, Check, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';

export default function Reports({ user, setUser, openAuthModal, founderProfile }) {
  const [activeTab, setActiveTab] = useState('insights'); // 'insights' or 'dataroom'
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [reportsError, setReportsError] = useState(null);

  // Pitch Brief states
  const [briefId, setBriefId] = useState('');
  const [pitch, setPitch] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [whitelistInput, setWhitelistInput] = useState('');
  const [deckUrl, setDeckUrl] = useState('');
  const [showRunway, setShowRunway] = useState(true);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [savingBrief, setSavingBrief] = useState(false);
  const [copied, setCopied] = useState(false);
  const [myStartup, setMyStartup] = useState(null);

  const fetchMyStartup = async () => {
    try {
      const res = await fetch('/api/startups/my');
      if (res.ok) {
        const data = await res.json();
        setMyStartup(data.startup || null);
      }
    } catch (e) {
      console.error('Failed to load my startup in reports:', e);
    }
  };

  const fetchReports = async () => {
    setLoadingReports(true);
    setReportsError(null);
    try {
      const res = await fetch('/api/reports');
      if (!res.ok) {
        throw new Error('Failed to retrieve reports from database.');
      }
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      setReportsError(err.message);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchMyBrief = async () => {
    setLoadingBrief(true);
    try {
      const res = await fetch('/api/briefs');
      if (res.ok) {
        const data = await res.json();
        if (data.briefs && data.briefs.length > 0) {
          const b = data.briefs[0];
          setBriefId(b.id);
          setPitch(b.pitch || '');
          setProblem(b.problem || '');
          setSolution(b.solution || '');
          setIsPublic(b.isPublic ?? true);
          setWhitelistInput(b.whitelist ? b.whitelist.join(', ') : '');
          setDeckUrl(b.deckUrl || '');
          setShowRunway(b.showRunway ?? true);
        }
      }
    } catch (e) {
      console.error('Failed to load my brief:', e);
    } finally {
      setLoadingBrief(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReports();
      fetchMyBrief();
      fetchMyStartup();
    } else {
      setLoadingReports(false);
      setReports([]);
      setMyStartup(null);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setReports([]);
      confetti({
        particleCount: 30,
        spread: 30,
        colors: ['#000', '#F8F7F4']
      });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleDeleteReport = async (reportId, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this strategic brief?')) return;

    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        confetti({
          particleCount: 30,
          spread: 30,
          colors: ['#F472B6', '#000000']
        });
      } else {
        alert('Failed to delete report.');
      }
    } catch (err) {
      console.error('Delete report error:', err);
    }
  };

  const handleSaveBrief = async (e) => {
    e.preventDefault();
    setSavingBrief(true);
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
          colors: ['#EF4444', '#FCD34D', '#3B82F6']
        });
      }
    } catch (err) {
      console.error('Failed to save brief:', err);
    } finally {
      setSavingBrief(false);
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/brief/${briefId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-[3px] border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] select-none">
        <div className="flex items-center gap-3">
          <div className="bg-[#C084FC] border-[3px] border-black p-3.5 text-black">
            <FileText size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Intelligence & Pitch Briefs</h1>
            <p className="font-outfit font-bold text-gray-600 mt-1 text-xs sm:text-sm">
              Manage your AI strategic reports and configure your whitelisted investor data room.
            </p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3 self-start md:self-auto select-none">
            <span className="text-xs font-black uppercase border-2 border-black px-2 py-1 bg-white">
              {user.username || user.email}
            </span>
            <button
              onClick={handleLogout}
              className="neo-btn-secondary px-4 py-1.5 text-xs font-black cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {!user ? (
        /* Interactive Locked Screen */
        <div className="max-w-lg mx-auto neo-card bg-white mt-12 p-12 text-center space-y-6 select-none animate-in fade-in zoom-in-95 duration-150">
          <div className="inline-flex items-center justify-center bg-[#C084FC] border-[3px] border-black p-4 text-black transform rotate-3">
            <Lock size={36} strokeWidth={3} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">Library Access Locked</h2>
            <p className="text-xs sm:text-sm font-semibold font-inter text-gray-600 max-w-sm mx-auto leading-relaxed">
              Please sign in or join the network to view and manage your compiled strategic briefs, roadmaps, and execution plans.
            </p>
          </div>
          <button
            onClick={openAuthModal}
            className="w-full bg-[#A3E635] border-[3px] border-black text-black font-black py-3 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer uppercase text-xs tracking-wider"
          >
            <LogIn size={16} strokeWidth={3} />
            <span>Sign In / Register</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Shared Top Summary */}
          {(() => {
            const sortedReports = [...reports].sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
            const latestReport = sortedReports[0];
            const validationScoreVal = latestReport?.rawStrategy?.validationScore ? `${latestReport.rawStrategy.validationScore}%` : myStartup?.validation_score ? `${myStartup.validation_score}%` : null;

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#F8F7F4] border-[3px] border-black p-4 select-none">
                <div className="border-[2px] border-black p-3 bg-white flex justify-between items-center">
                  <div>
                    <span className="block text-[8px] font-black uppercase text-gray-500">LATEST INTEL SCORE</span>
                    <span className="text-xl font-black text-[#EF4444]">{validationScoreVal || 'NOT AUDITED'}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 border border-black font-black uppercase ${validationScoreVal ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-450'}`}>
                    {validationScoreVal ? 'Compiled' : 'Pending'}
                  </span>
                </div>

                <div className="border-[2px] border-black p-3 bg-white flex justify-between items-center">
                  <div>
                    <span className="block text-[8px] font-black uppercase text-gray-500">BRIEF DISCLOSURE STATE</span>
                    <span className="text-xs font-black text-[#3B82F6] uppercase">
                      {briefId ? (isPublic ? 'PUBLIC ACCESS' : 'WHITELIST ONLY') : 'NOT INITIALIZED'}
                    </span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 border border-black font-black uppercase ${briefId ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-550'}`}>
                    {briefId ? 'Ready' : 'Draft'}
                  </span>
                </div>

                <div className="border-[2px] border-black p-3 bg-white flex justify-between items-center">
                  <div>
                    <span className="block text-[8px] font-black uppercase text-gray-500">WHITELISTED INVESTORS</span>
                    <span className="text-xl font-black text-black">
                      {whitelistInput ? whitelistInput.split(',').map(x => x.trim()).filter(Boolean).length : 0} Members
                    </span>
                  </div>
                  <span className="text-[10px] bg-[#C084FC]/20 text-[#C084FC] px-1.5 py-0.5 border border-black font-black uppercase">
                    Secure
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Tab Navigation */}
          <div className="flex border-b-[3px] border-black select-none">
            <button
              onClick={() => setActiveTab('insights')}
              className={`px-6 py-3 font-outfit font-black text-xs sm:text-sm uppercase tracking-wider border-t-[3px] border-x-[3px] border-black translate-y-[3px] transition-all cursor-pointer ${
                activeTab === 'insights'
                  ? 'bg-white border-b-[3px] border-b-white z-10'
                  : 'bg-gray-100 hover:bg-gray-50 border-b-transparent text-gray-500'
              }`}
            >
              Strategic Reports
            </button>
            <button
              onClick={() => setActiveTab('dataroom')}
              className={`px-6 py-3 font-outfit font-black text-xs sm:text-sm uppercase tracking-wider border-t-[3px] border-x-[3px] border-black translate-y-[3px] transition-all cursor-pointer ${
                activeTab === 'dataroom'
                  ? 'bg-white border-b-[3px] border-b-white z-10'
                  : 'bg-gray-100 hover:bg-gray-50 border-b-transparent text-gray-500'
              }`}
            >
              Investor Data Room
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'insights' ? (
            /* Tab 1: Strategic Reports List */
            <div className="space-y-4">
              {loadingReports ? (
                <div className="neo-card p-12 text-center bg-white space-y-4 select-none">
                  <div className="w-8 h-8 border-[3px] border-black border-t-transparent rounded-full animate-spin mx-auto text-black"></div>
                  <span className="font-outfit font-black uppercase text-xs">Retrieving briefs from database...</span>
                </div>
              ) : reportsError ? (
                <div className="neo-card p-6 bg-[#F472B6] border-[3px] border-black font-bold text-black flex items-start gap-3">
                  <AlertCircle size={20} className="shrink-0" />
                  <div>
                    <span className="uppercase text-sm block mb-1">Database Read Failure</span>
                    <p className="text-xs font-semibold">{reportsError}</p>
                  </div>
                </div>
              ) : reports.length === 0 ? (
                <div className="neo-card p-12 text-center bg-white space-y-4 select-none">
                  <Compass size={40} className="mx-auto text-gray-400" />
                  <span className="font-outfit font-black uppercase text-xs tracking-wider">No briefs compiled yet</span>
                  <p className="text-xs text-gray-550 max-w-xs mx-auto">
                    Head over to the OS Dashboard to define your wedge and trigger your first multi-agent strategy simulation.
                  </p>
                  <Link to="/dashboard" className="neo-btn-primary inline-flex mt-2">
                    Go to Dashboard
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reports.map((report) => {
                    const formattedDate = new Date(report.generatedAt).toLocaleDateString([], {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    });

                    return (
                      <Link
                        key={report.id}
                        to={`/reports/${report.id}`}
                        className="neo-card bg-white hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex flex-col justify-between h-64 border-[3px] border-black group relative cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center justify-between border-b-[2px] border-black pb-2 mb-3 select-none">
                            <span className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1">
                              <Calendar size={10} />
                              {formattedDate}
                            </span>
                            <span className="neo-badge text-[8px] px-1.5 py-0.5 border bg-[#A3E635] text-black">
                              {report.reportType || 'IDEA'}
                            </span>
                          </div>

                          <h3 className="font-outfit font-black text-base uppercase tracking-tight text-black group-hover:text-[#C084FC] transition-colors line-clamp-2 leading-tight">
                            {report.title}
                          </h3>
                          <p className="text-xs font-semibold font-inter text-gray-500 line-clamp-3 mt-2 leading-relaxed">
                            {report.executiveSnapshot || report.thesis || 'Strategic strategy brief generated by AI agent network.'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-200 pt-3 mt-3 select-none">
                          <span className="text-[9px] font-black uppercase text-gray-400">
                            {report.sourceCount || 0} Grounding Sources
                          </span>
                          <button
                            onClick={(e) => handleDeleteReport(report.id, e)}
                            className="p-1.5 bg-[#F472B6] border-2 border-black hover:bg-white text-black hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Tab 2: Investor Data Room (Brief Builder) */
            <div className="neo-card bg-white border-[3px] border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              {loadingBrief ? (
                <div className="text-center py-12">
                  <RefreshCw size={24} className="mx-auto animate-spin text-[#3B82F6] mb-2" />
                  <span className="text-xs font-black uppercase text-gray-500">Accessing Strategic Vault...</span>
                </div>
              ) : (
                <form onSubmit={handleSaveBrief} className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b-2 border-black">
                    <div>
                      <h3 className="font-outfit font-black text-lg uppercase">Configured Data Room</h3>
                      <p className="text-xs font-semibold text-gray-500">Enable secure access to your verified scores, pitch decks, and milestones.</p>
                    </div>
                    {briefId && (
                      <button
                        type="button"
                        onClick={copyLink}
                        className="neo-btn-primary px-4 py-2 text-xs font-black uppercase flex items-center gap-1.5"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copied ? 'Copied Link' : 'Copy Pitch Link'}</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-black uppercase mb-2">One-Line Elevator Pitch</label>
                      <input
                        type="text"
                        value={pitch}
                        onChange={(e) => setPitch(e.target.value)}
                        placeholder="A recursive startup economy operating system..."
                        required
                        className="neo-input"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase mb-2">The Problem Wedge</label>
                      <textarea
                        value={problem}
                        onChange={(e) => setProblem(e.target.value)}
                        placeholder="Startups manage strategy in unstructured notes, separate checklists, and disconnected spreadsheets..."
                        rows={4}
                        required
                        className="neo-input"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase mb-2">The Solution Wedge</label>
                      <textarea
                        value={solution}
                        onChange={(e) => setSolution(e.target.value)}
                        placeholder="Stratify unifies all milestones, decision memories, runway projections, and AI checkups into a single product graph..."
                        rows={4}
                        required
                        className="neo-input"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase mb-2">Pitch Deck Link (PDF/Doc)</label>
                      <input
                        type="url"
                        value={deckUrl}
                        onChange={(e) => setDeckUrl(e.target.value)}
                        placeholder="https://pitch.com/deck/my-startup"
                        className="neo-input"
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="block text-xs font-black uppercase mb-1">Access Privacy Controls</label>
                      
                      <div className="flex gap-4">
                        <label className={`flex-1 border-[3px] border-black p-3.5 flex items-center justify-between cursor-pointer transition-all ${isPublic ? 'bg-[#A3E635] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' : 'bg-white'}`}>
                          <span className="font-outfit font-black text-xs uppercase flex items-center gap-1.5">
                            <Globe size={14} /> Public Access
                          </span>
                          <input
                            type="radio"
                            name="privacy"
                            checked={isPublic === true}
                            onChange={() => setIsPublic(true)}
                            className="accent-black cursor-pointer"
                          />
                        </label>

                        <label className={`flex-1 border-[3px] border-black p-3.5 flex items-center justify-between cursor-pointer transition-all ${!isPublic ? 'bg-[#EF4444] text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black'}`}>
                          <span className="font-outfit font-black text-xs uppercase flex items-center gap-1.5">
                            <Lock size={14} /> Private Vault
                          </span>
                          <input
                            type="radio"
                            name="privacy"
                            checked={isPublic === false}
                            onChange={() => setIsPublic(false)}
                            className="accent-black cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>

                    {!isPublic && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-black uppercase mb-2">Investor Email Whitelist (comma separated)</label>
                        <input
                          type="text"
                          value={whitelistInput}
                          onChange={(e) => setWhitelistInput(e.target.value)}
                          placeholder="investor@accel.com, partner@sequoia.com"
                          className="neo-input"
                        />
                        <span className="text-[10px] text-gray-500 font-bold block mt-1">
                          Only VCs or angels logging in with these whitelisted domains/emails will be authorized to access this data room.
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t-[3px] border-black flex justify-between items-center select-none">
                    <label className="flex items-center gap-2 cursor-pointer font-black text-xs uppercase">
                      <input
                        type="checkbox"
                        checked={showRunway}
                        onChange={(e) => setShowRunway(e.target.checked)}
                        className="accent-black w-4 h-4 border border-black"
                      />
                      <span>Expose runway & burn projection to whitelisted investors</span>
                    </label>

                    <button
                      type="submit"
                      disabled={savingBrief}
                      className="neo-btn-primary px-8 py-3 text-xs font-black uppercase flex items-center gap-2"
                    >
                      {savingBrief ? <RefreshCw size={14} className="animate-spin" /> : <Shield size={14} />}
                      <span>{savingBrief ? 'Encrypting...' : 'Lock and Save Brief'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
