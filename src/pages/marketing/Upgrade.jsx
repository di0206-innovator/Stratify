import React, { useState } from 'react';
import { ArrowLeft, Rocket, Zap, Shield, BarChart3, Check, Clock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

const PLANS = [
  { id: 'founder', label: 'Founder OS — $49/mo' },
  { id: 'investor', label: 'Investor OS — $299/mo' },
  { id: 'institution', label: 'Institution OS — $999/mo' },
];

const UPCOMING_FEATURES = [
  { icon: Zap, title: 'Priority AI Intelligence', desc: 'Unlimited deep-dive strategic briefs with the most advanced models.' },
  { icon: Shield, title: 'Secure Investor Data Rooms', desc: 'End-to-end encrypted document sharing with granular access controls.' },
  { icon: BarChart3, title: 'Advanced Sector Analytics', desc: 'Real-time competitive benchmarking, market sizing, and trend forecasting.' },
  { icon: Rocket, title: 'Automated Outreach Pipelines', desc: 'AI-drafted investor memos and warm intro sequencing.' },
];

export default function Upgrade() {
  const [form, setForm] = useState({ name: '', email: '', plan: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || 'Something went wrong. Please try again.');
      }
      setStatus('success');
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C8E64A', '#1A1A1A', '#FAF9F6', '#22C55E'],
      });
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-text-primary font-inter selection:bg-accent selection:text-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-24">

        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors mb-12"
        >
          <ArrowLeft size={16} />
          Back to Stratify
        </Link>

        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-muted border border-accent/30 mb-8">
            <Clock size={14} className="text-accent" />
            <span className="text-xs font-bold tracking-wide uppercase">Coming Soon</span>
          </div>

          <h1 className="font-outfit font-black text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.05] mb-6">
            Premium features are{' '}
            <span className="relative inline-block">
              rolling out soon
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 8" preserveAspectRatio="none">
                <path d="M0 6 Q75 0 150 6 Q225 12 300 6" stroke="#C8E64A" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="text-base md:text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
            We're building something extraordinary. Paid plans with advanced AI capabilities,
            priority infrastructure, and enterprise-grade tools are currently in final development.
            Join the waitlist to be the first to know when they launch.
          </p>
        </div>

        {/* Upcoming Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-16">
          {UPCOMING_FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-card border border-DEFAULT rounded-xl p-6 hover:shadow-lg transition-all animate-fade-in-up"
            >
              <div className="w-10 h-10 bg-accent-muted rounded-lg flex items-center justify-center mb-4">
                <Icon size={20} className="text-accent" />
              </div>
              <h3 className="font-outfit font-bold text-sm mb-2">{title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Waitlist Form Card */}
        <div className="max-w-lg mx-auto">
          {status === 'success' ? (
            <div className="bg-card border border-DEFAULT rounded-2xl p-10 text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={28} className="text-green-600" />
              </div>
              <h2 className="font-outfit font-black text-2xl mb-3">You're on the list!</h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-8">
                We'll notify you at <strong className="text-text-primary">{form.email}</strong> the moment
                premium plans go live. Thank you for believing in Stratify.
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-black text-sm font-semibold rounded-lg hover:bg-accent-hover transition-colors"
              >
                <Sparkles size={16} />
                Continue to Dashboard
              </Link>
            </div>
          ) : (
            <div className="bg-card border border-DEFAULT rounded-2xl p-8 md:p-10 animate-fade-in-up">
              <div className="text-center mb-8">
                <h2 className="font-outfit font-black text-xl md:text-2xl mb-2">Join the Waitlist</h2>
                <p className="text-xs text-text-secondary">
                  Be among the first to access premium capabilities when we launch.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your full name"
                    className="os-input"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@company.com"
                    className="os-input"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                    Plan Interest
                  </label>
                  <select
                    value={form.plan}
                    onChange={(e) => setForm({ ...form, plan: e.target.value })}
                    className="os-input"
                  >
                    <option value="">Select a plan (optional)</option>
                    {PLANS.map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                    Anything you'd like us to know? <span className="text-text-muted font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us about your use case, team size, or what excites you most..."
                    rows={3}
                    className="os-input resize-none"
                  />
                </div>

                {status === 'error' && (
                  <div className="text-xs text-red-600 font-semibold bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full py-3 bg-accent text-black text-sm font-outfit font-bold uppercase tracking-wider rounded-lg hover:bg-accent-hover transition-all disabled:opacity-60 cursor-pointer border-0"
                >
                  {status === 'submitting' ? 'Joining...' : 'Join the Waitlist'}
                </button>
              </form>

              <p className="text-center text-[10px] text-text-muted mt-5">
                No spam. We'll only email you when premium plans launch.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
