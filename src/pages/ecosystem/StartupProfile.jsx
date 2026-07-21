import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, Trophy, Award, MapPin, Target, Layers, ArrowLeft, CheckCircle2, ExternalLink, Clock, FileText, Shield, Activity } from 'lucide-react';

export default function StartupProfile({ founderProfile, user }) {
  const { id } = useParams();
  const [startup, setStartup] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [briefs, setBriefs] = useState([]);
  const [signals, setSignals] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [journey, setJourney] = useState(null);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [diligenceReports, setDiligenceReports] = useState([]);
  const [diligenceLoading, setDiligenceLoading] = useState(false);

  const fetchDiligenceReports = async (startupName) => {
    if (!user || !startupName) return;
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        const filtered = (data.reports || []).filter(r => 
          (r.title || '').toLowerCase().includes(startupName.toLowerCase()) || 
          (r.executiveSnapshot || '').toLowerCase().includes(startupName.toLowerCase())
        );
        setDiligenceReports(filtered);
      }
    } catch (e) {
      console.error('Failed to load diligence reports:', e);
    }
  };

  const handleGenerateDiligence = async () => {
    if (!user) return;
    setDiligenceLoading(true);
    try {
      const query = `Compile a comprehensive VC due diligence report on ${startup.name} addressing sector market size, product feasibility, and potential growth risks.`;
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          sources: ['web', 'wikipedia', 'sec'],
          founderProfile: {
            name: startup.name,
            pitch: startup.pitch,
            problem: startup.problem,
            solution: startup.solution,
            stage: startup.stage,
            industry: startup.industry,
            geography: startup.geography,
            needs: startup.needs
          },
          reportOptions: {
            reportType: 'DILIGENCE'
          }
        })
      });
      if (res.ok) {
        await fetchDiligenceReports(startup.name);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDiligenceLoading(false);
    }
  };

  const fetchJourney = async () => {
    setJourneyLoading(true);
    try {
      const res = await fetch(`/api/startups/${id}/journey`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setJourney(data.journey);
      } else {
        setJourney('Failed to load journey. Please try again later.');
      }
    } catch (e) {
      setJourney('Failed to load journey. Please try again later.');
    } finally {
      setJourneyLoading(false);
    }
  };

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
          
          if (matchedStartup?.name) {
            await fetchDiligenceReports(matchedStartup.name);
          }
        }
      } catch (e) {
        console.error('Failed to load startup details:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center space-y-6">
        <h2 className="text-2xl font-outfit font-bold tracking-tight text-black">STARTUP NOT FOUND</h2>
        <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto">
          The requested startup profile could not be found or has not been initialized yet.
        </p>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1A1A1A] text-white text-sm font-semibold rounded-lg hover:bg-[#333] transition-colors shadow-sm select-none">
          <ArrowLeft size={14} />
          <span>Go to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 text-text-primary animate-fade-in">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-1.5 font-outfit font-bold text-xs uppercase text-text-muted hover:text-text-primary mb-6 transition-colors select-none">
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      {/* Hero Banner */}
      <div className="os-card bg-[#1A1A1A] text-white p-8 sm:p-12 mb-8 relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-card opacity-5 rounded-full transform translate-x-20 -translate-y-20"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent text-[#111] rounded-xl flex items-center justify-center font-outfit font-black text-2xl uppercase">
              {startup.name ? startup.name.slice(0, 2).toUpperCase() : 'ST'}
            </div>
            <div>
              <span className="inline-flex items-center gap-1 bg-accent/10 border border-[#C8E64A]/30 text-white px-2.5 py-0.5 font-outfit font-bold text-[9px] uppercase tracking-wider mb-2.5 rounded-md">
                {startup.stage} Stage
              </span>
              <h1 className="text-3xl sm:text-5xl font-outfit font-black tracking-tight text-white uppercase leading-none">
                {startup.name}
              </h1>
              <p className="font-inter text-text-muted mt-2 flex items-center gap-1.5 text-xs sm:text-sm font-light">
                <MapPin size={14} /> {startup.geography} • {startup.industry}
              </p>
            </div>
          </div>

          {/* Startup Score Badge */}
          <div className="bg-accent text-[#111] px-6 py-3.5 font-outfit font-black text-center transform rotate-1 rounded-xl shadow-sm">
            <span className="block text-[10px] tracking-wider uppercase opacity-75">STARTUP SCORE</span>
            <span className="text-3xl font-black">{startup.score || 10}</span>
          </div>
        </div>
      </div>

      {/* Interactive Startup Graph Visualization */}
      <div className="os-card bg-card p-6 mb-8">
        <h3 className="text-base font-outfit font-bold uppercase mb-4 flex items-center gap-1.5 text-black">
          <Layers size={16} className="text-text-muted" /> Unified Startup Graph Nodes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 relative flex justify-center bg-canvas border border-light rounded-xl py-4 select-none">
            <svg className="w-full max-w-[500px] h-[300px]" viewBox="0 0 500 300">
              {/* Connection lines */}
              <line x1="250" y1="150" x2="110" y2="60" stroke="#E5E7EB" strokeWidth="1.5" />
              <line x1="250" y1="150" x2="390" y2="60" stroke="#E5E7EB" strokeWidth="1.5" />
              <line x1="250" y1="150" x2="80" y2="200" stroke="#E5E7EB" strokeWidth="1.5" />
              <line x1="250" y1="150" x2="420" y2="200" stroke="#E5E7EB" strokeWidth="1.5" />
              <line x1="250" y1="150" x2="250" y2="250" stroke="#E5E7EB" strokeWidth="1.5" />

              {/* Orbit 1: Decisions */}
              <g 
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode({
                  title: 'Strategic Memory',
                  count: `${decisions.length} Decisions`,
                  desc: 'Core business hypotheses, pivots, and consensus outcomes recorded in persistent founder memory.'
                })}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <circle cx="110" cy="60" r="28" fill="#FAF9F6" stroke="#E5E7EB" strokeWidth="1" />
                <text x="110" y="64" textAnchor="middle" className="font-outfit font-bold text-[9px] fill-gray-700 uppercase">Memory</text>
              </g>

              {/* Orbit 2: Milestones */}
              <g 
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode({
                  title: 'Execution Timeline',
                  count: `${timeline.length} Milestones`,
                  desc: 'Consensus-verified progression and proof-of-work events logged by the startup.'
                })}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <circle cx="390" cy="60" r="28" fill="#FAF9F6" stroke="#E5E7EB" strokeWidth="1" />
                <text x="390" y="64" textAnchor="middle" className="font-outfit font-bold text-[9px] fill-gray-700 uppercase">Timeline</text>
              </g>

              {/* Orbit 3: Data Room / Briefs */}
              <g 
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode({
                  title: 'Pitch Briefs & Data Rooms',
                  count: `${briefs.length} Briefs`,
                  desc: 'Shareable strategic briefs, investment materials, and whitelisted pitch documents.'
                })}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <circle cx="80" cy="200" r="28" fill="#FAF9F6" stroke="#E5E7EB" strokeWidth="1" />
                <text x="80" y="204" textAnchor="middle" className="font-outfit font-bold text-[9px] fill-gray-700 uppercase">Briefs</text>
              </g>

              {/* Orbit 4: Signals */}
              <g 
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode({
                  title: 'Market Intelligence Signals',
                  count: `${signals.length} Signals`,
                  desc: 'Relevant external market warnings, regulatory updates, and funding rounds linked to sector focus.'
                })}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <circle cx="420" cy="200" r="28" fill="#FAF9F6" stroke="#E5E7EB" strokeWidth="1" />
                <text x="420" y="204" textAnchor="middle" className="font-outfit font-bold text-[9px] fill-gray-700 uppercase">Signals</text>
              </g>

              {/* Orbit 5: Opportunities */}
              <g 
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode({
                  title: 'Ecosystem Opportunities',
                  count: `${opportunities.length} Matched`,
                  desc: 'Sector-appropriate grants, accelerator programs, and building initiatives filtered by compatibility.'
                })}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <circle cx="250" cy="250" r="28" fill="#FAF9F6" stroke="#E5E7EB" strokeWidth="1" />
                <text x="250" y="254" textAnchor="middle" className="font-outfit font-bold text-[9px] fill-gray-700 uppercase">Partners</text>
              </g>

              {/* Central Core: Startup */}
              <circle cx="250" cy="150" r="35" fill="#C8E64A" stroke="#B5D235" strokeWidth="2" />
              <text x="250" y="154" textAnchor="middle" className="font-outfit font-black text-[10px] fill-black uppercase tracking-wider">CORE GRAPH</text>
            </svg>
          </div>

          <div className="bg-canvas border border-light rounded-xl p-5 h-[300px] flex flex-col justify-center select-none text-left">
            {hoveredNode ? (
              <div className="animate-slide-up">
                <span className="font-outfit font-bold text-[9px] uppercase text-text-muted block mb-1 tracking-wider">NODE DETAIL</span>
                <h4 className="font-outfit font-bold text-base text-black mb-1">{hoveredNode.title}</h4>
                <span className="inline-block bg-black text-[#C8E64A] px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider mb-3">
                  {hoveredNode.count}
                </span>
                <p className="text-xs text-text-secondary leading-relaxed font-light">
                  {hoveredNode.desc}
                </p>
              </div>
            ) : (
              <div className="text-center p-4">
                <span className="font-outfit font-bold text-xs text-text-muted uppercase block mb-1.5 tracking-wider">INTERACTIVE EXPLORER</span>
                <p className="text-xs text-text-muted leading-relaxed">
                  Hover over any node in the graph layout to view its structural relation and dynamic context within the startup operating system.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column (Main details) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pitch */}
          <div className="os-card bg-card p-6">
            <h3 className="text-sm font-outfit font-bold uppercase mb-3 text-text-muted tracking-wider">Core Proposition</h3>
            <p className="font-inter text-text-primary text-sm sm:text-base leading-relaxed font-light">
              {startup.pitch || 'No pitch added yet.'}
            </p>
          </div>

          {/* Problem & Solution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="border border-red-200 bg-red-50/50 p-6 rounded-xl text-left flex flex-col">
              <h3 className="text-xs font-bold uppercase mb-2.5 text-red-600 flex items-center gap-1.5">
                <Target size={14} /> Problem Statement
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed font-inter font-light">
                {startup.problem || 'No problem definition set yet.'}
              </p>
            </div>

            <div className="border border-green-200 bg-green-50/50 p-6 rounded-xl text-left flex flex-col">
              <h3 className="text-xs font-bold uppercase mb-2.5 text-green-700 flex items-center gap-1.5">
                <Trophy size={14} /> Product Solution
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed font-inter font-light">
                {startup.solution || 'No solution description set yet.'}
              </p>
            </div>
          </div>

          {/* Founder Journey / Intelligence Brief */}
          <div className="os-card bg-card p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h3 className="text-sm font-outfit font-bold uppercase text-text-muted tracking-wider flex items-center gap-2">
                <Sparkles size={14} className="text-[#C8E64A]" /> AI Journey Brief
              </h3>
              {!journey && !journeyLoading && (
                <button onClick={fetchJourney} className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#333] transition-colors">
                  Generate Journey
                </button>
              )}
            </div>
            
            <div className="text-sm text-text-primary leading-relaxed font-inter font-light whitespace-pre-wrap">
              {journeyLoading ? (
                <div className="flex items-center gap-2 text-text-secondary animate-pulse">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Generating intelligence brief...
                </div>
              ) : journey ? (
                <div>{renderJourney(journey)}</div>
              ) : (
                <p className="text-text-muted italic">Click generate to analyze this startup's founding story, growth, and market potential.</p>
              )}
            </div>
          </div>

          {/* VC & Institution Due Diligence Audit Section */}
          {user && (founderProfile?.role === 'vc' || founderProfile?.role === 'institution' || founderProfile?.role === 'government') && (
            <div className="os-card bg-canvas border border-light p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-250/60 pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="text-black" size={16} />
                  <h3 className="text-sm font-outfit font-bold uppercase text-black tracking-wider">
                    Due Diligence & Ecosystem Audit
                  </h3>
                </div>
                {diligenceReports.length === 0 && !diligenceLoading && (
                  <button 
                    onClick={handleGenerateDiligence}
                    className="flex items-center gap-1 bg-black text-white hover:bg-[#333] px-3.5 py-1.5 rounded-lg text-xs font-outfit font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Activity size={12} /> Run Due Diligence
                  </button>
                )}
              </div>

              {diligenceLoading ? (
                <div className="py-8 text-center flex flex-col items-center justify-center space-y-2">
                  <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-outfit font-bold uppercase tracking-wider text-gray-550">AI Orchestrator Compiling Brief...</p>
                </div>
              ) : diligenceReports.length > 0 ? (
                <div className="space-y-3">
                  <div className="bg-accent/10 border border-[#C8E64A]/30 p-4 rounded-xl flex items-start gap-3">
                    <FileText className="text-black shrink-0 mt-0.5" size={16} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <h4 className="font-outfit font-bold text-xs uppercase text-black truncate">
                          {diligenceReports[0].title}
                        </h4>
                        <Link 
                          to={`/intelligence/${diligenceReports[0].id}`}
                          className="text-[10px] font-bold text-black uppercase hover:underline flex items-center gap-1 shrink-0"
                        >
                          Open Report <ExternalLink size={10} />
                        </Link>
                      </div>
                      <p className="text-xs text-gray-555 mt-1.5 leading-relaxed font-inter font-light">
                        {diligenceReports[0].executiveSnapshot || 'Comprehensive strategic diligence analysis completed for this startup.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-text-muted italic text-xs leading-relaxed">
                  No diligence audits generated for this startup yet. Click "Run Due Diligence" to trigger AI analysis.
                </div>
              )}
            </div>
          )}

          {/* Tech Stack & Team */}
          <div className="os-card bg-card p-6">
            <h3 className="text-sm font-outfit font-bold uppercase mb-4 text-text-muted tracking-wider">Stack & Team Structure</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-inter">
              <div>
                <span className="block text-[9px] font-bold uppercase text-text-muted mb-1 tracking-wide">TECH STACK</span>
                <span className="font-semibold text-text-primary bg-canvas border border-light px-3 py-2 rounded-lg block">
                  {startup.techStack || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-bold uppercase text-text-muted mb-1 tracking-wide">TEAM & TALENT</span>
                <span className="font-semibold text-text-primary bg-canvas border border-light px-3 py-2 rounded-lg block">
                  {startup.teamStatus || 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          {/* Verified Execution Timeline */}
          <div className="os-card bg-card p-6">
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100 select-none">
              <h3 className="text-sm font-outfit font-bold uppercase text-text-muted tracking-wider">
                Execution Timeline
              </h3>
              <span className="bg-green-50 border border-green-200 text-green-700 px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide">
                Consensus Audited
              </span>
            </div>

            {timeline.length === 0 ? (
              <div className="border border-dashed border-DEFAULT p-8 text-center text-text-secondary font-outfit font-bold text-xs uppercase rounded-xl">
                No verified milestones or logs recorded yet.
              </div>
            ) : (
              <div className="relative border-l border-light ml-4 pl-6 space-y-6">
                {timeline.map((event) => (
                  <div key={event.id} className="relative text-left">
                    <div className="absolute -left-[33px] top-0 w-5 h-5 bg-card border border-light text-black flex items-center justify-center font-bold text-xs rounded-full shadow-sm">
                      {event.eventType === 'profile_update' ? '✎' : event.eventType === 'score_increase' ? '↑' : event.eventType === 'decision_logged' ? '✓' : '★'}
                    </div>

                    <div className="border border-light p-4 bg-canvas rounded-xl text-black">
                      <div className="flex justify-between items-start flex-wrap gap-1.5 mb-2 select-none">
                        <span className="text-[9px] font-bold uppercase font-mono px-2 py-0.5 border border-light bg-card rounded-md">
                          {event.eventType}
                        </span>
                        <span className="text-[10px] font-mono text-text-muted font-semibold">
                          {new Date(event.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs text-text-primary leading-relaxed font-light font-inter">
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Strategic Decisions */}
          <div className="os-card bg-card p-6">
            <h3 className="text-sm font-outfit font-bold uppercase mb-5 text-text-muted tracking-wider">
              Strategic Decisions
            </h3>
            {decisions.length === 0 ? (
              <p className="text-xs font-semibold text-text-muted font-outfit uppercase tracking-wider select-none">
                No decisions logged yet.
              </p>
            ) : (
              <div className="space-y-4">
                {decisions.map((decision) => (
                  <div key={decision.id} className="border border-light p-4 bg-canvas rounded-xl">
                    <div className="flex justify-between items-start mb-2.5">
                      <h4 className="font-outfit font-bold text-sm text-black uppercase">{decision.title}</h4>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${decision.status === 'completed' || decision.status === 'validated' ? 'bg-green-50 border border-green-200 text-green-700' : decision.status === 'invalidated' ? 'bg-red-50 border border-red-200 text-red-600' : 'bg-amber-50 border border-amber-200 text-amber-600'}`}>
                        {decision.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-text-secondary mb-2 leading-relaxed font-inter font-light">
                      <span className="text-black uppercase text-[9px] font-bold block mb-1 tracking-wide">Context</span>
                      {decision.context}
                    </p>
                    {decision.outcome && (
                      <p className="text-xs font-semibold text-text-secondary leading-relaxed font-inter font-light border-t border-light/50 pt-2.5 mt-2.5">
                        <span className="text-black uppercase text-[9px] font-bold block mb-1 tracking-wide">Outcome</span>
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
          <div className="os-card bg-card p-6">
            <h3 className="text-xs font-bold uppercase mb-4 text-text-muted tracking-wide select-none">Startup Vitals</h3>
            <div className="space-y-3.5 text-xs font-inter select-none">
              <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                <span className="font-bold uppercase text-text-muted text-[10px]">Stage</span>
                <span className="font-bold text-black uppercase bg-accent/20 border border-[#C8E64A]/30 px-2 py-0.5 rounded text-[9px]">
                  {startup.stage}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                <span className="font-bold uppercase text-text-muted text-[10px]">Geography Focus</span>
                <span className="font-semibold text-text-primary">{startup.geography}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                <span className="font-bold uppercase text-text-muted text-[10px]">Sector</span>
                <span className="font-semibold text-text-primary">{startup.industry}</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="font-bold uppercase text-text-muted text-[10px]">Current Goal</span>
                <span className="font-bold text-black text-right">{startup.needs || 'No active goal'}</span>
              </div>
            </div>
          </div>

          <div className="os-card bg-canvas border border-light p-5 select-none text-center rounded-xl">
            <Award size={24} className="mx-auto mb-2 text-black" />
            <h4 className="font-outfit font-bold text-xs uppercase tracking-wide">VERIFIED BUILDER</h4>
            <p className="text-[10px] font-semibold text-text-secondary mt-1.5 leading-relaxed">
              This startup is verified by the Stratify consensus layer for active build updates and validation checkpoints.
            </p>
          </div>

          {/* Active Briefs */}
          {briefs.length > 0 && (
            <div className="os-card bg-card p-4">
              <h3 className="text-[10px] font-bold uppercase mb-3 text-text-muted border-b border-gray-100 pb-2 select-none">Active Briefs</h3>
              <div className="space-y-3">
                {briefs.map(brief => (
                  <Link key={brief.id} to={`/brief/${brief.id}`} className="block border border-light hover:border-DEFAULT p-3.5 rounded-xl transition-all">
                    <span className="text-[10px] uppercase font-bold text-black block mb-1">{brief.name} Brief</span>
                    <span className="text-[10px] font-bold text-text-primary flex items-center gap-1 uppercase hover:underline">
                      View Data Room <ExternalLink size={10} />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Relevant Signals */}
          {signals.length > 0 && (
            <div className="os-card bg-card p-4">
              <h3 className="text-[10px] font-bold uppercase mb-3 text-text-muted border-b border-gray-100 pb-2 select-none">Ecosystem Signals</h3>
              <div className="space-y-3">
                {signals.slice(0, 3).map(signal => (
                  <div key={signal.id} className="border border-light p-3 bg-canvas rounded-xl">
                    <p className="text-xs font-semibold text-text-primary leading-relaxed font-light">{signal.title}</p>
                    <span className={`text-[8px] font-bold uppercase px-2 py-0.5 mt-2 inline-block rounded-md border ${signal.sentiment === 'positive' ? 'bg-green-50 border-green-200 text-green-700' : signal.sentiment === 'negative' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
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

function renderJourney(content) {
  return String(content || '')
    .split('\n')
    .filter(Boolean)
    .map((line, index) => {
      const segments = [];
      const pattern = /\*\*(.*?)\*\*/g;
      let lastIndex = 0;
      let match;

      while ((match = pattern.exec(line)) !== null) {
        if (match.index > lastIndex) {
          segments.push(line.slice(lastIndex, match.index));
        }
        segments.push(
          <strong key={`strong-${index}-${match.index}`} className="font-semibold text-text-primary">
            {match[1]}
          </strong>
        );
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < line.length) {
        segments.push(line.slice(lastIndex));
      }

      return (
        <p key={`journey-line-${index}`} className="mb-3 last:mb-0">
          {segments.length > 0 ? segments : line}
        </p>
      );
    });
}
