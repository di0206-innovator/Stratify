import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Play, Sparkles, AlertCircle, Compass, HelpCircle, 
  MapPin, CheckSquare, Square, Check, RefreshCw, FileText, ArrowRight,
  ClipboardList, BookOpen, ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import BentoCard from '../components/BentoCard';
import AgentConsole from '../components/AgentConsole';

export default function Dashboard({ founderProfile, currentReport, setCurrentReport, user, openAuthModal }) {
  const [query, setQuery] = useState('');
  const [reportType, setReportType] = useState('idea_validation');
  const [focusArea, setFocusArea] = useState('market');
  const [customSources, setCustomSources] = useState('');
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [partialReport, setPartialReport] = useState(null);

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

  const handleCheckboxToggle = async (sectionKey, itemIndex, completed) => {
    if (!currentReport) return;

    // Deep clone the report
    const updatedReport = JSON.parse(JSON.stringify(currentReport));
    const actionPlan = updatedReport.sections.actionPlan;
    if (actionPlan && actionPlan[sectionKey] && actionPlan[sectionKey][itemIndex]) {
      actionPlan[sectionKey][itemIndex].completed = completed;
    }

    try {
      // Update locally first for responsiveness
      setCurrentReport(updatedReport);

      // Perform backend update. Wait, endpoints might require auth.
      // We will perform a PATCH request to /api/reports/:id
      const response = await fetch(`/api/reports/${currentReport.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          // Note: Cookie-based auth will automatically pass credentials
        },
        body: JSON.stringify({
          sections: {
            actionPlan: updatedReport.sections.actionPlan
          }
        })
      });

      if (!response.ok) {
        console.warn('Failed to persist action plan item state to backend, auth might be required.');
      }
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
        buffer = lines.pop() || ''; // Keep the remainder

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.substring(6).trim();
          } else if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.substring(5).trim();
            try {
              const parsed = JSON.parse(dataStr);
              
              // Handle error from SSE
              if (parsed.error) {
                setStreamError(parsed.error.message || 'Simulation encountered an error');
                setIsRunning(false);
                return;
              }

              // Route event payloads based on event type
              if (currentEvent === 'log') {
                setLogs((prev) => [...prev, parsed]);
              } else if (currentEvent === 'sources') {
                setPartialReport((prev) => ({
                  ...(prev || {}),
                  sources: parsed
                }));
              } else if (currentEvent === 'analysis') {
                setPartialReport((prev) => ({
                  ...(prev || {}),
                  sections: {
                    ...(prev?.sections || {}),
                    marketSignals: parsed.marketSignals || [],
                    opportunityThesis: parsed.opportunityGaps?.map(g => `- ${g}`).join('\n') || '',
                    risks: parsed.risks || [],
                    assumptions: parsed.assumptions || []
                  }
                }));
              } else if (currentEvent === 'strategy') {
                setPartialReport((prev) => ({
                  ...(prev || {}),
                  title: `${reportType.replace(/_/g, ' ').toUpperCase()} STRATEGY FOR ${founderProfile.product.slice(0, 30)}`,
                  sections: {
                    ...(prev?.sections || {}),
                    executiveSnapshot: parsed.thesis,
                    opportunityThesis: parsed.positioning || prev?.sections?.opportunityThesis,
                    recommendations: parsed.recommendations || [],
                    trendAnalysis: parsed.trendAnalysis,
                    competitivePositioning: parsed.competitivePositioning,
                    targetSegment: parsed.targetSegment,
                    channelStrategy: parsed.channelStrategy,
                    marketOpportunity: parsed.marketOpportunity,
                    tractionEvidence: parsed.tractionEvidence,
                    askAndUse: parsed.askAndUse,
                    threatCategories: parsed.threatCategories,
                    mitigationPlan: parsed.mitigationPlan
                  }
                }));
              } else if (currentEvent === 'executionPlan') {
                setPartialReport((prev) => ({
                  ...(prev || {}),
                  sections: {
                    ...(prev?.sections || {}),
                    actionPlan: {
                      sevenDaySprint: parsed.sevenDaySprint?.map((t, idx) => ({ id: `sprint-${idx}`, text: typeof t === 'string' ? t : t.text, completed: !!t.completed })),
                      thirtyDayRoadmap: parsed.thirtyDayRoadmap?.map((t, idx) => ({ id: `roadmap-${idx}`, text: typeof t === 'string' ? t : t.text, completed: !!t.completed })),
                      validationChecklist: parsed.validationChecklist?.map((t, idx) => ({ id: `checklist-${idx}`, text: typeof t === 'string' ? t : t.text, completed: !!t.completed })),
                      nextAssets: parsed.nextAssets?.map((t, idx) => ({ id: `asset-${idx}`, text: typeof t === 'string' ? t : t.text, completed: !!t.completed }))
                    }
                  }
                }));
              } else if (currentEvent === 'result') {
                setCurrentReport(parsed);
                setPartialReport(null);
                // Trigger celebratory confetti
                confetti({
                  particleCount: 120,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors: ['#A3E635', '#C084FC', '#FB923C']
                });
              } else {
                // Fallback for legacy format or unmapped events
                if (parsed.agent && parsed.message) {
                  setLogs((prev) => [...prev, parsed]);
                } else if (parsed.id && parsed.sections) {
                  setCurrentReport(parsed);
                  setPartialReport(null);
                }
              }
            } catch (e) {
              console.error('Failed to parse SSE payload:', dataStr, e);
            }
          }
        }
      }
    } catch (err) {
      setStreamError(err.message || 'Failed to start simulation.');
      setLogs((prev) => [
        ...prev,
        {
          id: 'error',
          agent: 'ERROR MONITOR',
          message: `Simulation terminated: ${err.message}`,
          at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const activeReport = partialReport || currentReport;

  const renderTextWithCitations = (text, sources = []) => {
    if (!text) return null;
    const regex = /(?:\[Source\s+(\d+)\]|\[(\d+)\])/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      const sourceNum = parseInt(match[1] || match[2], 10);
      
      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }
      
      const source = sources[sourceNum - 1];
      if (source) {
        parts.push(
          <a
            key={matchIndex}
            href={source.url || '#'}
            target={source.url ? "_blank" : undefined}
            rel={source.url ? "noopener noreferrer" : undefined}
            title={`${source.title}: ${source.summary}`}
            className="inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 text-[9px] font-black font-mono bg-[#A3E635] text-black border border-black hover:bg-black hover:text-white transition-colors cursor-pointer rounded-sm align-middle leading-none"
            onClick={(e) => {
              if (!source.url) {
                e.preventDefault();
                const citationEl = document.getElementById(`source-card-${sourceNum - 1}`);
                if (citationEl) {
                  citationEl.scrollIntoView({ behavior: 'smooth' });
                  citationEl.classList.add('ring-4', 'ring-[#C084FC]');
                  setTimeout(() => {
                    citationEl.classList.remove('ring-4', 'ring-[#C084FC]');
                  }, 2000);
                }
              }
            }}
          >
            {sourceNum}
          </a>
        );
      } else {
        parts.push(match[0]);
      }
      
      lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-[3px] border-black p-6 shadow-neo-hard select-none">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            Founder Strategy OS
          </h1>
          <p className="font-outfit font-bold text-gray-700 mt-1">
            Analyze market gaps, track competitor moves, and schedule near-term sprint tasks.
          </p>
        </div>
        {!founderProfile && (
          <Link
            to="/onboarding"
            className="neo-btn-primary self-start md:self-auto px-6 py-2.5"
          >
            <span>Configure Founder Profile</span>
            <ArrowRight size={16} />
          </Link>
        )}
      </div>

      {founderProfile ? (
        <div className="grid grid-cols-12 gap-6">
          {/* Bento Left: Profile & Launcher */}
          <div className="col-span-12 lg:col-span-5 space-y-6 flex flex-col justify-stretch">
            {/* Widget 1: Founder Profile Context */}
            <BentoCard 
              title="Active Profile Wedge" 
              badge={founderProfile.startupStage}
              badgeColor="bg-[#C084FC]"
              className="h-auto"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm font-outfit font-bold">
                  <div>
                    <span className="text-gray-500 block uppercase text-[10px] tracking-wide">Industry</span>
                    <span className="text-black uppercase break-words">{founderProfile.industry}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block uppercase text-[10px] tracking-wide">Geography</span>
                    <span className="text-black uppercase inline-flex items-center gap-1">
                      <MapPin size={12} className="text-[#FB923C]" />
                      {founderProfile.geography}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block uppercase text-[10px] tracking-wide">Founder Type</span>
                    <span className="text-black uppercase text-xs">
                      {founderProfile.founderType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block uppercase text-[10px] tracking-wide">Current Goal</span>
                    <span className="text-black uppercase text-xs">
                      {founderProfile.currentGoal}
                    </span>
                  </div>
                </div>
                
                <div className="bg-[#F8F7F4] border-2 border-black p-3 text-xs font-semibold font-inter">
                  <span className="text-gray-500 block uppercase text-[9px] font-black tracking-wider mb-1">Product Wedge</span>
                  <span className="italic text-gray-800 break-words">"{founderProfile.product}"</span>
                </div>

                <Link 
                  to="/onboarding" 
                  className="neo-btn-secondary py-2 text-xs w-full text-center"
                >
                  <RefreshCw size={12} className="animate-hover-spin" />
                  <span>Re-configure Profile</span>
                </Link>
              </div>
            </BentoCard>

            {/* Widget 2: Strategic Query Launcher */}
            <BentoCard 
              title="Simulation Launcher" 
              badge="Agent network"
              badgeColor="bg-[#A3E635]"
              className="flex-1"
            >
              <form onSubmit={triggerSimulation} className="space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-4">
                  {/* Query text input */}
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-700 mb-1.5">
                      Define Strategic Inquiry / Query
                    </label>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g. How to compete with Third Wave local cold brew prices?"
                      required
                      disabled={isRunning}
                      className="neo-input text-sm"
                    />
                  </div>

                  {/* Preset Suggestions */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-gray-400 block">Suggested Inquiries</span>
                    <div className="flex flex-col gap-1.5">
                      {getSuggestions().map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setQuery(s)}
                          disabled={isRunning}
                          className="text-left text-xs p-2 bg-[#F8F7F4] hover:bg-[#A3E635]/20 border-2 border-black border-dashed font-semibold text-gray-700 hover:text-black cursor-pointer transition-colors block truncate"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Report Type */}
                    <div>
                      <label className="block text-xs font-black uppercase text-gray-700 mb-1">Report Type</label>
                      <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        disabled={isRunning}
                        className="neo-input py-2 text-xs"
                      >
                        <option value="idea_validation">Idea Validation</option>
                        <option value="market_pulse">Market Pulse</option>
                        <option value="competitor_brief">Competitor Brief</option>
                        <option value="gtm_strategy">GTM Strategy</option>
                        <option value="investor_memo">Investor Memo</option>
                        <option value="risk_radar">Risk Radar</option>
                        <option value="execution_plan">Execution Plan</option>
                      </select>
                    </div>

                    {/* Focus Area */}
                    <div>
                      <label className="block text-xs font-black uppercase text-gray-700 mb-1">Focus Area</label>
                      <select
                        value={focusArea}
                        onChange={(e) => setFocusArea(e.target.value)}
                        disabled={isRunning}
                        className="neo-input py-2 text-xs"
                      >
                        <option value="market">Market & Feeds</option>
                        <option value="product">Product Wedge</option>
                        <option value="capital">Capital & Costs</option>
                        <option value="operations">Operations/Runway</option>
                      </select>
                    </div>
                  </div>

                  {/* Custom Sources */}
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-700 mb-1">
                      Target URLs to Rank / Ground (Optional)
                    </label>
                    <input
                      type="text"
                      value={customSources}
                      onChange={(e) => setCustomSources(e.target.value)}
                      placeholder="e.g. https://crunchbase.com, https://news.ycombinator.com"
                      disabled={isRunning}
                      className="neo-input text-xs"
                    />
                  </div>
                </div>

                {/* Auth Prompt for Anonymous User */}
                {!user && (
                  <div className="bg-[#FB923C]/10 border-2 border-black border-dashed p-3 text-xs font-semibold text-gray-800 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="shrink-0 text-[#FB923C] mt-0.5" />
                      <span>You are running in guest mode. Strategy reports generated won't be saved to your permanent library.</span>
                    </div>
                    <button
                      type="button"
                      onClick={openAuthModal}
                      className="w-full bg-white hover:bg-gray-100 border-2 border-black text-black font-black py-1.5 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all text-[10px] uppercase tracking-wide cursor-pointer"
                    >
                      Sign In / Sign Up
                    </button>
                  </div>
                )}

                {/* Error Banner */}
                {streamError && (
                  <div className="bg-[#F472B6] border-2 border-black p-3 text-xs font-bold text-black flex items-start gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{streamError}</span>
                  </div>
                )}

                {/* Trigger Button */}
                <button
                  type="submit"
                  disabled={isRunning || !query.trim()}
                  className={`w-full ${
                    isRunning ? 'bg-gray-400' : 'bg-[#A3E635]'
                  } border-[3px] border-black text-black font-black py-3 shadow-neo-button active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer uppercase text-sm mt-4 select-none`}
                >
                  <Play size={16} className={isRunning ? 'animate-spin' : ''} />
                  <span>{isRunning ? 'AGENT SIMULATION RUNNING...' : 'TRIGGER AGENT SIMULATION'}</span>
                </button>
              </form>
            </BentoCard>
          </div>

          {/* Bento Right: Terminal & Strategy Summary */}
          <div className="col-span-12 lg:col-span-7 space-y-6 flex flex-col justify-stretch">
            {/* Widget 3: Streaming Log Console */}
            <div className="flex-1">
              <AgentConsole logs={logs} isRunning={isRunning} />
            </div>

            {/* Widget 4: Strategy Thesis / Summary */}
            <BentoCard 
              title="Active Strategy Thesis" 
              badge={currentReport ? "STRATEGIST DECISION" : "COMPILING..."}
              badgeColor={currentReport ? "bg-[#F472B6]" : "bg-[#FB923C] animate-pulse"}
            >
              {activeReport ? (
                <div className="space-y-4 flex flex-col justify-between h-full">
                  <div className="space-y-2">
                    <h3 className="font-outfit font-black text-lg text-black uppercase">
                      {activeReport.title || 'Compiling strategy thesis...'}
                    </h3>
                    <div className="text-sm font-semibold font-inter text-gray-700 leading-relaxed max-h-[140px] overflow-y-auto pr-1">
                      {renderTextWithCitations(
                        activeReport.sections?.executiveSnapshot || activeReport.sections?.executiveBrief || activeReport.sections?.thesis,
                        activeReport.sources
                      ) || <div className="text-gray-400 italic">Synthesizing executive snapshot...</div>}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-[#F8F7F4] border border-black p-2.5 text-xs">
                        <span className="font-black text-gray-500 uppercase block text-[8px] mb-0.5">Positioning</span>
                        <div className="font-bold text-gray-800 line-clamp-2">
                          {renderTextWithCitations(
                            activeReport.sections?.opportunityThesis || activeReport.sections?.positioning,
                            activeReport.sources
                          ) || <span className="text-gray-400 italic font-normal">Analyzing market positioning...</span>}
                        </div>
                      </div>
                      <div className="bg-[#F8F7F4] border border-black p-2.5 text-xs">
                        <span className="font-black text-gray-500 uppercase block text-[8px] mb-0.5">Intelligence Mode</span>
                        <span className="font-bold text-gray-800 uppercase block">
                          {activeReport.intelligenceMode?.replace(/_/g, ' ') || 'LOCAL DEMO'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {currentReport ? (
                    <Link
                      to={`/reports/${currentReport.id}`}
                      className="neo-btn-primary py-2.5 w-full text-center mt-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <FileText size={14} />
                      <span>VIEW FULL STRATEGIC BRIEF ({currentReport.sources?.length || 0} SOURCES)</span>
                    </Link>
                  ) : (
                    <div className="bg-[#F8F7F4] border-2 border-black border-dashed py-2.5 text-center text-xs font-black uppercase tracking-wider text-gray-500 mt-4 select-none animate-pulse">
                      Brief Compilation In Progress...
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 text-gray-400 select-none flex-1">
                  <Compass size={40} className="mb-2 animate-bounce" />
                  <span className="font-outfit font-black uppercase text-xs tracking-wider">No active thesis compiled</span>
                  <p className="text-xs text-gray-500 max-w-xs mt-1">
                    Select a focus query and click "Trigger Agent Simulation" to compile strategy recommendations.
                  </p>
                </div>
              )}
            </BentoCard>
          </div>

          {/* Widget 5: Action Plan & Task Tracker (Full width below) */}
          {activeReport && activeReport.sections?.actionPlan && (
            <div className="col-span-12">
              <BentoCard 
                title="Action Plan & Sprint Task Tracker" 
                badge={currentReport ? "Interactive Checklist" : "Drafting Tasks..."} 
                badgeColor="bg-[#C084FC]"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 7-Day Sprint Checklist */}
                  <div className="border-[3px] border-black p-4 bg-[#F8F7F4] space-y-3">
                    <h3 className="font-outfit font-black text-sm uppercase text-[#FB923C] border-b-2 border-black pb-1.5 flex items-center justify-between">
                      <span>7-Day Validation Sprint</span>
                      <span className="text-[10px] bg-white border border-black px-1.5 text-black font-mono">
                        {activeReport.sections.actionPlan.sevenDaySprint?.filter(i => i.completed).length || 0} / {activeReport.sections.actionPlan.sevenDaySprint?.length || 0}
                      </span>
                    </h3>
                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                      {activeReport.sections.actionPlan.sevenDaySprint?.map((item, idx) => (
                        <div 
                          key={item.id || idx}
                          onClick={() => currentReport && handleCheckboxToggle('sevenDaySprint', idx, !item.completed)}
                          className={`flex items-start gap-2.5 p-2 bg-white border-2 border-black hover:bg-white/80 ${currentReport ? 'active:translate-x-[1px] active:translate-y-[1px] cursor-pointer' : 'cursor-wait'} select-none transition-all`}
                        >
                          <button type="button" className="shrink-0 text-black mt-0.5" disabled={!currentReport}>
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

                  {/* 30-Day Roadmap */}
                  <div className="border-[3px] border-black p-4 bg-[#F8F7F4] space-y-3">
                    <h3 className="font-outfit font-black text-sm uppercase text-[#C084FC] border-b-2 border-black pb-1.5 flex items-center justify-between">
                      <span>30-Day Milestone Roadmap</span>
                      <span className="text-[10px] bg-white border border-black px-1.5 text-black font-mono">
                        {activeReport.sections.actionPlan.thirtyDayRoadmap?.filter(i => i.completed).length || 0} / {activeReport.sections.actionPlan.thirtyDayRoadmap?.length || 0}
                      </span>
                    </h3>
                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                      {activeReport.sections.actionPlan.thirtyDayRoadmap?.map((item, idx) => (
                        <div 
                          key={item.id || idx}
                          onClick={() => currentReport && handleCheckboxToggle('thirtyDayRoadmap', idx, !item.completed)}
                          className={`flex items-start gap-2.5 p-2 bg-white border-2 border-black hover:bg-white/80 ${currentReport ? 'active:translate-x-[1px] active:translate-y-[1px] cursor-pointer' : 'cursor-wait'} select-none transition-all`}
                        >
                          <button type="button" className="shrink-0 text-black mt-0.5" disabled={!currentReport}>
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

                  {/* Validation Checklist */}
                  <div className="border-[3px] border-black p-4 bg-[#F8F7F4] space-y-3">
                    <h3 className="font-outfit font-black text-sm uppercase text-[#F472B6] border-b-2 border-black pb-1.5 flex items-center justify-between">
                      <span>Risk Validation Checklist</span>
                      <span className="text-[10px] bg-white border border-black px-1.5 text-black font-mono">
                        {activeReport.sections.actionPlan.validationChecklist?.filter(i => i.completed).length || 0} / {activeReport.sections.actionPlan.validationChecklist?.length || 0}
                      </span>
                    </h3>
                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                      {activeReport.sections.actionPlan.validationChecklist?.map((item, idx) => (
                        <div 
                          key={item.id || idx}
                          onClick={() => currentReport && handleCheckboxToggle('validationChecklist', idx, !item.completed)}
                          className={`flex items-start gap-2.5 p-2 bg-white border-2 border-black hover:bg-white/80 ${currentReport ? 'active:translate-x-[1px] active:translate-y-[1px] cursor-pointer' : 'cursor-wait'} select-none transition-all`}
                        >
                          <button type="button" className="shrink-0 text-black mt-0.5" disabled={!currentReport}>
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
                </div>
              </BentoCard>
            </div>
          )}

          {/* Widget 6: Verified Grounding Citations */}
          {activeReport && activeReport.sources && activeReport.sources.length > 0 && (
            <div className="col-span-12">
              <BentoCard title="Verified Grounding Citations" badge={currentReport ? "References Assembled" : "Researching..."} badgeColor="bg-[#A3E635]">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {activeReport.sources.map((source, index) => (
                    <div 
                      key={index} 
                      id={`source-card-${index}`}
                      className="border-[3px] border-black p-3.5 bg-white hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000000] transition-all duration-150 space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-black font-mono bg-[#A3E635] text-black border-2 border-black rounded-none">
                            {index + 1}
                          </span>
                          <span className="text-[10px] font-black uppercase text-gray-500 bg-[#F8F7F4] border border-black px-1.5 py-0.5 max-w-[200px] truncate">
                            {source.domain || (source.url ? new URL(source.url).hostname : 'source')}
                          </span>
                        </div>
                        <h4 className="font-outfit font-black text-xs text-black uppercase mt-2 line-clamp-1">
                          {source.title}
                        </h4>
                        <p className="text-[11px] font-semibold text-gray-600 line-clamp-2 mt-1">
                          {source.summary || source.snippet || 'Verified web reference for strategy grounding.'}
                        </p>
                      </div>
                      {source.url && (
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1 text-[10px] font-black uppercase underline text-[#C084FC] hover:text-black mt-2 self-start cursor-pointer"
                        >
                          <span>Visit Source</span>
                          <ExternalLink size={10} strokeWidth={3} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </BentoCard>
            </div>
          )}
        </div>
      ) : (
        /* Unconfigured State */
        <div className="neo-card p-12 text-center bg-white space-y-4 max-w-xl mx-auto select-none">
          <HelpCircle size={48} className="mx-auto text-[#FB923C] animate-bounce" />
          <h2 className="text-xl sm:text-2xl font-black uppercase">No Active Profile</h2>
          <p className="font-outfit font-semibold text-gray-600">
            Please define your founder constraints and sector product details first to boot the strategy operating system.
          </p>
          <Link
            to="/onboarding"
            className="neo-btn-primary inline-flex mt-2"
          >
            <span>Launch Onboarding</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
