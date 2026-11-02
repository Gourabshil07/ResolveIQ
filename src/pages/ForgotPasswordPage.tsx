import React, { useState } from 'react';
import { Mail, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { supabase } from '../lib/supabase';

interface ForgotPasswordPageProps {
  onBackToLogin: () => void;
  onGoToLanding: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onBackToLogin,
  onGoToLanding,
}) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);

    try {
      // Dynamic password recovery redirect URL
      const redirectUrl = `${window.location.origin}/?page=reset-password`;

      // Send password reset email using native Supabase Auth
      const { error: supabaseErr } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: redirectUrl,
      });

      if (supabaseErr) {
        if (supabaseErr.status === 429 || supabaseErr.message?.toLowerCase().includes('rate limit')) {
          setError('Email rate limit reached. Supabase default email service limits requests to ~3-4 per hour per project. Please wait a few minutes before trying again.');
          return;
        }
        setError(supabaseErr.message || 'Failed to request password reset. Please verify your email address and try again.');
        return;
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your registered email to receive secure recovery instructions."
      onGoToLanding={onGoToLanding}
      maxWidth="max-w-[380px]"
    >
      {submitted ? (
        <div className="text-center py-1 space-y-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-[#101A35]">Instructions Dispatched</h3>
            <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
              If an account exists for <span className="text-[#2463FF] font-mono text-[11px] font-semibold">{email.trim()}</span>, you will receive a secure password reset link shortly.
            </p>
          </div>

          <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200 text-[11px] text-[#64748B] text-left space-y-1">
            <p className="font-semibold text-[#101A35]">Security Notice:</p>
            <p>• The reset link remains active for <strong>20 minutes</strong>.</p>
            <p>• Check your spam or junk folder if you don't see the message.</p>
          </div>

          <div className="pt-1 flex flex-col gap-2">
            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full h-[46px] flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#2463FF] to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <span>Return to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setEmail('');
              }}
              className="w-full py-1.5 text-xs font-medium text-[#64748B] hover:text-[#101A35] transition-colors cursor-pointer"
            >
              Send to a different email address
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="flex items-start gap-2.5 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1 font-medium leading-tight">{error}</div>
            </div>
          )}

          <div>
            <label htmlFor="reset-email" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Account Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="reset-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full h-[46px] pl-9 pr-3 text-sm bg-slate-50/80 border border-slate-200/90 rounded-xl text-[#101A35] placeholder-slate-400 focus:outline-hidden focus:border-[#2463FF] focus:ring-1 focus:ring-[#2463FF] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[46px] flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#2463FF] to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer mt-1"
          >
            {loading ? 'Dispatching Instructions...' : 'Send Reset Instructions'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onBackToLogin}
              className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#101A35] font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
