import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Play, Sparkles, AlertCircle, Compass, HelpCircle, 
  MapPin, Check, RefreshCw, FileText, ArrowRight,
  ClipboardList, BookOpen, ExternalLink, Trophy, Users, Zap, Award, Target
} from 'lucide-react';
import confetti from 'canvas-confetti';
import BentoCard from '../components/BentoCard';
import AgentConsole from '../components/AgentConsole';

export default function Dashboard({ founderProfile, currentReport, setCurrentReport, user, openAuthModal }) {
  // Common states
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState([]);
  const [matchingPartners, setMatchingPartners] = useState([]);

  // Founder Workspace states
  const [query, setQuery] = useState('');
  const [reportType, setReportType] = useState('idea_validation');
  const [focusArea, setFocusArea] = useState('market');
  const [customSources, setCustomSources] = useState('');
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [partialReport, setPartialReport] = useState(null);
  const [govSchemes, setGovSchemes] = useState([]);
  const [myStartup, setMyStartup] = useState(null);

  // Negotiation states
  const [negotiatingPartner, setNegotiatingPartner] = useState(null);
  const [investmentVal, setInvestmentVal] = useState(250000);
  const [preVal, setPreVal] = useState(2500000);
  const [optionPool, setOptionPool] = useState(10);
  const [syndicateActive, setSyndicateActive] = useState(false);
  const [dealClosed, setDealClosed] = useState(false);

  // Fit Radar states
  const [radarPartner, setRadarPartner] = useState(null);
  const [radarVisible, setRadarVisible] = useState(false);

  // VC & Angel Workspace states
  const [trendingStartups, setTrendingStartups] = useState([]);
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [vouchedStartups, setVouchedStartups] = useState([]);

  // Suggested questions based on primary goal
  const suggestedQueries = {
    'validate idea': [
      'How to validate customer willingness to pay for premium cold brew?',
      'What are the primary reasons competitors fail in the organic beverage wedge?'
    ],
    'gtm strategy': [
      'What are the most cost-effective offline GTM channels in Bengaluru?',
      'How should we position cold brew subscriptions to tech office parks?'
    ],
    'prepare investor memo': [
      'What TAM/SAM/SOM metrics are most credible for specialty beverage plays?',
      'How to articulate the defensibility wedge for a local D2C operation?'
    ],
    'competitor analysis': [
      'Analyze pricing structures of leading organic cold brew brands.',
      'What customer gaps exist in Starbucks and Third Wave local menus?'
    ]
  };

  const getSuggestions = () => {
    if (!founderProfile) return [];
    return suggestedQueries[founderProfile.currentGoal] || suggestedQueries['validate idea'];
  };

  // Fetch role-specific data
  useEffect(() => {
    if (!founderProfile) return;

    const fetchRoleData = async () => {
      setLoading(true);
      try {
        // Fetch matches/connections (for all roles)
        const connRes = await fetch('/api/matches');
        if (connRes.ok) {
          const connData = await connRes.json();
          setConnections(connData.matches || []);
        }

        // Fetch matching partners (for all roles)
        const partnersRes = await fetch('/api/matching/partners');
        if (partnersRes.ok) {
          const partnersData = await partnersRes.json();
          setMatchingPartners(partnersData.partners || []);
        }

        if (founderProfile.role === 'founder') {
          // Fetch my startup
          const myStartupRes = await fetch('/api/startups/my');
          if (myStartupRes.ok) {
            const msData = await myStartupRes.json();
            setMyStartup(msData.startup || null);
          }

          // Fetch government schemes
          const schemesRes = await fetch('/api/gov-schemes');
          if (schemesRes.ok) {
            const scData = await schemesRes.json();
            setGovSchemes(scData.schemes || []);
          }
        } else {
          // Fetch trending startups for VC / Angel
          const trendingRes = await fetch('/api/startups/trending');
          if (trendingRes.ok) {
            const trData = await trendingRes.json();
            setTrendingStartups(trData.startups || []);
          }
        }
      } catch (err) {
        console.error('Failed to load role-specific dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoleData();
  }, [founderProfile, currentReport]);

  const handleCheckboxToggle = async (sectionKey, itemIndex, completed) => {
    if (!currentReport) return;

    const updatedReport = JSON.parse(JSON.stringify(currentReport));
    const actionPlan = updatedReport.sections.actionPlan;
    if (actionPlan && actionPlan[sectionKey] && actionPlan[sectionKey][itemIndex]) {
      actionPlan[sectionKey][itemIndex].completed = completed;
    }

    try {
      setCurrentReport(updatedReport);
      await fetch(`/api/reports/${currentReport.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sections: {
            actionPlan: updatedReport.sections.actionPlan
          }
        })
      });
    } catch (error) {
      console.error('Error updating checkbox state:', error);
    }
  };

  const triggerSimulation = async (e) => {
    if (e) e.preventDefault();
    if (!founderProfile) return;
    if (!query.trim()) return;

    setIsRunning(true);
    setLogs([]);
    setStreamError(null);
    setCurrentReport(null);
    setPartialReport(null);

    const sourcesArray = customSources
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.startsWith('http'));

    try {
      const response = await fetch('/api/analyze/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          founderProfile: founderProfile,
          sources: sourcesArray,
          reportOptions: {
            reportType: reportType,
            focusArea: focusArea,
            timeHorizon: '30_days',
            tone: 'strategic'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status} failed`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.substring(6).trim();
          } else if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.substring(5).trim();
            try {
              const parsed = JSON.parse(dataStr);
              
              if (parsed.error) {
                setStreamError(parsed.error.message || 'Simulation encountered an error');
              } else if (currentEvent === 'log') {
                setLogs((prev) => [...prev, parsed.message]);
              } else if (currentEvent === 'partial') {
                setPartialReport(parsed.report);
              } else if (currentEvent === 'complete') {
                setCurrentReport(parsed.report);
                setPartialReport(null);
                setIsRunning(false);
                confetti({
                  particleCount: 120,
                  spread: 60,
                  origin: { y: 0.6 },
                  colors: ['#A3E635', '#000000', '#F8F7F4']
                });
              }
            } catch (err) {
              console.warn('Failed to parse SSE line data:', err);
            }
          }
        }
      }
    } catch (err) {
      setStreamError(err.message || 'Failed to connect to agent network stream.');
      setIsRunning(false);
    }
  };

  const handleConnectRequest = async (partnerId) => {
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ receiverId: partnerId, status: 'pending' })
      });
      if (res.ok) {
        // Refresh matching list/connections
        const connRes = await fetch('/api/matches');
        if (connRes.ok) {
          const connData = await connRes.json();
          setConnections(connData.matches || []);
        }
        confetti({
          particleCount: 30,
          spread: 30,
          colors: ['#A3E635', '#000000']
        });
      }
    } catch (e) {
      console.error('Failed to request connection:', e);
    }
  };

  const handleCastVouch = async (startupId) => {
    try {
      const res = await fetch(`/api/startups/${startupId}/vouch`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        if (selectedStartup && selectedStartup.id === startupId) {
          setSelectedStartup({ ...selectedStartup, score: data.startup.score });
        }
        setVouchedStartups(prev => [...prev, startupId]);
        confetti({
          particleCount: 80,
          spread: 60,
          colors: ['#A3E635', '#FCD34D', '#EF4444']
        });
      }
    } catch (e) {
      console.error('Failed to cast advisory vouch:', e);
    }
  };

  const renderFitRadarModal = () => {
    if (!radarVisible || !radarPartner) return null;

    const isVcOrAngel = radarPartner.role === 'vc' || radarPartner.role === 'angel';
    
    const matchesSector = isVcOrAngel
      ? (founderProfile.industry && radarPartner.focusSectors?.toLowerCase().includes(founderProfile.industry.toLowerCase())) || 
        (radarPartner.industry && founderProfile.industry?.toLowerCase().includes(radarPartner.industry.toLowerCase()))
      : (founderProfile.industry && radarPartner.industry?.toLowerCase().includes(founderProfile.industry.toLowerCase()));
    
    const sectorScore = matchesSector ? 96 : 74;

    const matchesGeo = isVcOrAngel
      ? (founderProfile.geography && radarPartner.geographyFocus?.toLowerCase().includes(founderProfile.geography.toLowerCase())) ||
        (radarPartner.geography && founderProfile.geography?.toLowerCase().includes(radarPartner.geography.toLowerCase()))
      : (founderProfile.geography && radarPartner.geography?.toLowerCase().includes(founderProfile.geography.toLowerCase()));
      
    const geoScore = matchesGeo ? 90 : 70;
    const stageScore = 92;

    const overallScore = Math.round((sectorScore + geoScore + stageScore) / 3);

    let adviceText = "";
    if (founderProfile.role === 'founder') {
      adviceText = `This investor focuses heavily on ${radarPartner.industry || 'your sector'} plays in ${radarPartner.geography || 'your region'}. Their target ticket size matches your seed requirement. Advise scheduling a pitch brief.`;
    } else {
      adviceText = `This startup demonstrates strong execution milestones in ${radarPartner.industry || 'their sector'}. Their verified runway and score of ${radarPartner.score || 10} qualify them for your pipeline.`;
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
        <div className="neo-card bg-white border-[4px] border-black p-6 max-w-md w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative text-black">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#3B82F6] opacity-10 rounded-full transform translate-x-8 -translate-y-8 pointer-events-none"></div>
          
          <div className="flex justify-between items-start border-b-[3px] border-black pb-3 mb-4">
            <div>
              <span className="inline-block bg-[#EF4444] text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border border-black mb-1">
                AI MATCH FIT RADAR
              </span>
              <h3 className="font-outfit font-black text-sm uppercase text-black">
                FIT DEEP-DIVE: {radarPartner.name}
              </h3>
            </div>
            <button 
              onClick={() => { setRadarVisible(false); setRadarPartner(null); }}
              className="font-outfit font-black text-sm hover:text-red-500 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 border-2 border-black p-4 bg-[#F8F7F4]">
              <div className="bg-[#A3E635] text-black border-2 border-black px-4 py-3 font-outfit font-black text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xl">
                {overallScore}%
              </div>
              <div>
                <span className="block text-[8px] font-black uppercase text-gray-500">OVERALL ALIGNMENT MATCH</span>
                <span className="text-xs font-bold text-gray-700 leading-tight block mt-0.5">
                  {overallScore >= 85 ? 'Strong Thesis Match' : 'Moderate Thesis Match'}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs font-bold text-gray-700">
              <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                <span>Sector Alignment:</span>
                <span className="font-mono text-black bg-[#FCD34D] px-1.5 py-0.5 border border-black text-[10px]">{sectorScore}%</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                <span>Geographic Fit:</span>
                <span className="font-mono text-black bg-[#3B82F6]/20 px-1.5 py-0.5 border border-black text-[10px]">{geoScore}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Investment Stage Fit:</span>
                <span className="font-mono text-black bg-[#A3E635]/20 px-1.5 py-0.5 border border-black text-[10px]">{stageScore}%</span>
              </div>
            </div>

            <div className="border-2 border-black p-3.5 bg-yellow-50 text-left">
              <span className="text-[9px] font-black uppercase text-gray-400 block mb-1">AI STRATEGIST INSIGHT</span>
              <p className="text-[11px] font-bold text-gray-600 leading-relaxed font-inter">
                {adviceText}
              </p>
            </div>
          </div>

          <button
            onClick={() => { setRadarVisible(false); setRadarPartner(null); }}
            className="w-full mt-5 py-2.5 bg-black text-white border-2 border-black font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer text-center"
          >
            Acknowledge Radar Scan
          </button>
        </div>
      </div>
    );
  };

  const activeReport = partialReport || currentReport;

  // Unconfigured state redirect
  if (!founderProfile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="neo-card p-12 text-center bg-white space-y-4 border-[3px] border-black shadow-neo-button select-none">
          <HelpCircle size={48} className="mx-auto text-[#FB923C] animate-bounce" />
          <h2 className="text-xl sm:text-2xl font-black uppercase">No Active Profile</h2>
          <p className="font-outfit font-semibold text-gray-600">
            Please define your profile constraints and vertical focus first to boot the strategy operating system.
          </p>
          <Link to="/onboarding" className="neo-btn-primary inline-flex mt-2">
            <span>Launch Onboarding</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // 1. FOUNDER DASHBOARD VIEW
  if (founderProfile.role === 'founder') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Startup Header Info */}
        <div className="neo-card bg-white text-black p-8 mb-8 border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] select-none relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Decorative floating red circle shape inside the header */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#EF4444] border-[4px] border-black rounded-full opacity-80 pointer-events-none hidden md:block"></div>
          
          <div className="relative z-10 space-y-2">
            <span className="inline-block bg-[#A3E635] text-black px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border-2 border-black">
              {myStartup?.stage || founderProfile.startupStage} stage
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-black">
              {myStartup?.name || founderProfile.name || 'My Startup'}
            </h2>
            <p className="font-outfit font-bold text-gray-600 flex items-center gap-1.5 text-xs sm:text-sm">
              <MapPin size={14} className="text-[#3B82F6]" /> {myStartup?.geography || founderProfile.geography} • {myStartup?.industry || founderProfile.industry}
            </p>
          </div>
          
          <div className="relative z-10 flex items-center gap-4 bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-wrap sm:flex-nowrap">
            <div className="text-center border-r-[3px] border-black pr-5">
              <span className="block text-[9px] font-black uppercase text-gray-500">STARTUP SCORE</span>
              <span className="text-3xl font-black text-[#EF4444]">{myStartup?.score || 10}</span>
            </div>
            <div className="text-center pl-1.5">
              <span className="block text-[9px] font-black uppercase text-gray-500">ACTIVE GOAL</span>
              <span className="text-xs font-black uppercase text-[#3B82F6]">{founderProfile.currentGoal}</span>
            </div>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Column: Strategy builder and simulation */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            
            {/* Strategy Input Card */}
            <BentoCard title="AI Strategy Workspace" badge="Multi-Agent Analysis" badgeColor="bg-[#A3E635]">
              <form onSubmit={triggerSimulation} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-1.5">
                    What strategy or target wedge do you want to validate?
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g. Validate willingness to pay for premium organic cold brew delivery..."
                      disabled={isRunning}
                      required
                      className="neo-input flex-1"
                    />
                    <button
                      type="submit"
                      disabled={isRunning || !query.trim()}
                      className="neo-btn-primary px-6 shrink-0 py-2.5 font-outfit text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isRunning ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                      <span>TRIGGER AGENT SIMULATION</span>
                    </button>
                  </div>
                </div>

                {/* Preset Suggestions */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-black text-gray-500 uppercase shrink-0">Suggestions:</span>
                  {getSuggestions().map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQuery(s)}
                      disabled={isRunning}
                      className="text-[10px] font-bold text-[#A3E635] hover:text-black border border-[#A3E635] hover:bg-[#A3E635] px-2 py-0.5 transition-colors cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Strategy parameters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
                  <div>
                    <label className="block text-[8px] font-black uppercase text-gray-400 mb-1">Report Output Type</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      disabled={isRunning}
                      className="w-full text-xs font-bold border-2 border-black p-1.5 bg-white focus:outline-none"
                    >
                      <option value="idea_validation">Idea Validation</option>
                      <option value="gtm_strategy">GTM Direction</option>
                      <option value="competitor_brief">Competitor Wedge</option>
                      <option value="investor_memo">Investor Strategy Memo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[8px] font-black uppercase text-gray-400 mb-1">Analysis Focus</label>
                    <select
                      value={focusArea}
                      onChange={(e) => setFocusArea(e.target.value)}
                      disabled={isRunning}
                      className="w-full text-xs font-bold border-2 border-black p-1.5 bg-white focus:outline-none"
                    >
                      <option value="market">Market & Customer</option>
                      <option value="risks">Risks & Feasibility</option>
                      <option value="differentiation">Competitor Wedge</option>
                      <option value="economics">Unit Economics</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[8px] font-black uppercase text-gray-400 mb-1">Custom sources URLs (comma separated)</label>
                    <input
                      type="text"
                      value={customSources}
                      onChange={(e) => setCustomSources(e.target.value)}
                      disabled={isRunning}
                      placeholder="e.g. https://example.com/data"
                      className="w-full text-xs font-bold border-2 border-black p-1.5 bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </form>
            </BentoCard>

            {/* Agent console logs */}
            {(isRunning || logs.length > 0 || streamError) && (
              <BentoCard title="Agent Logs Console" badge="Live Stream" badgeColor="bg-[#FB923C]">
                <AgentConsole logs={logs} isRunning={isRunning} error={streamError} />
              </BentoCard>
            )}

            {/* Strategic Report View */}
            {activeReport && (
              <BentoCard title="Active Strategy Report" badge={currentReport ? "Analysis Done" : "Drafting..."} badgeColor="bg-[#C084FC]">
                <div className="space-y-4">
                  <div className="border-[3px] border-black p-5 bg-[#F8F7F4] select-text">
                    <h3 className="font-outfit font-black text-sm uppercase text-black border-b-2 border-black pb-2 mb-3">
                      {activeReport.title || 'Compiling Strategic Brief...'}
                    </h3>
                    <div className="text-xs font-bold text-gray-700 space-y-4 leading-relaxed font-inter">
                      {activeReport.markdown ? (
                        <div className="whitespace-pre-wrap">{activeReport.markdown}</div>
                      ) : (
                        <div className="text-gray-400 italic">Assembling framework and ground rules...</div>
                      )}
                    </div>
                  </div>

                  {currentReport && (
                    <Link
                      to={`/reports/${currentReport.id}`}
                      className="neo-btn-primary py-2.5 w-full text-center mt-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <FileText size={14} />
                      <span>VIEW FULL STRATEGIC BRIEF</span>
                    </Link>
                  )}
                </div>
              </BentoCard>
            )}

            {/* Action Sprint Checklist */}
            {activeReport && activeReport.sections?.actionPlan && (
              <BentoCard title="Action Plan & Sprint Task Tracker" badge="Interactive Roadmap" badgeColor="bg-[#A3E635]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {['sevenDaySprint', 'thirtyDayRoadmap', 'validationChecklist'].map((sectionKey) => {
                    const title = sectionKey === 'sevenDaySprint' ? '7-Day Sprint' : sectionKey === 'thirtyDayRoadmap' ? '30-Day Roadmap' : 'Risk Validation';
                    const items = activeReport.sections.actionPlan[sectionKey] || [];
                    const completedCount = items.filter(i => i.completed).length;

                    return (
                      <div key={sectionKey} className="border-[3px] border-black p-4 bg-[#F8F7F4] space-y-3">
                        <h3 className="font-outfit font-black text-sm uppercase border-b-2 border-black pb-1.5 flex items-center justify-between">
                          <span>{title}</span>
                          <span className="text-[10px] bg-white border border-black px-1.5 text-black font-mono">
                            {completedCount} / {items.length}
                          </span>
                        </h3>
                        <div className="space-y-2 max-h-[260px] overflow-y-auto">
                          {items.map((item, idx) => (
                            <div 
                              key={idx}
                              onClick={() => currentReport && handleCheckboxToggle(sectionKey, idx, !item.completed)}
                              className="flex items-start gap-2.5 p-2 bg-white border-2 border-black hover:bg-white/80 cursor-pointer select-none transition-all"
                            >
                              <button type="button" className="shrink-0 text-black mt-0.5">
                                {item.completed ? (
                                  <div className="bg-[#A3E635] border-2 border-black p-0.5"><Check size={12} strokeWidth={3} /></div>
                                ) : (
                                  <div className="w-4 h-4 border-2 border-black bg-white"></div>
                                )}
                              </button>
                              <span className={`text-xs font-semibold font-inter ${item.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                {item.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </BentoCard>
            )}

          </div>

          {/* Right Column: Schemes and Matching */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            
            {/* Matched Government Schemes */}
            <BentoCard title="Matched Subsidies & Schemes" badge="Government Incentives" badgeColor="bg-[#FB923C]">
              {govSchemes.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs font-bold font-outfit uppercase">
                  No matching subsidies found for your region.
                </div>
              ) : (
                <div className="space-y-3">
                  {govSchemes.map((scheme) => (
                    <div key={scheme.id} className="border-2 border-black p-3 bg-white hover:-translate-y-0.5 transition-transform">
                      <h4 className="font-outfit font-black text-xs uppercase text-black">{scheme.name}</h4>
                      <p className="text-[11px] text-gray-600 font-bold mt-1 leading-relaxed">{scheme.description}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                        <span className="text-[10px] font-black uppercase text-[#A3E635]">{scheme.incentive}</span>
                        <a href={scheme.link} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase underline hover:text-[#C084FC]">
                          Apply schemes
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </BentoCard>

            {/* Term Sheet Diluter Negotiator Panel */}
            {negotiatingPartner && (
              <BentoCard title="Term Sheet Diluter" badge="DEAL ROOM" badgeColor="bg-[#EF4444]">
                {dealClosed ? (
                  <div className="border-2 border-black p-5 bg-white text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-[#A3E635] border-2 border-black flex items-center justify-center mx-auto text-black font-black">✓</div>
                    <h4 className="font-outfit font-black text-xs uppercase">Deal Closed!</h4>
                    <p className="text-[10px] text-gray-500 font-bold leading-tight">
                      Cap Table registered. Term Sheet successfully closed with {negotiatingPartner.name}.
                    </p>
                    <button
                      onClick={() => setNegotiatingPartner(null)}
                      className="w-full py-1.5 bg-white border-2 border-black text-black font-black text-[10px] uppercase cursor-pointer hover:bg-gray-50"
                    >
                      Exit Negotiator
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border-2 border-black p-3 bg-gray-50 text-left">
                      <span className="text-[9px] font-black uppercase text-gray-400 block">Investor</span>
                      <h4 className="font-outfit font-black text-xs uppercase text-black">{negotiatingPartner.name}</h4>
                      <span className="text-[9px] bg-[#3B82F6] text-white border border-black px-1.5 py-0.5 mt-1 inline-block uppercase font-black">
                        {negotiatingPartner.role}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-0.5">
                          <label className="text-[9px] font-black uppercase text-gray-500">Investment Amount</label>
                          <span className="text-[10px] font-bold font-mono border border-black bg-white px-1">
                            ${(investmentVal / 1000).toFixed(0)}k
                          </span>
                        </div>
                        <input
                          type="range"
                          min="50000"
                          max="2000000"
                          step="25000"
                          value={investmentVal}
                          onChange={(e) => setInvestmentVal(Number(e.target.value))}
                          className="w-full accent-black cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-0.5">
                          <label className="text-[9px] font-black uppercase text-gray-500">Pre-Money Valuation</label>
                          <span className="text-[10px] font-bold font-mono border border-black bg-white px-1">
                            ${(preVal / 1000000).toFixed(2)}M
                          </span>
                        </div>
                        <input
                          type="range"
                          min="500000"
                          max="10000000"
                          step="100000"
                          value={preVal}
                          onChange={(e) => setPreVal(Number(e.target.value))}
                          className="w-full accent-black cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-0.5">
                          <label className="text-[9px] font-black uppercase text-gray-500">Option Pool Size</label>
                          <span className="text-[10px] font-bold font-mono border border-black bg-white px-1">
                            {optionPool}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="25"
                          step="1"
                          value={optionPool}
                          onChange={(e) => setOptionPool(Number(e.target.value))}
                          className="w-full accent-black cursor-pointer"
                        />
                      </div>

                      {negotiatingPartner.role === 'angel' && (
                        <div className="border-2 border-black p-2 bg-white select-none">
                          <label className="flex items-center gap-2 cursor-pointer font-black text-[9px] uppercase">
                            <input
                              type="checkbox"
                              checked={syndicateActive}
                              onChange={(e) => setSyndicateActive(e.target.checked)}
                              className="accent-black cursor-pointer w-3.5 h-3.5 border border-black"
                            />
                            <span>Launch Angel Syndicate Pool</span>
                          </label>
                          {syndicateActive && (
                            <span className="block text-[8px] font-bold text-gray-450 mt-0.5">
                              Aggregating 3 additional angels (+35% syndicate volume)
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-2 border-black p-3 bg-white space-y-1 select-text text-left">
                      <span className="text-[9px] font-black uppercase text-gray-400 block mb-1">Cap Table Projection</span>
                      {(() => {
                        const effectiveInvestment = syndicateActive ? investmentVal * 1.35 : investmentVal;
                        const postMoney = preVal + effectiveInvestment;
                        const investorShare = (effectiveInvestment / postMoney) * 100;
                        const founderShare = 100 - investorShare - optionPool;
                        return (
                          <div className="space-y-0.5 text-[11px] font-bold text-gray-700">
                            <div className="flex justify-between border-b border-gray-100 pb-0.5">
                              <span>Post-Money Valuation:</span>
                              <span className="font-mono text-black">${(postMoney / 1000000).toFixed(2)}M</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-0.5">
                              <span>Founders Ownership:</span>
                              <span className="font-mono text-[#3B82F6]">{founderShare.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-0.5">
                              <span>Investor Ownership:</span>
                              <span className="font-mono text-[#EF4444]">{investorShare.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Option Pool:</span>
                              <span className="font-mono text-gray-600">{optionPool}%</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setDealClosed(true);
                          confetti({
                            particleCount: 100,
                            spread: 60,
                            colors: ['#EF4444', '#FCD34D', '#3B82F6']
                          });
                        }}
                        className="flex-1 py-2 bg-[#A3E635] text-black border-2 border-black font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer text-center"
                      >
                        Accept & Close Deal
                      </button>
                      <button
                        onClick={() => setNegotiatingPartner(null)}
                        className="py-2 px-3 border-2 border-black font-black text-[10px] uppercase bg-white hover:bg-gray-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </BentoCard>
            )}

            {/* Investor Matching */}
            <BentoCard title="AI Investor Matches" badge="VC & Angel Matching" badgeColor="bg-[#C084FC]">
              {matchingPartners.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs font-bold font-outfit uppercase">
                  Searching for investors...
                </div>
              ) : (
                <div className="space-y-3">
                  {matchingPartners.map((partner) => {
                    const isPending = connections.some(c => c.receiverId === partner.id && c.status === 'pending');
                    const isConnected = connections.some(c => c.receiverId === partner.id && c.status === 'accepted');

                    return (
                      <div key={partner.id} className="border-2 border-black p-3 bg-white flex justify-between items-center">
                        <div>
                          <h4 className="font-outfit font-black text-xs uppercase text-black">{partner.name}</h4>
                          <span className="text-[10px] font-black uppercase text-gray-400">{partner.role}</span>
                        </div>
                        {isConnected ? (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                setRadarPartner(partner);
                                setRadarVisible(true);
                              }}
                              className="px-2 py-1.5 border-2 border-black font-outfit font-black text-[9px] uppercase cursor-pointer bg-[#FCD34D] text-black hover:bg-yellow-400 transition-all"
                            >
                              Radar Fit
                            </button>
                            <button
                              onClick={() => {
                                setNegotiatingPartner(partner);
                                setDealClosed(false);
                              }}
                              className="px-3 py-1.5 border-2 border-black font-outfit font-black text-[10px] uppercase cursor-pointer bg-[#3B82F6] text-white hover:bg-blue-600 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                            >
                              Negotiate Terms
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                setRadarPartner(partner);
                                setRadarVisible(true);
                              }}
                              className="px-2 py-1.5 border-2 border-black font-outfit font-black text-[9px] uppercase cursor-pointer bg-[#FCD34D] text-black hover:bg-yellow-400 transition-all"
                            >
                              Radar Fit
                            </button>
                            <button
                              onClick={() => !isPending && handleConnectRequest(partner.id)}
                              disabled={isPending}
                              className={`px-3 py-1.5 border-2 border-black font-outfit font-black text-[10px] uppercase cursor-pointer ${
                                isPending ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50'
                              }`}
                            >
                              {isPending ? 'Requested' : 'Pitch Startup'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </BentoCard>

          </div>

        </div>

        {renderFitRadarModal()}
      </div>
    );
  }

  // 2. VC DASHBOARD VIEW
  if (founderProfile.role === 'vc') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* VC Dashboard Header */}
        <div className="neo-card bg-white text-black p-8 mb-8 border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] select-none relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Decorative floating blue shape inside header */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#3B82F6] border-[4px] border-black transform rotate-12 opacity-80 pointer-events-none hidden md:block"></div>
          
          <div className="relative z-10 space-y-2">
            <span className="inline-block bg-[#C084FC] text-black px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border-2 border-black">
              VC Deal Flow Console
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-black">
              {founderProfile.name}
            </h2>
            <p className="font-outfit font-bold text-gray-600 flex items-center gap-1.5 text-xs sm:text-sm">
              <MapPin size={14} className="text-[#3B82F6]" /> {founderProfile.geography} Focus • Preferred Stages: {founderProfile.investmentStage}
            </p>
          </div>
          
          <div className="relative z-10 flex items-center gap-4 bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-wrap sm:flex-nowrap">
            <div className="text-center border-r-[3px] border-black pr-5">
              <span className="block text-[9px] font-black uppercase text-gray-500">INVESTMENT BUDGET</span>
              <span className="text-lg font-black text-[#EF4444]">{founderProfile.ticketSize || 'Unlimited'}</span>
            </div>
            <div className="text-center pl-1.5">
              <span className="block text-[9px] font-black uppercase text-gray-500">WATCHED PIPELINE</span>
              <span className="text-sm font-black text-[#3B82F6]">{trendingStartups.length} Startups</span>
            </div>
          </div>
        </div>

        {/* VC Deal Flow Grid */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Column: Trending Deal Flow */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <BentoCard title="Trending Startups Pipeline" badge="Ranked by Startup Score" badgeColor="bg-[#A3E635]">
              {trendingStartups.length === 0 ? (
                <div className="text-center py-12 text-gray-500 font-outfit font-black text-xs uppercase">
                  No active startups registered on the platform yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {trendingStartups.map((startup) => (
                    <div 
                      key={startup.id} 
                      onClick={() => setSelectedStartup(startup)}
                      className={`border-[3px] border-black p-5 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:translate-y-[-2px] transition-transform ${
                        selectedStartup?.id === startup.id ? 'bg-gray-50 shadow-neo-button border-[#C084FC]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-black text-[#A3E635] border-2 border-black flex items-center justify-center font-black text-lg uppercase">
                          {startup.name.slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-outfit font-black text-base uppercase text-black flex items-center gap-2">
                            {startup.name}
                            <span className="text-[9px] bg-[#A3E635] text-black border border-black px-1.5 py-0.5">
                              Stage: {startup.stage}
                            </span>
                          </h4>
                          <p className="text-xs font-bold text-gray-500 mt-1 max-w-md line-clamp-1">{startup.pitch || startup.solution}</p>
                          <span className="text-[10px] font-black uppercase text-gray-400 block mt-1">{startup.geography} • {startup.industry}</span>
                        </div>
                      </div>

                      <div className="bg-gray-100 border border-black px-3 py-2 text-center font-outfit shrink-0">
                        <span className="block text-[8px] font-black text-gray-500 uppercase">SCORE</span>
                        <span className="text-lg font-black">{startup.score || 10}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </BentoCard>
          </div>

          {/* Right Column: Selected Startup details */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <BentoCard title="Deal Intelligence" badge="Startup Details" badgeColor="bg-[#C084FC]">
              {selectedStartup ? (
                <div className="space-y-4">
                  <div className="border-2 border-black p-4 bg-[#F8F7F4]">
                    <h3 className="font-outfit font-black text-lg uppercase text-black">{selectedStartup.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 uppercase font-bold">{selectedStartup.industry} • {selectedStartup.geography}</p>
                    
                    <div className="mt-4 space-y-2 text-xs font-bold font-inter">
                      <div>
                        <span className="block text-[9px] font-black text-gray-400 uppercase">PROBLEM</span>
                        <p className="text-gray-700">{selectedStartup.problem || 'No description'}</p>
                      </div>
                      <div className="mt-2">
                        <span className="block text-[9px] font-black text-gray-400 uppercase">SOLUTION</span>
                        <p className="text-gray-700">{selectedStartup.solution || 'No description'}</p>
                      </div>
                      <div className="mt-2">
                        <span className="block text-[9px] font-black text-gray-400 uppercase">TEAM STATUS</span>
                        <p className="text-gray-700">{selectedStartup.teamStatus || selectedStartup.team_status || 'Not specified'}</p>
                      </div>
                      <div className="mt-2">
                        <span className="block text-[9px] font-black text-gray-400 uppercase">CURRENT NEEDS</span>
                        <p className="text-[#C084FC]">{selectedStartup.needs || 'No requirements'}</p>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/reports/${selectedStartup.id}`}
                    className="neo-btn-primary py-2.5 w-full text-center text-xs font-black uppercase flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={14} />
                    <span>Run AI Due Diligence Report</span>
                  </Link>

                  <button
                    onClick={() => {
                      setRadarPartner(selectedStartup);
                      setRadarVisible(true);
                    }}
                    className="w-full py-2.5 bg-[#FCD34D] text-black border-2 border-black font-outfit font-black text-xs uppercase hover:bg-yellow-400 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Inspect AI Fit Radar</span>
                  </button>

                  <button
                    onClick={() => handleConnectRequest(selectedStartup.ownerId || selectedStartup.owner_id)}
                    className="w-full py-2.5 bg-black text-white border-2 border-black font-outfit font-black text-xs uppercase hover:bg-gray-900 cursor-pointer"
                  >
                    Schedule Deal Call
                  </button>

                  <button
                    onClick={() => handleCastVouch(selectedStartup.id)}
                    disabled={vouchedStartups.includes(selectedStartup.id)}
                    className={`w-full py-2.5 border-2 border-black font-outfit font-black text-xs uppercase cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                      vouchedStartups.includes(selectedStartup.id)
                        ? 'bg-gray-105 text-gray-400 border-gray-350 shadow-none pointer-events-none'
                        : 'bg-[#A3E635] text-black hover:bg-[#92cf2e]'
                    }`}
                  >
                    {vouchedStartups.includes(selectedStartup.id)
                      ? 'Vouched (Consensus Updated)'
                      : 'Cast Advisory Vouch (+25 Score)'}
                  </button>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 select-none font-outfit font-black text-xs uppercase">
                  Select a startup from the deal flow list to view details
                </div>
              )}
            </BentoCard>
          </div>

        </div>

        {renderFitRadarModal()}
      </div>
    );
  }

  // 3. ANGEL INVESTOR DASHBOARD VIEW
  if (founderProfile.role === 'angel') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Angel Dashboard Header */}
        <div className="neo-card bg-white text-black p-8 mb-8 border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] select-none relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Decorative floating yellow shape inside header */}
          <svg className="absolute -top-6 -right-6 w-28 h-28 opacity-80 pointer-events-none hidden md:block" viewBox="0 0 100 100">
            <polygon points="50,10 90,90 10,90" stroke="black" strokeWidth="6" fill="#FCD34D" />
          </svg>
          
          <div className="relative z-10 space-y-2">
            <span className="inline-block bg-[#FB923C] text-black px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border-2 border-black">
              Angel Investor Network
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-black">
              {founderProfile.name}
            </h2>
            <p className="font-outfit font-bold text-gray-600 flex items-center gap-1.5 text-xs sm:text-sm">
              <MapPin size={14} className="text-[#3B82F6]" /> {founderProfile.geography} • Angel Backer
            </p>
          </div>
          
          <div className="relative z-10 flex items-center gap-4 bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-wrap sm:flex-nowrap">
            <div className="text-center border-r-[3px] border-black pr-5">
              <span className="block text-[9px] font-black uppercase text-gray-500">ANNUAL BUDGET</span>
              <span className="text-lg font-black text-[#EF4444]">{founderProfile.budget || 'Flexible'}</span>
            </div>
            <div className="text-center pl-1.5">
              <span className="block text-[9px] font-black uppercase text-gray-500">SECTORS SUPPORTED</span>
              <span className="text-xs font-black uppercase text-[#3B82F6]">{founderProfile.industry || 'All'}</span>
            </div>
          </div>
        </div>

        {/* Angel Grid */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Column: Local / Pre-seed Opportunities */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <BentoCard title="Discover Early Opportunities" badge="Pre-seed & Idea Stage" badgeColor="bg-[#FB923C]">
              {trendingStartups.length === 0 ? (
                <div className="text-center py-12 text-gray-500 font-outfit font-black text-xs uppercase">
                  No active startups found.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {trendingStartups.map((startup) => (
                    <div 
                      key={startup.id} 
                      onClick={() => setSelectedStartup(startup)}
                      className={`border-2 border-black p-4 bg-white flex flex-col justify-between cursor-pointer hover:-translate-y-0.5 transition-transform ${
                        selectedStartup?.id === startup.id ? 'border-[#FB923C] bg-gray-50' : ''
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="text-[9px] bg-black text-[#A3E635] px-1.5 py-0.5 font-bold font-mono">
                            Score: {startup.score || 10}
                          </span>
                          <span className="text-[9px] font-black uppercase text-gray-400">{startup.stage}</span>
                        </div>
                        <h4 className="font-outfit font-black text-sm uppercase text-black">{startup.name}</h4>
                        <p className="text-[11px] font-semibold text-gray-600 line-clamp-3 mt-2">{startup.pitch || startup.solution}</p>
                      </div>

                      <div className="border-t border-gray-100 pt-3 mt-4 flex items-center justify-between text-[10px] font-black uppercase text-gray-400">
                        <span>{startup.geography}</span>
                        <span className="text-[#FB923C]">Match: 95%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </BentoCard>
          </div>

          {/* Right Column: Due diligence & connect */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <BentoCard title="Angel Discovery Desk" badge="Thesis Alignment" badgeColor="bg-[#A3E635]">
              {selectedStartup ? (
                <div className="space-y-4">
                  <div className="border-2 border-black p-4 bg-[#F8F7F4]">
                    <h3 className="font-outfit font-black text-md uppercase text-black">{selectedStartup.name}</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-bold">{selectedStartup.geography} • {selectedStartup.industry}</p>
                    
                    <div className="mt-4 space-y-2 text-xs font-bold font-inter">
                      <div>
                        <span className="block text-[8px] font-black text-gray-400 uppercase">PROBLEM</span>
                        <p className="text-gray-700">{selectedStartup.problem || 'No description'}</p>
                      </div>
                      <div className="mt-2">
                        <span className="block text-[8px] font-black text-gray-400 uppercase">SOLUTION</span>
                        <p className="text-gray-700">{selectedStartup.solution || 'No description'}</p>
                      </div>
                      <div className="mt-2">
                        <span className="block text-[8px] font-black text-gray-400 uppercase">LOOKING FOR</span>
                        <p className="text-[#FB923C]">{selectedStartup.needs || 'No requirements specified'}</p>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/reports/${selectedStartup.id}`}
                    className="neo-btn-primary py-2.5 w-full text-center text-xs font-black uppercase flex items-center justify-center gap-1.5"
                  >
                    <Trophy size={14} />
                    <span>View AI Feasibility report</span>
                  </Link>

                  <button
                    onClick={() => {
                      setRadarPartner(selectedStartup);
                      setRadarVisible(true);
                    }}
                    className="w-full py-2.5 bg-[#FCD34D] text-black border-2 border-black font-outfit font-black text-xs uppercase hover:bg-yellow-400 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Inspect AI Fit Radar</span>
                  </button>

                  <button
                    onClick={() => handleConnectRequest(selectedStartup.ownerId || selectedStartup.owner_id)}
                    className="w-full py-2.5 bg-black text-white border-2 border-black font-outfit font-black text-xs uppercase hover:bg-gray-900 cursor-pointer"
                  >
                    Back Startup (Invest)
                  </button>

                  <button
                    onClick={() => handleCastVouch(selectedStartup.id)}
                    disabled={vouchedStartups.includes(selectedStartup.id)}
                    className={`w-full py-2.5 border-2 border-black font-outfit font-black text-xs uppercase cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                      vouchedStartups.includes(selectedStartup.id)
                        ? 'bg-gray-105 text-gray-400 border-gray-350 shadow-none pointer-events-none'
                        : 'bg-[#A3E635] text-black hover:bg-[#92cf2e]'
                    }`}
                  >
                    {vouchedStartups.includes(selectedStartup.id)
                      ? 'Vouched (Consensus Updated)'
                      : 'Cast Advisory Vouch (+25 Score)'}
                  </button>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 select-none font-outfit font-black text-xs uppercase">
                  Select an early stage startup to review thesis match
                </div>
              )}
            </BentoCard>
          </div>

        </div>

        {renderFitRadarModal()}
      </div>
    );
  }

  return null;
}
