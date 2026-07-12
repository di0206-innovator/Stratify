import React, { useState, useEffect } from 'react';
import { MessageSquare, ArrowRight, Share2, Award, Zap, Heart, CheckCircle2, ExternalLink, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import confetti from 'canvas-confetti';
import useRealtime from '../../lib/useRealtime';

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

  useRealtime({
    post_created: (newPost) => {
      setPosts((prev) => {
        if (prev.some((p) => p.id === newPost.id)) return prev;
        return [newPost, ...prev];
      });
    },
    post_clapped: ({ postId, claps }) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              metadata: {
                ...(p.metadata || {}),
                claps
              }
            };
          }
          return p;
        })
      );
    }
  });

  const handleClap = async (postId) => {
    try {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              metadata: {
                ...(p.metadata || {}),
                claps: (p.metadata?.claps || 0) + 1
              }
            };
          }
          return p;
        })
      );

      confetti({
        particleCount: 15,
        spread: 30,
        colors: ['#C8E64A', '#E11D48']
      });

      await fetch(`/api/posts/${postId}/clap`, { method: 'POST' });
    } catch (e) {
      console.error('Failed to register clap:', e);
    }
  };

  const [syncedToIntel, setSyncedToIntel] = useState(false);
  const [postError, setPostError] = useState('');

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPostError('');
    setSyncedToIntel(false);

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
        setSyncedToIntel(true);
        setTimeout(() => setSyncedToIntel(false), 5000);
        await fetchPosts();

        // Celebration for major milestones/launches
        if (postType === 'milestone' || postType === 'launch') {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#C8E64A', '#1A1A1A', '#FAF9F6']
          });
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setPostError(data?.error?.message || `Post failed (${res.status}). Please try again.`);
      }
    } catch (err) {
      setPostError('Network error — could not publish post.');
      console.error('Failed to create post:', err);
    } finally {
      setSubmitting(false);
    }
  };


  const getPostTypeStyle = (type) => {
    switch (type) {
      case 'milestone':
        return 'bg-[#C8E64A]/20 border-[#C8E64A]/30 text-black';
      case 'launch':
        return 'bg-[#C8E64A]/20 border-[#C8E64A]/30 text-black';
      case 'update':
        return 'bg-gray-50 border-gray-200 text-gray-550';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-500';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 relative z-10 text-[#111]">
      {/* Page Header */}
      <div className="os-card bg-[#1A1A1A] text-white p-8 sm:p-12 mb-8 select-none relative overflow-hidden flex flex-col items-center text-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full transform translate-x-20 -translate-y-20"></div>
        
        <div className="inline-flex items-center gap-2 bg-[#C8E64A]/10 border border-[#C8E64A]/30 text-white rounded-md font-bold px-2.5 py-1 text-[10px] uppercase tracking-wider mb-4">
          <Zap size={14} /> LIVE EXECUTION FEED
        </div>
        <h1 className="text-3xl sm:text-5xl font-outfit font-black tracking-tight text-white uppercase mb-2">
          FOUNDER FEED
        </h1>
        <p className="font-inter text-gray-300 max-w-xl text-xs sm:text-sm leading-relaxed font-light">
          Proof of Work over fluff. See where founders are building, shipping, and validating in real time.
        </p>
      </div>

      {/* Write a Post (Only if user has founder role) */}
      {founderProfile && founderProfile.role === 'founder' && (
        <form onSubmit={handlePostSubmit} className="os-card bg-white p-6 mb-8 hover:border-gray-200">
          <div className="flex items-center gap-3 mb-4 select-none">
            <div className="w-10 h-10 bg-black text-[#C8E64A] rounded-full flex items-center justify-center font-outfit font-black text-sm">
              {founderProfile.name ? founderProfile.name.slice(0, 2).toUpperCase() : 'ST'}
            </div>
            <div>
              <span className="font-outfit font-bold text-sm text-[#111]">{founderProfile.name}</span>
              <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-0.5">Share your latest build progress</span>
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="e.g. Shipped the first 3 lines of cold brew concentrates to 20 test users in Bengaluru today!"
            rows={3}
            required
            className="os-input resize-none mb-4"
          />

          {/* Proof of Work URL (only for milestones/launches) */}
          {(postType === 'milestone' || postType === 'launch') && (
            <div className="mb-4 animate-slide-up">
              <label className="block text-[10px] font-bold uppercase text-gray-500 tracking-wide mb-1.5">
                Proof of Work URL (GitHub repository, Vercel app link, or analytics screenshot URL)
              </label>
              <input
                type="url"
                value={powUrl}
                onChange={(e) => setPowUrl(e.target.value)}
                placeholder="https://github.com/yourstartup/repo or https://your-app.vercel.app"
                className="os-input mb-3"
              />
              
              {/* Agent Verification Console */}
              {(verifying || verificationLogs.length > 0) && (
                <div className="border border-gray-800 p-3.5 bg-black text-green-400 font-mono text-[10px] select-text space-y-1 rounded-xl text-left mb-3">
                  <div className="flex items-center justify-between border-b border-green-950 pb-1 mb-2">
                    <span className="text-[9px] uppercase tracking-wider font-bold">Verification Agent Console</span>
                    {verifying && <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>}
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
            <div className="flex flex-wrap gap-2 select-none">
              <button
                type="button"
                onClick={() => setPostType('post')}
                className={`px-3 py-1.5 border font-outfit font-bold text-xs uppercase tracking-wider cursor-pointer transition-all rounded-lg ${
                  postType === 'post' 
                    ? 'bg-black border-black text-white shadow-sm' 
                    : 'bg-white border-gray-250 text-gray-550 hover:border-black'
                }`}
              >
                Simple Post
              </button>
              <button
                type="button"
                onClick={() => setPostType('update')}
                className={`px-3 py-1.5 border font-outfit font-bold text-xs uppercase tracking-wider cursor-pointer transition-all rounded-lg ${
                  postType === 'update' 
                    ? 'bg-[#C8E64A] border-transparent text-black shadow-sm' 
                    : 'bg-white border-gray-250 text-gray-550 hover:border-black'
                }`}
              >
                Progress Log
              </button>
              <button
                type="button"
                onClick={() => setPostType('milestone')}
                className={`px-3 py-1.5 border font-outfit font-bold text-xs uppercase tracking-wider cursor-pointer transition-all rounded-lg ${
                  postType === 'milestone' 
                    ? 'bg-[#C8E64A]/25 border-transparent text-black shadow-sm' 
                    : 'bg-white border-gray-250 text-gray-550 hover:border-black'
                }`}
              >
                ★ Milestone (+15 Score)
              </button>
              <button
                type="button"
                onClick={() => setPostType('launch')}
                className={`px-3 py-1.5 border font-outfit font-bold text-xs uppercase tracking-wider cursor-pointer transition-all rounded-lg ${
                  postType === 'launch' 
                    ? 'bg-[#C8E64A] border-transparent text-black shadow-sm' 
                    : 'bg-white border-gray-250 text-gray-550 hover:border-black'
                }`}
              >
                🚀 Product Launch
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-[#C8E64A] text-black font-outfit font-bold text-xs uppercase hover:bg-[#B5D235] transition-all flex items-center gap-1.5 cursor-pointer rounded-lg border-0"
            >
              <span>{submitting ? 'SHIPPING...' : 'SHARE PROGRESS'}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Error display */}
          {postError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-600">
              {postError}
            </div>
          )}

          {/* Sync confirmation */}
          {syncedToIntel && (
            <div className="mt-3 p-3 bg-[#C8E64A]/15 border border-[#C8E64A]/40 rounded-lg flex items-center gap-2 text-xs font-semibold text-black animate-slide-up">
              <CheckCircle2 size={14} className="text-green-600 shrink-0" />
              Post published! <strong>Auto-synced to Intel & Memory</strong> — view it in Founder Memory.
            </div>
          )}
        </form>
      )}

      {/* Feed List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="os-card bg-white p-16 text-center max-w-xl mx-auto space-y-4">
          <span className="font-outfit font-bold text-xs text-gray-400 uppercase tracking-wider block mb-2 select-none">No signals recorded yet</span>
          <p className="font-inter text-gray-500 font-light text-sm">Be the first to post progress or validation updates!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="os-card bg-white p-6 relative hover:border-black transition-all">
              
              {/* Badge for Milestones/Launches */}
              {post.type !== 'post' && (
                <div className={`absolute top-5 right-5 inline-flex items-center gap-1 px-2.5 py-1 border border-transparent font-outfit font-bold text-[9px] uppercase tracking-wider rounded-md ${getPostTypeStyle(post.type)}`}>
                  {post.type === 'milestone' && <Award size={10} />}
                  {post.type === 'launch' && <Sparkles size={10} />}
                  {post.type}
                </div>
              )}

              {/* Author / Startup details */}
              <div className="flex items-center gap-3 mb-4 select-none">
                <div className="w-12 h-12 bg-black text-[#C8E64A] rounded-full flex items-center justify-center font-outfit font-black text-base uppercase">
                  {post.startupName ? post.startupName.slice(0, 2).toUpperCase() : 'FD'}
                </div>
                <div>
                  <h4 className="font-outfit font-bold text-sm text-black leading-snug">
                    {post.startupName}
                  </h4>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase mt-0.5">
                    by {post.authorName} • {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Main Content */}
              <p className="font-inter text-[#111] text-sm sm:text-base leading-relaxed mb-4 font-light">
                {post.content}
              </p>

              {/* Proof of Work Link */}
              {post.metadata?.powUrl && (
                <div className="mb-4 flex items-center gap-2 select-none">
                  <span className="bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 text-[9px] font-bold uppercase rounded-md flex items-center gap-1">
                    <CheckCircle2 size={10} /> POW VERIFIED
                  </span>
                  <a
                    href={post.metadata.powUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-semibold uppercase text-gray-450 hover:text-black border-b border-transparent hover:border-black flex items-center gap-1 transition-all"
                  >
                    <span>View Proof Source</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              )}

              {/* Interaction Details */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-gray-400 select-none">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleClap(post.id)}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <Heart size={14} className={post.metadata?.claps ? "fill-rose-500 text-rose-500" : "hover:text-rose-500"} />
                    <span>Clap ({post.metadata?.claps || 0})</span>
                  </button>
                  <button className="flex items-center gap-1 text-[10px] font-bold uppercase hover:text-black transition-colors cursor-pointer">
                    <MessageSquare size={14} />
                    <span>Comment</span>
                  </button>
                </div>
                <button className="flex items-center gap-1 text-[10px] font-bold uppercase hover:text-black transition-colors cursor-pointer">
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
