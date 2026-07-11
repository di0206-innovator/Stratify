import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import BetaBanner from './components/BetaBanner';
import AuthModal from './components/AuthModal';
import Seo from './components/Seo';
import RealtimeTicker from './components/RealtimeTicker';
import { supabase } from './lib/supabase';

// Lazy load pages for maximum efficiency and modular bundle sizes
const Onboarding = lazy(() => import('./pages/core/Onboarding'));
const Dashboard = lazy(() => import('./pages/core/Dashboard'));
const LandingPage = lazy(() => import('./pages/marketing/LandingPage'));
const Signals = lazy(() => import('./pages/ecosystem/Signals'));
const Intelligence = lazy(() => import('./pages/intelligence/Intelligence'));
const ReportDetail = lazy(() => import('./pages/intelligence/ReportDetail'));
const RunwayPlanner = lazy(() => import('./pages/tools/RunwayPlanner'));
const AdminDashboard = lazy(() => import('./pages/core/AdminDashboard'));
const Feed = lazy(() => import('./pages/ecosystem/Feed'));
const StartupProfile = lazy(() => import('./pages/ecosystem/StartupProfile'));
const PitchBrief = lazy(() => import('./pages/tools/PitchBrief'));
const EquityPlanner = lazy(() => import('./pages/tools/EquityPlanner'));
const BountyBoard = lazy(() => import('./pages/tools/BountyBoard'));
const Timeline = lazy(() => import('./pages/tools/Timeline'));
const Opportunities = lazy(() => import('./pages/ecosystem/Opportunities'));
const Explore = lazy(() => import('./pages/ecosystem/Explore'));
const FounderMemory = lazy(() => import('./pages/tools/FounderMemory'));
const Settings = lazy(() => import('./pages/core/Settings'));
const Privacy = lazy(() => import('./pages/marketing/Privacy'));
const Terms = lazy(() => import('./pages/marketing/Terms'));
const About = lazy(() => import('./pages/marketing/About'));

// Fallback spinner for lazy-loaded pages
const PageFallback = () => (
 <div className="min-h-[50vh] flex flex-col items-center justify-center p-4">
 <div className="w-10 h-10 border-t-transparent rounded-full animate-spin"></div>
 <h2 className="font-outfit font-black uppercase text-[10px] tracking-wider mt-3">LOADING MODULE...</h2>
 </div>
);

// Intercept window.fetch to automatically append the Supabase session token if authenticated
const originalFetch = window.fetch.bind(window);

function shouldAttachAuth(url) {
 const requestUrl = typeof url === 'string' ? url : url?.url;
 if (!requestUrl) return false;
 if (requestUrl.startsWith('/api/')) return true;

 try {
 const parsed = new URL(requestUrl, window.location.origin);
 return parsed.origin === window.location.origin && parsed.pathname.startsWith('/api/');
 } catch {
 return false;
 }
}

