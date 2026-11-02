import React from 'react';
import {
  ArrowUpRight,
  Github,
  Linkedin,
  Globe,
  Shield,
  Mail,
  Instagram,
  Facebook,
} from 'lucide-react';

interface PublicFooterProps {
  onNavigateHome: () => void;
  onNavigateFeatures: () => void;
  onNavigateAbout: () => void;
  onNavigateContact: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({
  onNavigateHome,
  onNavigateFeatures,
  onNavigateAbout,
  onNavigateContact,
  onLogin,
  onRegister,
}) => {
  // Six social and professional communication links
  const socialLinks = [
    {
      name: 'Email',
      icon: Mail,
      url: 'mailto:gourabshil07@gmail.com',
      tooltip: 'Send Email (gourabshil07@gmail.com)',
      hoverStyle: 'hover:text-[#2463FF] hover:border-blue-300 hover:bg-blue-50/80',
    },
    {
      name: 'GitHub',
      icon: Github,
      url: 'https://github.com/Gourabshil07',
      tooltip: 'GitHub Profile (Gourabshil07)',
      hoverStyle: 'hover:text-slate-900 hover:border-slate-400 hover:bg-slate-100',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: 'https://www.linkedin.com/in/gourab-shil-137004255/',
      tooltip: 'LinkedIn Profile (Gourab Shil)',
      hoverStyle: 'hover:text-[#0A66C2] hover:border-blue-300 hover:bg-blue-50/80',
    },
    {
      name: 'Portfolio',
      icon: Globe,
      url: 'https://gourabshil.vercel.app',
      tooltip: 'Portfolio Website (gourabshil.vercel.app)',
      hoverStyle: 'hover:text-[#8B5CF6] hover:border-purple-300 hover:bg-purple-50/80',
    },
    {
      name: 'Instagram',
      icon: Instagram,
      url: 'https://www.instagram.com/gourabshil07/?hl=en',
      tooltip: 'Instagram (@gourabshil07)',
      hoverStyle: 'hover:text-[#E4405F] hover:border-pink-300 hover:bg-pink-50/80',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: 'https://www.facebook.com/gourab.shil.728076',
      tooltip: 'Facebook (Gourab Shil)',
      hoverStyle: 'hover:text-[#1877F2] hover:border-blue-300 hover:bg-blue-50/80',
    },
  ];

  return (
    <footer className="bg-white border-t border-[#E2E8F0] text-xs text-[#64748B]">
      {/* Upper Footer: Brand, Navigation, Access & Connect Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 lg:py-12">
        {/* Main Grid: Responsive 1 column (mobile), 12 columns (tablet/desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Section: Brand, Product Description, Security & 3x2 Social Grid */}
          <div className="md:col-span-6 lg:col-span-5 space-y-4">
            {/* Logo & Brand Title */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2463FF] to-[#4F46E5] flex items-center justify-center font-bold text-white text-lg shadow-2xs">
                R
              </div>
              <span className="font-bold text-xl text-[#111A35] tracking-tight">ResolveIQ</span>
            </div>

            {/* Short Product Description */}
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed max-w-md">
              The intelligent IT incident management platform engineered for modern operations, rapid triage, AI-assisted diagnostics, and seamless engineer collaboration.
            </p>

            {/* Enterprise Security Badge */}
            <div className="flex items-center gap-2 text-xs text-[#111A35] font-medium pt-0.5">
              <Shield className="w-4 h-4 text-[#2463FF] shrink-0" />
              <span>Enterprise Security &amp; RBAC Information</span>
            </div>

            {/* 3x2 Compact Social Icon Grid */}
            <div className="pt-2 space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#64748B] block">
                Connect on Social Channels
              </span>
              <div className="grid grid-cols-3 gap-2.5 w-fit">
                {socialLinks.map((item) => {
                  const Icon = item.icon;
                  const isMail = item.url.startsWith('mailto:');
                  return (
                    <a
                      key={item.name}
                      href={item.url}
                      target={isMail ? '_self' : '_blank'}
                      rel={isMail ? undefined : 'noopener noreferrer'}
                      title={item.tooltip}
                      aria-label={item.name}
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-center text-slate-600 shadow-2xs transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#2463FF]/30 cursor-pointer ${item.hoverStyle}`}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Section / Links Container (Navigation, Access, Connect) */}
          <div className="md:col-span-6 lg:col-span-7">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 items-start">
              
              {/* Navigation Column */}
              <div className="space-y-3">
                <h4 className="font-bold text-[#111A35] text-xs uppercase tracking-wider border-b border-[#E2E8F0] pb-2">
                  Navigation
                </h4>
                <ul className="space-y-2.5">
                  <li>
                    <button
                      type="button"
                      onClick={onNavigateHome}
                      className="text-[#475569] hover:text-[#2463FF] transition-colors cursor-pointer text-left font-medium block"
                    >
                      Home
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={onNavigateFeatures}
                      className="text-[#475569] hover:text-[#2463FF] transition-colors cursor-pointer text-left font-medium block"
                    >
                      Features
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={onNavigateAbout}
                      className="text-[#475569] hover:text-[#2463FF] transition-colors cursor-pointer text-left font-medium block"
                    >
                      About
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={onNavigateContact}
                      className="text-[#475569] hover:text-[#2463FF] transition-colors cursor-pointer text-left font-medium block"
                    >
                      Contact
                    </button>
                  </li>
                </ul>
              </div>

              {/* Access Column */}
              <div className="space-y-3">
                <h4 className="font-bold text-[#111A35] text-xs uppercase tracking-wider border-b border-[#E2E8F0] pb-2">
                  Access
                </h4>
                <ul className="space-y-2.5">
                  <li>
                    <button
                      type="button"
                      onClick={onLogin}
                      className="text-[#475569] hover:text-[#2463FF] transition-colors cursor-pointer text-left font-medium block"
                    >
                      Sign In
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={onRegister}
                      className="text-[#475569] hover:text-[#2463FF] transition-colors cursor-pointer text-left font-medium block"
                    >
                      Create Account
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={onLogin}
                      className="text-[#475569] hover:text-[#2463FF] transition-colors cursor-pointer text-left font-medium block"
                    >
                      Admin Console
                    </button>
                  </li>
                </ul>
              </div>

              {/* Connect Column */}
              <div className="space-y-3 col-span-2 sm:col-span-1">
                <h4 className="font-bold text-[#111A35] text-xs uppercase tracking-wider border-b border-[#E2E8F0] pb-2">
                  Connect
                </h4>
                <ul className="space-y-2.5">
                  {socialLinks.map((item) => {
                    const isMail = item.url.startsWith('mailto:');
                    return (
                      <li key={item.name}>
                        <a
                          href={item.url}
                          target={isMail ? '_self' : '_blank'}
                          rel={isMail ? undefined : 'noopener noreferrer'}
                          className="text-[#475569] hover:text-[#2463FF] transition-colors font-medium inline-flex items-center gap-1.5 group"
                        >
                          <span>{item.name}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#2463FF] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar: Copyright & Product Identity Line */}
      <div className="border-t border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left text-[11px] sm:text-xs text-[#64748B]">
          <p className="font-medium text-[#111A35]">
            &copy; 2026 ResolveIQ. All rights reserved.
          </p>
          <p className="text-slate-500 font-normal">
            Built for smarter IT operations.
          </p>
        </div>
      </div>
    </footer>
  );
};
