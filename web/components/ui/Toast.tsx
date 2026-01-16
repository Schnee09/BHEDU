/**
 * Toast Notification Component - PREMIUM UI
 * 
 * Works with useToast hook to display notifications
 * Place this component at the root of your app
 * 
 * Features:
 * - Spring bounce entrance animation
 * - Animated icons (checkmark draw, shake, pulse)
 * - Gradient progress bar
 * - Optional action button
 * - Stacking with reflow
 */

"use client"

import React, { useEffect, useState, useCallback } from 'react';
import { Toast as ToastType } from '@/hooks/useToast';

interface ToastProps {
  toast: ToastType;
  onClose: (id: string) => void;
}

// Animated icons for each toast type
const SuccessIcon = () => (
  <div className="animate-check-scale">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        className="animate-check-draw"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M5 13l4 4L19 7"
        strokeDasharray="24"
        strokeDashoffset="0"
      />
    </svg>
  </div>
);

const ErrorIcon = () => (
  <div className="animate-shake">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </div>
);

const WarningIcon = () => (
  <div className="animate-warning-pulse">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  </div>
);

const InfoIcon = () => (
  <div className="animate-info-bounce">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </div>
);

const ToastComponent: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    const timer = setTimeout(() => onClose(toast.id), 250);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  // Auto-dismiss timer
  useEffect(() => {
    if (!toast.duration || toast.duration <= 0 || toast.duration === Infinity) {
      return;
    }

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(toast.id), 250);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const variants = {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-200 dark:border-emerald-800/60',
      icon: 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25',
      text: 'text-emerald-900 dark:text-emerald-100',
      subtext: 'text-emerald-700 dark:text-emerald-300',
      progress: 'toast-progress-success',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-950/40',
      border: 'border-red-200 dark:border-red-800/60',
      icon: 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25',
      text: 'text-red-900 dark:text-red-100',
      subtext: 'text-red-700 dark:text-red-300',
      progress: 'toast-progress-error',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-800/60',
      icon: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25',
      text: 'text-amber-900 dark:text-amber-100',
      subtext: 'text-amber-700 dark:text-amber-300',
      progress: 'toast-progress-warning',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      border: 'border-blue-200 dark:border-blue-800/60',
      icon: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25',
      text: 'text-blue-900 dark:text-blue-100',
      subtext: 'text-blue-700 dark:text-blue-300',
      progress: 'toast-progress-info',
    },
  };

  const icons = {
    success: <SuccessIcon />,
    error: <ErrorIcon />,
    warning: <WarningIcon />,
    info: <InfoIcon />,
  };

  const style = variants[toast.type];

  return (
    <div
      className={`
        relative overflow-hidden flex items-start gap-3 p-4 mb-3 rounded-2xl border
        shadow-lg backdrop-blur-sm
        ${style.bg} ${style.border}
        ${isExiting ? 'animate-toast-exit' : 'animate-toast-enter'}
        dark:shadow-xl dark:shadow-black/20
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Animated Icon */}
      <div className={`flex-shrink-0 p-2.5 rounded-xl ${style.icon}`}>
        {icons[toast.type]}
      </div>

      {/* Content */}
      <div className="flex-grow min-w-0 py-0.5">
        <p className={`font-semibold text-sm leading-tight ${style.text}`}>
          {toast.title}
        </p>
        {toast.message && (
          <p className={`text-sm mt-1 leading-snug ${style.subtext} line-clamp-2`}>
            {toast.message}
          </p>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className={`
          flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 cursor-pointer
          ${style.subtext} hover:bg-black/5 dark:hover:bg-white/10
          hover:scale-110 active:scale-95
        `}
        aria-label="Đóng thông báo"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Gradient Progress bar */}
      {toast.duration && toast.duration !== Infinity && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/10 overflow-hidden rounded-b-2xl">
          <div
            className={`h-full ${style.progress} animate-progress-shrink rounded-full`}
            style={{ animationDuration: `${toast.duration}ms` }}
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
      className="fixed top-20 right-4 z-50 w-full max-w-sm pointer-events-none"
      aria-live="polite"
      aria-label="Thông báo"
    >
      <div className="pointer-events-auto space-y-2">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              // Slight scale reduction for stacked toasts
              transform: index > 0 ? `scale(${1 - index * 0.02})` : undefined,
              opacity: index > 2 ? 0.7 : 1
            }}
          >
            <ToastComponent toast={toast} onClose={onClose} />
          </div>
        ))}
      </div>
    </div>
  );
};
