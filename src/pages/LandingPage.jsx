import React from 'react';
import { ArrowRight, Shield, Cpu, Zap, Target, Users, Landmark, Coffee, CheckCircle } from 'lucide-react';

export default function LandingPage({ openAuthModal, user }) {
  const handleCTA = () => {
    if (user) {
      window.location.href = '/dashboard';
    } else {
      openAuthModal();
    }
  };

  return (
    <div className="min-h-screen bg-neo-canvas text-black font-outfit selection:bg-[#FCD34D]">
      {/* Header */}
      <header className="border-b-[4px] border-black bg-white select-none sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative w-8 h-8 mr-3 flex-shrink-0">
              <div className="absolute w-5 h-5 rounded-full bg-[#EF4444] border-2 border-black -top-1 -right-1" />
              <svg className="absolute w-6 h-6 bottom-0 left-0" viewBox="0 0 100 100">
                <polygon points="50,10 90,90 10,90" stroke="black" strokeWidth="12" fill="#FCD34D" />
              </svg>
            </div>
            <span className="font-outfit font-black text-xl tracking-tighter uppercase leading-none">
              Stratify
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-black uppercase">
            <a href="#features" className="hover:text-[#3B82F6] transition-colors">Features</a>
            <a href="#roles" className="hover:text-[#3B82F6] transition-colors">Verticals</a>
            <a href="#about" className="hover:text-[#3B82F6] transition-colors">Ecosystem</a>
          </nav>

          <div>
            <button
              onClick={handleCTA}
              className="px-4 py-2 bg-[#3B82F6] text-white border-[3px] border-black text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
            >
              {user ? 'Enter OS' : 'Get Started'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 bg-[#A3E635] border-[3px] border-black px-4 py-1.5 font-outfit font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
            <Zap size={14} /> RECURSIVE STARTUP ECONOMY OPERATING SYSTEM
          </div>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-[0.95] text-black">
            The full operating system for startups, investors, and ecosystems.
          </h1>
          <p className="text-base sm:text-lg font-bold text-gray-700 max-w-2xl leading-relaxed">
            Unify startup execution, founder memory, compatibility-based discovery, and multi-agent intelligence. Stratify grounds every milestone and signal in a real-time product graph.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              onClick={handleCTA}
              className="px-8 py-3.5 bg-[#EF4444] text-white border-[3px] border-black text-sm font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>BOOT THE OPERATING SYSTEM</span>
              <ArrowRight size={16} />
            </button>
            <a
              href="#features"
              className="px-8 py-3.5 bg-white text-black border-[3px] border-black text-sm font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all flex items-center justify-center cursor-pointer"
            >
              EXPLORE CAPABILITIES
            </a>
          </div>
        </div>

        {/* Hero Graphic Container */}
        <div className="lg:col-span-5 relative">
          <div className="neo-card bg-[#FCD34D] border-[4px] border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative rotate-1 select-none">
            <div className="absolute top-2 right-2 flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-black"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 border border-black"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-black"></span>
            </div>
            
            <span className="text-[9px] font-black uppercase text-black/60 block mb-1">SYSTEM STATE CONSOLE</span>
            <h4 className="font-outfit font-black text-sm uppercase text-black mb-3">CONSENSUS INTEL ENGINE</h4>
            
            <div className="space-y-3 font-mono text-[10px] text-black">
              <div className="p-3 border-2 border-black bg-white">
                <span className="block font-black text-[8px] text-gray-500">STARTUP GRAPH</span>
                <span className="font-bold text-xs uppercase">Acme Robotics Inc.</span>
                <div className="mt-1 flex gap-2">
                  <span className="bg-[#EF4444]/20 border border-black px-1 text-[8px] font-black text-red-600">VALIDATING</span>
                  <span className="bg-black text-white px-1 text-[8px] font-black">SCORE: 85</span>
                </div>
              </div>
              <div className="p-3 border-2 border-black bg-white">
                <span className="block font-black text-[8px] text-gray-500">FOUNDER MEMORY</span>
                <p className="font-semibold text-gray-700 italic">"Pivot to B2B subscription model approved after competitor signal analysis."</p>
              </div>
              <div className="p-2 bg-black text-green-400 border border-black flex items-center justify-between">
                <span>🤖 INTEL AGENT STATUS: READY</span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Proof Section */}
      <section className="bg-white border-t-[4px] border-b-[4px] border-black py-8 select-none">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-around items-center gap-6">
          <span className="font-outfit font-black text-xs uppercase text-gray-400 tracking-widest">TRUSTED BY BUILDERS AT</span>
          <span className="font-outfit font-black text-sm uppercase tracking-tight">▲ VECTORS INC.</span>
          <span className="font-outfit font-black text-sm uppercase tracking-tight">❖ ORBIT LABS</span>
          <span className="font-outfit font-black text-sm uppercase tracking-tight">● NUCLEUS VENTURES</span>
          <span className="font-outfit font-black text-sm uppercase tracking-tight">▲ ACCEL HUB</span>
        </div>
      </section>

      {/* Product Explanation & Features */}
      <section id="features" className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="inline-block bg-[#3B82F6] text-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border-2 border-black">
            CAPABILITIES
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase">
            A coherent suite for the startup lifecycle
          </h2>
          <p className="font-outfit font-bold text-gray-600">
            Ditch separate notes, trackers, spreadsheets, and news feeds. Stratify consolidates all your strategy layers into one shared memory.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="neo-card bg-white p-6 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-[#A3E635] p-3 border-2 border-black inline-block mb-4">
              <Cpu size={24} />
            </div>
            <h3 className="font-outfit font-black text-lg uppercase mb-2">Startup Graph</h3>
            <p className="text-xs font-bold text-gray-600 leading-relaxed">
              Every timeline milestone, founder decision, and fundraise memo links back to the central Startup Profile graph. Your company timeline is verified, stateful, and audit-ready.
            </p>
          </div>

          <div className="neo-card bg-white p-6 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-[#C084FC] text-white p-3 border-2 border-black inline-block mb-4">
              <Target size={24} />
            </div>
            <h3 className="font-outfit font-black text-lg uppercase mb-2">Founder Memory</h3>
            <p className="text-xs font-bold text-gray-600 leading-relaxed">
              Keep a strategic record of hypotheses, actions, and invalidations. AI reports query this memory directly so you never repeat experiments that were already invalidated.
            </p>
          </div>

          <div className="neo-card bg-white p-6 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-[#FB923C] text-white p-3 border-2 border-black inline-block mb-4">
              <Landmark size={24} />
            </div>
            <h3 className="font-outfit font-black text-lg uppercase mb-2">Compatibility Matching</h3>
            <p className="text-xs font-bold text-gray-600 leading-relaxed">
              Find partners, investors, or regional government grant opportunities with fit scoring. Stratify calculates alignment by sector, stage, and thesis and displays match reasons.
            </p>
          </div>
        </div>
      </section>

      {/* Role Use Cases / Verticals */}
      <section id="roles" className="bg-[#F8F7F4] border-t-[4px] border-black py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="inline-block bg-[#EF4444] text-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border-2 border-black">
              INTELLIGENT VERTICALS
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase">
              Different roles, unified workspace
            </h2>
            <p className="font-outfit font-bold text-gray-600">
              Stratify customizes its execution dashboards and strategic loops specifically to your vertical requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Founder vertical */}
            <div className="neo-card bg-white p-8 border-[3px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[#A3E635] p-2 border-2 border-black">
                    <Coffee size={20} />
                  </div>
                  <h3 className="font-outfit font-black text-xl uppercase">Founders</h3>
                </div>
                <p className="text-xs font-bold text-gray-600 leading-relaxed">
                  Run your company execution board. Map validation milestones, simulate runway scenarios, plan cap table splits, and get AI-generated checklists tailored to your immediate targets.
                </p>
                <ul className="space-y-2 text-xs font-bold pt-2">
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-600" /> Runway & Scenario Simulators</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-600" /> Decision Memory & Progress Logs</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-600" /> Whitelisted Pitch Brief Data Rooms</li>
                </ul>
              </div>
              <button onClick={handleCTA} className="mt-8 w-full py-2.5 bg-black text-white font-black text-xs uppercase border-2 border-black hover:bg-gray-900 transition-colors">
                Launch Founder OS
              </button>
            </div>

            {/* Investor vertical */}
            <div className="neo-card bg-white p-8 border-[3px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[#C084FC] text-white p-2 border-2 border-black">
                    <Users size={20} />
                  </div>
                  <h3 className="font-outfit font-black text-xl uppercase">Investors / VCs</h3>
                </div>
                <p className="text-xs font-bold text-gray-600 leading-relaxed">
                  Manage your investment pipeline. Discover early-stage startups that fit your geography and thesis focus, evaluate verified startup metrics, and request direct whitelists.
                </p>
                <ul className="space-y-2 text-xs font-bold pt-2">
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-purple-600" /> Live Deal Flow Trackers</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-purple-600" /> Sector & Geography Thesis Fit</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-purple-600" /> Verified Startup Score Metrics</li>
                </ul>
              </div>
              <button onClick={handleCTA} className="mt-8 w-full py-2.5 bg-black text-white font-black text-xs uppercase border-2 border-black hover:bg-gray-900 transition-colors">
                Launch Investor OS
              </button>
            </div>

            {/* Gov vertical */}
            <div className="neo-card bg-white p-8 border-[3px] border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[#3B82F6] text-white p-2 border-2 border-black">
                    <Landmark size={20} />
                  </div>
                  <h3 className="font-outfit font-black text-xl uppercase">Institutions</h3>
                </div>
                <p className="text-xs font-bold text-gray-600 leading-relaxed">
                  Oversee ecosystem support. Promote regional grant schemes, verify eligibility criteria, monitor tech stack growth, and track regional business metrics.
                </p>
                <ul className="space-y-2 text-xs font-bold pt-2">
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-blue-600" /> Grant & Program Distributors</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-blue-600" /> Ecosystem Health Audits</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-blue-600" /> Eligibility Checking Engines</li>
                </ul>
              </div>
              <button onClick={handleCTA} className="mt-8 w-full py-2.5 bg-black text-white font-black text-xs uppercase border-2 border-black hover:bg-gray-900 transition-colors">
                Launch Institutional OS
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="py-24 px-4 text-center max-w-4xl mx-auto space-y-6">
        <h2 className="text-4xl sm:text-6xl font-black uppercase leading-none">
          Ready to operate at terminal velocity?
        </h2>
        <p className="text-base sm:text-lg font-bold text-gray-700 leading-relaxed max-w-xl mx-auto">
          Boot Stratify and transition your startup strategy from unstructured notes into a live, graph-linked system.
        </p>
        <button
          onClick={handleCTA}
          className="inline-flex items-center gap-2.5 px-10 py-4 bg-[#A3E635] text-black border-[3px] border-black text-sm font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all cursor-pointer"
        >
          <span>INITIALIZE WORKSPACE</span>
          <ArrowRight size={16} />
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t-[4px] border-black bg-white py-12 select-none">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center">
            <span className="font-outfit font-black text-lg tracking-tighter uppercase text-black">
              STRATIFY LABS
            </span>
          </div>
          <span className="font-outfit font-black text-[9px] tracking-wider uppercase text-gray-400 text-center md:text-right">
            © {new Date().getFullYear()} STRATIFY LABS INC. • ALL ECOSYSTEM INTELLIGENCE SYSTEM INTERFACES GROUNDED WITH AI LOGIC.
          </span>
        </div>
      </footer>
    </div>
  );
}
