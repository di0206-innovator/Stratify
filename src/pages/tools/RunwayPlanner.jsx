import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, ShieldCheck, DollarSign, RefreshCw, Calendar, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import BentoCard from '../../components/BentoCard';
import AuthGate from '../../components/AuthGate';

export default function RunwayPlanner({ user, openAuthModal }) {
  const [cash, setCash] = useState(150000); // initial cash
  const [burn, setBurn] = useState(15000); // initial monthly burn
  const [revenue, setRevenue] = useState(3000); // initial monthly revenue
  const [growth, setGrowth] = useState(10); // revenue growth rate (%)

  const [projections, setProjections] = useState([]);
  const [runwayMonths, setRunwayMonths] = useState(null);
  const [defaultAlive, setDefaultAlive] = useState(false);
  const [hoveredMonth, setHoveredMonth] = useState(null);

  const [scenarioInput, setScenarioInput] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [simulationLog, setSimulationLog] = useState('');

  const runSimulation = async (e) => {
    e.preventDefault();
    if (!scenarioInput.trim()) return;

    setSimulating(true);
    setSimulationLog('');
    try {
      const res = await fetch('/api/runway/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cash,
          burn,
          revenue,
          growth,
          scenarioText: scenarioInput
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const sim = data.simulation;
        if (!sim) {
          setSimulationLog('Simulation returned empty result. Please try again.');
          return;
        }
        setCash(prev => Math.max(0, prev + (sim.cashDelta || 0)));
        setBurn(prev => Math.max(0, prev + (sim.burnDelta || 0)));
        setGrowth(prev => Math.max(0, Math.min(100, prev + (sim.growthDelta || 0))));
        setSimulationLog(sim.explanation || 'Simulation applied successfully.');
        setScenarioInput('');

        confetti({
          particleCount: 50,
          spread: 40,
          colors: ['#C8E64A', '#1A1A1A', '#FAF9F6']
        });
      } else {
        const msg = data?.error?.message || data?.message || `Error ${res.status}: Simulation failed.`;
        setSimulationLog(msg);
      }
    } catch (err) {
      setSimulationLog('Network error — could not reach the simulation engine. Check your connection.');
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    calculateFinancials();
  }, [cash, burn, revenue, growth]);

  const calculateFinancials = () => {
    let currentCash = cash;
    let currentRevenue = revenue;
    const monthlyProj = [];
    let deathMonth = null;
    let alive = false;

    // Simulate 24 months
    for (let month = 1; month <= 24; month++) {
      const netBurn = burn - currentRevenue;
      
      monthlyProj.push({
        month,
        cash: currentCash,
        revenue: currentRevenue,
        burn,
        netBurn,
        isDeficit: currentCash <= 0
      });

      if (currentCash > 0 && currentCash - netBurn <= 0) {
        deathMonth = month;
      }

      currentCash = currentCash - netBurn;
      
      // Grow revenue
      currentRevenue = currentRevenue * (1 + growth / 100);

      // Check if revenue exceeds burn (default alive!)
      if (currentRevenue >= burn && !deathMonth) {
        alive = true;
      }
    }

    setProjections(monthlyProj);
    setDefaultAlive(alive);

    // Calculate exact runway months
    const currentNetBurn = burn - revenue;
    if (currentNetBurn <= 0) {
      setRunwayMonths(Infinity);
    } else {
      let tempCash = cash;
      let tempRev = revenue;
      let months = 0;
      while (tempCash > 0 && months < 100) {
        const tempNet = burn - tempRev;
        if (tempNet <= 0) {
          months = Infinity;
          break;
        }
        tempCash -= tempNet;
        tempRev *= (1 + growth / 100);
        if (tempCash > 0) months++;
      }
      setRunwayMonths(months);
    }
  };

  const getRunwayBadge = () => {
    if (runwayMonths === Infinity || defaultAlive) {
      return { label: 'DEFAULT ALIVE', color: 'bg-green-50 border-green-200 text-green-700', icon: ShieldCheck };
    }
    if (runwayMonths < 6) {
      return { label: 'CRITICAL RUNWAY', color: 'bg-red-50 border-red-200 text-red-600', icon: AlertTriangle };
    }
    if (runwayMonths <= 12) {
      return { label: 'WARNING POSTURE', color: 'bg-amber-50 border-amber-200 text-amber-600', icon: AlertTriangle };
    }
    return { label: 'HEALTHY RUNWAY', color: 'bg-[#C8E64A]/10 border-[#C8E64A]/30 text-black', icon: ShieldCheck };
  };

  const getStrategicAdvice = () => {
    if (defaultAlive || runwayMonths === Infinity) {
      return {
        title: "Default Alive Status Unlocked",
        text: "Your projected revenue growth covers your cash burn before capital depletion. Prioritize organic product-market expansion, improve unit economics, and avoid dilution unless scaling demands it.",
        color: "border-[#C8E64A]/30 bg-[#C8E64A]/5"
      };
    }
    if (runwayMonths < 6) {
      return {
        title: "Existential Cash Flow Danger",
        text: "You have less than 6 months of capital left. Freeze non-essential hiring immediately, negotiate vendor discounts, focus 100% of bandwidth on immediate GTM sales, and prepare for bridge capital options.",
        color: "border-red-200 bg-red-50/50"
      };
    }
    if (runwayMonths <= 12) {
      return {
        title: "Fundraising Window Active",
        text: "With 6-12 months of runway, your VC/angel fundraising cycle must begin immediately. Pitch deck preparation, investor mappings, and data room builds take 3-6 months to close. Optimize your metrics for presentation.",
        color: "border-amber-200 bg-amber-50/50"
      };
    }
    return {
      title: "Product-Market Fit & R&D Posture",
      text: "With over 12 months of runway, focus on building defensive product wedges and running validation loops. Do not overspend on paid marketing channels before customer retention/engagement metrics are fully proven.",
      color: "border-gray-200 bg-gray-50/50"
    };
  };

  const formatCurrency = (val) => {
    if (val === Infinity) return '∞';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#C8E64A', '#1A1A1A', '#FAF9F6']
    });
  };

  const Badge = getRunwayBadge();
  const BadgeIcon = Badge.icon;
  const Advice = getStrategicAdvice();

  return (
    <AuthGate user={user} openAuthModal={openAuthModal} message="Sign in to access the Capital OS and simulate your startup runway and burn scenarios.">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 animate-fade-in text-[#111]">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-200/60 select-none">
          <div>
            <h1 className="text-2xl sm:text-3xl font-outfit font-black tracking-tight">
              Capital OS & Runway Planner
            </h1>
            <p className="font-inter text-gray-500 mt-1 text-xs sm:text-sm">
              Simulate monthly cash burn, plan seed-stage runway, and receive agentic financial warnings.
            </p>
          </div>
          <div className={`inline-flex items-center gap-1.5 ${Badge.color} border px-4 py-2 font-outfit font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm`}>
            <BadgeIcon size={14} />
            <span>{Badge.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Left Bento: Controls & Metrics */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            {/* Widget 1: Interactive Financial Controls */}
            <BentoCard title="Financial Controls" badge="REAL-TIME SLIDERS" badgeColor="bg-black" className="h-auto">
              <div className="space-y-5">
                {/* Cash */}
                <div>
                  <div className="flex justify-between items-center mb-1.5 select-none">
                    <label className="text-xs font-bold uppercase text-gray-500 tracking-wide">Initial Capital / Cash Balance</label>
                    <span className="text-xs font-mono font-bold bg-white border border-gray-200 px-2 py-0.5 rounded">
                      {formatCurrency(cash)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="1000000"
                    step="5000"
                    value={cash}
                    onChange={(e) => setCash(Number(e.target.value))}
                    className="w-full accent-black cursor-pointer"
                  />
                </div>

                {/* Burn */}
                <div>
                  <div className="flex justify-between items-center mb-1.5 select-none">
                    <label className="text-xs font-bold uppercase text-gray-500 tracking-wide">Gross Monthly Burn (Costs)</label>
                    <span className="text-xs font-mono font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded text-red-500">
                      {formatCurrency(burn)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={burn}
                    onChange={(e) => setBurn(Number(e.target.value))}
                    className="w-full accent-black cursor-pointer"
                  />
                </div>

                {/* Revenue */}
                <div>
                  <div className="flex justify-between items-center mb-1.5 select-none">
                    <label className="text-xs font-bold uppercase text-gray-500 tracking-wide">Initial Monthly Revenue</label>
                    <span className="text-xs font-mono font-bold bg-green-50 border border-green-200 px-2 py-0.5 rounded text-green-600">
                      {formatCurrency(revenue)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="1000"
                    value={revenue}
                    onChange={(e) => setRevenue(Number(e.target.value))}
                    className="w-full accent-black cursor-pointer"
                  />
                </div>

                {/* Growth */}
                <div>
                  <div className="flex justify-between items-center mb-1.5 select-none">
                    <label className="text-xs font-bold uppercase text-gray-500 tracking-wide">Revenue Monthly Growth Rate</label>
                    <span className="text-xs font-mono font-bold bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-black">
                      {growth}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={growth}
                    onChange={(e) => setGrowth(Number(e.target.value))}
                    className="w-full accent-black cursor-pointer"
                  />
                </div>
              </div>
            </BentoCard>

            {/* AI Business Scenario Simulator */}
            <BentoCard title="AI Scenario Simulator" badge="NATURAL LANGUAGE" badgeColor="bg-black">
              <form onSubmit={runSimulation} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 tracking-wide mb-1.5">
                    Type a business event to simulate (e.g. raise $500k, hire 3 devs)
                  </label>
                  <input
                    type="text"
                    value={scenarioInput}
                    onChange={(e) => setScenarioInput(e.target.value)}
                    placeholder="e.g. raise 250k seed round, hire senior backend dev..."
                    disabled={simulating}
                    className="os-input"
                  />
                </div>
                <button
                  type="submit"
                  disabled={simulating || !scenarioInput.trim()}
                  className="w-full py-3 bg-[#C8E64A] text-[#111] font-outfit font-bold text-xs uppercase hover:bg-[#B5D235] transition-all flex items-center justify-center gap-2 cursor-pointer rounded-lg"
                >
                  {simulating ? <RefreshCw size={12} className="animate-spin" /> : null}
                  <span>SIMULATE DECISION</span>
                </button>
                
                {simulationLog && (
                  <div className="border border-[#C8E64A]/30 p-3.5 bg-[#FAF9F6] text-left space-y-1.5 select-text rounded-xl">
                    <span className="text-[9px] font-bold uppercase text-[#EF4444] block tracking-wide">SIMULATION IMPACT LOG</span>
                    <p className="text-xs text-gray-600 leading-relaxed font-mono whitespace-pre-line">
                      {simulationLog}
                    </p>
                  </div>
                )}
              </form>
            </BentoCard>

            {/* Widget 2: Key Strategic Indicators */}
            <BentoCard title="Key Strategic Runway Indicators" badge="Survival Metrics" badgeColor="bg-black">
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-200 p-4 bg-[#FAF9F6] rounded-xl flex flex-col justify-between min-h-[100px]">
                  <span className="text-[9px] font-bold uppercase text-gray-450 tracking-wide">Survival Runway</span>
                  <div className="mt-3">
                    <h3 className="text-3xl font-outfit font-black tracking-tight">
                      {runwayMonths === Infinity ? '∞' : Math.floor(runwayMonths)}
                    </h3>
                    <span className="text-[10px] font-bold uppercase text-gray-400 block mt-1">Months Left</span>
                  </div>
                </div>

                <div className="border border-gray-200 p-4 bg-[#FAF9F6] rounded-xl flex flex-col justify-between min-h-[100px]">
                  <span className="text-[9px] font-bold uppercase text-gray-450 tracking-wide">Net Monthly Burn</span>
                  <div className="mt-3">
                    <h3 className={`text-2xl font-outfit font-black tracking-tight ${burn - revenue > 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {formatCurrency(Math.max(0, burn - revenue))}
                    </h3>
                    <span className="text-[10px] font-bold uppercase text-gray-400 block mt-1">Current Net Burn</span>
                  </div>
                </div>

                <div className="border border-gray-200 p-4 bg-[#FAF9F6] col-span-2 rounded-xl flex flex-col justify-between min-h-[80px]">
                  <span className="text-[9px] font-bold uppercase text-gray-450 tracking-wide">Cash Flow Posture</span>
                  <div className="mt-3">
                    <h4 className="text-sm font-bold uppercase text-black">
                      {defaultAlive ? 'Default Alive (Scale Mode)' : 'Default Dead (Raise/Optimize)'}
                    </h4>
                    <span className="text-[10px] text-gray-500 font-semibold mt-1 block leading-relaxed">
                      {defaultAlive 
                        ? 'Revenue growth outpaces burn rate. Business survives without extra capital.' 
                        : 'Capital will eventually deplete. You must raise venture capital or decrease burn.'}
                    </span>
                  </div>
                </div>
              </div>
            </BentoCard>
          </div>

          {/* Right Bento: Advice & Projection list */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            {/* Widget 3: Strategic Advice Desk */}
            <BentoCard title="Strategic Advice Desk" badge="FINANCIAL COUNSEL" badgeColor="bg-black" className="h-auto">
              <div className={`border p-5 rounded-xl ${Advice.color} space-y-2`}>
                <h3 className="font-outfit font-bold text-sm uppercase text-black flex items-center gap-1.5">
                  <TrendingUp size={16} />
                  <span>{Advice.title}</span>
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-light font-inter">
                  {Advice.text}
                </p>
              </div>
              
              {defaultAlive && (
                <button
                  onClick={triggerConfetti}
                  className="w-full os-btn-primary py-2.5 mt-3 select-none text-xs font-semibold"
                >
                  <span>Celebrate Survival Milestone 🎉</span>
                </button>
              )}
            </BentoCard>

            {/* Widget 4: Month-by-month cash flow projections */}
            <BentoCard title="Cash Balance Projections" badge="24-Month Forecast" badgeColor="bg-black" className="flex-1">
              {/* Interactive SVG Chart */}
              <div className="p-4 bg-white border border-gray-150 rounded-xl mb-4">
                {/* Dynamic Tooltip */}
                <div className="border border-gray-200 bg-[#FAF9F6] p-3 rounded-xl mb-4 select-none min-h-[50px] flex items-center justify-center">
                  {hoveredMonth !== null && projections[hoveredMonth] ? (
                    <div className="flex w-full justify-between items-center text-xs font-semibold px-2">
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase block">Period</span>
                        <span className="font-outfit font-bold text-sm uppercase text-black">Month {projections[hoveredMonth].month}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase block">Projected Cash</span>
                        <span className="font-mono font-bold text-sm text-black">
                          {projections[hoveredMonth].cash <= 0 ? 'DEPLETED' : formatCurrency(projections[hoveredMonth].cash)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase block">Net Flow</span>
                        <span className={`font-mono font-bold text-sm ${projections[hoveredMonth].netBurn > 0 ? 'text-red-500' : 'text-green-600'}`}>
                          {projections[hoveredMonth].netBurn > 0 ? '-' : '+'}{formatCurrency(Math.abs(projections[hoveredMonth].netBurn))}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Hover over forecast bars below to analyze monthly metrics
                    </div>
                  )}
                </div>

                {/* Responsive SVG Grid */}
                <div className="w-full overflow-x-auto">
                  <svg viewBox="0 0 600 180" className="w-full min-w-[500px] h-auto overflow-visible">
                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                      const maxCash = Math.max(...projections.map(p => p.cash), 10000);
                      const paddingTop = 20;
                      const chartHeight = 135;
                      const paddingLeft = 60;
                      const paddingRight = 20;
                      const width = 600;
                      
                      const y = paddingTop + chartHeight * (1 - ratio);
                      const val = ratio * maxCash;
                      return (
                        <g key={idx}>
                          <line 
                            x1={paddingLeft} 
                            y1={y} 
                            x2={width - paddingRight} 
                            y2={y} 
                            stroke="#E5E7EB" 
                            strokeWidth="1" 
                            strokeDasharray="4 4" 
                          />
                          <text 
                            x={paddingLeft - 8} 
                            y={y + 3} 
                            textAnchor="end" 
                            className="font-mono text-[9px] fill-gray-400 font-bold"
                          >
                            {formatCurrency(val)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Axis lines */}
                    <line 
                      x1={60} 
                      y1={20} 
                      x2={60} 
                      y2={155} 
                      stroke="#111111" 
                      strokeWidth="1.5" 
                    />
                    <line 
                      x1={60} 
                      y1={155} 
                      x2={580} 
                      y2={155} 
                      stroke="#111111" 
                      strokeWidth="1.5" 
                    />

                    {/* Bars */}
                    {projections.map((p, idx) => {
                      const maxCash = Math.max(...projections.map(p => p.cash), 10000);
                      const chartWidth = 500;
                      const chartHeight = 135;
                      const paddingLeft = 60;
                      const paddingBottom = 25;
                      const height = 180;
                      
                      const barW = (chartWidth / 24) - 3;
                      const x = paddingLeft + idx * (chartWidth / 24) + 1.5;
                      const maxProjCash = maxCash || 1;
                      const barH = (p.cash / maxProjCash) * chartHeight;
                      const y = height - paddingBottom - barH;
                      
                      let barColor = 'fill-[#FAF9F6] stroke-gray-300'; 
                      if (p.isDeficit || p.cash <= 0) {
                        barColor = 'fill-gray-100 stroke-gray-200'; // Depleted
                      } else if (p.netBurn <= 0) {
                        barColor = 'fill-[#C8E64A] stroke-[#B5D235]'; // Default Alive
                      } else {
                        barColor = 'fill-black stroke-black'; // Burning
                      }

                      const isHovered = hoveredMonth === idx;

                      return (
                        <g 
                          key={p.month}
                          onMouseEnter={() => setHoveredMonth(idx)}
                          onMouseLeave={() => setHoveredMonth(null)}
                        >
                          <rect
                            x={x}
                            y={y}
                            width={barW}
                            height={Math.max(2, barH)}
                            className={`${barColor} stroke-1 transition-all duration-150`}
                            style={{
                              transformOrigin: `${x + barW / 2}px ${height - paddingBottom}px`,
                              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                            }}
                          />
                          {/* Hidden rect for easier mouse interactions */}
                          <rect
                            x={x - 1}
                            y={20}
                            width={barW + 2}
                            height={145}
                            fill="transparent"
                            className="cursor-pointer"
                          />
                        </g>
                      );
                    })}

                    {/* X Axis Labels */}
                    {projections.filter(p => p.month % 3 === 0 || p.month === 1).map((p) => {
                      const chartWidth = 500;
                      const paddingLeft = 60;
                      const paddingBottom = 25;
                      const height = 180;
                      const idxInArray = p.month - 1;
                      const x = paddingLeft + idxInArray * (chartWidth / 24) + ((chartWidth / 24) / 2);
                      return (
                        <text 
                          key={p.month} 
                          x={x} 
                          y={height - paddingBottom + 14} 
                          textAnchor="middle" 
                          className="font-outfit font-bold text-[9px] fill-[#111] uppercase tracking-tighter"
                        >
                          M{p.month}
                        </text>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Forecast breakdown table */}
              <div className="overflow-hidden bg-white border border-gray-200 rounded-xl">
                <div className="overflow-y-auto max-h-[300px] scrollbar-thin">
                  <table className="w-full text-left font-inter border-collapse">
                    <thead>
                      <tr className="bg-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-wider select-none">
                        <th className="p-3.5">Month</th>
                        <th className="p-3.5">Cash Balance</th>
                        <th className="p-3.5">Revenue</th>
                        <th className="p-3.5">Monthly Burn</th>
                        <th className="p-3.5">Net Flow</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projections.map((p) => (
                        <tr 
                          key={p.month} 
                          className={`text-xs border-b border-gray-150 font-semibold hover:bg-gray-50/50 ${
                            p.isDeficit ? 'bg-red-50/50 text-red-600' : 'text-gray-700'
                          }`}
                        >
                          <td className="p-3 font-mono font-bold">M{p.month}</td>
                          <td className="p-3 font-mono">
                            {p.isDeficit ? '($0) DEPLETED' : formatCurrency(p.cash)}
                          </td>
                          <td className="p-3 font-mono text-green-600 font-bold">
                            {formatCurrency(p.revenue)}
                          </td>
                          <td className="p-3 font-mono text-gray-550">
                            {formatCurrency(p.burn)}
                          </td>
                          <td className={`p-3 font-mono font-bold ${p.netBurn > 0 ? 'text-red-500' : 'text-green-600'}`}>
                            {p.netBurn > 0 ? '-' : '+'}{formatCurrency(Math.abs(p.netBurn))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </BentoCard>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
