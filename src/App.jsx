import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import Signals from './pages/Signals';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import RunwayPlanner from './pages/RunwayPlanner';
import AdminDashboard from './pages/AdminDashboard';
import Feed from './pages/Feed';
import StartupProfile from './pages/StartupProfile';
import PitchBrief from './pages/PitchBrief';
import EquityPlanner from './pages/EquityPlanner';
import BountyBoard from './pages/BountyBoard';
import Timeline from './pages/Timeline';
import Opportunities from './pages/Opportunities';
import Explore from './pages/Explore';
import FounderMemory from './pages/FounderMemory';
import Settings from './pages/Settings';
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
    return localStorage.getItem('stratify_theme') || 'light';
  });

  const email = user && user.email ? user.email.toLowerCase() : '';
  const isAdmin = user && (
    user.role === 'admin' || 
    email === 'divyanshu.b.sinha@gmail.com' || 
    email === 'divyanshusunstone@gmail.com' ||
    email.startsWith('admin@')
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('stratify_theme', theme);
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
    const cachedProfile = localStorage.getItem('stratify_founder_profile');
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
      <AppContent
        founderProfile={founderProfile}
        setFounderProfile={setFounderProfile}
        currentReport={currentReport}
        setCurrentReport={setCurrentReport}
        user={user}
        setUser={setUser}
        isAuthModalOpen={isAuthModalOpen}
        setIsAuthModalOpen={setIsAuthModalOpen}
        theme={theme}
        setTheme={setTheme}
        openAuthModal={openAuthModal}
        isAdmin={isAdmin}
      />
    </BrowserRouter>
  );
}

function AppContent({
  founderProfile, setFounderProfile, currentReport, setCurrentReport,
  user, setUser, isAuthModalOpen, setIsAuthModalOpen,
  theme, setTheme, openAuthModal, isAdmin
}) {
  const location = useLocation();
  const isPublicPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-memphis-mesh relative overflow-x-hidden flex flex-col justify-between">
      {/* Absolute Background Memphis Geometric Shapes (only on workspace views) */}
      {!isPublicPage && (
        <>
          <div className="memphis-shape w-96 h-96 rounded-full bg-[#EF4444] border-[8px] border-black -top-20 -right-20 animate-float-slow hidden xl:block" style={{ zIndex: 0 }} />
          <svg className="memphis-shape w-40 h-40 bottom-10 left-[45%] animate-float-medium hidden lg:block" viewBox="0 0 100 100" style={{ zIndex: 0 }}>
            <polygon points="50,10 90,90 10,90" stroke="black" strokeWidth="6" fill="#FBBF24" />
          </svg>
          <svg className="memphis-shape w-48 h-32 bottom-24 -left-12 animate-float-fast hidden xl:block" viewBox="0 0 150 100" style={{ zIndex: 0 }}>
            <polygon points="10,90 120,90 140,10 30,10" stroke="black" strokeWidth="6" fill="#3B82F6" />
          </svg>
        </>
      )}

      <div className="relative z-10 flex flex-col min-h-screen w-full">
        <div className="flex-1 flex flex-col">
          {/* Top Navigation - hidden on public landing page */}
          {!isPublicPage && (
            <Navbar founderProfile={founderProfile} user={user} setUser={setUser} openAuthModal={openAuthModal} theme={theme} setTheme={setTheme} />
          )}

          {/* Main Pages */}
          <main className="flex-1 pb-16 relative z-10">
            <Routes>
              {/* Public Landing Page */}
              <Route path="/" element={<LandingPage openAuthModal={openAuthModal} user={user} />} />

              {/* Private Dashboard */}
              <Route 
                path="/dashboard" 
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

              {/* Startup Feed */}
              <Route 
                path="/feed" 
                element={<Feed user={user} founderProfile={founderProfile} />} 
              />

              {/* Startup Showcase Profile */}
              <Route 
                path="/startups/:id" 
                element={<StartupProfile />} 
              />

              {/* Signals */}
              <Route 
                path="/signals" 
                element={<Signals founderProfile={founderProfile} />} 
              />

              {/* Reports List */}
              <Route 
                path="/reports" 
                element={<Reports user={user} setUser={setUser} openAuthModal={openAuthModal} founderProfile={founderProfile} />} 
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

              {/* Equity Cap Split Planner */}
              <Route 
                path="/equity" 
                element={<EquityPlanner />} 
              />

              {/* Micro Bounty Board */}
              <Route 
                path="/bounties" 
                element={<BountyBoard founderProfile={founderProfile} user={user} />} 
              />

              {/* Pitch Brief Builder Dashboard */}
              <Route 
                path="/briefs" 
                element={<PitchBrief mode="builder" founderProfile={founderProfile} />} 
              />

              {/* Public whitelist-guarded Pitch Brief Data Room */}
              <Route 
                path="/brief/:id" 
                element={<PitchBrief mode="public" />} 
              />

              {/* Founder Memory */}
              <Route path="/memory" element={<FounderMemory founderProfile={founderProfile} user={user} />} />
              <Route path="/settings" element={<Settings user={user} />} />
              <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Navigate to="/" replace />} />

              {/* Timeline */}
              <Route 
                path="/timeline" 
                element={<Timeline founderProfile={founderProfile} user={user} />} 
              />

              {/* Opportunities */}
              <Route 
                path="/opportunities" 
                element={<Opportunities founderProfile={founderProfile} user={user} />} 
              />

              {/* Explore */}
              <Route 
                path="/explore" 
                element={<Explore founderProfile={founderProfile} user={user} />} 
              />

              {/* Wildcard Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        {/* Footer (hidden on public landing) */}
        {!isPublicPage && (
          <footer className="w-full bg-neo-canvas border-t-[3px] border-black py-4 select-none mt-auto">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <span className="font-outfit font-black text-[10px] tracking-wider uppercase text-gray-500">
                © {new Date().getFullYear()} STRATIFY LABS INC. • ALL SYSTEM INTERFACES GROUNDED WITH AI LOGIC AND LIVE INTEL.
              </span>
            </div>
          </footer>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onAuthSuccess={() => checkSession(null)} 
      />
    </div>
  );
}
