import React from 'react';
import { ArrowRight, ArrowUpRight, Check, Network, Radio, Brain, FileText, DollarSign, TrendingUp, BarChart3, Users, Building2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import StartupGraph from '../../components/StartupGraph';
import Footer from '../../components/Footer';

export default function LandingPage({ openAuthModal, user }) {
  const navigate = useNavigate();

  const handleCTA = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      openAuthModal();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111] font-inter selection:bg-[#C8E64A] selection:text-black">

      {/* ════════════════════════════════════════════════════════════
          SECTION 1: Marketing Navigation
          ════════════════════════════════════════════════════════════ */}
      <nav className="w-full sticky top-0 z-50 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-gray-200/60" aria-label="Marketing navigation">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 min-h-16 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center text-white font-outfit font-black text-base">
              S
            </div>
            <span className="font-outfit font-black text-xl tracking-tight">Stratify</span>
            <span className="bg-[#C8E64A] text-black text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider scale-90 flex-shrink-0">
              Beta
            </span>
          </div>

          {/* Center links — hidden on mobile */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#system" className="text-sm text-gray-600 hover:text-[#111] transition-colors font-medium">Product</a>
            <a href="#roles" className="text-sm text-gray-600 hover:text-[#111] transition-colors font-medium">Roles</a>
            <a href="#compounds" className="text-sm text-gray-600 hover:text-[#111] transition-colors font-medium">Graph</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-[#111] transition-colors font-medium">Pricing</a>
            <a href="#testimonial" className="text-sm text-gray-600 hover:text-[#111] transition-colors font-medium">Customers</a>
          </div>

          {/* Auth */}
          <div className="flex items-center gap-3 ml-auto">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] text-white text-sm font-semibold rounded-lg hover:bg-[#333] transition-colors"
              >
                <ArrowRight size={15} />
                Dashboard
              </Link>
            ) : (
              <>
                <button
                  onClick={openAuthModal}
                  className="text-sm font-medium text-gray-600 hover:text-[#111] transition-colors hidden sm:block"
                >
                  Sign in
                </button>
                <button
                  onClick={openAuthModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] text-white text-sm font-semibold rounded-lg hover:bg-[#333] transition-colors"
                >
                  <ArrowRight size={15} />
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C8E64A]/15 border border-[#C8E64A]/30 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8E64A]"></span>
              <span className="text-xs font-semibold text-[#111] tracking-wide">The operating system for startup ecosystems</span>
            </div>

            {/* Headline */}
            <h1 className="font-outfit font-black text-[2.75rem] md:text-[3.5rem] lg:text-[4rem] leading-[1.05] tracking-[-0.03em] text-[#111] mb-6">
              Every decision,{' '}
              <br className="hidden sm:block" />
              connected to the{' '}
              <br className="hidden sm:block" />
              <span className="relative inline-block">
                startup graph
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 8" preserveAspectRatio="none">
                  <path d="M0 6 Q75 0 150 6 Q225 12 300 6" stroke="#C8E64A" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
              </span>
              .
            </h1>

            {/* Subtitle */}
            <p className="text-base md:text-lg text-gray-500 leading-relaxed max-w-lg mb-10">
              Stratify is a founder OS where milestones, memory, signals, and capital all attach to one living graph — built for founders, investors, and the institutions that back them.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 mb-14">
              <button
                onClick={handleCTA}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#C8E64A] text-[#111] text-sm font-semibold rounded-lg hover:bg-[#B5D235] transition-colors shadow-sm"
              >
                <ArrowRight size={16} />
                {user ? 'Enter Dashboard' : 'Start building'}
              </button>
              <a
                href="#system"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#111] text-sm font-semibold rounded-lg border border-gray-300 hover:border-[#111] transition-colors"
              >
                Book a walkthrough
              </a>
            </div>

            {/* Stats strip */}
            <div className="flex flex-wrap items-center gap-8 md:gap-14">
              <div>
                <span className="block font-outfit font-black text-2xl text-[#111]">2,400+</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 mt-0.5 block">startups mapped</span>
              </div>
              <div>
                <span className="block font-outfit font-black text-2xl text-[#111]">$1.8B</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 mt-0.5 block">capital tracked</span>
              </div>
              <div>
                <span className="block font-outfit font-black text-2xl text-[#111]">31</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 mt-0.5 block">ecosystems</span>
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
          SECTION 3: Trust Strip
          ════════════════════════════════════════════════════════════ */}
      <section className="border-y border-gray-200 bg-[#FAF9F6] py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-16">
            <span className="text-[10px] font-outfit font-semibold uppercase tracking-[0.2em] text-gray-400 whitespace-nowrap">
              Trusted across the ecosystem
            </span>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 text-gray-400">
              {['Northwind', 'Meridian', 'Karnataka SIC', 'Verdant', 'Orbit Labs', 'Lumen'].map((name) => (
                <span key={name} className="font-outfit font-bold text-sm tracking-tight hover:text-[#111] transition-colors cursor-default">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════════
          SECTION 4: Three Vantage Points (Role Cards)
          ════════════════════════════════════════════════════════════ */}
      <section id="roles" className="max-w-6xl mx-auto px-6 py-24">
        <div className="mb-16 animate-fade-in-up">
          <p className="section-label mb-4">One graph, three vantage points</p>
          <h2 className="font-outfit font-black text-3xl md:text-[2.75rem] leading-[1.1] tracking-tight text-[#111] max-w-xl">
            Built for everyone shaping the startup.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Founders */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col justify-between hover:shadow-lg hover:border-gray-300 transition-all duration-200 animate-fade-in-up">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#111] flex items-center justify-center mb-6">
                <BarChart3 size={22} className="text-white" />
              </div>
              <h3 className="font-outfit font-bold text-xl text-[#111] mb-3">Founders</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Run execution from one graph — runway, equity, memory, and momentum in a single loop.
              </p>
              <ul className="space-y-2.5 mb-8">
                {['Runway & equity planners', 'Founder memory', 'Micro-bounties'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-[#111]">
                    <Check size={15} className="text-[#C8E64A] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={handleCTA}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#111] hover:gap-2.5 transition-all"
            >
              Explore role <ArrowUpRight size={14} />
            </button>
          </div>

          {/* Investors */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col justify-between hover:shadow-lg hover:border-gray-300 transition-all duration-200 animate-fade-in-up" style={{ animationDelay: '0.08s' }}>
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#111] flex items-center justify-center mb-6">
                <TrendingUp size={22} className="text-white" />
              </div>
              <h3 className="font-outfit font-bold text-xl text-[#111] mb-3">Investors</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Discover, score, and track deal flow with compatibility matching grounded in real signals.
              </p>
              <ul className="space-y-2.5 mb-8">
                {['Compatibility matching', 'Deal flow views', 'Signal-based briefs'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-[#111]">
                    <Check size={15} className="text-[#C8E64A] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={handleCTA}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#111] hover:gap-2.5 transition-all"
            >
              Explore role <ArrowUpRight size={14} />
            </button>
          </div>

          {/* Institutions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col justify-between hover:shadow-lg hover:border-gray-300 transition-all duration-200 animate-fade-in-up" style={{ animationDelay: '0.16s' }}>
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#111] flex items-center justify-center mb-6">
                <Building2 size={22} className="text-white" />
              </div>
              <h3 className="font-outfit font-bold text-xl text-[#111] mb-3">Institutions</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Monitor ecosystems, run programs, and measure public impact across your region.
              </p>
              <ul className="space-y-2.5 mb-8">
                {['Ecosystem monitoring', 'Programs & grants', 'Impact reporting'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-[#111]">
                    <Check size={15} className="text-[#C8E64A] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={handleCTA}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#111] hover:gap-2.5 transition-all"
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
            <h2 className="font-outfit font-black text-3xl md:text-[2.75rem] leading-[1.1] tracking-tight text-[#111]">
              Modules that read and write the same graph.
            </h2>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed lg:text-right">
            No isolated tables, no dead dashboards. Every surface reflects the same underlying truth about your startup.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Network, title: 'Startup Graph', desc: 'Every milestone, decision, and metric attaches to one living data model.', bg: 'bg-white' },
            { icon: Radio, title: 'Signals', desc: 'Market, product, and competitive signals feed your intelligence layer.', bg: 'bg-[#F0EDE6]' },
            { icon: Brain, title: 'Founder Memory', desc: 'Capture decisions and their outcomes — validated or invalidated.', bg: 'bg-white' },
            { icon: FileText, title: 'Insights & Briefs', desc: 'Generate analysis and data-room ready briefs from live graph state.', bg: 'bg-white' },
            { icon: DollarSign, title: 'Runway & Equity', desc: 'Model burn, cash, and cap table with scenarios that stay in sync.', bg: 'bg-[#F0EDE6]' },
            { icon: TrendingUp, title: 'Deal Flow', desc: 'Score compatibility and track pipeline with transparent reasoning.', bg: 'bg-white' },
          ].map((mod, i) => (
            <div
              key={mod.title}
              className={`${mod.bg} rounded-2xl border border-gray-200 p-7 hover:shadow-md hover:border-gray-300 transition-all duration-200 animate-fade-in-up`}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <mod.icon size={20} className="text-gray-400 mb-5" strokeWidth={1.5} />
              <h3 className="font-outfit font-bold text-base text-[#111] mb-2">{mod.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{mod.desc}</p>
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
            <h2 className="font-outfit font-black text-3xl md:text-[2.75rem] leading-[1.1] tracking-tight text-[#111] mb-12">
              Your work becomes an asset, not a log.
            </h2>

            <div className="space-y-10">
              {[
                { num: '1', title: 'Capture', desc: 'Log milestones, decisions, and signals as you operate.' },
                { num: '2', title: 'Connect', desc: 'Everything attaches to a startup_id in one living graph.' },
                { num: '3', title: 'Compound', desc: 'Reports and briefs write structured state back to the graph.' },
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-5">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-outfit font-bold text-sm text-[#111]">{step.num}</span>
                  </div>
                  <div>
                    <h4 className="font-outfit font-bold text-base text-[#111] mb-1">{step.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
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
          SECTION 7: Testimonial / Field Note
          ════════════════════════════════════════════════════════════ */}
      <section id="testimonial" className="bg-[#1A1A1A] text-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left: Quote */}
            <div className="animate-fade-in-up">
              <p className="text-[10px] font-outfit font-semibold uppercase tracking-[0.2em] text-gray-400 mb-8">Field note</p>
              <blockquote className="font-outfit font-bold text-xl md:text-2xl leading-snug text-white/95 mb-10">
                "Stratify replaced four tools and a dozen spreadsheets. For the first time, our board deck, runway, and product signals all tell the same story — because they're the same data."
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#C8E64A] flex items-center justify-center font-outfit font-bold text-sm text-[#111]">
                  PN
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Priya Nair</p>
                  <p className="text-xs text-gray-400">CEO, Atlas Freight</p>
                </div>
              </div>
            </div>

            {/* Right: Metrics grid */}
            <div className="grid grid-cols-2 gap-px bg-gray-700/30 rounded-xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              {[
                { value: '4→1', label: 'tools consolidated' },
                { value: '9hrs', label: 'saved / week' },
                { value: '+22%', label: 'MRR momentum' },
                { value: '14mo', label: 'runway clarity' },
              ].map((metric) => (
                <div key={metric.label} className="bg-[#1A1A1A] p-8">
                  <span className="block font-outfit font-black text-3xl text-white mb-2">{metric.value}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">{metric.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════════
          SECTION 7.5: Pricing Plans (Show Only)
          ════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24 border-t border-gray-200/60">
        <div className="text-center mb-16 animate-fade-in-up">
          <p className="section-label mb-4">Flexible plans for the entire ecosystem</p>
          <h2 className="font-outfit font-black text-3xl md:text-5xl tracking-tight text-[#111] mb-5">
            Transparent Pricing. Mapped to your scale.
          </h2>
          <p className="text-base text-gray-500 max-w-md mx-auto">
            Choose the workspace built specifically for your role. All plans come with full graph indexing capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch select-none">
          {/* Plan 1: Founder OS */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col justify-between hover:shadow-lg transition-all animate-fade-in-up">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-[10px] font-bold uppercase rounded font-outfit">Founder OS</span>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-outfit font-black text-[#111]">$49</span>
                <span className="text-gray-400 text-sm font-semibold"> / mo</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-6 font-inter font-light">
                Perfect for early-stage and scaling founders seeking unified runway, cap table, and memory loops.
              </p>
              <div className="border-t border-gray-100 pt-6">
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-4">Key Capabilities</span>
                <ul className="space-y-3.5">
                  {['Unified Startup Graph', 'Cap Table Scenarios', 'Runway & Burn Modeling', 'AI Journey Generation'].map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5 text-xs text-gray-700 font-semibold">
                      <Check size={14} className="text-[#C8E64A] shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button 
              onClick={handleCTA}
              className="w-full mt-8 py-2.5 bg-white border border-gray-250 hover:border-black text-[#111] text-xs font-outfit font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
            >
              Select Plan
            </button>
          </div>

          {/* Plan 2: Investor OS (Featured) */}
          <div className="bg-[#1A1A1A] text-white rounded-2xl border-0 p-8 flex flex-col justify-between hover:shadow-xl transition-all relative overflow-hidden group animate-fade-in-up">
            <div className="absolute top-0 right-0 bg-[#C8E64A] text-black text-[9px] font-black uppercase px-3 py-1 rounded-bl-lg tracking-wider">
              Popular Choice
            </div>
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="px-2.5 py-1 bg-white/10 text-white text-[10px] font-bold uppercase rounded font-outfit">Investor OS</span>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-outfit font-black text-white">$299</span>
                <span className="text-gray-400 text-sm font-semibold"> / mo</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mb-6 font-inter font-light">
                Engineered for VCs, angels, and syndicate leads looking to source pipeline and automate diligence briefs.
              </p>
              <div className="border-t border-white/10 pt-6">
                <span className="block text-[10px] font-black text-gray-505 uppercase tracking-wider mb-4">Investor Features</span>
                <ul className="space-y-3.5">
                  {['Ecosystem-Wide Search', 'Sector Thesis Matcher', 'One-Click Diligence Audits', 'Secure Investor Data Rooms'].map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5 text-xs text-white/90 font-semibold">
                      <Check size={14} className="text-[#C8E64A] shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button 
              onClick={handleCTA}
              className="w-full mt-8 py-2.5 bg-[#C8E64A] text-black hover:bg-[#B5D235] text-xs font-outfit font-bold uppercase tracking-wider rounded-lg border-0 transition-all cursor-pointer"
            >
              Select Plan
            </button>
          </div>

          {/* Plan 3: Institution OS */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col justify-between hover:shadow-lg transition-all animate-fade-in-up">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-[10px] font-bold uppercase rounded font-outfit">Institution OS</span>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-outfit font-black text-[#111]">$999</span>
                <span className="text-gray-400 text-sm font-semibold"> / mo</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-6 font-inter font-light">
                Designed for government grants, academic institutions, and regional ecosystem builders.
              </p>
              <div className="border-t border-gray-100 pt-6">
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-4">Institutional Features</span>
                <ul className="space-y-3.5">
                  {['Regional Health Telemetry', 'Program & Grant Deployment', 'Public Impact Analysis', 'API Integration & Directory Exports'].map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5 text-xs text-gray-700 font-semibold">
                      <Check size={14} className="text-[#C8E64A] shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button 
              onClick={handleCTA}
              className="w-full mt-8 py-2.5 bg-white border border-gray-250 hover:border-black text-[#111] text-xs font-outfit font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
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
          <h2 className="font-outfit font-black text-3xl md:text-5xl tracking-tight text-[#111] mb-5">
            Give your startup a memory.
          </h2>
          <p className="text-base text-gray-500 mb-10 max-w-md mx-auto">
            Set up your workspace and map your first graph in under five minutes.
          </p>
          <button
            onClick={handleCTA}
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#C8E64A] text-[#111] text-sm font-semibold rounded-lg hover:bg-[#B5D235] transition-colors shadow-sm"
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
