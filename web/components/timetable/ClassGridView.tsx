'use client';

import React from 'react';
import { Plus, Trash2, Users, MapPin, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimetableSlot, ClassOption } from '@/lib/timetable/types';
import { DAYS, ALL_SESSIONS } from '@/lib/timetable/constants';
import { getSlotForClassCell } from '@/lib/timetable/utils';

interface ClassGridViewProps {
  slots: TimetableSlot[];
  selectedClass: string;
  classes: ClassOption[];
  weekDates: Date[];
  onEditSlot: (slot: TimetableSlot) => void;
  onDeleteSlot: (slotId: string) => void;
  onCreateSlot: (dayIndex: number, session: any) => void;
}

export default function ClassGridView({
  slots,
  selectedClass,
  classes,
  weekDates,
  onEditSlot,
  onDeleteSlot,
  onCreateSlot,
}: ClassGridViewProps) {
  if (!selectedClass) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-16 text-center shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-800">
          <Calendar className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Chưa chọn lớp học
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto text-sm">
          Vui lòng chọn một lớp từ danh sách phía trên để xem thời khóa biểu chi tiết.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl border border-stone-200/50 dark:border-white/5">
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] relative custom-scrollbar">
        <table className="w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-30">
            <tr className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md">
              <th className="p-4 border-b border-stone-200/50 dark:border-white/5 text-center text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] w-28 sticky left-0 z-40 bg-white/95 dark:bg-stone-900/95">
                Ca học
              </th>
              {DAYS.map((day, i) => (
                <th
                  key={day}
                  className="p-4 border-b border-stone-200/50 dark:border-white/5 text-center min-w-[200px] bg-transparent"
                >
                  <div className="font-black text-stone-900 dark:text-stone-100 uppercase tracking-tighter text-base">
                    {day}
                  </div>
                  <div className="text-[10px] text-amber-500 font-black uppercase tracking-widest mt-0.5">
                    {weekDates[i]?.toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_SESSIONS.map((session) => (
              <tr key={session.id} className="group transition-colors">
                <td className="p-4 border-b border-stone-200/50 dark:border-white/5 align-middle text-center sticky left-0 z-20 bg-white/90 dark:bg-stone-900/90 shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
                  <div className="font-black text-blue-500 text-lg leading-tight">
                    {session.label}
                  </div>
                  <div className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest mt-1">
                    {session.time}
                  </div>
                </td>
                {DAYS.map((_, dayIndex) => {
                  const isAvailable = session.days.includes(dayIndex);
                  const slot = isAvailable
                    ? getSlotForClassCell(slots, dayIndex, session.start)
                    : null;
                  return (
                    <td
                      key={dayIndex}
                      className={cn(
                        'p-3 border-b border-stone-200/50 dark:border-white/5 h-28 transition-all duration-300',
                        !isAvailable
                          ? 'bg-stone-500/5 dark:bg-white/2 opacity-30'
                          : 'group-hover:bg-stone-500/2 dark:group-hover:bg-white/2'
                      )}
                    >
                      {!isAvailable ? (
                        <div className="h-full w-full rounded-2xl border border-stone-200/5 dark:border-white/2 flex items-center justify-center">
                          <span className="text-[10px] text-stone-300 dark:text-stone-700 font-black uppercase tracking-widest">
                            Off
                          </span>
                        </div>
                      ) : slot ? (
                        <div
                          className="h-full p-4 bg-white/80 dark:bg-white/5 backdrop-blur-sm border-l-4 border-amber-500 rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer group/card relative overflow-hidden"
                          onClick={() => onEditSlot(slot)}
                        >
                          <div className="font-black text-stone-900 dark:text-stone-100 text-[13px] leading-tight line-clamp-2 mb-2">
                            {slot.subject?.name || 'N/A'}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center">
                              <Users className="w-3 h-3 text-amber-600 dark:text-amber-500" />
                            </div>
                            <span className="text-stone-500 dark:text-stone-400 text-[10px] font-bold truncate">
                              {slot.teacher?.full_name || 'Chưa phân công'}
                            </span>
                          </div>
                          {slot.room && (
                            <div className="text-stone-400 dark:text-stone-500 text-[9px] flex items-center gap-1 truncate font-medium">
                              <MapPin className="w-2.5 h-2.5" />
                              {slot.room}
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSlot(slot.id);
                            }}
                            className="absolute top-2 right-2 p-1.5 opacity-0 group-hover/card:opacity-100 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all z-10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="h-full rounded-2xl border-2 border-dashed border-stone-200 dark:border-white/5 hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer flex items-center justify-center transition-all group/empty"
                          onClick={() => onCreateSlot(dayIndex, session)}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
