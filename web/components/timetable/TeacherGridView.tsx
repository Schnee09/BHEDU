'use client';

import React from 'react';
import { Trash2, MapPin, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimetableSlot, TeacherOption } from '@/lib/timetable/types';
import { DAYS, ALL_SESSIONS } from '@/lib/timetable/constants';
import { getSlotForTeacherCell } from '@/lib/timetable/utils';

interface TeacherGridViewProps {
  slots: TimetableSlot[];
  selectedTeacher: string;
  teachers: TeacherOption[];
  weekDates: Date[];
  onEditSlot: (slot: TimetableSlot) => void;
  onDeleteSlot: (slotId: string) => void;
}

export default function TeacherGridView({
  slots,
  selectedTeacher,
  teachers,
  weekDates,
  onEditSlot,
  onDeleteSlot,
}: TeacherGridViewProps) {
  if (!selectedTeacher) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-16 text-center shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="bg-green-50 dark:bg-green-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-100 dark:border-green-800">
          <GraduationCap className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Chưa chọn giáo viên
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto text-sm">
          Vui lòng chọn một giáo viên từ danh sách để xem lịch dạy chi tiết.
        </p>
      </div>
    );
  }

  const currentTeacher = teachers.find((t) => t.id === selectedTeacher);

  return (
    <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl border border-stone-200/50 dark:border-white/5">
      <div className="p-6 border-b border-stone-200/50 dark:border-white/5 bg-white/60 dark:bg-stone-900/60 flex items-center gap-4">
        <div className="p-2.5 bg-emerald-500/10 rounded-2xl">
          <GraduationCap className="w-5 h-5 text-emerald-500" />
        </div>
        <div>
          <h3 className="font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">
            Lịch dạy: <span className="text-emerald-500">{currentTeacher?.full_name}</span>
          </h3>
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">
            Thời khóa biểu cá nhân giáo viên
          </p>
        </div>
      </div>
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] relative custom-scrollbar">
        <table className="w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-30">
            <tr className="bg-white dark:bg-stone-900">
              <th className="p-4 border-b border-stone-200/50 dark:border-white/5 text-center text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] w-40 sticky left-0 z-40 bg-white dark:bg-stone-900">
                Ca học
              </th>
              {DAYS.map((day, i) => (
                <th
                  key={day}
                  className="p-4 border-b border-stone-200/50 dark:border-white/5 text-center min-w-[200px] bg-white dark:bg-stone-900"
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
                <td className="p-4 border-b border-stone-200/50 dark:border-white/5 align-middle text-center sticky left-0 z-20 bg-white dark:bg-stone-900 shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
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
                    ? getSlotForTeacherCell(slots, selectedTeacher, dayIndex, session.start)
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
                            {slot.student?.full_name || slot.class?.name || 'N/A'}
                          </div>
                          <div className="text-emerald-600 dark:text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-2">
                            {slot.subject?.name || 'Môn học'}
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
                        <div className="h-full rounded-2xl border-2 border-dashed border-stone-200 dark:border-white/5 flex items-center justify-center">
                          <span className="text-[10px] text-stone-300 dark:text-stone-700 font-black uppercase tracking-widest">
                            Empty
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
