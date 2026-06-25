'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@/contexts/I18nContext';
import { useProfile } from '@/hooks/useProfile';
import { usePermissions } from '@/hooks/usePermissions';
import { useSwipe } from '@/hooks/useSwipe';
import { apiFetch } from '@/lib/api/client';
import { getStartOfWeek, isToday, getWeekDates, formatDateISO } from '@/lib/utils/date';
import {
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Link as LinkIcon,
} from 'lucide-react';
import Link from 'next/link';
import { Button, Badge, LoadingState, Alert, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';

interface TimetableSlot {
  id: string;
  class_id: string;
  student_id?: string;
  subject: { id: string; name: string; code: string } | null;
  teacher: { id: string; full_name: string } | null;
  student?: { id: string; full_name: string } | null;
  class?: { id: string; name: string } | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  notes: string | null;
  weekly_note?: string | null;
  has_weekly_note?: boolean;
}

interface ClassInfo {
  id: string;
  name: string;
}

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

const START_HOUR = 7;
const END_HOUR = 22;
const HOUR_SLOTS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

const SUBJECT_THEMES: Record<
  string,
  { bg: string; border: string; text: string; dot: string; shadow: string }
> = {
  MATH: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-600',
    dot: 'bg-emerald-500',
    shadow: 'shadow-emerald-500/5',
  },
  LIT: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-600',
    dot: 'bg-amber-500',
    shadow: 'shadow-amber-500/5',
  },
  ENG: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-600',
    dot: 'bg-blue-500',
    shadow: 'shadow-blue-500/5',
  },
  PHY: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    text: 'text-orange-600',
    dot: 'bg-orange-500',
    shadow: 'shadow-orange-500/5',
  },
  CHEM: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    text: 'text-rose-600',
    dot: 'bg-rose-500',
    shadow: 'shadow-rose-500/5',
  },
  default: {
    bg: 'bg-stone-500/10',
    border: 'border-stone-500/20',
    text: 'text-stone-600',
    dot: 'bg-stone-500',
    shadow: 'shadow-stone-500/5',
  },
};

