import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { supabase } from '../lib/supabase';

interface ResetPasswordPageProps {
  token?: string;
  onSuccessGoToLogin: () => void;
  onGoToForgotPassword: () => void;
  onGoToLanding: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  token: initialToken,
  onSuccessGoToLogin,
  onGoToForgotPassword,
  onGoToLanding,
}) => {
  // Read token from props or URL search params
  const [token, setToken] = useState<string>(() => {
    if (initialToken) return initialToken;
    const params = new URLSearchParams(window.location.search);
    return params.get('token') || '';
  });

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Verify token and auth session on mount
  useEffect(() => {
    let isMounted = true;

    // Listen for auth state changes (e.g. PASSWORD_RECOVERY event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY' || session) {
        setTokenValid(true);
        if (session?.user?.email) {
          setUserEmail(session.user.email);
        }
        setVerifying(false);
      }
    });

    async function initRecovery() {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');

      // 1. If PKCE code is present in URL, exchange code for session
      if (code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data?.session) {
            if (isMounted) {
              setTokenValid(true);
              setUserEmail(data.session.user?.email || '');
              setVerifying(false);
              return;
            }
          }
        } catch (err) {
          console.error('[ResetPassword] PKCE code exchange failed:', err);
        }
      }

      // 2. Check for active Supabase session (e.g., set from hash fragment or recovery link)
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        if (isMounted) {
          setTokenValid(true);
          setUserEmail(sessionData.session.user?.email || '');
          setVerifying(false);
          return;
        }
      }

      // 3. Fallback: Check if custom token was passed and verify
      if (token) {
        try {
          const res = await fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
          const data = await res.json();
          if (isMounted) {
            if (res.ok && data.valid) {
              setTokenValid(true);
              setUserEmail(data.email || '');
            } else {
              setTokenValid(false);
              setTokenError(data.error || 'This password reset link is invalid or expired.');
            }
            setVerifying(false);
            return;
          }
        } catch (err) {
          // ignore custom fallback errors if supabase session is main route
        }
      }

      // If no session or code or valid token found
      if (isMounted) {
        setVerifying(false);
        setTokenValid(false);
        setTokenError('No active password recovery session. Please click the reset link in your email or request a new one.');
      }
    }

    initRecovery();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [token]);

  // Validation rules
  const isMinLength = password.length >= 8;
  const isMatch = password.length > 0 && password === confirmPassword;
  const isValid = isMinLength && isMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!isMinLength) {
      setSubmitError('Password must be at least 8 characters long.');
      return;
    }

    if (!isMatch) {
      setSubmitError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Update password using native Supabase Auth
      const { error: supabaseErr } = await supabase.auth.updateUser({ password });

      if (supabaseErr) {
        // If Supabase session expired or unavailable, attempt backend API update fallback if token exists
        if (token) {
          const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password, confirmPassword }),
          });
          const data = await res.json();
          if (!res.ok) {
            setSubmitError(data.error || supabaseErr.message || 'Failed to reset password. Please request a new recovery link.');
            return;
          }
        } else {
          setSubmitError(supabaseErr.message || 'Failed to update password. Your recovery link may have expired.');
          return;
        }
      }

      setResetSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred while resetting your password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Enter a secure new password for your ResolveIQ account."
      onGoToLanding={onGoToLanding}
      maxWidth="max-w-[380px]"
    >
      {verifying ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#2463FF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#64748B]">Verifying security token...</p>
        </div>
      ) : resetSuccess ? (
        <div className="py-1 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-[#101A35]">Password Updated</h3>
            <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
              Your ResolveIQ credentials have been successfully reset and all previous tokens invalidated.
            </p>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={onSuccessGoToLogin}
              className="w-full h-[46px] flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#2463FF] to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <span>Sign In with New Password</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : !tokenValid ? (
        <div className="py-1 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-[#101A35]">Invalid or Expired Link</h3>
            <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
              {tokenError || 'This password reset link is invalid, expired, or has already been used.'}
            </p>
          </div>

          <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200 text-[11px] text-[#64748B] text-left space-y-1">
            <p className="font-semibold text-[#101A35]">Notice:</p>
            <p>For your security, reset links expire after 20 minutes and can only be used once.</p>
          </div>

          <div className="pt-1 flex flex-col gap-2">
            <button
              type="button"
              onClick={onGoToForgotPassword}
              className="w-full h-[46px] flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#2463FF] to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <span>Request a New Reset Link</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onSuccessGoToLogin}
              className="w-full py-1.5 text-xs font-medium text-[#64748B] hover:text-[#101A35] transition-colors cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {userEmail && (
            <div className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs">
              <span className="text-[#64748B]">Account:</span>
              <span className="font-mono text-[#2463FF] font-semibold">{userEmail}</span>
            </div>
          )}

          {submitError && (
            <div className="flex items-start gap-2.5 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1 font-medium leading-tight">{submitError}</div>
            </div>
          )}

          {/* New Password */}
          <div>
            <label htmlFor="new-password" className="block text-[11px] font-semibold text-slate-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full h-[46px] pl-9 pr-10 text-sm bg-slate-50/80 border border-slate-200/90 rounded-xl text-[#101A35] placeholder-slate-400 focus:outline-hidden focus:border-[#2463FF] focus:ring-1 focus:ring-[#2463FF] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm-password" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full h-[46px] pl-9 pr-10 text-sm bg-slate-50/80 border border-slate-200/90 rounded-xl text-[#101A35] placeholder-slate-400 focus:outline-hidden focus:border-[#2463FF] focus:ring-1 focus:ring-[#2463FF] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Password Quality Indicator */}
          <div className="p-2.5 bg-slate-50/90 rounded-xl border border-slate-200 space-y-1 text-xs text-[#64748B]">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isMinLength ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className={isMinLength ? 'text-[#101A35] font-medium' : 'text-[#64748B]'}>
                Minimum 8 characters
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isMatch ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className={isMatch ? 'text-[#101A35] font-medium' : 'text-[#64748B]'}>
                Passwords match
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !isValid}
            className="w-full h-[46px] flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#2463FF] to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-1"
          >
            {submitting ? 'Updating Password...' : 'Save & Update Password'}
            <ShieldCheck className="w-4 h-4" />
          </button>
        </form>
      )}
    </AuthLayout>
  );
};
