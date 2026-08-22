'use client';

import React from 'react';
import { Plus, Trash2, Users, MapPin, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDisplayName } from '@/lib/utils/names';
import { TimetableSlot } from '@/lib/timetable/types';
import { DAYS } from '@/lib/timetable/constants';
import { getSlotForRoomCell } from '@/lib/timetable/utils';
import { getSubjectColor } from '@/lib/timetable/subject-colors';

interface RoomGridViewProps {
  slots: TimetableSlot[];
  currentCampus: {
    id: string;
    name: string;
  };
  rooms: string[];
  sessions: any[];
  weekDates: Date[];
  onEditSlot: (slot: TimetableSlot) => void;
  onDeleteSlot: (slotId: string) => void;
  onCreateSlot: (dayIndex: number, session: any, room: string) => void;
  onMoveSlot?: (
    slotId: string,
    newDay: number,
    newStartTime: string,
    newEndTime: string,
    newRoom: string
  ) => void;
  draggingSlotId?: string | null;
  draggingTeacherId?: string | null;
  draggingClassId?: string | null;
  setDraggingSlotId?: (id: string | null) => void;
  setDraggingTeacherId?: (id: string | null) => void;
  setDraggingClassId?: (id: string | null) => void;
}

export default function RoomGridView({
  slots,
  currentCampus,
  rooms,
  sessions,
  weekDates,
  onEditSlot,
  onDeleteSlot,
  onCreateSlot,
  onMoveSlot,
  draggingSlotId,
  draggingTeacherId,
  draggingClassId,
  setDraggingSlotId,
  setDraggingTeacherId,
  setDraggingClassId,
}: RoomGridViewProps) {
  const [selectedDayIndex, setSelectedDayIndex] = React.useState<number>(() => {
    const today = new Date().getDay(); // 0: CN, 1: T2, ..., 6: T7
    return today === 0 ? 6 : today - 1;
  });

  if (!currentCampus) {
    return null;
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-stone-900 rounded-[32px] border border-dashed border-stone-200 dark:border-white/5">
        <p className="text-stone-500 font-bold uppercase tracking-widest text-xs">
          Cơ sở này chưa được cấu hình phòng học.
        </p>
      </div>
    );
  }

  // Debugging: Log slots count in development
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `[RoomGridView] Rendering with ${slots.length} slots for ${currentCampus.name} on day index ${selectedDayIndex}`
    );
  }

  const handleDrop = (e: React.DragEvent, dayIndex: number, session: any, room: string) => {
    e.preventDefault();
    const slotId = e.dataTransfer.getData('text/plain');
    if (slotId && onMoveSlot) {
      onMoveSlot(slotId, dayIndex, session.start, session.end, `${currentCampus.name} - ${room}`);
    }
  };

  return (
    <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl border border-stone-200/50 dark:border-white/5 flex flex-col">
      {/* Premium Day Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 border-b border-stone-200/50 dark:border-white/5 bg-white/60 dark:bg-stone-900/60">
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day, i) => {
            const isActive = selectedDayIndex === i;
            const date = weekDates[i];
            return (
              <button
                key={day}
                onClick={() => setSelectedDayIndex(i)}
                className={cn(
                  'px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex flex-col items-center gap-0.5',
                  isActive
                    ? 'bg-blue-500 text-white shadow-[0_4px_16px_rgba(59,130,246,0.3)] scale-105'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                )}
              >
                <span>{day}</span>
                {date && (
                  <span
                    className={cn(
                      'text-[9px] font-bold opacity-80',
                      isActive ? 'text-blue-100' : 'text-stone-400'
                    )}
                  >
                    {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="text-right hidden sm:block">
          <h3 className="font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight text-sm">
            Tình trạng phòng học
          </h3>
          <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">
            Daily Room-Slot Matrix View
          </p>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] relative custom-scrollbar">
        <table className="w-full border-separate border-spacing-0 min-w-[1200px]">
          <thead className="sticky top-0 z-30">
            <tr className="bg-white dark:bg-stone-900">
              <th
                style={{ width: '120px', minWidth: '120px', left: 0 }}
                className="p-4 border-b border-stone-200/50 dark:border-white/5 text-center text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] sticky left-0 z-40 bg-white dark:bg-stone-900"
              >
                Ca học
              </th>
              {rooms.map((room) => (
                <th
                  key={room}
                  className="p-4 border-b border-stone-200/50 dark:border-white/5 text-center min-w-[180px] bg-white dark:bg-stone-900"
                >
                  <div className="font-black text-stone-900 dark:text-stone-100 uppercase tracking-tighter text-sm">
                    {room}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => {
              const isAvailable = session.days?.includes(selectedDayIndex) ?? true;
              return (
                <tr key={session.id} className="group transition-colors">
                  <td
                    style={{ width: '120px', minWidth: '120px', left: 0 }}
                    className="p-4 border-b border-stone-200/50 dark:border-white/5 align-middle text-center sticky left-0 z-20 bg-white dark:bg-stone-900 shadow-[4px_0_12px_rgba(0,0,0,0.02)]"
                  >
                    <div className="font-black text-blue-500 text-base leading-tight">
                      {session.label}
                    </div>
                    <div className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest mt-1">
                      {session.time}
                    </div>
                  </td>
                  {rooms.map((room) => {
                    const slot = isAvailable
                      ? getSlotForRoomCell(
                          slots,
                          currentCampus.name,
                          room,
                          selectedDayIndex,
                          session.start
                        )
                      : null;

                    // Calculate conflict busy indicators when dragging
                    const isTeacherBusy =
                      draggingTeacherId &&
                      slots.some(
                        (s) =>
                          s.day_of_week === selectedDayIndex &&
                          s.start_time.substring(0, 5) === session.start.substring(0, 5) &&
                          s.teacher?.id === draggingTeacherId &&
                          s.id !== draggingSlotId
                      );

                    const isClassBusy =
                      draggingClassId &&
                      slots.some(
                        (s) =>
                          s.day_of_week === selectedDayIndex &&
                          s.start_time.substring(0, 5) === session.start.substring(0, 5) &&
                          s.class?.id === draggingClassId &&
                          s.id !== draggingSlotId
                      );

                    const isBusy = isTeacherBusy || isClassBusy;

                    return (
                      <td
                        key={room}
                        className={cn(
                          'p-3 border-b border-stone-200/50 dark:border-white/5 h-28 transition-all duration-300 relative',
                          !isAvailable
                            ? 'bg-stone-500/5 dark:bg-white/2 opacity-30'
                            : isBusy
                            ? 'bg-red-500/5 dark:bg-red-950/20'
                            : 'group-hover:bg-stone-500/2 dark:group-hover:bg-white/2'
                        )}
                        onDragOver={(e) => {
                          if (isAvailable && !isBusy) e.preventDefault();
                        }}
                        onDragEnter={(e) => {
                          if (isAvailable) {
                            if (isBusy) {
                              e.currentTarget.classList.add(
                                'bg-red-500/10',
                                'border-2',
                                'border-dashed',
                                'border-red-500'
                              );
                            } else {
                              e.currentTarget.classList.add(
                                'bg-blue-500/10',
                                'border-2',
                                'border-dashed',
                                'border-blue-500'
                              );
                            }
                          }
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.classList.remove(
                            'bg-blue-500/10',
                            'bg-red-500/10',
                            'border-2',
                            'border-dashed',
                            'border-blue-500',
                            'border-red-500'
                          );
                        }}
                        onDrop={(e) => {
                          e.currentTarget.classList.remove(
                            'bg-blue-500/10',
                            'bg-red-500/10',
                            'border-2',
                            'border-dashed',
                            'border-blue-500',
                            'border-red-500'
                          );
                          if (isAvailable && !isBusy) handleDrop(e, selectedDayIndex, session, room);
                        }}
                      >
                        {!isAvailable ? (
                          <div className="h-full w-full rounded-2xl border border-stone-200/5 dark:border-white/2 flex items-center justify-center">
                            <span className="text-[10px] text-stone-300 dark:text-stone-700 font-black uppercase tracking-widest">
                              Off
                            </span>
                          </div>
                        ) : slot ? (
                          (() => {
                            const colors = getSubjectColor(slot.subject?.name, !slot.room || slot.room === 'Linh hoạt');
                            return (
                              <div
                                className={cn(
                                  'h-full p-3.5 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md relative overflow-hidden flex flex-col justify-between group/card',
                                  colors.bg,
                                  colors.border,
                                  colors.borderLeft,
                                  'border-l-[4px]'
                                )}
                                onClick={() => onEditSlot(slot)}
                                draggable="true"
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', slot.id);
                                  e.dataTransfer.effectAllowed = 'move';
                                  e.currentTarget.style.opacity = '0.5';
                                  if (setDraggingSlotId) setDraggingSlotId(slot.id);
                                  if (setDraggingTeacherId) setDraggingTeacherId(slot.teacher?.id || null);
                                  if (setDraggingClassId) setDraggingClassId(slot.class_id || null);
                                }}
                                onDragEnd={(e) => {
                                  e.currentTarget.style.opacity = '1';
                                  if (setDraggingSlotId) setDraggingSlotId(null);
                                  if (setDraggingTeacherId) setDraggingTeacherId(null);
                                  if (setDraggingClassId) setDraggingClassId(null);
                                }}
                              >
                                <div className="flex justify-between items-start mb-1.5">
                                  <div className="font-black text-stone-900 dark:text-stone-100 text-xs leading-tight line-clamp-2">
                                    {slot.class?.name || slot.student?.full_name || 'Tiết học'}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteSlot(slot.id);
                                    }}
                                    className="p-1 opacity-0 group-hover/card:opacity-100 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all z-10 shrink-0"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                                {slot.subject && (
                                  <div className="mb-2">
                                    <span
                                      className={cn(
                                        'text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border inline-block',
                                        colors.badge
                                      )}
                                    >
                                      {slot.subject.name}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400 mt-auto pt-1.5 border-t border-stone-200/40 dark:border-white/5">
                                  {slot.teacher && (
                                    <div className="font-bold flex items-center gap-1.5 truncate">
                                      <div className="w-4 h-4 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[9px] font-black shrink-0">
                                        {slot.teacher.full_name?.charAt(0) || 'G'}
                                      </div>
                                      <span
                                        className="truncate max-w-[100px]"
                                        title={getDisplayName(slot.teacher)}
                                      >
                                        {getDisplayName(slot.teacher)}
                                      </span>
                                    </div>
                                  )}
                                  {slot.has_weekly_note && (
                                    <div
                                      className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                      title="Có ghi chú tuần"
                                    >
                                      <ClipboardList className="w-3 h-3" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()
                        ) : isBusy ? (
                          <div className="h-full rounded-2xl border-2 border-dashed border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/10 flex flex-col items-center justify-center p-2 text-center">
                            <span className="text-[14px] mb-1">⚠️</span>
                            <span className="text-[9px] text-red-500 dark:text-red-400 font-black uppercase tracking-wider">
                              {isTeacherBusy ? 'Trùng GV' : 'Trùng Lớp'}
                            </span>
                          </div>
                        ) : (
                          <div
                            className="h-full rounded-2xl border-2 border-dashed border-stone-200 dark:border-white/5 hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer flex items-center justify-center transition-all group/empty"
                            onClick={() =>
                              onCreateSlot(selectedDayIndex, session, `${currentCampus.name} - ${room}`)
                            }
                          >
                            <div className="p-2.5 rounded-2xl bg-stone-500/5 dark:bg-white/5 group-hover/empty:scale-110 group-hover/empty:bg-amber-500 group-hover/empty:text-white transition-all text-stone-300 dark:text-stone-700">
                              <Plus className="w-4 h-4" />
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
