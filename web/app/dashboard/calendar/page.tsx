'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { usePermissions } from '@/hooks/usePermissions';
import { apiFetch } from '@/lib/api/client';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  BookOpen,
  Clock,
  AlertCircle,
  FileText,
  CheckCircle2,
  X,
  Search,
  Filter,
  Edit2,
  Trash2,
  Loader2,
  Table as TableIcon,
  CalendarDays,
  ListOrdered,
  CalendarCheck,
} from 'lucide-react';
import {
  generateAcademicWeeks,
  DEFAULT_ACADEMIC_MILESTONES,
  AcademicWeek,
  AcademicMilestone,
} from '@/lib/utils/academicMasterPlan';

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
  color: string;
}

const EVENT_TYPE_MAP: Record<
  string,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    icon: string;
    dotColor: string;
    defaultColor: string;
  }
> = {
  holiday: {
    label: 'Nghỉ lễ / Tết',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500/30',
    icon: '🏖️',
    dotColor: '#10b981',
    defaultColor: '#10b981',
  },
  academic: {
    label: 'Mốc Học kỳ',
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-500/30',
    icon: '🎓',
    dotColor: '#3b82f6',
    defaultColor: '#3b82f6',
  },
  exam: {
    label: 'Ôn thi & Kiểm tra',
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-500/30',
    icon: '📝',
    dotColor: '#ef4444',
    defaultColor: '#ef4444',
  },
  general: {
    label: 'Thông báo',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-500/30',
    icon: '📌',
    dotColor: '#f59e0b',
    defaultColor: '#f59e0b',
  },
};

const COLOR_PRESETS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#64748b', // Slate
];

