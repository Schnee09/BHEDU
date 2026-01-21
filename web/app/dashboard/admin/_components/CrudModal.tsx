'use client';

import React, { ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface CrudModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  children: ReactNode;
  submitLabel?: string;
  submitVariant?: 'primary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function CrudModal({
  isOpen,
  title,
  onClose,
  onSubmit,
  loading = false,
  children,
  submitLabel = 'Save',
  submitVariant = 'primary',
  size = 'md',
}: CrudModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`bg-white dark:bg-[#1A1410] rounded-xl shadow-xl ${sizeClasses[size]} w-full mx-4 max-h-[95dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {children}

          {/* Footer */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-stone-800 mt-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-3 sm:py-2 border border-gray-300 dark:border-stone-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-3 sm:py-2 rounded-lg text-white font-medium disabled:opacity-50 transition-all active:scale-[0.98] ${
                submitVariant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
