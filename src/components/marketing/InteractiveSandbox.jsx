import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, Target, Layers, Sparkles, TrendingUp, DollarSign, Shield, 
  ArrowRight, RefreshCw, BarChart3, CheckCircle2, Zap, Brain, Radio 
} from 'lucide-react';

const DILIGENCE_PRESETS = [
  {
    name: 'NeuralSaaS AI',
    sector: 'Enterprise AI & Automation',
    stage: 'Seed ($2.5M raised)',
    score: 92,
    moat: 'High (Proprietary Synthetic Data Engine)',
    runwayMonths: 18,
    capTableRisk: 'Low (Founder retains 68%)',
    summary: 'Strong net dollar retention (134%), defensible fine-tuned model architecture, minimal key-person risk.'
  },
  {
    name: 'BioHealth Dynamics',
    sector: 'Digital Therapeutics & Biotech',
    stage: 'Series A ($8.0M raised)',
    score: 87,
    moat: 'Very High (3 Pending Patents & FDA clearance)',
    runwayMonths: 24,
    capTableRisk: 'Medium (Institutional SAFEs note pending conversion)',
    summary: 'Accelerated clinical trial execution, institutional backing from Tier-1 healthcare funds.'
  },
  {
    name: 'FinTech Nexus',
    sector: 'Cross-Border B2B Payments',
    stage: 'Pre-Seed ($800k raised)',
    score: 81,
    moat: 'Moderate (Regulatory License in 4 jurisdictions)',
    runwayMonths: 14,
    capTableRisk: 'Low (Simple cap table, 2 founders)',
    summary: 'High transaction velocity, zero customer concentration risk, strong gross margins (82%).'
  }
];

