import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, Target, FileText, Zap, Award, TrendingUp, 
  MessageSquare, Filter, RefreshCw, ArrowRight, GitCommit,
  Sparkles, ChevronDown
} from 'lucide-react';
import AuthGate from '../components/AuthGate';

const EVENT_CONFIG = {
  milestone: { icon: Award, color: 'bg-[#A3E635]', label: 'Milestone' },
  launch: { icon: Zap, color: 'bg-[#FB923C]', label: 'Launch' },
  decision: { icon: Target, color: 'bg-[#C084FC]', label: 'Decision' },
  post: { icon: MessageSquare, color: 'bg-white', label: 'Update' },
  score_change: { icon: TrendingUp, color: 'bg-[#60A5FA]', label: 'Score' },
  profile_update: { icon: GitCommit, color: 'bg-gray-200', label: 'Profile' },
  report_generated: { icon: FileText, color: 'bg-[#F472B6]', label: 'Report' },
  startup_created: { icon: Sparkles, color: 'bg-[#A3E635]', label: 'Created' },
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

  return (
    <AuthGate user={user} openAuthModal={openAuthModal} message="Sign in to view your startup's activity timeline — every decision, milestone, and change.">
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white border-[3px] border-black p-6 shadow-neo-hard select-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#C084FC] border-[3px] border-black p-3.5 text-black">
              <Clock size={22} strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Startup Timeline</h1>
              <p className="text-sm font-bold text-gray-500">Your startup's living history — every decision, milestone, and change.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex items-center gap-2 bg-white border-[3px] border-black px-4 py-2 font-black text-sm uppercase hover:shadow-neo-button transition-all"
              >
                <Filter size={14} /> {filterOptions.find(f => f.value === filter)?.label} <ChevronDown size={14} />
              </button>
              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border-[3px] border-black shadow-neo-hard z-50 min-w-[180px]">
                  {filterOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setFilter(opt.value); setShowFilterMenu(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm font-bold hover:bg-gray-100 ${filter === opt.value ? 'bg-[#A3E635]' : ''}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={fetchTimeline}
              className="bg-[#A3E635] border-[3px] border-black p-2 hover:shadow-neo-button transition-all"
            >
              <RefreshCw size={16} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-[4px] border-black border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-outfit font-black text-xs tracking-wider uppercase mt-4">Loading timeline...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white border-[3px] border-black p-12 text-center">
          <div className="bg-[#C084FC] border-[3px] border-black p-4 inline-block mb-4">
            <Clock size={32} strokeWidth={3} className="text-black" />
          </div>
          <h3 className="font-black text-xl uppercase mb-2">No Events Yet</h3>
          <p className="font-bold text-gray-500 text-sm max-w-md mx-auto">
            Your timeline will populate as you post updates, achieve milestones, log decisions, and generate reports. 
            Start by posting an update on the <Link to="/feed" className="underline text-black">Feed</Link>.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-[3px] bg-black hidden md:block" />

          {Object.entries(groupedEvents).map(([date, dayEvents]) => (
            <div key={date} className="mb-8">
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="bg-black text-white px-4 py-1 font-black text-xs uppercase tracking-wider">
                  {date}
                </div>
              </div>

              {/* Events for this date */}
              <div className="space-y-3 md:pl-16">
                {dayEvents.map((event, idx) => {
                  const config = EVENT_CONFIG[event.eventType || event.event_type] || EVENT_CONFIG.post;
                  const Icon = config.icon;
                  return (
                    <div
                      key={event.id || idx}
                      className="bg-white border-[3px] border-black p-4 shadow-neo-hard hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`${config.color} border-[2px] border-black p-2 flex-shrink-0`}>
                          <Icon size={16} strokeWidth={3} className="text-black" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-black text-sm uppercase truncate">{event.title}</h4>
                            <span className="text-[10px] font-bold text-gray-400 flex-shrink-0">
                              {formatTime(event.createdAt || event.created_at)}
                            </span>
                          </div>
                          {(event.description) && (
                            <p className="text-sm font-medium text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`${config.color} border-[2px] border-black px-2 py-0.5 text-[10px] font-black uppercase`}>
                              {config.label}
                            </span>
                            {event.metadata?.delta && (
                              <span className="bg-[#A3E635] border-[2px] border-black px-2 py-0.5 text-[10px] font-black">
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
      )}
    </div>
    </AuthGate>
  );
}
