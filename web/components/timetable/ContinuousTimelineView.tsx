'use client';

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Clock, MapPin, Users, Edit3, Trash2, Plus, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDisplayName } from '@/lib/utils/names';
import { TimetableSlot } from '@/lib/timetable/types';
import { DAYS } from '@/lib/timetable/constants';
import {
  getDayWorkingRanges,
  generateTimeTicks,
  calculateSideBySidePositions,
  timeToMinutes,
} from '@/lib/timetable/timeline-utils';

import { getSubjectColor } from '@/lib/timetable/subject-colors';

interface ContinuousTimelineViewProps {
  slots: TimetableSlot[];
  weekDates: Date[];
  onEditSlot: (slot: TimetableSlot) => void;
  onDeleteSlot?: (slotId: string) => void;
  onCreateSlot: (dayIndex: number, period?: any, room?: string) => void;
  onMoveSlot?: (
    slotId: string,
    newDay: number,
    newStartTime: string,
    newEndTime: string,
    newRoom: string
  ) => void;
  viewMode: 'room' | 'class' | 'teacher' | 'tutoring';
  isLoading?: boolean;
  searchQuery?: string;
  selectedCampus?: string;
  selectedClass?: string;
  selectedTeacher?: string;
}

const PX_PER_MINUTE = 1.6; // Scale factor for timeline height (1.6px = 1 min -> 15min = 24px)

