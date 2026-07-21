import React, { useState, useEffect } from 'react';
import { Shield, Users, FileText, Activity, Mail, Trash2, AlertCircle, RefreshCw, BarChart2, UserPlus } from 'lucide-react';
import Toast from '../../components/Toast';
import confetti from 'canvas-confetti';

export default function AdminDashboard() {
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'reports' | 'waitlist' | 'metrics'
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, usersRes, reportsRes, waitlistRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
        fetch('/api/admin/reports'),
        fetch('/api/admin/waitlist'),
      ]);

      if (!statsRes.ok) throw new Error('Failed to load system stats.');
      const statsData = await statsRes.json();
      setStats(statsData.stats);

      if (!usersRes.ok) throw new Error('Failed to load user list.');
      const usersData = await usersRes.json();
      setUsers(usersData.users);

      if (!reportsRes.ok) throw new Error('Failed to load reports library.');
      const reportsData = await reportsRes.json();
      setReports(reportsData.reports || []);

      if (waitlistRes.ok) {
        const waitlistData = await waitlistRes.json();
        setWaitlist(waitlistData.entries || []);
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
      setError(err.message || 'An error occurred fetching admin console data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDeleteUser = async (userId, userEmail) => {
    if (confirm(`Are you absolutely sure you want to delete user ${userEmail}? This will terminate their active sessions.`)) {
      setActionLoading(true);
      try {
        const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || 'Failed to delete user.');
        }
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setStats((prev) => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
        confetti({ particleCount: 50, spread: 30, colors: ['#C8E64A', '#1A1A1A', '#FAF9F6'] });
      } catch (err) {
        setToast({ message: err.message, type: 'error' });
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (confirm('Are you sure you want to delete this strategic brief globally?')) {
      setActionLoading(true);
      try {
        const res = await fetch(`/api/admin/reports/${reportId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete report.');
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        setStats((prev) => ({ ...prev, totalReports: prev.totalReports - 1 }));
        confetti({ particleCount: 50, spread: 30, colors: ['#C8E64A', '#1A1A1A', '#FAF9F6'] });
      } catch (err) {
        setToast({ message: err.message, type: 'error' });
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleDeleteWaitlistEntry = async (entryId) => {
    if (confirm('Remove this waitlist entry?')) {
      setActionLoading(true);
      try {
        const res = await fetch(`/api/admin/waitlist/${entryId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to remove waitlist entry.');
        setWaitlist((prev) => prev.filter((e) => e.id !== entryId));
        setStats((prev) => ({ ...prev, waitlistCount: (prev.waitlistCount || 1) - 1 }));
      } catch (err) {
        setToast({ message: err.message, type: 'error' });
      } finally {
        setActionLoading(false);
      }
    }
  };

  const PLAN_LABELS = { founder: 'Founder OS', investor: 'Investor OS', institution: 'Institution OS', general: 'General' };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 select-none text-text-primary animate-fade-in">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-DEFAULT select-none">
        <div className="flex items-center gap-3">
          <div className="bg-surface-dark p-3 text-white rounded-lg">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-outfit font-black tracking-tight">OS Admin Console</h1>
            <p className="font-inter text-text-secondary mt-1 text-xs sm:text-sm">
              Monitor network health, oversee strategists, and manage strategic assets.
            </p>
          </div>
        </div>
        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="bg-accent hover:bg-accent-hover text-[#111] font-outfit font-bold text-xs uppercase py-2.5 px-4 rounded-lg border-0 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Reload</span>
        </button>
      </div>

      {loading && !stats ? (
        <div className="os-card p-16 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-10 h-10 border border-text-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <span className="font-outfit font-bold text-xs uppercase tracking-wider block">Accessing System Core...</span>
        </div>
      ) : error ? (
        <div className="border border-red-500/30 p-6 bg-red-500/10 text-red-500 flex items-start gap-3 rounded-xl">
          <AlertCircle size={24} className="shrink-0" />
          <div>
            <span className="uppercase text-sm font-bold block mb-1">System Audit Failure</span>
            <p className="text-xs font-semibold">{error}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="os-card flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Total Users</span>
                <span className="text-3xl font-outfit font-black mt-1 block">{stats?.totalUsers || 0}</span>
              </div>
              <div className="bg-hover border border-DEFAULT p-3 rounded-lg">
                <Users size={18} />
              </div>
            </div>

            <div className="os-card flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Global Briefs</span>
                <span className="text-3xl font-outfit font-black mt-1 block">{stats?.totalReports || 0}</span>
              </div>
              <div className="bg-hover border border-DEFAULT p-3 rounded-lg">
                <FileText size={18} />
              </div>
            </div>

            <div className="os-card flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Active Sessions</span>
                <span className="text-3xl font-outfit font-black mt-1 block">{stats?.activeSessions || 0}</span>
              </div>
              <div className="bg-hover border border-DEFAULT p-3 rounded-lg">
                <Activity size={18} />
              </div>
            </div>

            <div className="os-card flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Email Outbox</span>
                <span className="text-3xl font-outfit font-black mt-1 block">{stats?.emailOutboxCount || 0}</span>
              </div>
              <div className="bg-hover border border-DEFAULT p-3 rounded-lg">
                <Mail size={18} />
              </div>
            </div>

            <div className="os-card flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Waitlist Signups</span>
                <span className="text-3xl font-outfit font-black mt-1 block">{stats?.waitlistCount || 0}</span>
              </div>
              <div className="bg-accent-muted border border-accent/30 p-3 rounded-lg text-accent">
                <UserPlus size={18} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-canvas border border-DEFAULT rounded-xl p-1 flex gap-2 select-none">
            {[
              { id: 'users', label: `User Directory (${users.length})` },
              { id: 'reports', label: `Global Briefs (${reports.length})` },
              { id: 'waitlist', label: `Waitlist (${waitlist.length})` },
              { id: 'metrics', label: 'System Health' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 text-center text-xs font-outfit font-bold uppercase rounded-lg transition-all cursor-pointer border-0 shadow-sm ${
                  activeTab === tab.id ? 'bg-accent text-[#111] font-bold' : 'bg-card text-text-secondary hover:bg-hover'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="os-card min-h-[300px]">
            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-DEFAULT text-text-muted font-bold uppercase text-[10px] tracking-wider select-none">
                      <th className="pb-3 pr-4">User Details</th>
                      <th className="pb-3 px-4">Account Type</th>
                      <th className="pb-3 px-4">Verification</th>
                      <th className="pb-3 px-4">Joined Date</th>
                      <th className="pb-3 pl-4 text-right">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-light hover:bg-hover text-xs font-semibold text-text-secondary">
                        <td className="py-4 pr-4">
                          <div className="font-outfit font-bold text-sm text-text-primary leading-snug">{u.name || 'No Name'}</div>
                          <div className="text-text-muted font-medium font-inter text-[11px] mt-0.5">{u.email}</div>
                          <div className="text-[9px] text-text-muted font-mono select-all font-light tracking-tight mt-1">{u.id}</div>
                        </td>
                        <td className="py-4 px-4 font-bold uppercase">
                          <span className="bg-hover border border-DEFAULT text-[9px] px-2 py-0.5 rounded-md text-text-muted">
                            {u.isExternal ? 'External Auth' : 'Local Creds'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {u.emailVerified ? (
                            <span className="bg-green-500/10 border border-green-500/30 text-green-500 font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase">Verified</span>
                          ) : (
                            <span className="bg-red-500/10 border border-red-500/30 text-red-500 font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase">Pending</span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-mono text-text-muted text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-4 pl-4 text-right select-none">
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            disabled={actionLoading}
                            className="bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-100 rounded-lg p-2 cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 font-bold uppercase text-[10px] transition-colors"
                          >
                            <Trash2 size={12} />
                            <span>Remove</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-DEFAULT text-text-muted font-bold uppercase text-[10px] tracking-wider select-none">
                      <th className="pb-3 pr-4">Strategic Brief Details</th>
                      <th className="pb-3 px-4">Owner ID</th>
                      <th className="pb-3 px-4">Mode</th>
                      <th className="pb-3 px-4">Compiled At</th>
                      <th className="pb-3 pl-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id} className="border-b border-light hover:bg-hover text-xs font-semibold text-text-secondary">
                        <td className="py-4 pr-4">
                          <div className="font-outfit font-bold text-sm text-text-primary uppercase leading-tight line-clamp-1">{r.title}</div>
                          <div className="text-[9px] text-text-muted font-mono mt-1 select-all font-light tracking-tight">{r.id}</div>
                        </td>
                        <td className="py-4 px-4 font-mono text-text-muted text-[11px]">
                          {r.ownerId ? (
                            <span className="border border-dashed border-DEFAULT px-2 py-0.5 text-[9px] select-all bg-hover rounded-md">{r.ownerId}</span>
                          ) : (
                            <span className="text-text-muted">Anonymous (Guest)</span>
                          )}
                        </td>
                        <td className="py-4 px-4 uppercase font-bold select-none">
                          <span className="bg-accent-muted border border-accent/30 text-text-primary px-2 py-0.5 text-[9px] font-bold rounded-md">
                            {r.mode} ({r.intelligenceMode || 'unknown'})
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono text-text-muted text-[11px]">
                          {new Date(r.generatedAt).toLocaleString()}
                        </td>
                        <td className="py-4 pl-4 text-right select-none">
                          <button
                            onClick={() => handleDeleteReport(r.id)}
                            disabled={actionLoading}
                            className="bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-100 rounded-lg p-2 cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 font-bold uppercase text-[10px] transition-colors"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'waitlist' && (
              <div className="overflow-x-auto">
                {waitlist.length === 0 ? (
                  <div className="text-center py-16">
                    <UserPlus size={40} className="mx-auto text-text-muted mb-4" />
                    <p className="text-sm font-semibold text-text-secondary">No waitlist signups yet.</p>
                    <p className="text-xs text-text-muted mt-1">Entries will appear here as people sign up from the upgrade page.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-DEFAULT text-text-muted font-bold uppercase text-[10px] tracking-wider select-none">
                        <th className="pb-3 pr-4">Contact Details</th>
                        <th className="pb-3 px-4">Plan Interest</th>
                        <th className="pb-3 px-4">Message</th>
                        <th className="pb-3 px-4">Signed Up</th>
                        <th className="pb-3 pl-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {waitlist.map((entry) => (
                        <tr key={entry.id} className="border-b border-light hover:bg-hover text-xs font-semibold text-text-secondary">
                          <td className="py-4 pr-4">
                            <div className="font-outfit font-bold text-sm text-text-primary leading-snug">{entry.name}</div>
                            <div className="text-text-muted font-medium font-inter text-[11px] mt-0.5">{entry.email}</div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="bg-accent-muted border border-accent/30 text-text-primary px-2.5 py-0.5 text-[9px] font-black uppercase rounded-md tracking-wider">
                              {PLAN_LABELS[entry.plan] || entry.plan || 'General'}
                            </span>
                          </td>
                          <td className="py-4 px-4 max-w-[200px]">
                            <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">{entry.message || '—'}</p>
                          </td>
                          <td className="py-4 px-4 font-mono text-text-muted text-[11px]">
                            {new Date(entry.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="py-4 pl-4 text-right select-none">
                            <button
                              onClick={() => handleDeleteWaitlistEntry(entry.id)}
                              disabled={actionLoading}
                              className="bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-100 rounded-lg p-2 cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 font-bold uppercase text-[10px] transition-colors"
                            >
                              <Trash2 size={12} />
                              <span>Remove</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === 'metrics' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-light pb-2 select-none">
                  <BarChart2 size={18} className="text-text-muted" />
                  <h3 className="font-outfit font-bold text-xs uppercase tracking-wider">API Telemetry</h3>
                </div>
                <pre className="bg-surface-dark text-accent p-5 font-mono text-xs overflow-auto rounded-xl select-all max-h-[500px]">
                  {JSON.stringify(stats?.apiMetrics || {}, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