window.fetch = async (url, options = {}) => {
 let token = null;

 if (supabase?.auth) {
 try {
 const { data: { session } } = await supabase.auth.getSession();
 token = session?.access_token;
 } catch (e) {
 console.warn('Failed to retrieve Supabase session token for request:', e);
 }
 }

 if (token && shouldAttachAuth(url)) {
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

 const hydrateUser = async (fallbackUser = null) => {
 try {
 if (supabase?.auth) {
 const { data: { user: sessionUser } } = await supabase.auth.getUser();
 if (sessionUser) {
 const nextUser = {
 id: sessionUser.id,
 email: sessionUser.email || '',
 username: sessionUser.user_metadata?.username || sessionUser.email?.split('@')[0] || 'User',
 emailVerified: !!sessionUser.email_confirmed_at
 };
 setUser(nextUser);
 return nextUser;
 }
 }

 const res = await fetch('/api/auth/me');
 if (res.ok) {
 const data = await res.json();
 setUser(data.user);
 return data.user;
 }

 if (fallbackUser) {
 setUser(fallbackUser);
 return fallbackUser;
 }

 setUser(null);
 } catch (e) {
 console.warn('Backend server is not running or unreachable.');
 setUser(fallbackUser);
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

 // Failsafe: Force loading to false after 3 seconds so the app never hangs indefinitely
 const failsafeTimer = setTimeout(() => {
 setLoading(false);
 }, 3000);

 let unsubscribe = null;

 if (supabase) {
 // Listen to Supabase Auth changes
 const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
 if (session?.user) {
 const extUser = {
 id: session.user.id,
 email: session.user.email || '',
 username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User',
 emailVerified: !!session.user.email_confirmed_at
 };
 setUser(extUser);
 hydrateUser(extUser);
 } else {
 hydrateUser(null);
 }
 });
 unsubscribe = subscription.unsubscribe;
 } else {
 hydrateUser(null);
 }

 return () => {
 clearTimeout(failsafeTimer);
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
 <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center p-4">
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
 hydrateUser={hydrateUser}
 />
 </BrowserRouter>
);
}

function AppContent({
 founderProfile, setFounderProfile, currentReport, setCurrentReport,
 user, setUser, isAuthModalOpen, setIsAuthModalOpen,
 theme, setTheme, openAuthModal, isAdmin, hydrateUser
}) {
 const location = useLocation();
 const isPublicRoute = location.pathname === '/' || location.pathname.startsWith('/brief/');
 const seo = getSeoForPath(location.pathname);

 if (!user && !isPublicRoute) {
 return <Navigate to="/" replace />;
 }

 if (user && !founderProfile && !isPublicRoute && location.pathname !== '/onboarding') {
 return <Navigate to="/onboarding" replace />;
 }

 return (
 <>
 <Seo {...seo} path={location.pathname} />
 <a
   href="#main-content"
   className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-md focus:bg-black focus:px-4 focus:py-2 focus:text-white"
 >
   Skip to main content
 </a>
 <BetaBanner />

 {/* Floating global Beta pill at top right (hidden on mobile, stays out of way of header) */}
 <div className="fixed top-20 right-6 z-45 hidden lg:flex items-center gap-1.5 bg-[#FAF9F6]/85 backdrop-blur border border-gray-200/80 px-2.5 py-1 rounded-full shadow-sm select-none pointer-events-none">
   <span className="w-1.5 h-1.5 rounded-full bg-[#C8E64A] animate-pulse"></span>
   <span className="font-outfit font-black text-[9px] text-gray-800 tracking-wider uppercase">Beta OS</span>
 </div>

 <div className="min-h-screen bg-canvas flex flex-col w-full text-gray-900 font-inter">
 <div className="flex-1 flex flex-col">
  {location.pathname !== '/' && (
    <>
      <RealtimeTicker />
      <Navbar founderProfile={founderProfile} user={user} setUser={setUser} openAuthModal={openAuthModal} theme={theme} setTheme={setTheme} />
    </>
  )}

 {/* Main Pages */}
 <main id="main-content" className="flex-1 pb-16 relative z-10">
 <Suspense fallback={<PageFallback />}>
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
 element={<Feed user={user} founderProfile={founderProfile} openAuthModal={openAuthModal} />} 
 />

 {/* Startup Showcase Profile */}
 <Route 
 path="/startups/:id" 
 element={<StartupProfile />} 
 />

 {/* Signals */}
 <Route 
 path="/signals" 
 element={<Signals founderProfile={founderProfile} user={user} openAuthModal={openAuthModal} />} 
 />

 {/* Intelligence Workspace */}
 <Route 
 path="/intelligence" 
 element={<Intelligence user={user} setUser={setUser} openAuthModal={openAuthModal} founderProfile={founderProfile} />} 
 />
 <Route 
 path="/reports" 
 element={<Navigate to="/intelligence" replace />} 
 />

 {/* Report Detail */}
 <Route 
 path="/intelligence/:id" 
 element={<ReportDetail />} 
 />

 {/* Runway Planner */}
 <Route 
 path="/runway" 
 element={founderProfile?.role === 'founder' ? <RunwayPlanner user={user} openAuthModal={openAuthModal} /> : <Navigate to="/dashboard" replace />} 
 />

 {/* Equity Cap Split Planner */}
 <Route 
 path="/equity" 
 element={founderProfile?.role === 'founder' ? <EquityPlanner user={user} openAuthModal={openAuthModal} /> : <Navigate to="/dashboard" replace />} 
 />

 {/* Micro Bounty Board */}
 <Route 
 path="/bounties" 
 element={founderProfile?.role === 'founder' ? <BountyBoard founderProfile={founderProfile} user={user} openAuthModal={openAuthModal} /> : <Navigate to="/dashboard" replace />} 
 />

 {/* Public whitelist-guarded Pitch Brief Data Room */}
 <Route 
 path="/brief/:id" 
 element={<PitchBrief mode="public" />} 
 />

 {/* Founder Memory */}
 <Route 
 path="/memory" 
 element={founderProfile?.role === 'founder' ? <FounderMemory founderProfile={founderProfile} user={user} openAuthModal={openAuthModal} /> : <Navigate to="/dashboard" replace />} 
 />
 <Route path="/settings" element={<Settings user={user} openAuthModal={openAuthModal} />} />
 <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Navigate to="/" replace />} />

 {/* Timeline */}
 <Route 
 path="/timeline" 
 element={<Timeline founderProfile={founderProfile} user={user} openAuthModal={openAuthModal} />} 
 />

 {/* Opportunities */}
 <Route 
 path="/opportunities" 
 element={founderProfile?.role !== 'vc' ? <Opportunities founderProfile={founderProfile} user={user} openAuthModal={openAuthModal} /> : <Navigate to="/dashboard" replace />} 
 />

 {/* Explore */}
 <Route 
 path="/explore" 
 element={<Explore founderProfile={founderProfile} user={user} openAuthModal={openAuthModal} />} 
 />

  {/* Public Information Pages */}
  <Route path="/privacy" element={<Privacy />} />
  <Route path="/terms" element={<Terms />} />
  <Route path="/about" element={<About />} />

  {/* Wildcard Fallback */}
  <Route path="*" element={<Navigate to="/" replace />} />
 </Routes>
 </Suspense>
 </main>
 </div>

 {location.pathname !== '/' && (
   <footer className="w-full bg-[#FAF9F6] border-t border-gray-200 py-4 select-none mt-auto">
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
 onAuthSuccess={hydrateUser} 
 />
 </>
);
}

function getSeoForPath(pathname) {
 const defaults = {
 title: 'Stratify | Startup Economy Operating System',
 description: 'Stratify connects founders, investors, and startup institutions in one AI-powered operating system for execution, intelligence, and ecosystem visibility.',
 robots: 'index, follow',
 };

 if (pathname === '/') {
 return defaults;
 }

 if (pathname.startsWith('/brief/')) {
 return {
 ...defaults,
 title: 'Stratify Brief | Shared Startup Intelligence',
 description: 'View a shared Stratify brief with startup intelligence, context, and supporting analysis.',
 };
 }

 if (pathname === '/about') {
 return {
 ...defaults,
 title: 'About Stratify | Startup Economy Operating System',
 description: 'Learn about Stratify and its mission to build the operating system for startup ecosystems.',
 };
 }

 if (pathname === '/privacy') {
 return {
 ...defaults,
 title: 'Privacy Policy | Stratify',
 description: 'Read how Stratify handles data, privacy, and platform protections.',
 };
 }

 if (pathname === '/terms') {
 return {
 ...defaults,
 title: 'Terms of Service | Stratify',
 description: 'Review the terms governing access to and use of the Stratify platform.',
 };
 }

 return {
 ...defaults,
 robots: 'noindex, nofollow',
 };
}
