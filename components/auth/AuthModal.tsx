'use client';

import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, Shield, AlertTriangle, CheckCircle, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'signin' | 'signup' | 'reset';
  onSuccess?: () => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialTab = 'signin',
  onSuccess,
}: AuthModalProps) {
  const { signIn, signUp, resetPassword, isConfigured } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'reset'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [initialTab, isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (activeTab === 'signin') {
        if (!email.trim() || !password) {
          setErrorMsg('Please enter both email and password.');
          setIsSubmitting(false);
          return;
        }
        const { error } = await signIn(email.trim(), password);
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('Authenticated successfully. Establishing telemetry session...');
          setTimeout(() => {
            onSuccess?.();
            onClose();
          }, 800);
        }
      } else if (activeTab === 'signup') {
        if (!email.trim() || !password) {
          setErrorMsg('Please fill out all required fields.');
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters long.');
          setIsSubmitting(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMsg('Passwords do not match.');
          setIsSubmitting(false);
          return;
        }
        const { error, needsEmailVerification } = await signUp(email.trim(), password, displayName.trim());
        if (error) {
          setErrorMsg(error.message);
        } else {
          if (needsEmailVerification) {
            setSuccessMsg('Registration submitted. A confirmation link has been sent to your email.');
          } else {
            setSuccessMsg('Account provisioned successfully! Initializing workspace...');
            setTimeout(() => {
              onSuccess?.();
              onClose();
            }, 1000);
          }
        }
      } else if (activeTab === 'reset') {
        if (!email.trim()) {
          setErrorMsg('Please enter your account email.');
          setIsSubmitting(false);
          return;
        }
        const { error } = await resetPassword(email.trim());
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('Password reset instructions dispatched to your email address.');
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected authentication error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-[#080d1a]/95 border border-[#1f293d] p-6 shadow-2xl backdrop-blur-xl font-mono text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#1f293d] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-sm font-bold tracking-wider text-white">
                {activeTab === 'signin' && 'OPERATOR AUTHENTICATION'}
                {activeTab === 'signup' && 'PROVISION OPERATOR ACCOUNT'}
                {activeTab === 'reset' && 'ACCOUNT ACCESS RECOVERY'}
              </h2>
              <p className="text-[10px] text-slate-400">
                Atmospheric Observatory Telemetry & Cloud Synchronization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close authentication modal"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Unconfigured Notice if Supabase keys missing */}
        {!isConfigured && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-200">Device-Local Offline Mode</span>
                <p className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed">
                  Supabase credentials are not configured in your local environment. Aeroloom continues to store your saved flights and watchlists locally on this device.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-[#0f172a] p-1 border border-[#1f293d] mb-4">
          <button
            type="button"
            onClick={() => { setActiveTab('signin'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'signin'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('signup'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'signup'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            REGISTER
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('reset'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'reset'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            RECOVERY
          </button>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {activeTab === 'signup' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                OPERATOR CALLSIGN / DISPLAY NAME
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. SKYWATCHER-9"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0f172a] border border-[#1f293d] focus:border-sky-500 focus:outline-none text-xs text-white placeholder-slate-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@aeroloom.internal"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0f172a] border border-[#1f293d] focus:border-sky-500 focus:outline-none text-xs text-white placeholder-slate-500"
              />
            </div>
          </div>

          {activeTab !== 'reset' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                PASSWORD
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0f172a] border border-[#1f293d] focus:border-sky-500 focus:outline-none text-xs text-white placeholder-slate-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'signup' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                CONFIRM PASSWORD
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0f172a] border border-[#1f293d] focus:border-sky-500 focus:outline-none text-xs text-white placeholder-slate-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 mt-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>PROCESSING...</span>
              </>
            ) : (
              <>
                <span>
                  {activeTab === 'signin' && 'ESTABLISH SESSION'}
                  {activeTab === 'signup' && 'INITIALIZE OPERATOR'}
                  {activeTab === 'reset' && 'SEND RECOVERY EMAIL'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-[#1f293d] text-[10px] text-slate-500 flex items-center justify-between">
          <span>Row Level Security Enforced</span>
          <span>Zero Fabricated Telemetry</span>
        </div>
      </div>
    </div>
  );
}
