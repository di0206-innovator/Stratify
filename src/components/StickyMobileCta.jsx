import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Video, LayoutDashboard } from 'lucide-react';

export default function StickyMobileCta({ user, openAuthModal }) {
  const [show, setShow] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Only show on public landing, about, or marketing pages
    const isMarketingPage = ['/', '/about', '/upgrade'].includes(location.pathname);
    if (!isMarketingPage) {
      setShow(false);
      return;
    }

    const handleScroll = () => {
      setShow(window.scrollY > 280);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="Quick mobile action"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-canvas/95 backdrop-blur-md border-t border-DEFAULT px-4 py-2.5 shadow-lg flex items-center gap-2 animate-slide-up"
    >
      {user ? (
        <Link
          to="/dashboard"
          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 bg-surface-dark text-white rounded-lg font-outfit font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          <LayoutDashboard size={14} aria-hidden="true" />
          <span>Open Dashboard</span>
        </Link>
      ) : (
        <>
          <button
            onClick={openAuthModal}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-accent text-[#111] rounded-lg font-outfit font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
          >
            <ArrowRight size={14} aria-hidden="true" />
            <span>Get Started</span>
          </button>

          <Link
            to="/walkthrough"
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-card border border-DEFAULT text-text-primary rounded-lg font-outfit font-semibold text-xs uppercase tracking-wider hover:border-text-primary transition-colors"
          >
            <Video size={14} aria-hidden="true" />
            <span>Book Demo</span>
          </Link>
        </>
      )}
    </div>
  );
}
