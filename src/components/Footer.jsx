import React from 'react';
import { Link } from 'react-router-dom';

const footerLinks = {
  Product: [
    { label: 'Startup Graph', href: '/dashboard' },
    { label: 'Signals', href: '/signals' },
    { label: 'Runway', href: '/runway' },
    { label: 'Equity', href: '/equity' },
    { label: 'Briefs', href: '/intelligence' },
  ],
  Roles: [
    { label: 'Founders', href: '/onboarding' },
    { label: 'Investors', href: '/onboarding' },
    { label: 'Institutions', href: '/onboarding' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Contact', href: 'mailto:hello@stratify.co' },
  ],
};

export default function Footer() {
  return (
    <footer className="w-full bg-canvas border-t border-DEFAULT select-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        {/* Top: Brand + Columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-8">
          {/* Brand column */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-surface-dark flex items-center justify-center text-white font-outfit font-black text-sm">
                S
              </div>
              <span className="font-outfit font-black text-lg tracking-tight">Stratify</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
              The operating system for startup ecosystems.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <nav key={section} aria-label={section}>
              <h4 className="font-inter text-sm font-semibold text-text-primary mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('mailto:') ? (
                      <a href={link.href} className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.href} className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-6 border-t border-DEFAULT flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-text-muted">
            © {new Date().getFullYear()} Stratify Labs. All rights reserved.
          </span>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-xs text-text-muted hover:text-text-primary transition-colors">Privacy</Link>
            <Link to="/terms" className="text-xs text-text-muted hover:text-text-primary transition-colors">Terms</Link>
            <a href="mailto:hello@stratify.co" className="text-xs text-text-muted hover:text-text-primary transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
