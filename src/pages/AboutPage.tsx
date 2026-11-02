import React, { useState } from 'react';
import {
  ArrowRight,
  Shield,
  Bot,
  CheckCircle2,
  Users,
  Activity,
  Layers,
  Sparkles,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Clock,
  Check,
  TrendingUp,
  FileText,
  Search,
  Workflow,
  Sparkle,
  Mail,
} from 'lucide-react';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';

interface AboutPageProps {
  onBackToHome: () => void;
  onNavigateFeatures: () => void;
  onNavigateContact: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  onBackToHome,
  onNavigateFeatures,
  onNavigateContact,
  onLogin,
  onRegister,
}) => {
  const [activeTimelineStep, setActiveTimelineStep] = useState<number>(1);

  const timelineSteps = [
    {
      id: 1,
      name: 'Report',
      title: 'Structured Incident Ingestion',
      actor: 'IT User / Employee',
      summary: 'Users report issues with standardized categorization, urgency matrix, and diagnostic attachments.',
      detail: 'Eliminates ambiguous problem reports. Tickets are generated with unique tracking numbers, strict categorization (Hardware, Network, Software, Server), and initial system details.',
      metric: '< 45s creation time',
    },
    {
      id: 2,
      name: 'Assign',
      title: 'Intelligent Workload Routing',
      actor: 'IT Admin / Engineer',
      summary: 'Administrators assign based on engineer capacity, or engineers claim relevant tickets directly.',
      detail: 'Avoids ticket deadlocks and delays. Dual-routing model provides admins complete team workload visibility while allowing support engineers to claim urgent incidents directly into their active workspace.',
      metric: 'Zero unassigned delays',
    },
    {
      id: 3,
      name: 'Diagnose',
      title: 'Groq-Powered AI Diagnostics',
      actor: 'AI Engine + Support Specialist',
      summary: 'High-speed Groq inference analyzes error symptoms to recommend root causes and verified remedies.',
      detail: 'Empowers engineers with instant technical insights. Generates probable causes, shell mitigation commands, and step-by-step verification checklists in sub-second inference speed.',
      metric: 'Sub-second AI analysis',
    },
    {
      id: 4,
      name: 'Resolve',
      title: 'Real-Time Collaboration & Fix',
      actor: 'Support Engineer',
      summary: 'Engineer applies the remediation, exchanges live status messages with the user, and records internal notes.',
      detail: 'Full transparency between reporter and resolver. Dedicated incident chat, handover notes between shifts, and timestamped progress logs maintain an auditable single source of truth.',
      metric: '65% faster MTTR',
    },
    {
      id: 5,
      name: 'Complete',
      title: 'Resolution Sign-off & Quality Feedback',
      actor: 'IT User & IT Leadership',
      summary: 'Ticket is marked resolved with complete resolution documentation and user satisfaction rating.',
      detail: 'Closes the loop with verifiable outcomes. Users rate the resolution experience (1-5 stars with feedback), feeding operational metrics into leadership dashboards for continuous service enhancement.',
      metric: '100% auditable history',
    },
  ];

  const currentStepData = timelineSteps.find((s) => s.id === activeTimelineStep) || timelineSteps[0];

  const scrollToTimeline = () => {
    const el = document.getElementById('timeline-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToFeatures = () => {
    const el = document.getElementById('features-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111A35] flex flex-col selection:bg-[#2463FF] selection:text-white">
      {/* -------------------------------------------------------------
          TOP BAR NAVIGATION (Unified Across Pages)
      ------------------------------------------------------------- */}
      <PublicNavbar
        activeTab="about"
        onNavigateHome={onBackToHome}
        onNavigateFeatures={onNavigateFeatures}
        onNavigateAbout={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onNavigateContact={onNavigateContact}
        onLogin={onLogin}
        onRegister={onRegister}
      />

      {/* -------------------------------------------------------------
          1. HERO SECTION
      ------------------------------------------------------------- */}
      <section className="relative px-4 sm:px-6 lg:px-12 pt-3 sm:pt-4 pb-12 lg:pt-5 lg:pb-16 overflow-hidden bg-gradient-to-b from-white via-[#EEF3FC]/50 to-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#2463FF] text-xs font-semibold mb-3.5 sm:mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation IT Incident Operations</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Heading, Subtitle & Description */}
            <div className="lg:col-span-7 space-y-5">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111A35] tracking-tight leading-[1.12]">
                Meet{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2463FF] via-[#38BDF8] to-[#8B5CF6]">
                  ResolveIQ
                </span>
              </h1>

              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#1E293B] leading-snug">
                The Intelligent IT Incident Management Platform
              </h2>

              <p className="text-sm sm:text-base text-[#475569] leading-relaxed max-w-2xl">
                ResolveIQ is engineered to eliminate operational friction and downtime. By unifying structured ticket ingestion, intelligent engineer routing, sub-second Groq AI diagnostics, and real-time collaboration into one cohesive platform, ResolveIQ transforms chaotic troubleshooting into an accountable, high-speed resolution pipeline.
              </p>

              {/* Two CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={scrollToFeatures}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#2463FF] hover:bg-[#1D51D8] rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  <span>Explore Features</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={scrollToTimeline}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#111A35] bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <span>See How It Works</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#64748B]">
                <span className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Sub-second Groq AI Diagnostics
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Enterprise Role-Based Access
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Complete Incident Audit Trails
                </span>
              </div>
            </div>

            {/* Right Column: Modern 2-Column Dashboard Preview Visual */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xl shadow-slate-200/60 space-y-4">
                {/* Visual Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2463FF] flex items-center justify-center font-bold text-xs">
                      IQ
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#111A35]">Live Incident Console</div>
                      <div className="text-[10px] text-[#64748B]">Automated Triage &amp; Lifecycle</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">
                    Operational
                  </span>
                </div>

                {/* Simulated Real Incident Card */}
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#2463FF]">
                      INC-2026-0842
                    </span>
                    <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                      Critical · Network
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#111A35]">
                      Primary Core Switch Packet Loss &amp; Gateway Timeout
                    </h4>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Reported by Engineering Team · 4 min ago
                    </p>
                  </div>

                  {/* AI Diagnostic Pill */}
                  <div className="p-2.5 bg-purple-50/70 border border-purple-200/80 rounded-lg flex items-start gap-2">
                    <Bot className="w-4 h-4 text-[#8B5CF6] shrink-0 mt-0.5" />
                    <div className="text-[11px] text-slate-700 leading-tight">
                      <span className="font-semibold text-[#8B5CF6]">Groq AI Diagnosis:</span> Probable BGP route flap on edge router. Recommended MTU cache flush.
                    </div>
                  </div>

                  {/* Assignee Strip */}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-[#64748B]">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#2463FF]" />
                      <span>Assigned to: Lead NetOps</span>
                    </span>
                    <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      In Progress
                    </span>
                  </div>
                </div>

                {/* KPI Metrics Strip */}
                <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
                  <div className="p-2.5 bg-[#F8FAFC] border border-slate-100 rounded-xl">
                    <div className="text-xs font-bold text-[#111A35] font-mono">18 min</div>
                    <div className="text-[10px] text-[#64748B]">Avg Resolution</div>
                  </div>
                  <div className="p-2.5 bg-[#F8FAFC] border border-slate-100 rounded-xl">
                    <div className="text-xs font-bold text-[#2463FF] font-mono">&lt; 0.8s</div>
                    <div className="text-[10px] text-[#64748B]">AI Analysis</div>
                  </div>
                  <div className="p-2.5 bg-[#F8FAFC] border border-slate-100 rounded-xl">
                    <div className="text-xs font-bold text-emerald-600 font-mono">99.4%</div>
                    <div className="text-[10px] text-[#64748B]">CSAT Score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          2. PRODUCT FEATURES SHOWCASE (6 Cards in Clean Grid)
      ------------------------------------------------------------- */}
      <section
        id="features-section"
        className="px-4 sm:px-6 lg:px-12 py-16 sm:py-20 bg-white border-b border-[#E2E8F0]"
      >
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-semibold tracking-wider text-[#2463FF] uppercase">
              End-to-End Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#111A35]">
              Engineered for Mission-Critical IT Operations
            </h2>
            <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
              Every feature in ResolveIQ is crafted to accelerate triage, protect system uptime, and empower IT support teams with structured clarity.
            </p>
          </div>

          {/* 6 Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Smart Incident Reporting */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 space-y-3.5 hover:bg-white hover:shadow-md hover:border-blue-200 transition-all">
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-[#2463FF] flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#111A35]">
                Smart Incident Reporting
              </h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Empowers end users to submit standardized tickets with categorized severity levels, detailed technical symptoms, and error logs, ensuring complete context from moment one.
              </p>
            </div>

            {/* 2. Centralized Incident Tracking */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 space-y-3.5 hover:bg-white hover:shadow-md hover:border-blue-200 transition-all">
              <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#111A35]">
                Centralized Incident Tracking
              </h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Provides a unified single pane of glass across Open, In Progress, and Resolved states with live search filters, priority filtering, and automated ticket progression.
              </p>
            </div>

            {/* 3. Intelligent AI Diagnostics */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 space-y-3.5 hover:bg-white hover:shadow-md hover:border-purple-200 transition-all">
              <div className="w-11 h-11 rounded-xl bg-purple-100 text-[#8B5CF6] flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#111A35]">
                Intelligent AI Diagnostics
              </h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Harnesses high-speed Groq AI inference to evaluate incident descriptions, determine probable root causes, and suggest actionable remediation steps in sub-second latency.
              </p>
            </div>

            {/* 4. Engineer Assignment */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 space-y-3.5 hover:bg-white hover:shadow-md hover:border-blue-200 transition-all">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#111A35]">
                Engineer Assignment
              </h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Enables administrators to allocate incidents based on domain expertise and active workload, or permits engineers to self-assign tickets directly into their dedicated workspace.
              </p>
            </div>

            {/* 5. Real-Time Collaboration */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 space-y-3.5 hover:bg-white hover:shadow-md hover:border-blue-200 transition-all">
              <div className="w-11 h-11 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#111A35]">
                Real-Time Collaboration
              </h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Facilitates direct messaging and troubleshooting handover notes between users and assigned engineers, keeping everyone synchronized until the service is restored.
              </p>
            </div>

            {/* 6. Resolution and Feedback */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 space-y-3.5 hover:bg-white hover:shadow-md hover:border-blue-200 transition-all">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#111A35]">
                Resolution and Feedback
              </h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Documents permanent fixes and root-cause summaries while collecting 5-star user satisfaction ratings to continuously evaluate IT service quality and team response performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          3. "FROM INCIDENT TO RESOLUTION" 5-STEP ANIMATED TIMELINE
      ------------------------------------------------------------- */}
      <section
        id="timeline-section"
        className="px-4 sm:px-6 lg:px-12 py-16 sm:py-20 bg-[#F8FAFC] border-b border-[#E2E8F0]"
      >
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-semibold tracking-wider text-[#2463FF] uppercase">
              Operational Lifecycle
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#111A35]">
              From Incident to Resolution in 5 Steps
            </h2>
            <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
              A structured lifecycle designed to eliminate downtime, eliminate miscommunication, and deliver verified resolutions. Click any step to inspect the process.
            </p>
          </div>

          {/* Stepper Tabs (Desktop & Tablet) */}
          <div className="hidden lg:grid grid-cols-5 gap-3">
            {timelineSteps.map((step) => {
              const isActive = step.id === activeTimelineStep;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveTimelineStep(step.id)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-white border-[#2463FF] shadow-md shadow-blue-500/10 ring-1 ring-[#2463FF]'
                      : 'bg-white/70 border-[#E2E8F0] hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center font-mono ${
                        isActive
                          ? 'bg-[#2463FF] text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      0{step.id}
                    </span>
                    <span className="text-[11px] font-semibold text-[#64748B]">
                      Step {step.id}
                    </span>
                  </div>
                  <div
                    className={`text-sm font-bold truncate ${
                      isActive ? 'text-[#2463FF]' : 'text-[#111A35]'
                    }`}
                  >
                    {step.name}
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5 truncate">
                    {step.actor}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Step Showcase Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Details */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-blue-100 text-[#2463FF] flex items-center justify-center font-bold text-sm font-mono">
                    0{currentStepData.id}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-[#2463FF] uppercase tracking-wider">
                      Phase {currentStepData.id}: {currentStepData.name}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#111A35]">
                      {currentStepData.title}
                    </h3>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
                  {currentStepData.detail}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs">
                  <div className="p-3 bg-[#F8FAFC] border border-slate-200/80 rounded-xl">
                    <span className="text-[#64748B] block text-[10px] uppercase font-semibold">
                      Primary Actor
                    </span>
                    <span className="text-[#111A35] font-semibold text-xs sm:text-sm">
                      {currentStepData.actor}
                    </span>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] border border-slate-200/80 rounded-xl">
                    <span className="text-[#64748B] block text-[10px] uppercase font-semibold">
                      Operational Outcome
                    </span>
                    <span className="text-[#2463FF] font-semibold text-xs sm:text-sm">
                      {currentStepData.metric}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Mini-Preview / Interactive Switcher */}
              <div className="lg:col-span-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 space-y-3">
                <span className="text-xs font-semibold text-[#111A35] block">
                  Interactive Step Navigator
                </span>
                <div className="space-y-2">
                  {timelineSteps.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveTimelineStep(s.id)}
                      className={`w-full p-2.5 rounded-xl text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        s.id === activeTimelineStep
                          ? 'bg-[#2463FF] text-white font-semibold shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/70'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[11px] opacity-80">0{s.id}.</span>
                        <span>{s.name}</span>
                      </span>
                      {s.id === activeTimelineStep && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          4. "WHY TEAMS CHOOSE RESOLVEIQ" BENEFITS CARDS
      ------------------------------------------------------------- */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 sm:py-20 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-semibold tracking-wider text-[#2463FF] uppercase">
              Proven Enterprise Impact
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#111A35]">
              Why Teams Choose ResolveIQ
            </h2>
            <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
              Designed from first principles to replace slow email threads and opaque spreadsheets with accountable, automated incident operations.
            </p>
          </div>

          {/* 4 Benefits Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Benefit 1: Centralized Visibility */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 space-y-4 hover:border-blue-200 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2463FF] flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#111A35]">
                  Centralized Visibility
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  Single pane of glass across all department incidents. Eliminates lost support requests and gives engineering leads real-time oversight over active workloads.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/80">
                <div className="text-lg font-extrabold text-[#2463FF] font-mono">100%</div>
                <div className="text-[11px] text-[#64748B]">Ticket Capture &amp; Zero Lost Issues</div>
              </div>
            </div>

            {/* Benefit 2: Faster Troubleshooting */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 space-y-4 hover:border-purple-200 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#8B5CF6] flex items-center justify-center font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#111A35]">
                  Faster Troubleshooting
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  Sub-second Groq AI diagnostics suggest root causes and shell commands immediately, cutting down mean time to detect and mean time to repair.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/80">
                <div className="text-lg font-extrabold text-[#8B5CF6] font-mono">-65%</div>
                <div className="text-[11px] text-[#64748B]">Average Mean Time to Repair (MTTR)</div>
              </div>
            </div>

            {/* Benefit 3: Better Collaboration */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 space-y-4 hover:border-cyan-200 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#111A35]">
                  Better Collaboration
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  Direct incident communication keeps users informed while internal notes enable seamless shift handovers without losing critical troubleshooting context.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/80">
                <div className="text-lg font-extrabold text-cyan-700 font-mono">3x</div>
                <div className="text-[11px] text-[#64748B]">Faster Handover Communication</div>
              </div>
            </div>

            {/* Benefit 4: Improved Accountability */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 space-y-4 hover:border-emerald-200 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#111A35]">
                  Improved Accountability
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  Timestamped audit logs track ticket ownership changes, status transitions, and resolution sign-offs for compliance and service-level agreements.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/80">
                <div className="text-lg font-extrabold text-emerald-600 font-mono">100%</div>
                <div className="text-[11px] text-[#64748B]">Auditable Action History</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          5. MEET THE DEVELOPER SECTION (Product-Oriented, No Portfolio Skills Dump)
      ------------------------------------------------------------- */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 sm:py-20 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Header */}
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold tracking-wider text-[#2463FF] uppercase">
              Creator &amp; Platform Architect
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#111A35]">
              Meet the Developer
            </h2>
            <p className="text-sm sm:text-base text-[#475569] leading-relaxed max-w-xl mx-auto">
              ResolveIQ was envisioned, architected, and engineered by Gourab Shil to address fundamental challenges in enterprise IT support operations.
            </p>
          </div>

          {/* Clean Architect Profile Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
              {/* Profile Photograph Avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-[#2463FF] via-indigo-600 to-[#8B5CF6] p-1 shadow-md">
                  <img
                    src="/assets/aistudio/Gourab_Shil_76a2bc4d.png"
                    alt="Gourab Shil"
                    className="w-full h-full rounded-[14px] object-cover bg-white"
                  />
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-xs"
                  title="Lead Architect"
                >
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Identity & Bio */}
              <div className="space-y-2 flex-1">
                <h3 className="text-2xl font-bold text-[#111A35]">Gourab Shil</h3>
                <p className="text-sm font-semibold text-[#2463FF]">
                  Computer Science and Engineering Graduate &middot; Software Developer
                </p>
                <p className="text-sm text-[#475569] leading-relaxed pt-1">
                  Passionate software developer dedicated to engineering dependable, scalable web platforms and intelligent support tools. Architected ResolveIQ from scratch with high-throughput PostgreSQL schemas, strict role-based access security, and low-latency Groq AI diagnostics to solve real-world operational friction for IT teams.
                </p>
              </div>
            </div>

            {/* Social & Professional Connections */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <a
                href="mailto:gourabshil07@gmail.com"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                <span>gourabshil07@gmail.com</span>
              </a>

              <a
                href="https://github.com/Gourabshil07"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#111A35] bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] hover:border-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                <span>GitHub Profile</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>

              <a
                href="https://www.linkedin.com/in/gourab-shil-137004255/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#2463FF] bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 rounded-xl transition-colors cursor-pointer"
              >
                <span>LinkedIn Profile</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#2463FF]" />
              </a>

              <a
                href="https://gourabshil.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#8B5CF6] bg-purple-50/80 hover:bg-purple-100/80 border border-purple-200 rounded-xl transition-colors cursor-pointer"
              >
                <span>Portfolio Website</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#8B5CF6]" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          6. CONTACT CTA SECTION
      ------------------------------------------------------------- */}
      <section className="px-4 sm:px-6 lg:px-12 py-16 sm:py-20 bg-gradient-to-b from-white to-[#EEF3FC]/50 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#2463FF] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready for Smarter Incident Operations?</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#111A35]">
            Have Questions or Looking to Deploy ResolveIQ?
          </h2>

          <p className="text-sm sm:text-base text-[#475569] leading-relaxed max-w-xl mx-auto">
            Get in touch with us to discuss architectural requirements, organizational workflows, or request a technical walk-through.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={onNavigateContact}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#2463FF] hover:bg-[#1D51D8] rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <span>Get in Touch with Us</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onRegister}
              className="px-6 py-3 text-sm font-semibold text-[#111A35] bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          7. SHARED FOOTER
      ------------------------------------------------------------- */}
      <PublicFooter
        onNavigateHome={onBackToHome}
        onNavigateFeatures={onNavigateFeatures}
        onNavigateAbout={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onNavigateContact={onNavigateContact}
        onLogin={onLogin}
        onRegister={onRegister}
      />
    </div>
  );
};
