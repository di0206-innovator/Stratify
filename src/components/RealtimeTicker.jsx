import React, { useState, useEffect, memo } from 'react';
import { Zap, ShieldAlert, Award, Play } from 'lucide-react';
import useRealtime from '../lib/useRealtime';

const FALLBACK_TICKER_ITEMS = [
  { id: 'fallback-1', text: 'Stratify live wire is warming up.', type: 'news' },
  { id: 'fallback-2', text: 'Startup search will surface ecosystem activity here as it lands.', type: 'signal' },
  { id: 'fallback-3', text: 'New founder posts, discoveries, and programs stream into this wire in real time.', type: 'milestone' }
];

const RealtimeTicker = memo(function RealtimeTicker() {
  const [tickerItems, setTickerItems] = useState(FALLBACK_TICKER_ITEMS);

  const [highlightedId, setHighlightedId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadTicker = async () => {
      try {
        const res = await fetch('/api/live/ticker?limit=10');
        if (!res.ok) return;

        const data = await res.json();
        if (!cancelled && Array.isArray(data.items) && data.items.length > 0) {
          setTickerItems(data.items);
        }
      } catch (error) {
        console.error('Failed to load live ticker items:', error);
      }
    };

    loadTicker();
    const intervalId = setInterval(loadTicker, 45000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

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
        return 'bg-amber-500/100/10 border-amber-500/20 text-amber-500';
      case 'funding':
      case 'news':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600';
      case 'milestone':
        return 'bg-accent/20 border-[#C8E64A]/30 text-text-primary';
      case 'regulation':
      case 'signal':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-600';
      default:
        return 'bg-hover0/10 border-gray-500/20 text-text-primary';
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
        return <Award size={10} className="fill-[#C8E64A] text-text-primary shrink-0" />;
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
          width: 100%;
          background: rgba(26, 26, 26, 0.98);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          position: sticky;
          top: 0;
          z-index: 49;
          user-select: none;
        }
        .ticker-shell {
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 48px;
          overflow: hidden;
        }
        .ticker-container {
          display: flex;
          align-items: center;
          white-space: nowrap;
          animation: ticker-scroll 35s linear infinite;
          width: max-content;
          min-width: 100%;
        }
        .ticker-container:hover {
          animation-play-state: paused;
        }
        .ticker-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 28px;
          padding: 4px 10px;
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
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #C8E64A;
          color: #000;
          font-weight: 900;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          line-height: 1;
          padding: 0 14px;
          height: 32px;
          min-width: 172px;
          border-radius: 10px;
          flex-shrink: 0;
          white-space: nowrap;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
        }
        .ticker-live-alert .pulse-dot {
          width: 6px;
          height: 6px;
          background: #000;
          border-radius: 50%;
          display: inline-block;
          animation: pulse 1.2s infinite;
        }
        .ticker-live-alert .ticker-live-label {
          display: block;
          white-space: nowrap;
          line-height: 1;
          transform: translateY(0.5px);
        }
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.3; }
          100% { transform: scale(0.9); opacity: 1; }
        }
      `}</style>

      <div className="ticker-wrap">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="ticker-shell">
            <div className="ticker-live-alert">
              <span className="pulse-dot"></span>
              <span className="ticker-live-label">Live Ecosystem Wire</span>
            </div>

            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="ticker-container flex items-center">
                {[...tickerItems, ...tickerItems].map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className={`ticker-item ${getItemStyle(item.type)} ${
                      highlightedId === item.id ? 'scale-105 border-white bg-card/20' : ''
                    }`}
                  >
                    {renderIcon(item.type)}
                    <span className="truncate max-w-lg">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export default RealtimeTicker;
