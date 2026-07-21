import React from 'react';
import { Users, ArrowLeft, Linkedin, Target, Shield, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-12 animate-fade-in text-text-primary select-text">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-1.5 font-outfit font-bold text-xs uppercase text-text-muted hover:text-text-primary mb-2 transition-colors select-none">
        <ArrowLeft size={14} /> Back to home
      </Link>

      <div className="flex items-center gap-3 pb-6 border-b border-light select-none">
        <div className="bg-[#1A1A1A] p-3 text-white rounded-lg">
          <Users size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-outfit font-black tracking-tight uppercase">About Stratify</h1>
          <p className="font-inter text-text-secondary mt-1 text-sm">
            Building the Operating System for the Global Startup Economy.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-text-secondary leading-relaxed font-inter">
        <div className="space-y-4">
          <h2 className="font-outfit font-bold text-black text-lg uppercase flex items-center gap-2 select-none">
            <Target size={18} className="text-[#C8E64A]" /> Our Mission
          </h2>
          <p>
            Startups are complex, dynamic networks of decisions, validation experiments, timeline events, and capital flows. Yet today, these streams are fragmented across slide decks, isolated spreadsheets, and legacy portals.
          </p>
          <p>
            Stratify unites these layers into one context-aware graph. By binding memory, execution metrics, and market signals together, we empower founders to validation-check their direction, and help ecosystems coordinate capital efficiently.
          </p>
        </div>
        <div className="space-y-4">
          <h2 className="font-outfit font-bold text-black text-lg uppercase flex items-center gap-2 select-none">
            <Shield size={18} className="text-[#C8E64A]" /> Context-Aware Moat
          </h2>
          <p>
            Powered by our multi-agent QA critic architectures, Stratify acts as a 24/7 strategic advisor. It analyzes your constraints (burn rate, timeline, team) against live market signals to produce highly customized execution plays.
          </p>
          <p>
            We are dedicated to building premium-grade, accessible toolings that eliminate operational noise, allowing builders to focus exclusively on executing their product roadmap.
          </p>
        </div>
      </div>

      {/* Leadership Profile */}
      <div className="bg-canvas border border-light p-8 rounded-2xl space-y-6">
        <h2 className="font-outfit font-black text-black text-xl uppercase tracking-tight select-none">Founding Team</h2>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-t border-light pt-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#1A1A1A] text-white rounded-xl flex items-center justify-center font-outfit font-black text-2xl select-none">
              DS
            </div>
            <div>
              <h3 className="font-outfit font-black text-lg text-black leading-tight uppercase">Divyanshu Sinha</h3>
              <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider mt-0.5 select-none">Founder & CEO</p>
            </div>
          </div>

          <a 
            href="https://www.linkedin.com/in/divyanshu-sinha-46074126b/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-[#111] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-accent-hover transition-colors shadow-sm select-none"
          >
            <Linkedin size={14} />
            <span>Connect on LinkedIn</span>
          </a>
        </div>
      </div>
    </div>
  );
}