export default function MySchedulePage() {
  const { t } = useTranslation();
  const { profile, loading: profileLoading } = useProfile();
  const { isAdmin, isTeacher, isStudent } = usePermissions();
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  const fetchMySchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const weekStartStr = formatDateISO(getStartOfWeek(currentWeek));

      const response = await apiFetch(`/api/timetable/my?week_start_date=${weekStartStr}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to fetch schedule');
      } else {
        setSlots(data.slots || []);
        setClasses(data.classes || []);
      }

      const year = currentWeek.getFullYear();
      const month = currentWeek.getMonth() + 1;
      const eventsRes = await apiFetch(`/api/calendar?year=${year}&month=${month}`);
      const eventsData = await eventsRes.json();
      if (eventsData.events) {
        setEvents(eventsData.events);
      }
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profileLoading) return;
    fetchMySchedule();
  }, [profileLoading, isAdmin, currentWeek]);

  const weekDates = useMemo(() => getWeekDates(currentWeek), [currentWeek]);
  const DAYS = useMemo(
    () => [
      t('timetable.monday'),
      t('timetable.tuesday'),
      t('timetable.wednesday'),
      t('timetable.thursday'),
      t('timetable.friday'),
      t('timetable.saturday'),
      t('timetable.sunday'),
    ],
    [t]
  );

  const getTheme = (code?: string) => {
    return SUBJECT_THEMES[code || ''] || SUBJECT_THEMES.default;
  };

  const getPosition = (timeStr: string) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (hours === undefined || minutes === undefined) return 0;
    const totalMinutes = (hours - START_HOUR) * 60 + minutes;
    return (totalMinutes / 60) * 100;
  };

  const getDuration = (start: string, end: string) => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    if (sh === undefined || sm === undefined || eh === undefined || em === undefined) return 0;
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    return ((endMinutes - startMinutes) / 60) * 100;
  };

  const calculateOverlap = (daySlots: TimetableSlot[]) => {
    const sorted = [...daySlots].sort((a, b) =>
      (a.start_time || '').localeCompare(b.start_time || '')
    );
    const groups: TimetableSlot[][] = [];

    sorted.forEach((slot) => {
      let placed = false;
      for (const group of groups) {
        const overlaps = group.some((s) => {
          const s1 = s.start_time || '';
          const e1 = s.end_time || '';
          const s2 = slot.start_time || '';
          const e2 = slot.end_time || '';
          if (!s1 || !s2) return false;
          return s1 < e2 && s2 < e1;
        });
        if (overlaps) {
          group.push(slot);
          placed = true;
          break;
        }
      }
      if (!placed) groups.push([slot]);
    });

    const slotMetadata = new Map<string, { width: number; offset: number }>();
    groups.forEach((group) => {
      group.forEach((slot, index) => {
        slotMetadata.set(slot.id, {
          width: 100 / group.length,
          offset: (100 / group.length) * index,
        });
      });
    });

    return slotMetadata;
  };

  const handlePreviousWeek = () => {
    const prev = new Date(currentWeek);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeek(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeek);
    next.setDate(next.getDate() + 7);
    setCurrentWeek(next);
  };

  const swipeHandlers = useSwipe({
    onSwipedRight: handlePreviousWeek,
    onSwipedLeft: handleNextWeek,
  });

  if (profileLoading) return <LoadingState message={t('common.loading')} />;

  const titleText = isAdmin
    ? t('timetable.my.title')
    : isStudent
      ? t('timetable.my.student')
      : isTeacher
        ? t('timetable.my.teaching')
        : t('timetable.title');

  return (
    <div className="min-h-screen bg-transparent py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 glass-premium p-6 md:p-10 rounded-[40px] border border-stone-200/50 dark:border-white/5 shadow-2xl relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-red-500/10 rounded-2xl">
                <CalendarDays className="w-6 h-6 text-red-600 dark:text-red-500" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 dark:text-red-500 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20 shadow-sm">
                {t('timetable.weeklySchedule')}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-stone-900 dark:text-stone-100">
              {titleText}
            </h1>
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mt-3 max-w-lg leading-relaxed">
              {isStudent ? t('timetable.my.studentDesc') : t('timetable.my.description')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-stone-100/50 dark:bg-white/5 p-2 rounded-[32px] border border-stone-200/50 dark:border-white/5 backdrop-blur-sm relative z-10">
            <div className="flex items-center gap-2 px-3">
              <Link
                href="/dashboard/calendar"
                className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-stone-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <LinkIcon className="w-3 h-3" />
                {t('timetable.my.academicCalendar')}
              </Link>
              {isAdmin && (
                <>
                  <span className="text-stone-300 dark:text-stone-700">•</span>
                  <Link
                    href="/dashboard/timetable"
                    className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-stone-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <LinkIcon className="w-3 h-3" />
                    {t('timetable.my.scheduling')}
                  </Link>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-white/5 p-1 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl h-8 px-4 font-bold uppercase tracking-widest text-[10px]"
                onClick={() => setCurrentWeek(new Date())}
              >
                {t('timetable.my.today')}
              </Button>
              <div className="flex items-center gap-2 border-l border-stone-200 dark:border-stone-800 pl-2 pr-1">
                <button
                  onClick={handlePreviousWeek}
                  className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300 min-w-[120px] text-center uppercase tracking-widest">
                  {t('timetable.my.month')} {currentWeek.getMonth() + 1} /{' '}
                  {currentWeek.getFullYear()}
                </span>
                <button
                  onClick={handleNextWeek}
                  className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="h-[600px] flex flex-col items-center justify-center gap-4 bg-white/10 dark:bg-white/5 rounded-[32px] border-2 border-dashed border-stone-200 dark:border-white/5 relative overflow-hidden">
            <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
            <span className="text-xs font-bold tracking-widest uppercase text-stone-400">
              {t('timetable.my.syncing')}
            </span>
          </div>
        ) : error ? (
          <Alert variant="danger" title={t('common.error')} className="rounded-2xl p-8 shadow-xl">
            {error}
            <Button variant="ghost" className="mt-4 underline" onClick={fetchMySchedule}>
              {t('common.refresh')}
            </Button>
          </Alert>
        ) : slots.length === 0 ? (
          <div className="bg-white/50 dark:bg-stone-900/50 rounded-[32px] border-2 border-dashed border-stone-200 dark:border-white/5 p-20 shadow-sm text-center">
            <EmptyState
              title={t('timetable.my.empty')}
              description={
                isStudent ? t('timetable.my.emptyStudentDesc') : t('timetable.my.emptyDesc')
              }
              icon={<Calendar className="w-12 h-12 text-stone-300 mb-6" />}
            />
          </div>
        ) : (
          <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl rounded-[32px] shadow-premium-lg border border-stone-100 dark:border-white/5 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <div className="min-w-[1000px] relative">
                {/* Timeline Grid */}
                <div className="absolute inset-0 pt-[80px]">
                  {HOUR_SLOTS.map((hour) => (
                    <div
                      key={hour}
                      className="h-[100px] border-t border-stone-100 dark:border-white/5 flex items-start"
                    >
                      <span className="w-16 text-right pr-4 py-2 text-[10px] font-mono text-stone-400">
                        {hour}:00
                      </span>
                      <div className="flex-1 h-full border-l border-stone-100 dark:border-white/5" />
                    </div>
                  ))}
                </div>

                {/* Days Header */}
                <div className="min-h-[80px] bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-100 dark:border-white/5 sticky top-0 z-30 flex items-stretch py-2">
                  <div className="w-16 shrink-0 flex items-center justify-center border-r border-stone-100 dark:border-white/5">
                    <Clock className="w-4 h-4 text-stone-400" />
                  </div>
                  <div className="flex-1 grid grid-cols-7">
                    {DAYS.map((day, i) => {
                      const date = weekDates[i];
                      if (!date) return null;
                      const today = isToday(date);

                      return (
                        <div
                          key={day}
                          className={cn(
                            'flex flex-col items-center justify-center border-l border-stone-100 dark:border-white/5 transition-colors',
                            today ? 'bg-emerald-500/5 shadow-inner' : ''
                          )}
                        >
                          <span
                            className={cn(
                              'text-[10px] font-bold uppercase tracking-widest mb-1',
                              today ? 'text-emerald-600' : 'text-stone-400'
                            )}
                          >
                            {day}
                          </span>
                          <div
                            className={cn(
                              'text-lg font-bold w-10 h-10 flex items-center justify-center rounded-xl transition-all',
                              today
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                                : 'text-stone-900 dark:text-stone-100'
                            )}
                          >
                            {date.getDate()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Slots Body */}
                <div className="relative z-10 h-[calc(100px*16)]">
                  <div className="flex pl-16 h-full">
                    {DAYS.map((_, dayIndex) => {
                      const daySlots = slots.filter((s) => s.day_of_week === dayIndex);
                      const overlapData = calculateOverlap(daySlots);

                      return (
                        <div
                          key={dayIndex}
                          className="flex-1 relative border-l border-stone-100 dark:border-white/5 group hover:bg-stone-50/30 dark:hover:bg-white/2 transition-colors"
                        >
                          {daySlots.map((slot) => {
                            const top = getPosition(slot.start_time);
                            const height = getDuration(slot.start_time, slot.end_time);
                            const theme = getTheme(slot.subject?.code);
                            const meta = overlapData.get(slot.id) || { width: 100, offset: 0 };

                            return (
                              <div
                                key={slot.id}
                                className="absolute transition-all duration-300 z-10 p-1 group/slot"
                                style={{
                                  top: `${(top / 60) * 100}px`,
                                  height: `${(height / 60) * 100}px`,
                                  left: `${meta.offset}%`,
                                  width: `${meta.width}%`,
                                  minHeight: '60px',
                                }}
                              >
                                <div
                                  className={cn(
                                    'w-full h-full p-3 rounded-2xl border bg-white dark:bg-stone-800/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all group-hover/slot:scale-[1.02] flex flex-col',
                                    theme?.bg || '',
                                    theme?.border || ''
                                  )}
                                >
                                  <div className="flex items-center gap-2 mb-1.5 shrink-0">
                                    <div
                                      className={cn(
                                        'w-1.5 h-1.5 rounded-full shrink-0',
                                        theme?.dot || ''
                                      )}
                                    />
                                    <span
                                      className={cn(
                                        'text-[9px] font-black uppercase tracking-[0.15em] truncate',
                                        theme?.text || ''
                                      )}
                                    >
                                      {slot.subject?.code || 'BH-EDU'}
                                    </span>
                                    {slot.student_id && (
                                      <Badge
                                        variant="danger"
                                        className="h-4 px-1 text-[7px] uppercase font-black shrink-0"
                                      >
                                        {t('timetable.my.tutoring')}
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-tight mb-2 line-clamp-2 shrink-0">
                                    {slot.subject?.name}
                                  </div>

                                  <div className="space-y-1.5 mt-auto">
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                                      <Clock className="w-3 h-3" />
                                      <span>
                                        {slot.start_time} - {slot.end_time}
                                      </span>
                                    </div>
                                    {slot.room && (
                                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                                        <MapPin className="w-3 h-3" />
                                        <span className="truncate">{slot.room}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 p-4 glass-premium rounded-3xl border border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shadow-sm bg-blue-500" />
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
              {t('timetable.my.student')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shadow-sm bg-rose-500" />
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
              {t('timetable.my.tutoring')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
