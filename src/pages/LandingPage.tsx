import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Shield,
  Bot,
  MessageSquare,
  UserCheck,
  Star,
  BarChart3,
  CheckCircle2,
  Server,
  Zap,
  Activity,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';

interface LandingPageProps {
  onLaunchApp: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onGoToAbout?: () => void;
  onGoToContact?: () => void;
}

const TARGET_PHRASE = 'Keep Your Team Moving.';

const AnimatedHeadlinePhrase: React.FC = () => {
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check user preference for reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleMotionChange);
    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayedText(TARGET_PHRASE);
      return;
    }

    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      // Typing phase: 95ms per character (steady, crisp cadence)
      if (displayedText.length < TARGET_PHRASE.length) {
        timer = setTimeout(() => {
          setDisplayedText(TARGET_PHRASE.slice(0, displayedText.length + 1));
        }, 95);
      } else {
        // Pause after full typing: 1800ms
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 1800);
      }
    } else {
      // Deleting phase: smooth delete at 40ms per character
      if (displayedText.length > 0) {
        timer = setTimeout(() => {
          setDisplayedText(TARGET_PHRASE.slice(0, displayedText.length - 1));
        }, 40);
      } else {
        // Brief pause before retyping
        timer = setTimeout(() => {
          setIsDeleting(false);
        }, 500);
      }
    }

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, reducedMotion]);

  if (reducedMotion) {
    return (
      <span className="block mt-1 sm:mt-1.5 text-transparent bg-clip-text bg-gradient-to-r from-[#2463FF] via-[#38BDF8] to-[#8B5CF6] min-h-[1.2em] lg:whitespace-nowrap">
        {TARGET_PHRASE}
      </span>
    );
  }

  return (
    <span className="block mt-1 sm:mt-1.5 text-transparent bg-clip-text bg-gradient-to-r from-[#2463FF] via-[#38BDF8] to-[#8B5CF6] min-h-[1.2em] lg:whitespace-nowrap">
      <span>{displayedText}</span>
      <span
        className="inline-block w-[3px] h-[0.82em] ml-1 bg-gradient-to-b from-[#2463FF] to-[#8B5CF6] align-middle animate-pulse rounded-full"
        aria-hidden="true"
      />
    </span>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchApp,
  onLogin,
  onRegister,
  onGoToAbout,
  onGoToContact,
}) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-[#2463FF] selection:text-white">
      {/* -------------------------------------------------------------
          TOP BAR NAVIGATION (Unified Across Pages)
      ------------------------------------------------------------- */}
      <PublicNavbar
        activeTab="home"
        onNavigateHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onNavigateFeatures={() => scrollToSection('features')}
        onNavigateAbout={onGoToAbout || (() => scrollToSection('about'))}
        onNavigateContact={onGoToContact || (() => {})}
        onLogin={onLogin}
        onRegister={onRegister}
      />

      {/* -------------------------------------------------------------
          HERO SECTION (Headline, CTAs, & Custom Animated Vector)
      ------------------------------------------------------------- */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-1 sm:pt-2 lg:pt-2 pb-12 sm:pb-14 lg:pb-16 overflow-hidden bg-gradient-to-b from-[#F0F4FA] via-[#F8FAFC] to-white">
        {/* Animated Background Atmosphere */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-blue-200/35 via-indigo-200/25 to-sky-200/20 blur-[130px] rounded-full" />
          <div className="absolute top-1/3 left-10 w-72 h-72 bg-blue-300/20 blur-3xl rounded-full" />
          <div className="absolute top-2/3 right-10 w-80 h-80 bg-purple-200/20 blur-3xl rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-10 items-center">
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-7 xl:col-span-7 text-center lg:text-left space-y-5 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#2463FF] shadow-xs">
              <Zap className="w-3.5 h-3.5 text-[#2463FF] shrink-0" />
              <span>Next-Generation IT Incident Management</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-[2.75rem] font-extrabold tracking-tight text-slate-900 leading-[1.12]">
              <span className="block">Resolve IT Issues Faster.</span>
              <AnimatedHeadlinePhrase />
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              ResolveIQ empowers organizations to report incidents instantly, automate engineer dispatch, troubleshoot with AI, collaborate in real time, and elevate IT operational reliability.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-1 sm:pt-2">
              <button
                type="button"
                onClick={onRegister}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#2463FF] hover:bg-[#1D51D8] active:bg-[#1849be] rounded-xl shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 transition-all cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onLogin}
                className="px-6 py-3.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Sign In
              </button>
            </div>

            {/* Three Verified Technology Badges */}
            <div className="pt-2 sm:pt-1 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 text-xs">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-medium">Supabase PostgreSQL Backed</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-medium">Groq AI Diagnostics</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-medium">Zero Mock Fallback</span>
              </div>
            </div>
          </div>

          {/* Right Column: Custom Animated IT Operations Illustration */}
          <div className="lg:col-span-5 xl:col-span-5 relative flex justify-center lg:justify-end">
            <div className="w-full max-w-md relative bg-white/95 border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 shadow-xl shadow-slate-200/70 backdrop-blur-xl overflow-hidden min-h-[310px] sm:min-h-[330px] flex items-center justify-center">
              {/* Subtle Ambient Glow Behind Card */}
              <div className="absolute -inset-1 bg-gradient-to-tr from-blue-300/20 via-indigo-200/15 to-sky-200/20 blur-xl opacity-80 -z-10" />

              {/* Subtle Grid Canvas Background */}
              <div
                className="absolute inset-0 opacity-[0.05] pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, #0F172A 1px, transparent 0)`,
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Animated Network SVG Overlay */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 460 380"
                preserveAspectRatio="xMidYMid meet"
                fill="none"
              >
                {/* Connection Lines with Animated Dash Streams */}
                <path
                  d="M 90 90 L 230 190"
                  stroke="#2463FF"
                  strokeWidth="2"
                  className="animate-network-flow opacity-70"
                />
                <path
                  d="M 370 90 L 230 190"
                  stroke="#8B5CF6"
                  strokeWidth="2"
                  className="animate-network-flow opacity-70"
                />
                <path
                  d="M 90 290 L 230 190"
                  stroke="#10B981"
                  strokeWidth="2"
                  className="animate-network-flow opacity-70"
                />
                <path
                  d="M 370 290 L 230 190"
                  stroke="#0284C7"
                  strokeWidth="2"
                  className="animate-network-flow opacity-70"
                />
              </svg>

              {/* Central Hub: IT Operations Server Core */}
              <div className="relative z-10 flex flex-col items-center justify-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border-2 border-[#2463FF] flex flex-col items-center justify-center shadow-lg shadow-blue-500/20 relative">
                  <Server className="w-5 h-5 sm:w-7 sm:h-7 text-[#2463FF] mb-0.5" />
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2463FF]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                  </div>
                  <span className="absolute -bottom-5 sm:-bottom-5 text-[9px] sm:text-[10px] font-mono text-slate-700 font-semibold tracking-wider uppercase whitespace-nowrap">
                    Core Hub
                  </span>
                </div>
              </div>

              {/* Node 1: Top-Left (Incident Ticket Node) */}
              <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 animate-float-node">
                <div className="bg-white/95 border border-slate-200/90 rounded-xl p-2 sm:p-2.5 shadow-md shadow-slate-200/80 max-w-[130px] sm:max-w-[155px]">
                  <div className="flex items-center justify-between text-[9px] sm:text-[10px] mb-0.5">
                    <span className="font-mono text-[#0284C7] font-bold">INC-1048</span>
                    <span className="text-rose-600 font-bold">Critical</span>
                  </div>
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-900 truncate">Gateway Outage</p>
                  <p className="text-[8px] sm:text-[9px] text-slate-500 mt-0.5">Triage Assigned</p>
                </div>
              </div>

              {/* Node 2: Top-Right (AI Diagnostics Engine) */}
              <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 animate-float-reverse">
                <div className="bg-white/95 border border-purple-200/90 rounded-xl p-2 sm:p-2.5 shadow-md shadow-slate-200/80 max-w-[130px] sm:max-w-[155px]">
                  <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-[#7C3AED] font-semibold mb-0.5">
                    <Bot className="w-3 h-3 text-[#7C3AED] shrink-0" />
                    <span className="truncate">Groq AI Engine</span>
                  </div>
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-900 truncate">Root Cause Found</p>
                  <p className="text-[8px] sm:text-[9px] text-emerald-600 font-medium mt-0.5">99.4% Match Pattern</p>
                </div>
              </div>

              {/* Node 3: Bottom-Left (Support Engineer Node) */}
              <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 z-20 animate-float-reverse">
                <div className="bg-white/95 border border-slate-200/90 rounded-xl p-2 sm:p-2.5 shadow-md shadow-slate-200/80 max-w-[130px] sm:max-w-[155px]">
                  <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-slate-700 font-semibold mb-0.5">
                    <UserCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate">Lead Engineer</span>
                  </div>
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-900 truncate">Patch Deployed</p>
                  <p className="text-[8px] sm:text-[9px] text-slate-500 mt-0.5">Live Chat Active</p>
                </div>
              </div>

              {/* Node 4: Bottom-Right (Resolution & Feedback Node) */}
              <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 z-20 animate-float-node">
                <div className="bg-white/95 border border-amber-200/90 rounded-xl p-2 sm:p-2.5 shadow-md shadow-slate-200/80 max-w-[130px] sm:max-w-[155px]">
                  <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-amber-600 font-semibold mb-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500 shrink-0" />
                    <span>5.0 Verified</span>
                  </div>
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-900 truncate">Resolution Locked</p>
                  <p className="text-[8px] sm:text-[9px] text-emerald-600 font-medium mt-0.5">Audit Log Signed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          FEATURES SECTION (Clean Light Cards, Accurate Implementations)
      ------------------------------------------------------------- */}
      <section id="features" className="px-4 sm:px-6 lg:px-8 py-14 sm:py-16 bg-[#F8FAFC] border-t border-slate-200/80 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-3 sm:space-y-3.5">
            <h2 className="text-xs font-mono font-semibold tracking-wider text-[#2463FF] uppercase">
              Core Platform Capabilities
            </h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900" style={{ textWrap: 'balance' }}>
              Engineered for Precision IT Operations
            </h3>
            <p className="text-sm sm:text-base text-slate-600">
              Every feature is implemented in full-stack architecture with PostgreSQL persistence and role-based access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white border border-slate-200/80 hover:border-[#2463FF]/50 rounded-2xl p-6 shadow-xs hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-[#2463FF] flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 group-hover:text-[#2463FF] transition-colors">
                  Incident Reporting & Tracking
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Submit tickets across Network, Server, Software, and Hardware categories. Monitor real-time status transitions with automatic ticket sequencing and SLA targets.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 font-mono">
                Status: OPEN · IN_PROGRESS · RESOLVED
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-slate-200/80 hover:border-[#8B5CF6]/50 rounded-2xl p-6 shadow-xs hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 text-[#8B5CF6] flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 group-hover:text-[#8B5CF6] transition-colors">
                  Intelligent AI Troubleshooting
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Support Engineers can generate instant diagnostic suggestions powered by Groq and Gemini. Analyzes ticket symptoms, logs, and recommends step-by-step resolution plans.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-purple-600 font-mono">
                Groq Llama-3 & Gemini Assisted
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-slate-200/80 hover:border-sky-500/50 rounded-2xl p-6 shadow-xs hover:shadow-lg hover:shadow-sky-500/10 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 text-[#0284C7] flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 group-hover:text-[#0284C7] transition-colors">
                  Private Reporter–Engineer Chat
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Direct message channels attached to each incident ticket. Keep reporters continuously informed, upload attachments, and record handover transcripts without external noise.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 font-mono">
                Incident Scoped · Chronological Feed
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white border border-slate-200/80 hover:border-emerald-500/50 rounded-2xl p-6 shadow-xs hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Incident Assignment & Handover
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Automate ticket routing to Tier 1 and Tier 2 Support Engineers. Server-enforced assignment locking guarantees that resolved tickets cannot be tampered with or reassigned.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 font-mono">
                Immutable Resolved State Protection
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-white border border-slate-200/80 hover:border-amber-500/50 rounded-2xl p-6 shadow-xs hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                  <Star className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">
                  Resolution Feedback & Ratings
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Reporters provide 1-to-5 star ratings and satisfaction notes after ticket verification. Engineers and Administrators track average satisfaction and resolution metrics.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 font-mono">
                Relational Feedback Storage · CSAT
              </div>
            </div>

            {/* Feature 6 */}
            <div className="bg-white border border-slate-200/80 hover:border-rose-500/50 rounded-2xl p-6 shadow-xs hover:shadow-lg hover:shadow-rose-500/10 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 group-hover:text-rose-600 transition-colors">
                  Admin Operations Dashboard
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Complete operational oversight with incident category breakdowns, engineer workload distributions, resolution velocity, and tamper-resistant audit logs.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 font-mono">
                Audit Logs · Role Management · KPI Trends
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          HOW IT WORKS SECTION (5 Connected Steps)
      ------------------------------------------------------------- */}
      <section id="how-it-works" className="px-4 sm:px-6 lg:px-8 py-14 sm:py-16 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-3 sm:space-y-3.5">
            <h2 className="text-xs font-mono font-semibold tracking-wider text-[#2463FF] uppercase">
              Incident Lifecycle
            </h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900" style={{ textWrap: 'balance' }}>
              How ResolveIQ Works
            </h3>
            <p className="text-sm sm:text-base text-slate-600">
              From the moment an anomaly is detected to the final post-incident verification, every step is structured and recorded.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 relative">
            {/* Step 1 */}
            <div className="bg-[#F8FAFC] border border-slate-200/80 hover:border-[#2463FF]/50 hover:bg-white rounded-2xl p-5 flex flex-col justify-between relative group transition-all shadow-xs hover:shadow-md">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-[#2463FF] font-mono font-bold text-sm flex items-center justify-center shadow-xs">
                  01
                </div>
                <h4 className="text-base font-semibold text-slate-900">Report Incident</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Employee or IT user submits ticket with category, priority, symptoms, and optional attachments.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[#F8FAFC] border border-slate-200/80 hover:border-[#2463FF]/50 hover:bg-white rounded-2xl p-5 flex flex-col justify-between relative group transition-all shadow-xs hover:shadow-md">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-[#2463FF] font-mono font-bold text-sm flex items-center justify-center shadow-xs">
                  02
                </div>
                <h4 className="text-base font-semibold text-slate-900">Assign Engineer</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Administrator routes the ticket or a Support Engineer claims the ticket into their active workspace.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[#F8FAFC] border border-slate-200/80 hover:border-[#8B5CF6]/50 hover:bg-white rounded-2xl p-5 flex flex-col justify-between relative group transition-all shadow-xs hover:shadow-md">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-purple-200 text-[#8B5CF6] font-mono font-bold text-sm flex items-center justify-center shadow-xs">
                  03
                </div>
                <h4 className="text-base font-semibold text-slate-900">Troubleshoot</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Engineer analyzes root cause with Groq AI, logs internal notes, and chats directly with the reporter.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-[#F8FAFC] border border-slate-200/80 hover:border-emerald-500/50 hover:bg-white rounded-2xl p-5 flex flex-col justify-between relative group transition-all shadow-xs hover:shadow-md">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-emerald-200 text-emerald-600 font-mono font-bold text-sm flex items-center justify-center shadow-xs">
                  04
                </div>
                <h4 className="text-base font-semibold text-slate-900">Resolve Issue</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Engineer provides resolution summary, verifies system restore, and permanently locks assignment.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-[#F8FAFC] border border-slate-200/80 hover:border-amber-500/50 hover:bg-white rounded-2xl p-5 flex flex-col justify-between relative group transition-all shadow-xs hover:shadow-md">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-amber-200 text-amber-600 font-mono font-bold text-sm flex items-center justify-center shadow-xs">
                  05
                </div>
                <h4 className="text-base font-semibold text-slate-900">Collect Feedback</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Reporter submits satisfaction rating and feedback, feeding directly into operational quality KPIs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          ABOUT / PRODUCT OVERVIEW SECTION
      ------------------------------------------------------------- */}
      <section id="about" className="px-4 sm:px-6 lg:px-8 py-14 sm:py-16 bg-[#F8FAFC] border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            <h2 className="text-xs font-mono font-semibold tracking-wider text-[#2463FF] uppercase">
              Product Overview
            </h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight" style={{ textWrap: 'balance' }}>
              About ResolveIQ
            </h3>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
              ResolveIQ is an AI-powered IT Incident Management System engineered to bring speed, clarity, and precision to technical operations.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              ResolveIQ helps organizations report incidents effortlessly, manage support requests through structured ticket lifecycles, assign qualified engineers based on workload, troubleshoot issues with instant Groq AI diagnostics, and track resolutions with complete audit transparency.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-white border border-slate-200/80 rounded-xl space-y-1.5 shadow-xs">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                  <Shield className="w-4 h-4 text-[#2463FF]" />
                  <span>Row Level Security</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Database-enforced PostgreSQL isolation revoking direct anonymous and unauthorized queries.
                </p>
              </div>

              <div className="p-4 bg-white border border-slate-200/80 rounded-xl space-y-1.5 shadow-xs">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                  <Lock className="w-4 h-4 text-[#8B5CF6]" />
                  <span>BCrypt & Cryptographic Hashes</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Passwords and single-use reset tokens are hashed with BCrypt and SHA-256 before storage.
                </p>
              </div>
            </div>

            {/* "See More" Button with Arrow Icon */}
            <div className="pt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={onGoToAbout}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#2463FF] hover:bg-[#1D51D8] rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all cursor-pointer group"
              >
                <span>See More</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                type="button"
                onClick={onRegister}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <span>Get Started</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xl shadow-slate-200/60 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="text-xs font-mono text-slate-500 font-semibold uppercase tracking-wider">Stack Architecture</span>
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Verified Production
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Backend API</span>
                  <span className="text-slate-900 font-semibold font-mono">Node.js Express + TypeScript</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Primary Database</span>
                  <span className="text-slate-900 font-semibold font-mono">Supabase PostgreSQL 15+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Frontend Client</span>
                  <span className="text-slate-900 font-semibold font-mono">React 19 + Tailwind CSS</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Intelligence Engine</span>
                  <span className="text-slate-900 font-semibold font-mono">Groq Llama-3 & Gemini</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Authentication</span>
                  <span className="text-slate-900 font-semibold font-mono">Custom JWT + Server RBAC</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onGoToAbout}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#2463FF] hover:bg-[#1D51D8] shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Read Full Project & Developer Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          BOTTOM CALL TO ACTION
      ------------------------------------------------------------- */}
      <section className="px-4 sm:px-6 lg:px-8 py-14 sm:py-16 bg-gradient-to-b from-[#F8FAFC] to-[#EEF3FC] border-t border-slate-200/80 text-center relative overflow-hidden">
        {/* Ambient subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-blue-400/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5 relative z-10">
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Ready to streamline your IT incident resolution?
          </h3>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Get started today with structured ticketing, real-time engineer collaboration, and AI-assisted troubleshooting.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={onRegister}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#2463FF] hover:bg-[#1D51D8] rounded-xl shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 transition-all cursor-pointer"
            >
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onLogin}
              className="px-6 py-3 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Sign In to Existing Portal
            </button>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          SHARED PROFESSIONAL FOOTER
      ------------------------------------------------------------- */}
      <PublicFooter
        onNavigateHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onNavigateFeatures={() => scrollToSection('features')}
        onNavigateAbout={onGoToAbout || (() => scrollToSection('about'))}
        onNavigateContact={onGoToContact || (() => {})}
        onLogin={onLogin}
        onRegister={onRegister}
      />
    </div>
  );
};
