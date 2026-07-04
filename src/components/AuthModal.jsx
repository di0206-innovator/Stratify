import React, { useState, useEffect } from 'react';
import { X, Lock, LogIn, UserPlus, AlertCircle, KeyRound, CheckCircle, Eye, EyeOff } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
 const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [username, setUsername] = useState('');
 const [showPassword, setShowPassword] = useState(false);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState(null);
 const [message, setMessage] = useState(null);
 const [registeredEmail, setRegisteredEmail] = useState(null);

 // Close modal when Escape key is pressed (Keyboard Accessibility / a11y)
 useEffect(() => {
 const handleKeyDown = (e) => {
 if (e.key === 'Escape') {
 onClose();
 }
 };
 if (isOpen) {
 window.addEventListener('keydown', handleKeyDown);
 }
 return () => {
 window.removeEventListener('keydown', handleKeyDown);
 };
 }, [isOpen, onClose]);

 if (!isOpen) return null;

 // ─── Helper: translate error codes to human messages ───────────────
 function translateAuthError(err) {
 const msg = err?.message || '';
 if (msg.includes('Auth session missing') || msg.includes('AuthApiError') || msg.includes('bad_jwt'))
 return 'Supabase auth is not fully configured. Please verify the project URL, anon key, and OAuth/email settings in Supabase.';
 if (msg.includes('Email not confirmed') || msg.includes('email not confirmed'))
 return 'Please verify your email before signing in. Check your inbox for the confirmation link.';
 if (msg.includes('Invalid login credentials'))
 return 'Incorrect email or password. Please try again.';
 if (msg.includes('EMAIL_ALREADY_REGISTERED') || msg.includes('already registered'))
 return 'This email address is already registered.';
 if (msg.includes('weak-password') || msg.includes('WEAK_PASSWORD'))
 return 'Password must be at least 8 characters.';
 if (msg.includes('invalid-email'))
 return 'Please enter a valid email address.';
 if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found') || msg.includes('Invalid credentials'))
 return 'Incorrect email or password. Please try again.';
 return msg || 'An unexpected error occurred. Please try again.';
 }

 // ─── Post-auth: sync with backend and close modal ───────────────────────────
 async function finishAuth() {
 try {
 confetti({ particleCount: 100, spread: 60, colors: ['#A3E635', '#C084FC', '#FB923C'] });
 if (onAuthSuccess) await onAuthSuccess();
 onClose();
 } catch {
 if (onAuthSuccess) onAuthSuccess();
 onClose();
 }
 }

 // ─── Email / Password handler ────────────────────────────────────────────────
 const handleAuthSubmit = async (e) => {
 e.preventDefault();
 setLoading(true);
 setError(null);
 setMessage(null);

 try {
 if (mode === 'register') {
 if (password.length < 8) {
 throw new Error('Password must be at least 8 characters with uppercase, lowercase, number, and symbol.');
 }

 if (!supabase) {
 throw new Error('Supabase auth is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
 }

 const { error } = await supabase.auth.signUp({
 email,
 password,
 options: {
 data: {
 username: username.trim(),
 full_name: username.trim()
 }
 }
 });
 if (error) throw error;
 setMessage(`Account created with Supabase! A verification link was sent to ${email}.`);

 setRegisteredEmail(email);
 setEmail('');
 setPassword('');
 setUsername('');

 } else if (mode === 'login') {
 if (!supabase) {
 throw new Error('Supabase auth is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
 }

 const { error } = await supabase.auth.signInWithPassword({
 email,
 password
 });
 if (error) throw error;
 await finishAuth();

 } else if (mode === 'forgot') {
 if (!supabase) {
 throw new Error('Supabase auth is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
 }

 const { error } = await supabase.auth.resetPasswordForEmail(email);
 if (error) throw error;
 setMessage(`A password reset link has been sent to ${email}.`);
 setEmail('');
 }
 } catch (err) {
 const msg = translateAuthError(err);
 if (msg) setError(msg);
 } finally {
 setLoading(false);
 }
 };

 // ─── Google Sign-In handler ──────────────────────────────────────────────────
 const handleGoogleSignIn = async () => {
 setLoading(true);
 setError(null);
 setMessage(null);

 try {
 if (!supabase) {
 throw new Error('Supabase auth is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
 }

 const { error } = await supabase.auth.signInWithOAuth({
 provider: 'google',
 options: {
 redirectTo: window.location.origin
 }
 });
 if (error) throw error;
 } catch (err) {
 const msg = translateAuthError(err);
 if (msg) setError(msg);
 } finally {
 setLoading(false);
 }
 };

 const switchMode = (newMode) => {
 setMode(newMode);
 setError(null);
 setMessage(null);
 setRegisteredEmail(null);
 };

 // ─── Password strength indicator ─────────────────────────────────────────────
 function getPasswordStrength(pw) {
 if (!pw) return null;
 let score = 0;
 if (pw.length >= 8) score++;
 if (pw.length >= 12) score++;
 if (/[A-Z]/.test(pw)) score++;
 if (/[0-9]/.test(pw)) score++;
 if (/[^a-zA-Z0-9]/.test(pw)) score++;
 if (score <= 1) return { label: 'Weak', color: '#ef4444', width: '20%' };
 if (score <= 2) return { label: 'Fair', color: '#f97316', width: '40%' };
 if (score <= 3) return { label: 'Good', color: '#eab308', width: '65%' };
 if (score <= 4) return { label: 'Strong', color: '#22c55e', width: '85%' };
 return { label: 'Very Strong', color: '#10b981', width: '100%' };
 }

 const strength = mode === 'register' ? getPasswordStrength(password) : null;

 return (
 <div
 className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
 onClick={onClose}
 >
 <div
 className="w-full max-w-md bg-white relative p-6 space-y-5"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Close Button */}
 <button
 onClick={onClose}
 className="absolute top-4 right-4 p-1 bg-white hover:bg-neo-pink transition-all cursor-pointer text-black"
 aria-label="Close"
 >
 <X size={16} strokeWidth={3} />
 </button>

 {/* Modal Header */}
 <div className="text-center pt-2">
 <div className="inline-flex items-center gap-1.5 bg-neo-lavender border-2 border-black px-3 py-1 font-outfit font-black text-xs uppercase tracking-wider mb-2">
 <Lock size={12} strokeWidth={3} />
 SECURE GATEWAY
 </div>
 <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
 {mode === 'login' && 'SIGN IN'}
 {mode === 'register' && 'CREATE ACCOUNT'}
 {mode === 'forgot' && 'RESET PASSWORD'}
 </h2>
 <p className="text-xs font-semibold text-gray-500 mt-1 max-w-xs mx-auto">
 {mode === 'login' && 'Sign in with your Google account or email and password.'}
 {mode === 'register' && 'Create your account to save reports and strategy profiles.'}
 {mode === 'forgot' && 'Enter your email to receive a password reset link.'}
 </p>
 </div>

 {/* Google Sign-In — prominent, at top */}
 {mode !== 'forgot' && (
 <button
 type="button"
 id="google-signin-btn"
 onClick={handleGoogleSignIn}
 disabled={loading}
 className="w-full bg-white text-black font-black py-2.5 hover:-translate-x-[2px] hover:-translate-y-[2px] hover: active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2.5 cursor-pointer uppercase text-xs tracking-wider"
 >
 <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
 <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
 <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
 <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
 <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
 </svg>
 <span>{loading ? 'PROCESSING…' : mode === 'login' ? 'SIGN IN WITH GOOGLE' : 'CONTINUE WITH GOOGLE'}</span>
 </button>
)}

 {/* Divider */}
 {mode !== 'forgot' && (
 <div className="relative flex items-center">
 <div className="flex-grow border-t-2 border-black border-dashed" />
 <span className="flex-shrink mx-4 font-outfit font-black text-[10px] uppercase text-gray-400">OR EMAIL</span>
 <div className="flex-grow border-t-2 border-black border-dashed" />
 </div>
)}

 {/* Email Form */}
 <form onSubmit={handleAuthSubmit} className="space-y-4">
 {mode === 'register' && (
 <div>
 <label htmlFor="auth-username" className="block text-xs font-black uppercase mb-1">
 Display Name
 </label>
 <input
 id="auth-username"
 type="text"
 value={username}
 onChange={(e) => setUsername(e.target.value)}
 placeholder="e.g. Jane Founder"
 required
 className="w-full border-[2px] border-black px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#C084FC] focus: transition-all"
 />
 </div>
)}

 <div>
 <label htmlFor="auth-email" className="block text-xs font-black uppercase mb-1">
 Email Address
 </label>
 <input
 id="auth-email"
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="founder@example.com"
 required
 autoComplete="email"
 className="w-full border-[2px] border-black px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#C084FC] focus: transition-all"
 />
 </div>

 {mode !== 'forgot' && (
 <div>
 <label htmlFor="auth-password" className="block text-xs font-black uppercase mb-1">
 Password {mode === 'register' && <span className="text-gray-400 font-normal normal-case">(min 8 chars)</span>}
 </label>
 <div className="relative">
 <input
 id="auth-password"
 type={showPassword ? 'text' : 'password'}
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="••••••••"
 required
 autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
 className="w-full border-[2px] border-black px-3 py-2 pr-10 text-xs font-semibold focus:outline-none focus:border-[#C084FC] focus: transition-all"
 />
 <button
 type="button"
 onClick={() => setShowPassword(v => !v)}
 className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors cursor-pointer"
 tabIndex={-1}
 >
 {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
 </button>
 </div>

 {/* Password strength bar */}
 {strength && (
 <div className="mt-1.5">
 <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
 <div
 className="h-full rounded-full transition-all duration-300"
 style={{ width: strength.width, backgroundColor: strength.color }}
 />
 </div>
 <p className="text-[10px] font-bold mt-0.5" style={{ color: strength.color }}>
 {strength.label}
 </p>
 </div>
)}
 </div>
)}

 {/* Status Messages */}
 {error && (
 <div className="bg-red-50 border-2 border-red-500 p-3 text-xs font-semibold text-red-800 flex items-start gap-2">
 <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-500" />
 <span>{error}</span>
 </div>
)}
 {message && (
 <div className="bg-green-50 border-2 border-green-500 p-3 text-xs font-semibold text-green-800 flex items-start gap-2">
 <CheckCircle size={14} className="shrink-0 mt-0.5 text-green-500" />
 <span>{message}</span>
 </div>
)}

 {/* Submit */}
 <button
 type="submit"
 id={`auth-submit-${mode}`}
 disabled={loading}
 className="w-full bg-emerald-500 text-black font-black py-2.5 hover:-translate-x-[1px] hover:-translate-y-[1px] hover: active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer uppercase text-xs tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
 >
 {mode === 'login' && <LogIn size={14} />}
 {mode === 'register' && <UserPlus size={14} />}
 {mode === 'forgot' && <KeyRound size={14} />}
 <span>
 {loading
 ? 'PROCESSING…'
 : mode === 'login' ? 'SIGN IN'
 : mode === 'register' ? 'CREATE ACCOUNT'
 : 'SEND RESET LINK'}
 </span>
 </button>
 </form>

 {/* Footer Nav */}
 <div className="border-t-2 border-black pt-3 flex items-center justify-between font-outfit font-black text-[10px] uppercase">
 {mode === 'login' ? (
 <>
 <button onClick={() => switchMode('register')} className="text-[#C084FC] hover:text-black border-b border-[#C084FC] hover:border-black transition-colors cursor-pointer">
 CREATE ACCOUNT
 </button>
 <button onClick={() => switchMode('forgot')} className="text-gray-400 hover:text-black border-b border-gray-400 hover:border-black transition-colors cursor-pointer">
 FORGOT PASSWORD?
 </button>
 </>
) : (
 <button onClick={() => switchMode('login')} className="text-[#C084FC] hover:text-black border-b border-[#C084FC] hover:border-black transition-colors cursor-pointer mx-auto">
 ALREADY HAVE AN ACCOUNT? SIGN IN
 </button>
)}
 </div>
 </div>
 </div>
);
}
