import React from 'react';
import { Lock, ArrowRight } from 'lucide-react';

/**
 * AuthGate - Wraps content that requires authentication.
 * Shows a styled sign-in prompt when user is null.
 * 
 * @param {object} props
 * @param {object} props.user - Current authenticated user (null if not logged in)
 * @param {function} props.openAuthModal - Opens the auth modal
 * @param {React.ReactNode} props.children - Protected content
 * @param {string} [props.message] - Custom message to display
 */
export default function AuthGate({ user, openAuthModal, children, message }) {
  if (user) return children;

  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="bg-white border-[4px] border-black p-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="bg-[#FCD34D] border-[3px] border-black p-4 inline-block mb-6">
          <Lock size={28} className="text-black" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight mb-3">Sign In Required</h2>
        <p className="font-bold text-gray-600 text-sm max-w-sm mx-auto mb-6">
          {message || 'This section is part of your private workspace. Sign in to access it.'}
        </p>
        <button
          onClick={openAuthModal}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#3B82F6] text-white border-[3px] border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all cursor-pointer"
        >
          Sign In to Continue <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
