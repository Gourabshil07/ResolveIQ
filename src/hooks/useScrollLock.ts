import { useEffect } from 'react';

/**
 * Global reference counter and style cache for reliable modal scroll locking.
 * Supports multiple nested/stacked modals without premature unlocking.
 */
let lockCount = 0;
let originalBodyOverflow = '';
let originalHtmlOverflow = '';
let originalBodyPaddingRight = '';

export function lockBodyScroll() {
  if (typeof document === 'undefined') return;

  if (lockCount === 0) {
    // Preserve any pre-existing styles
    originalBodyOverflow = document.body.style.overflow;
    originalHtmlOverflow = document.documentElement.style.overflow;
    originalBodyPaddingRight = document.body.style.paddingRight;

    // Calculate vertical scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Lock both html and body
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // Prevent content jump when scrollbar disappears
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  lockCount++;
}

export function unlockBodyScroll() {
  if (typeof document === 'undefined') return;

  lockCount = Math.max(0, lockCount - 1);

  if (lockCount === 0) {
    // Restore pre-existing html overflow
    if (originalHtmlOverflow) {
      document.documentElement.style.overflow = originalHtmlOverflow;
    } else {
      document.documentElement.style.removeProperty('overflow');
    }

    // Restore pre-existing body overflow
    if (originalBodyOverflow) {
      document.body.style.overflow = originalBodyOverflow;
    } else {
      document.body.style.removeProperty('overflow');
    }

    // Restore pre-existing paddingRight
    if (originalBodyPaddingRight) {
      document.body.style.paddingRight = originalBodyPaddingRight;
    } else {
      document.body.style.removeProperty('padding-right');
    }
  }
}

/**
 * Custom React hook that locks background scrolling when `isLocked` is true
 * and reliably restores previous scrolling behavior on cleanup / close / unmount.
 */
export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    lockBodyScroll();

    return () => {
      unlockBodyScroll();
    };
  }, [isLocked]);
}
