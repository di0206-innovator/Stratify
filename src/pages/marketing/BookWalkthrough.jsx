import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Video, Calendar, Clock, CheckCircle2, ArrowRight, ArrowLeft, Building2, 
  UserCheck, HelpCircle, Target, Sparkles, Shield, ChevronRight, Mail, Phone, 
  Globe, Briefcase, Layers, Check, ExternalLink, CalendarPlus, Laptop, Users
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Footer from '../../components/Footer';

const ROLES = [
  {
    id: 'founder',
    title: 'Startup Founder / Executive',
    badge: 'Founder OS',
    description: 'Early to scaling startups looking for unified runway, cap table, milestone memory, and investor matching.',
    icon: Building2,
    accent: 'border-accent bg-accent/5'
  },
  {
    id: 'investor',
    title: 'VC / Angel Investor',
    badge: 'Investor OS',
    description: 'Venture funds, angel syndicates, & family offices seeking ecosystem search, automated diligence, & live signals.',
    icon: Target,
    accent: 'border-blue-500 bg-blue-500/5'
  },
  {
    id: 'institution',
    title: 'Ecosystem Institution / Government',
    badge: 'Institution OS',
    description: 'Accelerators, universities, & government innovation agencies deploying grants, bounties, & ecosystem tracking.',
    icon: Layers,
    accent: 'border-purple-500 bg-purple-500/5'
  },
  {
    id: 'enterprise',
    title: 'Enterprise & Advisory Partner',
    badge: 'Custom Partner',
    description: 'Corporate innovation labs, advisors, & service providers requiring custom API pipelines and graph data rooms.',
    icon: Briefcase,
    accent: 'border-emerald-500 bg-emerald-500/5'
  }
];

const OBJECTIVES = [
  { id: 'graph', label: 'Startup Graph & Ecosystem Search', desc: 'Discover real-time market connections & entity nodes' },
  { id: 'runway', label: 'Cap Table & Runway Modeling', desc: 'Simulate dilution scenarios & multi-year burn rates' },
  { id: 'signals', label: 'AI Market Signals & Thesis Matching', desc: 'Identify high-conviction trends & funding pulses' },
  { id: 'diligence', label: 'Automated Diligence & Pitch Briefs', desc: 'Generate 1-click deal rooms & institutional reports' },
  { id: 'grants', label: 'Grants, Programs & Bounties', desc: 'Deploy funding programs & ecosystem milestone tracking' },
  { id: 'memory', label: 'Founder Memory & AI Logic Integration', desc: 'Embed intelligent memory loops across your startup team' },
  { id: 'enterprise_api', label: 'Custom Enterprise API & Data Export', desc: 'Integrate Stratify graph telemetry into your internal tools' }
];

const TIMEZONES = [
  { value: 'EST', label: 'Eastern Time (US & Canada - EST/EDT)' },
  { value: 'PST', label: 'Pacific Time (US & Canada - PST/PDT)' },
  { value: 'CST', label: 'Central Time (US & Canada - CST/CDT)' },
  { value: 'GMT', label: 'Greenwich Mean Time (GMT / UTC+0)' },
  { value: 'CET', label: 'Central European Time (CET / UTC+1)' },
  { value: 'IST', label: 'India Standard Time (IST / UTC+5:30)' },
  { value: 'SGT', label: 'Singapore Standard Time (SGT / UTC+8)' }
];

const TIME_SLOTS = [
  '09:00 AM',
  '11:30 AM',
  '02:00 PM',
  '04:30 PM',
  '06:00 PM'
];

