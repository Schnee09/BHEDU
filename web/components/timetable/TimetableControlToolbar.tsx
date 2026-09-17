'use client';

import React from 'react';
import {
  User,
  Users,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Clock,
  ListFilter,
  Grid as GridIcon,
  Calendar,
  Search,
  Printer,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PrimaryTab, DisplayLayout } from '@/lib/timetable/useTimetableState';
import { CAMPUSES } from '@/lib/timetable/constants';
import { ClassOption, TeacherOption } from '@/lib/timetable/types';

interface TimetableControlToolbarProps {
  activeTab: PrimaryTab;
  setActiveTab: (tab: PrimaryTab) => void;
  displayLayout: DisplayLayout | 'dispatch';
  onLayoutChange: (layout: DisplayLayout | 'dispatch') => void;
  currentWeek: Date;
  setCurrentWeek: (date: Date) => void;
  weekDates: Date[];
  selectedCampus: string;
  setSelectedCampus: (campus: string) => void;
  selectedClass: string;
  setSelectedClass: (classId: string) => void;
  selectedTeacher: string;
  setSelectedTeacher: (teacherId: string) => void;
  classes: ClassOption[];
  teachers: TeacherOption[];
  isAdmin: boolean;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  onPrint?: () => void;
  statusFilter?: string;
  setStatusFilter?: (status: string) => void;
  /** When 'tutoring', hides tab bar and irrelevant filters */
  mode?: 'default' | 'tutoring';
  showDispatchOption?: boolean;
}

