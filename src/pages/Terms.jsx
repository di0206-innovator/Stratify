import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-8 animate-fade-in text-[#111] select-text">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-1.5 font-outfit font-bold text-xs uppercase text-gray-400 hover:text-black mb-2 transition-colors select-none">
        <ArrowLeft size={14} /> Back to home
      </Link>

      <div className="flex items-center gap-3 pb-6 border-b border-gray-200/60 select-none">
        <div className="bg-[#1A1A1A] p-3 text-white rounded-lg">
          <FileText size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-outfit font-black tracking-tight uppercase">Terms of Service</h1>
          <p className="font-inter text-gray-500 mt-1 text-sm">
            Last Updated: July 9, 2026
          </p>
        </div>
      </div>

      <div className="font-inter text-sm text-gray-600 space-y-6 leading-relaxed">
        <p>
          Welcome to Stratify. By accessing or using our platform, ecosystem directory, and strategic analysis services, you agree to comply with and be bound by the following Terms of Service.
        </p>

        <section className="space-y-3">
          <h2 className="font-outfit font-bold text-black text-lg uppercase select-none">1. Account Registry and Authenticity</h2>
          <p>
            Users must register with verifiable emails. Founders registering startups must declare accurate metadata (stage, geography, stack, and burn metrics). Admin privileges are restricted to whitelisted accounts to maintain overall network integrity.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-outfit font-bold text-black text-lg uppercase select-none">2. Platform Usage and AI Agents</h2>
          <p>
            Our validation reports, opportunity matrices, and strategic briefs are generated through advanced autonomous multi-agent critic frameworks. These reports represent strategic suggestions and mathematical estimations, not legal or financial advice.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-outfit font-bold text-black text-lg uppercase select-none">3. Intellectual Property Moat</h2>
          <p>
            You retain absolute ownership of all content, pitch materials, and custom data logged into your Stratify OS workspace. Stratify Labs retains ownership of the underlying AI generation systems, graphic visualization nodes, and proprietary analysis frameworks.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-outfit font-bold text-black text-lg uppercase select-none">4. Prohibited Behaviors</h2>
          <p>
            You agree not to utilize Stratify for reporting fraudulent funding rounds, seeding mock profiles with malicious intents, launching denial of service attacks, or trying to bypass our secure whitelisting protocols.
          </p>
        </section>

        <p className="pt-6 text-xs text-gray-400 select-none">
          If you have questions regarding these terms, contact us at legal@stratify.co.
        </p>
      </div>
    </div>
  );
}
