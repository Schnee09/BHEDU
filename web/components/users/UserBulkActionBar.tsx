'use client';

import React from 'react';
import { UserCheck, UserX, Download, Trash2, X, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserBulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkActivate: () => void;
  onBulkDeactivate: () => void;
  onBulkExport: () => void;
  onBulkDelete: () => void;
  loading?: boolean;
}

export function UserBulkActionBar({
  selectedCount,
  onClearSelection,
  onBulkActivate,
  onBulkDeactivate,
  onBulkExport,
  onBulkDelete,
  loading,
}: UserBulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-200 max-w-[95vw] sm:max-w-2xl w-auto">
      <div className="flex items-center justify-between gap-3 px-5 py-2.5 rounded-full bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl text-stone-900 dark:text-stone-100 border border-stone-200/90 dark:border-stone-800 shadow-2xl ring-1 ring-stone-900/5 dark:ring-white/10">
        {/* Left: Count */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
            {selectedCount}
          </div>
          <span className="font-bold text-xs text-stone-700 dark:text-stone-200 hidden sm:inline whitespace-nowrap">
            Đã chọn <strong className="text-amber-600 dark:text-amber-400">{selectedCount}</strong>{' '}
            người dùng
          </span>
        </div>

        <div className="h-4 w-px bg-stone-200 dark:bg-stone-700/60 shrink-0 hidden sm:block" />

        {/* Middle: Actions */}
        <div className="flex items-center gap-1.5 flex-nowrap justify-end flex-1">
          <button
            onClick={onBulkActivate}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kích hoạt</span>
          </button>

          <button
            onClick={onBulkDeactivate}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            <UserX className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Khóa</span>
          </button>

          <button
            onClick={onBulkExport}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>

          <button
            onClick={onBulkDelete}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer whitespace-nowrap shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Xóa</span>
          </button>

          <div className="h-4 w-px bg-stone-200 dark:bg-stone-700/60 shrink-0" />

          {/* Clear button */}
          <button
            onClick={onClearSelection}
            title="Hủy chọn tất cả"
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ml-0.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
