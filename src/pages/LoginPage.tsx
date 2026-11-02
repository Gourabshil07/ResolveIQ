import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Lock, Mail, AlertCircle, UserCheck, Wrench, Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthLoadingOverlay } from '../components/auth/AuthLoadingOverlay';

interface LoginPageProps {
  onSuccess: () => void;
  onGoToRegister: () => void;
  onGoToLanding?: () => void;
  onGoToForgotPassword?: () => void;
  onGoToAdminLogin?: () => void;
}

type SignInMode = 'IT_USER' | 'IT_SUPPORT' | 'ADMIN';

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onGoToRegister,
  onGoToLanding,
  onGoToForgotPassword,
  onGoToAdminLogin,
}) => {
  const { login } = useAuth();
  const [signInMode, setSignInMode] = useState<SignInMode>('IT_USER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Switch role mode
  const handleSelectMode = (mode: SignInMode) => {
    if (mode === 'ADMIN' && onGoToAdminLogin) {
      onGoToAdminLogin();
      return;
    }
    setSignInMode(mode);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);

    try {
      // Check if this is reserved administrator email
      const checkRes = await fetch('/api/auth/check-admin-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const checkData = await checkRes.json();

      if (checkData.isAdminEmail) {
        setError('This email is reserved for administrator access. Please use the Admin Login portal.');
        setLoading(false);
        return;
      }

      await login(trimmedEmail, password, signInMode);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const pageTitle = 'Welcome back';
  const pageSubtitle =
    signInMode === 'ADMIN'
      ? 'Sign in to the ResolveIQ Administrator Console.'
      : 'Select your portal and sign in to your ResolveIQ account.';

  return (
    <AuthLayout
      title={pageTitle}
      subtitle={pageSubtitle}
      onGoToLanding={onGoToLanding}
      maxWidth="max-w-[380px]"
    >
      <AuthLoadingOverlay
        isVisible={loading}
        type={signInMode === 'ADMIN' ? 'ADMIN_LOGIN' : 'LOGIN'}
      />
      {/* -------------------------------------------------------------
          ROLE SELECTION (Compact Segmented Cards, Height 60–66px)
      ------------------------------------------------------------- */}
      {signInMode !== 'ADMIN' ? (
        <div className="mb-3.5">
          <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider font-mono">
            Portal Access
          </label>
          <div className="grid grid-cols-2 gap-2">
            {/* Option 1: IT User */}
            <button
              type="button"
              onClick={() => handleSelectMode('IT_USER')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer h-[62px] ${
                signInMode === 'IT_USER'
                  ? 'border-[#2463FF] bg-blue-50/90 text-[#101A35] ring-1 ring-[#2463FF]/30 shadow-xs'
                  : 'border-slate-200/90 bg-slate-50/80 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  signInMode === 'IT_USER'
                    ? 'bg-[#2463FF] text-white shadow-xs'
                    : 'bg-slate-200/80 text-slate-500'
                }`}
              >
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold leading-tight truncate text-[#101A35]">IT User</span>
                <span className="block text-[10px] text-[#64748B] truncate">Report & track</span>
              </div>
            </button>

            {/* Option 2: IT Support */}
            <button
              type="button"
              onClick={() => handleSelectMode('IT_SUPPORT')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer h-[62px] ${
                signInMode === 'IT_SUPPORT'
                  ? 'border-[#2463FF] bg-blue-50/90 text-[#101A35] ring-1 ring-[#2463FF]/30 shadow-xs'
                  : 'border-slate-200/90 bg-slate-50/80 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  signInMode === 'IT_SUPPORT'
                    ? 'bg-[#2463FF] text-white shadow-xs'
                    : 'bg-slate-200/80 text-slate-500'
                }`}
              >
                <Wrench className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold leading-tight truncate text-[#101A35]">IT Support</span>
                <span className="block text-[10px] text-[#64748B] truncate">Triage & resolve</span>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-3.5 p-2.5 bg-purple-50 border border-purple-200 rounded-xl h-[62px] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-purple-900 truncate">Administrator Console</span>
              <span className="block text-[10px] text-purple-700 truncate">Privileged Operations</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSelectMode('IT_USER')}
            className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer transition-colors shrink-0 ml-2 bg-purple-100/70 px-2 py-1 rounded-lg"
          >
            <ArrowLeft className="w-3 h-3" /> Back
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------
          ERROR ALERT
      ------------------------------------------------------------- */}
      {error && (
        <div className="mb-3 flex items-start gap-2.5 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <div className="flex-1 font-medium leading-tight">{error}</div>
        </div>
      )}

      {/* -------------------------------------------------------------
          LOGIN FORM (Compact Inputs ~46px, Button ~46px)
      ------------------------------------------------------------- */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Email Input */}
        <div>
          <label htmlFor="login-email" className="block text-[11px] font-semibold text-slate-700 mb-1">
            {signInMode === 'ADMIN'
              ? 'Administrator Email'
              : signInMode === 'IT_USER'
              ? 'IT User Email'
              : 'IT Support Email'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-slate-400" />
            </div>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                signInMode === 'ADMIN'
                  ? 'admin@company.com'
                  : signInMode === 'IT_USER'
                  ? 'user@company.com'
                  : 'support@company.com'
              }
              className="w-full h-[46px] pl-9 pr-3 text-sm bg-slate-50/80 border border-slate-200/90 rounded-xl text-[#101A35] placeholder-slate-400 focus:outline-hidden focus:border-[#2463FF] focus:ring-1 focus:ring-[#2463FF] transition-colors"
            />
          </div>
        </div>

        {/* Password Input with Show/Hide */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="login-password" className="block text-[11px] font-semibold text-slate-700">
              Password
            </label>
            {onGoToForgotPassword && (
              <button
                type="button"
                onClick={onGoToForgotPassword}
                className="text-[11px] font-medium text-[#2463FF] hover:text-blue-700 cursor-pointer transition-colors"
              >
                Forgot password?
              </button>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full h-[46px] flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white shadow-md transition-all disabled:opacity-50 cursor-pointer mt-1 ${
            signInMode === 'ADMIN'
              ? 'bg-gradient-to-r from-[#8B5CF6] to-purple-700 hover:from-purple-600 hover:to-purple-800 shadow-purple-500/20'
              : 'bg-gradient-to-r from-[#2463FF] to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-blue-500/20'
          }`}
        >
          {loading
            ? 'Signing in...'
            : signInMode === 'ADMIN'
            ? 'Sign In as Administrator'
            : `Sign In as ${signInMode === 'IT_USER' ? 'IT User' : 'IT Support'}`}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* -------------------------------------------------------------
          FOOTER / SECONDARY NAVIGATION
      ------------------------------------------------------------- */}
      <div className="mt-3.5 pt-2 flex flex-col gap-2.5 text-center">
        {/* Administrator Mode Trigger (only when in User/Support mode) */}
        {signInMode !== 'ADMIN' && (
          <>
            <div className="relative flex items-center justify-center my-0.5">
              <div className="border-t border-slate-200/90 w-full" />
              <span className="bg-white px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest absolute">
                OR
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleSelectMode('ADMIN')}
              className="text-xs text-[#2463FF] hover:text-blue-700 inline-flex items-center justify-center gap-1.5 font-semibold cursor-pointer transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-[#2463FF]" />
              <span>Administrator Login Console</span>
            </button>
          </>
        )}

        {/* Sign Up Link */}
        <p className="text-xs text-[#64748B]">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onGoToRegister}
            className="font-semibold text-[#2463FF] hover:text-blue-700 cursor-pointer underline underline-offset-2 transition-colors"
          >
            Sign Up
          </button>
        </p>
      </div>
    </AuthLayout>
  );
};
