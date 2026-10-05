import React from 'react';
import { ArrowRight, ArrowUpRight, Check, Network, Radio, Brain, FileText, DollarSign, TrendingUp, BarChart3, Users, Building2, Sun, Moon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import StartupGraph from '../../components/StartupGraph';
import Footer from '../../components/Footer';
import InteractiveSandbox from '../../components/marketing/InteractiveSandbox';
import RoiCalculator from '../../components/marketing/RoiCalculator';

export default function LandingPage({ openAuthModal, user, theme, setTheme }) {
  const navigate = useNavigate();

  const handleCTA = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      openAuthModal();
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-text-primary font-inter selection:bg-accent selection:text-[#111]">

      {/* ════════════════════════════════════════════════════════════
          SECTION 1: Marketing Navigation
          ════════════════════════════════════════════════════════════ */}
      <nav className="w-full sticky top-0 z-50 bg-canvas/90 backdrop-blur-md border-b border-DEFAULT/60" aria-label="Marketing navigation">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-4 sm:py-5 flex items-center justify-between gap-6">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-surface-dark flex items-center justify-center text-white font-outfit font-black text-base shadow-sm group-hover:scale-105 transition-transform">
              S
            </div>
            <span className="font-outfit font-black text-xl tracking-tight text-text-primary">Stratify</span>
            <span className="bg-accent text-[#111] text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider scale-90 flex-shrink-0">
              Beta
            </span>
          </Link>

          {/* Center links — spacious and elegant */}
          <div className="hidden md:flex items-center gap-8 lg:gap-10">
            <a href="#system" className="text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors py-1">Product</a>
            <a href="#roles" className="text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors py-1">Roles</a>
            <a href="#compounds" className="text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors py-1">Graph</a>
            <a href="#pricing" className="text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors py-1">Pricing</a>
            <a href="#architecture" className="text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors py-1">Architecture</a>
          </div>

          {/* Auth & CTAs — breathable cluster */}
          <div className="flex items-center gap-3 sm:gap-4 ml-auto sm:ml-0 flex-shrink-0">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-9 h-9 rounded-full border border-DEFAULT bg-card flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-hover transition-colors cursor-pointer"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <div className="hidden sm:block h-5 w-px bg-DEFAULT/70"></div>

            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-dark text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-sm"
              >
                <ArrowRight size={14} />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/walkthrough"
                  className="px-4 py-2 bg-accent/15 border border-accent/40 text-text-primary text-xs font-outfit font-bold uppercase tracking-wider rounded-xl hover:bg-accent hover:text-[#111] transition-all hidden sm:inline-flex items-center gap-1.5"
                >
                  Book Walkthrough
                </Link>
                <button
                  onClick={openAuthModal}
                  className="text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors px-2 py-1.5 hidden sm:block"
                >
                  Sign in
                </button>
                <button
                  onClick={openAuthModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-dark text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-sm cursor-pointer"
                >
                  <ArrowRight size={14} />
                  Get started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>


      {/* ════════════════════════════════════════════════════════════
          SECTION 2: Hero
          ════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 md:pt-28 pb-16 md:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className="animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/15 border border-accent/30 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
              <span className="text-xs font-semibold text-text-primary tracking-wide">The operating system for startup ecosystems</span>
            </div>

            {/* Headline */}
            <h1 className="font-outfit font-black text-[2.5rem] sm:text-[3.25rem] md:text-[3.75rem] lg:text-[4.25rem] leading-[1.05] tracking-[-0.03em] text-text-primary mb-6 uppercase">
              The Operating System for the{' '}
              <span className="relative inline-block text-text-primary">
                Startup Economy
                <svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 300 8" preserveAspectRatio="none">
                  <path d="M0 6 Q75 0 150 6 Q225 12 300 6" stroke="var(--accent)" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </span>
              .
            </h1>

            {/* Subtitle */}
            <p className="text-base md:text-lg text-text-muted leading-relaxed max-w-lg mb-10">
              Stratify connects founders, investors, angels, and institutions into a living startup graph to drive real-time AI intelligence, capital flow, and verified proof of work.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 mb-14">
              <button
                onClick={handleCTA}
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-[#111] text-sm font-semibold rounded-lg hover:opacity-90 transition-colors shadow-sm"
              >
                <ArrowRight size={16} />
                {user ? 'Enter Dashboard' : 'Start building'}
              </button>
              <Link
                to="/walkthrough"
                className="inline-flex items-center gap-2 px-6 py-3 bg-card text-text-primary text-sm font-semibold rounded-lg border border-DEFAULT hover:border-text-primary transition-colors"
              >
                Book a walkthrough
              </Link>
            </div>

            {/* Architectural Specifications strip */}
            <div className="flex flex-wrap items-center gap-8 md:gap-12 pt-2">
              <div>
                <span className="block font-outfit font-black text-2xl text-text-primary">Graph-Native</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted mt-0.5 block">Unified Ecosystem Core</span>
              </div>
              <div>
                <span className="block font-outfit font-black text-2xl text-text-primary">Multi-Agent</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted mt-0.5 block">Intelligence & Verification</span>
              </div>
              <div>
                <span className="block font-outfit font-black text-2xl text-text-primary">Zero-Leak</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted mt-0.5 block">Row-Level Security</span>
              </div>
            </div>
          </div>

          {/* Right: Graph */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <StartupGraph />
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════════
          SECTION 3: Ecosystem Audience & Infrastructure
          ════════════════════════════════════════════════════════════ */}
      <section className="border-y border-DEFAULT bg-canvas py-8">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-14">
            <span className="text-[10px] font-outfit font-semibold uppercase tracking-[0.2em] text-text-muted whitespace-nowrap">
              Engineered for
            </span>
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 text-text-secondary">
              {[
                'Early Stage Founders',
                'Angel Syndicates',
                'Venture Capitalists',
                'Startup Accelerators',
                'Ecosystem Institutions',
                'Family Offices'
              ].map((name) => (
                <span key={name} className="font-outfit font-semibold text-xs tracking-wider uppercase hover:text-text-primary transition-colors cursor-default">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════════
          SECTION 3.5: Live Product Sandbox
          ════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <InteractiveSandbox />
      </section>


      {/* ════════════════════════════════════════════════════════════
          SECTION 4: Three Vantage Points (Role Cards)
          ════════════════════════════════════════════════════════════ */}
      <section id="roles" className="max-w-6xl mx-auto px-6 py-24">
        <div className="mb-16 animate-fade-in-up">
          <p className="section-label mb-4">One graph, three vantage points</p>
          <h2 className="font-outfit font-black text-3xl md:text-[2.75rem] leading-[1.1] tracking-tight text-text-primary max-w-xl">
            Built for everyone shaping the startup.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Founders */}
          <div className="bg-card rounded-2xl border border-DEFAULT p-8 flex flex-col justify-between hover:shadow-lg hover:border-DEFAULT transition-all duration-200 animate-fade-in-up">
            <div>
              <div className="w-12 h-12 rounded-xl bg-text-primary flex items-center justify-center mb-6">
                <BarChart3 size={22} className="text-white" />
              </div>
              <h3 className="font-outfit font-bold text-xl text-text-primary mb-3">Founders</h3>
              <p className="text-sm text-text-muted leading-relaxed mb-6">
                Keep your entire execution in sync: runway forecasts, equity math, strategic memory, and live momentum all moving together.
              </p>
              <ul className="space-y-2.5 mb-8">
                {['Runway & equity planners', 'Founder memory', 'Micro-bounties'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-text-primary">
                    <Check size={15} className="text-accent flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={handleCTA}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-primary hover:gap-2.5 transition-all"
            >
              Explore role <ArrowUpRight size={14} />
            </button>
          </div>

          {/* Investors */}
          <div className="bg-card rounded-2xl border border-DEFAULT p-8 flex flex-col justify-between hover:shadow-lg hover:border-DEFAULT transition-all duration-200 animate-fade-in-up" style={{ animationDelay: '0.08s' }}>
            <div>
              <div className="w-12 h-12 rounded-xl bg-text-primary flex items-center justify-center mb-6">
                <TrendingUp size={22} className="text-white" />
              </div>
              <h3 className="font-outfit font-bold text-xl text-text-primary mb-3">Investors</h3>
              <p className="text-sm text-text-muted leading-relaxed mb-6">
                Discover, score, and track deal flow with compatibility matching grounded in real signals.
              </p>
              <ul className="space-y-2.5 mb-8">
                {['Compatibility matching', 'Deal flow views', 'Signal-based briefs'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-text-primary">
                    <Check size={15} className="text-accent flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={handleCTA}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-primary hover:gap-2.5 transition-all"
            >
              Explore role <ArrowUpRight size={14} />
            </button>
          </div>

          {/* Institutions */}
          <div className="bg-card rounded-2xl border border-DEFAULT p-8 flex flex-col justify-between hover:shadow-lg hover:border-DEFAULT transition-all duration-200 animate-fade-in-up" style={{ animationDelay: '0.16s' }}>
            <div>
              <div className="w-12 h-12 rounded-xl bg-text-primary flex items-center justify-center mb-6">
                <Building2 size={22} className="text-white" />
              </div>
              <h3 className="font-outfit font-bold text-xl text-text-primary mb-3">Institutions</h3>
              <p className="text-sm text-text-muted leading-relaxed mb-6">
                Monitor ecosystems, run programs, and measure public impact across your region.
              </p>
              <ul className="space-y-2.5 mb-8">
                {['Ecosystem monitoring', 'Programs & grants', 'Impact reporting'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-text-primary">
                    <Check size={15} className="text-accent flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={handleCTA}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-primary hover:gap-2.5 transition-all"
            >
              Explore role <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════════
          SECTION 5: The System (Module Grid)
          ════════════════════════════════════════════════════════════ */}
      <section id="system" className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 items-end animate-fade-in-up">
          <div>
            <p className="section-label mb-4">The system</p>
            <h2 className="font-outfit font-black text-3xl md:text-[2.75rem] leading-[1.1] tracking-tight text-text-primary">
              Modules that read and write the same graph.
            </h2>
          </div>
          <p className="text-sm text-text-muted leading-relaxed lg:text-right">
            No isolated tables, no dead dashboards. Every surface reflects the same underlying truth about your startup.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Network, title: 'Startup Graph', desc: 'Every milestone, decision, and metric attaches to one living data model.', bg: 'bg-card' },
            { icon: Radio, title: 'Signals', desc: 'Market, product, and competitive signals feed your intelligence layer.', bg: 'bg-hover' },
            { icon: Brain, title: 'Founder Memory', desc: 'Track key decisions, validate experiments, and build your strategic moat in real time.', bg: 'bg-card' },
            { icon: FileText, title: 'Insights & Briefs', desc: 'Generate analysis and data-room ready briefs from live graph state.', bg: 'bg-card' },
            { icon: DollarSign, title: 'Runway & Equity', desc: 'Model burn, cash, and cap table with scenarios that stay in sync.', bg: 'bg-hover' },
            { icon: TrendingUp, title: 'Deal Flow', desc: 'Score compatibility and track pipeline with transparent reasoning.', bg: 'bg-card' },
          ].map((mod, i) => (
            <div
              key={mod.title}
              className={`${mod.bg} rounded-2xl border border-DEFAULT p-7 hover:shadow-md hover:border-DEFAULT transition-all duration-200 animate-fade-in-up`}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <mod.icon size={20} className="text-text-muted mb-5" strokeWidth={1.5} />
              <h3 className="font-outfit font-bold text-base text-text-primary mb-2">{mod.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{mod.desc}</p>
            </div>
          ))}
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════════
          SECTION 6: How It Compounds
          ════════════════════════════════════════════════════════════ */}
      <section id="compounds" className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Steps */}
          <div className="animate-fade-in-up">
            <p className="section-label mb-4">How it compounds</p>
            <h2 className="font-outfit font-black text-3xl md:text-[2.75rem] leading-[1.1] tracking-tight text-text-primary mb-12">
              Your work becomes an asset, not a log.
            </h2>

            <div className="space-y-10">
              {[
                { num: '1', title: 'Capture', desc: 'Log milestones, decisions, and signals as you operate.' },
                { num: '2', title: 'Connect', desc: 'Everything attaches to a startup_id in one living graph.' },
                { num: '3', title: 'Compound', desc: 'Reports and briefs write structured state back to the graph.' },
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-5">
                  <div className="w-10 h-10 rounded-xl bg-hover flex items-center justify-center flex-shrink-0">
                    <span className="font-outfit font-bold text-sm text-text-primary">{step.num}</span>
                  </div>
                  <div>
                    <h4 className="font-outfit font-bold text-base text-text-primary mb-1">{step.title}</h4>
                    <p className="text-sm text-text-muted leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Graph reuse */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <StartupGraph />
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════════
          SECTION 7: Architecture & Founding Principle
          ════════════════════════════════════════════════════════════ */}
      <section id="architecture" className="bg-surface-dark text-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Founder Philosophy */}
            <div className="animate-fade-in-up">
              <p className="text-[10px] font-outfit font-semibold uppercase tracking-[0.2em] text-accent mb-6">Platform Architecture</p>
              <blockquote className="font-outfit font-bold text-xl md:text-2xl leading-relaxed text-white/95 mb-8">
                "Startups move fast, but lose ground when execution stays locked in isolated sheets, decks, and chats. We built Stratify so your runway, cap table scenarios, experiments, and market signals live in one shared graph. Founders gain total clarity, while investors get real, verifiable proof of work."
              </blockquote>
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-accent text-[#111] flex items-center justify-center font-outfit font-black text-base shadow-sm">
                  DS
                </div>
                <div>
                  <p className="text-sm font-bold text-white font-outfit uppercase tracking-tight">Divyanshu Sinha</p>
                  <p className="text-xs text-text-muted font-medium">Founder & CEO, Stratify</p>
                </div>
              </div>
            </div>

            {/* Right: Core Guarantees grid */}
            <div className="grid grid-cols-2 gap-px bg-white/10 rounded-2xl overflow-hidden animate-fade-in-up border border-white/10" style={{ animationDelay: '0.1s' }}>
              {[
                { title: 'Deterministic', desc: 'Unified source of truth for runway, equity, and milestones' },
                { title: 'Zero Leakage', desc: 'PostgreSQL Row-Level Security with granular data room grants' },
                { title: 'Multi-Agent', desc: 'Context-aware intelligence with strict grounding verification' },
                { title: 'Ecosystem Graph', desc: 'Connected network bridging founders, syndicates, and funds' },
              ].map((item) => (
                <div key={item.title} className="bg-surface-dark p-8 flex flex-col justify-between">
                  <div>
                    <span className="block font-outfit font-black text-lg text-white mb-2">{item.title}</span>
                    <span className="text-xs text-text-muted leading-relaxed font-inter">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════════
          SECTION 7.2: ROI & Savings Calculator
          ════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <RoiCalculator />
      </section>


      {/* ════════════════════════════════════════════════════════════
          SECTION 7.5: Pricing Plans (Show Only)
          ════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24 border-t border-DEFAULT/60">
        <div className="text-center mb-16 animate-fade-in-up">
          <p className="section-label mb-4">Flexible plans for the entire ecosystem</p>
          <h2 className="font-outfit font-black text-3xl md:text-5xl tracking-tight text-text-primary mb-5">
            Transparent Pricing. Mapped to your scale.
          </h2>
          <p className="text-base text-text-muted max-w-md mx-auto">
            Choose the workspace built specifically for your role. All plans come with full graph indexing capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch select-none">
          {/* Plan 1: Founder OS */}
          <div className="bg-card rounded-2xl border border-DEFAULT p-8 flex flex-col justify-between hover:shadow-lg transition-all animate-fade-in-up">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="px-2.5 py-1 bg-hover text-text-primary text-[10px] font-bold uppercase rounded font-outfit">Founder OS</span>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-outfit font-black text-text-primary">$49</span>
                <span className="text-text-muted text-sm font-semibold"> / mo</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed mb-6 font-inter font-light">
                Perfect for early-stage and scaling founders seeking unified runway, cap table, and memory loops.
              </p>
              <div className="border-t border-DEFAULT pt-6">
                <span className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-4">Key Capabilities</span>
                <ul className="space-y-3.5">
                  {['Unified Startup Graph', 'Cap Table Scenarios', 'Runway & Burn Modeling', 'AI Journey Generation'].map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5 text-xs text-text-primary font-semibold">
                      <Check size={14} className="text-accent shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button 
              onClick={() => navigate('/upgrade')}
              className="w-full mt-8 py-2.5 bg-card border border-gray-250 hover:border-DEFAULT text-text-primary text-xs font-outfit font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
            >
              Select Plan
            </button>
          </div>

          {/* Plan 2: Investor OS (Featured) */}
          <div className="bg-surface-dark text-white rounded-2xl border-0 p-8 flex flex-col justify-between hover:shadow-xl transition-all relative overflow-hidden group animate-fade-in-up">
            <div className="absolute top-0 right-0 bg-accent text-[#111] text-[9px] font-black uppercase px-3 py-1 rounded-bl-lg tracking-wider">
              Popular Choice
            </div>
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="px-2.5 py-1 bg-card/10 text-white text-[10px] font-bold uppercase rounded font-outfit">Investor OS</span>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-outfit font-black text-white">$299</span>
                <span className="text-text-muted text-sm font-semibold"> / mo</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed mb-6 font-inter font-light">
                Engineered for VCs, angels, and syndicate leads looking to source pipeline and automate diligence briefs.
              </p>
              <div className="border-t border-white/10 pt-6">
                <span className="block text-[10px] font-black text-gray-505 uppercase tracking-wider mb-4">Investor Features</span>
                <ul className="space-y-3.5">
                  {['Ecosystem-Wide Search', 'Sector Thesis Matcher', 'One-Click Diligence Audits', 'Secure Investor Data Rooms'].map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5 text-xs text-white/90 font-semibold">
                      <Check size={14} className="text-accent shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button 
              onClick={() => navigate('/upgrade')}
              className="w-full mt-8 py-2.5 bg-accent text-[#111] hover:opacity-90 text-xs font-outfit font-bold uppercase tracking-wider rounded-lg border-0 transition-all cursor-pointer"
            >
              Select Plan
            </button>
          </div>

          {/* Plan 3: Institution OS */}
          <div className="bg-card rounded-2xl border border-DEFAULT p-8 flex flex-col justify-between hover:shadow-lg transition-all animate-fade-in-up">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="px-2.5 py-1 bg-hover text-text-primary text-[10px] font-bold uppercase rounded font-outfit">Institution OS</span>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-outfit font-black text-text-primary">$999</span>
                <span className="text-text-muted text-sm font-semibold"> / mo</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed mb-6 font-inter font-light">
                Designed for government grants, academic institutions, and regional ecosystem builders.
              </p>
              <div className="border-t border-DEFAULT pt-6">
                <span className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-4">Institutional Features</span>
                <ul className="space-y-3.5">
                  {['Regional Health Telemetry', 'Program & Grant Deployment', 'Public Impact Analysis', 'API Integration & Directory Exports'].map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5 text-xs text-text-primary font-semibold">
                      <Check size={14} className="text-accent shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button 
              onClick={() => navigate('/upgrade')}
              className="w-full mt-8 py-2.5 bg-card border border-gray-250 hover:border-DEFAULT text-text-primary text-xs font-outfit font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
            >
              Select Plan
            </button>
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════════
          SECTION 8: Bottom CTA
          ════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 py-28">
        <div className="text-center animate-fade-in-up">
          <p className="section-label mb-4">Get started free</p>
          <h2 className="font-outfit font-black text-3xl md:text-5xl tracking-tight text-text-primary mb-5">
            Give your startup a memory.
          </h2>
          <p className="text-base text-text-muted mb-10 max-w-md mx-auto">
            Set up your workspace and map your first graph in under five minutes.
          </p>
          <button
            onClick={handleCTA}
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-accent text-[#111] text-sm font-semibold rounded-lg hover:opacity-90 transition-colors shadow-sm"
          >
            <ArrowRight size={16} />
            {user ? 'Go to Dashboard' : 'Create your workspace'}
          </button>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════════
          SECTION 9: Footer
          ════════════════════════════════════════════════════════════ */}
      <Footer />
    </div>
  );
}
