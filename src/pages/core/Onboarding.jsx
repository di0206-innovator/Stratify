import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Sparkles, Coffee, Landmark, Building, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const STAGES = {
  founder: ['idea', 'pre_seed', 'seed', 'series_a'],
  stageLabels: {
    idea: 'Idea Stage (Pre-product)',
    pre_seed: 'Pre-seed (MVP Validation)',
    seed: 'Seed (Early Traction)',
    series_a: 'Series A+ (Scaling)'
  },
  goals: [
    { value: 'validate idea', label: 'Validate Value Proposition & Demand' },
    { value: 'gtm strategy', label: 'Define First Channel & GTM Strategy' },
    { value: 'prepare investor memo', label: 'Compile Investor Strategy Memo' },
    { value: 'competitor analysis', label: 'Extract Defensible Competitor Wedge' }
  ],
  investmentStages: [
    { value: 'pre_seed', label: 'Pre-seed' },
    { value: 'seed', label: 'Seed Stage' },
    { value: 'series_a', label: 'Series A' },
    { value: 'series_b', label: 'Series B & Beyond' }
  ],
  programTypes: [
    'Grants & Subsidies',
    'Tax Rebates & SR&ED Credits',
    'Co-working Space & Incubation',
    'Equity Co-investments / Sovereign Fund'
  ]
};

const ROLES = [
  {
    id: 'founder',
    icon: Coffee,
    label: 'Startup Founder',
    desc: 'Build your startup, validate hypotheses, manage runway, and compile investor pitch briefs.',
    ring: 'ring-2 ring-black border-black bg-card',
    iconBg: 'bg-accent/20 text-black',
  },
  {
    id: 'vc',
    icon: Landmark,
    label: 'VC / Investor',
    desc: 'Source deal flow, track thesis alignment, analyze startup risks, and manage watchlists.',
    ring: 'ring-2 ring-black border-black bg-card',
    iconBg: 'bg-accent/20 text-black',
  },
  {
    id: 'institution',
    icon: Building,
    label: 'Institutions (Gov, College, Incubators)',
    desc: 'Promote grant schemes, assess regional ecosystem health, eligibility, and impact outreach.',
    ring: 'ring-2 ring-black border-black bg-card',
    iconBg: 'bg-accent/20 text-black',
  }
];

