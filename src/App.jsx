import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Signals from './pages/Signals';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';

export default function App() {
  const [founderProfile, setFounderProfile] = useState(null);
  const [currentReport, setCurrentReport] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load founder profile from local storage if preset
    const cachedProfile = localStorage.getItem('neuralbi_founder_profile');
    if (cachedProfile) {
      try {
        setFounderProfile(JSON.parse(cachedProfile));
      } catch (e) {
        console.error('Failed to parse cached founder profile', e);
      }
    }

    // Check backend active session
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (e) {
        console.warn('Backend server is not running or unreachable.');
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-[4px] border-black border-t-transparent rounded-full animate-spin"></div>
        <h2 className="font-outfit font-black uppercase text-xs tracking-wider mt-4">BOOTING FOUNDER STRATEGY OS...</h2>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col justify-between">
        <div>
          {/* Top Navigation */}
          <Navbar founderProfile={founderProfile} />

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
                element={<Reports user={user} setUser={setUser} />} 
              />

              {/* Report Detail */}
              <Route 
                path="/reports/:id" 
                element={<ReportDetail />} 
              />

              {/* Wildcard Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        {/* Footer */}
        <footer className="w-full bg-[#F8F7F4] border-t-[3px] border-black py-4 select-none">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <span className="font-outfit font-black text-[10px] tracking-wider uppercase text-gray-500">
              © {new Date().getFullYear()} NEURALBI LABS INC. • ALL SYSTEM INTERFACES GROUNDED WITH AI LOGIC AND LIVE INTEL.
            </span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
