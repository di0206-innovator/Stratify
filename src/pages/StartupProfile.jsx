import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, Trophy, Award, MapPin, Target, Layers, Group, ArrowLeft, CheckCircle2, ExternalLink, Clock } from 'lucide-react';

export default function StartupProfile() {
  const { id } = useParams();
  const [startup, setStartup] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [briefs, setBriefs] = useState([]);
  const [signals, setSignals] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/startups/${id}`);
        let matchedStartup = null;
        if (res.ok) {
          const data = await res.json();
          matchedStartup = data.startup;
          setStartup(matchedStartup);
          setTimeline(data.timeline || []);
          setDecisions(data.decisions || []);
          setBriefs(data.briefs || []);
          setSignals(data.signals || []);
          setOpportunities(data.opportunities || []);
        }
      } catch (e) {
        console.error('Failed to load startup details:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-[4px] border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-black uppercase mb-4">STARTUP NOT FOUND</h2>
        <p className="font-outfit font-bold text-gray-600 mb-6">
          The requested startup profile could not be found or has not been initialized yet.
        </p>
        <Link to="/" className="neo-btn-primary py-2 px-6 text-xs uppercase">
          <ArrowLeft size={14} />
          <span>Go to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-1.5 font-outfit font-black text-xs uppercase text-gray-500 hover:text-black mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      {/* Hero Banner */}
      <div className="neo-card bg-black text-[#A3E635] p-8 sm:p-12 mb-8 border-[3px] border-black shadow-neo-button relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#A3E635] opacity-5 rounded-full transform translate-x-20 -translate-y-20"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#A3E635] text-black border-2 border-black flex items-center justify-center font-black text-2xl uppercase">
              {startup.name ? startup.name.slice(0, 2) : 'ST'}
            </div>
            <div>
              <span className="inline-flex items-center gap-1 bg-[#A3E635] text-black px-2 py-0.5 border border-black font-outfit font-black text-[9px] uppercase tracking-wider mb-2">
                {startup.stage} Stage
              </span>
              <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                {startup.name}
              </h1>
              <p className="font-outfit font-bold text-gray-400 mt-1 flex items-center gap-1.5 text-xs sm:text-sm">
                <MapPin size={14} /> {startup.geography} • {startup.industry}
              </p>
            </div>
          </div>

          {/* Startup Score Badge */}
          <div className="bg-[#A3E635] text-black border-2 border-black px-5 py-3 font-outfit font-black text-center shadow-neo-button transform rotate-1">
            <span className="block text-[10px] tracking-wider uppercase opacity-85">STARTUP SCORE</span>
            <span className="text-3xl font-black">{startup.score || 10}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column (Main details) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Pitch */}
          <div className="neo-card bg-white border-[3px] border-black p-6 shadow-neo-button">
            <h3 className="text-lg font-black uppercase mb-4 flex items-center gap-1.5">
              <Sparkles size={18} className="text-[#C084FC]" /> Core Proposition
            </h3>
            <p className="font-outfit font-bold text-gray-800 text-sm sm:text-base leading-relaxed">
              {startup.pitch || 'No pitch added yet.'}
            </p>
          </div>

          {/* Problem & Solution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="neo-card bg-white border-[3px] border-black p-6 shadow-neo-button">
              <h3 className="text-sm font-black uppercase mb-3 text-red-500 flex items-center gap-1.5">
                <Target size={16} /> Problem Statement
              </h3>
              <p className="font-outfit font-bold text-gray-700 text-xs sm:text-sm leading-relaxed">
                {startup.problem || 'No problem definition set yet.'}
              </p>
            </div>

            <div className="neo-card bg-white border-[3px] border-black p-6 shadow-neo-button">
              <h3 className="text-sm font-black uppercase mb-3 text-[#A3E635] flex items-center gap-1.5">
                <Trophy size={16} /> Product Solution
              </h3>
              <p className="font-outfit font-bold text-gray-700 text-xs sm:text-sm leading-relaxed">
                {startup.solution || 'No solution description set yet.'}
              </p>
            </div>
          </div>

          {/* Tech Stack & Team */}
          <div className="neo-card bg-white border-[3px] border-black p-6 shadow-neo-button">
            <h3 className="text-lg font-black uppercase mb-4 flex items-center gap-1.5">
              <Layers size={18} className="text-[#FB923C]" /> Stack & Team Structure
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-outfit">
              <div>
                <span className="block text-[10px] font-black uppercase text-gray-500 mb-1">TECH STACK</span>
                <span className="font-bold text-gray-800 bg-gray-50 border border-gray-200 px-3 py-1.5 block">
                  {startup.techStack || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase text-gray-500 mb-1">TEAM & TALENT</span>
                <span className="font-bold text-gray-800 bg-gray-50 border border-gray-200 px-3 py-1.5 block">
                  {startup.teamStatus || 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          {/* Verified Execution Timeline */}
          <div className="neo-card bg-white border-[3px] border-black p-6 shadow-neo-button">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black uppercase flex items-center gap-1.5 text-black">
                <Clock size={18} className="text-[#3B82F6]" /> Execution Timeline
              </h3>
              <span className="bg-[#A3E635] text-black border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                Consensus Audited
              </span>
            </div>

            {timeline.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 p-8 text-center text-gray-500 font-outfit font-bold text-xs uppercase rounded-none">
                No verified milestones or logs recorded yet.
              </div>
            ) : (
              <div className="relative border-l-[3px] border-black ml-4 pl-6 space-y-6">
                {timeline.map((event) => (
                  <div key={event.id} className="relative text-left">
                    <div className="absolute -left-[35px] top-0 w-6 h-6 bg-white border-[3px] border-black flex items-center justify-center font-black rounded-none">
                      {event.eventType === 'profile_update' ? '✎' : event.eventType === 'score_increase' ? '↑' : event.eventType === 'decision_logged' ? '✓' : '★'}
                    </div>

                    <div className="border-[2px] border-black p-3 bg-gray-50 text-black">
                      <div className="flex justify-between items-start flex-wrap gap-1.5 mb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider font-mono px-1.5 py-0.5 border border-black bg-white">
                          {event.eventType}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400">
                          {new Date(event.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="font-outfit font-bold text-xs leading-relaxed text-gray-800">
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Strategic Decisions */}
          <div className="neo-card bg-white border-[3px] border-black p-6 shadow-neo-button">
            <h3 className="text-lg font-black uppercase mb-6 flex items-center gap-1.5">
              <CheckCircle2 size={18} className="text-[#A3E635]" /> Strategic Decisions
            </h3>
            {decisions.length === 0 ? (
              <p className="text-sm font-bold text-gray-400 font-outfit uppercase">
                No decisions logged yet.
              </p>
            ) : (
              <div className="space-y-4">
                {decisions.map((decision) => (
                  <div key={decision.id} className="border-[2px] border-black p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-black text-sm uppercase">{decision.title}</h4>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 border border-black ${decision.status === 'completed' ? 'bg-[#A3E635]' : decision.status === 'invalidated' ? 'bg-red-400 text-white' : 'bg-yellow-300'}`}>
                        {decision.status}
                      </span>
                    </div>
                    <p className="text-xs font-bold font-outfit text-gray-600 mb-2">
                      <span className="text-black uppercase text-[10px] font-black block mb-0.5">Context</span>
                      {decision.context}
                    </p>
                    {decision.outcome && (
                      <p className="text-xs font-bold font-outfit text-gray-600">
                        <span className="text-black uppercase text-[10px] font-black block mb-0.5 mt-2">Outcome</span>
                        {decision.outcome}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column (Metadata, status, current goals) */}
        <div className="space-y-6">
          <div className="neo-card bg-white border-[3px] border-black p-6 shadow-neo-button">
            <h3 className="text-sm font-black uppercase mb-4 text-gray-500">Startup Vitals</h3>
            <div className="space-y-4 text-sm font-outfit">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-black uppercase text-gray-400 text-xs">Stage</span>
                <span className="font-bold text-black uppercase bg-[#A3E635] px-2 py-0.5 border border-black text-[10px]">
                  {startup.stage}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-black uppercase text-gray-400 text-xs">Geography Focus</span>
                <span className="font-bold text-gray-800">{startup.geography}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-black uppercase text-gray-400 text-xs">Sector</span>
                <span className="font-bold text-gray-800">{startup.industry}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-black uppercase text-gray-400 text-xs">Current Goal</span>
                <span className="font-bold text-[#C084FC] text-right">{startup.needs || 'No active goal'}</span>
              </div>
            </div>
          </div>

          <div className="neo-card bg-[#F8F7F4] border-[3px] border-black p-6 shadow-neo-button select-none text-center">
            <Award size={36} className="mx-auto mb-2 text-[#A3E635]" />
            <h4 className="font-black uppercase text-xs">VERIFIED BUILDER</h4>
            <p className="text-[11px] font-bold text-gray-500 mt-1">
              This startup is verified by the Stratify consensus layer for active build updates and validation checkpoints.
            </p>
          </div>

          {/* Active Briefs */}
          {briefs.length > 0 && (
            <div className="neo-card bg-white border-[3px] border-black p-4 shadow-neo-button">
              <h3 className="text-xs font-black uppercase mb-3 text-gray-500 border-b border-black pb-2">Active Briefs</h3>
              <div className="space-y-3">
                {briefs.map(brief => (
                  <Link key={brief.id} to={`/brief/${brief.id}`} className="block border-[2px] border-black p-3 hover:bg-gray-50 transition-colors">
                    <span className="text-[10px] uppercase font-black block mb-1">{brief.name} Brief</span>
                    <span className="text-xs font-bold text-[#3B82F6] flex items-center gap-1">
                      View Data Room <ExternalLink size={10} />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Relevant Signals */}
          {signals.length > 0 && (
            <div className="neo-card bg-white border-[3px] border-black p-4 shadow-neo-button">
              <h3 className="text-xs font-black uppercase mb-3 text-gray-500 border-b border-black pb-2">Ecosystem Signals</h3>
              <div className="space-y-2">
                {signals.slice(0, 3).map(signal => (
                  <div key={signal.id} className="border-[2px] border-black p-2 bg-gray-50">
                    <p className="text-xs font-bold line-clamp-2">{signal.title}</p>
                    <span className={`text-[8px] font-black uppercase px-1 py-0.5 mt-1 inline-block border border-black ${signal.sentiment === 'positive' ? 'bg-[#A3E635]' : signal.sentiment === 'negative' ? 'bg-red-400 text-white' : 'bg-yellow-300'}`}>
                      {signal.sentiment}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
