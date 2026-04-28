'use client';

import React from 'react';
import { FunnelIcon, Squares2X2Icon, TableCellsIcon } from '@heroicons/react/24/outline';
import { Select } from '@/components/ui/select';

interface ClassOption {
  id: string;
  name: string;
}

interface AttendanceFiltersProps {
  classes: ClassOption[];
  selectedClass: string;
  setSelectedClass: (id: string) => void;
  dateRange: string;
  setDateRange: (range: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  viewMode: 'overview' | 'details';
  setViewMode: (mode: 'overview' | 'details') => void;
  t: (key: string) => string;
}

export function AttendanceFilters({
  classes,
  selectedClass,
  setSelectedClass,
  dateRange,
  setDateRange,
  statusFilter,
  setStatusFilter,
  viewMode,
  setViewMode,
  t,
}: AttendanceFiltersProps) {
  return (
    <div className="glass-premium rounded-[32px] border border-white/20 p-8 shadow-xl animate-fade-in delay-100">
      <div className="flex items-center gap-2 mb-6">
        <FunnelIcon className="w-5 h-5 text-emerald-500" />
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-stone-400">
          {t('common.filter')}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-stone-500 ml-1">
            {t('students.class')}
          </label>
          <Select
            value={selectedClass}
            onChange={(e: any) => setSelectedClass(e.target.value)}
            className="rounded-2xl border-stone-200 bg-white/50 h-12 font-bold uppercase tracking-tight"
          >
            <option value="">{t('analytics.allClasses')}</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-stone-500 ml-1">
            {t('attendance.report.custom')}
          </label>
          <Select
            value={dateRange}
            onChange={(e: any) => setDateRange(e.target.value)}
            className="rounded-2xl border-stone-200 bg-white/50 h-12 font-bold uppercase tracking-tight"
          >
            <option value="today">{t('attendance.today')}</option>
            <option value="week">{t('attendance.report.last7Days')}</option>
            <option value="month">{t('attendance.report.last30Days')}</option>
            <option value="term">{t('attendance.report.last3Months')}</option>
            <option value="custom">{t('attendance.report.custom')}</option>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-stone-500 ml-1">
            {t('common.status')}
          </label>
          <Select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="rounded-2xl border-stone-200 bg-white/50 h-12 font-bold uppercase tracking-tight"
          >
            <option value="">{t('common.all')}</option>
            <option value="present">{t('attendance.present')}</option>
            <option value="absent">{t('attendance.absent')}</option>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-stone-500 ml-1">
            {t('attendance.report.viewMode')}
          </label>
          <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200 shadow-inner h-12 items-center">
            <button
              onClick={() => setViewMode('overview')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'overview' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
            >
              <Squares2X2Icon className="w-4 h-4" />
              {t('attendance.report.overview')}
            </button>
            <button
              onClick={() => setViewMode('details')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'details' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
            >
              <TableCellsIcon className="w-4 h-4" />
              {t('attendance.report.details')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
