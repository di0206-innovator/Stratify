import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Trash2, Calendar, Lock, LogIn, AlertCircle, Compass, Shield, Globe, Copy, Check, RefreshCw } from 'lucide-react';
import Toast from '../../components/Toast';
import confetti from 'canvas-confetti';
import { supabase } from '../../lib/supabase';

export default function Intelligence({ user, setUser, openAuthModal, founderProfile }) {
  const [toast, setToast] = useState(null);
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
        colors: ['#1A1A1A', '#FAF9F6']
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
          colors: ['#EF4444', '#FAF9F6']
        });
      } else {
        setToast({ message: 'Failed to delete report.', type: 'error' });
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
        setToast({ message: 'Brief saved & locked to Investor Data Room ✓ — also logged to Timeline', type: 'success' });
        confetti({
          particleCount: 80,
          spread: 50,
          colors: ['#C8E64A', '#1A1A1A', '#FAF9F6']
        });
      } else {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error?.message || `Save failed (${res.status}). Please try again.`;
        setToast({ message: msg, type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error — could not save brief. Check your connection.', type: 'error' });
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
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8 text-text-primary animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-light select-none">
        <div className="flex items-center gap-3">
          <div className="bg-[#1A1A1A] p-3 text-white rounded-lg">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-outfit font-black tracking-tight">Intelligence & Pitch Briefs</h1>
            <p className="font-inter text-text-secondary mt-1 text-xs sm:text-sm">
              Manage your AI strategic reports and configure your whitelisted investor data room.
            </p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3 self-start md:self-auto select-none">
            <span className="text-xs font-semibold border border-light rounded-lg px-3 py-1.5 bg-card shadow-sm">
              {user.username || user.email}
            </span>
            <button
              onClick={handleLogout}
              className="os-btn py-1.5"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {!user ? (
        /* Interactive Locked Screen */
        <div className="max-w-md mx-auto os-card bg-card mt-12 p-10 text-center space-y-6 animate-slide-up">
          <div className="inline-flex items-center justify-center bg-hover p-4 text-text-primary rounded-full">
            <Lock size={30} strokeWidth={2} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-outfit font-bold tracking-tight text-text-primary">Library Access Locked</h2>
            <p className="text-xs sm:text-sm text-text-secondary max-w-sm mx-auto leading-relaxed">
              Please sign in or join the network to view and manage your compiled strategic briefs, roadmaps, and execution plans.
            </p>
          </div>
          <button
            onClick={openAuthModal}
            className="w-full os-btn flex items-center justify-center gap-2"
          >
            <span>Sign In / Register</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Shared Top Summary */}
          {(() => {
            const sortedReports = [...reports].sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
            const latestReport = sortedReports[0];
            const validationScoreVal = latestReport?.rawStrategy?.validationScore ? `${latestReport.rawStrategy.validationScore}%` : myStartup?.validation_score ? `${myStartup.validation_score}%` : null;

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-canvas border border-light p-4 rounded-xl select-none">
                <div className="border border-light p-4 bg-card flex justify-between items-center rounded-xl">
                  <div>
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-text-muted">LATEST INTEL SCORE</span>
                    <span className="text-xl font-outfit font-black text-[#EF4444] mt-1 block">{validationScoreVal || 'NOT AUDITED'}</span>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${validationScoreVal ? 'bg-red-500/10 text-red-500' : 'bg-hover text-text-muted'}`}>
                    {validationScoreVal ? 'Compiled' : 'Pending'}
                  </span>
                </div>

                <div className="border border-light p-4 bg-card flex justify-between items-center rounded-xl">
                  <div>
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-text-muted">BRIEF DISCLOSURE STATE</span>
                    <span className="text-xs font-bold text-text-primary uppercase mt-2 block">
                      {briefId ? (isPublic ? 'PUBLIC ACCESS' : 'WHITELIST ONLY') : 'NOT INITIALIZED'}
                    </span>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${briefId ? 'bg-green-500/10 text-green-500' : 'bg-hover text-text-muted'}`}>
                    {briefId ? 'Ready' : 'Draft'}
                  </span>
                </div>

                <div className="border border-light p-4 bg-card flex justify-between items-center rounded-xl">
                  <div>
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-text-muted">WHITELISTED INVESTORS</span>
                    <span className="text-xl font-outfit font-black text-text-primary mt-1 block">
                      {whitelistInput ? whitelistInput.split(',').map(x => x.trim()).filter(Boolean).length : 0} Members
                    </span>
                  </div>
                  <span className="text-[9px] bg-accent/25 text-text-primary rounded-full px-2 py-0.5 font-bold uppercase">
                    Secure
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Tab Navigation */}
          <div className="flex border-b border-light select-none">
            <button
              onClick={() => setActiveTab('insights')}
              className={`px-5 py-3 font-outfit font-bold text-xs sm:text-sm uppercase tracking-wider cursor-pointer border-b-2 transition-all ${
                activeTab === 'insights'
                  ? 'border-black text-text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              Strategic Reports
            </button>
            <button
              onClick={() => setActiveTab('dataroom')}
              className={`px-5 py-3 font-outfit font-bold text-xs sm:text-sm uppercase tracking-wider cursor-pointer border-b-2 transition-all ${
                activeTab === 'dataroom'
                  ? 'border-black text-text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
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
                <div className="os-card p-16 text-center bg-card space-y-4 select-none">
                  <div className="w-8 h-8 border border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <span className="font-outfit font-bold uppercase text-xs">Retrieving briefs from database...</span>
                </div>
              ) : reportsError ? (
                <div className="os-card p-5 bg-red-500/10 border border-red-500/30 text-[#EF4444] flex items-start gap-3 rounded-xl">
                  <AlertCircle size={20} className="shrink-0" />
                  <div>
                    <span className="uppercase text-xs font-bold block mb-1">Database Read Failure</span>
                    <p className="text-xs">{reportsError}</p>
                  </div>
                </div>
              ) : reports.length === 0 ? (
                <div className="os-card p-16 text-center bg-card space-y-4 select-none">
                  <Compass size={36} className="mx-auto text-gray-300" />
                  <span className="font-outfit font-bold uppercase text-xs tracking-wider">No briefs compiled yet</span>
                  <p className="text-xs text-text-secondary max-w-xs mx-auto leading-relaxed">
                    Head over to the OS Dashboard to define your wedge and trigger your first multi-agent strategy simulation.
                  </p>
                  <Link to="/dashboard" className="os-btn-primary inline-flex mt-2">
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
                        to={`/intelligence/${report.id}`}
                        className="os-card bg-card hover:border-DEFAULT transition-all flex flex-col justify-between h-64 group relative cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center justify-between border-b border-light pb-2.5 mb-3 select-none">
                            <span className="text-[10px] font-semibold uppercase text-text-muted flex items-center gap-1.5">
                              <Calendar size={11} />
                              {formattedDate}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border border-[#C8E64A]/40 bg-accent/10 text-text-primary">
                              {report.reportType || 'IDEA'}
                            </span>
                          </div>

                          <h3 className="font-outfit font-bold text-base text-text-primary group-hover:underline line-clamp-2 leading-tight">
                            {report.title}
                          </h3>
                          <p className="text-xs text-text-secondary line-clamp-3 mt-2.5 leading-relaxed font-inter font-light">
                            {report.executiveSnapshot || report.thesis || 'Strategic strategy brief generated by AI agent network.'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-light pt-3 mt-3 select-none">
                          <span className="text-[10px] font-semibold uppercase text-text-muted">
                            {report.sourceCount || 0} Grounding Sources
                          </span>
                          <button
                            onClick={(e) => handleDeleteReport(report.id, e)}
                            className="p-2 bg-red-500/10 text-[#EF4444] hover:bg-red-500/100 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
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
            <div className="os-card bg-card p-8">
              {loadingBrief ? (
                <div className="text-center py-12">
                  <RefreshCw size={24} className="mx-auto animate-spin text-text-primary mb-2" />
                  <span className="text-xs font-semibold uppercase text-text-muted">Accessing Strategic Vault...</span>
                </div>
              ) : (
                <form onSubmit={handleSaveBrief} className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-light">
                    <div>
                      <h3 className="font-outfit font-bold text-lg text-text-primary uppercase">Configured Data Room</h3>
                      <p className="text-xs text-text-secondary mt-0.5">Enable secure access to your verified scores, pitch decks, and milestones.</p>
                    </div>
                    {briefId && (
                      <button
                        type="button"
                        onClick={copyLink}
                        className="os-btn-primary px-4 py-2 text-xs font-semibold uppercase flex items-center gap-1.5"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copied ? 'Copied Link' : 'Copy Pitch Link'}</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold uppercase text-text-secondary mb-2 tracking-wide">One-Line Elevator Pitch</label>
                      <input
                        type="text"
                        value={pitch}
                        onChange={(e) => setPitch(e.target.value)}
                        placeholder="A recursive startup economy operating system..."
                        required
                        className="os-input"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-text-secondary mb-2 tracking-wide">The Problem Wedge</label>
                      <textarea
                        value={problem}
                        onChange={(e) => setProblem(e.target.value)}
                        placeholder="Startups manage strategy in unstructured notes, separate checklists, and disconnected spreadsheets..."
                        rows={4}
                        required
                        className="os-input"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-text-secondary mb-2 tracking-wide">The Solution Wedge</label>
                      <textarea
                        value={solution}
                        onChange={(e) => setSolution(e.target.value)}
                        placeholder="Stratify unifies all milestones, decision memories, runway projections, and AI checkups into a single product graph..."
                        rows={4}
                        required
                        className="os-input"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-text-secondary mb-2 tracking-wide">Pitch Deck Link (PDF/Doc)</label>
                      <input
                        type="url"
                        value={deckUrl}
                        onChange={(e) => setDeckUrl(e.target.value)}
                        placeholder="https://pitch.com/deck/my-startup"
                        className="os-input"
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="block text-xs font-bold uppercase text-text-secondary mb-1 tracking-wide">Access Privacy Controls</label>
                      
                      <div className="flex gap-4">
                        <label className={`flex-1 p-3.5 flex items-center justify-between cursor-pointer border rounded-xl transition-all ${isPublic ? 'bg-accent/10 border-black' : 'bg-card border-light'}`}>
                          <span className="font-outfit font-bold text-xs uppercase flex items-center gap-1.5">
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

                        <label className={`flex-1 p-3.5 flex items-center justify-between cursor-pointer border rounded-xl transition-all ${!isPublic ? 'bg-black border-black text-white' : 'bg-card border-light text-text-primary'}`}>
                          <span className="font-outfit font-bold text-xs uppercase flex items-center gap-1.5">
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
                      <div className="md:col-span-2 animate-slide-up">
                        <label className="block text-xs font-bold uppercase text-text-secondary mb-2 tracking-wide">Investor Email Whitelist (comma separated)</label>
                        <input
                          type="text"
                          value={whitelistInput}
                          onChange={(e) => setWhitelistInput(e.target.value)}
                          placeholder="investor@accel.com, partner@sequoia.com"
                          className="os-input"
                        />
                        <span className="text-[10px] text-text-secondary font-semibold block mt-2">
                          Only VCs or angels logging in with these whitelisted domains/emails will be authorized to access this data room.
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-light flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs uppercase text-text-secondary">
                      <input
                        type="checkbox"
                        checked={showRunway}
                        onChange={(e) => setShowRunway(e.target.checked)}
                        className="accent-black w-4 h-4 border border-light"
                      />
                      <span>Expose runway & burn projection to whitelisted investors</span>
                    </label>

                    <button
                      type="submit"
                      disabled={savingBrief}
                      className="os-btn-primary px-8 py-3 text-xs font-semibold uppercase flex items-center gap-2"
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
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
