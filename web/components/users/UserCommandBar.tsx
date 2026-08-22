'use client';

import React from 'react';
import {
  Search,
  X,
  Filter,
  UserPlus,
  FileSpreadsheet,
  Download,
  RotateCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserCommandBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: string;
  onActiveFilterChange: (status: string) => void;
  onOpenCreateModal: () => void;
  onOpenImportModal: () => void;
  onExport: () => void;
  onRefresh: () => void;
  loading?: boolean;
}

export function UserCommandBar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onActiveFilterChange,
  onOpenCreateModal,
  onOpenImportModal,
  onExport,
  onRefresh,
  loading,
}: UserCommandBarProps) {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#14120E] border border-stone-200 dark:border-stone-800 shadow-sm">
      {/* Left: Search input + Status filter */}
      <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên, email, SĐT, mã định danh..."
            className="w-full h-10 pl-10 pr-9 rounded-xl bg-stone-100 dark:bg-[#1C1A16] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status filter dropdown */}
        <div className="relative min-w-[170px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
          <select
            value={activeFilter}
            onChange={(e) => onActiveFilterChange(e.target.value)}
            className="w-full h-10 pl-9 pr-8 rounded-xl bg-stone-100 dark:bg-[#1C1A16] border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 appearance-none cursor-pointer transition-all"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã vô hiệu hóa</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-stone-400 w-0 h-0" />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
        <button
          onClick={onRefresh}
          disabled={loading}
          title="Tải lại danh sách"
          className="h-10 w-10 rounded-xl bg-stone-100 dark:bg-[#1C1A16] hover:bg-stone-200 dark:hover:bg-[#25221D] text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
        >
          <RotateCw className={cn('w-4 h-4', loading && 'animate-spin text-amber-500')} />
        </button>

        <button
          onClick={onExport}
          className="h-10 px-3.5 rounded-xl bg-stone-100 dark:bg-[#1C1A16] hover:bg-stone-200 dark:hover:bg-[#25221D] text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-stone-500" />
          <span>Xuất CSV</span>
        </button>

        <button
          onClick={onOpenImportModal}
          className="h-10 px-3.5 rounded-xl bg-stone-100 dark:bg-[#1C1A16] hover:bg-stone-200 dark:hover:bg-[#25221D] text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
          <span>Nhập Excel</span>
        </button>

        <button
          onClick={onOpenCreateModal}
          className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm người dùng</span>
        </button>
      </div>
    </div>
  );
}
