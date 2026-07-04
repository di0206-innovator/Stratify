import React, { useState, useEffect } from 'react';
import { Sparkles, MessageSquare, ArrowRight, Share2, Award, Zap, Heart, CheckCircle2, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Feed({ user, founderProfile }) {
 const [posts, setPosts] = useState([]);
 const [content, setContent] = useState('');
 const [postType, setPostType] = useState('post'); // 'post', 'milestone', 'launch', 'update'
 const [loading, setLoading] = useState(true);
 const [submitting, setSubmitting] = useState(false);

 const [powUrl, setPowUrl] = useState('');
 const [verifying, setVerifying] = useState(false);
 const [verificationLogs, setVerificationLogs] = useState([]);

 const fetchPosts = async () => {
 try {
 const res = await fetch('/api/posts');
 if (res.ok) {
 const data = await res.json();
 setPosts(data.posts || []);
 }
 } catch (e) {
 console.error('Failed to load feed posts:', e);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchPosts();
 }, []);

 const handlePostSubmit = async (e) => {
 e.preventDefault();
 if (!content.trim()) return;

 if ((postType === 'milestone' || postType === 'launch') && powUrl.trim()) {
 setVerifying(true);
 setVerificationLogs([]);
 
 const logSteps = [
"🤖 Booting verification subagent...",
"🔍 Accessing external asset repository...",
 `🔗 Analyzing target URL: ${powUrl}`,
"🛠 Auditing code structures & Git commit history...",
"⚡ Verification success: Proof-of-work validated. Score bonus applied!",
 ];

 for (let i = 0; i < logSteps.length; i++) {
 await new Promise(r => setTimeout(r, 650));
 setVerificationLogs(prev => [...prev, logSteps[i]]);
 }
 setVerifying(false);
 }

 setSubmitting(true);
 try {
 const res = await fetch('/api/posts', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json'
 },
 body: JSON.stringify({
 content,
 type: postType,
 metadata: {
 isExecutionSignal: postType === 'milestone' || postType === 'launch',
 powUrl: powUrl.trim() || null
 }
 })
 });

 if (res.ok) {
 setContent('');
 setPowUrl('');
 setPostType('post');
 setVerificationLogs([]);
 await fetchPosts();

 // Celebration for major milestones/launches
 if (postType === 'milestone' || postType === 'launch') {
 confetti({
 particleCount: 100,
 spread: 70,
 origin: { y: 0.6 },
 colors: ['#EF4444', '#FCD34D', '#3B82F6']
 });
 }
 }
 } catch (err) {
 console.error('Failed to create post:', err);
 } finally {
 setSubmitting(false);
 }
 };

 const getPostTypeStyle = (type) => {
 switch (type) {
 case 'milestone':
 return 'bg-emerald-500 text-black border-black';
 case 'launch':
 return 'bg-purple-600 text-black border-black';
 case 'update':
 return 'bg-[#FB923C] text-black border-black';
 default:
 return 'bg-gray-100 text-gray-800 border-gray-400';
 }
 };

 return (
 <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
 {/* Page Header */}
 <div className="os-card bg-white text-black p-8 mb-8 select-none relative overflow-hidden flex flex-col items-center text-center">
 {/* Floating background decorative shape */}
 <div className="absolute -top-12 -left-12 w-28 h-28 bg-yellow-400 transform rotate-45 opacity-80 pointer-events-none hidden md:block"></div>
 <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-blue-600 rounded-full opacity-80 pointer-events-none hidden md:block"></div>
 
 <div className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-1.5 font-outfit font-black text-xs uppercase tracking-wider mb-4 transform -rotate-1">
 <Zap size={14} /> LIVE EXECUTION FEED
 </div>
 <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-2 text-black">
 FOUNDER FEED
 </h1>
 <p className="font-outfit font-bold text-gray-600 max-w-lg">
 Proof of Work over fluff. See where founders are building, shipping, and validating in real time.
 </p>
 </div>

 {/* Write a Post (Only if user has founder role) */}
 {founderProfile && founderProfile.role === 'founder' && (
 <form onSubmit={handlePostSubmit} className="os-card bg-white p-6 mb-8">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 bg-emerald-500 border-2 border-black flex items-center justify-center font-black text-sm uppercase">
 {founderProfile.name ? founderProfile.name.slice(0, 2) : 'ST'}
 </div>
 <div>
 <span className="font-black uppercase text-sm">{founderProfile.name}</span>
 <span className="block text-xs font-bold text-gray-500">Share your latest build progress</span>
 </div>
 </div>

 <textarea
 value={content}
 onChange={(e) => setContent(e.target.value)}
 placeholder="e.g. Shipped the first 3 lines of cold brew concentrates to 20 test users in Bengaluru today!"
 rows={3}
 required
 className="w-full p-4 font-outfit font-bold text-sm focus:outline-none focus:ring-0 focus:border-black mb-4 bg-gray-50 text-black"
 />

 {/* Proof of Work URL (only for milestones/launches) */}
 {(postType === 'milestone' || postType === 'launch') && (
 <div className="mb-4">
 <label className="block text-xs font-black uppercase text-gray-700 mb-1.5">
 Proof of Work URL (GitHub repository, Vercel app link, or analytics screenshot URL)
 </label>
 <input
 type="url"
 value={powUrl}
 onChange={(e) => setPowUrl(e.target.value)}
 placeholder="https://github.com/yourstartup/repo or https://your-app.vercel.app"
 className="w-full p-3 font-outfit font-bold text-sm focus:outline-none focus:ring-0 focus:border-black bg-gray-50 text-black mb-3"
 />
 
 {/* Agent Verification Console */}
 {(verifying || verificationLogs.length > 0) && (
 <div className=" p-3 bg-black text-green-400 font-mono text-xs select-text space-y-1 rounded-none text-left mb-3">
 <div className="flex items-center justify-between border-b border-green-950 pb-1 mb-2">
 <span className="text-[10px] uppercase tracking-wider font-bold">Verification Agent Console</span>
 {verifying && <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>}
 </div>
 {verificationLogs.map((log, idx) => (
 <div key={idx} className="leading-relaxed">
 {log}
 </div>
))}
 </div>
)}
 </div>
)}

 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 {/* Post Type Selector */}
 <div className="flex flex-wrap gap-2">
 <button
 type="button"
 onClick={() => setPostType('post')}
 className={`px-3 py-1.5 border-[2px] border-black font-black text-xs uppercase cursor-pointer transition-all ${
 postType === 'post' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
 }`}
 >
 Simple Post
 </button>
 <button
 type="button"
 onClick={() => setPostType('update')}
 className={`px-3 py-1.5 border-[2px] border-black font-black text-xs uppercase cursor-pointer transition-all ${
 postType === 'update' ? 'bg-[#FB923C] text-black' : 'bg-white text-black hover:bg-gray-100'
 }`}
 >
 Progress Log
 </button>
 <button
 type="button"
 onClick={() => setPostType('milestone')}
 className={`px-3 py-1.5 border-[2px] border-black font-black text-xs uppercase cursor-pointer transition-all ${
 postType === 'milestone' ? 'bg-emerald-500 text-black' : 'bg-white text-black hover:bg-gray-100'
 }`}
 >
 ★ Milestone (+15 Score)
 </button>
 <button
 type="button"
 onClick={() => setPostType('launch')}
 className={`px-3 py-1.5 border-[2px] border-black font-black text-xs uppercase cursor-pointer transition-all ${
 postType === 'launch' ? 'bg-purple-600 text-black' : 'bg-white text-black hover:bg-gray-100'
 }`}
 >
 🚀 Product Launch
 </button>
 </div>

 <button
 type="submit"
 disabled={submitting}
 className="px-6 py-2.5 bg-red-500 text-white font-black text-xs uppercase active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:-translate-x-[1px] hover:-translate-y-[1px] hover: transition-all flex items-center gap-2 cursor-pointer"
 >
 <span>{submitting ? 'SHIPPING...' : 'SHARE PROGRESS'}</span>
 <ArrowRight size={14} />
 </button>
 </div>
 </form>
)}

 {/* Feed List */}
 {loading ? (
 <div className="flex justify-center py-12">
 <div className="w-10 h-10 border-t-transparent rounded-full animate-spin"></div>
 </div>
) : posts.length === 0 ? (
 <div className="os-card bg-white p-12 text-center">
 <span className="font-outfit font-black text-xs text-gray-500 uppercase tracking-wider block mb-2">No signals recorded yet</span>
 <p className="font-outfit font-bold text-sm text-gray-600">Be the first to post progress or validation updates!</p>
 </div>
) : (
 <div className="space-y-6">
 {posts.map((post) => (
 <div key={post.id} className="os-card bg-white p-6 relative hover:translate-y-[-2px] transition-transform">
 
 {/* Badge for Milestones/Launches */}
 {post.type !== 'post' && (
 <div className={`absolute top-4 right-4 inline-flex items-center gap-1 px-2.5 py-1 border-[2px] border-black font-outfit font-black text-[9px] uppercase tracking-wider ${getPostTypeStyle(post.type)}`}>
 {post.type === 'milestone' && <Award size={10} />}
 {post.type === 'launch' && <Sparkles size={10} />}
 {post.type}
 </div>
)}

 {/* Author / Startup details */}
 <div className="flex items-center gap-3 mb-4">
 <div className="w-12 h-12 bg-gray-900 text-[#A3E635] border-2 border-black flex items-center justify-center font-black text-base uppercase">
 {post.startupName ? post.startupName.slice(0, 2) : 'FD'}
 </div>
 <div>
 <h4 className="font-black uppercase text-sm text-black flex items-center gap-1.5">
 {post.startupName}
 </h4>
 <span className="block text-xs font-bold text-gray-500">
 by {post.authorName} • {new Date(post.createdAt).toLocaleDateString()}
 </span>
 </div>
 </div>

 {/* Main Content */}
 <p className="font-outfit font-bold text-gray-800 text-sm sm:text-base leading-relaxed mb-4">
 {post.content}
 </p>

 {/* Proof of Work Link */}
 {post.metadata?.powUrl && (
 <div className="mb-4 flex items-center gap-2 select-none">
 <span className="bg-emerald-500 text-black border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
 <CheckCircle2 size={10} /> POW VERIFIED
 </span>
 <a
 href={post.metadata.powUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="text-[10px] font-black uppercase text-[#3B82F6] hover:text-black border-b border-transparent hover:border-black flex items-center gap-1 transition-all"
 >
 <span>View Proof Source</span>
 <ExternalLink size={10} />
 </a>
 </div>
)}

 {/* Interaction Details */}
 <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-gray-500">
 <div className="flex items-center gap-4">
 <button className="flex items-center gap-1 text-xs font-black uppercase hover:text-black transition-colors cursor-pointer">
 <Heart size={14} className="text-gray-400 hover:text-red-500" />
 <span>Clap</span>
 </button>
 <button className="flex items-center gap-1 text-xs font-black uppercase hover:text-black transition-colors cursor-pointer">
 <MessageSquare size={14} />
 <span>Comment</span>
 </button>
 </div>
 <button className="flex items-center gap-1 text-xs font-black uppercase hover:text-black transition-colors cursor-pointer">
 <Share2 size={14} />
 <span>Share</span>
 </button>
 </div>

 </div>
))}
 </div>
)}
 </div>
);
}
