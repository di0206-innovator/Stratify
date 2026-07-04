import React, { useState, useEffect } from 'react';
import { BrainCircuit, Plus, Target, CheckCircle, XCircle, ArrowRight, RefreshCw, MessageSquare } from 'lucide-react';
import AuthGate from '../components/AuthGate';

export default function FounderMemory({ founderProfile, user, openAuthModal }) {
 const [decisions, setDecisions] = useState([]);
 const [loading, setLoading] = useState(true);
 const [showForm, setShowForm] = useState(false);
 
 const [title, setTitle] = useState('');
 const [context, setContext] = useState('');
 const [outcome, setOutcome] = useState('');
 const [status, setStatus] = useState('active');

 const fetchDecisions = async () => {
 setLoading(true);
 try {
 const res = await fetch('/api/decisions');
 if (res.ok) {
 const data = await res.json();
 setDecisions(data.decisions || []);
 }
 } catch (e) {
 console.error('Fetch error:', e);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchDecisions();
 }, []);

 const handleSubmit = async (e) => {
 e.preventDefault();
 try {
 const res = await fetch('/api/decisions', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ title, context, outcome, status })
 });
 if (res.ok) {
 setShowForm(false);
 setTitle('');
 setContext('');
 setOutcome('');
 setStatus('active');
 fetchDecisions();
 }
 } catch (e) {
 console.error('Post error:', e);
 }
 };

 return (
 <AuthGate user={user} openAuthModal={openAuthModal} message="Sign in to access your Founder Memory — a strategic record of decisions, pivots, and experiments.">
 <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
 {/* Header */}
 <div className="bg-white p-6 -hard flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="bg-purple-600 p-3.5 text-black">
 <BrainCircuit size={22} strokeWidth={3} />
 </div>
 <div>
 <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Founder Memory</h1>
 <p className="text-sm font-bold text-gray-500">
 Log decisions and experiments. Build your startup's strategic brain.
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button
 onClick={() => setShowForm(!showForm)}
 className="flex items-center gap-2 bg-emerald-500 px-4 py-2 font-black text-sm uppercase hover: transition-all"
 >
 {showForm ? 'Cancel' : <><Plus size={16} strokeWidth={3} /> Log Decision</>}
 </button>
 <button
 onClick={fetchDecisions}
 className="bg-white p-2 hover: transition-all"
 >
 <RefreshCw size={16} strokeWidth={3} />
 </button>
 </div>
 </div>

 {/* Form */}
 {showForm && (
 <form onSubmit={handleSubmit} className="bg-white p-6 -hard space-y-4">
 <div>
 <label className="block text-sm font-black uppercase mb-1">Decision / Hypothesis Title</label>
 <input 
 required
 value={title}
 onChange={e => setTitle(e.target.value)}
 className="w-full p-2 font-bold text-sm focus:outline-none focus:border-[#C084FC]"
 placeholder="e.g., Pivoting to B2B SaaS"
 />
 </div>
 <div>
 <label className="block text-sm font-black uppercase mb-1">Context / Why</label>
 <textarea 
 value={context}
 onChange={e => setContext(e.target.value)}
 className="w-full p-2 font-medium text-sm min-h-[100px] focus:outline-none focus:border-[#C084FC]"
 placeholder="What led to this decision? What are the assumptions?"
 />
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-black uppercase mb-1">Status</label>
 <select
 value={status}
 onChange={e => setStatus(e.target.value)}
 className="w-full p-2 font-bold text-sm focus:outline-none"
 >
 <option value="active">Active / In Progress</option>
 <option value="validated">Validated (Success)</option>
 <option value="invalidated">Invalidated (Failed)</option>
 </select>
 </div>
 {status !== 'active' && (
 <div>
 <label className="block text-sm font-black uppercase mb-1">Outcome / Learning</label>
 <input 
 value={outcome}
 onChange={e => setOutcome(e.target.value)}
 className="w-full p-2 font-bold text-sm focus:outline-none"
 placeholder="What did we learn?"
 />
 </div>
)}
 </div>
 <button type="submit" className="w-full bg-black text-white p-3 font-black text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors">
 Save to Memory
 </button>
 </form>
)}

 {/* List */}
 {loading ? (
 <div className="text-center py-16">
 <div className="w-10 h-10 border-t-transparent rounded-full animate-spin mx-auto" />
 </div>
) : decisions.length === 0 ? (
 <div className="bg-white p-12 text-center">
 <BrainCircuit size={32} className="mx-auto mb-4 text-gray-400" />
 <h3 className="font-black text-xl uppercase mb-2">Empty Memory</h3>
 <p className="font-bold text-gray-500 text-sm max-w-md mx-auto">
 Log your strategic decisions, product pivots, and experiments to build context for the intelligence layer.
 </p>
 </div>
) : (
 <div className="space-y-4">
 {decisions.map(d => (
 <div key={d.id} className="bg-white p-5 -hard hover:translate-x-[-2px] hover:translate-y-[-2px] hover: transition-all">
 <div className="flex items-start justify-between gap-4">
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-2">
 <h3 className="font-black text-lg uppercase">{d.title}</h3>
 {d.status === 'active' && <span className="bg-[#60A5FA] border-[2px] border-black px-2 py-0.5 text-[10px] font-black uppercase">Active</span>}
 {d.status === 'validated' && <span className="bg-emerald-500 border-[2px] border-black px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1"><CheckCircle size={10} /> Validated</span>}
 {d.status === 'invalidated' && <span className="bg-[#F472B6] border-[2px] border-black px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1"><XCircle size={10} /> Invalidated</span>}
 </div>
 {d.context && (
 <p className="text-sm font-medium text-gray-700 mb-3 whitespace-pre-wrap">{d.context}</p>
)}
 {d.outcome && (
 <div className="bg-gray-100 border-[2px] border-black p-3 flex gap-2">
 <Target size={16} className="shrink-0 mt-0.5 text-black" />
 <div>
 <p className="text-[10px] font-black uppercase text-gray-500 mb-0.5">Outcome & Learning</p>
 <p className="text-sm font-bold">{d.outcome}</p>
 </div>
 </div>
)}
 </div>
 <div className="text-[10px] font-bold text-gray-400 shrink-0">
 {new Date(d.created_at || d.createdAt).toLocaleDateString()}
 </div>
 </div>
 </div>
))}
 </div>
)}
 </div>
 </AuthGate>
);
}
