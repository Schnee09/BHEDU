'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Clock,
  MapPin,
  Users,
  GraduationCap,
  Sparkles,
  ClipboardList,
  Edit3,
  Trash2,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDisplayName } from '@/lib/utils/names';
import { TimetableSlot } from '@/lib/timetable/types';
import { DAYS, ALL_SESSIONS } from '@/lib/timetable/constants';
import { getSubjectColor } from '@/lib/timetable/subject-colors';

interface WeeklyGridMatrixProps {
  slots: TimetableSlot[];
  weekDates: Date[];
  sessions?: Array<{
    id: number;
    label: string;
    time: string;
    start: string;
    end: string;
    days?: number[];
  }>;
  onEditSlot: (slot: TimetableSlot) => void;
  onDeleteSlot: (slotId: string) => void;
  onCreateSlot: (dayIndex: number, session: any, room?: string) => void;
  onMoveSlot?: (
    slotId: string,
    newDay: number,
    newStartTime: string,
    newEndTime: string,
    newRoom: string
  ) => void;
  onUpdateStatus?: (
    slotId: string,
    newStatus: 'scheduled' | 'completed' | 'cancelled' | 'makeup'
  ) => void;
  canEdit?: boolean;
  selectedCampus?: string;
  selectedClass?: string;
  selectedTeacher?: string;
  searchQuery?: string;
  statusFilter?: string;
}