export default function TimetableControlToolbar({
  activeTab,
  setActiveTab,
  displayLayout,
  onLayoutChange,
  currentWeek,
  setCurrentWeek,
  weekDates,
  selectedCampus,
  setSelectedCampus,
  selectedClass,
  setSelectedClass,
  selectedTeacher,
  setSelectedTeacher,
  classes,
  teachers,
  searchQuery,
  setSearchQuery,
  onPrint,
  statusFilter,
  setStatusFilter,
  mode = 'default',
  showDispatchOption = false,
}: TimetableControlToolbarProps) {
  const handlePrevWeek = () => {
    const prev = new Date(currentWeek);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeek(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeek);
    next.setDate(next.getDate() + 7);
    setCurrentWeek(next);
  };

  const handleJumpToToday = () => {
    setCurrentWeek(new Date());
  };

  const startDateStr =
    weekDates[0]?.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) || '';
  const endDateStr =
    weekDates[6]?.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }) || '';

  return (
    <div className="space-y-3 mb-6">
      {/* Tier 1: Segmented View Tabs (Hidden in dedicated Tutoring page) */}
      {mode !== 'tutoring' && (
        <div className="flex bg-stone-200/60 dark:bg-stone-800/80 p-1.5 rounded-[24px] border border-stone-200/70 dark:border-white/5 overflow-x-auto no-scrollbar gap-1.5 shadow-inner">
          <button
            onClick={() => setActiveTab('room')}
            className={cn(
              'px-4 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-2 shrink-0 press-effect',
              activeTab === 'room'
                ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-md scale-[1.02]'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            )}
          >
            <GridIcon className="w-3.5 h-3.5" /> Lưới Tuần / Theo Phòng
          </button>

          <button
            onClick={() => setActiveTab('class')}
            className={cn(
              'px-4 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-2 shrink-0 press-effect',
              activeTab === 'class'
                ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-md scale-[1.02]'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            )}
          >
            <Users className="w-3.5 h-3.5" /> Theo Lớp Học
          </button>

          <button
            onClick={() => setActiveTab('teacher')}
            className={cn(
              'px-4 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-2 shrink-0 press-effect',
              activeTab === 'teacher'
                ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-md scale-[1.02]'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            )}
          >
            <GraduationCap className="w-3.5 h-3.5" /> Theo Giáo Viên
          </button>

          <button
            onClick={() => setActiveTab('personal')}
            className={cn(
              'px-4 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-2 shrink-0 press-effect ml-auto',
              activeTab === 'personal'
                ? 'bg-white dark:bg-stone-900 text-blue-600 dark:text-blue-400 shadow-md scale-[1.02]'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            )}
          >
            <User className="w-3.5 h-3.5" /> Lịch Cá Nhân
          </button>
        </div>
      )}

      {/* Tier 2: Structured 2-Row Unified Control Bar */}
      <div className="bg-white dark:bg-stone-900 p-3 sm:p-3.5 rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-xs space-y-2.5">
        {/* Row 1: Week Navigation (Left) & View Mode Switcher (Right) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Left: Week Nav Buttons & Jump to Today */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Week Nav Buttons */}
            <div className="flex items-center bg-stone-50 dark:bg-stone-800 p-0.5 rounded-xl border border-stone-200/60 dark:border-white/5">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="p-1.5 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-all cursor-pointer"
                title="Tuần trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-2.5 py-1 text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-1.5 whitespace-nowrap">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {startDateStr} - {endDateStr}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextWeek}
                className="p-1.5 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-all cursor-pointer"
                title="Tuần kế tiếp"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Jump to Today Button */}
            <button
              type="button"
              onClick={handleJumpToToday}
              className="h-9 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 border border-amber-200/60 dark:border-amber-800/40 cursor-pointer shrink-0"
              title="Quay lại tuần hiện tại"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Hôm nay
            </button>
          </div>

          {/* Right: Layout Display Mode Selector (Dispatch / Grid / Timeline / Agenda) */}
          <div className="flex items-center bg-stone-50 dark:bg-stone-800 p-0.5 rounded-xl border border-stone-200/60 dark:border-white/5 shrink-0 overflow-x-auto no-scrollbar">
            {showDispatchOption && (
              <button
                type="button"
                onClick={() => onLayoutChange('dispatch')}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0',
                  displayLayout === 'dispatch'
                    ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                )}
                title="Bàn điều phối ghép lớp (Matchmaker)"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Điều phối</span>
              </button>
            )}

            {!showDispatchOption && (
              <button
                type="button"
                onClick={() => onLayoutChange('grid')}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0',
                  displayLayout === 'grid'
                    ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                )}
                title="Chế độ Lưới tuần"
              >
                <GridIcon className="w-3.5 h-3.5" />
                <span>Lưới</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onLayoutChange('timeline')}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0',
                displayLayout === 'timeline'
                  ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
              )}
              title="Chế độ Dòng thời gian"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Dòng t.gian</span>
            </button>

            <button
              type="button"
              onClick={() => onLayoutChange('agenda')}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0',
                displayLayout === 'agenda'
                  ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
              )}
              title="Chế độ Danh sách ca"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Danh sách</span>
            </button>
          </div>
        </div>

        {/* Row 2: Filters & Contextual Selectors (Left) + Search & Print (Right) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-stone-100 dark:border-white/5">
          {/* Left: Contextual Selectors & Status Filter */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Contextual Campus Selector (Room view) */}
            {activeTab === 'room' && mode !== 'tutoring' && (
              <div className="flex bg-stone-50 dark:bg-stone-800 p-0.5 rounded-xl border border-stone-200/50 dark:border-white/5">
                {CAMPUSES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCampus(c.id)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                      selectedCampus === c.id
                        ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-xs'
                        : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {/* Contextual Class Selector */}
            {activeTab === 'class' && mode !== 'tutoring' && (
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="h-9 px-3 bg-stone-50 dark:bg-stone-800 border border-stone-200/80 dark:border-white/10 rounded-xl text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100 outline-none cursor-pointer"
              >
                <option value="">-- Chọn lớp học --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            {/* Contextual Teacher Selector */}
            {activeTab === 'teacher' && mode !== 'tutoring' && (
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="h-9 px-3 bg-stone-50 dark:bg-stone-800 border border-stone-200/80 dark:border-white/10 rounded-xl text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100 outline-none cursor-pointer"
              >
                <option value="">👨‍🏫 Chọn giáo viên --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name}
                  </option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            {setStatusFilter && (
              <select
                value={statusFilter || ''}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 bg-stone-50 dark:bg-stone-800 border border-stone-200/80 dark:border-white/10 rounded-xl text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100 outline-none cursor-pointer"
              >
                <option value="">🎯 Tất cả trạng thái</option>
                <option value="scheduled">🟡 Đã xếp</option>
                <option value="completed">🟢 Hoàn thành</option>
                <option value="cancelled">🔴 Hủy ca</option>
                <option value="makeup">🔵 Học bù</option>
              </select>
            )}
          </div>

          {/* Right: Search & Action Buttons (Strictly grouped, never wrapping alone) */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0">
            {/* Smart Search Bar */}
            {setSearchQuery && (
              <div className="relative flex items-center flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 absolute left-3 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={
                    mode === 'tutoring'
                      ? 'Tìm lớp, gia sư, học sinh...'
                      : 'Tìm lớp, giáo viên, phòng...'
                  }
                  value={searchQuery || ''}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-8 pr-3 bg-stone-50 dark:bg-stone-800 border border-stone-200/80 dark:border-white/10 rounded-xl text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100 outline-none w-full sm:w-48 md:w-56 focus:sm:w-64 focus:ring-2 focus:ring-amber-500/30 transition-all placeholder:text-stone-400"
                />
              </div>
            )}

            {/* Quick Print Schedule Button */}
            {onPrint && (
              <button
                type="button"
                onClick={onPrint}
                className="h-9 px-3 rounded-xl border border-stone-200/80 dark:border-white/10 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 hover:text-amber-600 dark:hover:text-amber-400 transition-all flex items-center gap-1.5 text-xs sm:text-sm font-semibold cursor-pointer shrink-0"
                title="In lịch tuần chuẩn A4"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">In lịch</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
