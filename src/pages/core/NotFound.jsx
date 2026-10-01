import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Search, Compass, Radio, TrendingUp, ShieldAlert, Video } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16 text-text-primary">
      <div className="max-w-xl w-full text-center animate-fade-in">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 mb-6 font-outfit text-xs font-bold uppercase tracking-wider">
          <ShieldAlert size={14} aria-hidden="true" />
          <span>Error 404 // Node Not Found</span>
        </div>

        {/* Big Code */}
        <h1 className="font-outfit font-black text-7xl sm:text-8xl tracking-tight text-text-primary mb-4 select-none">
          4<span className="text-accent underline decoration-4">0</span>4
        </h1>

        {/* Heading */}
        <h2 className="font-outfit font-black text-2xl sm:text-3xl tracking-tight uppercase mb-4">
          Entity Disconnected from Startup Graph
        </h2>

        {/* Explanation */}
        <p className="text-text-secondary text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto font-inter">
          The requested resource coordinate does not exist, has moved, or requires elevated authorization. Let's redirect you back to active telemetry.
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-DEFAULT bg-card text-text-primary font-semibold text-xs uppercase tracking-wider font-outfit hover:border-text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Go Back
          </button>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-[#111] font-bold text-xs uppercase tracking-wider font-outfit hover:opacity-90 transition-opacity shadow-sm"
          >
            <Home size={14} aria-hidden="true" />
            Return Home
          </Link>

          <Link
            to="/walkthrough"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-dark text-white font-semibold text-xs uppercase tracking-wider font-outfit hover:opacity-90 transition-opacity"
          >
            <Video size={14} aria-hidden="true" />
            Book Walkthrough
          </Link>
        </div>

        {/* Quick Directory Links */}
        <div className="border-t border-DEFAULT pt-6">
          <p className="text-[11px] font-outfit font-bold uppercase tracking-wider text-text-muted mb-4">
            Popular Startup Economy Modules
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
            <Link
              to="/explore"
              className="p-2.5 rounded-lg border border-DEFAULT hover:border-text-primary bg-card/50 transition-all flex flex-col gap-1"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary font-outfit">
                <Compass size={13} className="text-accent" aria-hidden="true" />
                <span>Explore</span>
              </div>
              <span className="text-[10px] text-text-muted">Startup Directory</span>
            </Link>

            <Link
              to="/signals"
              className="p-2.5 rounded-lg border border-DEFAULT hover:border-text-primary bg-card/50 transition-all flex flex-col gap-1"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary font-outfit">
                <Radio size={13} className="text-accent" aria-hidden="true" />
                <span>Signals</span>
              </div>
              <span className="text-[10px] text-text-muted">Live Market Pulses</span>
            </Link>

            <Link
              to="/runway"
              className="p-2.5 rounded-lg border border-DEFAULT hover:border-text-primary bg-card/50 transition-all flex flex-col gap-1"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary font-outfit">
                <TrendingUp size={13} className="text-accent" aria-hidden="true" />
                <span>Runway</span>
              </div>
              <span className="text-[10px] text-text-muted">Burn Simulation</span>
            </Link>

            <Link
              to="/intelligence"
              className="p-2.5 rounded-lg border border-DEFAULT hover:border-text-primary bg-card/50 transition-all flex flex-col gap-1"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary font-outfit">
                <Search size={13} className="text-accent" aria-hidden="true" />
                <span>Intel</span>
              </div>
              <span className="text-[10px] text-text-muted">AI Research Briefs</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
