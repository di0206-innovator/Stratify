import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, CheckCircle, ExternalLink,
  BookOpen, Trash2, ShieldAlert, Check
} from 'lucide-react';
import Toast from '../../components/Toast';
import confetti from 'canvas-confetti';
import BentoCard from '../../components/BentoCard';

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('interactive'); // 'interactive' | 'markdown'

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Strategic brief not found.');
        throw new Error(`Failed to load brief: HTTP ${res.status}`);
      }
      const data = await res.json();
      setReport(data.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const handleCheckboxToggle = async (sectionKey, itemIndex, completed) => {
    if (!report) return;

    // Clone report locally
    const updatedReport = JSON.parse(JSON.stringify(report));
    const actionPlan = updatedReport.sections.actionPlan;
    if (actionPlan && actionPlan[sectionKey] && actionPlan[sectionKey][itemIndex]) {
      actionPlan[sectionKey][itemIndex].completed = completed;
    }

    try {
      // Update local state immediately
      setReport(updatedReport);

      // Perform backend update
      const response = await fetch(`/api/reports/${id}`, {
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

      if (!response.ok) {
        console.warn('Failed to update action plan state on backend server.');
      } else {
        // Play a mini-confetti pop on task completion
        if (completed) {
          confetti({
            particleCount: 20,
            spread: 30,
            origin: { y: 0.8 },
            colors: ['#C8E64A', '#1A1A1A', '#FAF9F6']
          });
        }
      }
    } catch (err) {
      console.error('Error toggling task checkbox:', err);
    }
  };

  const handleDeleteReport = async () => {
    if (!confirm('Are you sure you want to permanently delete this strategic brief?')) return;
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        confetti({ particleCount: 50, colors: ['#C8E64A', '#1A1A1A'] });
        navigate('/intelligence');
      } else {
        setToast({ message: 'Failed to delete report.', type: 'error' });
      }
    } catch (err) {
      console.error('Failed to delete report:', err);
    }
  };

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
            className="inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 text-[9px] font-bold font-mono bg-[#C8E64A] text-black border border-[#B5D235] hover:bg-black hover:text-white transition-colors cursor-pointer rounded align-middle leading-none"
            onClick={(e) => {
              if (!source.url) {
                e.preventDefault();
                const citationEl = document.getElementById(`source-card-${sourceNum - 1}`);
                if (citationEl) {
                  citationEl.scrollIntoView({ behavior: 'smooth' });
                  citationEl.classList.add('ring-4', 'ring-[#C8E64A]');
                  setTimeout(() => {
                    citationEl.classList.remove('ring-4', 'ring-[#C8E64A]');
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

  // Helper to parse simple markdown to HTML elements safely (headings, paragraphs, lists, highlights)
  const renderSimpleMarkdown = (mdText) => {
    if (!mdText) return null;
    const lines = mdText.split('\n');
    return lines.map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={index} className="h-4"></div>;

      // Headings
      if (trimmed.startsWith('# ')) {
        return <h1 key={index} className="text-2xl md:text-3xl font-outfit font-black uppercase mt-6 mb-3 border-b border-gray-250 pb-2">{renderTextWithCitations(trimmed.substring(2), report.sources)}</h1>;
      }
      if (trimmed.startsWith('## ')) {
        return <h2 key={index} className="text-xl md:text-2xl font-outfit font-bold uppercase mt-5 mb-2.5 text-black">{renderTextWithCitations(trimmed.substring(3), report.sources)}</h2>;
      }
      if (trimmed.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-outfit font-bold uppercase mt-4 mb-2">{renderTextWithCitations(trimmed.substring(4), report.sources)}</h3>;
      }

      // Blockquotes / Warnings
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote key={index} className="border-l-4 border-gray-300 bg-[#FAF9F6] p-4 rounded-r-lg my-4 leading-relaxed font-light select-text">
            {renderTextWithCitations(trimmed.substring(2), report.sources)}
          </blockquote>
        );
      }

      // List items
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <li key={index} className="ml-6 list-disc font-semibold text-sm md:text-base text-gray-700 mb-1.5 leading-relaxed font-light">
            {renderTextWithCitations(trimmed.substring(2), report.sources)}
          </li>
        );
      }

      // Regular paragraphs
      return (
        <p key={index} className="text-sm md:text-base font-semibold font-inter text-gray-700 leading-relaxed mb-4 font-light">
          {renderTextWithCitations(trimmed, report.sources)}
        </p>
      );
    });
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-24 text-center space-y-4">
        <div className="w-10 h-10 border border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="font-outfit font-bold text-xs uppercase tracking-wider">Compiling Strategy Brief...</h2>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-600 p-8 rounded-xl text-left">
          <ShieldAlert size={36} className="mb-3 text-red-600" />
          <h2 className="text-lg font-outfit font-bold uppercase text-[#111]">Brief Unreachable</h2>
          <p className="text-xs font-semibold text-gray-500 mt-2 leading-relaxed font-inter font-light">{error || 'Brief data failed to load.'}</p>
        </div>
        <Link to="/intelligence" className="os-btn inline-flex items-center gap-2 select-none font-semibold">
          <ArrowLeft size={16} />
          <span>Back to Library</span>
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(report.generatedAt).toLocaleDateString([], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 animate-fade-in text-[#111]">
      {/* Back to Library Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 select-none">
        <Link
          to="/intelligence"
          className="os-btn px-4 py-2 text-xs font-semibold"
        >
          <ArrowLeft size={14} />
          <span>LIBRARY</span>
        </Link>
        <button
          onClick={handleDeleteReport}
          className="bg-red-50 border border-red-250 text-red-600 font-outfit font-bold px-4 py-2.5 hover:bg-red-100 transition-colors flex items-center gap-2 cursor-pointer uppercase text-xs rounded-lg"
        >
          <Trash2 size={14} />
          <span>DELETE BRIEF</span>
        </button>
      </div>

      {/* Main Grid: Detail View Left (Tabs), Tools Panel Right */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Left Column: Brief Reader */}
        <div className="col-span-12 lg:col-span-8 flex flex-col space-y-6">
          {/* Tabs header */}
          <div className="bg-[#FAF9F6] border border-gray-200 rounded-xl p-1 flex gap-2 select-none">
            <button
              onClick={() => setActiveTab('interactive')}
              className={`flex-1 py-2 text-center text-xs font-outfit font-bold uppercase rounded-lg transition-all cursor-pointer border-0 shadow-sm ${
                activeTab === 'interactive' 
                  ? 'bg-[#C8E64A] text-black font-bold' 
                  : 'bg-white text-gray-550 hover:bg-gray-50'
              }`}
            >
              <BookOpen size={14} className="inline mr-1.5" />
              <span>Interactive Strategist View</span>
            </button>
            <button
              onClick={() => setActiveTab('markdown')}
              className={`flex-1 py-2 text-center text-xs font-outfit font-bold uppercase rounded-lg transition-all cursor-pointer border-0 shadow-sm ${
                activeTab === 'markdown' 
                  ? 'bg-black text-white font-bold' 
                  : 'bg-white text-gray-550 hover:bg-gray-50'
              }`}
            >
              <FileText size={14} className="inline mr-1.5" />
              <span>Executive Memo (Raw Markdown)</span>
            </button>
          </div>

          {/* Reader Panel */}
          <div className="os-card bg-white min-h-[500px] flex-1 p-6 md:p-8">
            {activeTab === 'interactive' ? (
              /* INTERACTIVE VIEW */
              <div className="space-y-8">
                {/* Title */}
                <div className="border-b border-gray-200/60 pb-4 select-none">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#C8E64A]/25 border border-[#C8E64A]/30 text-black mb-2.5 uppercase">
                    {report.founderContext?.profile?.startupStage || 'IDEA'} WEDGE
                  </span>
                  <h1 className="text-2xl md:text-3xl font-outfit font-black uppercase leading-tight tracking-tight">
                    {report.title}
                  </h1>
                  <p className="text-xs text-gray-400 font-bold mt-1.5 uppercase font-mono">
                    ANALYZED ON {formattedDate}
                  </p>
                </div>

                {/* Thesis Section */}
                <div className="space-y-2">
                  <h2 className="text-sm font-outfit font-bold uppercase text-gray-400 tracking-wider">Executive Snapshot</h2>
                  <div className="text-sm md:text-base font-semibold font-inter text-gray-700 leading-relaxed bg-[#FAF9F6] p-5 border border-dashed border-gray-350 rounded-xl font-light">
                    {renderTextWithCitations(report.sections.executiveSnapshot || report.sections.thesis, report.sources)}
                  </div>
                </div>

                {/* Opportunity Wedge & Positioning */}
                <div className="space-y-2">
                  <h2 className="text-sm font-outfit font-bold uppercase text-gray-400 tracking-wider">Opportunity Wedge & Positioning</h2>
                  <div className="text-sm md:text-base font-semibold font-inter text-gray-700 leading-relaxed bg-white p-5 border border-gray-200 rounded-xl font-light">
                    {renderTextWithCitations(report.sections.opportunityThesis || report.sections.positioning, report.sources)}
                  </div>
                </div>

                {/* Report-Type-Specific Sections */}
                {Object.entries(report.sections).map(([key, content]) => {
                  // Skip standard sections that we handle elsewhere
                  if (['executiveSnapshot', 'thesis', 'founderContext', 'marketSignals', 'opportunityThesis', 'positioning', 'recommendations', 'risks', 'assumptions', 'actionPlan'].includes(key)) {
                    return null;
                  }
                  if (!content || typeof content !== 'string') return null;

                  const sectionLabels = {
                    trendAnalysis: 'Trend & Wave Analysis',
                    competitivePositioning: 'Competitive Defensive Wedge',
                    targetSegment: 'Initial Customer Wedge',
                    channelStrategy: 'Acquisition Channels',
                    marketOpportunity: 'TAM / Market Sizing',
                    tractionEvidence: 'Traction Benchmarks',
                    askAndUse: 'Use of Capital Strategy',
                    threatCategories: 'Threat Frameworks',
                    mitigationPlan: 'Mitigation Matrix'
                  };

                  return (
                    <div key={key} className="space-y-2">
                      <h2 className="text-sm font-outfit font-bold uppercase text-gray-400 tracking-wider">
                        {sectionLabels[key] || key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                      </h2>
                      <div className="text-sm md:text-base font-semibold font-inter text-gray-750 leading-relaxed font-light">
                        {renderTextWithCitations(content, report.sources)}
                      </div>
                    </div>
                  );
                })}

                {/* Market Signals */}
                {report.sections.marketSignals && report.sections.marketSignals.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-sm font-outfit font-bold uppercase text-gray-400 tracking-wider">Extracted Market Signals</h2>
                    <div className="space-y-3">
                      {report.sections.marketSignals.map((sig, idx) => (
                        <div key={idx} className="border border-gray-200 p-4 bg-[#FAF9F6] rounded-xl text-xs sm:text-sm font-semibold text-gray-700 flex gap-2">
                          <span className="text-black font-black font-mono shrink-0 select-none">[{idx + 1}]</span>
                          <span className="font-inter leading-relaxed font-light">{renderTextWithCitations(sig, report.sources)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {report.sections.recommendations && report.sections.recommendations.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-sm font-outfit font-bold uppercase text-gray-400 tracking-wider">Tactical Recommendations</h2>
                    <ul className="space-y-3">
                      {report.sections.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex gap-3 items-start">
                          <div className="bg-[#C8E64A] border border-[#B5D235] text-black px-2 py-0.5 rounded text-[8px] font-bold shrink-0 mt-0.5 select-none font-mono">
                            REC {idx + 1}
                          </div>
                          <span className="text-xs sm:text-sm font-semibold font-inter text-gray-600 leading-relaxed font-light">
                            {renderTextWithCitations(rec, report.sources)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risks & Assumptions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                  {/* Risks */}
                  {report.sections.risks && report.sections.risks.length > 0 && (
                    <div className="space-y-3.5">
                      <h3 className="font-outfit font-bold text-xs uppercase text-gray-400 tracking-wider border-b border-gray-100 pb-1.5 select-none">Inherent Risks</h3>
                      <ul className="space-y-2">
                        {report.sections.risks.map((risk, idx) => (
                          <li key={idx} className="text-xs font-semibold font-inter text-gray-600 leading-relaxed pl-3 border-l border-red-200 font-light">
                            {renderTextWithCitations(risk, report.sources)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Assumptions */}
                  {report.sections.assumptions && report.sections.assumptions.length > 0 && (
                    <div className="space-y-3.5">
                      <h3 className="font-outfit font-bold text-xs uppercase text-gray-400 tracking-wider border-b border-gray-100 pb-1.5 select-none">Key Assumptions</h3>
                      <ul className="space-y-2">
                        {report.sections.assumptions.map((ass, idx) => (
                          <li key={idx} className="text-xs font-semibold font-inter text-gray-600 leading-relaxed pl-3 border-l border-gray-300 font-light">
                            {renderTextWithCitations(ass, report.sources)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* RAW MARKDOWN VIEW */
              <div className="markdown-body font-inter leading-relaxed select-text space-y-4 font-light text-gray-700">
                {renderSimpleMarkdown(report.markdown)}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tools Panel (Citations & Interactive Checklist) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* Action Checklist Widget */}
          {report.sections.actionPlan && (
            <BentoCard title="Roadmap Task Tracker" badge="DB PERSISTED" badgeColor="bg-black">
              <div className="space-y-5">
                {/* 7-Day Validation */}
                <div className="space-y-2.5">
                  <h3 className="font-outfit font-bold text-xs uppercase text-black border-b border-gray-250 pb-1.5 flex justify-between items-center select-none tracking-wide">
                    <span>7-Day Sprint</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-gray-200 bg-[#FAF9F6]">
                      {report.sections.actionPlan.sevenDaySprint?.filter(i => i.completed).length || 0} / {report.sections.actionPlan.sevenDaySprint?.length || 0}
                    </span>
                  </h3>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {report.sections.actionPlan.sevenDaySprint?.map((item, idx) => (
                      <div 
                        key={item.id || idx}
                        onClick={() => handleCheckboxToggle('sevenDaySprint', idx, !item.completed)}
                        className="flex items-start gap-2.5 p-2.5 bg-white border border-gray-200 rounded-lg hover:border-black cursor-pointer select-none transition-colors"
                      >
                        <button type="button" className="shrink-0 text-black mt-0.5">
                          {item.completed ? (
                            <div className="bg-[#C8E64A] rounded flex items-center justify-center p-0.5"><Check size={10} strokeWidth={3} /></div>
                          ) : (
                            <div className="w-3.5 h-3.5 border border-gray-305 bg-white rounded"></div>
                          )}
                        </button>
                        <span className={`text-[11px] font-semibold font-inter ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 30-Day Roadmap */}
                <div className="space-y-2.5">
                  <h3 className="font-outfit font-bold text-xs uppercase text-black border-b border-gray-255 pb-1.5 flex justify-between items-center select-none tracking-wide">
                    <span>30-Day Milestones</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-gray-200 bg-[#FAF9F6]">
                      {report.sections.actionPlan.thirtyDayRoadmap?.filter(i => i.completed).length || 0} / {report.sections.actionPlan.thirtyDayRoadmap?.length || 0}
                    </span>
                  </h3>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {report.sections.actionPlan.thirtyDayRoadmap?.map((item, idx) => (
                      <div 
                        key={item.id || idx}
                        onClick={() => handleCheckboxToggle('thirtyDayRoadmap', idx, !item.completed)}
                        className="flex items-start gap-2.5 p-2.5 bg-white border border-gray-200 rounded-lg hover:border-black cursor-pointer select-none transition-colors"
                      >
                        <button type="button" className="shrink-0 text-black mt-0.5">
                          {item.completed ? (
                            <div className="bg-[#C8E64A] rounded flex items-center justify-center p-0.5"><Check size={10} strokeWidth={3} /></div>
                          ) : (
                            <div className="w-3.5 h-3.5 border border-gray-305 bg-white rounded"></div>
                          )}
                        </button>
                        <span className={`text-[11px] font-semibold font-inter ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Validation Checklist */}
                <div className="space-y-2.5">
                  <h3 className="font-outfit font-bold text-xs uppercase text-black border-b border-gray-260 pb-1.5 flex justify-between items-center select-none tracking-wide">
                    <span>Validation Checklist</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-gray-200 bg-[#FAF9F6]">
                      {report.sections.actionPlan.validationChecklist?.filter(i => i.completed).length || 0} / {report.sections.actionPlan.validationChecklist?.length || 0}
                    </span>
                  </h3>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {report.sections.actionPlan.validationChecklist?.map((item, idx) => (
                      <div 
                        key={item.id || idx}
                        onClick={() => handleCheckboxToggle('validationChecklist', idx, !item.completed)}
                        className="flex items-start gap-2.5 p-2.5 bg-white border border-gray-200 rounded-lg hover:border-black cursor-pointer select-none transition-colors"
                      >
                        <button type="button" className="shrink-0 text-black mt-0.5">
                          {item.completed ? (
                            <div className="bg-[#C8E64A] rounded flex items-center justify-center p-0.5"><Check size={10} strokeWidth={3} /></div>
                          ) : (
                            <div className="w-3.5 h-3.5 border border-gray-305 bg-white rounded"></div>
                          )}
                        </button>
                        <span className={`text-[11px] font-semibold font-inter ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </BentoCard>
          )}

          {/* Sources & Citations Widget */}
          <BentoCard title="Grounding Citations" badge="References verified" badgeColor="bg-black">
            {report.sources && report.sources.length > 0 ? (
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 select-none">
                {report.sources.map((source, index) => (
                  <div 
                    key={index} 
                    id={`source-card-${index}`}
                    className="border border-gray-200 p-4 bg-[#FAF9F6] hover:bg-white text-xs rounded-xl transition-all duration-150 text-left"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-gray-200 pb-1.5 mb-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] bg-white border border-gray-200 font-bold font-mono text-gray-500">
                        Source {index + 1}
                      </span>
                      {source.url && (
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-black hover:underline flex items-center gap-0.5 uppercase text-[9px] font-bold font-outfit"
                        >
                          <span>LINK</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                    <h4 className="font-outfit font-bold text-black uppercase text-[10px] break-words line-clamp-2 leading-snug">
                      {source.title}
                    </h4>
                    <p className="text-gray-500 mt-1 leading-relaxed line-clamp-3 font-light font-inter">
                      {source.summary || 'Verified web citation grounding claim.'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-400 text-xs italic select-none">
                No external citation sources reported. Using internal knowledge grounding only.
              </div>
            )}
          </BentoCard>
        </div>

      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
