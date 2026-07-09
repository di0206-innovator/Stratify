import React, { useState, useEffect } from 'react';
import { Shield, Users, FileText, Activity, Mail, Trash2, AlertCircle, RefreshCw, BarChart2 } from 'lucide-react';
import Toast from '../components/Toast';
import confetti from 'canvas-confetti';

export default function AdminDashboard() {
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'reports' | 'metrics'
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch stats
      const statsRes = await fetch('/api/admin/stats');
      if (!statsRes.ok) throw new Error('Failed to load system stats.');
      const statsData = await statsRes.json();
      setStats(statsData.stats);

      // 2. Fetch users
      const usersRes = await fetch('/api/admin/users');
      if (!usersRes.ok) throw new Error('Failed to load user list.');
      const usersData = await usersRes.json();
      setUsers(usersData.users);

      // 3. Fetch reports
      const reportsRes = await fetch('/api/admin/reports');
      if (!reportsRes.ok) throw new Error('Failed to load reports library.');
      const reportsData = await reportsRes.json();
      setReports(reportsData.reports || []);

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
        confetti({
          particleCount: 50,
          spread: 30,
          colors: ['#C8E64A', '#1A1A1A', '#FAF9F6']
        });
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
        confetti({
          particleCount: 50,
          spread: 30,
          colors: ['#C8E64A', '#1A1A1A', '#FAF9F6']
        });
      } catch (err) {
        setToast({ message: err.message, type: 'error' });
      } finally {
        setActionLoading(false);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 select-none text-[#111] animate-fade-in">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-gray-200/60 select-none">
        <div className="flex items-center gap-3">
          <div className="bg-[#1A1A1A] p-3 text-white rounded-lg">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-outfit font-black tracking-tight">OS Admin Console</h1>
            <p className="font-inter text-gray-500 mt-1 text-xs sm:text-sm">
              Monitor network health, oversee strategists, and manage strategic assets.
            </p>
          </div>
        </div>
        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="bg-[#C8E64A] hover:bg-[#B5D235] text-black font-outfit font-bold text-xs uppercase py-2.5 px-4 rounded-lg border-0 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Reload</span>
        </button>
      </div>

      {loading && !stats ? (
        <div className="os-card p-16 text-center bg-white space-y-4 max-w-xl mx-auto">
          <div className="w-10 h-10 border border-black border-t-transparent rounded-full animate-spin mx-auto text-black"></div>
          <span className="font-outfit font-bold text-xs uppercase tracking-wider block">Accessing System Core...</span>
        </div>
      ) : error ? (
        <div className="border border-red-200 p-6 bg-red-50 text-red-700 flex items-start gap-3 rounded-xl">
          <AlertCircle size={24} className="shrink-0" />
          <div>
            <span className="uppercase text-sm font-bold block mb-1">System Audit Failure</span>
            <p className="text-xs font-semibold text-red-650/80">{error}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Users card */}
            <div className="bg-white p-6 border border-gray-200 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Total Users</span>
                <span className="text-3xl font-outfit font-black mt-1 block">{stats?.totalUsers || 0}</span>
              </div>
              <div className="bg-gray-50 border border-gray-200 text-black p-3 rounded-lg">
                <Users size={18} />
              </div>
            </div>

            {/* Reports card */}
            <div className="bg-white p-6 border border-gray-200 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Global Briefs</span>
                <span className="text-3xl font-outfit font-black mt-1 block">{stats?.totalReports || 0}</span>
              </div>
              <div className="bg-gray-50 border border-gray-200 text-black p-3 rounded-lg">
                <FileText size={18} />
              </div>
            </div>

            {/* Active Sessions card */}
            <div className="bg-white p-6 border border-gray-200 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Active Sessions</span>
                <span className="text-3xl font-outfit font-black mt-1 block">{stats?.activeSessions || 0}</span>
              </div>
              <div className="bg-gray-50 border border-gray-200 text-black p-3 rounded-lg">
                <Activity size={18} />
              </div>
            </div>

            {/* Email queue card */}
            <div className="bg-white p-6 border border-gray-200 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Email Outbox</span>
                <span className="text-3xl font-outfit font-black mt-1 block">{stats?.emailOutboxCount || 0}</span>
              </div>
              <div className="bg-gray-50 border border-gray-200 text-black p-3 rounded-lg">
                <Mail size={18} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-[#FAF9F6] border border-gray-200 rounded-xl p-1 flex gap-2 select-none">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-2 text-center text-xs font-outfit font-bold uppercase rounded-lg transition-all cursor-pointer border-0 shadow-sm ${
                activeTab === 'users' ? 'bg-[#C8E64A] text-black font-bold' : 'bg-white text-gray-550 hover:bg-gray-50'
              }`}
            >
              User Directory ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-1 py-2 text-center text-xs font-outfit font-bold uppercase rounded-lg transition-all cursor-pointer border-0 shadow-sm ${
                activeTab === 'reports' ? 'bg-[#C8E64A] text-black font-bold' : 'bg-white text-gray-550 hover:bg-gray-50'
              }`}
            >
              Global Briefs ({reports.length})
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex-1 py-2 text-center text-xs font-outfit font-bold uppercase rounded-lg transition-all cursor-pointer border-0 shadow-sm ${
                activeTab === 'metrics' ? 'bg-[#C8E64A] text-black font-bold' : 'bg-white text-gray-550 hover:bg-gray-50'
              }`}
            >
              System Health
            </button>
          </div>

          {/* Tab Content */}
          <div className="os-card bg-white p-6 min-h-[300px]">
            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px] tracking-wider select-none">
                      <th className="pb-3 pr-4">User Details</th>
                      <th className="pb-3 px-4">Account Type</th>
                      <th className="pb-3 px-4">Verification</th>
                      <th className="pb-3 px-4">Joined Date</th>
                      <th className="pb-3 pl-4 text-right">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-gray-150 hover:bg-gray-50/50 text-xs font-semibold text-gray-700">
                        <td className="py-4 pr-4">
                          <div className="font-outfit font-bold text-sm text-black leading-snug">{u.name || 'No Name'}</div>
                          <div className="text-gray-400 font-medium font-inter text-[11px] mt-0.5">{u.email}</div>
                          <div className="text-[9px] text-gray-400 font-mono select-all font-light tracking-tight mt-1">{u.id}</div>
                        </td>
                        <td className="py-4 px-4 font-bold uppercase">
                          {u.isExternal ? (
                            <span className="bg-gray-50 border border-gray-200 text-[9px] px-2 py-0.5 rounded-md text-gray-500">External Auth</span>
                          ) : (
                            <span className="bg-gray-50 border border-gray-200 text-[9px] px-2 py-0.5 rounded-md text-gray-500">Local Creds</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {u.emailVerified ? (
                            <span className="bg-green-50 border border-green-200 text-green-700 font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase">Verified</span>
                          ) : (
                            <span className="bg-red-50 border border-red-200 text-red-650 font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase">Pending</span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-mono text-gray-450 text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="py-4 pl-4 text-right select-none">
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            disabled={actionLoading}
                            className="bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-lg p-2 cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 font-bold uppercase text-[10px] transition-colors"
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
                    <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px] tracking-wider select-none">
                      <th className="pb-3 pr-4">Strategic Brief Details</th>
                      <th className="pb-3 px-4">Owner ID</th>
                      <th className="pb-3 px-4">Mode</th>
                      <th className="pb-3 px-4">Compiled At</th>
                      <th className="pb-3 pl-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id} className="border-b border-gray-150 hover:bg-gray-50/50 text-xs font-semibold text-gray-700">
                        <td className="py-4 pr-4">
                          <div className="font-outfit font-bold text-sm text-black uppercase leading-tight line-clamp-1">{r.title}</div>
                          <div className="text-[9px] text-gray-400 font-mono mt-1 select-all font-light tracking-tight">{r.id}</div>
                        </td>
                        <td className="py-4 px-4 font-mono text-gray-450 text-[11px]">
                          {r.ownerId ? (
                            <span className="border border-dashed border-gray-200 px-2 py-0.5 text-[9px] select-all bg-gray-50 rounded-md">{r.ownerId}</span>
                          ) : (
                            <span className="text-gray-400">Anonymous (Guest)</span>
                          )}
                        </td>
                        <td className="py-4 px-4 uppercase font-bold select-none">
                          <span className="bg-[#C8E64A]/25 border border-[#C8E64A]/30 text-black px-2 py-0.5 text-[9px] font-bold rounded-md">
                            {r.mode} ({r.intelligenceMode || 'unknown'})
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono text-gray-450 text-[11px]">
                          {new Date(r.generatedAt).toLocaleString()}
                        </td>
                        <td className="py-4 pl-4 text-right select-none">
                          <button
                            onClick={() => handleDeleteReport(r.id)}
                            disabled={actionLoading}
                            className="bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-lg p-2 cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 font-bold uppercase text-[10px] transition-colors"
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

            {activeTab === 'metrics' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2 select-none">
                  <BarChart2 size={18} className="text-gray-400" />
                  <h3 className="font-outfit font-bold text-xs uppercase tracking-wider text-black">API Telemetry</h3>
                </div>
                <pre className="bg-[#1A1A1A] text-[#C8E64A] p-5 font-mono text-xs overflow-auto rounded-xl select-all max-h-[500px]">
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