export default function AcademicCalendarPage() {
  const { profile } = useProfile();
  const { isAdmin, isStaff } = usePermissions();

  // Role check: Admin, Owner, SuperAdmin, Staff, Teacher can manage
  const canManage =
    isAdmin ||
    isStaff ||
    profile?.role === 'owner' ||
    profile?.role === 'super_admin' ||
    profile?.role === 'admin' ||
    profile?.role === 'staff' ||
    profile?.role === 'teacher';

  // 3 distinct views: 'list' (Table / Mobile Cards), 'weeks' (38 weeks), 'month' (Interactive Calendar)
  const [viewMode, setViewMode] = useState<'list' | 'weeks' | 'month'>('list');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'HOLIDAY' | 'ACADEMIC' | 'EXAM'>(
    'ALL'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Active Academic Year Info
  const [academicYearName, setAcademicYearName] = useState('2026-2027');
  const [startMonday, setStartMonday] = useState('2026-09-07');

  // Events State
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Monthly Calendar State
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date(2026, 8, 1)); // Default Sept 2026
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedEventDetail, setSelectedEventDetail] = useState<AcademicMilestone | null>(null);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    event_type: 'holiday',
    start_date: new Date().toISOString().split('T')[0] || '',
    end_date: '',
    description: '',
    color: '#10b981',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Fetch Academic Context & Events from DB
  const fetchAcademicContext = useCallback(async () => {
    try {
      const res = await apiFetch('/api/settings');
      if (res.ok) {
        const json = await res.json();
        const yearObj = json.settings?.academic_year?.value_json;
        if (yearObj?.name) {
          setAcademicYearName(yearObj.name);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch academic context:', err);
    }
  }, []);

  const fetchAllEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const res = await apiFetch('/api/calendar?all=true');
      if (res.ok) {
        const json = await res.json();
        const dataEvents = json.data?.events || json.events || [];
        setEvents(dataEvents);
      }
    } catch (err) {
      console.warn('Failed to fetch calendar events:', err);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    fetchAcademicContext();
    fetchAllEvents();
  }, [fetchAcademicContext, fetchAllEvents]);

  // Academic Weeks (Calculated for 38 weeks)
  const academicWeeks = useMemo(() => {
    return generateAcademicWeeks(startMonday, 38);
  }, [startMonday]);

  // Event Config Helper
  const getEventConfig = (type: string) => {
    return (
      EVENT_TYPE_MAP[type] ||
      EVENT_TYPE_MAP.general || {
        label: 'Thông báo',
        bg: 'bg-stone-500/10 dark:bg-stone-500/20',
        text: 'text-stone-700 dark:text-stone-300',
        border: 'border-stone-500/30',
        icon: '📌',
        dotColor: '#f59e0b',
        defaultColor: '#f59e0b',
      }
    );
  };

  // Convert DB events to AcademicMilestone format
  const allMilestones: AcademicMilestone[] = useMemo(() => {
    if (events.length === 0) {
      return DEFAULT_ACADEMIC_MILESTONES;
    }

    return events
      .map((ev) => {
        let semester: 'HK1' | 'HK2' | 'ALL' = 'ALL';
        if (ev.start_date < '2027-02-01') {
          semester = 'HK1';
        } else if (ev.start_date <= '2027-05-31') {
          semester = 'HK2';
        }

        return {
          id: ev.id,
          title: ev.title,
          semester,
          startDate: ev.start_date,
          endDate: ev.end_date || undefined,
          type: (ev.event_type as any) || 'general',
          description: ev.description || '',
          badge: EVENT_TYPE_MAP[ev.event_type]?.label || 'Sự kiện',
          color: ev.color || EVENT_TYPE_MAP[ev.event_type]?.defaultColor || '#3b82f6',
        };
      })
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [events]);

  // Filtered Milestones & Weeks by selected category & search
  const filteredMilestones = useMemo(() => {
    return allMilestones.filter((m) => {
      if (filterCategory === 'HOLIDAY' && m.type !== 'holiday') return false;
      if (filterCategory === 'ACADEMIC' && m.type !== 'academic') return false;
      if (filterCategory === 'EXAM' && m.type !== 'exam') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.badge.toLowerCase().includes(q) ||
          m.startDate.includes(q)
        );
      }
      return true;
    });
  }, [allMilestones, filterCategory, searchQuery]);

  const filteredWeeks = useMemo(() => {
    return academicWeeks.filter((w) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return w.label.toLowerCase().includes(q) || w.phase.toLowerCase().includes(q);
      }
      return true;
    });
  }, [academicWeeks, searchQuery]);

  // Current Week Stats
  const currentWeek = academicWeeks.find((w) => w.isCurrent) ||
    academicWeeks[0] || {
      weekNumber: 1,
      isCurrent: true,
      isPast: false,
      phase: 'Bắt đầu ca học thêm Học kỳ 1',
      startDate: '2026-09-07',
      endDate: '2026-09-13',
      semester: 'HK1' as const,
      label: 'Tuần 1',
      phaseType: 'teaching' as const,
    };

  const holidaysCount = allMilestones.filter((m) => m.type === 'holiday').length;
  const examsCount = allMilestones.filter((m) => m.type === 'exam').length;
  const academicCount = allMilestones.filter((m) => m.type === 'academic').length;

  // Month grid helpers
  const monthYearLabel = currentMonthDate.toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  });

  const getDaysInMonth = () => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay(); // Mon = 1, Sun = 7

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const handlePrevMonth = () => {
    setCurrentMonthDate(
      new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1)
    );
    setSelectedCalendarDate(null);
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(
      new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1)
    );
    setSelectedCalendarDate(null);
  };

  const handleSetMonth = (year: number, monthIndex: number) => {
    setCurrentMonthDate(new Date(year, monthIndex, 1));
    setSelectedCalendarDate(null);
  };

  // Events in current selected month or date
  const eventsInCurrentMonth = useMemo(() => {
    const y = currentMonthDate.getFullYear();
    const m = String(currentMonthDate.getMonth() + 1).padStart(2, '0');
    const monthPrefix = `${y}-${m}`;

    return allMilestones.filter((ev) => {
      if (selectedCalendarDate) {
        if (ev.endDate) {
          return selectedCalendarDate >= ev.startDate && selectedCalendarDate <= ev.endDate;
        }
        return ev.startDate === selectedCalendarDate;
      }

      const evStartMonth = ev.startDate.substring(0, 7);
      const evEndMonth = ev.endDate ? ev.endDate.substring(0, 7) : evStartMonth;
      return monthPrefix >= evStartMonth && monthPrefix <= evEndMonth;
    });
  }, [allMilestones, currentMonthDate, selectedCalendarDate]);

  // Open Create Modal
  const openCreateModal = (specificDate?: string) => {
    setModalMode('create');
    setFormData({
      id: '',
      title: '',
      event_type: 'holiday',
      start_date: specificDate || new Date().toISOString().split('T')[0] || '',
      end_date: '',
      description: '',
      color: '#10b981',
    });
    setIsModalOpen(true);
    setFeedbackMsg(null);
  };

  // Open Edit Modal
  const openEditModal = (milestone: AcademicMilestone) => {
    setModalMode('edit');
    setFormData({
      id: milestone.id,
      title: milestone.title,
      event_type: milestone.type,
      start_date: milestone.startDate,
      end_date: milestone.endDate || '',
      description: milestone.description || '',
      color: milestone.color || '#3b82f6',
    });
    setSelectedEventDetail(null);
    setIsModalOpen(true);
    setFeedbackMsg(null);
  };

  // Handle Form Submit (Create or Update)
  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    setFeedbackMsg(null);

    try {
      const isEdit = modalMode === 'edit' && formData.id && !formData.id.startsWith('m');
      const url = isEdit ? `/api/calendar/${formData.id}` : '/api/calendar';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          event_type: formData.event_type,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          description: formData.description.trim() || null,
          color: formData.color,
          is_all_day: true,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Lưu mốc sự kiện thất bại');
      }

      setIsModalOpen(false);
      setFeedbackMsg({
        type: 'success',
        text: isEdit
          ? '✅ Đã cập nhật mốc sự kiện thành công!'
          : '✅ Đã thêm mốc sự kiện mới vào Lịch!',
      });
      fetchAllEvents();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Đã có lỗi xảy ra khi lưu sự kiện' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger Delete Modal
  const requestDeleteEvent = (milestone: { id: string; title: string }) => {
    setSelectedEventDetail(null);
    setDeleteTarget(milestone);
  };

  // Execute Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      if (!deleteTarget.id.startsWith('m')) {
        const res = await apiFetch(`/api/calendar/${deleteTarget.id}`, { method: 'DELETE' });
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || 'Xóa mốc sự kiện thất bại');
        }
      }

      // Optimistic update
      setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setDeleteTarget(null);
      setFeedbackMsg({ type: 'success', text: `✅ Đã xóa mốc "${deleteTarget.title}" khỏi Lịch!` });
      fetchAllEvents();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Lỗi khi xóa sự kiện' });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateVi = (dStr?: string) => {
    if (!dStr) return '';
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dStr;
    } catch {
      return dStr;
    }
  };

  return (
    <div className="min-h-screen bg-transparent relative overflow-x-hidden pb-32 sm:pb-16">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-stone-200/50 dark:border-white/5">
          {/* Top Row: Title + Year + Mobile Action Button */}
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-1.5 h-5 sm:h-6 bg-amber-500 rounded-full shadow-accent-glow" />
                <h1 className="text-base sm:text-xl font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">
                  Lịch Nghỉ Lễ & <span className="text-amber-500">Mốc Học Kỳ</span>
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black border border-amber-500/20">
                  {academicYearName}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-bold text-stone-500 dark:text-stone-400 pl-3.5">
                Theo dõi các đợt nghỉ lễ, Tết và các mốc học tập tại Trung tâm Bùi Hoàng
              </p>
            </div>

            {/* Mobile Action Button */}
            {canManage && (
              <button
                onClick={() => openCreateModal()}
                className="lg:hidden px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white text-xs font-black uppercase tracking-wider shadow-xs transition-all flex items-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Thêm mốc</span>
              </button>
            )}
          </div>

          {/* Bottom Row / Right Side: Full-width Segmented Control on Mobile, Inline on Desktop */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            {/* 3 Views Segmented Control */}
            <div className="grid grid-cols-3 bg-stone-100 dark:bg-stone-800/70 p-1 rounded-xl border border-stone-200/60 dark:border-white/5 w-full lg:w-auto lg:flex">
              <button
                onClick={() => setViewMode('list')}
                className={`py-2 lg:py-1.5 px-2 sm:px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Danh Sách</span>
              </button>

              <button
                onClick={() => setViewMode('weeks')}
                className={`py-2 lg:py-1.5 px-2 sm:px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  viewMode === 'weeks'
                    ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Theo Tuần</span>
              </button>

              <button
                onClick={() => setViewMode('month')}
                className={`py-2 lg:py-1.5 px-2 sm:px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  viewMode === 'month'
                    ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Lịch Tháng</span>
              </button>
            </div>

            {/* Desktop Action Button */}
            {canManage && (
              <button
                onClick={() => openCreateModal()}
                className="hidden lg:flex px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white text-xs font-black uppercase tracking-wider shadow-xs transition-all items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm mốc</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`p-3 sm:p-3.5 rounded-xl text-xs font-bold flex items-center justify-between border animate-in fade-in duration-200 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-700 dark:text-rose-300'
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button onClick={() => setFeedbackMsg(null)} className="p-1 hover:opacity-70">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Summary Statistics Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 bg-white dark:bg-stone-900 p-3 sm:p-4 rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-xs">
          <div className="space-y-0.5 sm:space-y-1">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-stone-400">
              Tuần hiện tại
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400">
                Tuần {currentWeek.weekNumber}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-stone-400">/ 38 tuần</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-stone-500 truncate">
              {formatDateVi(currentWeek.startDate)} → {formatDateVi(currentWeek.endDate)}
            </p>
          </div>

          <div className="space-y-0.5 sm:space-y-1 border-l border-stone-100 dark:border-white/5 pl-2.5 sm:pl-4">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-stone-400">
              🏖️ Nghỉ Lễ / Tết
            </span>
            <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
              {holidaysCount} Đợt nghỉ
            </div>
            <p className="text-[10px] sm:text-[11px] text-stone-400 truncate">
              Tết Dương, Tết Âm, 30/4...
            </p>
          </div>

          <div className="space-y-0.5 sm:space-y-1 border-t md:border-t-0 md:border-l border-stone-100 dark:border-white/5 pt-2 md:pt-0 pl-0 md:pl-4">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-stone-400">
              🎓 Mốc Học Kỳ
            </span>
            <div className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400">
              {academicCount} Mốc học kỳ
            </div>
            <p className="text-[10px] sm:text-[11px] text-stone-400 truncate">
              Khai giảng HK1, HK2, Hè
            </p>
          </div>

          <div className="space-y-0.5 sm:space-y-1 border-t md:border-t-0 md:border-l border-stone-100 dark:border-white/5 pt-2 md:pt-0 pl-2.5 md:pl-4">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-stone-400">
              📝 Đợt Ôn Thi
            </span>
            <div className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400">
              {examsCount} Đợt ôn thi
            </div>
            <p className="text-[10px] sm:text-[11px] text-stone-400 truncate">
              Giữa kỳ, Cuối kỳ trên trường
            </p>
          </div>
        </div>

        {/* Filter Toolbar (Used for List & Weeks Views) */}
        {viewMode !== 'month' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 bg-white dark:bg-stone-900 p-2.5 sm:p-4 rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-xs">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên mốc, ngày tháng, nội dung..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-stone-200/80 dark:border-white/10 bg-stone-50/60 dark:bg-stone-800/40 text-stone-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl overflow-x-auto">
              <button
                onClick={() => setFilterCategory('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                  filterCategory === 'ALL'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Tất cả ({allMilestones.length})
              </button>
              <button
                onClick={() => setFilterCategory('HOLIDAY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap ${
                  filterCategory === 'HOLIDAY'
                    ? 'bg-white dark:bg-stone-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <span>🏖️</span>
                <span>Nghỉ Lễ ({holidaysCount})</span>
              </button>
              <button
                onClick={() => setFilterCategory('ACADEMIC')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap ${
                  filterCategory === 'ACADEMIC'
                    ? 'bg-white dark:bg-stone-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <span>🎓</span>
                <span>Học kỳ ({academicCount})</span>
              </button>
              <button
                onClick={() => setFilterCategory('EXAM')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap ${
                  filterCategory === 'EXAM'
                    ? 'bg-white dark:bg-stone-900 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <span>📝</span>
                <span>Ôn thi ({examsCount})</span>
              </button>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loadingEvents && (
          <div className="py-8 text-center text-xs font-bold text-stone-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            <span>Đang tải dữ liệu lịch mốc sự kiện...</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: DANH SÁCH MỐC (100% WIDTH TABLE - ZERO OVERFLOW & NO CLIPPING) */}
        {/* ========================================================================= */}
        {viewMode === 'list' && !loadingEvents && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-xs overflow-hidden animate-in fade-in duration-300">
            <div className="p-3.5 sm:p-4 sm:px-6 border-b border-stone-200/80 dark:border-white/10 flex items-center justify-between bg-stone-50/50 dark:bg-stone-800/30">
              <div className="text-xs font-bold text-stone-600 dark:text-stone-400">
                Hiển thị{' '}
                <span className="font-black text-stone-900 dark:text-white">
                  {filteredMilestones.length}
                </span>{' '}
                mốc sự kiện
              </div>
              {canManage && (
                <button
                  onClick={() => openCreateModal()}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm mốc mới</span>
                </button>
              )}
            </div>

            {/* Mobile View: Vertical Cards Feed */}
            <div className="md:hidden divide-y divide-stone-100 dark:divide-white/5">
              {filteredMilestones.map((m) => {
                const config = getEventConfig(m.type);
                return (
                  <div
                    key={m.id}
                    className="p-4 space-y-2.5 hover:bg-amber-50/20 dark:hover:bg-amber-950/10 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[11px] font-black ${config.bg} ${config.text} ${config.border}`}
                      >
                        <span>{config.icon}</span>
                        <span>{config.label}</span>
                      </span>

                      {canManage && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(m)}
                            className="p-1.5 rounded-lg border border-stone-200/80 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:text-amber-600 active:scale-95 transition-all"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => requestDeleteEvent(m)}
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 text-rose-600 active:scale-95 transition-all"
                            title="Xóa mốc"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="text-sm font-black text-stone-900 dark:text-white leading-snug">
                      {m.title}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/15 px-2.5 py-1 rounded-lg w-fit">
                      <span>📅</span>
                      <span>
                        {formatDateVi(m.startDate)}
                        {m.endDate ? ` → ${formatDateVi(m.endDate)}` : ''}
                      </span>
                    </div>

                    {m.description && (
                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed pt-0.5">
                        {m.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop View: 100% Fit Responsive Table (Zero horizontal scroll) */}
            <div className="hidden md:block w-full">
              <table className="w-full text-left text-xs table-fixed">
                <thead>
                  <tr className="border-b border-stone-200/80 dark:border-white/10 bg-stone-50/80 dark:bg-stone-800/60 text-stone-500 dark:text-stone-400 text-[10px] font-black uppercase tracking-wider">
                    <th className="py-3.5 pl-6 pr-4 w-[32%]">Tên Mốc Sự kiện</th>
                    <th className="py-3.5 px-4 w-[18%]">Phân loại</th>
                    <th className="py-3.5 px-4 w-[18%]">Thời gian</th>
                    <th className="py-3.5 px-4 w-[24%]">Mô tả / Hướng dẫn</th>
                    <th className="py-3.5 pl-4 pr-6 text-right w-[8%]">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                  {filteredMilestones.map((m) => {
                    const config = getEventConfig(m.type);
                    return (
                      <tr
                        key={m.id}
                        className="hover:bg-amber-50/30 dark:hover:bg-amber-950/10 transition-colors"
                      >
                        {/* Title */}
                        <td className="py-4 pl-6 pr-4 font-black text-stone-900 dark:text-white">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg shrink-0">{config.icon}</span>
                            <span className="leading-snug font-black text-stone-900 dark:text-white text-xs">
                              {m.title}
                            </span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-black whitespace-nowrap ${config.bg} ${config.text} ${config.border}`}
                          >
                            <span>{config.icon}</span>
                            <span>{config.label}</span>
                          </span>
                        </td>

                        {/* Date Range */}
                        <td className="py-4 px-4 font-black text-stone-800 dark:text-stone-200">
                          <div className="flex flex-col">
                            <span>{formatDateVi(m.startDate)}</span>
                            {m.endDate && (
                              <span className="text-[11px] font-bold text-stone-400">
                                đến {formatDateVi(m.endDate)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Description */}
                        <td className="py-4 px-4 text-stone-600 dark:text-stone-400 leading-relaxed text-xs">
                          {m.description || '—'}
                        </td>

                        {/* Actions */}
                        <td className="py-4 pl-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canManage && (
                              <>
                                <button
                                  onClick={() => openEditModal(m)}
                                  className="p-1.5 rounded-lg border border-stone-200/80 dark:border-white/10 hover:border-amber-500 text-stone-600 dark:text-stone-300 hover:text-amber-600 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                                  title="Chỉnh sửa"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => requestDeleteEvent(m)}
                                  className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                  title="Xóa mốc"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: THEO TUẦN (100% WIDTH TABLE - ZERO OVERFLOW & NO CLIPPING) */}
        {/* ========================================================================= */}
        {viewMode === 'weeks' && !loadingEvents && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-xs overflow-hidden animate-in fade-in duration-300">
            {/* Mobile View: Vertical Cards */}
            <div className="md:hidden divide-y divide-stone-100 dark:divide-white/5">
              {filteredWeeks.map((w) => {
                const matchingMilestone = allMilestones.find(
                  (m) => m.startDate >= w.startDate && m.startDate <= w.endDate
                );

                return (
                  <div
                    key={w.weekNumber}
                    className={`p-4 space-y-2 ${
                      w.isCurrent ? 'bg-amber-500/10 dark:bg-amber-500/15' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {w.isCurrent && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        )}
                        <span className="font-black text-sm text-stone-900 dark:text-white">
                          Tuần {w.weekNumber}
                        </span>
                      </div>

                      {w.isCurrent ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-black text-[9px] uppercase tracking-wider">
                          Đang học
                        </span>
                      ) : w.isPast ? (
                        <span className="text-stone-400 text-[10px] font-bold">Đã qua</span>
                      ) : (
                        <span className="text-stone-500 text-[10px] font-bold">Sắp tới</span>
                      )}
                    </div>

                    <p className="text-xs font-bold text-stone-500">
                      {formatDateVi(w.startDate)} — {formatDateVi(w.endDate)}
                    </p>

                    <div className="text-xs font-bold text-stone-800 dark:text-stone-200">
                      {w.phase}
                    </div>

                    {matchingMilestone && (
                      <button
                        onClick={() => setSelectedEventDetail(matchingMilestone)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-black text-[11px] text-left"
                      >
                        <span>{getEventConfig(matchingMilestone.type).icon}</span>
                        <span>{matchingMilestone.title}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop View: 100% Fit Responsive Table */}
            <div className="hidden md:block w-full">
              <table className="w-full text-left text-xs table-fixed">
                <thead>
                  <tr className="border-b border-stone-200/80 dark:border-white/10 bg-stone-50/80 dark:bg-stone-800/60 text-stone-500 dark:text-stone-400 text-[10px] font-black uppercase tracking-wider">
                    <th className="py-3.5 pl-6 pr-3 w-[14%] whitespace-nowrap">Tuần</th>
                    <th className="py-3.5 px-3 w-[22%] whitespace-nowrap">Khoảng thời gian</th>
                    <th className="py-3.5 px-3 w-[32%]">Lịch học / Hoạt động</th>
                    <th className="py-3.5 px-3 w-[20%]">Mốc Nghỉ lễ & Sự kiện</th>
                    <th className="py-3.5 pl-3 pr-6 text-right w-[12%] whitespace-nowrap">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                  {filteredWeeks.map((w) => {
                    const matchingMilestone = allMilestones.find(
                      (m) => m.startDate >= w.startDate && m.startDate <= w.endDate
                    );

                    return (
                      <tr
                        key={w.weekNumber}
                        className={`hover:bg-amber-50/30 dark:hover:bg-amber-950/10 transition-colors ${
                          w.isCurrent ? 'bg-amber-500/10 dark:bg-amber-500/15 font-bold' : ''
                        }`}
                      >
                        <td className="py-3.5 pl-6 pr-3 font-black text-stone-900 dark:text-white whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {w.isCurrent && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                            )}
                            <span>Tuần {w.weekNumber}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 font-bold text-stone-600 dark:text-stone-300 whitespace-nowrap">
                          {formatDateVi(w.startDate)} — {formatDateVi(w.endDate)}
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={`font-black ${
                              w.phaseType === 'holiday'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : w.phaseType === 'exam'
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-stone-800 dark:text-stone-200'
                            }`}
                          >
                            {w.phase}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          {matchingMilestone ? (
                            <button
                              onClick={() => setSelectedEventDetail(matchingMilestone)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-black text-[11px] hover:bg-amber-500/20 transition-all text-left whitespace-nowrap"
                            >
                              <span>{getEventConfig(matchingMilestone.type).icon}</span>
                              <span>{matchingMilestone.title}</span>
                            </button>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>

                        <td className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">
                          {w.isCurrent ? (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white font-black text-[9px] uppercase tracking-wider shadow-xs">
                              Đang học
                            </span>
                          ) : w.isPast ? (
                            <span className="text-stone-400 text-[11px] font-bold">Đã qua</span>
                          ) : (
                            <span className="text-stone-500 text-[11px] font-bold">Sắp tới</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: LỊCH THÁNG (CLEAN MONTH GRID + DETAILED EVENTS SECTION) */}
        {/* ========================================================================= */}
        {viewMode === 'month' && !loadingEvents && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Calendar Container */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-xs p-4 sm:p-6 space-y-4">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/80 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 font-black">
                    <CalendarIcon className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                      {monthYearLabel}
                    </h2>
                    <p className="text-xs text-stone-400 font-bold whitespace-nowrap">
                      {selectedCalendarDate
                        ? `Đang lọc: Ngày ${formatDateVi(selectedCalendarDate)}`
                        : 'Bấm vào ngày để xem chi tiết bên dưới'}
                    </p>
                  </div>
                </div>

                {/* Quick Academic Months Navigation */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-bold">
                    {[
                      { label: 'Thg 9', y: 2026, m: 8 },
                      { label: 'Thg 11', y: 2026, m: 10 },
                      { label: 'Thg 1', y: 2027, m: 0 },
                      { label: 'Thg 2', y: 2027, m: 1 },
                      { label: 'Thg 4', y: 2027, m: 3 },
                      { label: 'Thg 5', y: 2027, m: 4 },
                    ].map((item) => {
                      const isSelected =
                        currentMonthDate.getFullYear() === item.y &&
                        currentMonthDate.getMonth() === item.m;
                      return (
                        <button
                          key={item.label}
                          onClick={() => handleSetMonth(item.y, item.m)}
                          className={`px-2.5 py-1 rounded-lg transition-all ${
                            isSelected
                              ? 'bg-amber-500 text-white font-black shadow-2xs'
                              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1.5 sm:p-2 rounded-xl border border-stone-200/80 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      title="Tháng trước"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-1.5 sm:p-2 rounded-xl border border-stone-200/80 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      title="Tháng sau"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid */}
              {(() => {
                const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth();
                const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
                const blanks = Array.from({ length: startingDayOfWeek - 1 }, (_, i) => i);
                const dayNames = [
                  { name: 'Thứ 2', isWeekend: false },
                  { name: 'Thứ 3', isWeekend: false },
                  { name: 'Thứ 4', isWeekend: false },
                  { name: 'Thứ 5', isWeekend: false },
                  { name: 'Thứ 6', isWeekend: false },
                  { name: 'Thứ 7', isWeekend: true },
                  { name: 'Chủ Nhật', isWeekend: true },
                ];

                return (
                  <div className="space-y-2">
                    {/* Days of week header bar */}
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center py-2 px-1 bg-stone-100/70 dark:bg-stone-800/50 rounded-xl border border-stone-200/60 dark:border-white/5">
                      {dayNames.map((d) => (
                        <div
                          key={d.name}
                          className={`text-xs sm:text-sm font-black uppercase tracking-wider ${
                            d.isWeekend
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          {d.name}
                        </div>
                      ))}
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                      {blanks.map((b) => (
                        <div
                          key={`blank-${b}`}
                          className="min-h-[70px] sm:min-h-[88px] rounded-xl bg-stone-50/40 dark:bg-stone-800/15 border border-dashed border-stone-200/40 dark:border-white/5"
                        />
                      ))}

                      {daysArray.map((day) => {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                          day
                        ).padStart(2, '0')}`;

                        const dayEvents = allMilestones.filter((m) => {
                          if (m.endDate) {
                            return dateStr >= m.startDate && dateStr <= m.endDate;
                          }
                          return m.startDate === dateStr;
                        });

                        const dayOfWeek = (startingDayOfWeek - 1 + day - 1) % 7;
                        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
                        const isToday = new Date().toISOString().split('T')[0] === dateStr;
                        const isSelected = selectedCalendarDate === dateStr;
                        const hasEvents = dayEvents.length > 0;

                        return (
                          <div
                            key={day}
                            onClick={() => {
                              if (selectedCalendarDate === dateStr) {
                                setSelectedCalendarDate(null);
                              } else {
                                setSelectedCalendarDate(dateStr);
                              }
                            }}
                            className={`min-h-[70px] sm:min-h-[88px] p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer group ${
                              isSelected
                                ? 'border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/40 shadow-xs'
                                : isToday
                                  ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10'
                                  : hasEvents
                                    ? 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900/90 shadow-2xs hover:border-amber-500 hover:shadow-xs'
                                    : isWeekend
                                      ? 'border-stone-200/60 dark:border-white/5 bg-stone-50/40 dark:bg-stone-800/30 hover:border-amber-500/40'
                                      : 'border-stone-200/70 dark:border-white/10 bg-white dark:bg-stone-900/60 hover:border-amber-500/40'
                            }`}
                          >
                            {/* Day Header */}
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-sm sm:text-base font-black ${
                                  isSelected || isToday
                                    ? 'text-amber-600 dark:text-amber-400 scale-105'
                                    : isWeekend
                                      ? 'text-rose-600 dark:text-rose-400'
                                      : 'text-stone-800 dark:text-stone-200'
                                }`}
                              >
                                {day}
                              </span>

                              {isToday ? (
                                <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded-sm bg-amber-500 text-white shadow-2xs">
                                  Hôm nay
                                </span>
                              ) : canManage ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openCreateModal(dateStr);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-400 hover:text-amber-600 transition-opacity"
                                  title="Thêm mốc sự kiện"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              ) : null}
                            </div>

                            {/* Sleek Horizontal Event Pill Bars */}
                            <div className="space-y-1 mt-1">
                              {/* Mobile: Colored Dots */}
                              <div className="flex sm:hidden items-center gap-1">
                                {dayEvents.map((ev, i) => (
                                  <span
                                    key={i}
                                    className="w-2 h-2 rounded-full"
                                    style={{
                                      backgroundColor:
                                        EVENT_TYPE_MAP[ev.type]?.dotColor || ev.color || '#f59e0b',
                                    }}
                                  />
                                ))}
                              </div>

                              {/* Desktop: Clean Horizontal Event Bar (No single-word awkward breaks) */}
                              <div className="hidden sm:block space-y-1">
                                {dayEvents.map((ev, i) => {
                                  const config = getEventConfig(ev.type);
                                  return (
                                    <div
                                      key={i}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedEventDetail(ev);
                                      }}
                                      className={`px-2 py-1 rounded-md border text-[11px] font-black truncate cursor-pointer hover:scale-102 active:scale-98 transition-all shadow-2xs flex items-center gap-1.5 ${config.bg} ${config.text} ${config.border}`}
                                      title={`${ev.title}${ev.description ? ` - ${ev.description}` : ''}`}
                                    >
                                      <span className="shrink-0">{config.icon}</span>
                                      <span className="truncate">{ev.title}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Detailed Events Section of Current Month / Selected Date (Full text, 100% readable) */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-xs p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-stone-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs sm:text-sm font-black text-stone-900 dark:text-white uppercase tracking-tight">
                    {selectedCalendarDate
                      ? `Sự kiện ngày ${formatDateVi(selectedCalendarDate)}`
                      : `Chi tiết tất cả sự kiện trong ${monthYearLabel}`}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-black">
                    {eventsInCurrentMonth.length} mốc
                  </span>
                </div>

                {selectedCalendarDate && (
                  <button
                    onClick={() => setSelectedCalendarDate(null)}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-xs font-bold text-stone-600 dark:text-stone-400 hover:text-amber-600 transition-colors"
                  >
                    Xem cả tháng
                  </button>
                )}
              </div>

              {eventsInCurrentMonth.length === 0 ? (
                <div className="py-6 text-center text-xs font-bold text-stone-400 space-y-1">
                  <p>Không có mốc nghỉ lễ hay sự kiện nào trong khoảng thời gian này.</p>
                  {canManage && (
                    <button
                      onClick={() => openCreateModal(selectedCalendarDate || undefined)}
                      className="text-amber-600 hover:underline pt-1 text-xs font-black inline-block"
                    >
                      + Bấm vào đây để thêm mốc mới
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {eventsInCurrentMonth.map((m) => {
                    const config = getEventConfig(m.type);
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedEventDetail(m)}
                        className="p-3.5 sm:p-4 rounded-xl border border-stone-200/80 dark:border-white/10 bg-stone-50/50 dark:bg-stone-800/30 hover:border-amber-500/40 transition-all cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[11px] font-black ${config.bg} ${config.text} ${config.border}`}
                          >
                            <span>{config.icon}</span>
                            <span>{config.label}</span>
                          </span>

                          {canManage && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(m);
                                }}
                                className="p-1.5 rounded-lg border border-stone-200/80 text-stone-600 hover:text-amber-600 bg-white dark:bg-stone-800"
                                title="Sửa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  requestDeleteEvent(m);
                                }}
                                className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 bg-white dark:bg-stone-800"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <h4 className="text-xs sm:text-sm font-black text-stone-900 dark:text-white leading-snug">
                          {m.title}
                        </h4>

                        <div className="flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400">
                          <span>📅</span>
                          <span>
                            {formatDateVi(m.startDate)}
                            {m.endDate ? ` → ${formatDateVi(m.endDate)}` : ''}
                          </span>
                        </div>

                        {m.description && (
                          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed pt-0.5">
                            {m.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Event Detail Dialog Modal with Edit & Delete Actions */}
        {selectedEventDetail && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div
              className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[88dvh] my-auto animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-stone-200/80 dark:border-white/10 bg-stone-50/50 dark:bg-stone-800/30 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getEventConfig(selectedEventDetail.type).icon}</span>
                  <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-tight">
                    Chi tiết Mốc lịch
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedEventDetail(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1">
                <div>
                  <h4 className="text-sm sm:text-base font-black text-stone-900 dark:text-white leading-snug">
                    {selectedEventDetail.title}
                  </h4>
                  <span
                    className={`inline-block mt-1 px-3 py-1 rounded-lg font-black text-xs ${
                      getEventConfig(selectedEventDetail.type).bg
                    } ${getEventConfig(selectedEventDetail.type).text}`}
                  >
                    {selectedEventDetail.badge || selectedEventDetail.type}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-white/5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-400">Thời gian:</span>
                    <span className="font-black text-amber-600 dark:text-amber-400">
                      {formatDateVi(selectedEventDetail.startDate)}
                      {selectedEventDetail.endDate
                        ? ` → ${formatDateVi(selectedEventDetail.endDate)}`
                        : ''}
                    </span>
                  </div>
                </div>

                {selectedEventDetail.description && (
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed pt-1">
                    {selectedEventDetail.description}
                  </p>
                )}
              </div>

              {/* Actions Bar */}
              <div className="flex items-center justify-between p-3.5 sm:p-4 border-t border-stone-200/80 dark:border-white/10 bg-stone-50/50 dark:bg-stone-800/30 shrink-0">
                <div>
                  {canManage && (
                    <button
                      onClick={() => requestDeleteEvent(selectedEventDetail)}
                      className="px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {canManage && (
                    <button
                      onClick={() => openEditModal(selectedEventDetail)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white text-xs font-black uppercase tracking-wider shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Sửa</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedEventDetail(null)}
                    className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add / Edit Modal for Admins */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div
              className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[88dvh] my-auto animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-stone-200/80 dark:border-white/10 bg-stone-50/50 dark:bg-stone-800/30 shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 font-bold">
                    📅
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-stone-900 dark:text-white uppercase tracking-tight">
                    {modalMode === 'edit' ? 'Sửa Mốc Sự kiện' : 'Thêm Ngày Nghỉ / Mốc Học Kỳ'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitEvent} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
                  <div>
                    <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                      Tên ngày nghỉ / Mốc sự kiện <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ví dụ: Nghỉ Lễ 30/4 - 1/5 / Khai giảng HK2"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/80 dark:border-white/10 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                        Phân loại
                      </label>
                      <select
                        value={formData.event_type}
                        onChange={(e) => {
                          const newType = e.target.value;
                          setFormData({
                            ...formData,
                            event_type: newType,
                            color: EVENT_TYPE_MAP[newType]?.defaultColor || formData.color,
                          });
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/80 dark:border-white/10 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-bold focus:outline-hidden"
                      >
                        <option value="holiday">🏖️ Nghỉ lễ / Nghỉ Tết</option>
                        <option value="academic">🎓 Mốc Học kỳ (Bắt đầu / Kết thúc)</option>
                        <option value="exam">📝 Ôn thi & Kiểm tra trên trường</option>
                        <option value="general">📌 Thông báo chung</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                        Ngày bắt đầu <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/80 dark:border-white/10 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-bold focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                        Đến ngày (tuỳ chọn)
                      </label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/80 dark:border-white/10 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-bold focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                        Màu hiển thị
                      </label>
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        {COLOR_PRESETS.map((c) => (
                          <button
                            type="button"
                            key={c}
                            onClick={() => setFormData({ ...formData, color: c })}
                            className={`w-6 h-6 shrink-0 aspect-square rounded-full transition-transform ${
                              formData.color === c
                                ? 'scale-125 ring-2 ring-amber-500 ring-offset-2'
                                : 'hover:scale-110'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                      Ghi chú / Hướng dẫn học viên
                    </label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ví dụ: Học sinh nghỉ học từ thứ Năm đến hết Chủ nhật, thứ Hai đi học lại bình thường..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/80 dark:border-white/10 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs font-medium focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 p-3.5 sm:p-4 border-t border-stone-200/80 dark:border-white/10 bg-stone-50/50 dark:bg-stone-800/30 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-stone-200/80 text-xs font-bold text-stone-600 hover:bg-stone-100"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <span>{modalMode === 'edit' ? 'Lưu thay đổi' : 'Thêm vào Lịch'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div
              className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-white/10 shadow-2xl p-5 space-y-4 my-auto animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 font-bold">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-tight">
                    Xác nhận xóa mốc
                  </h3>
                  <p className="text-xs text-stone-400">Hành động này không thể hoàn tác</p>
                </div>
              </div>

              <p className="text-xs text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800/40 p-3 rounded-xl border border-stone-200/60 dark:border-white/5">
                Bạn có chắc muốn xóa mốc{' '}
                <span className="font-bold text-stone-900 dark:text-white">
                  "{deleteTarget.title}"
                </span>{' '}
                khỏi lịch trung tâm?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="px-3.5 py-2 rounded-xl border border-stone-200/80 text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang xóa...</span>
                    </>
                  ) : (
                    <span>Xác nhận xóa</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
