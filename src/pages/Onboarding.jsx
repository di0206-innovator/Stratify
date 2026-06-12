import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Coffee, Briefcase, Landmark } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Onboarding({ founderProfile, setFounderProfile }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(
    founderProfile || {
      industry: 'consumer coffee',
      geography: 'Bengaluru',
      targetCustomer: 'urban professionals',
      product: 'premium organic cold brew delivery',
      startupStage: 'seed',
      founderType: 'technical_founder',
      teamSize: '3 developers',
      budget: 'bootstrapped',
      timeline: '30 days',
      currentGoal: 'validate idea'
    }
  );

  const presets = [
    {
      label: 'D2C Coffee Delivery',
      icon: Coffee,
      color: 'bg-[#A3E635]',
      data: {
        industry: 'consumer coffee',
        geography: 'Bengaluru',
        targetCustomer: 'urban professionals',
        product: 'premium organic cold brew delivery',
        startupStage: 'seed',
        founderType: 'technical_founder',
        teamSize: '3 developers',
        budget: 'bootstrapped',
        timeline: '30 days',
        currentGoal: 'validate idea'
      }
    },
    {
      label: 'B2B Logistics SaaS',
      icon: Briefcase,
      color: 'bg-[#C084FC]',
      data: {
        industry: 'warehouse logistics software',
        geography: 'Munich',
        targetCustomer: 'medium logistics providers',
        product: 'AI-driven yard space optimization',
        startupStage: 'pre_seed',
        founderType: 'industry_expert',
        teamSize: '2 founders',
        budget: '150k seed funding',
        timeline: '90 days',
        currentGoal: 'prepare investor memo'
      }
    },
    {
      label: 'Fintech Micro-lending',
      icon: Landmark,
      color: 'bg-[#FB923C]',
      data: {
        industry: 'retail micro-finance',
        geography: 'Nairobi',
        targetCustomer: 'market kiosk operators',
        product: 'whatsapp-integrated inventory lines',
        startupStage: 'series_a',
        founderType: 'product_strategist',
        teamSize: '12 employees',
        budget: '500k runway',
        timeline: '60 days',
        currentGoal: 'gtm strategy'
      }
    }
  ];

  const applyPreset = (presetData) => {
    setFormData(presetData);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#A3E635', '#C084FC', '#FB923C', '#000000']
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFounderProfile(formData);
    localStorage.setItem('neuralbi_founder_profile', JSON.stringify(formData));
    
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#A3E635', '#000000', '#F8F7F4']
    });

    setTimeout(() => {
      navigate('/');
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10 select-none">
        <div className="inline-flex items-center gap-2 bg-[#A3E635] border-[3px] border-black px-4 py-1.5 font-outfit font-black text-sm uppercase tracking-wider mb-4 shadow-neo-button transform -rotate-1">
          <Sparkles size={16} /> SETUP FOUNDER PROFILE
        </div>
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-3">
          Configure Your Wedge
        </h1>
        <p className="font-outfit font-bold text-gray-700 max-w-xl mx-auto">
          Map your product and sector constraints. Our agent network uses this profile to curate live market feeds, run focused sweeps, and build tactical strategies.
        </p>
      </div>

      {/* Presets Bar */}
      <div className="mb-10 neo-card bg-[#F8F7F4]">
        <h3 className="text-sm font-black uppercase mb-3 text-gray-500">Fast Presets</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {presets.map((preset, index) => {
            const Icon = preset.icon;
            return (
              <button
                key={index}
                type="button"
                onClick={() => applyPreset(preset.data)}
                className="flex items-center gap-3 px-4 py-3 bg-white border-[3px] border-black font-black text-sm uppercase text-left transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-neo-button active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
              >
                <div className={`${preset.color} border-2 border-black p-1.5`}>
                  <Icon size={16} className="text-black" />
                </div>
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Onboarding Form */}
      <form onSubmit={handleSubmit} className="neo-card space-y-6 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Industry */}
          <div>
            <label className="block text-sm font-black uppercase mb-2">Target Industry / Sector</label>
            <input
              type="text"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              placeholder="e.g. D2C speciality coffee, last-mile delivery"
              required
              className="neo-input"
            />
          </div>

          {/* Geography */}
          <div>
            <label className="block text-sm font-black uppercase mb-2">Focus Geography / City</label>
            <input
              type="text"
              name="geography"
              value={formData.geography}
              onChange={handleChange}
              placeholder="e.g. Bengaluru, Munich, Global"
              required
              className="neo-input"
            />
          </div>

          {/* Product Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-black uppercase mb-2">Product wedge & Core Innovation</label>
            <input
              type="text"
              name="product"
              value={formData.product}
              onChange={handleChange}
              placeholder="e.g. subscription based premium organic cold brew concentrates in bags"
              required
              className="neo-input"
            />
          </div>

          {/* Target Customer */}
          <div>
            <label className="block text-sm font-black uppercase mb-2">Target Customer Persona</label>
            <input
              type="text"
              name="targetCustomer"
              value={formData.targetCustomer}
              onChange={handleChange}
              placeholder="e.g. young professionals, logistics managers"
              required
              className="neo-input"
            />
          </div>

          {/* Founder Type */}
          <div>
            <label className="block text-sm font-black uppercase mb-2">Founder Strengths Archetype</label>
            <select
              name="founderType"
              value={formData.founderType}
              onChange={handleChange}
              className="neo-input"
            >
              <option value="technical_founder">Technical Founder (Product/Engineering)</option>
              <option value="industry_expert">Industry Veteran (Domain Network)</option>
              <option value="product_strategist">Product/GTM Strategist (Growth)</option>
              <option value="first_time_founder">Generalist Hustler (Jack-of-all-trades)</option>
            </select>
          </div>

          {/* Startup Stage */}
          <div>
            <label className="block text-sm font-black uppercase mb-2">Startup Stage</label>
            <select
              name="startupStage"
              value={formData.startupStage}
              onChange={handleChange}
              className="neo-input"
            >
              <option value="idea">Idea Stage (Pre-product)</option>
              <option value="pre_seed">Pre-seed (MVP validation)</option>
              <option value="seed">Seed Stage (Early traction/revenue)</option>
              <option value="series_a">Series A+ (Scaling distribution)</option>
            </select>
          </div>

          {/* Team size */}
          <div>
            <label className="block text-sm font-black uppercase mb-2">Team Size</label>
            <input
              type="text"
              name="teamSize"
              value={formData.teamSize}
              onChange={handleChange}
              placeholder="e.g. Solo founder, 3 engineers"
              className="neo-input"
            />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-black uppercase mb-2">Available Budget / Runway</label>
            <input
              type="text"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              placeholder="e.g. Bootstrapped, 100k angel investment"
              className="neo-input"
            />
          </div>

          {/* Timeline */}
          <div>
            <label className="block text-sm font-black uppercase mb-2">Strategic Time Window</label>
            <input
              type="text"
              name="timeline"
              value={formData.timeline}
              onChange={handleChange}
              placeholder="e.g. 30 days, 6 months"
              className="neo-input"
            />
          </div>

          {/* Primary Goal */}
          <div>
            <label className="block text-sm font-black uppercase mb-2">Current Strategic Goal</label>
            <select
              name="currentGoal"
              value={formData.currentGoal}
              onChange={handleChange}
              className="neo-input"
            >
              <option value="validate idea">Validate Value Proposition & Demand</option>
              <option value="gtm strategy">Define First Channel & GTM Strategy</option>
              <option value="prepare investor memo">Compile Investor Strategy Memo</option>
              <option value="competitor analysis">Extract Defensible Competitor Wedge</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t-[3px] border-black flex justify-end">
          <button
            type="submit"
            className="neo-btn-primary text-base px-8 py-3"
          >
            <span>LAUNCH STRATEGY SYSTEM</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
