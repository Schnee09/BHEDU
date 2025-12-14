/**
 * useToast Hook - Toast notification management
 * 
 * Provides consistent toast/alert notifications across the app
 * Better than using window.alert()
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface UseToastResult {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

/**
 * Custom hook for toast notifications
 * 
 * @example
 * const toast = useToast();
 * 
 * // Show success toast
 * toast.success('User created', 'John Doe has been added to the system');
 * 
 * // Show error toast
 * toast.error('Failed to save', 'Please try again later');
 * 
 * // Custom toast
 * toast.showToast({
 *   type: 'warning',
 *   title: 'Warning',
 *   message: 'This action cannot be undone',
 *   duration: 5000
 * });
 */
export function useToast(): UseToastResult {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Remove toast directly without dependency on other callbacks
  const removeToast = useCallback((id: string) => {
    // Clear timeout if it exists
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Clean up all timeouts on unmount
  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  // showToast now uses setToasts directly instead of calling removeToast
  const showToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const duration = toast.duration || 5000;
      
      const newToast: Toast = {
        ...toast,
        id,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto-remove after duration
      if (duration > 0) {
        const timeout = setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
          timeoutsRef.current.delete(id);
        }, duration);
        
        timeoutsRef.current.set(id, timeout);
      }
    },
    []
  );

  const success = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'success', title, message });
    },
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'error', title, message });
    },
    [showToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'warning', title, message });
    },
    [showToast]
  );

  const info = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'info', title, message });
    },
    [showToast]
  );

  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current.clear();
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    success,
    error,
    warning,
    info,
    removeToast,
    clearAll,
  };
}
