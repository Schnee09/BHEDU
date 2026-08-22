'use client';

import React from 'react';
import { Plus, Trash2, Users, MapPin, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimetableSlot, ClassOption } from '@/lib/timetable/types';
import { DAYS } from '@/lib/timetable/constants';
import { getSlotForClassCell } from '@/lib/timetable/utils';
import { getSubjectColor } from '@/lib/timetable/subject-colors';

interface ClassGridViewProps {
  slots: TimetableSlot[];
  selectedClass: string;
  classes: ClassOption[];
  weekDates: Date[];
  sessions: any[];
  onEditSlot: (slot: TimetableSlot) => void;
  onDeleteSlot: (slotId: string) => void;
  onCreateSlot: (dayIndex: number, session: any) => void;
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

export default function ClassGridView({
  slots,
  selectedClass,
  classes,
  weekDates,
  sessions,
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
}: ClassGridViewProps) {
  if (!selectedClass) {
    return (
      <div className="bg-white/90 dark:bg-stone-900/90 rounded-[32px] p-16 text-center shadow-lg border border-stone-200/80 dark:border-white/5">
        <div className="bg-amber-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
          <Calendar className="w-8 h-8 text-amber-500" />
        </div>
        <h3 className="text-xl font-black text-stone-900 dark:text-white mb-2 uppercase tracking-tight">
          Chưa chọn lớp học
        </h3>
        <p className="text-stone-500 dark:text-stone-400 max-w-xs mx-auto text-xs font-bold">
          Vui lòng chọn một lớp học từ danh sách phía trên để xem và quản lý thời khóa biểu chi tiết.
        </p>
      </div>
    );
  }

  const currentClass = classes.find((c) => c.id === selectedClass);

  const handleDrop = (e: React.DragEvent, dayIndex: number, session: any) => {
    e.preventDefault();
    const slotId = e.dataTransfer.getData('text/plain');
    if (slotId && onMoveSlot) {
      const slot = slots.find((s) => s.id === slotId);
      onMoveSlot(slotId, dayIndex, session.start, session.end, slot?.room || '');
    }
  };

  return (
    <div className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-xl border border-stone-200/70 dark:border-white/5">
      <div className="p-6 border-b border-stone-200/70 dark:border-white/5 bg-stone-50/50 dark:bg-stone-950/40 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-lg border border-blue-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-stone-900 dark:text-stone-100 text-base uppercase tracking-tight">
              Thời Khóa Biểu: {currentClass?.name || 'Lớp học'}
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-bold mt-0.5">
              Khung giờ và môn học phân bổ theo tuần
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] relative custom-scrollbar">
        <table className="w-full border-separate border-spacing-0 min-w-[1100px]">
          <thead className="sticky top-0 z-30">
            <tr className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md">
              <th className="p-4 border-b border-r border-stone-200/70 dark:border-white/5 text-center text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest w-28 sticky left-0 z-40 bg-white/95 dark:bg-stone-900/95">
                Ca học
              </th>
              {DAYS.map((day, i) => (
                <th
                  key={day}
                  className="p-3.5 border-b border-r border-stone-200/70 dark:border-white/5 text-center min-w-[150px]"
                >
                  <div className="font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight text-sm">
                    {day}
                  </div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider mt-0.5">
                    {weekDates[i]?.toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {sessions.map((session) => (
              <tr key={session.id} className="group/row">
                <td className="p-3 border-b border-r border-stone-200/70 dark:border-white/5 text-center sticky left-0 z-20 bg-white/95 dark:bg-stone-900/95 shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
                  <div className="font-black text-amber-600 dark:text-amber-400 text-sm leading-tight">
                    {session.label}
                  </div>
                  <div className="text-[10px] text-stone-600 dark:text-stone-300 font-black tracking-tighter mt-1">
                    {session.time || `${session.start} - ${session.end}`}
                  </div>
                </td>
                {DAYS.map((_, dayIndex) => {
                  const isAvailable = session.days?.includes(dayIndex) ?? true;
                  const slot = isAvailable
                    ? getSlotForClassCell(slots, dayIndex, session.start)
                    : null;

                  const colors = getSubjectColor(slot?.subject?.name, !slot?.room || slot?.room === 'Linh hoạt');

                  return (
                    <td
                      key={dayIndex}
                      className={cn(
                        'p-2.5 border-b border-r border-stone-200/70 dark:border-white/5 h-28 align-top transition-all relative',
                        !isAvailable
                          ? 'bg-stone-500/5 dark:bg-white/2 opacity-35'
                          : 'hover:bg-stone-500/[0.03]'
                      )}
                      onDragOver={(e) => {
                        if (isAvailable) e.preventDefault();
                      }}
                      onDrop={(e) => {
                        if (isAvailable) handleDrop(e, dayIndex, session);
                      }}
                    >
                      {!isAvailable ? (
                        <div className="h-full min-h-[70px] rounded-2xl border border-stone-200/40 dark:border-white/5 flex items-center justify-center">
                          <span className="text-[10px] text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest">
                            Nghỉ
                          </span>
                        </div>
                      ) : slot ? (
                        <div
                          className={cn(
                            'h-full p-3 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md relative overflow-hidden flex flex-col justify-between group/card',
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
                          }}
                        >
                          <div>
                            <div className="font-black text-stone-900 dark:text-stone-100 text-xs line-clamp-1 leading-tight mb-1">
                              {slot.subject?.name || 'Môn học'}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-600 dark:text-stone-300">
                              <Users className="w-3 h-3 text-amber-500" />
                              <span className="truncate">{slot.teacher?.full_name || 'Chưa phân công'}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[9px] text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-200/40 dark:border-white/5 mt-1.5">
                            {slot.room ? (
                              <span className="font-bold flex items-center gap-1 truncate">
                                <MapPin className="w-2.5 h-2.5 text-amber-500" />
                                {slot.room.replace(/^.*? - /, '')}
                              </span>
                            ) : (
                              <span className="font-bold text-sky-600 dark:text-sky-400">Linh hoạt</span>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSlot(slot.id);
                            }}
                            className="absolute top-1.5 right-1.5 p-1 opacity-0 group-hover/card:opacity-100 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all z-10"
                            title="Xóa tiết học"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => onCreateSlot(dayIndex, session)}
                          className="h-full min-h-[70px] rounded-2xl border-2 border-dashed border-stone-200/70 dark:border-white/5 hover:border-amber-500/50 hover:bg-amber-500/[0.06] cursor-pointer flex flex-col items-center justify-center gap-1 transition-all group/empty"
                        >
                          <Plus className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 group-hover/empty:text-amber-500 transition-colors" />
                          <span className="text-[9px] font-black text-stone-400 group-hover/empty:text-amber-600 dark:group-hover/empty:text-amber-400 opacity-0 group-hover/empty:opacity-100 uppercase tracking-wider">
                            + Xếp lịch
                          </span>
                        </div>
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
