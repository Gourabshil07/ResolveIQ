import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, UserCheck, Mail, Lock, AlertCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthLoadingOverlay } from '../components/auth/AuthLoadingOverlay';

interface RegisterPageProps {
  onSuccess: () => void;
  onGoToLogin: () => void;
  onGoToLanding?: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSuccess,
  onGoToLogin,
  onGoToLanding,
}) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<'IT_USER' | 'SUPPORT_ENGINEER'>('IT_USER');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Please provide your full name.');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter both passwords.');
      return;
    }
    if (role !== 'IT_USER' && role !== 'SUPPORT_ENGINEER') {
      setError('Only IT User and Support Engineer roles can be self-registered.');
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
        setError('This email address is reserved for administrator access. Please use the dedicated Admin Login portal.');
        setLoading(false);
        return;
      }

      // Pre-validate registration to ensure permanent role integrity
      const valRes = await fetch('/api/auth/validate-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, role }),
      });
      const valData = await valRes.json();

      if (!valRes.ok || !valData.valid) {
        setError(valData.error || 'Registration cannot proceed for this account.');
        setLoading(false);
        return;
      }

      await register({
        fullName: trimmedName,
        email: trimmedEmail,
        password,
        role,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create an Account"
      subtitle="Sign up as an IT User or Support Engineer to get started."
      onGoToLanding={onGoToLanding}
      maxWidth="max-w-[380px]"
      isSignUp={true}
    >
      <AuthLoadingOverlay
        isVisible={loading}
        type="SIGNUP"
      />
      {/* -------------------------------------------------------------
          ERROR ALERT
      ------------------------------------------------------------- */}
      {error && (
        <div className="mb-2.5 flex items-start gap-2.5 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <div className="flex-1 font-medium leading-tight">{error}</div>
        </div>
      )}

      {/* -------------------------------------------------------------
          REGISTRATION FORM (Compact, Matching Input Heights ~44px)
      ------------------------------------------------------------- */}
      <form onSubmit={handleSubmit} className="space-y-2.5">
        {/* Full Name */}
        <div>
          <label htmlFor="reg-name" className="block text-[11px] font-semibold text-slate-700 mb-1">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserCheck className="h-4 w-4 text-slate-400" />
            </div>
            <input
              id="reg-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Chen"
              className="w-full h-[44px] pl-9 pr-3 text-sm bg-slate-50/80 border border-slate-200/90 rounded-xl text-[#101A35] placeholder-slate-400 focus:outline-hidden focus:border-[#2463FF] focus:ring-1 focus:ring-[#2463FF] transition-colors"
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label htmlFor="reg-email" className="block text-[11px] font-semibold text-slate-700 mb-1">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-slate-400" />
            </div>
            <input
              id="reg-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full h-[44px] pl-9 pr-3 text-sm bg-slate-50/80 border border-slate-200/90 rounded-xl text-[#101A35] placeholder-slate-400 focus:outline-hidden focus:border-[#2463FF] focus:ring-1 focus:ring-[#2463FF] transition-colors"
            />
          </div>
        </div>

        {/* Password & Confirm Password (2 Columns on Tablet / Desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Password */}
          <div>
            <label htmlFor="reg-password" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="≥ 6 chars"
                className="w-full h-[44px] pl-9 pr-8 text-sm bg-slate-50/80 border border-slate-200/90 rounded-xl text-[#101A35] placeholder-slate-400 focus:outline-hidden focus:border-[#2463FF] focus:ring-1 focus:ring-[#2463FF] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="reg-confirm-password" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="reg-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter"
                className="w-full h-[44px] pl-9 pr-8 text-sm bg-slate-50/80 border border-slate-200/90 rounded-xl text-[#101A35] placeholder-slate-400 focus:outline-hidden focus:border-[#2463FF] focus:ring-1 focus:ring-[#2463FF] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div>
          <label htmlFor="reg-role" className="block text-[11px] font-semibold text-slate-700 mb-1">
            Account Role
          </label>
          <div className="relative">
            <select
              id="reg-role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'IT_USER' | 'SUPPORT_ENGINEER')}
              className="w-full h-[44px] px-3 text-sm bg-slate-50/80 border border-slate-200/90 rounded-xl text-[#101A35] focus:outline-hidden focus:border-[#2463FF] focus:ring-1 focus:ring-[#2463FF] transition-colors appearance-none cursor-pointer pr-9"
            >
              <option value="IT_USER">IT User (Report & track own incidents)</option>
              <option value="SUPPORT_ENGINEER">Support Engineer (Triage & resolve)</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-1 text-[10px] text-slate-500 leading-tight">
            Administrator accounts are provisioned via the privileged Administrator Console.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-[46px] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2463FF] to-blue-700 hover:from-blue-600 hover:to-blue-800 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer mt-1"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* -------------------------------------------------------------
          LINK TO LOGIN
      ------------------------------------------------------------- */}
      <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-center text-xs text-[#64748B]">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onGoToLogin}
          className="font-semibold text-[#2463FF] hover:text-blue-700 cursor-pointer underline underline-offset-2 transition-colors"
        >
          Sign In
        </button>
      </div>
    </AuthLayout>
  );
};