export default function Onboarding({ founderProfile, setFounderProfile }) {
  const navigate = useNavigate();
  const [role, setRole] = useState('founder');
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: '', industry: '', geography: '', product: '',
    targetCustomer: '', startupStage: 'idea', teamSize: '',
    budget: '', timeline: '', currentGoal: 'validate idea',
    firmName: '', sectors: '', ticketSize: '', investmentStage: 'pre_seed',
    thesis: '', investmentIntent: 'Growth equity partnerships',
    orgName: '', region: '', mandate: '', programType: 'Grants & Subsidies',
    sectorPriorities: '', supportFocus: 'R&D Commercialization',
    ecosystemGoals: 'Job creation and regional technology growth'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectRole = (selectedRole) => {
    setRole(selectedRole);
    confetti({ 
      particleCount: 50, 
      spread: 40, 
      origin: { y: 0.7 }, 
      colors: ['#C8E64A', '#1A1A1A', '#FAF9F6'] 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const profile = {
      role,
      ...(role === 'founder' ? {
        name: formData.name || 'My Startup',
        industry: formData.industry || 'Tech SaaS',
        geography: formData.geography || 'Global',
        product: formData.product || 'Next-gen platform',
        targetCustomer: formData.targetCustomer || 'Developers',
        startupStage: formData.startupStage || 'idea',
        teamSize: formData.teamSize || 'Solo',
        budget: formData.budget || 'Bootstrapped',
        timeline: formData.timeline || '30 days',
        currentGoal: formData.currentGoal || 'validate idea'
      } : role === 'vc' ? {
        name: formData.firmName || 'Venture Partners',
        geography: formData.geography || 'Global',
        industry: formData.sectors || 'AI, SaaS',
        ticketSize: formData.ticketSize || '$250k - $1M',
        investmentStage: formData.investmentStage || 'seed',
        thesis: formData.thesis || 'Investing in early-stage builders',
        intent: formData.investmentIntent
      } : {
        name: formData.orgName || 'Ecosystem Support Agency',
        geography: formData.region || 'Local Region',
        industry: formData.sectorPriorities || 'All Technology Sectors',
        mandate: formData.mandate || 'Fostering regional startup ecosystem growth',
        programType: formData.programType,
        supportFocus: formData.supportFocus,
        ecosystemGoals: formData.ecosystemGoals
      })
    };

    setFounderProfile(profile);
    localStorage.setItem('stratify_founder_profile', JSON.stringify(profile));

    try {
      await fetch('/api/users/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (role === 'founder') {
        await fetch('/api/startups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: profile.name, pitch: profile.product, problem: profile.targetCustomer,
            solution: profile.product, stage: profile.startupStage, industry: profile.industry,
            geography: profile.geography, teamStatus: profile.teamSize, traction: 'Ideation',
            needs: profile.currentGoal, techStack: 'Not specified'
          })
        });
      }
    } catch (err) {
      console.warn('Backend profile/startup save failed:', err);
    }

    confetti({ 
      particleCount: 150, 
      spread: 80, 
      origin: { y: 0.5 }, 
      colors: ['#C8E64A', '#1A1A1A', '#FAF9F6'] 
    });
    setTimeout(() => navigate('/dashboard'), 700);
  };

  const selectedRole = ROLES.find(r => r.id === role);

  return (
    <div className="min-h-screen bg-canvas flex flex-col font-inter">
      {/* Top Bar */}
      <div className="w-full border-b border-light bg-card px-6 py-3.5 flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] flex items-center justify-center text-white font-outfit font-black text-sm">
            S
          </div>
          <span className="font-outfit font-black text-base tracking-tight uppercase">Stratify</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold text-text-muted uppercase tracking-wider font-outfit">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-text-primary text-[10px] font-black ${step >= 1 ? 'bg-accent' : 'bg-gray-200'}`}>1</div>
          <div className={`h-0.5 w-8 ${step >= 2 ? 'bg-[#1A1A1A]' : 'bg-gray-200'}`} />
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-text-primary text-[10px] font-black ${step >= 2 ? 'bg-accent' : 'bg-gray-200'}`}>2</div>
          <span className="ml-2 text-text-secondary font-semibold">Workspace Setup</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-3xl">

          {/* Step 1 — Role Selection */}
          {step === 1 && (
            <div className="animate-slide-up">
              {/* Header */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 bg-accent/15 border border-[#C8E64A]/30 text-text-primary px-4 py-1.5 font-bold text-xs uppercase tracking-wider mb-5 rounded-full font-outfit">
                  <Sparkles size={14} /> WELCOME TO STRATIFY
                </div>
                <h1 className="text-3xl sm:text-4xl font-outfit font-black text-text-primary tracking-tight mb-3">
                  Initialize Your Workspace
                </h1>
                <p className="text-sm font-medium text-text-secondary max-w-md mx-auto leading-relaxed">
                  Select your vertical and complete the workspace registry. Stratify structures its intelligence, dashboard modules, and discovery engines based on your role.
                </p>
              </div>

              {/* Role Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {ROLES.map(({ id, icon: Icon, label, desc, ring, iconBg }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectRole(id)}
                    className={`flex flex-col items-center p-6 border rounded-xl text-center cursor-pointer transition-all duration-200 ${
                      role === id 
                        ? 'border-black bg-card shadow-sm ring-1 ring-black' 
                        : 'border-light bg-card hover:border-DEFAULT hover:shadow-sm'
                    }`}
                  >
                    <div className={`p-3 rounded-xl mb-4 ${role === id ? iconBg : 'bg-hover text-text-muted'}`}>
                      <Icon size={24} />
                    </div>
                    <span className="font-outfit font-bold text-sm text-text-primary mb-2">{label}</span>
                    <p className="text-xs text-text-secondary leading-relaxed">{desc}</p>
                    {role === id && (
                      <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-text-primary bg-accent/30 px-2.5 py-1 rounded-full">
                        <CheckCircle size={12} /> Selected
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Continue Button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-8 py-3 bg-[#1A1A1A] text-white text-sm font-semibold rounded-lg hover:bg-[#333] transition-colors"
                >
                  <span>Continue to Workspace Setup</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Role-specific Form */}
          {step === 2 && (
            <div className="animate-slide-up">
              {/* Header */}
              <div className="mb-8">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-text-primary transition-colors mb-4"
                >
                  <ArrowLeft size={14} /> Back to role selection
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-accent/25 text-black">
                    <selectedRole.icon size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-outfit font-bold text-text-primary leading-tight">
                      {role === 'founder' && 'Startup Context Registry'}
                      {role === 'vc' && 'Investor Thesis Registry'}
                      {role === 'institution' && 'Institutional Mandate Registry'}
                    </h2>
                    <p className="text-xs text-text-muted font-semibold mt-0.5">
                      This data structures your Stratify OS experience. Fill in what you know.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="bg-card border border-light rounded-xl shadow-sm p-6 sm:p-8 space-y-6">

                {/* ── FOUNDER FIELDS ── */}
                {role === 'founder' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Startup Name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Acme AI" required />
                    <Field label="Target Industry / Sector" name="industry" value={formData.industry} onChange={handleChange} placeholder="e.g. ClimateTech, B2B SaaS" required />
                    <Field label="Focus Geography" name="geography" value={formData.geography} onChange={handleChange} placeholder="e.g. Bengaluru, Munich, Global" required />
                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5 tracking-wide">Startup Stage</label>
                      <select name="startupStage" value={formData.startupStage} onChange={handleChange} className="os-input">
                        {Object.entries(STAGES.stageLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="Product Wedge & Core Innovation" name="product" value={formData.product} onChange={handleChange} placeholder="e.g. subscription-based premium organic cold brew concentrates" required />
                    </div>
                    <Field label="Target Customer Persona" name="targetCustomer" value={formData.targetCustomer} onChange={handleChange} placeholder="e.g. urban professionals, developers" required />
                    <Field label="Team Size" name="teamSize" value={formData.teamSize} onChange={handleChange} placeholder="e.g. Solo founder, 3 engineers" />
                    <Field label="Available Budget / Runway" name="budget" value={formData.budget} onChange={handleChange} placeholder="e.g. Bootstrapped, $100k seed" />
                    <Field label="Strategic Time Window" name="timeline" value={formData.timeline} onChange={handleChange} placeholder="e.g. 30 days, 6 months" />
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5 tracking-wide">Current Strategic Goal</label>
                      <select name="currentGoal" value={formData.currentGoal} onChange={handleChange} className="os-input">
                        {STAGES.goals.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* ── VC FIELDS ── */}
                {role === 'vc' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="VC Firm / Fund Name" name="firmName" value={formData.firmName} onChange={handleChange} placeholder="e.g. Sequoia India, Accel" required />
                    <Field label="Geography Focus" name="geography" value={formData.geography} onChange={handleChange} placeholder="e.g. India, South-East Asia, US" required />
                    <Field label="Target Sectors / Industries" name="sectors" value={formData.sectors} onChange={handleChange} placeholder="e.g. FinTech, AI Infrastructure" required />
                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5 tracking-wide">Preferred Investment Stage</label>
                      <select name="investmentStage" value={formData.investmentStage} onChange={handleChange} className="os-input">
                        {STAGES.investmentStages.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <Field label="Average Ticket Size" name="ticketSize" value={formData.ticketSize} onChange={handleChange} placeholder="e.g. $500k - $2M" />
                    <Field label="Investment Intent" name="investmentIntent" value={formData.investmentIntent} onChange={handleChange} placeholder="e.g. Lead investor, co-investor" />
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5 tracking-wide">Investment Thesis</label>
                      <textarea name="thesis" value={formData.thesis} onChange={handleChange} rows={4} placeholder="Describe your core thesis or what qualities you look for in founders..." className="os-input resize-none" />
                    </div>
                  </div>
                )}

                {/* ── INSTITUTION FIELDS ── */}
                {role === 'institution' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Organization Name" name="orgName" value={formData.orgName} onChange={handleChange} placeholder="e.g. Innovation Karnataka, Tech Singapore" required />
                    <Field label="Region / Mandate Geography" name="region" value={formData.region} onChange={handleChange} placeholder="e.g. Karnataka, Singapore, EU" required />
                    <Field label="Sector Priorities" name="sectorPriorities" value={formData.sectorPriorities} onChange={handleChange} placeholder="e.g. DeepTech, BioTech, AgTech, Climate" required />
                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5 tracking-wide">Program Types Available</label>
                      <select name="programType" value={formData.programType} onChange={handleChange} className="os-input">
                        {STAGES.programTypes.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <Field label="Institution Support Focus" name="supportFocus" value={formData.supportFocus} onChange={handleChange} placeholder="e.g. R&D Commercialization, Startup Incubation" />
                    <Field label="Mandate Statement" name="mandate" value={formData.mandate} onChange={handleChange} placeholder="e.g. Deploy INR 200 Cr to support 1000 technical founders" required />
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5 tracking-wide">Ecosystem Goals</label>
                      <textarea name="ecosystemGoals" value={formData.ecosystemGoals} onChange={handleChange} rows={3} placeholder="What indicators determine regional ecosystem success for your agency..." className="os-input resize-none" />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-text-primary transition-colors">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button type="submit" className="flex items-center gap-2 px-8 py-3 bg-[#1A1A1A] text-white text-sm font-semibold rounded-lg hover:bg-[#333] transition-colors">
                    <span>Launch Ecosystem Workspace</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Reusable field component
function Field({ label, name, value, onChange, placeholder, required = false }) {
  return (
    <div>
      <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5 tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="os-input"
      />
    </div>
  );
}
