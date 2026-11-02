import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Zap, Shield, Users } from 'lucide-react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onGoToLanding?: () => void;
  maxWidth?: string;
  isSignUp?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  children,
  onGoToLanding,
  maxWidth = 'max-w-[380px]',
  isSignUp = false,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const handleGoHome = () => {
    if (window.location.search) {
      try {
        window.history.pushState({}, '', window.location.pathname || '/');
      } catch {
        // Fallback for restricted environments
      }
    }
    if (onGoToLanding) {
      onGoToLanding();
    } else {
      window.location.href = '/';
    }
  };

  const primaryGifUrl = 'https://cdn.pixabay.com/animation/2022/11/10/13/22/13-22-56-246_512.gif';
  const fallbackGifUrl = '/images/auth-pixabay.gif';

  return (
    <div className="min-h-screen bg-[#EEF3FC] text-[#111A35] flex flex-col justify-start lg:justify-center items-center pt-16 sm:pt-20 lg:pt-14 pb-8 sm:pb-10 px-4 sm:px-6 lg:px-7 relative overflow-x-hidden selection:bg-blue-600 selection:text-white font-sans">
      {/* -------------------------------------------------------------
          SOFT AMBIENT BACKGROUND ATMOSPHERE
      ------------------------------------------------------------- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Subtle Tech Grid / Dot Texture */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #2463FF 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Primary Soft Blue Gradient Orb */}
        <div className="absolute top-1/4 -left-20 w-[460px] h-[460px] bg-gradient-to-tr from-blue-300/30 via-indigo-200/20 to-transparent blur-[120px] rounded-full animate-orb-float-1" />

        {/* Accent Soft Purple Gradient Orb */}
        <div className="absolute bottom-1/4 -right-20 w-[480px] h-[480px] bg-gradient-to-br from-purple-300/25 via-violet-200/20 to-transparent blur-[120px] rounded-full animate-orb-float-2" />
      </div>

      {/* -------------------------------------------------------------
          TOP HEADER (Top-Left ResolveIQ Logo Branding & Top-Right Back to Home)
          - Compact header height: 56–64px
          - Icon: 34–38px (w-[36px] h-[36px])
          - Brand text: 21–23px (text-[22px])
          - Horizontal padding: 24–30px
      ------------------------------------------------------------- */}
      <header className="absolute top-0 left-0 right-0 h-14 sm:h-16 px-6 sm:px-8 z-30 flex items-center justify-between">
        {/* Clickable ResolveIQ Logo + Brand Name (Top-Left) */}
        <button
          type="button"
          onClick={handleGoHome}
          className="inline-flex items-center gap-2.5 group cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2463FF] rounded-xl transition-transform active:scale-98"
          title="Return to ResolveIQ Homepage"
        >
          <div className="w-[36px] h-[36px] rounded-xl bg-gradient-to-tr from-[#2463FF] to-indigo-600 flex items-center justify-center font-bold text-white text-base shadow-sm group-hover:from-blue-600 group-hover:to-indigo-500 transition-all shrink-0">
            R
          </div>
          <span className="font-extrabold text-[22px] tracking-tight text-[#111A35] group-hover:text-[#2463FF] transition-colors leading-none">
            ResolveIQ
          </span>
        </button>

        {/* Clearly Visible Back to Home Button (Top-Right) */}
        <button
          type="button"
          onClick={handleGoHome}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#111A35] bg-white/90 hover:bg-white border border-slate-200/90 rounded-lg px-3.5 py-1.5 transition-all cursor-pointer group shadow-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2463FF]"
          title="Back to ResolveIQ Landing Page"
        >
          <ArrowLeft className="w-4 h-4 text-[#2463FF] group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </button>
      </header>

      {/* -------------------------------------------------------------
          MAIN 50/50 SYMMETRICAL CONTAINER CARD (1040–1080px Wide, 560–640px Height)
          - Compact & balanced layout across Mobile, Tablet, and Desktop.
      ------------------------------------------------------------- */}
      <main
        className={`w-[calc(100%-32px)] sm:w-[calc(100%-48px)] max-w-[1060px] mx-auto relative z-10 bg-white border border-[#E2E8F0] rounded-[22px] shadow-2xl shadow-blue-900/10 backdrop-blur-xl overflow-hidden auth-grid-split items-stretch mt-2 sm:mt-3 lg:mt-0 ${
          isSignUp
            ? 'min-h-[540px] lg:min-h-[620px]'
            : 'min-h-[540px] lg:h-[620px]'
        }`}
      >
        {/* Left Section (50% Width): Login / Signup / Password Reset Form */}
        <div className="w-full p-6 sm:p-7 lg:p-8 flex flex-col justify-center bg-white border-b lg:border-b-0 lg:border-r border-[#E2E8F0] overflow-y-auto">
          <div className={`w-full ${maxWidth} mx-auto`}>
            <div className="mb-3.5">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#111A35] leading-tight">
                {title}
              </h1>
              <p className="mt-1 text-sm text-[#64748B] leading-relaxed">
                {subtitle}
              </p>
            </div>

            <div className="w-full">
              {children}
            </div>
          </div>
        </div>

        {/* Right Section (50% Width): GIF Illustration & Promotional Content */}
        <div className="hidden lg:flex w-full p-6 xl:p-7 flex-col items-center justify-center text-center relative bg-[#F5F7FF] overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-0 bg-radial from-blue-400/10 via-indigo-400/5 to-transparent blur-3xl pointer-events-none -z-10" />

          {/* Animated Illustration: Exact Pixabay GIF URL */}
          <div className="w-full max-w-[420px] h-[330px] xl:h-[350px] relative flex items-center justify-center mb-2">
            {!imgFailed ? (
              <img
                src={primaryGifUrl}
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (target.src !== window.location.origin + fallbackGifUrl) {
                    target.src = fallbackGifUrl;
                  } else {
                    setImgFailed(true);
                  }
                }}
                alt="IT Support, Made Simpler - ResolveIQ"
                className="w-[94%] max-h-[350px] object-contain object-center drop-shadow-[0_12px_24px_rgba(36,99,255,0.12)]"
              />
            ) : (
              <div className="w-[94%] h-full flex flex-col items-center justify-center bg-white/70 rounded-2xl border border-slate-200/80 p-6 text-center text-slate-500">
                <Zap className="w-10 h-10 text-[#2463FF] mb-2 animate-pulse" />
                <p className="text-xs font-semibold text-slate-700">Illustration Preview</p>
                <p className="text-[11px] text-slate-500 mt-0.5">IT Support Workflow Animation</p>
              </div>
            )}
          </div>

          {/* Promotional Headline & Subtitle */}
          <div className="max-w-md space-y-1 text-center">
            <h2 className="text-[24px] xl:text-[26px] font-extrabold tracking-tight text-[#111A35] leading-snug">
              IT Support,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2463FF] via-indigo-600 to-[#8B5CF6]">
                Made Simpler.
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] font-normal leading-relaxed max-w-sm mx-auto">
              Smarter diagnostics. Faster resolutions. Better collaboration.
            </p>

            {/* Three Compact Feature Highlights along the Bottom */}
            <div className="pt-2.5 flex flex-wrap items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
                <Zap className="w-3.5 h-3.5 text-[#2463FF] shrink-0" />
                <div className="text-left leading-tight">
                  <span className="block font-bold text-[11px] text-[#111A35]">AI Diagnostics</span>
                  <span className="block text-[9px] text-[#64748B]">Quick insights</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
                <Users className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" />
                <div className="text-left leading-tight">
                  <span className="block font-bold text-[11px] text-[#111A35]">Faster Resolution</span>
                  <span className="block text-[9px] text-[#64748B]">Issue tracking</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
                <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <div className="text-left leading-tight">
                  <span className="block font-bold text-[11px] text-[#111A35]">Seamless Collaboration</span>
                  <span className="block text-[9px] text-[#64748B]">Work together</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer copyright: Exactly ~24–32px (mt-6 sm:mt-8) below main card */}
      <footer className="mt-6 sm:mt-8 text-center text-[11px] sm:text-xs text-[#64748B] z-10 font-medium">
        &copy; {new Date().getFullYear()} ResolveIQ Intelligent Incident Management. All rights reserved.
      </footer>
    </div>
  );
};
