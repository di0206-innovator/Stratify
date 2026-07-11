import React, { useState, useEffect } from 'react';
import { Zap, ShieldAlert, Award, Play } from 'lucide-react';
import useRealtime from '../lib/useRealtime';

export default function RealtimeTicker() {
  const [tickerItems, setTickerItems] = useState([
    { id: '1', text: "Stripe acquires Bridge for $1.1B to scale stablecoin payments.", type: "news" },
    { id: '2', text: "Cognito AI raises $12M Seed to automate developer operations.", type: "funding" },
    { id: '3', text: "BioFlow Labs posted milestone: Onboarded 5 hospitals for beta clinic portal.", type: "milestone" },
    { id: '4', text: "NEW BOUNTY: Optimize Postgres indexing for Cap Table splits (Reward: $150).", type: "bounty" },
    { id: '5', text: "Perplexity AI raises $250M at an $8B valuation to accelerate search.", type: "news" },
    { id: '6', text: "Reserve Bank of India mandates strict verification for digital lending apps.", type: "regulation" }
  ]);

  const [highlightedId, setHighlightedId] = useState(null);

  // Subscribe to real-time events to push them dynamically into the ticker!
  useRealtime({
    post_created: (post) => {
      let type = 'post';
      let text = '';
      if (post.metadata?.isSystemNews) {
        type = 'news';
        text = `🚀 ${post.content}`;
      } else if (post.type === 'milestone' || post.type === 'launch') {
        type = 'milestone';
        text = `★ Milestone: ${post.authorName} (${post.startupName}) shipped: "${post.content.slice(0, 80)}"`;
      } else {
        type = 'post';
        text = `💬 ${post.authorName} posted: "${post.content.slice(0, 80)}"`;
      }
      
      addNewTickerItem({ text, type });
    },
    bounty_created: (bounty) => {
      const text = `💰 NEW BOUNTY: ${bounty.title} (Reward: ${bounty.reward})`;
      addNewTickerItem({ text, type: 'bounty' });
    },
    signal_created: (signal) => {
      const text = `⚡ SIGNAL: [${signal.type}] ${signal.title} — Impact: ${signal.impact}`;
      addNewTickerItem({ text, type: 'signal' });
    }
  });

  const addNewTickerItem = (item) => {
    const newItem = {
      id: Date.now().toString() + Math.random().toString(),
      text: item.text,
      type: item.type
    };

    setTickerItems((prev) => {
      // Keep ticker items bounded to max 12 items to prevent memory inflation
      const nextItems = [newItem, ...prev.slice(0, 10)];
      return nextItems;
    });

    // Highlight the ticker background briefly to show live activity
    setHighlightedId(newItem.id);
    setTimeout(() => setHighlightedId(null), 3000);
  };

  const getItemStyle = (type) => {
    switch (type) {
      case 'bounty':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-600';
      case 'funding':
      case 'news':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600';
      case 'milestone':
        return 'bg-[#C8E64A]/20 border-[#C8E64A]/30 text-black';
      case 'regulation':
      case 'signal':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-600';
      default:
        return 'bg-gray-500/10 border-gray-500/20 text-gray-700';
    }
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'bounty':
        return <Zap size={10} className="fill-amber-500 text-amber-500 shrink-0" />;
      case 'regulation':
      case 'signal':
        return <ShieldAlert size={10} className="fill-rose-500 text-rose-500 shrink-0" />;
      case 'milestone':
        return <Award size={10} className="fill-[#C8E64A] text-black shrink-0" />;
      default:
        return <Play size={8} className="fill-current shrink-0" />;
    }
  };

  return (
    <>
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .ticker-wrap {
          overflow: hidden;
          width: 100%;
          background: rgba(26, 26, 26, 0.98);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          height: 38px;
          position: sticky;
          top: 0;
          z-index: 49;
          font-family: 'Inter', sans-serif;
          user-select: none;
        }
        .ticker-container {
          display: flex;
          white-space: nowrap;
          animation: ticker-scroll 35s linear infinite;
          width: max-content;
        }
        .ticker-container:hover {
          animation-play-state: paused;
        }
        .ticker-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 10px;
          margin: 0 15px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: #fff;
          transition: all 0.3s ease;
        }
        .ticker-live-alert {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #C8E64A;
          color: #000;
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0 15px;
          height: 100%;
          border-right: 1px solid rgba(255, 255, 255, 0.15);
          z-index: 50;
          shrink-0: true;
          box-shadow: 4px 0 15px rgba(0, 0, 0, 0.3);
        }
        .ticker-live-alert span {
          width: 6px;
          height: 6px;
          background: #000;
          border-radius: 50%;
          display: inline-block;
          animation: pulse 1.2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.3; }
          100% { transform: scale(0.9); opacity: 1; }
        }
      `}</style>

      <div className="ticker-wrap flex items-center">
        {/* Ticker Title */}
        <div className="ticker-live-alert flex items-center shrink-0">
          <span></span>
          <span>LIVE ECOSYSTEM WIRE</span>
        </div>

        {/* Scrolling tape */}
        <div className="ticker-container flex items-center">
          {/* Double content for seamless looping */}
          {[...tickerItems, ...tickerItems].map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className={`ticker-item ${getItemStyle(item.type)} ${
                highlightedId === item.id ? 'scale-105 border-white bg-white/20' : ''
              }`}
            >
              {renderIcon(item.type)}
              <span className="truncate max-w-lg">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
