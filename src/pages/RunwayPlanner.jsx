import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, ShieldCheck, DollarSign, RefreshCw, Calendar, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import BentoCard from '../components/BentoCard';

export default function RunwayPlanner() {
  const [cash, setCash] = useState(150000); // initial cash
  const [burn, setBurn] = useState(15000);  // initial monthly burn
  const [revenue, setRevenue] = useState(3000); // initial monthly revenue
  const [growth, setGrowth] = useState(10);   // revenue growth rate (%)

  const [projections, setProjections] = useState([]);
  const [runwayMonths, setRunwayMonths] = useState(null);
  const [defaultAlive, setDefaultAlive] = useState(false);
  const [hoveredMonth, setHoveredMonth] = useState(null);

  useEffect(() => {
    calculateFinancials();
  }, [cash, burn, revenue, growth]);

  const calculateFinancials = () => {
    let currentCash = cash;
    let currentRevenue = revenue;
    const netBurnList = [];
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
      return { label: 'DEFAULT ALIVE', color: 'bg-[#A3E635]', icon: ShieldCheck };
    }
    if (runwayMonths < 6) {
      return { label: 'CRITICAL RUNWAY', color: 'bg-[#F472B6]', icon: AlertTriangle };
    }
    if (runwayMonths <= 12) {
      return { label: 'WARNING POSTURE', color: 'bg-[#FB923C]', icon: AlertTriangle };
    }
    return { label: 'HEALTHY RUNWAY', color: 'bg-cyan-400', icon: ShieldCheck };
  };

  const getStrategicAdvice = () => {
    if (defaultAlive || runwayMonths === Infinity) {
      return {
        title: "Default Alive Status Unlocked",
        text: "Your projected revenue growth covers your cash burn before capital depletion. Prioritize organic product-market expansion, improve unit economics, and avoid dilution unless scaling demands it.",
        color: "border-[#A3E635]"
      };
    }
    if (runwayMonths < 6) {
      return {
        title: "Existential Cash Flow Danger",
        text: "You have less than 6 months of capital left. Freeze non-essential hiring immediately, negotiate vendor discounts, focus 100% of bandwidth on immediate GTM sales, and prepare for bridge capital options.",
        color: "border-[#F472B6]"
      };
    }
    if (runwayMonths <= 12) {
      return {
        title: "Fundraising Window Active",
        text: "With 6-12 months of runway, your VC/angel fundraising cycle must begin immediately. Pitch deck preparation, investor mappings, and data room builds take 3-6 months to close. Optimize your metrics for presentation.",
        color: "border-[#FB923C]"
      };
    }
    return {
      title: "Product-Market Fit & R&D Posture",
      text: "With over 12 months of runway, focus on building defensive product wedges and running validation loops. Do not overspend on paid marketing channels before customer retention/engagement metrics are fully proven.",
      color: "border-black"
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
      colors: ['#A3E635', '#C084FC', '#FB923C']
    });
  };

  const Badge = getRunwayBadge();
  const BadgeIcon = Badge.icon;
  const Advice = getStrategicAdvice();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-[3px] border-black p-6 shadow-neo-hard select-none">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            Capital OS & Runway Planner
          </h1>
          <p className="font-outfit font-bold text-gray-700 mt-1">
            Simulate monthly cash burn, plan seed-stage runway, and receive agentic financial warnings.
          </p>
        </div>
        <div className={`inline-flex items-center gap-1.5 ${Badge.color} border-[3px] border-black px-4 py-2 font-outfit font-black text-sm uppercase tracking-wider shadow-neo-button`}>
          <BadgeIcon size={16} />
          <span>{Badge.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Bento: Controls & Metrics */}
        <div className="col-span-12 lg:col-span-5 space-y-6 flex flex-col justify-stretch">
          {/* Widget 1: Interactive Financial Controls */}
          <BentoCard title="Financial Controls" badge="REAL-TIME SLIDERS" badgeColor="bg-[#C084FC]" className="h-auto">
            <div className="space-y-5">
              {/* Cash */}
              <div>
                <div className="flex justify-between items-center mb-1 select-none">
                  <label className="text-xs font-black uppercase text-gray-700">Initial Capital / Cash Balance</label>
                  <span className="text-xs font-mono font-bold bg-white border border-black px-1.5 py-0.5">
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
                <div className="flex justify-between items-center mb-1 select-none">
                  <label className="text-xs font-black uppercase text-gray-700">Gross Monthly Burn (Costs)</label>
                  <span className="text-xs font-mono font-bold bg-white border border-black px-1.5 py-0.5 text-[#F472B6]">
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
                <div className="flex justify-between items-center mb-1 select-none">
                  <label className="text-xs font-black uppercase text-gray-700">Initial Monthly Revenue</label>
                  <span className="text-xs font-mono font-bold bg-white border border-black px-1.5 py-0.5 text-[#A3E635]">
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
                <div className="flex justify-between items-center mb-1 select-none">
                  <label className="text-xs font-black uppercase text-gray-700">Revenue Monthly Growth Rate</label>
                  <span className="text-xs font-mono font-bold bg-white border border-black px-1.5 py-0.5 text-cyan-400">
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

          {/* Widget 2: Key Strategic Indicators */}
          <BentoCard title="Key Strategic Runway Indicators" badge="Survival Metrics" badgeColor="bg-[#FB923C]" className="flex-1">
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="border-2 border-black p-4 bg-[#F8F7F4] flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase text-gray-400">Survival Runway</span>
                <div>
                  <h3 className="text-3xl sm:text-4xl font-black font-mono">
                    {runwayMonths === Infinity ? '∞' : Math.floor(runwayMonths)}
                  </h3>
                  <span className="text-[10px] font-bold uppercase text-gray-600 block mt-1">Months Left</span>
                </div>
              </div>

              <div className="border-2 border-black p-4 bg-[#F8F7F4] flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase text-gray-400">Net Monthly Burn</span>
                <div>
                  <h3 className={`text-2xl sm:text-3xl font-black font-mono ${burn - revenue > 0 ? 'text-[#F472B6]' : 'text-[#A3E635]'}`}>
                    {formatCurrency(Math.max(0, burn - revenue))}
                  </h3>
                  <span className="text-[10px] font-bold uppercase text-gray-600 block mt-1">Current Net Burn</span>
                </div>
              </div>

              <div className="border-2 border-black p-4 bg-[#F8F7F4] col-span-2 flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase text-gray-400">Cash Flow Posture</span>
                <div>
                  <h4 className="text-sm font-black uppercase">
                    {defaultAlive ? 'Default Alive (Scale Mode)' : 'Default Dead (Raise/Optimize)'}
                  </h4>
                  <span className="text-[10px] text-gray-500 font-semibold mt-1 block leading-tight">
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
        <div className="col-span-12 lg:col-span-7 space-y-6 flex flex-col justify-stretch">
          {/* Widget 3: Strategic Advice Desk */}
          <BentoCard title="Strategic Advice Desk" badge="FINANCIAL COUNSEL" badgeColor="bg-[#F472B6]" className="h-auto">
            <div className={`border-[3px] p-4 bg-[#F8F7F4] ${Advice.color} space-y-2`}>
              <h3 className="font-outfit font-black text-sm uppercase text-black flex items-center gap-1.5">
                <TrendingUp size={16} />
                <span>{Advice.title}</span>
              </h3>
              <p className="text-xs sm:text-sm font-semibold font-inter text-gray-700 leading-relaxed">
                {Advice.text}
              </p>
            </div>
            
            {defaultAlive && (
              <button
                onClick={triggerConfetti}
                className="w-full bg-[#A3E635] border-[3px] border-black text-black font-black py-2 shadow-neo-button active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer uppercase text-xs mt-3 select-none"
              >
                <span>Celebrate Survival Milestone 🎉</span>
              </button>
            )}
          </BentoCard>

          {/* Widget 4: Month-by-month cash flow projections */}
          <BentoCard title="Cash Balance Projections" badge="24-Month Forecast" badgeColor="bg-cyan-400" className="flex-1">
            {/* Interactive SVG Chart */}
            <div className="border-[3px] border-black p-4 bg-white mb-4">
              {/* Dynamic Tooltip */}
              <div className="border-2 border-black bg-[#F8F7F4] p-2.5 mb-4 select-none min-h-[50px] flex items-center justify-center">
                {hoveredMonth !== null && projections[hoveredMonth] ? (
                  <div className="flex w-full justify-between items-center text-xs font-semibold px-2">
                    <div>
                      <span className="text-[9px] font-black text-gray-500 uppercase block">Period</span>
                      <span className="font-outfit font-black text-sm uppercase text-black">Month {projections[hoveredMonth].month}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-gray-500 uppercase block">Projected Cash</span>
                      <span className="font-mono font-bold text-sm text-black">
                        {projections[hoveredMonth].cash <= 0 ? 'DEPLETED' : formatCurrency(projections[hoveredMonth].cash)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-gray-500 uppercase block">Net Flow</span>
                      <span className={`font-mono font-bold text-sm ${projections[hoveredMonth].netBurn > 0 ? 'text-[#F472B6]' : 'text-[#A3E635]'}`}>
                        {projections[hoveredMonth].netBurn > 0 ? '-' : '+'}{formatCurrency(Math.abs(projections[hoveredMonth].netBurn))}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-gray-500 font-black uppercase tracking-wider">
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
                          stroke="#E4E4E7" 
                          strokeWidth="1" 
                          strokeDasharray="4 4" 
                        />
                        <text 
                          x={paddingLeft - 8} 
                          y={y + 3} 
                          textAnchor="end" 
                          className="font-mono text-[9px] fill-gray-500 font-bold"
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
                    stroke="#000000" 
                    strokeWidth="3" 
                  />
                  <line 
                    x1={60} 
                    y1={155} 
                    x2={580} 
                    y2={155} 
                    stroke="#000000" 
                    strokeWidth="3" 
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
                    
                    let barColor = 'fill-[#C084FC]'; // Lavender
                    if (p.isDeficit || p.cash <= 0) {
                      barColor = 'fill-[#F472B6]'; // Pink (Depleted)
                    } else if (p.netBurn <= 0) {
                      barColor = 'fill-[#A3E635]'; // Lime (Default Alive)
                    } else if (idx < 6 && runwayMonths < 6) {
                      barColor = 'fill-[#FB923C]'; // Orange (Critical Warning)
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
                          className={`${barColor} stroke-black stroke-2 transition-all duration-150`}
                          style={{
                            transformOrigin: `${x + barW / 2}px ${height - paddingBottom}px`,
                            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                            filter: isHovered ? 'drop-shadow(2px 2px 0px rgba(0,0,0,1))' : 'none'
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
                        className="font-outfit font-black text-[9px] fill-black uppercase tracking-tighter"
                      >
                        M{p.month}
                      </text>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Existing forecast breakdown table */}
            <div className="border-[3px] border-black overflow-hidden bg-white">
              <div className="overflow-y-auto max-h-[300px] scrollbar-thin">
                <table className="w-full text-left font-inter border-collapse">
                  <thead>
                    <tr className="bg-black text-[#F8F7F4] text-[10px] font-black uppercase tracking-wider select-none border-b border-black">
                      <th className="p-3">Month</th>
                      <th className="p-3">Cash Balance</th>
                      <th className="p-3">Revenue</th>
                      <th className="p-3">Monthly Burn</th>
                      <th className="p-3">Net Flow</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projections.map((p) => (
                      <tr 
                        key={p.month} 
                        className={`text-xs border-b border-gray-200 font-semibold hover:bg-gray-50 ${
                          p.isDeficit ? 'bg-[#F472B6]/10 text-red-500' : 'text-gray-800'
                        }`}
                      >
                        <td className="p-3 font-mono font-bold">M{p.month}</td>
                        <td className="p-3 font-mono">
                          {p.isDeficit ? '($0) DEPLETED' : formatCurrency(p.cash)}
                        </td>
                        <td className="p-3 font-mono text-[#A3E635] font-bold">
                          {formatCurrency(p.revenue)}
                        </td>
                        <td className="p-3 font-mono text-gray-600">
                          {formatCurrency(p.burn)}
                        </td>
                        <td className={`p-3 font-mono font-bold ${p.netBurn > 0 ? 'text-[#F472B6]' : 'text-[#A3E635]'}`}>
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
  );
}
