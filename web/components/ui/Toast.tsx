/**
 * Toast Notification Component - DUAL THEME
 * 
 * Works with useToast hook to display notifications
 * Place this component at the root of your app
 */

"use client"

import React, { useEffect, useState, useCallback } from 'react';
import { Toast as ToastType } from '@/hooks/useToast';

interface ToastProps {
  toast: ToastType;
  onClose: (id: string) => void;
}

const ToastComponent: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    const timer = setTimeout(() => onClose(toast.id), 200);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  // Auto-dismiss timer - only handle duration-based dismissal here
  useEffect(() => {
    // Don't auto-dismiss if duration is 0 or Infinity
    if (!toast.duration || toast.duration <= 0 || toast.duration === Infinity) {
      return;
    }
    
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(toast.id), 200);
    }, toast.duration);
    
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const variants = {
    success: {
      bg: 'bg-success/10 dark:bg-success/20',
      border: 'border-success/30 dark:border-success/40',
      icon: 'bg-success text-white',
      text: 'text-foreground',
      progress: 'bg-success',
    },
    error: {
      bg: 'bg-error/10 dark:bg-error/20',
      border: 'border-error/30 dark:border-error/40',
      icon: 'bg-error text-white',
      text: 'text-foreground',
      progress: 'bg-error',
    },
    warning: {
      bg: 'bg-warning/10 dark:bg-warning/20',
      border: 'border-warning/30 dark:border-warning/40',
      icon: 'bg-warning text-white',
      text: 'text-foreground',
      progress: 'bg-warning',
    },
    info: {
      bg: 'bg-info/10 dark:bg-info/20',
      border: 'border-info/30 dark:border-info/40',
      icon: 'bg-info text-white',
      text: 'text-foreground',
      progress: 'bg-info',
    },
  };

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const style = variants[toast.type];

  return (
    <div
      className={`
        relative overflow-hidden flex items-start p-4 mb-3 rounded-xl border
        shadow-neumorphic dark:shadow-glow-sm backdrop-blur-sm
        ${style.bg} ${style.border}
        ${isExiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}
      `}
      role="alert"
    >
      {/* Icon */}
      <div className={`flex-shrink-0 p-2 rounded-lg mr-3 ${style.icon}`}>
        {icons[toast.type]}
      </div>
      
      {/* Content */}
      <div className="flex-grow min-w-0">
        <p className={`font-semibold text-sm ${style.text}`}>{toast.title}</p>
        {toast.message && (
          <p className="text-sm mt-1 text-muted line-clamp-2">{toast.message}</p>
        )}
      </div>
      
      {/* Close button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 ml-3 p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface-secondary dark:hover:bg-white/10 transition-all cursor-pointer"
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Progress bar */}
      {toast.duration !== Infinity && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-border/20 dark:bg-white/10">
          <div 
            className={`h-full ${style.progress} animate-shrink-x`}
            style={{ animationDuration: `${toast.duration || 5000}ms` }}
          />
        </div>
      )}
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastType[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-20 right-4 z-50 max-w-md w-full pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      <div className="pointer-events-auto">
        {toasts.map((toast) => (
          <ToastComponent key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </div>
    </div>
  );
};