export default function InteractiveSandbox() {
  const [activeTab, setActiveTab] = useState('founder');

  // Founder Mode Sliders
  const [cashBalance, setCashBalance] = useState(500000);
  const [monthlyBurn, setMonthlyBurn] = useState(35000);
  const [raisingTarget, setRaisingTarget] = useState(1500000);
  const [targetValuation, setTargetValuation] = useState(6000000);

  // Calculated Founder Metrics
  const runwayMonths = Math.max(1, Math.round(cashBalance / Math.max(1000, monthlyBurn)));
  const postMoneyValuation = targetValuation + raisingTarget;
  const investorSharePct = ((raisingTarget / postMoneyValuation) * 100).toFixed(1);
  const founderSharePct = (100 - parseFloat(investorSharePct)).toFixed(1);

  // Investor Mode State
  const [selectedPreset, setSelectedPreset] = useState(DILIGENCE_PRESETS[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customStartupName, setCustomStartupName] = useState('');

  // Institution Mode Sliders
  const [cohortSize, setCohortSize] = useState(25);
  const [grantPool, setGrantPool] = useState(500000);

  const avgGrantPerStartup = Math.round(grantPool / Math.max(1, cohortSize));
  const estimatedJobsCreated = Math.round(cohortSize * 4.8);
  const regionalEconomicMultiplier = (grantPool * 3.4 / 1000000).toFixed(1);

  const handleSimulateAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      if (customStartupName.trim()) {
        setSelectedPreset({
          name: customStartupName,
          sector: 'Generative AI & Software',
          stage: 'Seed Round',
          score: Math.floor(Math.random() * 15) + 82,
          moat: 'High (AI Graph Memory & Proprietary Telemetry)',
          runwayMonths: Math.floor(Math.random() * 10) + 14,
          capTableRisk: 'Low Risk',
          summary: `Real-time intelligence audit generated for ${customStartupName}. High growth velocity with optimized unit economics.`
        });
      }
      setIsAnalyzing(false);
    }, 600);
  };

  return (
    <div className="w-full bg-card border border-DEFAULT rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden select-none">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 border-b border-DEFAULT pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 mb-2">
            <Zap size={13} className="text-accent" />
            <span className="text-[11px] font-black uppercase tracking-wider text-text-primary font-outfit">
              Interactive Platform Sandbox
            </span>
          </div>
          <h3 className="font-outfit font-black text-2xl sm:text-3xl text-text-primary tracking-tight">
            Experience Stratify Live in Action
          </h3>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Toggle roles below to simulate real-time AI graph intelligence, runway modeling, and diligence briefs.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 bg-canvas border border-DEFAULT rounded-2xl w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('founder')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-outfit font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'founder'
                ? 'bg-accent text-[#111] shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Building2 size={15} /> Founder OS
          </button>

          <button
            onClick={() => setActiveTab('investor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-outfit font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'investor'
                ? 'bg-accent text-[#111] shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Target size={15} /> Investor OS
          </button>

          <button
            onClick={() => setActiveTab('institution')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-outfit font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'institution'
                ? 'bg-accent text-[#111] shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Layers size={15} /> Institution OS
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: Founder Mode — Live Runway & Cap Table Simulator
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'founder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Controls Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-canvas border border-DEFAULT rounded-2xl p-5 space-y-5">
              <h4 className="font-outfit font-black text-sm uppercase tracking-wider text-text-primary flex items-center gap-2">
                <DollarSign size={16} className="text-accent" />
                Live Financial Controls
              </h4>

              {/* Slider 1: Cash Balance */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5 font-outfit font-bold">
                  <span className="text-text-muted">Current Cash Balance</span>
                  <span className="text-accent text-sm">${(cashBalance / 1000).toLocaleString()}k</span>
                </div>
                <input
                  type="range"
                  min={50000}
                  max={2000000}
                  step={25000}
                  value={cashBalance}
                  onChange={(e) => setCashBalance(Number(e.target.value))}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>

              {/* Slider 2: Monthly Burn */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5 font-outfit font-bold">
                  <span className="text-text-muted">Monthly Burn Rate</span>
                  <span className="text-red-400 text-sm">${(monthlyBurn / 1000).toLocaleString()}k / mo</span>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={150000}
                  step={5000}
                  value={monthlyBurn}
                  onChange={(e) => setMonthlyBurn(Number(e.target.value))}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>

              {/* Slider 3: Raising Target */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5 font-outfit font-bold">
                  <span className="text-text-muted">Planned Raise Amount</span>
                  <span className="text-blue-400 text-sm">${(raisingTarget / 1000000).toFixed(2)}M</span>
                </div>
                <input
                  type="range"
                  min={250000}
                  max={5000000}
                  step={250000}
                  value={raisingTarget}
                  onChange={(e) => setRaisingTarget(Number(e.target.value))}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>

              {/* Slider 4: Pre-Money Valuation */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5 font-outfit font-bold">
                  <span className="text-text-muted">Pre-Money Valuation</span>
                  <span className="text-text-primary text-sm">${(targetValuation / 1000000).toFixed(1)}M</span>
                </div>
                <input
                  type="range"
                  min={1000000}
                  max={20000000}
                  step={500000}
                  value={targetValuation}
                  onChange={(e) => setTargetValuation(Number(e.target.value))}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Results Display Column */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            <div className="bg-surface-dark text-white rounded-2xl p-6 border border-white/10 space-y-6 shadow-inner">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-xs font-black uppercase tracking-wider text-gray-400 font-outfit">
                  Stratify Real-Time Graph Output
                </span>
                <span className="px-2.5 py-0.5 bg-accent text-[#111] text-[9px] font-black uppercase rounded tracking-wider font-outfit">
                  Live Calculation
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <span className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-1 font-outfit">
                    Calculated Runway
                  </span>
                  <span className={`text-2xl font-black font-outfit ${runwayMonths < 6 ? 'text-red-400' : 'text-accent'}`}>
                    {runwayMonths} Months
                  </span>
                  <span className="block text-[10px] text-gray-400 mt-1">
                    {runwayMonths < 6 ? '⚠️ Urgent fundraising needed' : '✓ Healthy operational runway'}
                  </span>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <span className="block text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-1 font-outfit">
                    Post-Money Valuation
                  </span>
                  <span className="text-2xl font-black text-white font-outfit">
                    ${(postMoneyValuation / 1000000).toFixed(2)}M
                  </span>
                  <span className="block text-[10px] text-gray-400 mt-1">
                    Pre (${(targetValuation / 1000000).toFixed(1)}M) + Raise (${(raisingTarget / 1000000).toFixed(2)}M)
                  </span>
                </div>
              </div>

              {/* Cap Table Split Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold font-outfit">
                  <span className="text-accent">Founder Retained ({founderSharePct}%)</span>
                  <span className="text-blue-400">Investor Dilution ({investorSharePct}%)</span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden flex">
                  <div className="h-full bg-accent transition-all duration-300" style={{ width: `${founderSharePct}%` }}></div>
                  <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${investorSharePct}%` }}></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-text-muted">
                Need deep cap table scenarios & runway intelligence?
              </span>
              <Link
                to="/walkthrough"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-accent text-[#111] text-xs font-outfit font-black uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-sm cursor-pointer"
              >
                Book Walkthrough <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: Investor Mode — Instant AI Diligence Brief Generator
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'investor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Presets & Search Column */}
          <div className="lg:col-span-5 space-y-4">
            <span className="block text-xs font-bold uppercase tracking-wider text-text-muted font-outfit">
              1. Select Preset Startup or Type Custom
            </span>

            <div className="space-y-2.5">
              {DILIGENCE_PRESETS.map((preset) => {
                const isSelected = selectedPreset.name === preset.name;
                return (
                  <div
                    key={preset.name}
                    onClick={() => setSelectedPreset(preset)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-accent bg-accent/10 shadow-sm'
                        : 'border-DEFAULT bg-canvas hover:border-gray-400'
                    }`}
                  >
                    <div>
                      <span className="block font-outfit font-black text-sm text-text-primary">
                        {preset.name}
                      </span>
                      <span className="block text-[11px] text-text-muted">
                        {preset.sector} • {preset.stage}
                      </span>
                    </div>
                    <span className="text-xs font-black font-outfit px-2.5 py-1 rounded bg-surface-dark text-accent">
                      {preset.score}/100
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Custom Input */}
            <div className="pt-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-text-muted font-outfit mb-2">
                Or Test Your Portfolio Company
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customStartupName}
                  onChange={(e) => setCustomStartupName(e.target.value)}
                  placeholder="e.g. Acme AI Corp"
                  className="w-full px-4 py-2.5 bg-canvas border border-DEFAULT rounded-xl text-xs text-text-primary focus:outline-none focus:border-accent font-inter"
                />
                <button
                  onClick={handleSimulateAnalysis}
                  disabled={isAnalyzing}
                  className="px-4 py-2.5 bg-surface-dark text-white text-xs font-outfit font-bold rounded-xl hover:opacity-90 transition-all shrink-0 cursor-pointer"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Audit AI'}
                </button>
              </div>
            </div>
          </div>

          {/* AI Diligence Output Display */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div className="bg-canvas border border-DEFAULT rounded-2xl p-6 space-y-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-DEFAULT pb-3">
                <div className="flex items-center gap-2">
                  <Brain size={18} className="text-accent" />
                  <span className="font-outfit font-black text-base text-text-primary">
                    {selectedPreset.name}: Diligence Brief
                  </span>
                </div>
                <span className="px-3 py-1 bg-accent/20 border border-accent/40 text-text-primary text-[10px] font-black uppercase rounded-full font-outfit">
                  AI Conviction Score: {selectedPreset.score}/100
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-card p-3 rounded-xl border border-DEFAULT">
                  <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 font-outfit">
                    Defensibility / Moat
                  </span>
                  <span className="text-xs font-black text-text-primary font-outfit">
                    {selectedPreset.moat}
                  </span>
                </div>

                <div className="bg-card p-3 rounded-xl border border-DEFAULT">
                  <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 font-outfit">
                    Runway Projection
                  </span>
                  <span className="text-xs font-black text-accent font-outfit">
                    {selectedPreset.runwayMonths} Months
                  </span>
                </div>

                <div className="bg-card p-3 rounded-xl border border-DEFAULT">
                  <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 font-outfit">
                    Cap Table Audit
                  </span>
                  <span className="text-xs font-black text-blue-400 font-outfit">
                    {selectedPreset.capTableRisk}
                  </span>
                </div>
              </div>

              <div className="bg-card p-4 rounded-xl border border-DEFAULT">
                <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 font-outfit">
                  Executive Intelligence Summary
                </span>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {selectedPreset.summary}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-text-muted">
                Need ecosystem-wide deal flow & 1-click diligence rooms?
              </span>
              <Link
                to="/walkthrough"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-accent text-[#111] text-xs font-outfit font-black uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-sm cursor-pointer"
              >
                Schedule Investor Demo <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: Institution Mode — Regional Telemetry & Grant Pool
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'institution' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-canvas border border-DEFAULT rounded-2xl p-5 space-y-5">
              <h4 className="font-outfit font-black text-sm uppercase tracking-wider text-text-primary flex items-center gap-2">
                <Layers size={16} className="text-accent" />
                Program & Grant Allocation Controls
              </h4>

              <div>
                <div className="flex justify-between items-center text-xs mb-1.5 font-outfit font-bold">
                  <span className="text-text-muted">Active Cohort Startups</span>
                  <span className="text-accent text-sm">{cohortSize} Startups</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={cohortSize}
                  onChange={(e) => setCohortSize(Number(e.target.value))}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1.5 font-outfit font-bold">
                  <span className="text-text-muted">Total Ecosystem Grant Pool</span>
                  <span className="text-blue-400 text-sm">${(grantPool / 1000).toLocaleString()}k</span>
                </div>
                <input
                  type="range"
                  min={100000}
                  max={3000000}
                  step={100000}
                  value={grantPool}
                  onChange={(e) => setGrantPool(Number(e.target.value))}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            <div className="bg-surface-dark text-white rounded-2xl p-6 border border-white/10 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-xs font-black uppercase tracking-wider text-gray-400 font-outfit">
                  Ecosystem Telemetry Output
                </span>
                <span className="px-2.5 py-0.5 bg-accent text-[#111] text-[9px] font-black uppercase rounded font-outfit">
                  Public Impact Modeling
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                  <span className="block text-[9px] font-bold uppercase text-gray-400 tracking-wider mb-1 font-outfit">
                    Avg Grant / Startup
                  </span>
                  <span className="text-base font-black text-accent font-outfit">
                    ${(avgGrantPerStartup / 1000).toFixed(1)}k
                  </span>
                </div>

                <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                  <span className="block text-[9px] font-bold uppercase text-gray-400 tracking-wider mb-1 font-outfit">
                    Jobs Created
                  </span>
                  <span className="text-base font-black text-white font-outfit">
                    ~{estimatedJobsCreated}
                  </span>
                </div>

                <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                  <span className="block text-[9px] font-bold uppercase text-gray-400 tracking-wider mb-1 font-outfit">
                    Eco Multiplier
                  </span>
                  <span className="text-base font-black text-blue-400 font-outfit">
                    ${regionalEconomicMultiplier}M
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-text-muted">
                Managing a university, accelerator, or regional grant program?
              </span>
              <Link
                to="/walkthrough"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-accent text-[#111] text-xs font-outfit font-black uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-sm cursor-pointer"
              >
                Book Institution Walkthrough <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
