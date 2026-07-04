import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Coffee, Landmark, Building, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Onboarding({ founderProfile, setFounderProfile }) {
  const navigate = useNavigate();
  const [role, setRole] = useState('founder'); // 'founder', 'vc', 'government'
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    // Founder specific fields
    name: '',
    industry: '',
    geography: '',
    product: '',
    targetCustomer: '',
    startupStage: 'idea',
    teamSize: '',
    budget: '',
    timeline: '',
    currentGoal: 'validate idea',
    
    // VC specific fields
    firmName: '',
    sectors: '',
    ticketSize: '',
    investmentStage: 'pre_seed',
    thesis: '',
    investmentIntent: 'Growth equity partnerships',

    // Gov specific fields
    orgName: '',
    region: '',
    mandate: '',
    programType: 'Grants & Subsidies',
    sectorPriorities: '',
    supportFocus: 'R&D Commercialization',
    ecosystemGoals: 'Job creation and regional technology growth'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const selectRole = (selectedRole) => {
    setRole(selectedRole);
    confetti({
      particleCount: 50,
      spread: 40,
      origin: { y: 0.8 },
      colors: selectedRole === 'founder' ? ['#A3E635', '#000000'] : selectedRole === 'vc' ? ['#C084FC', '#000000'] : ['#3B82F6', '#000000']
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Map role and relevant fields to the profile
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

    // Save profile locally (for backwards compatibility)
    setFounderProfile(profile);
    localStorage.setItem('stratify_founder_profile', JSON.stringify(profile));

    // Save to the database / backend
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
            name: profile.name,
            pitch: profile.product,
            problem: profile.targetCustomer,
            solution: profile.product,
            stage: profile.startupStage,
            industry: profile.industry,
            geography: profile.geography,
            teamStatus: profile.teamSize,
            traction: 'Ideation',
            needs: profile.currentGoal,
            techStack: 'Not specified'
          })
        });
      }
    } catch (err) {
      console.warn('Backend profile/startup save failed:', err);
    }

    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#A3E635', '#C084FC', '#3B82F6', '#000000']
    });

    setTimeout(() => {
      navigate('/dashboard');
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-black">
      {/* Header */}
      <div className="text-center mb-10 select-none">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-1.5 font-bold text-xs uppercase tracking-wider mb-4 rounded-full">
          <Sparkles size={16} /> WELCOME TO STRATIFY
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-3">
          Initialize Your Workspace
        </h1>
        <p className="font-medium text-gray-600 max-w-xl mx-auto text-sm">
          Select your vertical and complete the workspace registry. Stratify structures its operation dashboard, memory loops, and discovery engines based on your role.
        </p>
      </div>

      {step === 1 ? (
        <div className="space-y-8">
          {/* Role Selection */}
          <div className="mb-10">
            <h3 className="text-center text-xs font-bold uppercase mb-4 text-gray-500 tracking-wider">Select your vertical</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Founder Role */}
              <button
                type="button"
                onClick={() => selectRole('founder')}
                className={`flex flex-col items-center p-6 border rounded-lg text-center cursor-pointer transition-all ${
                  role === 'founder'
                    ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-500'
                    : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className={`p-3 rounded-full mb-3 ${role === 'founder' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                  <Coffee size={24} />
                </div>
                <span className="font-bold text-sm text-gray-900">Startup Founder</span>
                <p className="text-xs font-medium text-gray-500 mt-2">
                  Build your startup, validate hypotheses, manage runway, and compile investor pitch briefs.
                </p>
              </button>

              {/* VC Role */}
              <button
                type="button"
                onClick={() => selectRole('vc')}
                className={`flex flex-col items-center p-6 border rounded-lg text-center cursor-pointer transition-all ${
                  role === 'vc'
                    ? 'border-purple-500 bg-purple-50 shadow-md ring-1 ring-purple-500'
                    : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className={`p-3 rounded-full mb-3 ${role === 'vc' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                  <Landmark size={24} />
                </div>
                <span className="font-bold text-sm text-gray-900">VC / Investor</span>
                <p className="text-xs font-medium text-gray-500 mt-2">
                  Source deal flow, track thesis alignment, analyze startup risks, and manage watchlists.
                </p>
              </button>

              {/* Gov / Institution Role */}
              <button
                type="button"
                onClick={() => selectRole('government')}
                className={`flex flex-col items-center p-6 border rounded-lg text-center cursor-pointer transition-all ${
                  role === 'government'
                    ? 'border-green-500 bg-green-50 shadow-md ring-1 ring-green-500'
                    : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className={`p-3 rounded-full mb-3 ${role === 'government' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                  <Building size={24} />
                </div>
                <span className="font-bold text-sm text-gray-900">Gov / Institution</span>
                <p className="text-xs font-medium text-gray-500 mt-2">
                  Promote grant schemes, assess regional ecosystem health, eligibility, and impact outreach.
                </p>
              </button>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="os-btn-primary px-8 py-2.5 flex items-center justify-center gap-2 rounded-md"
            >
              <span>CONTINUE TO WORKSPACE SETUP</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="os-card space-y-6 max-w-3xl mx-auto">
          <div className="border-b border-gray-200 pb-4 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">
              {role === 'founder' && 'Startup Context Registry'}
              {role === 'vc' && 'Investor Thesis Registry'}
              {role === 'government' && 'Institutional Mandate Registry'}
            </h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 font-bold uppercase rounded border border-gray-200">{role}</span>
          </div>

          {role === 'founder' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black uppercase mb-2">Startup Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Acme AI"
                  required
                  className="os-input"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-2">Target Industry / Sector</label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  placeholder="e.g. ClimateTech, B2B SaaS"
                  required
                  className="os-input"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-2">Focus Geography / City</label>
                <input
                  type="text"
                  name="geography"
                  value={formData.geography}
                  onChange={handleChange}
                  placeholder="e.g. Bengaluru, Munich, Global"
                  required
                  className="os-input"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-2">Startup Stage</label>
                <select
                  name="startupStage"
                  value={formData.startupStage}
                  onChange={handleChange}
                  className="os-input"
                >
                  <option value="idea">Idea Stage (Pre-product)</option>
                  <option value="pre_seed">Pre-seed (MVP validation)</option>
                  <option value="seed">Seed Stage (Early traction/revenue)</option>
                  <option value="series_a">Series A+ (Scaling distribution)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-black uppercase mb-2">Product wedge & Core Innovation</label>
                <input
                  type="text"
                  name="product"
                  value={formData.product}
                  onChange={handleChange}
                  placeholder="e.g. subscription-based premium organic cold brew concentrates in bags"
                  required
                  className="os-input"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-2">Target Customer Persona</label>
                <input
                  type="text"
                  name="targetCustomer"
                  value={formData.targetCustomer}
                  onChange={handleChange}
                  placeholder="e.g. urban professionals, developers"
                  required
                  className="os-input"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-2">Team Size</label>
                <input
                  type="text"
                  name="teamSize"
                  value={formData.teamSize}
                  onChange={handleChange}
                  placeholder="e.g. Solo founder, 3 engineers"
                  className="os-input"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-2">Available Budget / Runway</label>
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="e.g. Bootstrapped, $100k seed runway"
                  className="os-input"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-2">Strategic Time Window</label>
                <input
                  type="text"
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleChange}
                  placeholder="e.g. 30 days, 6 months"
                  className="os-input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-black uppercase mb-2">Current Strategic Goal</label>
                <select
                  name="currentGoal"
                  value={formData.currentGoal}
                  onChange={handleChange}
                  className="os-input"
                >
                  <option value="validate idea">Validate Value Proposition & Demand</option>
                  <option value="gtm strategy">Define First Channel & GTM Strategy</option>
                  <option value="prepare investor memo">Compile Investor Strategy Memo</option>
                  <option value="competitor analysis">Extract Defensible Competitor Wedge</option>
                </select>
              </div>
            </div>
          )}

          {role === 'vc' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black uppercase mb-2">VC Firm / Fund Name</label>
                <input
                  type="text"
                  name="firmName"
                  value={formData.firmName}
                  onChange={handleChange}
                  placeholder="e.g. Sequoia India, Accel"
                  required
                  className="os-input"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-2">Geography Focus</label>
                <input
                  type="text"
                  name="geography"
                  value={formData.geography}
                  onChange={handleChange}
                  placeholder="e.g. India, South-East Asia, US"
                  required
                  className="os-input"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-2">Target Sectors / Industries</label>
                <input
                  type="text"
                  name="sectors"
                  value={formData.sectors}
                  onChange={handleChange}
                  placeholder="e.g. FinTech, AI Infrastructure, DeepTech"
                  required
                  className="os-input"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-2">Preferred Investment Stage</label>
                <select
                  name="investmentStage"
                  value={formData.investmentStage}
                  onChange={handleChange}
                  className="os-input"
                >
                  <option value="pre_seed">Pre-seed</option>
                  <option value="seed">Seed Stage</option>
                  <option value="series_a">Series A</option>
                  <option value="series_b">Series B & Beyond</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-2">Average Ticket Size</label>
                <input
                  type="text"
                  name="ticketSize"
                  value={formData.ticketSize}
                  onChange={handleChange}
                  placeholder="e.g. $500k - $2M"
                  className="os-input"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-2">Investment Intent</label>
                <input
                  type="text"
                  name="investmentIntent"
                  value={formData.investmentIntent}
                  onChange={handleChange}
                  placeholder="e.g. Lead investor, co-investor, syndicates"
                  className="os-input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-black uppercase mb-2">Investment Thesis</label>
                <textarea
                  name="thesis"
                  value={formData.thesis}
                  onChange={handleChange}
                  placeholder="Describe your core thesis or what qualities you look for in founders..."
                  rows={4}
                  className="os-input"
                />
              </div>
            </div>
          )}

          {role === 'government' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black uppercase mb-2">Organization Name</label>
                <input
                  type="text"
                  name="orgName"
                  value={formData.orgName}
                  onChange={handleChange}
                  placeholder="e.g. Innovation Karnataka, Tech Singapore"
                  required
                  className="os-input"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-2">Region / Mandate Geography</label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  placeholder="e.g. Karnataka, Singapore, EU"
                  required
                  className="os-input"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-2">Sector Priorities</label>
                <input
                  type="text"
                  name="sectorPriorities"
                  value={formData.sectorPriorities}
                  onChange={handleChange}
                  placeholder="e.g. DeepTech, BioTech, AgTech, Climate"
                  required
                  className="os-input"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-2">Program Types Available</label>
                <select
                  name="programType"
                  value={formData.programType}
                  onChange={handleChange}
                  className="os-input"
                >
                  <option value="Grants & Subsidies">Grants & Subsidies</option>
                  <option value="Tax Rebates">Tax Rebates & SR&ED Credits</option>
                  <option value="Co-working & Incubations">Co-working Space & Incubation</option>
                  <option value="Equity Co-investments">Equity Co-investments / Sovereign Fund</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-2">Institution Support Focus</label>
                <input
                  type="text"
                  name="supportFocus"
                  value={formData.supportFocus}
                  onChange={handleChange}
                  placeholder="e.g. R&D Commercialization, Startup Incubation"
                  className="os-input"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-2">Mandate Statement</label>
                <input
                  type="text"
                  name="mandate"
                  value={formData.mandate}
                  onChange={handleChange}
                  placeholder="e.g. Deploy INR 200 Cr to support 1000 technical founders"
                  required
                  className="os-input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-black uppercase mb-2">Ecosystem Goals</label>
                <textarea
                  name="ecosystemGoals"
                  value={formData.ecosystemGoals}
                  onChange={handleChange}
                  placeholder="What indicators determine regional ecosystem success for your agency..."
                  rows={3}
                  className="os-input"
                />
              </div>
            </div>
          )}

          {/* Submit & Back buttons */}
          <div className="pt-4 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="os-btn text-xs py-2"
            >
              Back
            </button>
            <button
              type="submit"
              className="os-btn-primary text-xs px-8 py-2.5 flex items-center justify-center gap-2"
            >
              <span>LAUNCH ECOSYSTEM WORKSPACE</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
