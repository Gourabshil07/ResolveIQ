import React, { useState } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';

export type PublicNavActiveTab = 'home' | 'features' | 'about' | 'contact';

interface PublicNavbarProps {
  activeTab?: PublicNavActiveTab;
  onNavigateHome: () => void;
  onNavigateFeatures: () => void;
  onNavigateAbout: () => void;
  onNavigateContact: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  activeTab = 'home',
  onNavigateHome,
  onNavigateFeatures,
  onNavigateAbout,
  onNavigateContact,
  onLogin,
  onRegister,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (action: () => void) => {
    setMobileMenuOpen(false);
    action();
  };

  return (
    <header className="h-[68px] px-6 lg:px-12 flex items-center justify-between border-b border-[#E2E8F0] bg-[#FFFFFF] sticky top-0 z-50 transition-colors">
      {/* Zone 1: Brand Wordmark on Left */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-3 cursor-pointer group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2463FF] rounded-lg p-0.5"
          aria-label="ResolveIQ Home"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2463FF] to-[#4F46E5] flex items-center justify-center font-bold text-white text-lg shadow-sm transition-transform group-hover:scale-105">
            R
          </div>
          <span className="font-bold text-xl tracking-tight text-[#111A35] whitespace-nowrap">
            ResolveIQ
          </span>
        </button>
      </div>

      {/* Zone 2: Navigation Links in Center (Desktop) */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
        <button
          type="button"
          onClick={onNavigateHome}
          className={`cursor-pointer transition-colors relative py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2463FF] rounded ${
            activeTab === 'home'
              ? 'text-[#2463FF] font-semibold'
              : 'text-[#475569] hover:text-[#111A35]'
          }`}
        >
          <span>Home</span>
          {activeTab === 'home' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2463FF] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={onNavigateFeatures}
          className={`cursor-pointer transition-colors relative py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2463FF] rounded ${
            activeTab === 'features'
              ? 'text-[#2463FF] font-semibold'
              : 'text-[#475569] hover:text-[#111A35]'
          }`}
        >
          <span>Features</span>
          {activeTab === 'features' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2463FF] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={onNavigateAbout}
          className={`cursor-pointer transition-colors relative py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2463FF] rounded ${
            activeTab === 'about'
              ? 'text-[#2463FF] font-semibold'
              : 'text-[#475569] hover:text-[#111A35]'
          }`}
        >
          <span>About</span>
          {activeTab === 'about' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2463FF] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={onNavigateContact}
          className={`cursor-pointer transition-colors relative py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2463FF] rounded ${
            activeTab === 'contact'
              ? 'text-[#2463FF] font-semibold'
              : 'text-[#475569] hover:text-[#111A35]'
          }`}
        >
          <span>Contact</span>
          {activeTab === 'contact' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2463FF] rounded-full" />
          )}
        </button>
      </nav>

      {/* Zone 3: Authentication Buttons on Right (Desktop) */}
      <div className="hidden md:flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onLogin}
          className="px-4 py-2 text-xs sm:text-sm font-semibold text-[#111A35] bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-slate-300 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2463FF]"
        >
          Sign In
        </button>

        <button
          type="button"
          onClick={onRegister}
          className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#2463FF] hover:bg-[#1D51D8] rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2463FF]"
        >
          Get Started
        </button>
      </div>

      {/* Mobile Menu Button */}
      <div className="flex md:hidden items-center gap-2">
        <button
          type="button"
          onClick={onRegister}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2463FF] hover:bg-[#1D51D8] rounded-lg shadow-xs transition-all cursor-pointer"
        >
          Get Started
        </button>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Panel */}
      {mobileMenuOpen && (
        <div className="absolute top-[68px] left-0 right-0 bg-[#FFFFFF] border-b border-[#E2E8F0] px-6 py-5 shadow-xl md:hidden z-50 flex flex-col gap-3.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            type="button"
            onClick={() => handleLinkClick(onNavigateHome)}
            className={`text-left text-sm py-2 px-3 rounded-lg transition-colors font-medium ${
              activeTab === 'home'
                ? 'bg-blue-50 text-[#2463FF] font-semibold'
                : 'text-[#475569] hover:bg-slate-50'
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick(onNavigateFeatures)}
            className={`text-left text-sm py-2 px-3 rounded-lg transition-colors font-medium ${
              activeTab === 'features'
                ? 'bg-blue-50 text-[#2463FF] font-semibold'
                : 'text-[#475569] hover:bg-slate-50'
            }`}
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick(onNavigateAbout)}
            className={`text-left text-sm py-2 px-3 rounded-lg transition-colors font-medium ${
              activeTab === 'about'
                ? 'bg-blue-50 text-[#2463FF] font-semibold'
                : 'text-[#475569] hover:bg-slate-50'
            }`}
          >
            About
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick(onNavigateContact)}
            className={`text-left text-sm py-2 px-3 rounded-lg transition-colors font-medium ${
              activeTab === 'contact'
                ? 'bg-blue-50 text-[#2463FF] font-semibold'
                : 'text-[#475569] hover:bg-slate-50'
            }`}
          >
            Contact
          </button>

          <div className="pt-3 border-t border-[#E2E8F0] flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleLinkClick(onLogin)}
              className="w-full py-2.5 px-4 text-xs font-semibold text-[#111A35] bg-white border border-[#E2E8F0] rounded-xl text-center shadow-xs"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick(onRegister)}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#2463FF] rounded-xl text-center shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