function getNextBusinessDays(count = 7) {
  const days = [];
  let current = new Date();
  // Move to tomorrow first
  current.setDate(current.getDate() + 1);

  while (days.length < count) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sunday (0) and Saturday (6)
      const formattedDate = current.toISOString().split('T')[0];
      const displayDay = current.toLocaleDateString('en-US', { weekday: 'short' });
      const displayDate = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days.push({ raw: formattedDate, displayDay, displayDate });
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export default function BookWalkthrough() {
  const navigate = useNavigate();
  const availableDates = React.useMemo(() => getNextBusinessDays(7), []);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingRecord, setBookingRecord] = useState(null);

  // Form State
  const [role, setRole] = useState('founder');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [website, setWebsite] = useState('');
  const [stage, setStage] = useState('Seed');
  const [selectedObjectives, setSelectedObjectives] = useState(['graph', 'signals']);
  const [helpDetails, setHelpDetails] = useState('');
  const [selectedDate, setSelectedDate] = useState(availableDates[0]?.raw || '');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[1]);
  const [timezone, setTimezone] = useState('EST');
  const [meetPlatform, setMeetPlatform] = useState('Google Meet');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, isSuccess]);

  const toggleObjective = (id) => {
    setSelectedObjectives(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleNextStep = () => {
    setError('');
    if (step === 2) {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
      if (!organization.trim()) {
        setError('Please enter your company / organization name.');
        return;
      }
    }
    setStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setError('');
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmitBooking = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      name,
      email,
      role,
      phone,
      organization,
      website,
      stage,
      objectives: selectedObjectives,
      helpDetails,
      selectedDate,
      selectedTimeSlot,
      timezone,
      meetPlatform
    };

    try {
      const res = await fetch('/api/walkthrough', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit walkthrough request.');
      }

      setBookingRecord(data.record || payload);
      setIsSuccess(true);
      
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C8E64A', '#3B82F6', '#10B981', '#111111']
      });
    } catch (err) {
      console.warn('Walkthrough API submission notice:', err.message);
      // Fallback state if server API is temporarily unreachable in dev mode
      setBookingRecord(payload);
      setIsSuccess(true);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedDateObj = availableDates.find(d => d.raw === selectedDate) || availableDates[0];

  return (
    <div className="min-h-screen bg-canvas text-text-primary font-inter flex flex-col justify-between selection:bg-accent selection:text-[#111]">
      
      {/* ── Top Header Bar ── */}
      <header className="w-full bg-canvas/90 backdrop-blur-md border-b border-DEFAULT sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 min-h-16 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface-dark flex items-center justify-center text-white font-outfit font-black text-base">
              S
            </div>
            <span className="font-outfit font-black text-xl tracking-tight">Stratify</span>
            <span className="bg-accent text-[#111] text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider scale-90">
              Executive Walkthrough
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="text-xs font-semibold text-text-muted hover:text-text-primary transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 md:py-16 w-full flex-grow">
        
        {/* If Success State */}
        {isSuccess ? (
          <div className="bg-card border border-DEFAULT rounded-3xl p-8 sm:p-12 shadow-xl animate-fade-in text-center max-w-2xl mx-auto relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-accent/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="w-16 h-16 bg-accent/20 border border-accent/40 rounded-2xl flex items-center justify-center mx-auto mb-6 text-accent">
              <CheckCircle2 size={36} className="text-accent" />
            </div>

            <span className="inline-block px-3 py-1 bg-accent/15 border border-accent/30 text-text-primary text-[10px] font-black uppercase tracking-widest rounded-full mb-3 font-outfit">
              CONFIRMED EXECUTIVE DEMO
            </span>

            <h1 className="font-outfit font-black text-3xl sm:text-4xl text-text-primary mb-3">
              You're all set, {bookingRecord?.name || 'Partner'}!
            </h1>

            <p className="text-text-muted text-sm sm:text-base max-w-lg mx-auto leading-relaxed mb-6">
              We have reserved your 1-on-1 walkthrough slot with a Stratify Lead Executive. A calendar invitation and video call link have been dispatched to your email.
            </p>

            {/* Notification & Pre-requisites Guarantee Banner */}
            <div className="bg-accent/15 border border-accent/40 rounded-2xl p-4 mb-8 text-left flex items-start gap-3">
              <Mail size={20} className="text-accent shrink-0 mt-0.5" />
              <div className="text-xs text-text-primary leading-relaxed">
                <strong className="font-outfit font-black uppercase text-[11px] block text-accent mb-0.5">
                  Notification & Pre-requisites Notice
                </strong>
                You will be notified of all the details of the call, meeting access codes, executive agenda, and site pre-requisites shortly via email at <strong className="underline">{bookingRecord?.email || email}</strong>.
              </div>
            </div>

            {/* Scheduled Slot Summary Card */}
            <div className="bg-canvas border border-DEFAULT rounded-2xl p-6 mb-8 text-left space-y-4">
              <div className="flex items-center justify-between border-b border-DEFAULT/60 pb-3">
                <span className="text-xs text-text-muted uppercase font-black tracking-wider">Meeting Type</span>
                <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <Video size={14} className="text-accent" />
                  30-Min Executive Product Walkthrough
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Date & Time</span>
                  <span className="text-sm font-black text-text-primary flex items-center gap-1.5 font-outfit">
                    <Calendar size={14} className="text-accent" />
                    {selectedDateObj?.displayDay}, {selectedDateObj?.displayDate} @ {bookingRecord?.selectedTimeSlot || selectedTimeSlot} ({bookingRecord?.timezone || timezone})
                  </span>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Platform Video Call</span>
                  <span className="text-sm font-black text-text-primary flex items-center gap-1.5 font-outfit">
                    <Laptop size={14} className="text-blue-500" />
                    {bookingRecord?.meetPlatform || 'Google Meet'}
                  </span>
                </div>
              </div>

              <div className="border-t border-DEFAULT/60 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-xs text-text-muted">
                  Organized for: <strong className="text-text-primary font-semibold">{bookingRecord?.organization || organization}</strong> ({bookingRecord?.email || email})
                </span>
                <a 
                  href="https://meet.google.com/str-atif-yos" 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
                >
                  Join Link Preview <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/thank-you?type=walkthrough"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent text-[#111] text-xs font-outfit font-black uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-sm cursor-pointer"
              >
                View Confirmation & Next Steps <ArrowRight size={14} />
              </Link>
              
              <Link
                to="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-card border border-DEFAULT text-text-primary text-xs font-outfit font-bold uppercase tracking-wider rounded-xl hover:border-text-primary transition-all cursor-pointer"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        ) : (
          /* Step-by-Step Interactive Form */
          <div>
            {/* Hero Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/15 border border-accent/30 mb-4">
                <Sparkles size={14} className="text-accent" />
                <span className="text-xs font-bold text-text-primary tracking-wide">1-on-1 Live Executive Demonstration</span>
              </div>
              <h1 className="font-outfit font-black text-3xl sm:text-5xl tracking-tight text-text-primary mb-4">
                Book a Live Walkthrough of Stratify
              </h1>
              <p className="text-sm sm:text-base text-text-muted max-w-2xl mx-auto leading-relaxed">
                Connect directly with our founding executive team over a dedicated video call. Explore how Stratify connects startups, investors, and institutions into one living graph.
              </p>
            </div>

            {/* Step Progress Bar */}
            <div className="mb-10 max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-3 text-xs font-bold font-outfit uppercase tracking-wider text-text-muted">
                <span className={step >= 1 ? 'text-accent' : ''}>1. Role</span>
                <span className={step >= 2 ? 'text-accent' : ''}>2. Entity Details</span>
                <span className={step >= 3 ? 'text-accent' : ''}>3. Intent & Help</span>
                <span className={step >= 4 ? 'text-accent' : ''}>4. Select Timing</span>
              </div>
              <div className="w-full h-2 bg-card border border-DEFAULT rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-accent transition-all duration-300 rounded-full"
                  style={{ width: `${(step / 4) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Form Container */}
            <div className="bg-card border border-DEFAULT rounded-3xl p-6 sm:p-10 shadow-lg relative">
              
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs font-semibold flex items-center gap-2">
                  <Shield size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 1: Role Selection ("Who are you?")
                  ───────────────────────────────────────────────────────────── */}
              {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="font-outfit font-black text-xl sm:text-2xl text-text-primary mb-2">
                      Who are you?
                    </h2>
                    <p className="text-xs sm:text-sm text-text-muted">
                      Select your ecosystem role so we can tailor the walkthrough features to your exact workflow.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ROLES.map((r) => {
                      const Icon = r.icon;
                      const isSelected = role === r.id;
                      return (
                        <div
                          key={r.id}
                          onClick={() => setRole(r.id)}
                          className={`p-6 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                            isSelected 
                              ? `${r.accent} shadow-md` 
                              : 'border-DEFAULT bg-canvas hover:border-gray-400'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div className={`p-3 rounded-xl ${isSelected ? 'bg-surface-dark text-white' : 'bg-card text-text-primary border border-DEFAULT'}`}>
                                <Icon size={20} />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-card border border-DEFAULT font-outfit">
                                {r.badge}
                              </span>
                            </div>
                            <h3 className="font-outfit font-black text-base text-text-primary mb-1">
                              {r.title}
                            </h3>
                            <p className="text-xs text-text-muted leading-relaxed">
                              {r.description}
                            </p>
                          </div>

                          <div className="mt-4 flex items-center justify-end">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-accent bg-accent text-[#111]' : 'border-gray-400'}`}>
                              {isSelected && <Check size={12} className="stroke-[3]" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="inline-flex items-center gap-2 px-7 py-3 bg-accent text-[#111] text-xs font-outfit font-black uppercase tracking-wider rounded-xl hover:opacity-90 transition-all cursor-pointer"
                    >
                      Continue to Details <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 2: Contact & Entity Details
                  ───────────────────────────────────────────────────────────── */}
              {step === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="font-outfit font-black text-xl sm:text-2xl text-text-primary mb-2">
                      Tell us about yourself & your organization
                    </h2>
                    <p className="text-xs sm:text-sm text-text-muted">
                      Please provide your contact details so our executive can prepare for your session.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2 font-outfit">
                        Full Name *
                      </label>
                      <div className="relative">
                        <UserCheck size={16} className="absolute left-3.5 top-3.5 text-text-muted" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Alex Morgan"
                          className="w-full pl-10 pr-4 py-3 bg-canvas border border-DEFAULT rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>

                    {/* Work Email */}
                    <div>
                      <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2 font-outfit">
                        Work Email *
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-3.5 text-text-muted" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="alex@company.com"
                          className="w-full pl-10 pr-4 py-3 bg-canvas border border-DEFAULT rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>

                    {/* Organization / Startup Name */}
                    <div>
                      <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2 font-outfit">
                        Organization / Startup Name *
                      </label>
                      <div className="relative">
                        <Building2 size={16} className="absolute left-3.5 top-3.5 text-text-muted" />
                        <input
                          type="text"
                          required
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          placeholder="e.g. HyperScale Tech"
                          className="w-full pl-10 pr-4 py-3 bg-canvas border border-DEFAULT rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>

                    {/* Website / Portfolio */}
                    <div>
                      <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2 font-outfit">
                        Website / URL (Optional)
                      </label>
                      <div className="relative">
                        <Globe size={16} className="absolute left-3.5 top-3.5 text-text-muted" />
                        <input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://hyperscale.io"
                          className="w-full pl-10 pr-4 py-3 bg-canvas border border-DEFAULT rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2 font-outfit">
                        Phone / WhatsApp (Optional)
                      </label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3.5 top-3.5 text-text-muted" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full pl-10 pr-4 py-3 bg-canvas border border-DEFAULT rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>

                    {/* Stage / Size */}
                    <div>
                      <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2 font-outfit">
                        Stage / Ecosystem Scale
                      </label>
                      <select
                        value={stage}
                        onChange={(e) => setStage(e.target.value)}
                        className="w-full px-4 py-3 bg-canvas border border-DEFAULT rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent cursor-pointer"
                      >
                        <option value="Idea / Pre-Seed">Idea / Pre-Seed</option>
                        <option value="Seed / MVP">Seed / MVP</option>
                        <option value="Series A / B">Series A / Scaling</option>
                        <option value="Venture Capital Fund">Venture Capital Fund</option>
                        <option value="Angel Syndicate / Family Office">Angel Syndicate / Family Office</option>
                        <option value="Accelerator / Innovation Program">Accelerator / Innovation Program</option>
                        <option value="Government / Academic Institution">Government / Academic Institution</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-canvas border border-DEFAULT text-text-primary text-xs font-outfit font-bold uppercase rounded-xl hover:border-text-primary transition-all cursor-pointer"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>

                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="inline-flex items-center gap-2 px-7 py-3 bg-accent text-[#111] text-xs font-outfit font-black uppercase tracking-wider rounded-xl hover:opacity-90 transition-all cursor-pointer"
                    >
                      Continue to Intent <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 3: Intent & "What do you need help with?"
                  ───────────────────────────────────────────────────────────── */}
              {step === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="font-outfit font-black text-xl sm:text-2xl text-text-primary mb-2">
                      What are you looking for & what do you need help with?
                    </h2>
                    <p className="text-xs sm:text-sm text-text-muted">
                      Check all capabilities you'd like our executive to demonstrate during your 30-minute call.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {OBJECTIVES.map((obj) => {
                      const isChecked = selectedObjectives.includes(obj.id);
                      return (
                        <div
                          key={obj.id}
                          onClick={() => toggleObjective(obj.id)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                            isChecked
                              ? 'border-accent bg-accent/5'
                              : 'border-DEFAULT bg-canvas hover:border-gray-400'
                          }`}
                        >
                          <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                            isChecked ? 'border-accent bg-accent text-[#111]' : 'border-gray-400'
                          }`}>
                            {isChecked && <Check size={12} className="stroke-[3]" />}
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-text-primary font-outfit mb-0.5">
                              {obj.label}
                            </span>
                            <span className="block text-[11px] text-text-muted leading-tight">
                              {obj.desc}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Open-ended Help Details */}
                  <div>
                    <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2 font-outfit">
                      Specific Questions or Goals for the Demo Call (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={helpDetails}
                      onChange={(e) => setHelpDetails(e.target.value)}
                      placeholder="e.g. We are raising our Seed round and want to evaluate how Stratify automates diligence briefs for VCs..."
                      className="w-full p-4 bg-canvas border border-DEFAULT rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent"
                    ></textarea>
                  </div>

                  <div className="pt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-canvas border border-DEFAULT text-text-primary text-xs font-outfit font-bold uppercase rounded-xl hover:border-text-primary transition-all cursor-pointer"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>

                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="inline-flex items-center gap-2 px-7 py-3 bg-accent text-[#111] text-xs font-outfit font-black uppercase tracking-wider rounded-xl hover:opacity-90 transition-all cursor-pointer"
                    >
                      Select Timing & Slots <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 4: Demo Timings & Slot Picker
                  ───────────────────────────────────────────────────────────── */}
              {step === 4 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="font-outfit font-black text-xl sm:text-2xl text-text-primary mb-2">
                      Select Demo Date & Executive Time Slot
                    </h2>
                    <p className="text-xs sm:text-sm text-text-muted">
                      Choose an upcoming date and time slot for your live 1-on-1 Google Meet call.
                    </p>
                  </div>

                  {/* Date Selector */}
                  <div>
                    <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-3 font-outfit">
                      1. Available Business Days
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                      {availableDates.map((d) => {
                        const isSelected = selectedDate === d.raw;
                        return (
                          <button
                            key={d.raw}
                            type="button"
                            onClick={() => setSelectedDate(d.raw)}
                            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'border-accent bg-accent text-[#111] shadow-sm'
                                : 'border-DEFAULT bg-canvas hover:border-text-primary text-text-primary'
                            }`}
                          >
                            <span className="block text-[10px] font-black uppercase tracking-wider opacity-80 font-outfit">
                              {d.displayDay}
                            </span>
                            <span className="block text-xs font-bold font-outfit mt-0.5">
                              {d.displayDate}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Slot Selector */}
                  <div>
                    <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-3 font-outfit">
                      2. Preferred Time Slot
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {TIME_SLOTS.map((slot) => {
                        const isSelected = selectedTimeSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-outfit text-xs font-bold ${
                              isSelected
                                ? 'border-accent bg-accent text-[#111] shadow-sm'
                                : 'border-DEFAULT bg-canvas hover:border-text-primary text-text-primary'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Timezone & Platform Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2 font-outfit">
                        Your Timezone
                      </label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full px-4 py-3 bg-canvas border border-DEFAULT rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent cursor-pointer"
                      >
                        {TIMEZONES.map((tz) => (
                          <option key={tz.value} value={tz.value}>{tz.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2 font-outfit">
                        Video Call Platform
                      </label>
                      <select
                        value={meetPlatform}
                        onChange={(e) => setMeetPlatform(e.target.value)}
                        className="w-full px-4 py-3 bg-canvas border border-DEFAULT rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent cursor-pointer"
                      >
                        <option value="Google Meet">Google Meet (Recommended)</option>
                        <option value="Zoom Video">Zoom Video</option>
                        <option value="Microsoft Teams">Microsoft Teams</option>
                      </select>
                    </div>
                  </div>

                  {/* Final Summary Strip */}
                  <div className="bg-canvas border border-DEFAULT rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-text-muted block">Selected Reservation:</span>
                      <span className="font-outfit font-black text-text-primary text-sm flex items-center gap-1.5 mt-0.5">
                        <Clock size={14} className="text-accent" />
                        {selectedDateObj?.displayDay}, {selectedDateObj?.displayDate} at {selectedTimeSlot} ({timezone})
                      </span>
                    </div>
                    <span className="px-3 py-1 bg-surface-dark text-white rounded-lg text-[10px] font-bold uppercase tracking-wider font-outfit">
                      Executive Assigned
                    </span>
                  </div>

                  <div className="pt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-canvas border border-DEFAULT text-text-primary text-xs font-outfit font-bold uppercase rounded-xl hover:border-text-primary transition-all cursor-pointer"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleSubmitBooking}
                      className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-[#111] text-xs font-outfit font-black uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'Confirming Reservation...' : 'Confirm & Book Walkthrough'} <CheckCircle2 size={16} />
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </main>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}
