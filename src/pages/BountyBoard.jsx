import React, { useState, useEffect } from 'react';
import { Sparkles, Cpu, Award, ExternalLink, CheckCircle, Clock, Send, ArrowRight } from 'lucide-react';
import BentoCard from '../components/BentoCard';
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
 colors: ['#A3E635', '#000000']
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
 colors: ['#A3E635', '#3B82F6', '#EF4444']
 });
 }
 } catch (e) {
 console.error('Failed to submit bounty:', e);
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <div className="max-w-6xl mx-auto px-4 py-12">
 {/* Header Banner */}
 <div className="os-card bg-black text-[#A3E635] p-8 sm:p-12 mb-8 relative overflow-hidden select-none text-left">
 <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 opacity-5 rounded-full transform translate-x-20 -translate-y-20"></div>
 <div className="relative z-10 space-y-2">
 <span className="inline-block bg-emerald-500 text-black px-2.5 py-1 border-2 border-black font-outfit font-black text-[10px] uppercase tracking-wider">
 Consensus Execution Engine
 </span>
 <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
 Micro-Sprint Bounty Station
 </h1>
 <p className="font-outfit font-bold text-gray-400 max-w-xl text-xs sm:text-sm leading-relaxed">
 Connect startups needing execution with builders, engineers, and students ready to ship. Verification agents audit work instantly.
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 
 {/* Left Column (Active Bounties Board) */}
 <div className="lg:col-span-2 space-y-6">
 <BentoCard title="Active Sprint Bounties" badge="OPEN TASK POOL" badgeColor="bg-blue-600">
 {loading ? (
 <div className="flex justify-center py-12">
 <div className="w-10 h-10 border-t-transparent rounded-full animate-spin"></div>
 </div>
) : bounties.length === 0 ? (
 <div className="border-2 border-dashed border-gray-300 p-8 text-center text-gray-500 font-outfit font-bold text-xs uppercase rounded-none">
 No active sprint bounties at the moment.
 </div>
) : (
 <div className="space-y-4">
 {bounties.map((bounty) => (
 <div key={bounty.id} className="border-3 border-black p-4 bg-white text-left space-y-3 hover:translate-y-[-1px] transition-transform">
 <div className="flex justify-between items-start flex-wrap gap-2">
 <div>
 <span className="inline-block bg-gray-150 border border-black text-[8px] font-black uppercase px-2 py-0.5 mb-1.5 text-black">
 By {bounty.startupName}
 </span>
 <h4 className="font-outfit font-black text-sm uppercase text-black">{bounty.title}</h4>
 </div>
 <div className="flex gap-2">
 <span className="bg-emerald-500 text-black border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
 {bounty.reward}
 </span>
 <span className="bg-purple-600 text-black border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
 +{bounty.points} Score
 </span>
 </div>
 </div>

 <p className="text-xs font-bold text-gray-650 leading-relaxed">
 {bounty.description}
 </p>

 <div className="pt-3 border-t border-gray-100 flex justify-between items-center flex-wrap gap-2">
 <span className={`text-[9px] font-black uppercase border px-2 py-0.5 ${
 bounty.status === 'completed' ? 'bg-emerald-500/25 border-green-500 text-green-700' : 'bg-yellow-50 border-yellow-500 text-yellow-700'
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
 className="px-3 py-1 bg-black text-white border-2 border-black text-[10px] font-black uppercase hover:bg-gray-800 cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
 >
 Submit Proof of Work
 </button>
) : (
 <div className="space-y-1 text-right w-full sm:w-auto">
 {bounty.submissions?.map((sub, idx) => (
 <div key={idx} className="flex items-center justify-end gap-1.5 text-[9px] font-bold text-gray-500">
 <span>Solved by {sub.builderName}</span>
 <a href={sub.prLink} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 flex items-center gap-0.5 font-black uppercase">
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
 <BentoCard title="Launch a Micro Bounty" badge="FOUNDER UTILITY" badgeColor="bg-red-500">
 <form onSubmit={handleCreateBounty} className="space-y-4">
 <div>
 <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Bounty Task Title</label>
 <input
 type="text"
 required
 value={newTitle}
 onChange={(e) => setNewTitle(e.target.value)}
 placeholder="e.g. Set up Redis caching layer"
 className="w-full p-2 border-2 border-black font-outfit text-xs focus:outline-none bg-gray-50 text-black text-left"
 />
 </div>
 <div>
 <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Task Requirements</label>
 <textarea
 required
 value={newDescription}
 onChange={(e) => setNewDescription(e.target.value)}
 placeholder="Provide specific acceptance criteria (PR repository check, test builds, etc.)"
 rows={3}
 className="w-full p-2 border-2 border-black font-outfit text-xs focus:outline-none bg-gray-50 text-black text-left"
 />
 </div>
 
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Score Reward</label>
 <input
 type="number"
 required
 value={newPoints}
 onChange={(e) => setNewPoints(Number(e.target.value))}
 className="w-full p-2 border-2 border-black font-outfit text-xs focus:outline-none bg-gray-50 text-black text-left"
 />
 </div>
 <div>
 <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Financial Reward</label>
 <input
 type="text"
 required
 value={newReward}
 onChange={(e) => setNewReward(e.target.value)}
 placeholder="e.g. $150 or Equity"
 className="w-full p-2 border-2 border-black font-outfit text-xs focus:outline-none bg-gray-50 text-black text-left"
 />
 </div>
 </div>

 <button
 type="submit"
 disabled={posting}
 className="w-full py-2.5 bg-red-500 text-white border-2 border-black font-black text-xs uppercase active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover: transition-all cursor-pointer text-center"
 >
 {posting ? 'LAUNCHING...' : 'PUBLISH BOUNTY'}
 </button>
 </form>
 </BentoCard>
)}

 {/* Builder Submission Panel */}
 {selectedBounty && (
 <BentoCard title="Claim & Submit Proof" badge="BUILDER VERIFICATION" badgeColor="bg-purple-600">
 <form onSubmit={handleSubmitBounty} className="space-y-4">
 <div className="border-2 border-black p-3 bg-[#F8F7F4] text-left">
 <span className="text-[9px] font-black uppercase text-gray-400 block">Claiming Bounty</span>
 <h4 className="font-outfit font-black text-xs uppercase text-black">{selectedBounty.title}</h4>
 <span className="text-[9px] bg-black text-white px-1.5 py-0.2 mt-1 inline-block uppercase font-black">
 {selectedBounty.reward} Value
 </span>
 </div>

 <div>
 <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Proof of Work URL (PR or Live Deployment)</label>
 <input
 type="url"
 required
 value={prLink}
 onChange={(e) => setPrLink(e.target.value)}
 placeholder="https://github.com/org/repo/pull/12"
 className="w-full p-2.5 border-2 border-black font-outfit text-xs focus:outline-none bg-gray-50 text-black text-left"
 />
 </div>

 {/* Subagent Console Log */}
 {(verifying || verifyLogs.length > 0) && (
 <div className="border-2 border-black p-3 bg-black text-green-400 font-mono text-[10px] select-text space-y-1 text-left">
 <div className="flex items-center justify-between border-b border-green-950 pb-1 mb-1.5">
 <span className="text-[9px] uppercase tracking-wider font-bold">Verification Agent Console</span>
 {verifying && <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>}
 </div>
 {verifyLogs.map((log, idx) => (
 <div key={idx}>{log}</div>
))}
 </div>
)}

 <div className="flex gap-2">
 <button
 type="submit"
 disabled={verifying || submitting}
 className="flex-1 py-2.5 bg-emerald-500 text-black border-2 border-black font-black text-xs uppercase active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover: transition-all cursor-pointer text-center"
 >
 {verifying ? 'AUDITING...' : 'VERIFY & SUBMIT'}
 </button>
 <button
 type="button"
 onClick={() => setSelectedBounty(null)}
 className="py-2.5 px-3 border-2 border-black font-black text-xs uppercase bg-white hover:bg-gray-50 cursor-pointer"
 >
 Cancel
 </button>
 </div>
 </form>
 </BentoCard>
)}

 {/* Builder Guide Info */}
 <div className="os-card bg-[#F8F7F4] p-5 select-none text-center">
 <Cpu size={32} className="mx-auto mb-2 text-[#C084FC]" />
 <h4 className="font-outfit font-black text-xs uppercase">Builder Reputation Engine</h4>
 <p className="text-[10px] font-bold text-gray-500 mt-1 leading-normal">
 Students and builders claiming bounties earn Score points directly added to their profile status, forming a verified ledger of technical capabilities.
 </p>
 </div>
 </div>

 </div>
 </div>
);
}
