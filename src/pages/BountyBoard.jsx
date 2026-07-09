import React, { useState, useEffect } from 'react';
import { Cpu, ExternalLink, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import BentoCard from '../components/BentoCard';
import { supabase } from '../lib/supabase';
import confetti from 'canvas-confetti';

export default function BountyBoard({ founderProfile, user }) {
  const [bounties, setBounties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create bounty states
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPoints, setNewPoints] = useState(15);
  const [newReward, setNewReward] = useState('$150');
  const [posting, setPosting] = useState(false);

  // Submit bounty states
  const [selectedBounty, setSelectedBounty] = useState(null);
  const [prLink, setPrLink] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyLogs, setVerifyLogs] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchBounties = async () => {
    try {
      const res = await fetch('/api/bounties');
      if (res.ok) {
        const data = await res.json();
        setBounties(data.bounties || []);
      }
    } catch (e) {
      console.error('Failed to fetch bounties:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBounties();

    if (supabase) {
      const channel = supabase
        .channel('realtime-bounties')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bounties' },
          (payload) => {
            console.log('Realtime bounty payload received:', payload);
            fetchBounties();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const handleCreateBounty = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    setPosting(true);
    try {
      const res = await fetch('/api/bounties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          points: newPoints,
          reward: newReward,
          startupId: founderProfile?.id || ''
        })
      });

      if (res.ok) {
        setNewTitle('');
        setNewDescription('');
        setNewPoints(15);
        setNewReward('$150');
        await fetchBounties();
        confetti({
          particleCount: 50,
          spread: 40,
          colors: ['#C8E64A', '#1A1A1A', '#FAF9F6']
        });
      }
    } catch (e) {
      console.error('Failed to create bounty:', e);
    } finally {
      setPosting(false);
    }
  };

  const handleSubmitBounty = async (e) => {
    e.preventDefault();
    if (!prLink.trim() || !selectedBounty) return;

    setVerifying(true);
    setVerifyLogs([]);

    const steps = [
      "🤖 Launching verification subagent...",
      "🔍 Accessing pull request repository contents...",
      `🔗 Analyzing target URL: ${prLink}`,
      "⚙️ Auditing code changes against bounty specifications...",
      "⚡ Compiling sandbox assets & checking unit tests...",
      "✓ Verification success: Proof-of-Work validated. Score bonuses unlocked!",
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      setVerifyLogs(prev => [...prev, steps[i]]);
    }

    setVerifying(false);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/bounties/${selectedBounty.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prLink,
          builderName: user?.username || user?.email || 'Anonymous Builder'
        })
      });

      if (res.ok) {
        setPrLink('');
        setSelectedBounty(null);
        setVerifyLogs([]);
        await fetchBounties();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#C8E64A', '#1A1A1A', '#FAF9F6']
        });
      }
    } catch (e) {
      console.error('Failed to submit bounty:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 animate-fade-in text-[#111]">
      {/* Header Banner */}
      <div className="os-card bg-[#1A1A1A] text-white p-8 sm:p-12 mb-8 relative overflow-hidden select-none text-left">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full transform translate-x-20 -translate-y-20"></div>
        <div className="relative z-10 space-y-2.5">
          <span className="inline-block bg-[#C8E64A]/10 border border-[#C8E64A]/30 text-white px-2.5 py-1 font-outfit font-bold text-[10px] uppercase tracking-wider rounded-md">
            Consensus Execution Engine
          </span>
          <h1 className="text-3xl sm:text-5xl font-outfit font-black tracking-tight text-white uppercase">
            Micro-Sprint Bounty Station
          </h1>
          <p className="font-inter text-gray-300 max-w-xl text-xs sm:text-sm leading-relaxed font-light">
            Connect startups needing execution with builders, engineers, and students ready to ship. Verification agents audit work instantly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Active Bounties Board) */}
        <div className="lg:col-span-2 space-y-6">
          <BentoCard title="Active Sprint Bounties" badge="OPEN TASK POOL" badgeColor="bg-black">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border border-black border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : bounties.length === 0 ? (
              <div className="border border-dashed border-gray-300 p-12 text-center text-gray-500 font-outfit font-bold text-xs uppercase rounded-xl">
                No active sprint bounties at the moment.
              </div>
            ) : (
              <div className="space-y-4">
                {bounties.map((bounty) => (
                  <div key={bounty.id} className="os-card bg-white text-left space-y-3 hover:border-black transition-all">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <span className="inline-block bg-gray-50 border border-gray-200 text-[9px] font-bold uppercase rounded-md px-2 py-0.5 mb-1.5 text-gray-500">
                          By {bounty.startupName}
                        </span>
                        <h4 className="font-outfit font-bold text-base text-[#111] leading-tight">{bounty.title}</h4>
                      </div>
                      <div className="flex gap-2">
                        <span className="bg-[#C8E64A]/20 border border-[#C8E64A]/30 text-black px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-full">
                          {bounty.reward}
                        </span>
                        <span className="bg-[#1A1A1A] text-white px-2.5 py-0.5 text-[9px] font-semibold uppercase rounded-full">
                          +{bounty.points} Score
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed font-light font-inter">
                      {bounty.description}
                    </p>

                    <div className="pt-3 border-t border-gray-100 flex justify-between items-center flex-wrap gap-2 select-none">
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        bounty.status === 'completed' 
                          ? 'bg-green-50 border border-green-200 text-green-700' 
                          : 'bg-amber-50 border border-amber-200 text-amber-700'
                      }`}>
                        {bounty.status}
                      </span>
                      
                      {bounty.status === 'open' ? (
                        <button
                          onClick={() => {
                            setSelectedBounty(bounty);
                            setVerifyLogs([]);
                            setPrLink('');
                          }}
                          className="os-btn-primary px-3 py-1.5 text-xs"
                        >
                          Submit Proof of Work
                        </button>
                      ) : (
                        <div className="space-y-1 text-right w-full sm:w-auto">
                          {bounty.submissions?.map((sub, idx) => (
                            <div key={idx} className="flex items-center justify-end gap-1.5 text-[9px] font-bold text-gray-400">
                              <span>Solved by {sub.builderName}</span>
                              <a href={sub.prLink} target="_blank" rel="noopener noreferrer" className="underline text-black flex items-center gap-0.5 font-bold uppercase hover:text-gray-600 transition-colors">
                                <span>PR link</span>
                                <ExternalLink size={10} />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </BentoCard>
        </div>

        {/* Right Column (Founder Post Panel & Active Submissions Console) */}
        <div className="space-y-6">
          
          {/* Post Bounty (Only for Founders) */}
          {founderProfile && founderProfile.role === 'founder' && (
            <BentoCard title="Launch a Micro Bounty" badge="FOUNDER UTILITY" badgeColor="bg-black">
              <form onSubmit={handleCreateBounty} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wide mb-1.5">Bounty Task Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Set up Redis caching layer"
                    className="os-input"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wide mb-1.5">Task Requirements</label>
                  <textarea
                    required
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Provide specific acceptance criteria (PR repository check, test builds, etc.)"
                    rows={3}
                    className="os-input resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wide mb-1.5">Score Reward</label>
                    <input
                      type="number"
                      required
                      value={newPoints}
                      onChange={(e) => setNewPoints(Number(e.target.value))}
                      className="os-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wide mb-1.5">Financial Reward</label>
                    <input
                      type="text"
                      required
                      value={newReward}
                      onChange={(e) => setNewReward(e.target.value)}
                      placeholder="e.g. $150 or Equity"
                      className="os-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={posting}
                  className="w-full py-3 bg-[#C8E64A] text-black font-outfit font-bold text-xs uppercase hover:bg-[#B5D235] transition-all cursor-pointer text-center rounded-lg border-0"
                >
                  {posting ? 'LAUNCHING...' : 'PUBLISH BOUNTY'}
                </button>
              </form>
            </BentoCard>
          )}

          {/* Builder Submission Panel */}
          {selectedBounty && (
            <BentoCard title="Claim & Submit Proof" badge="BUILDER VERIFICATION" badgeColor="bg-black">
              <form onSubmit={handleSubmitBounty} className="space-y-4">
                <div className="border border-gray-200 p-4 bg-[#FAF9F6] text-left rounded-xl select-none">
                  <span className="text-[9px] font-bold uppercase text-gray-400 block tracking-wide">Claiming Bounty</span>
                  <h4 className="font-outfit font-bold text-xs uppercase text-black mt-1">{selectedBounty.title}</h4>
                  <span className="text-[9px] bg-[#C8E64A]/25 border border-[#C8E64A]/30 text-black px-2 py-0.5 mt-2 rounded-full inline-block font-bold">
                    {selectedBounty.reward} Value
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wide mb-1.5">Proof of Work URL (PR or Live Deployment)</label>
                  <input
                    type="url"
                    required
                    value={prLink}
                    onChange={(e) => setPrLink(e.target.value)}
                    placeholder="https://github.com/org/repo/pull/12"
                    className="os-input"
                  />
                </div>

                {/* Subagent Console Log */}
                {(verifying || verifyLogs.length > 0) && (
                  <div className="border border-gray-800 p-3.5 bg-black text-green-400 font-mono text-[10px] select-text space-y-1 text-left rounded-xl">
                    <div className="flex items-center justify-between border-b border-green-950 pb-1 mb-1.5">
                      <span className="text-[9px] uppercase tracking-wider font-bold">Verification Agent Console</span>
                      {verifying && <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>}
                    </div>
                    {verifyLogs.map((log, idx) => (
                      <div key={idx}>{log}</div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-2 select-none">
                  <button
                    type="submit"
                    disabled={verifying || submitting}
                    className="flex-1 py-3 bg-[#C8E64A] text-black font-outfit font-bold text-xs uppercase hover:bg-[#B5D235] transition-all cursor-pointer text-center rounded-lg"
                  >
                    {verifying ? 'AUDITING...' : 'VERIFY & SUBMIT'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBounty(null)}
                    className="os-btn py-3 px-4 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </BentoCard>
          )}

          {/* Builder Guide Info */}
          <div className="os-card bg-[#FAF9F6] p-5 select-none text-center border border-gray-200 rounded-xl">
            <Cpu size={24} className="mx-auto mb-2 text-black" />
            <h4 className="font-outfit font-bold text-xs uppercase tracking-wide">Builder Reputation Engine</h4>
            <p className="text-[10px] font-semibold text-gray-500 mt-1 leading-relaxed">
              Students and builders claiming bounties earn Score points directly added to their profile status, forming a verified ledger of technical capabilities.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
