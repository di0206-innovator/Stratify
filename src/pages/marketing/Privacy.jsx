import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-8 animate-fade-in text-text-primary select-text">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-1.5 font-outfit font-bold text-xs uppercase text-text-muted hover:text-text-primary mb-2 transition-colors select-none">
        <ArrowLeft size={14} /> Back to home
      </Link>

      <div className="flex items-center gap-3 pb-6 border-b border-light select-none">
        <div className="bg-[#1A1A1A] p-3 text-white rounded-lg">
          <Shield size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-outfit font-black tracking-tight uppercase">Privacy Policy</h1>
          <p className="font-inter text-text-secondary mt-1 text-sm">
            Last Updated: July 9, 2026
          </p>
        </div>
      </div>

      <div className="font-inter text-sm text-text-secondary space-y-6 leading-relaxed">
        <p>
          At Stratify, we are committed to protecting the integrity of your startup data, strategic assumptions, and proprietary intelligence. This Privacy Policy describes how Stratify Labs collects, uses, and safeguards information when you interact with the Stratify Ecosystem Operating System.
        </p>

        <section className="space-y-3">
          <h2 className="font-outfit font-bold text-text-primary text-lg uppercase select-none">1. Information We Collect</h2>
          <p>
            We collect information that you explicitly provide when registering an account, onboarding a startup, logging decisions in the Founder Memory strategically, or generating business intelligence reports. This includes founder profiles, target customer definitions, financial projections, team constraints, and PR links.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-outfit font-bold text-text-primary text-lg uppercase select-none">2. How We Use Data</h2>
          <p>
            Your startup intelligence data is used to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Generate customized, context-aware strategic validation reports.</li>
            <li>Coordinate opportunities matching within regional ecosystems.</li>
            <li>Train context-anchored AI subagents specifically for your organization's tasks.</li>
            <li>Deliver real-time telemetry analytics to workspace administrators.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-outfit font-bold text-text-primary text-lg uppercase select-none">3. Security and Grounding Moat</h2>
          <p>
            Security is built into our core graph architecture. We leverage Postgres parameterized transactions, encrypted session controls, and role-based permissions (Admins, Founders, Investors) to guarantee zero leakage. Whitelisted data rooms ensure your runway and burn estimates are only shared with authorized entities you approve.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-outfit font-bold text-text-primary text-lg uppercase select-none">4. Data Subject Rights</h2>
          <p>
            You retain absolute ownership of all logged data rooms, milestones, and strategic briefs. You may delete, edit, or clear your startup profile registry at any time directly through your OS settings dashboard.
          </p>
        </section>

        <p className="pt-6 text-xs text-text-muted select-none">
          If you have questions regarding this policy, contact us at security@stratify.co.
        </p>
      </div>
    </div>
  );
}
