import React, { useState, useEffect } from 'react';
import { BrainCircuit, Plus, Target, CheckCircle, XCircle, RefreshCw, AlertCircle, Zap } from 'lucide-react';
import AuthGate from '../../components/AuthGate';
import Toast from '../../components/Toast';

export default function FounderMemory({ founderProfile, user, openAuthModal }) {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [outcome, setOutcome] = useState('');
  const [status, setStatus] = useState('active');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchDecisions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/decisions');
      if (res.ok) {
        const data = await res.json();
        setDecisions(data.decisions || []);
      } else if (res.status === 401) {
        // Not logged in — AuthGate will handle it
        setDecisions([]);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data?.error?.message || 'Failed to load memory.', 'error');
      }
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchDecisions();
    else setLoading(false);
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, context, outcome, status })
      });
      if (res.ok) {
        setShowForm(false);
        setTitle('');
        setContext('');
        setOutcome('');
        setStatus('active');
        showToast('Decision logged to memory ✓');
        fetchDecisions();
      } else {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error?.message || `Failed to save (${res.status}). Please try again.`;
        showToast(msg, 'error');
      }
    } catch (e) {
      showToast('Network error — could not save. Check your connection.', 'error');
      console.error('Post error:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGate user={user} openAuthModal={openAuthModal} message="Sign in to access your Founder Memory — a strategic record of decisions, pivots, and experiments.">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8 animate-fade-in text-text-primary">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-light select-none">
          <div className="flex items-center gap-3">
            <div className="bg-[#1A1A1A] p-3 text-white rounded-lg">
              <BrainCircuit size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-outfit font-black tracking-tight">Founder Memory</h1>
              <p className="font-inter text-text-secondary mt-1 text-xs sm:text-sm">
                Log decisions and experiments. Feed posts auto-sync here too.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-accent text-[#111] px-4 py-2 font-outfit font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm hover:bg-accent-hover transition-all cursor-pointer border-0"
            >
              {showForm ? 'Cancel' : <><Plus size={14} /> Log Decision</>}
            </button>
            <button
              onClick={fetchDecisions}
              className="os-btn p-2 border-gray-250 rounded-lg hover:border-DEFAULT"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Feed Sync Banner */}
        <div className="flex items-center gap-2 bg-accent/10 border border-[#C8E64A]/30 rounded-xl px-4 py-3 text-xs font-semibold select-none">
          <Zap size={14} className="text-text-primary shrink-0" />
          <span className="text-text-primary">
            <strong>Auto-synced:</strong> Posts you share on the Feed are automatically logged here as memory entries.
          </span>
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-light p-6 rounded-xl space-y-4 animate-slide-up shadow-sm">
            <div>
              <label className="block text-xs font-bold uppercase text-text-secondary mb-1.5 tracking-wide">Decision / Hypothesis Title *</label>
              <input 
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="os-input"
                placeholder="e.g., Pivoting to B2B SaaS"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-text-secondary mb-1.5 tracking-wide">Context / Why</label>
              <textarea 
                value={context}
                onChange={e => setContext(e.target.value)}
                className="os-input resize-none min-h-[100px]"
                placeholder="What led to this decision? What are the assumptions?"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-text-secondary mb-1.5 tracking-wide">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="os-input font-semibold"
                >
                  <option value="active">Active / In Progress</option>
                  <option value="validated">Validated (Success)</option>
                  <option value="invalidated">Invalidated (Failed)</option>
                </select>
              </div>
              {status !== 'active' && (
                <div className="animate-slide-up">
                  <label className="block text-xs font-bold uppercase text-text-secondary mb-1.5 tracking-wide">Outcome / Learning</label>
                  <input 
                    value={outcome}
                    onChange={e => setOutcome(e.target.value)}
                    className="os-input"
                    placeholder="What did we learn?"
                  />
                </div>
              )}
            </div>
            <div className="pt-2 select-none">
              <button 
                type="submit" 
                disabled={saving}
                className="w-full bg-[#1A1A1A] text-white py-3 font-outfit font-bold text-xs uppercase tracking-wider hover:bg-[#333] transition-colors rounded-lg disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save to Memory'}
              </button>
            </div>
          </form>
        )}

        {/* List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border border-black border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : decisions.length === 0 ? (
          <div className="os-card bg-card p-16 text-center max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 bg-hover rounded-full flex items-center justify-center mx-auto">
              <BrainCircuit size={24} className="text-text-muted" />
            </div>
            <h3 className="font-outfit font-bold text-lg text-text-primary">Empty Memory</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
              Log your strategic decisions, product pivots, and experiments — or post a milestone on the <strong>Feed</strong> and it will auto-appear here.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-accent text-[#111] px-4 py-2 font-outfit font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-accent-hover transition-all"
            >
              <Plus size={14} /> Log Your First Decision
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {decisions.map(d => (
              <div key={d.id} className="os-card bg-card p-5 hover:border-DEFAULT transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-3 select-none flex-wrap">
                      <h3 className="font-outfit font-bold text-base text-text-primary leading-tight">{d.title}</h3>
                      {d.status === 'active' && (
                        <span className="bg-hover border border-light text-text-secondary rounded-md font-bold text-[9px] px-2 py-0.5 uppercase tracking-wide">
                          Active
                        </span>
                      )}
                      {d.status === 'validated' && (
                        <span className="bg-green-500/10 border border-green-500/30 text-green-500 rounded-md font-bold text-[9px] px-2 py-0.5 uppercase tracking-wide flex items-center gap-1">
                          <CheckCircle size={10} /> Validated
                        </span>
                      )}
                      {d.status === 'invalidated' && (
                        <span className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-md font-bold text-[9px] px-2 py-0.5 uppercase tracking-wide flex items-center gap-1">
                          <XCircle size={10} /> Invalidated
                        </span>
                      )}
                      {/* Show badge if synced from feed */}
                      {(d.title?.startsWith('🏆') || d.title?.startsWith('🚀') || d.title?.startsWith('📝') || d.title?.startsWith('💬')) && (
                        <span className="bg-accent/20 border border-[#C8E64A]/40 text-text-primary rounded-md font-bold text-[9px] px-2 py-0.5 uppercase tracking-wide flex items-center gap-1">
                          <Zap size={9} /> Feed Sync
                        </span>
                      )}
                    </div>
                    {d.context && (
                      <p className="text-xs text-text-secondary mb-4 whitespace-pre-wrap leading-relaxed font-light font-inter">{d.context}</p>
                    )}
                    {d.outcome && (
                      <div className="bg-canvas border border-light rounded-xl p-4 flex gap-3 select-none">
                        <Target size={16} className="shrink-0 mt-0.5 text-text-muted" />
                        <div>
                          <p className="text-[9px] font-bold uppercase text-text-muted mb-1 tracking-wide">Outcome & Learning</p>
                          <p className="text-xs font-semibold text-text-primary leading-relaxed font-inter">{d.outcome}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] font-bold font-mono text-text-muted shrink-0 select-none">
                    {new Date(d.created_at || d.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthGate>
  );
}
