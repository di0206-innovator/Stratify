import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Signals from './pages/Signals';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import RunwayPlanner from './pages/RunwayPlanner';
import AdminDashboard from './pages/AdminDashboard';
import { supabase } from './lib/supabase';

// Intercept window.fetch to automatically append Clerk or Supabase session token if authenticated
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  let token = null;
  
  if (window.Clerk?.session) {
    try {
      token = await window.Clerk.session.getToken();
    } catch (e) {
      console.warn('Failed to retrieve Clerk token for request:', e);
    }
  } else if (supabase?.auth) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token;
    } catch (e) {
      console.warn('Failed to retrieve Supabase session token for request:', e);
    }
  }

  if (token) {
    if (!options.headers) {
      options.headers = {};
    }
    if (options.headers instanceof Headers) {
      options.headers.set('Authorization', `Bearer ${token}`);
    } else if (Array.isArray(options.headers)) {
      const hasAuth = options.headers.some(([key]) => key.toLowerCase() === 'authorization');
      if (!hasAuth) {
        options.headers.push(['Authorization', `Bearer ${token}`]);
      }
    } else {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    }
  }
  return originalFetch(url, options);
};

export default function App() {
  const [founderProfile, setFounderProfile] = useState(null);
  const [currentReport, setCurrentReport] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('neuralbi_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('neuralbi_theme', theme);
  }, [theme]);

  const openAuthModal = () => setIsAuthModalOpen(true);

  const checkSession = async (extUser) => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.warn('Backend server is not running or unreachable.');
      if (extUser) {
        setUser({
          id: extUser.id,
          email: extUser.email,
          username: extUser.username || extUser.email.split('@')[0],
          emailVerified: extUser.emailVerified
        });
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cachedProfile = localStorage.getItem('neuralbi_founder_profile');
    if (cachedProfile) {
      try {
        setFounderProfile(JSON.parse(cachedProfile));
      } catch (e) {
        console.error('Failed to parse cached founder profile', e);
      }
    }

    let unsubscribe = null;

    if (supabase) {
      // Listen to Supabase Auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          const extUser = {
            id: session.user.id,
            email: session.user.email,
            username: session.user.user_metadata?.username || session.user.email.split('@')[0],
            emailVerified: !!session.user.email_confirmed_at
          };
          checkSession(extUser);
        } else {
          checkSession(null);
        }
      });
      unsubscribe = subscription.unsubscribe;
    } else {
      checkSession(null);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Claim anonymous reports on login
  useEffect(() => {
    const claimAnonymousReport = async () => {
      if (user && currentReport && !currentReport.ownerId) {
        try {
          const res = await fetch(`/api/reports/${currentReport.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
          });
          if (res.ok) {
            const data = await res.json();
            setCurrentReport(data.report);
            console.log('Successfully claimed current anonymous brief for user:', user.email);
          }
        } catch (e) {
          console.warn('Failed to auto-claim current report for logged-in user:', e);
        }
      }
    };
    claimAnonymousReport();
  }, [user, currentReport]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neo-canvas flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-[4px] border-neo-black border-t-transparent rounded-full animate-spin"></div>
        <h2 className="font-outfit font-black uppercase text-xs tracking-wider mt-4">BOOTING FOUNDER STRATEGY OS...</h2>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-neo-canvas flex flex-col justify-between">
        <div>
          {/* Top Navigation */}
          <Navbar founderProfile={founderProfile} user={user} setUser={setUser} openAuthModal={openAuthModal} theme={theme} setTheme={setTheme} />

          {/* Main Pages */}
          <main className="pb-16">
            <Routes>
              {/* Dashboard Route: If not onboarded, redirect to /onboarding */}
              <Route 
                path="/" 
                element={
                  founderProfile ? (
                    <Dashboard 
                      founderProfile={founderProfile} 
                      currentReport={currentReport}
                      setCurrentReport={setCurrentReport}
                      user={user}
                      openAuthModal={openAuthModal}
                    />
                  ) : (
                    <Navigate to="/onboarding" replace />
                  )
                } 
              />
              
              {/* Onboarding */}
              <Route 
                path="/onboarding" 
                element={
                  <Onboarding 
                    founderProfile={founderProfile} 
                    setFounderProfile={setFounderProfile} 
                  />
                } 
              />

              {/* Signals */}
              <Route 
                path="/signals" 
                element={<Signals founderProfile={founderProfile} />} 
              />

              {/* Reports List */}
              <Route 
                path="/reports" 
                element={<Reports user={user} setUser={setUser} openAuthModal={openAuthModal} />} 
              />

              {/* Report Detail */}
              <Route 
                path="/reports/:id" 
                element={<ReportDetail />} 
              />

              {/* Runway Planner */}
              <Route 
                path="/runway" 
                element={<RunwayPlanner />} 
              />

              {/* Admin Console */}
              <Route 
                path="/admin" 
                element={
                  user && (
                    user.role === 'admin' || 
                    (user.email && (
                      user.email.toLowerCase() === 'divyanshu.b.sinha@gmail.com' || 
                      user.email.toLowerCase() === 'divyanshusunstone@gmail.com' ||
                      user.email.toLowerCase().startsWith('admin@')
                    ))
                  ) ? (
                    <AdminDashboard />
                  ) : (
                    <Navigate to="/" replace />
                  )
                } 
              />

              {/* Wildcard Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        {/* Footer */}
        <footer className="w-full bg-neo-canvas border-t-[3px] border-black py-4 select-none">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <span className="font-outfit font-black text-[10px] tracking-wider uppercase text-gray-500">
              © {new Date().getFullYear()} NEURALBI LABS INC. • ALL SYSTEM INTERFACES GROUNDED WITH AI LOGIC AND LIVE INTEL.
            </span>
          </div>
        </footer>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onAuthSuccess={() => checkSession(null)} 
      />
    </BrowserRouter>
  );
}
