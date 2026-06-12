import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Trash2, Calendar, Lock, LogIn, UserPlus, AlertCircle, Compass } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Reports({ user, setUser }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Auth Form State (for inline login/registration if user is not authenticated)
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        fetchReports();
      } else {
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reports');
      if (!res.ok) {
        throw new Error('Failed to retrieve reports from database.');
      }
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReports();
    } else {
      checkAuth();
    }
  }, [user]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    const url = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = authMode === 'login' 
      ? { email, password } 
      : { email, password, username };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Authentication failed');
      }

      const data = await res.json();
      
      if (authMode === 'register') {
        // If registered, let them know or auto login. 
        // For NeuralBI, register might require verification, but let's check
        if (data.emailVerificationRequired) {
          // Verify automatically in dev mode, or retrieve verification token from /api/dev/emails
          // Let's get verification code if dev environment
          const devRes = await fetch('/api/dev/emails');
          if (devRes.ok) {
            const devData = await devRes.json();
            const verificationEmail = devData.emails?.find(m => m.to === email && m.subject.includes('verify'));
            if (verificationEmail) {
              const token = verificationEmail.token;
              // Call verify-email
              const verifyRes = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
              });
              if (verifyRes.ok) {
                // Now perform login automatically
                const loginRes = await fetch('/api/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, password })
                });
                if (loginRes.ok) {
                  const loginData = await loginRes.json();
                  setUser(loginData.user);
                  confetti({ particleCount: 80, colors: ['#A3E635', '#000'] });
                  return;
                }
              }
            }
          }
          setAuthError('Registration successful. Please verify email (Developer check outbox).');
          return;
        }
      }

      setUser(data.user);
      confetti({
        particleCount: 100,
        spread: 60,
        colors: ['#A3E635', '#000000']
      });
    } catch (err) {
      setAuthError(err.message || 'Authentication error occurred.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setReports([]);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleDeleteReport = async (reportId, e) => {
    e.preventDefault(); // Prevent navigating
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-[3px] border-black p-6 shadow-neo-hard select-none">
        <div className="flex items-center gap-3">
          <div className="bg-[#C084FC] border-[3px] border-black p-3.5 text-black">
            <FileText size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Reports Library</h1>
            <p className="font-outfit font-bold text-gray-700 mt-1">
              Browse previous strategic briefs and monitor sprint roadmaps.
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
              className="neo-btn-secondary px-4 py-1.5 text-xs font-black"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Main Body */}
      {!user ? (
        /* Inline Authentication Form if not authenticated */
        <div className="max-w-md mx-auto neo-card bg-white mt-12 p-6 space-y-6">
          <div className="text-center select-none">
            <div className="inline-flex items-center gap-1.5 bg-[#C084FC] border-2 border-black px-3 py-1 font-outfit font-black text-xs uppercase tracking-wider mb-2">
              <Lock size={12} /> SECURE GATEWAY
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight">
              {authMode === 'login' ? 'STRATEGIST LOGIN' : 'CREATE NETWORK ACCOUNT'}
            </h2>
            <p className="text-xs font-semibold text-gray-600 mt-1">
              Authenticated session is required to save and review historical reports.
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-black uppercase mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. founder1"
                  required
                  className="neo-input text-xs py-2"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-black uppercase mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. founder@neuralbi.io"
                required
                className="neo-input text-xs py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase mb-1">Security Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="neo-input text-xs py-2"
              />
            </div>

            {authError && (
              <div className="bg-[#F472B6] border-2 border-black p-3 text-xs font-bold text-black flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-[#A3E635] border-[3px] border-black text-black font-black py-2.5 shadow-neo-button active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer uppercase text-xs tracking-wider"
            >
              {authMode === 'login' ? <LogIn size={14} /> : <UserPlus size={14} />}
              <span>{authLoading ? 'AUTHENTICATING...' : authMode === 'login' ? 'SIGN IN' : 'REGISTER'}</span>
            </button>
          </form>

          <div className="border-t-2 border-black pt-4 text-center select-none">
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthError(null);
              }}
              className="text-xs font-black uppercase text-[#C084FC] border-b border-[#C084FC] hover:text-black hover:border-black transition-colors"
            >
              {authMode === 'login' ? 'Need to register a network account?' : 'Already have a network account? Sign In'}
            </button>
          </div>
        </div>
      ) : (
        /* Reports List */
        <div className="space-y-4">
          {loading ? (
            <div className="neo-card p-12 text-center bg-white space-y-4 select-none">
              <div className="w-8 h-8 border-[3px] border-black border-t-transparent rounded-full animate-spin mx-auto text-black"></div>
              <span className="font-outfit font-black uppercase text-xs">Retrieving briefs from database...</span>
            </div>
          ) : error ? (
            <div className="neo-card p-6 bg-[#F472B6] border-[3px] border-black font-bold text-black flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0" />
              <div>
                <span className="uppercase text-sm block mb-1">Database Read Failure</span>
                <p className="text-xs font-semibold">{error}</p>
              </div>
            </div>
          ) : reports.length === 0 ? (
            <div className="neo-card p-12 text-center bg-white space-y-4 select-none">
              <Compass size={40} className="mx-auto text-gray-400" />
              <span className="font-outfit font-black uppercase text-xs tracking-wider">No briefs compiled yet</span>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Head over to the OS Dashboard to define your wedge and trigger your first multi-agent strategy simulation.
              </p>
              <Link to="/" className="neo-btn-primary inline-flex mt-2">
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
                    className="neo-card bg-white hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[7px_7px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-button transition-all flex flex-col justify-between h-64 border-[3px] border-black group relative cursor-pointer"
                  >
                    <div>
                      {/* Top bar info */}
                      <div className="flex items-center justify-between border-b-[2px] border-black pb-2 mb-3 select-none">
                        <span className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1">
                          <Calendar size={10} />
                          {formattedDate}
                        </span>
                        <span className="neo-badge text-[8px] px-1.5 py-0.5 border bg-[#A3E635]">
                          {report.founderContext?.profile?.startupStage || 'IDEA'}
                        </span>
                      </div>

                      {/* Title & snippet */}
                      <h3 className="font-outfit font-black text-base uppercase tracking-tight text-black group-hover:text-[#C084FC] transition-colors line-clamp-2 leading-tight">
                        {report.title}
                      </h3>
                      <p className="text-xs font-semibold font-inter text-gray-600 line-clamp-3 mt-2 leading-relaxed">
                        {report.sections?.executiveSnapshot || report.sections?.thesis}
                      </p>
                    </div>

                    {/* Bottom stats and delete */}
                    <div className="flex items-center justify-between border-t border-gray-200 pt-3 mt-3 select-none">
                      <span className="text-[9px] font-black uppercase text-gray-500">
                        {report.sources?.length || 0} Grounding Sources
                      </span>
                      <button
                        onClick={(e) => handleDeleteReport(report.id, e)}
                        className="p-1.5 bg-[#F472B6] border-2 border-black hover:bg-white text-black hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0"
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
      )}
    </div>
  );
}
