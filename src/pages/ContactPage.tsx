import React, { useState, useEffect } from 'react';
import {
  Send,
  Mail,
  CheckCircle2,
  Clock,
  Shield,
  Github,
  Linkedin,
  Globe,
  Instagram,
  Facebook,
  Sparkles,
  AlertCircle,
  X,
  Check,
  Copy,
} from 'lucide-react';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import { api } from '../services/api';

interface ContactPageProps {
  onBackToHome: () => void;
  onNavigateFeatures: () => void;
  onNavigateAbout: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export const ContactPage: React.FC<ContactPageProps> = ({
  onBackToHome,
  onNavigateFeatures,
  onNavigateAbout,
  onLogin,
  onRegister,
}) => {
  const [formData, setFormData] = useState<FormState>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<{
    name: string;
    email: string;
    subject: string;
  } | null>(null);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSuccessModal) {
        setShowSuccessModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSuccessModal]);

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText('gourabshil07@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid work or personal email address';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 3) {
      newErrors.subject = 'Subject must be at least 3 characters';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.submitContactMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });

      if (response && response.success) {
        setLastSubmitted({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
        });
        setShowSuccessModal(true);
        // Only clear the form when confirmed successful
        setFormData({ name: '', email: '', subject: '', message: '' });
        setErrors({});
      } else {
        throw new Error(response?.message || 'Failed to dispatch contact inquiry');
      }
    } catch (err: any) {
      // Form inputs are preserved on failure
      const errorMsg =
        typeof err === 'string'
          ? err
          : err?.message || 'Unable to deliver your message at this time. Please check your inputs or connect directly.';
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Six modern social and communication channels
  const socialChannels = [
    {
      id: 'email',
      name: 'Email',
      icon: Mail,
      url: 'mailto:gourabshil07@gmail.com',
      tooltip: 'Send Email (gourabshil07@gmail.com)',
      hoverStyle: 'hover:text-[#2463FF] hover:border-blue-300 hover:bg-blue-50/70',
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: Github,
      url: 'https://github.com/Gourabshil07',
      tooltip: 'GitHub Profile (Gourabshil07)',
      hoverStyle: 'hover:text-slate-900 hover:border-slate-400 hover:bg-slate-100',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      url: 'https://www.linkedin.com/in/gourab-shil-137004255/',
      tooltip: 'LinkedIn Profile (Gourab Shil)',
      hoverStyle: 'hover:text-[#0A66C2] hover:border-blue-400 hover:bg-blue-50/70',
    },
    {
      id: 'portfolio',
      name: 'Portfolio',
      icon: Globe,
      url: 'https://gourabshil.vercel.app',
      tooltip: 'Portfolio Website (gourabshil.vercel.app)',
      hoverStyle: 'hover:text-[#8B5CF6] hover:border-purple-300 hover:bg-purple-50/70',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      url: 'https://www.instagram.com/gourabshil07/?hl=en',
      tooltip: 'Instagram (@gourabshil07)',
      hoverStyle: 'hover:text-[#E4405F] hover:border-pink-300 hover:bg-pink-50/70',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      url: 'https://www.facebook.com/gourab.shil.728076',
      tooltip: 'Facebook (Gourab Shil)',
      hoverStyle: 'hover:text-[#1877F2] hover:border-blue-300 hover:bg-blue-50/70',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FF] text-[#111A35] flex flex-col selection:bg-[#2463FF] selection:text-white">
      {/* -------------------------------------------------------------
          TOP BAR NAVIGATION (Identical Across Pages)
      ------------------------------------------------------------- */}
      <PublicNavbar
        activeTab="contact"
        onNavigateHome={onBackToHome}
        onNavigateFeatures={onNavigateFeatures}
        onNavigateAbout={onNavigateAbout}
        onNavigateContact={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onLogin={onLogin}
        onRegister={onRegister}
      />

      {/* -------------------------------------------------------------
          COMPACT HERO / HEADER SECTION
      ------------------------------------------------------------- */}
      {/* -------------------------------------------------------------
          COMPACT HERO / HEADER SECTION
      ------------------------------------------------------------- */}
      <header className="relative px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 border-b border-[#E2E8F0] bg-gradient-to-b from-white via-white/90 to-[#F4F7FF]">
        <div className="max-w-3xl mx-auto text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#2463FF] text-[11px] font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>Direct Support &amp; Collaboration</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111A35] tracking-tight">
            Let&apos;s{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2463FF] to-[#8B5CF6]">
              Talk
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-[#64748B] max-w-lg mx-auto leading-relaxed">
            Have questions about ResolveIQ, deployment workflows, or want to discuss technical features? Reach out directly.
          </p>
        </div>
      </header>

      {/* -------------------------------------------------------------
          TWO-COLUMN MAIN SECTION (COMPACT & BALANCED FOR TABLET & DESKTOP)
      ------------------------------------------------------------- */}
      <main className="flex-1 max-w-5xl lg:max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="grid grid-cols-1 min-[900px]:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left Column: Contact Information & Modern Icon Buttons (5 cols) */}
          <div className="min-[900px]:col-span-5 space-y-4">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-[#111A35] tracking-tight">
                Get in Touch
              </h2>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Connect directly through our official channels or leave a message on the right.
              </p>
            </div>

            {/* Direct Email Display with Copy & Action */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-2xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#2463FF] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[#64748B] block">
                    Direct Email
                  </span>
                  <a
                    href="mailto:gourabshil07@gmail.com"
                    className="text-xs sm:text-sm font-semibold text-[#111A35] hover:text-[#2463FF] transition-colors truncate block"
                  >
                    gourabshil07@gmail.com
                  </a>
                </div>
              </div>

              <button
                type="button"
                onClick={copyEmailToClipboard}
                className="p-2 rounded-lg text-slate-400 hover:text-[#2463FF] hover:bg-blue-50 transition-colors shrink-0 cursor-pointer"
                title={copiedEmail ? 'Copied to clipboard!' : 'Copy email'}
                aria-label="Copy email address"
              >
                {copiedEmail ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Six Compact Icon-Only Buttons (~44-48px size, 20px icons) */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#64748B] block">
                Connect on Social &amp; Professional Channels
              </span>

              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                {socialChannels.map((channel) => {
                  const Icon = channel.icon;
                  const isMailto = channel.url.startsWith('mailto:');
                  return (
                    <a
                      key={channel.id}
                      href={channel.url}
                      target={isMailto ? '_self' : '_blank'}
                      rel={isMailto ? undefined : 'noopener noreferrer'}
                      title={channel.tooltip}
                      aria-label={channel.name}
                      className={`w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-center text-slate-600 hover:-translate-y-0.5 hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-[#2463FF]/30 active:scale-95 transition-all duration-150 cursor-pointer ${channel.hoverStyle}`}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Response Commitment Card */}
            <div className="bg-white/90 border border-[#E2E8F0] rounded-xl p-3.5 flex items-start gap-2.5 text-[11px] sm:text-xs text-[#64748B] shadow-2xs">
              <Clock className="w-4 h-4 text-[#2463FF] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Messages are directly received and typically answered within <strong>24 business hours</strong>.
              </p>
            </div>
          </div>

          {/* Right Column: Send Me a Message Form (7 cols - Compact & Balanced) */}
          <div className="min-[900px]:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 lg:p-7 shadow-xs">
            <div className="border-b border-[#E2E8F0] pb-3 mb-4">
              <h2 className="text-base sm:text-lg font-bold text-[#111A35] tracking-tight">
                Send Me a Message
              </h2>
              <p className="text-[11px] sm:text-xs text-[#64748B] mt-0.5">
                Fill in the details below and I&apos;ll get back to you promptly.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              {/* Preserved Form Alert on Error */}
              {submitError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div className="space-y-0.5">
                    <p className="font-semibold">Unable to dispatch message</p>
                    <p className="text-[11px] text-rose-600 leading-relaxed">{submitError}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div className="space-y-1">
                  <label
                    htmlFor="contact-name"
                    className="block text-[11px] font-semibold text-[#111A35]"
                  >
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: undefined });
                    }}
                    placeholder="e.g. Alex Henderson"
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-white border rounded-xl shadow-2xs transition-all focus:outline-none focus:ring-2 ${
                      errors.name
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                        : 'border-[#E2E8F0] focus:border-[#2463FF] focus:ring-blue-100'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-[10px] text-rose-600 font-medium">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label
                    htmlFor="contact-email"
                    className="block text-[11px] font-semibold text-[#111A35]"
                  >
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    placeholder="name@company.com"
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-white border rounded-xl shadow-2xs transition-all focus:outline-none focus:ring-2 ${
                      errors.email
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                        : 'border-[#E2E8F0] focus:border-[#2463FF] focus:ring-blue-100'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-[10px] text-rose-600 font-medium">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <label
                  htmlFor="contact-subject"
                  className="block text-[11px] font-semibold text-[#111A35]"
                >
                  Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  value={formData.subject}
                  onChange={(e) => {
                    setFormData({ ...formData, subject: e.target.value });
                    if (errors.subject) setErrors({ ...errors, subject: undefined });
                  }}
                  placeholder="e.g. Enterprise deployment or technical inquiry"
                  disabled={isSubmitting}
                  className={`w-full px-3 py-2 text-xs sm:text-sm bg-white border rounded-xl shadow-2xs transition-all focus:outline-none focus:ring-2 ${
                    errors.subject
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-[#E2E8F0] focus:border-[#2463FF] focus:ring-blue-100'
                  }`}
                />
                {errors.subject && (
                  <p className="text-[10px] text-rose-600 font-medium">
                    {errors.subject}
                  </p>
                )}
              </div>

              {/* Message (Compact Textarea) */}
              <div className="space-y-1">
                <label
                  htmlFor="contact-message"
                  className="block text-[11px] font-semibold text-[#111A35]"
                >
                  Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="contact-message"
                  rows={3}
                  value={formData.message}
                  onChange={(e) => {
                    setFormData({ ...formData, message: e.target.value });
                    if (errors.message) setErrors({ ...errors, message: undefined });
                  }}
                  placeholder="Describe your inquiry, organizational requirements, or questions..."
                  disabled={isSubmitting}
                  className={`w-full px-3 py-2 text-xs sm:text-sm bg-white border rounded-xl shadow-2xs transition-all focus:outline-none focus:ring-2 resize-none ${
                    errors.message
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-[#E2E8F0] focus:border-[#2463FF] focus:ring-blue-100'
                  }`}
                />
                {errors.message && (
                  <p className="text-[10px] text-rose-600 font-medium">
                    {errors.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#2463FF] hover:bg-[#1D51D8] disabled:opacity-60 rounded-xl shadow-xs hover:shadow transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* -------------------------------------------------------------
          PREMIUM SUCCESS POPUP MODAL (Triggers Only On Confirmed Success)
      ------------------------------------------------------------- */}
      {showSuccessModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowSuccessModal(false)}
        >
          <div
            className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 max-w-sm w-full shadow-2xl relative text-center space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close 'X' Button */}
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Green Circular Success Icon */}
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            {/* Heading and Description */}
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-[#111A35] tracking-tight">
                Message Sent Successfully!
              </h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                Message sent successfully! Thank you for contacting us. I'll get back to you soon.
              </p>
            </div>

            {/* Summary preview */}
            {lastSubmitted && (
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-left text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span>From:</span>
                  <span className="font-medium text-[#111A35] truncate max-w-[180px]">
                    {lastSubmitted.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Subject:</span>
                  <span className="font-medium text-[#111A35] truncate max-w-[180px]">
                    {lastSubmitted.subject}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/80">
                  <span>Status:</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                    <Check className="w-3 h-3" /> Delivered
                  </span>
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#2463FF] hover:bg-[#1D51D8] rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          SHARED FOOTER ACROSS ALL PAGES
      ------------------------------------------------------------- */}
      <PublicFooter
        onNavigateHome={onBackToHome}
        onNavigateFeatures={onNavigateFeatures}
        onNavigateAbout={onNavigateAbout}
        onNavigateContact={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onLogin={onLogin}
        onRegister={onRegister}
      />
    </div>
  );
};
