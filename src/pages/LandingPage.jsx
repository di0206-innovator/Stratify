import React from 'react';
import { ArrowRight, Cpu, Target, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage({ openAuthModal, user }) {
 const handleCTA = () => {
 if (user) {
 window.location.href = '/dashboard';
 } else {
 openAuthModal();
 }
 };

 return (
 <div className="min-h-screen bg-[#F8F7F4] text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
 {/* Hero Section */}
 <section className="relative pt-24 pb-32 px-4 max-w-6xl mx-auto flex flex-col items-center text-center">
 <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-8">
 The Operating System for the Startup Economy
 </div>
 
 <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 max-w-4xl mb-6">
 Unify your startup's execution and intelligence.
 </h1>
 
 <p className="text-lg md:text-xl text-gray-500 max-w-2xl mb-10 leading-relaxed">
 Stratify consolidates your cap table, founder memory, and investor updates into a single stateful graph. Ditch the chaotic spreadsheets and move to a true operating system.
 </p>
 
 <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
 <button
 onClick={handleCTA}
 className="os-btn-primary px-8 py-4 text-base"
 >
 {user ? 'Enter Dashboard' : 'Boot Stratify OS'} <ArrowRight size={18} />
 </button>
 <a
 href="#platform"
 className="os-btn px-8 py-4 text-base bg-white"
 >
 Explore Platform
 </a>
 </div>
 </section>

 {/* Trust & Social Proof */}
 <section className="border-y border-gray-200 bg-white py-10">
 <div className="max-w-6xl mx-auto px-4 flex flex-col items-center">
 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Trusted by Founders & Partners at</p>
 <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
 <span className="font-bold text-xl tracking-tight">▲ VECTORS INC.</span>
 <span className="font-bold text-xl tracking-tight">❖ ORBIT LABS</span>
 <span className="font-bold text-xl tracking-tight">● NUCLEUS VENTURES</span>
 <span className="font-bold text-xl tracking-tight">▲ ACCEL HUB</span>
 </div>
 </div>
 </section>

 {/* Platform Features Grid */}
 <section id="platform" className="py-24 px-4 max-w-6xl mx-auto">
 <div className="text-center max-w-2xl mx-auto mb-16">
 <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-4">
 A cohesive suite for modern builders
 </h2>
 <p className="text-gray-500 text-lg">
 Every layer of your startup is interconnected. Stratify ensures your milestones, cap table, and market signals all communicate.
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 {/* Feature 1 */}
 <div className="os-card bg-white p-8">
 <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-6">
 <Cpu size={24} />
 </div>
 <h3 className="text-xl font-bold text-gray-900 mb-3">Startup Graph</h3>
 <p className="text-gray-500 leading-relaxed">
 Every timeline milestone, founder decision, and fundraise memo links back to the central Startup Profile graph. Your company history becomes queryable.
 </p>
 </div>

 {/* Feature 2 */}
 <div className="os-card bg-white p-8">
 <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-6">
 <Target size={24} />
 </div>
 <h3 className="text-xl font-bold text-gray-900 mb-3">Founder Memory</h3>
 <p className="text-gray-500 leading-relaxed">
 Log validated hypotheses and market pivots directly into your graph. No more scattered Notion pages. Investors see a clear history of disciplined execution.
 </p>
 </div>

 {/* Feature 3 */}
 <div className="os-card bg-white p-8">
 <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-6">
 <Layers size={24} />
 </div>
 <h3 className="text-xl font-bold text-gray-900 mb-3">Multi-Agent Intelligence</h3>
 <p className="text-gray-500 leading-relaxed">
 Spawn autonomous agents to generate market briefs, run competitor analysis, or match you with thesis-aligned VC partners while you sleep.
 </p>
 </div>
 </div>
 </section>

 {/* Bottom CTA */}
 <section className="py-24 px-4 bg-gray-900 text-white text-center">
 <div className="max-w-3xl mx-auto">
 <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
 Ready to upgrade your operational stack?
 </h2>
 <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
 Join the founders, investors, and ecosystem builders utilizing Stratify to bring transparency and efficiency to the startup economy.
 </p>
 <button
 onClick={handleCTA}
 className="os-btn-primary bg-white text-gray-900 border-white hover:bg-gray-100 hover:border-gray-100 px-8 py-4 text-base"
 >
 Create Your Startup Profile
 </button>
 </div>
 </section>
 </div>
);
}
