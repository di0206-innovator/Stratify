import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Calendar, Mail, ArrowRight, Home, Compass, Radio, Building2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ThankYou() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'submission';

  useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#C8E64A', '#111111', '#FAF9F6']
    });
  }, []);

  const contentMap = {
    walkthrough: {
      badge: 'Live Walkthrough Confirmed',
      title: 'You Are Booked on the Executive Calendar',
      desc: 'A calendar invitation with your secure Google Meet link has been dispatched to your email. An executive partner will walk you through live startup graph navigation and thesis matching.',
      details: [
        'Google Meet invite with screen-sharing room link',
        'Tailored preview for your role and vertical',
        'Q&A on custom graph ingestion & API access'
      ]
    },
    waitlist: {
      badge: 'Priority Waitlist Confirmed',
      title: 'Welcome to the Stratify Early Cohort',
      desc: 'Your application has been received and queued with priority status. We are rolling out access in weekly batches to founders and investors.',
      details: [
        'Weekly early release updates and intelligence previews',
        'Direct onboarding support from our founding team',
        'Founder memory beta allocation included'
      ]
    },
    submission: {
      badge: 'Submission Confirmed',
      title: 'Your Transmission Has Been Received',
      desc: 'Thank you for reaching out to Stratify Labs. Our operating team has logged your request and will get back to you promptly.',
      details: [
        'Confirmed receipt by Stratify core team',
        'Average response time under 12 business hours',
        'Encrypted communications & NDA compliant'
      ]
    }
  };

  const current = contentMap[type] || contentMap.submission;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16 text-text-primary">
      <div className="max-w-xl w-full text-center animate-fade-in">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-2xl bg-accent/20 border border-accent/40 text-text-primary mx-auto flex items-center justify-center mb-6 shadow-sm">
          <CheckCircle2 size={36} className="text-text-primary" aria-hidden="true" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-text-primary mb-4 font-outfit text-xs font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" aria-hidden="true" />
          <span>{current.badge}</span>
        </div>

        {/* Title */}
        <h1 className="font-outfit font-black text-3xl sm:text-4xl tracking-tight uppercase mb-4">
          {current.title}
        </h1>

        {/* Subtitle */}
        <p className="text-text-secondary text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto font-inter">
          {current.desc}
        </p>

        {/* Expectation Card */}
        <div className="bg-card border border-DEFAULT rounded-xl p-6 text-left mb-8 shadow-sm">
          <h2 className="font-outfit font-bold text-xs uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
            <Mail size={14} className="text-accent" aria-hidden="true" />
            <span>What happens next</span>
          </h2>
          <ul className="space-y-2 text-xs sm:text-sm text-text-secondary">
            {current.details.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-accent font-bold">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface-dark text-white font-semibold text-xs uppercase tracking-wider font-outfit hover:opacity-90 transition-opacity"
          >
            <Home size={14} aria-hidden="true" />
            Return Home
          </Link>

          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-[#111] font-bold text-xs uppercase tracking-wider font-outfit hover:opacity-90 transition-opacity shadow-sm"
          >
            <Compass size={14} aria-hidden="true" />
            Explore Startup Graph
          </Link>
        </div>

        {/* Official Contact Notice */}
        <div className="text-[11px] text-text-muted border-t border-DEFAULT pt-6">
          <p className="font-medium">
            Stratify Labs • Operating Globally Remote & Distributed • support@stratify.co
          </p>
        </div>
      </div>
    </div>
  );
}
