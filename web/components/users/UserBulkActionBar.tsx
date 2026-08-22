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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-200 max-w-[95vw] sm:max-w-2xl w-full">
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-stone-900 dark:bg-[#1C1A16] text-white border-2 border-stone-700 dark:border-stone-700 shadow-2xl">
        {/* Left: Count */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-xs">
            {selectedCount}
          </div>
          <span className="font-bold text-xs text-stone-200 hidden sm:inline">
            Đã chọn <strong className="text-amber-400">{selectedCount}</strong> người dùng
          </span>
        </div>

        {/* Middle: Actions */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end flex-1">
          <button
            onClick={onBulkActivate}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Kích hoạt</span>
          </button>

          <button
            onClick={onBulkDeactivate}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <UserX className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Khóa</span>
          </button>

          <button
            onClick={onBulkExport}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Xuất Excel</span>
          </button>

          <button
            onClick={onBulkDelete}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Xóa</span>
          </button>

          {/* Clear button */}
          <button
            onClick={onClearSelection}
            title="Hủy chọn tất cả"
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