export default function WeeklyGridMatrix({
  slots,
  weekDates,
  sessions = ALL_SESSIONS,
  onEditSlot,
  onDeleteSlot,
  onCreateSlot,
  onMoveSlot,
  onUpdateStatus,
  canEdit = true,
  selectedCampus,
  selectedClass,
  selectedTeacher,
  searchQuery,
  statusFilter,
}: WeeklyGridMatrixProps) {
  // Current time tracker for live session indicators
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [todayDayIndex, setTodayDayIndex] = useState<number>(-1);

  // Dragging states
  const [draggedSlotId, setDraggedSlotId] = useState<string | null>(null);

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTimeStr(`${hours}:${minutes}`);

      const jsDay = now.getDay(); // 0 = CN, 1 = T2...
      const appDayIdx = jsDay === 0 ? 6 : jsDay - 1;
      setTodayDayIndex(appDayIdx);
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter slots: strictly regular classes
  const filteredSlots = useMemo(() => {
    let result = slots.filter((s) => s.room && s.room !== 'Linh hoạt' && !s.student_id);

    // Filter by Campus
    if (selectedCampus && selectedCampus !== 'all') {
      result = result.filter((s) => {
        if (!s.room) return true; // flexible
        return s.room.toLowerCase().includes(selectedCampus.toLowerCase());
      });
    }

    // Filter by Class
    if (selectedClass) {
      result = result.filter((s) => s.class_id === selectedClass || s.class?.id === selectedClass);
    }

    // Filter by Teacher
    if (selectedTeacher) {
      result = result.filter(
        (s) => s.teacher_id === selectedTeacher || s.teacher?.id === selectedTeacher
      );
    }

    // Filter by Status
    if (statusFilter) {
      result = result.filter((s) => (s.status || 'scheduled') === statusFilter);
    }

    // Filter by Search Query
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((s) => {
        const subject = s.subject?.name?.toLowerCase() || '';
        const teacher = s.teacher?.full_name?.toLowerCase() || '';
        const className = s.class?.name?.toLowerCase() || '';
        const student = s.student?.full_name?.toLowerCase() || '';
        const room = s.room?.toLowerCase() || '';
        return (
          subject.includes(q) ||
          teacher.includes(q) ||
          className.includes(q) ||
          student.includes(q) ||
          room.includes(q)
        );
      });
    }

    return result;
  }, [slots, selectedCampus, selectedClass, selectedTeacher, statusFilter, searchQuery]);

  // Check if a slot is currently active (Live)
  const isLiveSlot = (dayIndex: number, startTime: string, endTime: string) => {
    if (dayIndex !== todayDayIndex || !currentTimeStr) return false;
    const sStart = startTime.substring(0, 5);
    const sEnd = endTime.substring(0, 5);
    return currentTimeStr >= sStart && currentTimeStr <= sEnd;
  };

  // Drag-and-drop handlers
  const handleDragStart = (e: React.DragEvent, slot: TimetableSlot) => {
    if (!canEdit) return;
    setDraggedSlotId(slot.id);
    e.dataTransfer.setData('text/plain', slot.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedSlotId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dayIndex: number, session: any) => {
    e.preventDefault();
    if (!canEdit || !onMoveSlot) return;

    const slotId = e.dataTransfer.getData('text/plain') || draggedSlotId;
    if (!slotId) return;

    const currentSlot = slots.find((s) => s.id === slotId);
    if (!currentSlot) return;

    onMoveSlot(
      slotId,
      dayIndex,
      session.start,
      session.end,
      currentSlot.room || ''
    );
    setDraggedSlotId(null);
  };

  return (
    <div className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-xl border border-stone-200/70 dark:border-white/5 transition-all">
      {/* Table Scrollable Container */}
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)] relative custom-scrollbar">
        <table className="w-full border-separate border-spacing-0 min-w-[1100px]">
          {/* Sticky Header: Ca học & Các ngày trong tuần */}
          <thead className="sticky top-0 z-30">
            <tr className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md">
              {/* Ca học Column Header */}
              <th className="p-4 border-b border-r border-stone-200/70 dark:border-white/5 text-center text-[11px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest w-28 sticky left-0 z-40 bg-white/95 dark:bg-stone-900/95">
                <div className="flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ca Học</span>
                </div>
              </th>

              {/* 7 Days Headers */}
              {DAYS.map((dayName, idx) => {
                const date = weekDates[idx];
                const isToday = idx === todayDayIndex;
                const countForDay = filteredSlots.filter((s) => s.day_of_week === idx).length;

                return (
                  <th
                    key={dayName}
                    className={cn(
                      'p-3.5 border-b border-r border-stone-200/70 dark:border-white/5 text-center min-w-[160px] transition-all',
                      isToday
                        ? 'bg-amber-500/10 dark:bg-amber-500/15 border-b-2 border-b-amber-500'
                        : 'bg-transparent'
                    )}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={cn(
                          'text-sm font-black uppercase tracking-tight',
                          isToday ? 'text-amber-600 dark:text-amber-400' : 'text-stone-800 dark:text-stone-100'
                        )}
                      >
                        {dayName}
                      </span>
                      {isToday && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white animate-pulse">
                          Hôm nay
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                        {date
                          ? date.toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                            })
                          : ''}
                      </span>
                      {countForDay > 0 && (
                        <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                          {countForDay} tiết
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body: Các ca học */}
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {sessions.map((session) => (
              <tr key={session.id} className="group/row">
                {/* Session Label & Time Sticky Column */}
                <td className="p-3 border-b border-r border-stone-200/70 dark:border-white/5 text-center sticky left-0 z-20 bg-white/95 dark:bg-stone-900/95 shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
                  <div className="font-black text-amber-600 dark:text-amber-400 text-sm leading-none">
                    {session.label}
                  </div>
                  <div className="text-[10px] text-stone-600 dark:text-stone-300 font-black tracking-tighter mt-1">
                    {session.time || `${session.start} - ${session.end}`}
                  </div>
                </td>

                {/* 7 Day Cells */}
                {DAYS.map((_, dayIndex) => {
                  const isAvailable = session.days?.includes(dayIndex) ?? true;
                  const cellSlots = isAvailable
                    ? filteredSlots.filter(
                        (s) =>
                          s.day_of_week === dayIndex &&
                          s.start_time?.substring(0, 5) === session.start
                      )
                    : [];

                  const isToday = dayIndex === todayDayIndex;

                  return (
                    <td
                      key={dayIndex}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, dayIndex, session)}
                      className={cn(
                        'p-2.5 border-b border-r border-stone-200/70 dark:border-white/5 min-h-[110px] h-auto align-top transition-all relative',
                        isToday && 'bg-amber-500/[0.02] dark:bg-amber-500/[0.04]',
                        !isAvailable ? 'bg-stone-500/5 dark:bg-white/[0.02] opacity-35' : 'hover:bg-stone-500/[0.03]'
                      )}
                    >
                      {!isAvailable ? (
                        <div className="h-full min-h-[70px] rounded-2xl border border-stone-200/40 dark:border-white/5 flex items-center justify-center">
                          <span className="text-[10px] text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest">
                            Nghỉ
                          </span>
                        </div>
                      ) : cellSlots.length > 0 ? (
                        <div className="space-y-2">
                          {cellSlots.map((slot) => {
                            const isTutoring = !slot.room || slot.room === 'Linh hoạt' || !!slot.student_id;
                            const colors = getSubjectColor(slot.subject?.name, isTutoring);
                            const isLive = isLiveSlot(dayIndex, slot.start_time, slot.end_time);

                            return (
                              <div
                                key={slot.id}
                                draggable={canEdit}
                                onDragStart={(e) => handleDragStart(e, slot)}
                                onDragEnd={handleDragEnd}
                                onClick={() => onEditSlot(slot)}
                                className={cn(
                                  'p-3 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-[0.99] relative group/card',
                                  colors.bg,
                                  colors.border,
                                  colors.borderLeft,
                                  'border-l-[4px]',
                                  draggedSlotId === slot.id && 'opacity-40 scale-95'
                                )}
                              >
                                {/* Live Indicator Badge */}
                                {isLive && (
                                  <div className="absolute -top-1.5 -right-1.5 flex items-center gap-1 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md animate-bounce z-10">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                    Đang học
                                  </div>
                                )}

                                {/* Top Row: Subject Name & Room / Flexible */}
                                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                                  <span
                                    className={cn(
                                      'text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg truncate border',
                                      colors.badge
                                    )}
                                  >
                                    {slot.subject?.name || 'Môn học'}
                                  </span>

                                  {slot.room ? (
                                    <span className="text-[10px] font-black text-stone-600 dark:text-stone-300 bg-white/70 dark:bg-stone-800/80 px-2 py-0.5 rounded-md border border-stone-200/60 dark:border-white/10 shrink-0 flex items-center gap-1">
                                      <MapPin className="w-2.5 h-2.5 text-amber-500" />
                                      {slot.room.replace(/^.*? - /, '')}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded-md shrink-0">
                                      Học kèm
                                    </span>
                                  )}
                                </div>

                                {/* Main Title: Class Name or Student Name */}
                                <div className="font-black text-stone-900 dark:text-stone-100 text-xs line-clamp-1 leading-tight mb-1">
                                  {slot.class?.name || slot.student?.full_name || 'Tiết học'}
                                </div>

                                {/* Teacher Row */}
                                <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400 mt-1.5 pt-1.5 border-t border-stone-200/50 dark:border-white/5">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black text-[9px] flex items-center justify-center shrink-0">
                                      {slot.teacher?.full_name?.charAt(0) || 'G'}
                                    </div>
                                    <span className="font-bold truncate">
                                      {getDisplayName(slot.teacher) || 'Chưa xếp GV'}
                                    </span>
                                  </div>

                                  {(slot.weekly_note || slot.notes) && (
                                    <span title={slot.weekly_note || slot.notes || ''} className="inline-flex shrink-0 ml-1">
                                      <ClipboardList className="w-3 h-3 text-amber-500" />
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* Quick Add Button if slot exists */}
                          {canEdit && (
                            <button
                              onClick={() => onCreateSlot(dayIndex, session)}
                              className="w-full py-1.5 rounded-xl border border-dashed border-stone-200 dark:border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 text-stone-400 hover:text-amber-500 text-[10px] font-bold transition-all flex items-center justify-center gap-1 opacity-0 group-hover/row:opacity-100"
                            >
                              <Plus className="w-3 h-3" /> Thêm lớp
                            </button>
                          )}
                        </div>
                      ) : (
                        /* Empty Slot Interaction */
                        canEdit ? (
                          <div
                            onClick={() => onCreateSlot(dayIndex, session)}
                            className="h-full min-h-[85px] rounded-2xl border-2 border-dashed border-stone-200/70 dark:border-white/5 hover:border-amber-500/50 hover:bg-amber-500/[0.06] cursor-pointer flex flex-col items-center justify-center gap-1 transition-all group/empty"
                          >
                            <Plus className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover/empty:text-amber-500 group-hover/empty:scale-110 transition-all" />
                            <span className="text-[10px] font-black text-stone-400 group-hover/empty:text-amber-600 dark:group-hover/empty:text-amber-400 opacity-0 group-hover/empty:opacity-100 transition-opacity uppercase tracking-wider">
                              + Xếp lịch
                            </span>
                          </div>
                        ) : (
                          <div className="h-full min-h-[85px] rounded-2xl border border-dashed border-stone-200/40 dark:border-white/5" />
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
  );
}
