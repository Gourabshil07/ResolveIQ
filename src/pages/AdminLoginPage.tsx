import React, { useState } from 'react';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthLoadingOverlay } from '../components/auth/AuthLoadingOverlay';
import { supabase } from '../lib/supabase';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onGoToUserLogin: () => void;
  onGoToLanding?: () => void;
}

type AdminTab = 'SIGN_IN' | 'FORGOT_PASSWORD';

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onSuccess,
  onGoToUserLogin,
  onGoToLanding,
}) => {
  const { adminLogin } = useAuth();
  const [tab, setTab] = useState<AdminTab>('SIGN_IN');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSubmitted, setResetSubmitted] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please provide a valid administrator email address.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);

    try {
      // 1. Verify against server admin-email check first
      const checkRes = await fetch('/api/auth/check-admin-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const checkData = await checkRes.json();

      if (!checkData.isAdminEmail) {
        setError('Unauthorized administrator email. Please use the normal Sign In portal for user accounts.');
        setLoading(false);
        return;
      }

      // 2. Perform dedicated admin login
      await adminLogin(trimmedEmail, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Administrator login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please provide a valid administrator email address.');
      return;
    }

    setLoading(true);

    try {
      // 1. Verify server-side if this is the authorized administrator email
      const checkRes = await fetch('/api/auth/admin-forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const checkData = await checkRes.json();

      if (!checkRes.ok || !checkData.success) {
        setError(checkData.error || 'Unauthorized email address. Only the registered administrator email can request an admin password reset.');
        setLoading(false);
        return;
      }

      // 2. Trigger native Supabase password recovery pointing to dedicated admin reset route
      const redirectUrl = `${window.location.origin}/?page=admin-reset-password`;
      const { error: supabaseErr } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: redirectUrl,
      });

      if (supabaseErr) {
        setError(supabaseErr.message || 'Failed to dispatch administrator password reset instructions.');
        setLoading(false);
        return;
      }

      setResetSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while requesting password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Administrator Console"
      subtitle="Privileged authentication portal for ResolveIQ platform management."
      onGoToLanding={onGoToLanding}
      maxWidth="max-w-[380px]"
    >
      <AuthLoadingOverlay
        isVisible={loading}
        type="ADMIN_LOGIN"
      />
      {/* Admin Privilege Header Indicator */}
      <div className="mb-3.5 p-2.5 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2.5 text-purple-900">
        <div className="w-8 h-8 rounded-lg bg-[#8B5CF6] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Shield className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-xs font-bold truncate text-purple-950">Privileged Access Only</span>
          <span className="block text-[10px] text-purple-700 truncate">Restricted to authorized system administrator</span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-3 flex items-start gap-2.5 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <div className="flex-1 font-medium leading-tight">{error}</div>
        </div>
      )}

      {tab === 'SIGN_IN' ? (
        <form onSubmit={handleSignIn} className="space-y-3">
          {/* Email */}
          <div>
            <label htmlFor="admin-email" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Administrator Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@resolveiq.internal"
                className="w-full h-[46px] pl-9 pr-3 text-sm bg-slate-50/80 border border-slate-200/90 rounded-xl text-[#101A35] placeholder-slate-400 focus:outline-hidden focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="admin-password" className="block text-[11px] font-semibold text-slate-700">
                Administrator Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setTab('FORGOT_PASSWORD');
                  setError(null);
                  setResetSubmitted(false);
                }}
                className="text-[11px] font-medium text-[#8B5CF6] hover:text-purple-800 cursor-pointer transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[46px] flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-purple-700 hover:from-purple-600 hover:to-purple-800 shadow-md shadow-purple-500/20 transition-all disabled:opacity-50 cursor-pointer mt-1"
          >
            {loading ? 'Authenticating Admin...' : 'Sign In as Administrator'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      ) : resetSubmitted ? (
        <div className="text-center py-2 space-y-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 text-[#8B5CF6] mx-auto flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-[#101A35]">Admin Recovery Dispatched</h3>
            <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
              If an administrator account exists for <span className="text-[#8B5CF6] font-mono text-[11px] font-semibold">{email.trim()}</span>, password recovery instructions have been sent.
            </p>
          </div>

          <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200/80 text-[11px] text-purple-900 text-left space-y-1">
            <p className="font-semibold text-purple-950">Security Enforcement:</p>
            <p>• Only the pre-authorized administrator email can access this recovery link.</p>
            <p>• Check your spam or junk folder if you don't see the email within 2 minutes.</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setTab('SIGN_IN');
              setError(null);
              setResetSubmitted(false);
            }}
            className="w-full h-[46px] flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-purple-700 hover:from-purple-600 hover:to-purple-800 shadow-md transition-all cursor-pointer"
          >
            <span>Return to Admin Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleForgotPassword} className="space-y-3">
          <div>
            <label htmlFor="admin-reset-email" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Authorized Administrator Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="admin-reset-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@resolveiq.internal"
                className="w-full h-[46px] pl-9 pr-3 text-sm bg-slate-50/80 border border-slate-200/90 rounded-xl text-[#101A35] placeholder-slate-400 focus:outline-hidden focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[46px] flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-purple-700 hover:from-purple-600 hover:to-purple-800 shadow-md shadow-purple-500/20 transition-all disabled:opacity-50 cursor-pointer mt-1"
          >
            {loading ? 'Verifying Administrator Email...' : 'Request Admin Reset Link'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setTab('SIGN_IN');
                setError(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#101A35] font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Admin Sign In</span>
            </button>
          </div>
        </form>
      )}

      {/* Footer Navigation Back to Normal Login */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-200/80 text-center">
        <button
          type="button"
          onClick={onGoToUserLogin}
          className="text-xs font-semibold text-[#2463FF] hover:text-blue-700 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#2463FF]" />
          <span>Return to Normal User Sign In</span>
        </button>
      </div>
    </AuthLayout>
  );
};
