import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';

const STORAGE_KEY = 'stratify_cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) {
        // Small delay so it animates in smoothly without layout shift
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore localStorage restrictions
    }
  }, []);

  const handleConsent = (choice) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        choice,
        timestamp: new Date().toISOString()
      }));
    } catch {
      // Ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      role="region"
      aria-label="Cookie consent banner"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-fade-in-up"
    >
      <div className="bg-canvas/95 backdrop-blur-md border border-DEFAULT rounded-xl p-4 sm:p-5 shadow-xl text-text-primary">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-accent/20 text-text-primary flex-shrink-0 mt-0.5">
            <ShieldCheck size={18} aria-hidden="true" />
          </div>

          <div className="flex-1 text-xs leading-relaxed font-inter">
            <h3 className="font-outfit font-bold uppercase tracking-wider text-[11px] text-text-primary mb-1">
              Cookie Preferences & Privacy
            </h3>
            <p className="text-text-secondary mb-3">
              We use essential cookies to maintain secure sessions and anonymous telemetry to optimize the startup graph.{' '}
              <Link to="/privacy" className="text-text-primary underline hover:text-accent font-medium">
                Privacy Policy
              </Link>
              .
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleConsent('accepted')}
                className="px-3.5 py-1.5 bg-accent text-[#111] rounded-md font-outfit font-bold text-[11px] uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
              >
                Accept All
              </button>
              <button
                onClick={() => handleConsent('essential_only')}
                className="px-3 py-1.5 border border-DEFAULT bg-card text-text-secondary hover:text-text-primary rounded-md font-outfit font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
              >
                Essential Only
              </button>
            </div>
          </div>

          <button
            onClick={() => handleConsent('dismissed')}
            className="text-text-muted hover:text-text-primary p-1 transition-colors cursor-pointer"
            aria-label="Dismiss cookie notice"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
