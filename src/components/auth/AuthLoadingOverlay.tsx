import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck } from 'lucide-react';

export interface AuthLoadingOverlayProps {
  isVisible: boolean;
  type?: 'LOGIN' | 'SIGNUP' | 'ADMIN_LOGIN';
  title?: string;
  subtitle?: string;
}

export const AuthLoadingOverlay: React.FC<AuthLoadingOverlayProps> = ({
  isVisible,
  type = 'LOGIN',
  title,
  subtitle,
}) => {
  // Device breakpoint detection for Tablet screen sizes (640px <= width < 1024px)
  const [isTabletDevice, setIsTabletDevice] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 640 && window.innerWidth < 1024;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsTabletDevice(window.innerWidth >= 640 && window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent background scrolling, wheel, touchmove, and keydown scroll actions when loading overlay is active (disabled on tablet)
  useEffect(() => {
    if (!isVisible || isTabletDevice) return;

    // Capture initial inline styles to ensure pristine restoration
    const savedBodyOverflow = document.body.style.overflow;
    const savedBodyTouchAction = document.body.style.touchAction;
    const savedBodyPaddingRight = document.body.style.paddingRight;
    const savedHtmlOverflow = document.documentElement.style.overflow;
    const savedHtmlTouchAction = document.documentElement.style.touchAction;

    // Compensate for scrollbar shift on desktop
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Apply strict overflow and touch locking on both html and body
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.touchAction = 'none';

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Prevent touchmove elastic scrolling on mobile devices
    const preventScrollTouch = (e: TouchEvent) => {
      e.preventDefault();
    };

    // Prevent mouse wheel scrolling
    const preventScrollWheel = (e: WheelEvent) => {
      e.preventDefault();
    };

    // Prevent arrow/space/page navigation keys from scrolling background
    const preventScrollKeys = (e: KeyboardEvent) => {
      const scrollKeys = [
        'Space',
        'PageUp',
        'PageDown',
        'End',
        'Home',
        'ArrowLeft',
        'ArrowUp',
        'ArrowRight',
        'ArrowDown',
        ' ',
      ];
      if (scrollKeys.includes(e.key) || scrollKeys.includes(e.code)) {
        e.preventDefault();
      }
    };

    window.addEventListener('touchmove', preventScrollTouch, { passive: false });
    window.addEventListener('wheel', preventScrollWheel, { passive: false });
    window.addEventListener('keydown', preventScrollKeys, { passive: false });

    // Cleanup: restore exact original inline styles and remove event listeners
    return () => {
      document.body.style.overflow = savedBodyOverflow;
      document.body.style.touchAction = savedBodyTouchAction;
      document.body.style.paddingRight = savedBodyPaddingRight;
      document.documentElement.style.overflow = savedHtmlOverflow;
      document.documentElement.style.touchAction = savedHtmlTouchAction;

      window.removeEventListener('touchmove', preventScrollTouch);
      window.removeEventListener('wheel', preventScrollWheel);
      window.removeEventListener('keydown', preventScrollKeys);
    };
  }, [isVisible, isTabletDevice]);

  // Disable custom loading screen overlay on tablet devices (640px <= width < 1024px)
  if (!isVisible || isTabletDevice) return null;

  // Determine title and subtitle based on operation type if not explicitly passed
  let displayTitle = title;
  let displaySubtitle = subtitle;

  if (!displayTitle) {
    if (type === 'SIGNUP') {
      displayTitle = 'Creating your account...';
    } else if (type === 'ADMIN_LOGIN') {
      displayTitle = 'Verifying administrator credentials...';
    } else {
      displayTitle = 'Authenticating...';
    }
  }

  if (!displaySubtitle) {
    if (type === 'SIGNUP') {
      displaySubtitle = 'Setting up your workspace...';
    } else if (type === 'ADMIN_LOGIN') {
      displaySubtitle = 'Securely verifying your credentials';
    } else {
      displaySubtitle = 'Securely verifying your credentials';
    }
  }

  const overlayContent = (
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[99999] w-screen h-screen h-[100dvh] min-h-screen min-w-full flex sm:hidden lg:flex items-center justify-center p-4 sm:p-5 lg:p-6 bg-slate-900/50 backdrop-blur-md transition-all duration-300 animate-fadeIn touch-none overscroll-none select-none overflow-hidden"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={displayTitle}
      onWheel={(e) => e.preventDefault()}
      onTouchMove={(e) => e.preventDefault()}
    >
      {/* Soft Ambient Background Glow */}
      <div className="absolute w-[320px] sm:w-[420px] h-[320px] sm:h-[420px] bg-gradient-to-tr from-[#2463FF]/25 to-indigo-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Main Glass Loading Card */}
      <div
        className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/80 dark:border-slate-800/80 shadow-2xl shadow-blue-950/20 rounded-3xl p-6 sm:px-6 sm:py-5 lg:p-9 w-full max-w-[360px] sm:w-[min(460px,calc(100vw-36px))] lg:w-full lg:max-w-[390px] max-h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-32px)] lg:max-h-[calc(100dvh-48px)] mx-auto text-center flex flex-col items-center overflow-hidden animate-scaleUp shrink-0 sm:-translate-y-8 lg:translate-y-0"
      >
        {/* Subtle Top Blue/Purple Gradient Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2463FF] via-indigo-500 to-[#2463FF] animate-pulse" />

        {/* Logo & Circular Animated Spinner Container */}
        <div className="relative my-2 sm:my-1.5 lg:my-3 flex items-center justify-center shrink-0">
          {/* Subtle Outer Pulsing Aura */}
          <div className="absolute w-22 h-22 sm:w-20 sm:h-20 lg:w-26 lg:h-26 rounded-full bg-blue-500/10 dark:bg-blue-400/10 animate-ping pointer-events-none" />

          {/* Smooth Animated Circular Progress Indicator */}
          <div className="w-20 h-20 sm:w-18 sm:h-18 lg:w-24 lg:h-24 rounded-full border-[3px] border-blue-100 dark:border-slate-800 border-t-[#2463FF] border-r-[#2463FF] animate-spin flex items-center justify-center shadow-xs" />

          {/* Centered ResolveIQ Logo Box */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 sm:w-11 sm:h-11 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-tr from-[#2463FF] via-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl sm:text-lg lg:text-2xl shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-transform">
              R
            </div>
          </div>
        </div>

        {/* Brand Name */}
        <div className="mt-2 sm:mt-1.5 lg:mt-2.5 mb-1 flex items-center justify-center gap-1.5 shrink-0">
          <span className="font-extrabold text-xl sm:text-xl lg:text-2xl tracking-tight text-[#111A35] dark:text-white leading-none">
            ResolveIQ
          </span>
        </div>

        {/* Typography & Status Headings */}
        <div className="space-y-1 sm:space-y-0.5 lg:space-y-1 mt-1 sm:mt-0.5 lg:mt-1.5 mb-3 sm:mb-2.5 lg:mb-4 shrink-0">
          <h3 className="text-base sm:text-base lg:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
            {displayTitle}
          </h3>
          <p className="text-xs sm:text-xs lg:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-[260px] sm:max-w-[300px] lg:max-w-[260px] mx-auto leading-relaxed">
            {displaySubtitle}
          </p>
        </div>

        {/* Subtle Animated Progress Pulse Dots */}
        <div className="flex items-center justify-center gap-1.5 py-0.5 mb-2.5 sm:mb-2 lg:mb-3.5 shrink-0">
          <div className="w-2 h-2 rounded-full bg-[#2463FF] animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 rounded-full bg-[#2463FF] animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
        </div>

        {/* Security Trust Badge Footer */}
        <div className="pt-2 sm:pt-2 lg:pt-3 border-t border-slate-100 dark:border-slate-800/80 w-full flex items-center justify-center gap-1.5 text-[10px] sm:text-[10px] lg:text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2463FF] shrink-0" />
          <span>SECURE AUTHENTICATION · ENCRYPTED CONNECTION</span>
        </div>
      </div>
    </div>
  );

  // Render overlay via React Portal into document.body to ensure perfect viewport centering
  if (typeof document !== 'undefined' && document.body) {
    return createPortal(overlayContent, document.body);
  }

  return overlayContent;
};
