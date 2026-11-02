import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, KeyRound, ArrowLeft } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { supabase } from '../lib/supabase';

interface AdminResetPasswordPageProps {
  onSuccessGoToLogin: () => void;
  onGoToAdminLogin: () => void;
  onGoToLanding?: () => void;
}

export const AdminResetPasswordPage: React.FC<AdminResetPasswordPageProps> = ({
  onSuccessGoToLogin,
  onGoToAdminLogin,
  onGoToLanding,
}) => {
  const [verifying, setVerifying] = useState(true);
  const [isAdminValid, setIsAdminValid] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string>('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initAdminRecovery() {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');

      // Exchange PKCE code if present
      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
        } catch (err) {
          console.warn('[AdminResetPassword] Code exchange notice:', err);
        }
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session || !session.user?.email) {
        if (isMounted) {
          setVerifying(false);
          setIsAdminValid(false);
          setAccessError('No active password recovery session found. Please request a new administrator reset link.');
        }
        return;
      }

      const userEmail = session.user.email.trim().toLowerCase();

      try {
        // Verify server-side if this user email is indeed the authorized ADMIN_EMAIL
        const checkRes = await fetch('/api/auth/check-admin-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail }),
        });
        const checkData = await checkRes.json();

        if (!isMounted) return;

        if (checkRes.ok && checkData.isAdminEmail) {
          setIsAdminValid(true);
          setAdminEmail(userEmail);
        } else {
          setIsAdminValid(false);
          setAccessError('Unauthorized access. This route is reserved for administrator password recovery.');
        }
      } catch (err: any) {
        if (isMounted) {
          setIsAdminValid(false);
          setAccessError('Unable to verify administrator privileges. Please try again.');
        }
      } finally {
        if (isMounted) {
          setVerifying(false);
        }
      }
    }

    initAdminRecovery();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY' || session) {
        if (session?.user?.email) {
          const userEmail = session.user.email.trim().toLowerCase();
          const checkRes = await fetch('/api/auth/check-admin-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail }),
          });
          const checkData = await checkRes.json();
          if (checkData.isAdminEmail) {
            setIsAdminValid(true);
            setAdminEmail(userEmail);
            setVerifying(false);
          }
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
      const { error: supabaseErr } = await supabase.auth.updateUser({ password });

      if (supabaseErr) {
        setSubmitError(supabaseErr.message || 'Failed to update administrator password.');
        return;
      }

      setResetSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred while resetting the administrator password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Admin Password Recovery"
      subtitle="Create a new secure password for your ResolveIQ Administrator account."
      onGoToLanding={onGoToLanding}
      maxWidth="max-w-[380px]"
    >
      {verifying ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#64748B]">Verifying administrator session...</p>
        </div>
      ) : resetSuccess ? (
        <div className="py-1 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-[#101A35]">Admin Password Updated</h3>
            <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
              Your administrator credentials have been securely updated. You may now log in to the Administrator Console.
            </p>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={onGoToAdminLogin}
              className="w-full h-[46px] flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-purple-700 hover:from-purple-600 hover:to-purple-800 shadow-md shadow-purple-500/20 transition-all cursor-pointer"
            >
              <span>Sign In to Administrator Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : !isAdminValid ? (
        <div className="py-1 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-[#101A35]">Access Restricted</h3>
            <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
              {accessError || 'Unauthorized access. This route is reserved for administrator password recovery.'}
            </p>
          </div>

          <div className="pt-1 flex flex-col gap-2">
            <button
              type="button"
              onClick={onGoToAdminLogin}
              className="w-full h-[46px] flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-purple-700 hover:from-purple-600 hover:to-purple-800 shadow-md transition-all cursor-pointer"
            >
              <span>Return to Admin Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onSuccessGoToLogin}
              className="w-full py-1.5 text-xs font-medium text-[#64748B] hover:text-[#101A35] transition-colors cursor-pointer"
            >
              Go to Normal User Sign In
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {adminEmail && (
            <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between text-xs">
              <span className="text-[#64748B]">Admin Account:</span>
              <span className="font-mono text-[#8B5CF6] font-semibold">{adminEmail}</span>
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
            <label htmlFor="new-admin-password" className="block text-[11px] font-semibold text-slate-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="new-admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full h-[46px] pl-9 pr-10 text-sm bg-slate-50/80 border border-slate-200/90 rounded-xl text-[#101A35] placeholder-slate-400 focus:outline-hidden focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
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
            <label htmlFor="confirm-admin-password" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="confirm-admin-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full h-[46px] pl-9 pr-10 text-sm bg-slate-50/80 border border-slate-200/90 rounded-xl text-[#101A35] placeholder-slate-400 focus:outline-hidden focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
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

          <button
            type="submit"
            disabled={submitting || !isValid}
            className="w-full h-[46px] flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-purple-700 hover:from-purple-600 hover:to-purple-800 shadow-md shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-1"
          >
            {submitting ? 'Updating Admin Password...' : 'Save & Update Password'}
            <ShieldCheck className="w-4 h-4" />
          </button>
        </form>
      )}
    </AuthLayout>
  );
};
