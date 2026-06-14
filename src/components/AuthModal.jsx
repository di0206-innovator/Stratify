import React, { useState } from 'react';
import { X, Lock, LogIn, UserPlus, AlertCircle, Sparkles, KeyRound, Mail, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  updateProfile,
  sendPasswordResetEmail
} from '../firebase';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  if (!isOpen) return null;

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        try {
          await updateProfile(user, { displayName: username });
        } catch (profileErr) {
          console.warn('Failed to update displayName on registration:', profileErr);
        }

        try {
          await sendEmailVerification(user);
        } catch (verificationErr) {
          console.warn('Failed to send email verification:', verificationErr);
        }
        
        confetti({
          particleCount: 100,
          spread: 60,
          colors: ['#A3E635', '#C084FC', '#000000']
        });
        setMessage('Account created! A verification link has been sent to your email.');
        // Reset form fields
        setEmail('');
        setPassword('');
        setUsername('');
      } else if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        confetti({
          particleCount: 80,
          spread: 60,
          colors: ['#A3E635', '#C084FC']
        });
        if (onAuthSuccess) onAuthSuccess();
        onClose();
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setMessage('A password reset link has been sent to your email address.');
        setEmail('');
      }
    } catch (err) {
      console.error('AuthModal error:', err);
      let msg = err.message || 'Authentication error occurred.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email address is already in use by another account.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'The password must be at least 6 characters long.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = 'Incorrect email or password.';
      } else if (err.code === 'auth/user-disabled') {
        msg = 'This account has been disabled.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await signInWithPopup(auth, googleProvider);
      confetti({
        particleCount: 100,
        spread: 60,
        colors: ['#A3E635', '#C084FC', '#FB923C']
      });
      if (onAuthSuccess) onAuthSuccess();
      onClose();
    } catch (err) {
      console.error('Google sign in error:', err);
      setError(err.message || 'Failed to authenticate via Google.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError(null);
    setMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm select-none">
      <div 
        className="w-full max-w-md bg-white border-[3px] border-black shadow-neo-hard relative p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 bg-white hover:bg-neo-pink border-[3px] border-black hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer rounded-none text-black shrink-0"
        >
          <X size={16} strokeWidth={3} />
        </button>

        {/* Modal Header */}
        <div className="text-center pt-2">
          <div className="inline-flex items-center gap-1.5 bg-neo-lavender border-2 border-black px-3 py-1 font-outfit font-black text-xs uppercase tracking-wider mb-2">
            <Lock size={12} strokeWidth={3} /> SECURE GATEWAY
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
            {mode === 'login' && 'STRATEGIST LOGIN'}
            {mode === 'register' && 'CREATE NETWORK ACCOUNT'}
            {mode === 'forgot' && 'RESET SECURITY CREDENTIALS'}
          </h2>
          <p className="text-xs font-semibold text-gray-600 mt-1.5 max-w-xs mx-auto">
            {mode === 'login' && 'Authenticate to run strategy simulations and access your reports library.'}
            {mode === 'register' && 'Join the agent network to persist startup intelligence profiles.'}
            {mode === 'forgot' && 'Enter your email to receive a secure password recovery token.'}
          </p>
        </div>

        {/* Auth Forms */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-black uppercase mb-1">Username / Name</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Founder Jane"
                required
                className="neo-input text-xs py-2"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. founder@neuralbi.io"
              required
              className="neo-input text-xs py-2"
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <label className="block text-xs font-black uppercase mb-1">Security Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="neo-input text-xs py-2"
              />
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="bg-neo-pink border-2 border-black p-3 text-xs font-bold text-black flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="bg-neo-lime border-2 border-black p-3 text-xs font-bold text-black flex items-start gap-2">
              <CheckCircle size={16} className="shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neo-lime border-[3px] border-black text-black font-black py-2.5 shadow-neo-button hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-neo-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer uppercase text-xs tracking-wider"
          >
            {mode === 'login' && <LogIn size={14} />}
            {mode === 'register' && <UserPlus size={14} />}
            {mode === 'forgot' && <KeyRound size={14} />}
            <span>
              {loading 
                ? 'PROCESSING REQUEST...' 
                : mode === 'login' ? 'SIGN IN' : mode === 'register' ? 'REGISTER' : 'SEND RESET LINK'
              }
            </span>
          </button>

          {/* Divider & Google Sign-In */}
          {mode !== 'forgot' && (
            <>
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t-2 border-black border-dashed"></div>
                <span className="flex-shrink mx-4 font-outfit font-black text-[10px] uppercase text-gray-500">OR</span>
                <div className="flex-grow border-t-2 border-black border-dashed"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-[#FB923C] border-[3px] border-black text-black font-black py-2.5 shadow-neo-button hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-neo-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer uppercase text-xs tracking-wider"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.25.61 4.47 1.625l2.437-2.437C17.312 1.696 14.933 1 12.24 1c-5.523 0-10 4.477-10 10s4.477 10 10 10c5.782 0 9.61-4.062 9.61-9.78 0-.66-.06-1.294-.173-1.935H12.24z" />
                </svg>
                <span>{loading ? 'PROCESSING...' : 'SIGN IN WITH GOOGLE'}</span>
              </button>
            </>
          )}
        </form>

        {/* Footer Nav Links */}
        <div className="border-t-2 border-black pt-3 flex items-center justify-between font-outfit font-black text-[10px] uppercase">
          {mode === 'login' ? (
            <>
              <button 
                onClick={() => switchMode('register')} 
                className="text-[#C084FC] hover:text-black transition-colors cursor-pointer border-b border-[#C084FC] hover:border-black"
              >
                CREATE ACCOUNT
              </button>
              <button 
                onClick={() => switchMode('forgot')} 
                className="text-gray-500 hover:text-black transition-colors cursor-pointer border-b border-gray-500 hover:border-black"
              >
                FORGOT PASSWORD?
              </button>
            </>
          ) : (
            <button 
              onClick={() => switchMode('login')} 
              className="text-[#C084FC] hover:text-black transition-colors cursor-pointer border-b border-[#C084FC] hover:border-black mx-auto"
            >
              ALREADY REGISTERED? SIGN IN
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
