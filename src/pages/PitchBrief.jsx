import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldAlert, ExternalLink, Lock, Check, Copy, Edit3, Globe, Shield, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import BentoCard from '../components/BentoCard';

export default function PitchBrief({ mode = 'builder', founderProfile }) {
 const { id } = useParams();
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [copied, setCopied] = useState(false);
 const [error, setError] = useState(null);

 // Form states
 const [briefId, setBriefId] = useState('');
 const [pitch, setPitch] = useState('');
 const [problem, setProblem] = useState('');
 const [solution, setSolution] = useState('');
 const [isPublic, setIsPublic] = useState(true);
 const [whitelistInput, setWhitelistInput] = useState('');
 const [deckUrl, setDeckUrl] = useState('');
 const [showRunway, setShowRunway] = useState(true);
 const [score, setScore] = useState(10);

 useEffect(() => {
 if (mode === 'builder') {
 fetchMyBrief();
 } else {
 fetchPublicBrief();
 }
 }, [id, mode]);

 const fetchMyBrief = async () => {
 setLoading(true);
 try {
 const res = await fetch('/api/briefs');
 if (res.ok) {
 const data = await res.json();
 if (data.briefs && data.briefs.length > 0) {
 const b = data.briefs[0];
 setBriefId(b.id);
 setPitch(b.pitch);
 setProblem(b.problem);
 setSolution(b.solution);
 setIsPublic(b.isPublic);
 setWhitelistInput(b.whitelist ? b.whitelist.join(', ') : '');
 setDeckUrl(b.deckUrl);
 setShowRunway(b.showRunway);
 }
 }
 } catch (e) {
 console.error('Failed to load my brief:', e);
 } finally {
 setLoading(false);
 }
 };

 const fetchPublicBrief = async () => {
 setLoading(true);
 setError(null);
 try {
 const res = await fetch(`/api/briefs/${id}`);
 if (res.ok) {
 const data = await res.json();
 const b = data.brief;
 setBriefId(b.id);
 setPitch(b.pitch);
 setProblem(b.problem);
 setSolution(b.solution);
 setIsPublic(b.isPublic);
 setDeckUrl(b.deckUrl);
 setShowRunway(b.showRunway);
 setScore(b.score || 10);
 } else {
 if (res.status === 403) {
 setError({ type: 'UNAUTHORIZED', message: 'Access denied. You are not on the investor whitelist for this strategic data room.' });
 } else {
 setError({ type: 'NOT_FOUND', message: 'The requested pitch brief or data room was not found.' });
 }
 }
 } catch (e) {
 setError({ type: 'ERROR', message: 'Failed to establish connection to data room.' });
 } finally {
 setLoading(false);
 }
 };

 const handleSave = async (e) => {
 e.preventDefault();
 setSaving(true);
 const whitelist = whitelistInput
 .split(',')
 .map(item => item.trim())
 .filter(item => item.length > 0);

 try {
 const res = await fetch('/api/briefs', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json'
 },
 body: JSON.stringify({
 pitch,
 problem,
 solution,
 isPublic,
 whitelist,
 deckUrl,
 showRunway
 })
 });

 if (res.ok) {
 const data = await res.json();
 setBriefId(data.brief.id);
 confetti({
 particleCount: 80,
 spread: 50,
 colors: ['#EF4444', '#FCD34D', '#3B82F6']
 });
 }
 } catch (err) {
 console.error('Failed to save brief:', err);
 } finally {
 setSaving(false);
 }
 };

 const copyLink = () => {
 const link = `${window.location.origin}/brief/${briefId}`;
 navigator.clipboard.writeText(link);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 };

 if (loading) {
 return (
 <div className="max-w-xl mx-auto py-24 text-center">
 <RefreshCw size={36} className="mx-auto animate-spin text-[#3B82F6]" />
 <span className="font-outfit font-black uppercase text-xs tracking-wider mt-4 block">Accessing Strategic Vault...</span>
 </div>
);
 }

 // Whitelist Lock Screen
 if (error && error.type === 'UNAUTHORIZED') {
 return (
 <div className="max-w-2xl mx-auto px-4 py-16 relative z-10">
 <div className="os-card bg-white p-8 text-center select-none">
 <div className="inline-flex p-4 bg-red-500 text-white mb-6">
 <Lock size={40} />
 </div>
 <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight mb-2 text-black">
 Restricted Data Room
 </h1>
 <div className="inline-block bg-red-500 text-white px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider mb-4 border border-black">
 Whitelist Authorization Required
 </div>
 <p className="font-outfit font-bold text-gray-600 max-w-md mx-auto mb-6 text-sm">
 {error.message}
 </p>
 <div className="border-2 border-black p-4 bg-gray-50 max-w-sm mx-auto mb-6 text-left">
 <span className="text-[9px] font-black uppercase text-gray-400 block mb-1">Authorization Loop</span>
 <p className="text-xs font-semibold text-gray-600">
 Only whitelisted investor emails or domains (e.g. your-vc-fund.com) configured by the founder can unlock these credentials.
 </p>
 </div>
 <div className="flex gap-4 justify-center">
 <Link to="/" className="px-4 py-2 font-black text-xs uppercase bg-white text-black hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
 Return Home
 </Link>
 </div>
 </div>
 </div>
);
 }

 // Not Found Error
 if (error) {
 return (
 <div className="max-w-2xl mx-auto px-4 py-16 relative z-10">
 <div className="os-card bg-white p-8 text-center select-none">
 <div className="inline-flex p-4 bg-yellow-400 text-black mb-6">
 <ShieldAlert size={40} />
 </div>
 <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight mb-2 text-black">
 Vault Error
 </h1>
 <p className="font-outfit font-bold text-gray-600 max-w-md mx-auto mb-6 text-sm">
 {error.message}
 </p>
 <Link to="/" className="px-4 py-2 bg-red-500 text-white font-black text-xs uppercase hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
 Return Home
 </Link>
 </div>
 </div>
);
 }

 // 1. PUBLIC VIEW MODE
 if (mode === 'public') {
 return (
 <div className="max-w-4xl mx-auto px-4 py-8 relative z-10 space-y-6">
 {/* Startup Pitch Header */}
 <div className="os-card bg-white text-black p-8 select-none relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
 <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500 rounded-full opacity-80 pointer-events-none hidden md:block"></div>
 
 <div className="relative z-10 space-y-2">
 <div className="flex gap-2">
 <span className="inline-block bg-blue-600 text-white px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider border border-black">
 Grounded Strategic Brief
 </span>
 <span className="inline-block bg-white text-black px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider border-2 border-black flex items-center gap-1">
 <Globe size={10} className="text-[#A3E635]" /> {isPublic ? 'PUBLIC DATA ROOM' : 'RESTRICTED VAULT'}
 </span>
 </div>
 <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-black">
 {pitch ? pitch.split(' ').slice(0, 3).join(' ') : 'STEALTH'} BRIEF
 </h1>
 <p className="font-outfit font-bold text-gray-500 text-xs sm:text-sm">
 Live Network Score: <span className="font-black text-[#EF4444]">{score}</span>
 </p>
 </div>

 {deckUrl && (
 <a
 href={deckUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="relative z-10 inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-400 text-black font-black text-xs uppercase active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:-translate-x-[1px] hover:-translate-y-[1px] hover: transition-all cursor-pointer"
 >
 <ExternalLink size={14} />
 <span>ACCESS PITCH SLIDES</span>
 </a>
)}
 </div>

 {/* Pitch Data Rows */}
 <div className="grid grid-cols-12 gap-6">
 <div className="col-span-12 md:col-span-6">
 <BentoCard title="The Problem Statement" badge="PAIN POINT AUDIT" badgeColor="bg-red-500">
 <div className="border-2 border-black p-5 bg-[#F8F7F4] flex-1">
 <p className="font-outfit font-semibold text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
 {problem || 'No problem statement defined.'}
 </p>
 </div>
 </BentoCard>
 </div>

 <div className="col-span-12 md:col-span-6">
 <BentoCard title="The Solution Wedge" badge="PRODUCT DEFENSE" badgeColor="bg-blue-600">
 <div className="border-2 border-black p-5 bg-[#F8F7F4] flex-1">
 <p className="font-outfit font-semibold text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
 {solution || 'No solution details defined.'}
 </p>
 </div>
 </BentoCard>
 </div>

 {/* Runway indicators if visibility toggled */}
 {showRunway && (
 <div className="col-span-12">
 <BentoCard title="Strategic Runway Posture" badge="VERIFIED LIVE GRAPH" badgeColor="bg-emerald-500">
 <div className="border-2 border-black p-6 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
 <div className="space-y-1.5 text-center sm:text-left">
 <h4 className="font-outfit font-black text-base uppercase">Financial Health Verified</h4>
 <p className="text-xs text-gray-500 font-semibold max-w-lg leading-tight">
 This startup has linked their interactive runway tools. The live forecast demonstrates sustainable capitalization loops.
 </p>
 </div>
 <Link to="/runway" className="px-4 py-2 font-black text-xs uppercase bg-emerald-500 text-black hover:-translate-x-[1px] hover:-translate-y-[1px] hover: transition-all">
 Open Runway Planner
 </Link>
 </div>
 </BentoCard>
 </div>
)}
 </div>
 </div>
);
 }

 // 2. BUILDER MODE
 return (
 <div className="max-w-4xl mx-auto px-4 py-8 relative z-10 space-y-6">
 {/* Title */}
 <div className="os-card bg-white text-black p-8 select-none relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-600 rounded-full opacity-80 pointer-events-none hidden md:block"></div>
 <div>
 <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
 Pitch Brief & Data Room
 </h1>
 <p className="font-outfit font-bold text-gray-600 mt-1">
 Build whitelisted briefs, manage investor access, and share verified startup scores.
 </p>
 </div>
 </div>

 <div className="grid grid-cols-12 gap-6">
 {/* Left Side: Builder Form */}
 <div className="col-span-12 lg:col-span-7">
 <BentoCard title="Compile Pitch Brief" badge="DATA ROOM SETTINGS" badgeColor="bg-yellow-400">
 <form onSubmit={handleSave} className="space-y-4">
 {/* Pitch */}
 <div>
 <label className="block text-xs font-black uppercase text-gray-700 mb-1.5">Elevator Pitch</label>
 <input
 type="text"
 value={pitch}
 onChange={(e) => setPitch(e.target.value)}
 placeholder="e.g. Decentralized cold brew subscription networks..."
 required
 className="w-full p-3 border-2 border-black font-outfit text-sm bg-gray-50 focus:outline-none text-black"
 />
 </div>

 {/* Problem */}
 <div>
 <label className="block text-xs font-black uppercase text-gray-700 mb-1.5">The Problem</label>
 <textarea
 value={problem}
 onChange={(e) => setProblem(e.target.value)}
 placeholder="What customer gap does your startup address?"
 rows={3}
 required
 className="w-full p-3 border-2 border-black font-outfit text-sm bg-gray-50 focus:outline-none text-black"
 />
 </div>

 {/* Solution */}
 <div>
 <label className="block text-xs font-black uppercase text-gray-700 mb-1.5">The Solution</label>
 <textarea
 value={solution}
 onChange={(e) => setSolution(e.target.value)}
 placeholder="How does your product validate customer retention?"
 rows={3}
 required
 className="w-full p-3 border-2 border-black font-outfit text-sm bg-gray-50 focus:outline-none text-black"
 />
 </div>

 {/* Pitch Slides Link */}
 <div>
 <label className="block text-xs font-black uppercase text-gray-700 mb-1.5">Pitch Deck Link (Vercel, Slideshare, PDF URL)</label>
 <input
 type="url"
 value={deckUrl}
 onChange={(e) => setDeckUrl(e.target.value)}
 placeholder="https://..."
 className="w-full p-3 border-2 border-black font-outfit text-sm bg-gray-50 focus:outline-none text-black"
 />
 </div>

 {/* Toggles */}
 <div className="grid grid-cols-2 gap-4 pt-2">
 <div className="border-2 border-black p-3 bg-gray-50 select-none">
 <span className="block text-[9px] font-black uppercase text-gray-500 mb-1.5">Runway Visibility</span>
 <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
 <input
 type="checkbox"
 checked={showRunway}
 onChange={(e) => setShowRunway(e.target.checked)}
 className="accent-black cursor-pointer w-4 h-4 border-2 border-black rounded-none"
 />
 <span>Show Runway Status</span>
 </label>
 </div>

 <div className="border-2 border-black p-3 bg-gray-50 select-none">
 <span className="block text-[9px] font-black uppercase text-gray-500 mb-1.5">Access Scope</span>
 <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
 <input
 type="checkbox"
 checked={isPublic}
 onChange={(e) => setIsPublic(e.target.checked)}
 className="accent-black cursor-pointer w-4 h-4 border-2 border-black rounded-none"
 />
 <span>Open Publicly</span>
 </label>
 </div>
 </div>

 {/* Whitelist Configuration (if not public) */}
 {!isPublic && (
 <div className="border-2 border-black p-4 bg-gray-50">
 <label className="block text-xs font-black uppercase text-gray-700 mb-1">
 Investor Whitelist (Comma-separated emails or domains)
 </label>
 <input
 type="text"
 value={whitelistInput}
 onChange={(e) => setWhitelistInput(e.target.value)}
 placeholder="e.g. partner@sequoia.com, tigerglobal.com, angelinvestor@gmail.com"
 className="w-full p-3 border-2 border-black font-outfit text-sm bg-white focus:outline-none text-black"
 />
 <span className="block text-[9px] font-bold text-gray-400 mt-1">
 Whitelists filter emails or entire email domains automatically.
 </span>
 </div>
)}

 <button
 type="submit"
 disabled={saving}
 className="w-full py-3 bg-red-500 text-white font-black text-xs uppercase active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:-translate-x-[1px] hover:-translate-y-[1px] hover: transition-all flex items-center justify-center gap-2 cursor-pointer"
 >
 <span>{saving ? 'COMPILING VAULT...' : 'SAVE & COMPILE BRIEF'}</span>
 </button>
 </form>
 </BentoCard>
 </div>

 {/* Right Side: Data Room Access Hub */}
 <div className="col-span-12 lg:col-span-5">
 <BentoCard title="Access Hub" badge="DISTRIBUTION CENTER" badgeColor="bg-blue-600">
 {briefId ? (
 <div className="space-y-4 h-full flex flex-col justify-between">
 <div className="space-y-4">
 <div className="border-2 border-black p-4 bg-gray-50 text-left">
 <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Vault Status</span>
 <div className="flex items-center gap-2">
 <span className={`w-3 h-3 rounded-full ${isPublic ? 'bg-emerald-500' : 'bg-red-500'} border-2 border-black`} />
 <span className="font-outfit font-black text-xs uppercase">
 {isPublic ? 'PUBLIC BROADCASTING ACTIVE' : 'WHitelisted ACCESS RESTRICTION ACTIVE'}
 </span>
 </div>
 </div>

 <div className="border-2 border-black p-4 bg-[#F8F7F4] text-left">
 <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Direct Data Room Link</span>
 <div className="flex items-center gap-2 border-2 border-black bg-white p-2.5 select-all">
 <span className="font-mono text-[10px] truncate flex-1 text-black">
 {window.location.origin}/brief/{briefId}
 </span>
 <button
 onClick={copyLink}
 className="p-1 hover:bg-gray-100 border border-black cursor-pointer"
 title="Copy Link"
 >
 {copied ? <Check size={14} className="text-[#A3E635]" /> : <Copy size={14} />}
 </button>
 </div>
 </div>
 </div>

 <div className=" p-4 bg-white flex flex-col items-center justify-center text-center py-8">
 <Globe size={40} className="text-[#3B82F6] mb-3" />
 <h4 className="font-outfit font-black text-sm uppercase">Open Public Preview</h4>
 <p className="text-[10px] text-gray-500 font-semibold mb-4 leading-tight">
 Analyze how whitelisted investors see your presentation.
 </p>
 <Link
 to={`/brief/${briefId}`}
 className="px-4 py-2 bg-emerald-500 text-black font-black text-xs uppercase hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
 >
 Launch Data Room
 </Link>
 </div>
 </div>
) : (
 <div className="text-center py-12 text-gray-500 font-outfit font-black text-xs uppercase select-none border-2 border-dashed border-gray-300">
 Save your first brief to compile the data room distribution links.
 </div>
)}
 </BentoCard>
 </div>
 </div>
 </div>
);
}
