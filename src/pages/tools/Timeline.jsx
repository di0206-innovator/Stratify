import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, Target, FileText, Zap, Award, TrendingUp, 
  MessageSquare, Filter, RefreshCw, GitCommit,
  Sparkles, ChevronDown
} from 'lucide-react';
import AuthGate from '../../components/AuthGate';

const EVENT_CONFIG = {
  milestone: { icon: Award, color: 'bg-[#C8E64A]/20 text-black border-[#C8E64A]/40', label: 'Milestone' },
  launch: { icon: Zap, color: 'bg-[#C8E64A]/20 text-black border-[#C8E64A]/40', label: 'Launch' },
  decision: { icon: Target, color: 'bg-gray-100 text-gray-800 border-gray-250', label: 'Decision' },
  post: { icon: MessageSquare, color: 'bg-gray-50 text-gray-600 border-gray-200', label: 'Update' },
  score_change: { icon: TrendingUp, color: 'bg-[#C8E64A]/25 text-black border-[#C8E64A]/45', label: 'Score' },
  profile_update: { icon: GitCommit, color: 'bg-gray-50 text-gray-500 border-gray-200', label: 'Profile' },
  report_generated: { icon: FileText, color: 'bg-black text-white border-black', label: 'Report' },
  startup_created: { icon: Sparkles, color: 'bg-[#C8E64A]/20 text-black border-[#C8E64A]/40', label: 'Created' },
};

export default function Timeline({ founderProfile, user, openAuthModal }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? '/api/timeline' : `/api/timeline?type=${filter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (e) {
      console.error('Failed to fetch timeline:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [filter]);

  const filterOptions = [
    { value: 'all', label: 'All Events' },
    { value: 'milestone', label: 'Milestones' },
    { value: 'decision', label: 'Decisions' },
    { value: 'launch', label: 'Launches' },
    { value: 'score_change', label: 'Score Changes' },
    { value: 'post', label: 'Updates' },
    { value: 'report_generated', label: 'Reports' },
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const date = formatDate(event.createdAt || event.created_at);
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {});

  const isEcosystem = founderProfile?.role === 'vc' || founderProfile?.role === 'institution' || founderProfile?.role === 'government';

  return (
    <AuthGate user={user} openAuthModal={openAuthModal} message={isEcosystem ? "Sign in to view the ecosystem activity timeline." : "Sign in to view your startup's activity timeline — every decision, milestone, and change."}>
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8 animate-fade-in text-[#111]">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-200/60 select-none">
          <div className="flex items-center gap-3">
            <div className="bg-[#1A1A1A] p-3 text-white rounded-lg">
              <Clock size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-outfit font-black tracking-tight">
                {isEcosystem ? 'Ecosystem Timeline' : 'Startup Timeline'}
              </h1>
              <p className="font-inter text-gray-500 mt-1 text-xs sm:text-sm">
                {isEcosystem ? 'Real-time activity feed of regional startups — milestones, launches, and decisions.' : "Your startup's living history — every decision, milestone, and change."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex items-center gap-2 bg-[#FAF9F6] border border-gray-250 px-4 py-2 font-outfit font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm hover:border-black transition-all cursor-pointer"
              >
                <Filter size={14} /> {filterOptions.find(f => f.value === filter)?.label} <ChevronDown size={14} />
              </button>
              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 shadow-lg z-50 min-w-[180px] rounded-lg overflow-hidden py-1">
                  {filterOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setFilter(opt.value); setShowFilterMenu(false); }}
                      className={`block w-full text-left px-4 py-2 text-xs font-semibold uppercase hover:bg-gray-50 transition-colors ${filter === opt.value ? 'bg-[#C8E64A]/20 font-bold text-black' : 'text-gray-600'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={fetchTimeline}
              className="os-btn p-2 border-gray-250 rounded-lg hover:border-black"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Timeline Content */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border border-black border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-outfit font-bold text-xs tracking-wider uppercase mt-4">Loading timeline...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="os-card bg-white p-16 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <Clock size={24} className="text-gray-400" />
            </div>
            <h3 className="font-outfit font-bold text-lg text-black">
              {isEcosystem ? 'No Ecosystem Activity' : 'No Events Yet'}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              {isEcosystem 
                ? 'Updates, milestones, and strategic decisions will appear here as startups log their progress.'
                : 'Your timeline will populate as you post updates, achieve milestones, log decisions, and generate reports. Start by posting an update on the Feed.'}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-2 bottom-0 w-[1.5px] bg-gray-200 hidden md:block" />

            <div className="space-y-8">
              {Object.entries(groupedEvents).map(([date, dayEvents]) => (
                <div key={date} className="relative">
                  {/* Date header */}
                  <div className="flex items-center gap-3 mb-4 relative z-10">
                    <div className="bg-[#1A1A1A] text-white px-3 py-1 font-outfit font-semibold text-[10px] uppercase tracking-wider rounded-md">
                      {date}
                    </div>
                  </div>

                  {/* Events for this date */}
                  <div className="space-y-4 md:pl-14">
                    {dayEvents.map((event, idx) => {
                      const config = EVENT_CONFIG[event.eventType || event.event_type] || EVENT_CONFIG.post;
                      const Icon = config.icon;
                      return (
                        <div
                          key={event.id || idx}
                          className="os-card bg-white p-5 hover:border-black transition-all"
                        >
                          <div className="flex items-start gap-4">
                            <div className={`${config.color} border border-transparent p-2.5 rounded-lg flex-shrink-0 flex items-center justify-center`}>
                              <Icon size={15} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <h4 className="font-outfit font-bold text-sm text-[#111] uppercase tracking-wide leading-tight">{event.title}</h4>
                                <span className="text-[10px] font-bold text-gray-400 flex-shrink-0 font-mono mt-0.5">
                                  {formatTime(event.createdAt || event.created_at)}
                                </span>
                              </div>
                              {event.description && (
                                <p className="text-xs font-semibold font-inter text-gray-550 mt-1 leading-relaxed font-light">{event.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-3 select-none">
                                <span className={`${config.color} border px-2 py-0.5 text-[9px] font-bold uppercase rounded-md`}>
                                  {config.label}
                                </span>
                                {event.metadata?.delta && (
                                  <span className="bg-[#C8E64A]/25 border border-[#C8E64A]/30 px-2 py-0.5 text-[9px] font-bold text-black rounded-md">
                                    +{event.metadata.delta} PTS
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AuthGate>
  );
}
