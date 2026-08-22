'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Search,
  Printer,
  Plus,
  AlertTriangle,
  LayoutGrid,
  List,
  Building,
  RotateCcw,
  FileSpreadsheet,
  SlidersHorizontal,
  ClipboardCheck,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Badge } from '@/components/ui';
import { TimetableSlot, ClassOption, TeacherOption } from '@/lib/timetable/types';
import { DAYS } from '@/lib/timetable/constants';
import { getSubjectColor } from '@/lib/timetable/subject-colors';
import { getDisplayName } from '@/lib/utils/names';
import MobileTimetableList from './MobileTimetableList';

export type TimetableUnifiedViewMode = 'week' | 'room' | 'agenda';

export interface TimetableSessionConfig {
  id: number;
  label: string;
  time: string;
  start: string;
  end: string;
  days: number[];
}

interface UnifiedTimetableBoardProps {
  slots: TimetableSlot[];
  weekDates: Date[];
  currentWeek: Date;
  onWeekChange: (date: Date) => void;
  sessions?: TimetableSessionConfig[];
  dynamicSchedules?: string[];
  branches?: string[];
  branchRooms?: Record<string, string[]>;
  dynamicRooms?: string[];
  selectedCampus: string;
  onSelectCampus: (campusId: string) => void;
  classes: ClassOption[];
  selectedClass: string;
  onSelectClass: (classId: string) => void;
  teachers: TeacherOption[];
  selectedTeacher: string;
  onSelectTeacher: (teacherId: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  canEdit: boolean;
  onEditSlot: (slot: TimetableSlot) => void;
  onDeleteSlot: (slotId: string) => void;
  onCreateSlot: (dayOfWeek: number, session?: any, room?: string) => void;
  onSelectSlotForAction?: (slot: TimetableSlot) => void;
  onPrint: () => void;
  isLoading?: boolean;
  role?: string | null;
  isAdmin?: boolean;
  isTeacherUser?: boolean;
  onAttendanceClick?: () => void;
}

export default function UnifiedTimetableBoard({
  slots,
  weekDates,
  currentWeek,
  onWeekChange,
  sessions,
  dynamicSchedules = [],
  branches = [],
  branchRooms = {},
  dynamicRooms = [],
  selectedCampus,
  onSelectCampus,
  classes,
  selectedClass,
  onSelectClass,
  teachers,
  selectedTeacher,
  onSelectTeacher,
  searchQuery,
  onSearchQueryChange,
  canEdit,
  onEditSlot,
  onDeleteSlot,
  onCreateSlot,
  onSelectSlotForAction,
  onPrint,
  isLoading = false,
  role,
  isAdmin = false,
  isTeacherUser = false,
  onAttendanceClick,
}: UnifiedTimetableBoardProps) {
  const [viewMode, setViewMode] = useState<TimetableUnifiedViewMode>('week');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedDayForRoomView, setSelectedDayForRoomView] = useState<number>(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1; // 0: T2, 6: CN
  });

  // Calculate today index (0 = T2, ..., 6 = CN)
  const todayIndex = useMemo(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  }, []);

  // ── DYNAMIC REAL SOURCE: SESSIONS / SHIFTS ──
  const effectiveSessions = useMemo<TimetableSessionConfig[]>(() => {
    if (sessions && sessions.length > 0) {
      return sessions;
    }

    const timeSet = new Set<string>();

    // 1. Load from center_schedules setting
    if (Array.isArray(dynamicSchedules) && dynamicSchedules.length > 0) {
      dynamicSchedules.forEach((s) => {
        if (typeof s === 'string' && s.includes('-')) {
          timeSet.add(s.trim());
        }
      });
    }

    // 2. Also load from actual database slots so no custom time slot is omitted
    slots.forEach((slot) => {
      if (slot.start_time && slot.end_time) {
        const start = slot.start_time.substring(0, 5);
        const end = slot.end_time.substring(0, 5);
        if (start && end) {
          timeSet.add(`${start} - ${end}`);
        }
      }
    });

    // 3. Fallback only if no schedules exist at all
    if (timeSet.size === 0) {
      [
        '07:30 - 09:00',
        '09:15 - 10:45',
        '14:00 - 15:30',
        '15:45 - 17:15',
        '17:30 - 19:00',
        '19:15 - 20:45',
      ].forEach((s) => timeSet.add(s));
    }

    // Sort chronologically by start time
    const sorted = Array.from(timeSet).sort((a, b) => {
      const aStart = a.split('-')[0]?.trim() || '';
      const bStart = b.split('-')[0]?.trim() || '';
      return aStart.localeCompare(bStart);
    });

    return sorted.map((timeRange, idx) => {
      const [start = '17:00', end = '18:30'] = timeRange.split('-').map((t) => t.trim());
      return {
        id: idx + 1,
        label: `Ca ${idx + 1}`,
        time: timeRange,
        start,
        end,
        days: [0, 1, 2, 3, 4, 5, 6],
      };
    });
  }, [sessions, dynamicSchedules, slots]);

  // ── DYNAMIC REAL SOURCE: BRANCHES ──
  const effectiveBranches = useMemo<string[]>(() => {
    if (branches && branches.length > 0) {
      return branches;
    }
    if (branchRooms && Object.keys(branchRooms).length > 0) {
      return Object.keys(branchRooms);
    }
    return ['Ngô Quyền', 'Đặng Văn Bi'];
  }, [branches, branchRooms]);

  // ── DYNAMIC REAL SOURCE: ROOMS ──
  const effectiveCampusRooms = useMemo<string[]>(() => {
    // 1. If branchRooms has room list for selectedCampus
    if (selectedCampus && branchRooms && branchRooms[selectedCampus]) {
      const list = branchRooms[selectedCampus];
      if (Array.isArray(list) && list.length > 0) {
        return list.filter((r) => r !== 'Linh hoạt');
      }
    }

    // 2. If dynamicRooms provided from settings
    if (dynamicRooms && dynamicRooms.length > 0) {
      if (selectedCampus) {
        const matching = dynamicRooms
          .filter((r) => r.startsWith(`${selectedCampus} - `))
          .map((r) => r.replace(`${selectedCampus} - `, ''));
        if (matching.length > 0) return matching;
      }
      return dynamicRooms.filter((r) => r !== 'Linh hoạt');
    }

    // 3. From standard defaults and actual slots in database
    const defaultBranchRooms: Record<string, string[]> = {
      'Ngô Quyền': [
        'Ngô Quyền - P.01',
        'Ngô Quyền - P.02',
        'Ngô Quyền - P.03',
        'Ngô Quyền - P.04',
        'Ngô Quyền - P.05',
        'Ngô Quyền - P.06',
      ],
      'Đặng Văn Bi': [
        'Đặng Văn Bi - P.01',
        'Đặng Văn Bi - P.02',
        'Đặng Văn Bi - P.03',
        'Đặng Văn Bi - P.04',
      ],
    };

    const slotRooms = slots
      .map((s) => s.room?.trim())
      .filter((r): r is string => Boolean(r) && r !== 'Linh hoạt');

    if (selectedCampus) {
      const branchDefaults = defaultBranchRooms[selectedCampus] || [];
      const branchSlots = slotRooms
        .filter((r) => r.startsWith(`${selectedCampus} - `))
        .map((r) => r.replace(`${selectedCampus} - `, ''));
      const combined = Array.from(
        new Set([
          ...branchDefaults.map((r) => r.replace(`${selectedCampus} - `, '')),
          ...branchSlots,
        ])
      ).sort();
      if (combined.length > 0) return combined;
    }

    const allDefaults = [
      ...(defaultBranchRooms['Đặng Văn Bi'] || []),
      ...(defaultBranchRooms['Ngô Quyền'] || []),
    ];
    const allCombined = Array.from(new Set([...allDefaults, ...slotRooms])).sort();
    return allCombined;
  }, [selectedCampus, branchRooms, dynamicRooms, slots]);

  // Filter slots based on campus, class, teacher, and search query
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      // Campus filter
      if (selectedCampus && slot.room) {
        if (slot.room.includes(' - ')) {
          const branchPrefix = (slot.room.split(' - ')[0] || '').trim();
          if (branchPrefix.toLowerCase() !== selectedCampus.toLowerCase()) return false;
        }
      }
      // Class filter
      if (selectedClass && slot.class_id !== selectedClass && slot.class?.id !== selectedClass) {
        return false;
      }
      // Teacher filter
      if (
        selectedTeacher &&
        slot.teacher_id !== selectedTeacher &&
        slot.teacher?.id !== selectedTeacher
      ) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const className = (slot.class?.name || '').toLowerCase();
        const subjectName = (slot.subject?.name || '').toLowerCase();
        const teacherName = getDisplayName(slot.teacher).toLowerCase();
        const roomName = (slot.room || '').toLowerCase();
        if (
          !className.includes(query) &&
          !subjectName.includes(query) &&
          !teacherName.includes(query) &&
          !roomName.includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [slots, selectedCampus, selectedClass, selectedTeacher, searchQuery]);

  // Calculate slot counts for each day to show on day tabs
  const daySlotCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    filteredSlots.forEach((slot) => {
      const d = slot.day_of_week;
      if (typeof d === 'number' && d >= 0 && d <= 6) {
        counts[d] = (counts[d] ?? 0) + 1;
      }
    });
    return counts;
  }, [filteredSlots]);

  // Auto-focus the first active day in Room View if current day has no classes
  useEffect(() => {
    const currentCount = daySlotCounts[selectedDayForRoomView] ?? 0;
    if (currentCount === 0) {
      const firstActiveDay = daySlotCounts.findIndex((c) => c > 0);
      if (firstActiveDay !== -1) {
        setSelectedDayForRoomView(firstActiveDay);
      }
    }
  }, [daySlotCounts, selectedDayForRoomView]);

  // Detect conflicts across filtered slots
  const conflictSlotIds = useMemo(() => {
    const conflicts = new Set<string>();
    for (let i = 0; i < filteredSlots.length; i++) {
      for (let j = i + 1; j < filteredSlots.length; j++) {
        const a = filteredSlots[i];
        const b = filteredSlots[j];
        if (!a || !b) continue;

        if (a.day_of_week === b.day_of_week) {
          const aStart = a.start_time || '00:00';
          const aEnd = a.end_time || '23:59';
          const bStart = b.start_time || '00:00';
          const bEnd = b.end_time || '23:59';

          const isTimeOverlap = aStart < bEnd && aEnd > bStart;
          if (isTimeOverlap) {
            // Room conflict
            if (a.room && b.room && a.room === b.room && a.room !== 'Linh hoạt') {
              conflicts.add(a.id);
              conflicts.add(b.id);
            }
            // Teacher conflict
            const aTeacher = a.teacher_id || a.teacher?.id;
            const bTeacher = b.teacher_id || b.teacher?.id;
            if (aTeacher && bTeacher && aTeacher === bTeacher) {
              conflicts.add(a.id);
              conflicts.add(b.id);
            }
          }
        }
      }
    }
    return conflicts;
  }, [filteredSlots]);

  // Week Navigation handlers
  const handlePrevWeek = () => {
    const prev = new Date(currentWeek);
    prev.setDate(prev.getDate() - 7);
    onWeekChange(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeek);
    next.setDate(next.getDate() + 7);
    onWeekChange(next);
  };

  const handleTodayWeek = () => {
    onWeekChange(new Date());
  };

  const getLiveSlotStatus = (dayIndex: number, startTime?: string, endTime?: string) => {
    if (dayIndex !== todayIndex || !startTime || !endTime) return null;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [sH, sM] = (startTime.substring(0, 5) || '').split(':').map(Number);
    const [eH, eM] = (endTime.substring(0, 5) || '').split(':').map(Number);

    if (isNaN(sH!) || isNaN(sM!) || isNaN(eH!) || isNaN(eM!)) return null;

    const startMinutes = sH! * 60 + sM!;
    const endMinutes = eH! * 60 + eM!;

    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      return { status: 'ongoing', label: 'Đang học', color: 'bg-emerald-500 text-white shadow-sm' };
    }
    if (currentMinutes < startMinutes && startMinutes - currentMinutes <= 60) {
      return { status: 'upcoming', label: 'Sắp tới', color: 'bg-amber-500 text-white shadow-sm' };
    }
    if (currentMinutes > endMinutes) {
      return {
        status: 'finished',
        label: 'Đã xong',
        color: 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300',
      };
    }
    return null;
  };

  const handleExportExcel = () => {
    if (!filteredSlots || filteredSlots.length === 0) {
      alert('Không có dữ liệu tiết học để xuất file');
      return;
    }

    const rows = filteredSlots.map((slot) => {
      const dayName = DAYS[slot.day_of_week] || `Thứ ${slot.day_of_week + 2}`;
      const timeRange = `${slot.start_time?.substring(0, 5) || ''} - ${slot.end_time?.substring(0, 5) || ''}`;
      return {
        Thứ: dayName,
        'Khung Giờ': timeRange,
        'Lớp Học': slot.class?.name || 'Chưa gán',
        'Môn Học': slot.subject?.name || 'Chưa gán',
        'Giáo Viên': getDisplayName(slot.teacher) || 'Chưa gán',
        'Phòng Học': slot.room || 'Chưa gán',
        'Ghi Chú': slot.notes || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ThoiKhoaBieu');

    const dateStr = weekDates[0]?.toISOString().split('T')[0] || 'TKB';
    XLSX.writeFile(workbook, `TKB_BHEDU_${dateStr}.xlsx`);
  };

  const hasActiveFilters = Boolean(
    selectedCampus || selectedClass || selectedTeacher || searchQuery
  );

  const handleClearFilters = () => {
    onSelectCampus('');
    onSelectClass('');
    onSelectTeacher('');
    onSearchQueryChange('');
  };

  return (
    <div className="space-y-3">
      {/* ── ULTRA-COMPACT UNIFIED CONTROL HEADER ── */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200/80 dark:border-white/10 p-3 sm:p-4 shadow-sm space-y-2.5">
        {/* Row 1: Title & Main Quick Actions */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Title + Role + Total slots */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-stone-900 dark:text-white uppercase leading-none whitespace-nowrap">
                Thời Khóa Biểu
              </h1>
              {isAdmin ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase whitespace-nowrap hidden sm:inline-block">
                  Quản trị
                </span>
              ) : isTeacherUser ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase whitespace-nowrap hidden sm:inline-block">
                  Giảng dạy
                </span>
              ) : null}
              {slots.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black whitespace-nowrap">
                  {slots.length} tiết
                </span>
              )}
              {isLoading && (
                <span className="text-[10px] font-black text-amber-500 animate-pulse uppercase ml-1 hidden sm:inline-block">
                  ● Đang tải
                </span>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isTeacherUser && onAttendanceClick && (
              <button
                type="button"
                onClick={onAttendanceClick}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-1 shadow-sm cursor-pointer whitespace-nowrap"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Điểm danh</span>
              </button>
            )}

            {canEdit && (
              <button
                type="button"
                onClick={() => onCreateSlot(0, undefined, '')}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-sm flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Xếp lịch</span>
              </button>
            )}

            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                showFilters || hasActiveFilters
                  ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700'
                  : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-white/10 hover:border-amber-400'
              }`}
              title="Tìm kiếm & Bộ lọc"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bộ lọc</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>

            {/* Export & Print */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl text-xs font-black border border-stone-200 dark:border-white/10 flex items-center gap-1 cursor-pointer whitespace-nowrap"
              title="Xuất file Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">Excel</span>
            </button>
            <button
              type="button"
              onClick={onPrint}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl text-xs font-black border border-stone-200 dark:border-white/10 hidden md:flex items-center gap-1 cursor-pointer whitespace-nowrap"
              title="In lịch"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In</span>
            </button>
          </div>
        </div>

        {/* Row 2: Week Nav + View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 dark:border-white/5">
          {/* Week Nav */}
          <div className="flex items-center gap-1 bg-stone-100/80 dark:bg-stone-800/80 p-0.5 rounded-xl border border-stone-200/50 dark:border-white/5 shrink-0">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-1 hover:bg-white dark:hover:bg-stone-700 rounded-lg text-stone-600 dark:text-stone-300 transition-all cursor-pointer shrink-0"
              title="Tuần trước"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] font-black text-stone-800 dark:text-white px-1.5 whitespace-nowrap">
              {weekDates[0]?.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} –{' '}
              {weekDates[6]?.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </span>
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-1 hover:bg-white dark:hover:bg-stone-700 rounded-lg text-stone-600 dark:text-stone-300 transition-all cursor-pointer shrink-0"
              title="Tuần sau"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleTodayWeek}
              className="px-2 py-0.5 bg-white dark:bg-stone-700 hover:bg-amber-500 hover:text-white text-stone-700 dark:text-stone-200 text-[10px] font-black uppercase rounded-lg transition-all shadow-xs cursor-pointer whitespace-nowrap"
            >
              Hôm nay
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-stone-100/80 dark:bg-stone-800/80 p-0.5 rounded-xl border border-stone-200/50 dark:border-white/5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-stone-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <LayoutGrid className="w-3 h-3 shrink-0" />
              <span>Lưới</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('room')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                viewMode === 'room'
                  ? 'bg-white dark:bg-stone-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Building className="w-3 h-3 shrink-0" />
              <span>Phòng</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-stone-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <List className="w-3 h-3 shrink-0" />
              <span>Danh sách</span>
            </button>
          </div>
        </div>

        {/* Row 3: Swipeable Campus Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1">
          <button
            type="button"
            onClick={() => onSelectCampus('')}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all border cursor-pointer whitespace-nowrap shrink-0 ${
              !selectedCampus
                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-white/10 hover:border-amber-400'
            }`}
          >
            📍 Tất cả
          </button>
          {effectiveBranches.map((branch) => {
            const isSelected = selectedCampus === branch;
            return (
              <button
                key={branch}
                type="button"
                onClick={() => onSelectCampus(isSelected ? '' : branch)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all border cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-white/10 hover:border-amber-400'
                }`}
              >
                📍 {branch}
              </button>
            );
          })}
        </div>

        {/* Row 4: Collapsible Advanced Search / Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-stone-100 dark:border-white/5 animate-fade-in">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Tìm lớp, môn, GV..."
                className="w-full pl-8 pr-3 py-1.5 bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => onSelectClass(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">📚 Tất cả lớp</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  Lớp {cls.name}
                </option>
              ))}
            </select>

            {/* Teacher Filter */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedTeacher}
                onChange={(e) => onSelectTeacher(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">👨‍🏫 Tất cả GV</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name}
                  </option>
                ))}
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 text-rose-500 rounded-xl transition-all shrink-0 cursor-pointer border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20"
                  title="Xóa bộ lọc"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── MOBILE ADAPTIVE VIEW (< lg) ── */}
      <div className="lg:hidden animate-fade-in">
        <MobileTimetableList
          slots={filteredSlots}
          days={DAYS}
          weekDates={weekDates}
          currentDay={selectedDayForRoomView}
          onDayChange={setSelectedDayForRoomView}
          onEditSlot={onEditSlot}
          onDeleteSlot={onDeleteSlot}
          onCreateSlot={onCreateSlot}
          viewMode="class"
          sessions={effectiveSessions}
          isLoading={isLoading}
        />
      </div>

      {/* ── DESKTOP VIEWS (>= lg) ── */}
      <div className="hidden lg:block space-y-4">
        {/* 1. VIEW MODE: LƯỚI TUẦN CHUẨN 7 NGÀY (WEEKLY MATRIX) */}
        {viewMode === 'week' && (
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-white/10 shadow-sm overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[960px]">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-white/10 bg-stone-50/90 dark:bg-stone-800/80">
                    <th className="w-28 p-3 text-left text-[10.5px] font-black uppercase tracking-wider text-stone-400 border-r border-stone-200 dark:border-white/10 sticky left-0 bg-stone-50 dark:bg-stone-800 z-20">
                      Ca học
                    </th>
                    {DAYS.map((dayName, dayIndex) => {
                      const date = weekDates[dayIndex];
                      const isToday = dayIndex === todayIndex;
                      const count = daySlotCounts[dayIndex] || 0;

                      return (
                        <th
                          key={dayIndex}
                          className={`p-2.5 text-center border-r border-stone-200 dark:border-white/10 last:border-r-0 transition-colors ${
                            isToday ? 'bg-amber-500/10' : ''
                          }`}
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <span
                              className={`text-xs font-black uppercase tracking-wider ${
                                isToday
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-stone-700 dark:text-stone-200'
                              }`}
                            >
                              {dayName}
                            </span>
                            <span className="text-[10px] font-mono text-stone-400">
                              {date?.toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                              })}
                            </span>
                            {isToday ? (
                              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[8px] font-black uppercase">
                                Hôm nay
                              </span>
                            ) : count > 0 ? (
                              <span className="text-[8.5px] font-bold text-stone-400">
                                {count} tiết
                              </span>
                            ) : null}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-white/10">
                  {effectiveSessions.map((session) => (
                    <tr
                      key={session.id}
                      className="hover:bg-stone-50/30 dark:hover:bg-stone-800/20 transition-colors"
                    >
                      {/* Sticky Session Column */}
                      <td className="p-2.5 border-r border-stone-200 dark:border-white/10 align-top bg-stone-50/95 dark:bg-stone-800/95 backdrop-blur-sm sticky left-0 z-10 shadow-[1px_0_0_rgba(0,0,0,0.06)]">
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-black text-stone-800 dark:text-white block uppercase">
                            {session.label}
                          </span>
                          <span className="text-[9.5px] font-bold text-stone-500 dark:text-stone-400 flex items-center gap-1 font-mono">
                            <Clock className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                            {session.start} - {session.end}
                          </span>
                        </div>
                      </td>

                      {/* 7 Days Cells */}
                      {DAYS.map((_, dayIndex) => {
                        const cellSlots = filteredSlots.filter((slot) => {
                          if (slot.day_of_week !== dayIndex) return false;
                          const slotStart = slot.start_time?.substring(0, 5) || '';
                          const slotEnd = slot.end_time?.substring(0, 5) || '';
                          return slotStart < session.end && slotEnd > session.start;
                        });

                        const isToday = dayIndex === todayIndex;

                        return (
                          <td
                            key={dayIndex}
                            className={`p-1.5 border-r border-stone-200 dark:border-white/10 last:border-r-0 align-top min-h-[85px] relative group transition-colors ${
                              isToday ? 'bg-amber-500/[0.015]' : ''
                            }`}
                          >
                            <div className="space-y-1.5 min-h-[75px] h-full flex flex-col">
                              {cellSlots.length === 0 ? (
                                canEdit ? (
                                  <button
                                    type="button"
                                    onClick={() => onCreateSlot(dayIndex, session, '')}
                                    className="w-full h-full min-h-[70px] rounded-xl border border-dashed border-stone-200 dark:border-white/10 hover:border-amber-400 hover:bg-amber-500/5 text-stone-300 dark:text-stone-600 hover:text-amber-600 transition-all flex flex-col items-center justify-center gap-0.5 text-[10px] font-black group/btn cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3 group-hover/btn:scale-125 transition-transform text-stone-400 group-hover/btn:text-amber-500" />
                                    <span>+ Trống</span>
                                  </button>
                                ) : (
                                  <div className="w-full h-full min-h-[70px] flex items-center justify-center text-[10px] text-stone-300 dark:text-stone-700 font-bold">
                                    --
                                  </div>
                                )
                              ) : (
                                <>
                                  {cellSlots.map((slot) => {
                                    const style = getSubjectColor(
                                      slot.subject?.name || slot.subject?.code
                                    );
                                    const hasConflict = conflictSlotIds.has(slot.id);
                                    const liveStatus = getLiveSlotStatus(
                                      dayIndex,
                                      slot.start_time,
                                      slot.end_time
                                    );

                                    return (
                                      <div
                                        key={slot.id}
                                        onClick={() => {
                                          if (onSelectSlotForAction) {
                                            onSelectSlotForAction(slot);
                                          } else {
                                            onEditSlot(slot);
                                          }
                                        }}
                                        className={`p-2 rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 relative ${
                                          hasConflict
                                            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                                            : `${style.bg} ${style.border}`
                                        }`}
                                      >
                                        {/* Subject & Conflict & Live Badge */}
                                        <div className="flex items-center justify-between gap-1 mb-1 flex-wrap">
                                          <span
                                            className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md border ${
                                              hasConflict
                                                ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                                : style.badge
                                            }`}
                                          >
                                            {slot.subject?.name || 'Môn học'}
                                          </span>

                                          <div className="flex items-center gap-1">
                                            {liveStatus && (
                                              <span
                                                className={`px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 ${liveStatus.color}`}
                                              >
                                                {liveStatus.label}
                                              </span>
                                            )}
                                            {hasConflict && (
                                              <span
                                                className="text-[8.5px] font-black bg-rose-500 text-white px-1 py-0.2 rounded-md flex items-center gap-0.5 animate-pulse"
                                                title="Cảnh báo trùng lịch!"
                                              >
                                                <AlertTriangle className="w-2.5 h-2.5" /> Trùng
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Class Name */}
                                        <div className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-tight line-clamp-1">
                                          Lớp {slot.class?.name || 'Chưa gán'}
                                        </div>

                                        {/* Teacher & Room Meta */}
                                        <div className="mt-1 space-y-0.5 text-[10px] font-bold text-stone-600 dark:text-stone-300">
                                          <div className="flex items-center gap-1 line-clamp-1">
                                            <Users className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                                            <span className="truncate">
                                              {getDisplayName(slot.teacher) || 'Chưa phân công GV'}
                                            </span>
                                          </div>
                                          <div className="flex items-center justify-between gap-1">
                                            <span className="flex items-center gap-0.5 font-mono text-[9px] text-stone-500 dark:text-stone-400">
                                              <Clock className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                                              {slot.start_time?.substring(0, 5)} -{' '}
                                              {slot.end_time?.substring(0, 5)}
                                            </span>
                                            {slot.room && (
                                              <span className="px-1 py-0.2 rounded bg-stone-200/80 dark:bg-white/10 text-stone-800 dark:text-stone-200 text-[9px] font-black font-mono">
                                                {slot.room.replace(/^.+ - /, '')}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {/* Add Slot Button on Existing Cell (if canEdit) */}
                                  {canEdit && (
                                    <button
                                      type="button"
                                      onClick={() => onCreateSlot(dayIndex, session, '')}
                                      className="w-full py-1 rounded-lg border border-dashed border-stone-200 dark:border-white/10 text-stone-400 hover:text-amber-600 hover:border-amber-400 hover:bg-amber-500/5 transition-all text-[10px] font-black opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" /> Thêm tiết
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. VIEW MODE: THEO PHÒNG HỌC (ROOM MATRIX) */}
        {viewMode === 'room' && (
          <div className="space-y-3 animate-fade-in">
            {/* Day Selector Pill Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {DAYS.map((dayName, dayIndex) => {
                const date = weekDates[dayIndex];
                const isSelected = selectedDayForRoomView === dayIndex;
                const isToday = dayIndex === todayIndex;
                const count = daySlotCounts[dayIndex] || 0;

                return (
                  <button
                    key={dayIndex}
                    type="button"
                    onClick={() => setSelectedDayForRoomView(dayIndex)}
                    className={`px-3.5 py-2 rounded-2xl font-black text-xs transition-all flex items-center gap-2 shrink-0 border cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-105'
                        : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-200/80 dark:border-white/5 hover:border-blue-400'
                    }`}
                  >
                    <span>{dayName}</span>
                    <span
                      className={`text-[10px] ${isSelected ? 'text-blue-200' : 'text-stone-400'}`}
                    >
                      {date?.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    </span>
                    {count > 0 ? (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {count} tiết
                      </span>
                    ) : (
                      <span
                        className={`text-[9px] font-normal ${isSelected ? 'text-blue-200' : 'text-stone-400'}`}
                      >
                        (0)
                      </span>
                    )}
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Room Matrix Table */}
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-white/10 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[900px]">
                  <thead>
                    <tr className="border-b border-stone-200 dark:border-white/10 bg-stone-50/90 dark:bg-stone-800/80">
                      <th className="w-28 p-3 text-left text-[10.5px] font-black uppercase tracking-wider text-stone-400 border-r border-stone-200 dark:border-white/10 sticky left-0 bg-stone-50 dark:bg-stone-800 z-20">
                        Ca học
                      </th>
                      {effectiveCampusRooms.map((room) => {
                        const hasBranch = room.includes(' - ');
                        const parts = room.split(' - ');
                        const branchName = hasBranch ? parts[0] || '' : '';
                        const roomName = hasBranch ? parts[1] || room : room;

                        return (
                          <th
                            key={room}
                            className="p-3 text-center border-r border-stone-200 dark:border-white/10 last:border-r-0 font-black text-xs text-stone-800 dark:text-white uppercase tracking-wider min-w-[130px]"
                          >
                            <div className="text-xs font-black">Phòng {roomName}</div>
                            {branchName && !selectedCampus && (
                              <div className="text-[9px] font-bold text-stone-400 normal-case tracking-normal mt-0.5">
                                {branchName}
                              </div>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-white/10">
                    {effectiveSessions.map((session) => (
                      <tr
                        key={session.id}
                        className="hover:bg-stone-50/30 dark:hover:bg-stone-800/20 transition-colors"
                      >
                        <td className="p-2.5 border-r border-stone-200 dark:border-white/10 align-top bg-stone-50/95 dark:bg-stone-800/95 backdrop-blur-sm sticky left-0 z-10 shadow-[1px_0_0_rgba(0,0,0,0.06)]">
                          <span className="text-[11px] font-black text-stone-800 dark:text-white block uppercase">
                            {session.label}
                          </span>
                          <span className="text-[9.5px] font-bold text-stone-500 dark:text-stone-400 block font-mono">
                            {session.start} - {session.end}
                          </span>
                        </td>

                        {effectiveCampusRooms.map((room) => {
                          const hasBranch = room.includes(' - ');
                          const targetParts = room.split(' - ');
                          const targetBranch = hasBranch
                            ? (targetParts[0] || '').trim()
                            : selectedCampus;
                          const targetRoomClean = hasBranch
                            ? (targetParts[1] || room).trim()
                            : room.trim();

                          const slot = filteredSlots.find((s) => {
                            if (s.day_of_week !== selectedDayForRoomView) return false;
                            const slotRoom = (s.room || '').trim();
                            if (!slotRoom) return false;

                            const slotHasBranch = slotRoom.includes(' - ');
                            const slotParts = slotRoom.split(' - ');
                            const slotBranch = slotHasBranch ? (slotParts[0] || '').trim() : '';
                            const slotRoomClean = slotHasBranch
                              ? (slotParts[1] || slotRoom).trim()
                              : slotRoom;

                            // Check branch match if specified
                            if (targetBranch && slotBranch) {
                              if (targetBranch.toLowerCase() !== slotBranch.toLowerCase())
                                return false;
                            }

                            // Check clean room number match
                            if (
                              slotRoomClean.toLowerCase() !== targetRoomClean.toLowerCase() &&
                              slotRoom.toLowerCase() !== room.toLowerCase()
                            ) {
                              return false;
                            }

                            const slotStart = s.start_time?.substring(0, 5) || '';
                            const slotEnd = s.end_time?.substring(0, 5) || '';
                            return slotStart < session.end && slotEnd > session.start;
                          });

                          const isToday = selectedDayForRoomView === todayIndex;
                          const liveStatus = slot
                            ? getLiveSlotStatus(
                                selectedDayForRoomView,
                                slot.start_time,
                                slot.end_time
                              )
                            : null;
                          const style = slot
                            ? getSubjectColor(slot.subject?.name || slot.subject?.code)
                            : null;

                          return (
                            <td
                              key={room}
                              className={`p-1.5 border-r border-stone-200 dark:border-white/10 last:border-r-0 align-top min-h-[85px] ${
                                isToday ? 'bg-amber-500/[0.015]' : ''
                              }`}
                            >
                              {slot && style ? (
                                <div
                                  onClick={() => {
                                    if (onSelectSlotForAction) {
                                      onSelectSlotForAction(slot);
                                    } else {
                                      onEditSlot(slot);
                                    }
                                  }}
                                  className={`p-2 rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 relative ${style.bg} ${style.border}`}
                                >
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span
                                      className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded border ${style.badge}`}
                                    >
                                      {slot.subject?.name || 'Môn học'}
                                    </span>
                                    {liveStatus && (
                                      <span
                                        className={`px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 ${liveStatus.color}`}
                                      >
                                        {liveStatus.label}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs font-black text-stone-900 dark:text-white uppercase line-clamp-1">
                                    Lớp {slot.class?.name || 'Chưa gán'}
                                  </div>
                                  <div className="mt-1 space-y-0.5 text-[10px] font-bold text-stone-600 dark:text-stone-300">
                                    <div className="flex items-center gap-1 line-clamp-1">
                                      <Users className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                                      <span className="truncate">
                                        {getDisplayName(slot.teacher) || 'Chưa phân công GV'}
                                      </span>
                                    </div>
                                    <div className="font-mono text-[9px] text-stone-400 flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                                      {slot.start_time?.substring(0, 5)} -{' '}
                                      {slot.end_time?.substring(0, 5)}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                canEdit && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onCreateSlot(selectedDayForRoomView, session, room)
                                    }
                                    className="w-full h-full min-h-[70px] rounded-xl border border-dashed border-stone-200 dark:border-white/10 hover:border-amber-400 hover:bg-amber-500/5 text-stone-300 dark:text-stone-600 hover:text-amber-600 transition-all flex flex-col items-center justify-center gap-0.5 text-[10px] font-black group/btn cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3 group-hover/btn:scale-125 transition-transform text-stone-400 group-hover/btn:text-amber-500" />
                                    <span>+ Trống</span>
                                  </button>
                                )
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. VIEW MODE: DANH SÁCH THEO NGÀY (DAILY AGENDA LIST) */}
        {viewMode === 'agenda' && (
          <div className="space-y-4 animate-fade-in">
            {DAYS.map((dayName, dayIndex) => {
              const date = weekDates[dayIndex];
              const isToday = dayIndex === todayIndex;
              const daySlots = filteredSlots
                .filter((s) => s.day_of_week === dayIndex)
                .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

              return (
                <div
                  key={dayIndex}
                  className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-white/10 shadow-sm p-4 sm:p-5 space-y-3"
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-stone-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                          isToday
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {dayIndex === 6 ? 'CN' : `T${dayIndex + 2}`}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-tight">
                            {dayName}
                          </span>
                          {isToday && (
                            <span className="px-2 py-0.2 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[9px] font-black uppercase">
                              Hôm nay
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-stone-400">
                          {date?.toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-black text-stone-500 dark:text-stone-400 px-3 py-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
                      {daySlots.length} tiết học
                    </span>
                  </div>

                  {/* Day Slot Items */}
                  {daySlots.length === 0 ? (
                    <div className="py-6 text-center text-xs font-bold text-stone-400">
                      Không có tiết học nào trong ngày này.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {daySlots.map((slot) => {
                        const style = getSubjectColor(slot.subject?.name || slot.subject?.code);
                        const hasConflict = conflictSlotIds.has(slot.id);
                        const liveStatus = getLiveSlotStatus(
                          dayIndex,
                          slot.start_time,
                          slot.end_time
                        );

                        return (
                          <div
                            key={slot.id}
                            onClick={() => {
                              if (onSelectSlotForAction) {
                                onSelectSlotForAction(slot);
                              } else {
                                onEditSlot(slot);
                              }
                            }}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 relative ${
                              hasConflict
                                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                                : `${style.bg} ${style.border}`
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span
                                className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                                  hasConflict
                                    ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                    : style.badge
                                }`}
                              >
                                {slot.subject?.name || 'Môn học'}
                              </span>
                              {liveStatus && (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 ${liveStatus.color}`}
                                >
                                  {liveStatus.label}
                                </span>
                              )}
                            </div>

                            <div className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-tight">
                              Lớp {slot.class?.name || 'Chưa gán'}
                            </div>

                            <div className="mt-2 space-y-1 text-xs font-bold text-stone-600 dark:text-stone-300">
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                <span>{getDisplayName(slot.teacher) || 'Chưa phân công GV'}</span>
                              </div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="flex items-center gap-1 font-mono text-[10.5px] text-stone-500 dark:text-stone-400">
                                  <Clock className="w-3 h-3 text-stone-400" />
                                  {slot.start_time?.substring(0, 5)} -{' '}
                                  {slot.end_time?.substring(0, 5)}
                                </span>
                                {slot.room && (
                                  <span className="px-2 py-0.5 rounded-md bg-stone-200/80 dark:bg-white/10 text-stone-800 dark:text-stone-200 text-[10px] font-black font-mono">
                                    {slot.room}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