export default function ContinuousTimelineView({
  slots,
  weekDates,
  onEditSlot,
  onDeleteSlot,
  onCreateSlot,
  viewMode,
  isLoading,
  searchQuery,
  selectedCampus,
  selectedClass,
  selectedTeacher,
}: ContinuousTimelineViewProps) {
  const [selectedDay, setSelectedDay] = useState<number>(0); // 0 = Mon, 6 = Sun

  // Compute working ranges for selected day
  const workingRanges = useMemo(() => {
    const jsDay = selectedDay === 6 ? 0 : selectedDay + 1;
    return getDayWorkingRanges(jsDay);
  }, [selectedDay]);

  // Filter slots for the selected day + contextual filters
  const daySlots = useMemo(() => {
    let result = slots.filter((s) => s.day_of_week === selectedDay);

    if (selectedClass) {
      result = result.filter((s) => s.class_id === selectedClass || s.class?.id === selectedClass);
    }
    if (selectedTeacher) {
      result = result.filter(
        (s) => s.teacher_id === selectedTeacher || s.teacher?.id === selectedTeacher
      );
    }
    if (selectedCampus && selectedCampus !== 'all') {
      result = result.filter(
        (s) => !s.room || s.room.toLowerCase().includes(selectedCampus.toLowerCase())
      );
    }

    return result;
  }, [slots, selectedDay, selectedClass, selectedTeacher, selectedCampus]);

  const getSlotColorClasses = (slot: TimetableSlot) => {
    const colors = getSubjectColor(slot.subject?.name, !slot.room || slot.room === 'Linh hoạt');
    return `${colors.bg} ${colors.border} ${colors.borderLeft} border-l-[4px]`;
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-[28px] border border-stone-200/80 dark:border-white/10 shadow-xl overflow-hidden">
      {/* Day Navigation Tabs */}
      <div className="p-4 bg-stone-50/80 dark:bg-stone-950/50 border-b border-stone-200/70 dark:border-white/5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          {DAYS.map((dayName, idx) => {
            const date = weekDates[idx];
            const isSelected = selectedDay === idx;
            const isToday = date && new Date().toDateString() === date.toDateString();
            const countForDay = slots.filter((s) => s.day_of_week === idx).length;

            return (
              <button
                key={dayName}
                onClick={() => setSelectedDay(idx)}
                className={cn(
                  'px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 border',
                  isSelected
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20 scale-105'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200/80 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-stone-700',
                  isToday &&
                    !isSelected &&
                    'ring-2 ring-amber-500/40 text-amber-600 dark:text-amber-400'
                )}
              >
                <span>{dayName}</span>
                {date && <span className="opacity-75 font-normal">({format(date, 'dd/MM')})</span>}
                {countForDay > 0 && (
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-full text-[10px] font-black',
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                    )}
                  >
                    {countForDay}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-medium">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Trục 15 phút (Side-by-side Timeline)</span>
        </div>
      </div>

      {/* Timeline Grid Body */}
      <div className="p-4 sm:p-6 space-y-8 min-h-[500px]">
        {workingRanges.map((range, rangeIdx) => {
          const startMin = range.startHour * 60;
          const endMin = range.endHour * 60;
          const totalDurationMin = endMin - startMin;
          const totalHeightPx = totalDurationMin * PX_PER_MINUTE;
          const timeTicks = generateTimeTicks(range.startHour, range.endHour, 15);

          // Get slots that fall inside this time range
          const rangeSlots = daySlots.filter((slot) => {
            const slotStart = timeToMinutes(slot.start_time);
            return slotStart >= startMin && slotStart < endMin;
          });

          // Calculate positions with Side-by-Side overlapping logic
          const positionedSlots = calculateSideBySidePositions(rangeSlots, startMin, PX_PER_MINUTE);
          const maxRangeCols = positionedSlots.reduce(
            (max, s) => Math.max(max, s.totalCols || 1),
            1
          );

          return (
            <div key={rangeIdx} className="space-y-3">
              {/* Session Header */}
              <div className="flex items-center justify-between bg-stone-100 dark:bg-stone-800/60 px-4 py-2 rounded-xl border border-stone-200/50 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="font-black text-xs text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                    {range.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onCreateSlot(selectedDay, {
                      start: `${Math.floor(range.startHour)}:00`,
                      end: `${Math.floor(range.startHour + 1)}:30`,
                    })
                  }
                  className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm tiết học
                </button>
              </div>

              {/* Timeline Chart Box with horizontal scroll safety for multi-column overlap */}
              <div className="overflow-x-auto custom-scrollbar -mx-1 px-1 sm:mx-0 sm:px-0">
                <div
                  className="relative border border-stone-200/80 dark:border-white/10 rounded-2xl bg-stone-50/50 dark:bg-stone-950/30 overflow-hidden transition-all"
                  style={{
                    height: `${totalHeightPx}px`,
                    minWidth:
                      maxRangeCols >= 2 ? `${Math.max(460, 72 + maxRangeCols * 180)}px` : '100%',
                  }}
                >
                  {/* 15-Minute Grid Lines & Ticks */}
                  {timeTicks.map((tickStr) => {
                    const tickMin = timeToMinutes(tickStr);
                    const topPx = (tickMin - startMin) * PX_PER_MINUTE;
                    const isHourTick = tickStr.endsWith(':00');
                    const isHalfHourTick = tickStr.endsWith(':30');

                    return (
                      <React.Fragment key={tickStr}>
                        {/* Horizontal Grid Line */}
                        <div
                          className={cn(
                            'absolute left-16 right-0 border-b pointer-events-none transition-colors',
                            isHourTick
                              ? 'border-stone-300 dark:border-stone-700/80'
                              : isHalfHourTick
                                ? 'border-stone-200/80 dark:border-stone-800/60 border-dashed'
                                : 'border-stone-100 dark:border-stone-900/40 border-dotted'
                          )}
                          style={{ top: `${topPx}px` }}
                        />

                        {/* Time Label on Y-axis */}
                        {(isHourTick || isHalfHourTick) && (
                          <div
                            className="absolute left-2 text-[10px] font-bold text-stone-400 dark:text-stone-500 select-none -translate-y-1/2"
                            style={{ top: `${topPx}px` }}
                          >
                            {tickStr}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* Y-axis Separator */}
                  <div className="absolute left-16 top-0 bottom-0 w-[1px] bg-stone-200 dark:bg-stone-800" />

                  {/* Render Side-by-Side Positioned Slots */}
                  {positionedSlots.map(
                    ({ slot, topPx, heightPx, leftPercent, widthPercent, totalCols }) => {
                      const isShortSlot = heightPx < 50;
                      const isNarrowSlot = (totalCols || 1) >= 2;
                      const query = (searchQuery || '').trim().toLowerCase();
                      const isMatch =
                        !query ||
                        [
                          slot.class?.name,
                          slot.subject?.name,
                          slot.subject?.code,
                          getDisplayName(slot.teacher),
                          getDisplayName(slot.student),
                          slot.room,
                        ].some((field) => field?.toLowerCase().includes(query));

                      const studentName = getDisplayName(slot.student);
                      const teacherName = getDisplayName(slot.teacher);
                      const titleName =
                        viewMode === 'tutoring'
                          ? studentName || slot.class?.name || 'Học sinh'
                          : slot.class?.name || studentName || 'Tiết học';

                      return (
                        <div
                          key={slot.id}
                          onClick={() => onEditSlot(slot)}
                          className={cn(
                            'absolute rounded-2xl border backdrop-blur-md transition-all duration-200 cursor-pointer overflow-hidden group shadow-xs hover:shadow-md hover:z-20',
                            isNarrowSlot ? 'p-2 sm:p-2.5' : 'p-2.5 sm:p-3',
                            getSlotColorClasses(slot),
                            query &&
                              isMatch &&
                              'ring-2 ring-amber-400 shadow-lg shadow-amber-500/30 scale-[1.01] z-30',
                            query && !isMatch && 'opacity-30 grayscale-[50%]'
                          )}
                          style={{
                            top: `${topPx + 2}px`,
                            height: `${heightPx - 4}px`,
                            left: `calc(4.2rem + (100% - 4.5rem) * ${leftPercent / 100})`,
                            width: `calc((100% - 4.5rem) * ${widthPercent / 100} - 4px)`,
                          }}
                          title={`${titleName} | ${slot.start_time?.substring(0, 5)} - ${slot.end_time?.substring(0, 5)} | ${slot.subject?.name || ''} | ${slot.room || ''} | ${teacherName || ''}`}
                        >
                          <div className="flex flex-col h-full justify-between gap-1 min-w-0">
                            {/* Top: Time & Edit Controls */}
                            <div className="min-w-0">
                              <div className="flex items-center justify-between gap-1 min-w-0 mb-0.5">
                                <div className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-600 dark:text-stone-300 opacity-90 leading-none whitespace-nowrap">
                                  <Clock className="w-2.5 h-2.5 shrink-0 text-amber-500/80" />
                                  <span>
                                    {slot.start_time?.substring(0, 5)} -{' '}
                                    {slot.end_time?.substring(0, 5)}
                                  </span>
                                </div>

                                {/* Actions on Desktop Hover */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditSlot(slot);
                                    }}
                                    className="p-1 rounded-md bg-white/90 dark:bg-stone-800/90 text-stone-600 hover:text-amber-600 shadow-xs cursor-pointer"
                                    title="Chỉnh sửa ca học"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  {onDeleteSlot && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteSlot(slot.id);
                                      }}
                                      className="p-1 rounded-md bg-white/90 dark:bg-stone-800/90 text-stone-600 hover:text-red-600 shadow-xs cursor-pointer"
                                      title="Xóa ca học"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Primary Title (Student or Class Name) with multi-line clamping */}
                              <h4
                                className={cn(
                                  'font-bold text-stone-900 dark:text-white leading-snug min-w-0 break-words',
                                  isNarrowSlot ? 'text-xs' : 'text-xs sm:text-sm',
                                  heightPx > 65 ? 'line-clamp-2' : 'truncate'
                                )}
                              >
                                {titleName}
                              </h4>

                              {/* Subject Badge (if available and slot is tall enough) */}
                              {slot.subject?.name && heightPx > 75 && (
                                <div className="mt-1 flex items-center gap-1">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-white/80 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-white/10 truncate max-w-full">
                                    {slot.subject.name}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Bottom: Location & Teacher */}
                            {!isShortSlot && (
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-stone-600 dark:text-stone-400 pt-1 border-t border-black/5 dark:border-white/5 min-w-0">
                                {slot.room && (
                                  <span className="inline-flex items-center gap-1 font-semibold shrink-0">
                                    <MapPin className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                    <span className="truncate max-w-[100px]">{slot.room}</span>
                                  </span>
                                )}
                                {teacherName && (
                                  <span className="inline-flex items-center gap-1 font-medium min-w-0 max-w-full">
                                    <Users className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                                    <span className="truncate">{teacherName}</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}

                  {/* Empty State Overlay if no slots in range */}
                  {positionedSlots.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                        Chưa có tiết học trong khung giờ này
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
