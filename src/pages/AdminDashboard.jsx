import React, { useState, useEffect } from 'react';
import { Shield, Users, FileText, Activity, Mail, Trash2, AlertCircle, RefreshCw, BarChart2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AdminDashboard() {
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
          colors: ['#F472B6', '#000000']
        });
      } catch (err) {
        alert(err.message);
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
          colors: ['#F472B6', '#000000']
        });
      } catch (err) {
        alert(err.message);
      } finally {
        setActionLoading(false);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border-[3px] border-black p-6 shadow-neo-hard">
        <div className="flex items-center gap-3">
          <div className="bg-[#FB923C] border-[3px] border-black p-3.5 text-black">
            <Shield size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">OS Admin Console</h1>
            <p className="font-outfit font-bold text-gray-700 mt-1">
              Monitor network health, oversee strategists, and manage strategic assets.
            </p>
          </div>
        </div>
        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="neo-btn-primary flex items-center gap-2 px-4 py-2 self-stretch sm:self-auto justify-center cursor-pointer text-xs font-black uppercase"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Reload</span>
        </button>
      </div>

      {loading && !stats ? (
        <div className="neo-card p-16 text-center bg-white space-y-4">
          <div className="w-12 h-12 border-[4px] border-black border-t-transparent rounded-full animate-spin mx-auto text-black"></div>
          <span className="font-outfit font-black uppercase text-xs">Accessing System Core...</span>
        </div>
      ) : error ? (
        <div className="neo-card p-6 bg-neo-pink border-[3px] border-black font-bold text-black flex items-start gap-3">
          <AlertCircle size={24} className="shrink-0" />
          <div>
            <span className="uppercase text-sm block mb-1">System Audit Failure</span>
            <p className="text-xs font-semibold">{error}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Users card */}
            <div className="bg-white border-[3px] border-black p-6 shadow-neo-hard flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Total Users</span>
                <span className="text-3xl font-black">{stats?.totalUsers || 0}</span>
              </div>
              <div className="bg-[#A3E635] border-2 border-black p-2.5">
                <Users size={22} />
              </div>
            </div>

            {/* Reports card */}
            <div className="bg-white border-[3px] border-black p-6 shadow-neo-hard flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Global Briefs</span>
                <span className="text-3xl font-black">{stats?.totalReports || 0}</span>
              </div>
              <div className="bg-[#C084FC] border-2 border-black p-2.5">
                <FileText size={22} />
              </div>
            </div>

            {/* Active Sessions card */}
            <div className="bg-white border-[3px] border-black p-6 shadow-neo-hard flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Active Sessions</span>
                <span className="text-3xl font-black">{stats?.activeSessions || 0}</span>
              </div>
              <div className="bg-[#FB923C] border-2 border-black p-2.5">
                <Activity size={22} />
              </div>
            </div>

            {/* Email queue card */}
            <div className="bg-white border-[3px] border-black p-6 shadow-neo-hard flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Email Outbox</span>
                <span className="text-3xl font-black">{stats?.emailOutboxCount || 0}</span>
              </div>
              <div className="bg-[#F472B6] border-2 border-black p-2.5">
                <Mail size={22} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b-[3px] border-black select-none">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-5 py-3 text-xs sm:text-sm font-black uppercase border-t-[3px] border-x-[3px] border-black translate-y-[3px] -mr-[3px] transition-all cursor-pointer ${
                activeTab === 'users' ? 'bg-[#A3E635] z-10' : 'bg-white hover:bg-gray-100'
              }`}
            >
              User Directory ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-5 py-3 text-xs sm:text-sm font-black uppercase border-t-[3px] border-x-[3px] border-black translate-y-[3px] -mr-[3px] transition-all cursor-pointer ${
                activeTab === 'reports' ? 'bg-[#C084FC] z-10' : 'bg-white hover:bg-gray-100'
              }`}
            >
              Global Briefs ({reports.length})
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-5 py-3 text-xs sm:text-sm font-black uppercase border-t-[3px] border-x-[3px] border-black translate-y-[3px] transition-all cursor-pointer ${
                activeTab === 'metrics' ? 'bg-[#FB923C] z-10' : 'bg-white hover:bg-gray-100'
              }`}
            >
              System Health & Metrics
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-white border-[3px] border-black p-6 shadow-neo-hard min-h-[300px]">
            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-4 border-black font-black uppercase text-xs select-none">
                      <th className="pb-3 pr-4">User Details</th>
                      <th className="pb-3 px-4">Account Type</th>
                      <th className="pb-3 px-4">Verification</th>
                      <th className="pb-3 px-4">Joined Date</th>
                      <th className="pb-3 pl-4 text-right">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b-[2px] border-gray-200 hover:bg-gray-50 text-xs font-semibold">
                        <td className="py-4 pr-4">
                          <div className="font-bold text-sm">{u.name || 'No Name'}</div>
                          <div className="text-gray-500 font-medium">{u.email}</div>
                          <div className="text-[10px] text-gray-400 font-mono select-all">{u.id}</div>
                        </td>
                        <td className="py-4 px-4 font-bold uppercase">
                          {u.isExternal ? (
                            <span className="bg-[#FB923C] border-2 border-black text-[9px] px-2 py-0.5 font-black">External Auth</span>
                          ) : (
                            <span className="bg-white border-2 border-black text-[9px] px-2 py-0.5">Local Creds</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {u.emailVerified ? (
                            <span className="text-neo-lime font-black bg-black px-2 py-0.5 border text-[9px] uppercase">Verified</span>
                          ) : (
                            <span className="text-neo-pink font-black bg-black px-2 py-0.5 border text-[9px] uppercase">Pending</span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-mono text-gray-500">
                          {new Date(u.createdAt).toLocaleDateString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="py-4 pl-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            disabled={actionLoading}
                            className="bg-neo-pink hover:bg-white text-black border-2 border-black p-2 shadow-[2px_2px_0px_0px_#000000] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 font-black uppercase text-[10px]"
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
                    <tr className="border-b-4 border-black font-black uppercase text-xs select-none">
                      <th className="pb-3 pr-4">Strategic Brief Details</th>
                      <th className="pb-3 px-4">Owner ID</th>
                      <th className="pb-3 px-4">Mode</th>
                      <th className="pb-3 px-4">Compiled At</th>
                      <th className="pb-3 pl-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id} className="border-b-[2px] border-gray-200 hover:bg-gray-50 text-xs font-semibold">
                        <td className="py-4 pr-4">
                          <div className="font-bold text-sm uppercase leading-tight line-clamp-1">{r.title}</div>
                          <div className="text-[10px] text-gray-500 font-mono mt-1 select-all">{r.id}</div>
                        </td>
                        <td className="py-4 px-4 font-mono text-gray-500">
                          {r.ownerId ? (
                            <span className="border border-dashed border-gray-400 px-1 py-0.5 text-[9px] select-all bg-gray-50">{r.ownerId}</span>
                          ) : (
                            <span className="text-gray-400">Anonymous (Guest)</span>
                          )}
                        </td>
                        <td className="py-4 px-4 uppercase font-bold">
                          <span className={`px-2 py-0.5 border-2 border-black text-[9px] font-black ${
                            r.mode === 'live' ? 'bg-[#A3E635]' : 'bg-gray-200'
                          }`}>
                            {r.mode} ({r.intelligenceMode || 'unknown'})
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono text-gray-500">
                          {new Date(r.generatedAt).toLocaleString()}
                        </td>
                        <td className="py-4 pl-4 text-right">
                          <button
                            onClick={() => handleDeleteReport(r.id)}
                            disabled={actionLoading}
                            className="bg-neo-pink hover:bg-white text-black border-2 border-black p-2 shadow-[2px_2px_0px_0px_#000000] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 font-black uppercase text-[10px]"
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
                <div className="flex items-center gap-2 border-b-2 border-black pb-2 select-none">
                  <BarChart2 size={18} />
                  <h3 className="font-outfit font-black text-sm uppercase tracking-wider text-black">Raw API Server telemetry</h3>
                </div>
                <pre className="bg-gray-900 text-green-400 p-5 font-mono text-xs overflow-auto border-2 border-black select-all max-h-[500px]">
                  {JSON.stringify(stats?.apiMetrics || {}, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
