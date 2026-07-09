import React, { useState, useEffect } from 'react';
import { Clock, Users, Shield, ArrowRight, CheckCircle } from 'lucide-react';
import Toast from '../components/Toast';
import BentoCard from '../components/BentoCard';
import confetti from 'canvas-confetti';

export default function EquityPlanner() {
  // Founder Name states
  const [f1Name, setF1Name] = useState('Co-Founder A');
  const [f2Name, setF2Name] = useState('Co-Founder B');
  const [f3Name, setF3Name] = useState('Co-Founder C');

  // Founder 1 sliders
  const [f1Ip, setF1Ip] = useState(8);
  const [f1Code, setF1Code] = useState(9);
  const [f1Capital, setF1Capital] = useState(2);
  const [f1Hours, setF1Hours] = useState(10); // Full-time

  // Founder 2 sliders
  const [f2Ip, setF2Ip] = useState(3);
  const [f2Code, setF2Code] = useState(4);
  const [f2Capital, setF2Capital] = useState(8);
  const [f2Hours, setF2Hours] = useState(8); 

  // Founder 3 sliders
  const [f3Ip, setF3Ip] = useState(1);
  const [f3Code, setF3Code] = useState(1);
  const [f3Capital, setF3Capital] = useState(1);
  const [f3Hours, setF3Hours] = useState(0); // Inactive

  // Results
  const [toast, setToast] = useState(null);
  const [shares, setShares] = useState(null);
  const [vestingMonths, setVestingMonths] = useState(12);
  const [briefGenerated, setBriefGenerated] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchState = async () => {
    try {
      const res = await fetch('/api/equity');
      if (res.ok) {
        const data = await res.json();
        if (data.capTable && data.capTable.state) {
          const s = data.capTable.state;
          if (s.f1Name) setF1Name(s.f1Name);
          if (s.f2Name) setF2Name(s.f2Name);
          if (s.f3Name) setF3Name(s.f3Name);
          
          if (s.f1Ip !== undefined) setF1Ip(s.f1Ip);
          if (s.f1Code !== undefined) setF1Code(s.f1Code);
          if (s.f1Capital !== undefined) setF1Capital(s.f1Capital);
          if (s.f1Hours !== undefined) setF1Hours(s.f1Hours);
          
          if (s.f2Ip !== undefined) setF2Ip(s.f2Ip);
          if (s.f2Code !== undefined) setF2Code(s.f2Code);
          if (s.f2Capital !== undefined) setF2Capital(s.f2Capital);
          if (s.f2Hours !== undefined) setF2Hours(s.f2Hours);

          if (s.f3Ip !== undefined) setF3Ip(s.f3Ip);
          if (s.f3Code !== undefined) setF3Code(s.f3Code);
          if (s.f3Capital !== undefined) setF3Capital(s.f3Capital);
          if (s.f3Hours !== undefined) setF3Hours(s.f3Hours);

          if (s.shares) setShares(s.shares);
          if (s.vestingMonths) setVestingMonths(s.vestingMonths);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  const saveState = async (sharesCalc) => {
    try {
      await fetch('/api/equity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionName: 'Current',
          state: {
            f1Name, f2Name, f3Name,
            f1Ip, f1Code, f1Capital, f1Hours,
            f2Ip, f2Code, f2Capital, f2Hours,
            f3Ip, f3Code, f3Capital, f3Hours,
            shares: sharesCalc,
            vestingMonths
          }
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const calculateSplit = (e) => {
    e.preventDefault();
    
    // Points weights
    const p1 = f1Ip * 1.0 + f1Code * 2.0 + f1Capital * 1.5 + f1Hours * 1.5;
    const p2 = f2Ip * 1.0 + f2Code * 2.0 + f2Capital * 1.5 + f2Hours * 1.5;
    const p3 = f3Ip * 1.0 + f3Code * 2.0 + f3Capital * 1.5 + f3Hours * 1.5;

    const total = p1 + p2 + p3;
    if (total === 0) return;

    const s1 = (p1 / total) * 100;
    const s2 = (p2 / total) * 100;
    const s3 = (p3 / total) * 100;

    setShares({
      f1: Number(s1.toFixed(1)),
      f2: Number(s2.toFixed(1)),
      f3: Number(s3.toFixed(1))
    });
    setBriefGenerated(false);

    confetti({
      particleCount: 80,
      spread: 50,
      colors: ['#C8E64A', '#1A1A1A', '#FAF9F6']
    });

    const calculatedShares = {
      f1: Number(s1.toFixed(1)),
      f2: Number(s2.toFixed(1)),
      f3: Number(s3.toFixed(1))
    };

    saveState(calculatedShares);
  };

  // Vesting calculations (48 months, 12 month cliff)
  const getVestedPercent = (months) => {
    if (months < 12) return 0;
    if (months >= 48) return 100;
    // 25% vests at month 12, then (75% / 36) per month for the remaining 36 months
    const monthlyRate = 75 / 36;
    return 25 + (months - 12) * monthlyRate;
  };

  const vestedPercent = getVestedPercent(vestingMonths);
  const unvestedPercent = 100 - vestedPercent;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 pb-32 animate-fade-in text-[#111]">
      <div className="os-card bg-[#1A1A1A] text-white p-8 sm:p-12 mb-8 relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full transform translate-x-20 -translate-y-20"></div>
        <div className="relative z-10 space-y-2.5 text-left">
          <span className="inline-block bg-[#C8E64A]/10 border border-[#C8E64A]/30 text-white px-2.5 py-1 font-outfit font-bold text-[10px] uppercase tracking-wider rounded-md">
            Ecosystem Agreements Suite
          </span>
          <h1 className="text-3xl sm:text-5xl font-outfit font-black tracking-tight text-white uppercase">
            Co-Founder Equity Planner
          </h1>
          <p className="font-inter text-gray-300 max-w-xl text-xs sm:text-sm leading-relaxed font-light">
            Eliminate friction before shipping. Model contributions, calculate fair cap split metrics, and generate vesting agreements.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Input Matrices) */}
        <div className="lg:col-span-2 space-y-6">
          <BentoCard title="Co-Founder Contribution Weights" badge="ALIGNMENT SURVEY" badgeColor="bg-[#1A1A1A]">
            <form onSubmit={calculateSplit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Founder 1 */}
                <div className="p-5 bg-[#FAF9F6] border border-gray-200 rounded-xl text-left space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2.5">
                    <input
                      type="text"
                      value={f1Name}
                      onChange={(e) => setF1Name(e.target.value)}
                      className="font-outfit font-bold text-xs uppercase bg-transparent focus:outline-none border-b border-[#111] text-[#111] w-2/3"
                    />
                    <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded font-bold uppercase">F1</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 text-xs">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1.5 tracking-wide">Ideation / IP contribution</label>
                      <input type="range" min="0" max="10" value={f1Ip} onChange={(e) => setF1Ip(Number(e.target.value))} className="w-full accent-black cursor-pointer" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1.5 tracking-wide">Execution / Dev work</label>
                      <input type="range" min="0" max="10" value={f1Code} onChange={(e) => setF1Code(Number(e.target.value))} className="w-full accent-black cursor-pointer" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1.5 tracking-wide">Pre-seed Capital Invested</label>
                      <input type="range" min="0" max="10" value={f1Capital} onChange={(e) => setF1Capital(Number(e.target.value))} className="w-full accent-black cursor-pointer" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1.5 tracking-wide">Hours Committed</label>
                      <input type="range" min="0" max="10" value={f1Hours} onChange={(e) => setF1Hours(Number(e.target.value))} className="w-full accent-black cursor-pointer" />
                    </div>
                  </div>
                </div>

                {/* Founder 2 */}
                <div className="p-5 bg-[#FAF9F6] border border-gray-200 rounded-xl text-left space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2.5">
                    <input
                      type="text"
                      value={f2Name}
                      onChange={(e) => setF2Name(e.target.value)}
                      className="font-outfit font-bold text-xs uppercase bg-transparent focus:outline-none border-b border-[#111] text-[#111] w-2/3"
                    />
                    <span className="text-[10px] bg-gray-200 text-gray-800 px-2 py-0.5 rounded font-bold uppercase">F2</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 text-xs">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1.5 tracking-wide">Ideation / IP contribution</label>
                      <input type="range" min="0" max="10" value={f2Ip} onChange={(e) => setF2Ip(Number(e.target.value))} className="w-full accent-black cursor-pointer" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1.5 tracking-wide">Execution / Dev work</label>
                      <input type="range" min="0" max="10" value={f2Code} onChange={(e) => setF2Code(Number(e.target.value))} className="w-full accent-black cursor-pointer" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1.5 tracking-wide">Pre-seed Capital Invested</label>
                      <input type="range" min="0" max="10" value={f2Capital} onChange={(e) => setF2Capital(Number(e.target.value))} className="w-full accent-black cursor-pointer" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1.5 tracking-wide">Hours Committed</label>
                      <input type="range" min="0" max="10" value={f2Hours} onChange={(e) => setF2Hours(Number(e.target.value))} className="w-full accent-black cursor-pointer" />
                    </div>
                  </div>
                </div>

                {/* Founder 3 */}
                <div className="p-5 bg-[#FAF9F6] border border-gray-200 rounded-xl text-left space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2.5">
                    <input
                      type="text"
                      value={f3Name}
                      onChange={(e) => setF3Name(e.target.value)}
                      className="font-outfit font-bold text-xs uppercase bg-transparent focus:outline-none border-b border-[#111] text-[#111] w-2/3"
                    />
                    <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded font-bold uppercase">F3</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 text-xs">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1.5 tracking-wide">Ideation / IP contribution</label>
                      <input type="range" min="0" max="10" value={f3Ip} onChange={(e) => setF3Ip(Number(e.target.value))} className="w-full accent-black cursor-pointer" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1.5 tracking-wide">Execution / Dev work</label>
                      <input type="range" min="0" max="10" value={f3Code} onChange={(e) => setF3Code(Number(e.target.value))} className="w-full accent-black cursor-pointer" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1.5 tracking-wide">Pre-seed Capital Invested</label>
                      <input type="range" min="0" max="10" value={f3Capital} onChange={(e) => setF3Capital(Number(e.target.value))} className="w-full accent-black cursor-pointer" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1.5 tracking-wide">Hours Committed</label>
                      <input type="range" min="0" max="10" value={f3Hours} onChange={(e) => setF3Hours(Number(e.target.value))} className="w-full accent-black cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#C8E64A] text-black font-outfit font-bold text-xs uppercase rounded-lg hover:bg-[#B5D235] transition-all cursor-pointer tracking-wider"
              >
                CALCULATE BALANCED SPLIT
              </button>
            </form>
          </BentoCard>
        </div>

        {/* Right Column (Results & Vesting Simulator) */}
        <div className="space-y-6">
          {/* Equity Split Output */}
          <BentoCard title="Equity Cap Split" badge="CALCULATOR METRICS" badgeColor="bg-black">
            {shares ? (
              <div className="space-y-4 text-left">
                {/* Horizontal Segmented Bar */}
                <div className="h-8 flex overflow-hidden rounded-lg">
                  <div style={{ width: `${shares.f1}%` }} className="bg-black h-full transition-all border-r border-[#FAF9F6]/20" title={`${f1Name}: ${shares.f1}%`} />
                  <div style={{ width: `${shares.f2}%` }} className="bg-gray-500 h-full transition-all border-r border-[#FAF9F6]/20" title={`${f2Name}: ${shares.f2}%`} />
                  <div style={{ width: `${shares.f3}%` }} className="bg-gray-200 h-full transition-all" title={`${f3Name}: ${shares.f3}%`} />
                </div>

                <div className="space-y-2 text-xs font-bold text-gray-700 mt-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="flex items-center gap-1.5 uppercase font-black text-black">
                      <span className="w-2.5 h-2.5 bg-black inline-block rounded-sm"></span>
                      {f1Name}
                    </span>
                    <span className="font-mono text-black">{shares.f1}%</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="flex items-center gap-1.5 uppercase font-black text-black">
                      <span className="w-2.5 h-2.5 bg-gray-500 inline-block rounded-sm"></span>
                      {f2Name}
                    </span>
                    <span className="font-mono text-black">{shares.f2}%</span>
                  </div>
                  <div className="flex justify-between items-center pb-1">
                    <span className="flex items-center gap-1.5 uppercase font-black text-black">
                      <span className="w-2.5 h-2.5 bg-gray-200 inline-block rounded-sm"></span>
                      {f3Name}
                    </span>
                    <span className="font-mono text-black">{shares.f3}%</span>
                  </div>
                </div>

                <button
                  onClick={() => setBriefGenerated(true)}
                  className="os-btn-primary w-full py-2.5 text-xs font-semibold uppercase flex items-center justify-center gap-1.5 mt-4"
                >
                  <Shield size={14} />
                  <span>Generate Vesting Agreement Brief</span>
                </button>

                <button
                  onClick={async () => {
                    await saveState(shares);
                    confetti({
                      particleCount: 50,
                      spread: 30,
                      colors: ['#C8E64A', '#1A1A1A', '#FAF9F6']
                    });
                    setToast({ message: 'Cap table successfully saved to Stratify workspace registry!', type: 'success' });
                  }}
                  className="w-full os-btn bg-[#FAF9F6] hover:border-black text-xs font-semibold py-2.5 flex items-center justify-center gap-1.5 mt-2"
                >
                  <CheckCircle size={14} />
                  <span>Save Cap Table to Registry</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 font-outfit font-bold text-xs uppercase tracking-wider">
                Slide contribution factors and click Calculate to view equity splits
              </div>
            )}
          </BentoCard>

          {/* Vesting Schedule Visualizer */}
          <BentoCard title="Vesting Schedule Visualizer" badge="48 MONTH TIMELINE" badgeColor="bg-black">
            <div className="space-y-4 text-left">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wide">Time Elapsed</label>
                  <span className="text-[10px] font-bold font-mono border border-gray-200 bg-white px-2 py-0.5 rounded">
                    {vestingMonths} Months
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="48"
                  step="1"
                  value={vestingMonths}
                  onChange={(e) => setVestingMonths(Number(e.target.value))}
                  onMouseUp={() => saveState(shares)}
                  onTouchEnd={() => saveState(shares)}
                  className="w-full accent-black cursor-pointer"
                />
              </div>

              {/* Status details */}
              <div className="p-4 bg-[#FAF9F6] border border-gray-200 rounded-xl space-y-3">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Vesting Cliff:</span>
                  <span className="uppercase text-[9px] px-2 py-0.5 rounded font-bold bg-white border border-gray-200">
                    {vestingMonths >= 12 ? 'Passed' : 'Not Met'}
                  </span>
                </div>

                <div className="h-5 border border-gray-200 rounded-full flex overflow-hidden bg-gray-100">
                  <div style={{ width: `${vestedPercent}%` }} className="bg-[#C8E64A] h-full transition-all" />
                </div>

                <div className="flex justify-between text-[11px] font-bold text-gray-500 pt-1">
                  <span>Vested: {vestedPercent.toFixed(1)}%</span>
                  <span>Unvested: {unvestedPercent.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Legal Brief Output */}
          {briefGenerated && shares && (
            <div className="os-card p-4 bg-[#FAF9F6] border border-[#C8E64A]/30 text-left space-y-2 relative select-text">
              <span className="text-[9px] font-bold uppercase text-[#EF4444] block tracking-wide font-outfit">AGREEMENT BRIEF DRAFT</span>
              <p className="text-[11px] font-semibold text-gray-600 leading-relaxed font-mono whitespace-pre-line text-black">
                {`FOUNDER ACCELERATED VESTING BRIEF
---------------------------------------
Startup Cap Table Division:
- ${f1Name}: ${shares.f1}% Equity
- ${f2Name}: ${shares.f2}% Equity
- ${f3Name}: ${shares.f3}% Equity

Vesting Terms:
- Standard 48-Month Period
- 12-Month Cliff Target (25% Release)
- Monthly linear release for remainder

Agreement consensus stamped by Stratify OS. Verified on ${new Date().toLocaleDateString()}.`}
              </p>
            </div>
          )}
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
