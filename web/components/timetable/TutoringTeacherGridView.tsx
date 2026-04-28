'use client';

import React from 'react';
import { Plus, GraduationCap, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDisplayName } from '@/lib/utils/names';
import { TimetableSlot, TeacherOption } from '@/lib/timetable/types';
import { DAYS, ALL_SESSIONS } from '@/lib/timetable/constants';

interface TutoringTeacherGridViewProps {
  slots: TimetableSlot[];
  tutors: TeacherOption[];
  weekDates: Date[];
  onEditSlot: (slot: TimetableSlot) => void;
  onCreateSlot: (dayIndex: number, session: any, teacherId: string) => void;
}

export default function TutoringTeacherGridView({
  slots,
  tutors,
  weekDates,
  onEditSlot,
  onCreateSlot,
}: TutoringTeacherGridViewProps) {
  return (
    <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl border border-stone-200/50 dark:border-white/5">
      <div className="p-6 border-b border-stone-200/50 dark:border-white/5 bg-white/60 dark:bg-stone-900/60 flex items-center gap-4">
        <div className="p-2.5 bg-emerald-500/10 rounded-2xl">
          <GraduationCap className="w-5 h-5 text-emerald-500" />
        </div>
        <div>
          <h3 className="font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">
            Lịch học kèm theo gia sư
          </h3>
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">
            Phân bổ giảng dạy theo ngày
          </p>
        </div>
      </div>
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] relative custom-scrollbar">
        <table className="w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-30">
            <tr className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md">
              <th className="p-4 border-b border-stone-200/50 dark:border-white/5 text-center text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] w-24 sticky left-0 z-40 bg-white/95 dark:bg-stone-900/95">
                Ca học
              </th>
              <th className="p-4 border-b border-stone-200/50 dark:border-white/5 text-center text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] w-32 sticky left-24 z-40 bg-white/95 dark:bg-stone-900/95">
                Gia sư
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
            {ALL_SESSIONS.map((session) =>
              tutors.length > 0 ? (
                tutors.map((tutor, tutorIdx) => (
                  <tr key={`${session.id}-${tutor.id}`} className="group transition-colors">
                    {tutorIdx === 0 && (
                      <td
                        rowSpan={tutors.length}
                        className="p-4 border-b border-stone-200/50 dark:border-white/5 align-middle text-center sticky left-0 z-20 bg-white/90 dark:bg-stone-900/90 shadow-[4px_0_12px_rgba(0,0,0,0.02)]"
                      >
                        <div className="font-black text-blue-500 text-lg leading-tight">
                          {session.label}
                        </div>
                        <div className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest mt-1">
                          {session.time}
                        </div>
                      </td>
                    )}
                    <td className="p-2 border-b border-stone-200/50 dark:border-white/5 text-center bg-stone-500/5 dark:bg-white/3 w-32 sticky left-24 z-20">
                      <div className="text-xs font-black text-stone-500 dark:text-stone-400 truncate px-2">
                        {getDisplayName(tutor).split(' ').pop()}
                      </div>
                    </td>
                    {DAYS.map((_, dayIndex) => {
                      const isAvailable = session.days.includes(dayIndex);
                      const slot = isAvailable
                        ? slots.find(
                            (s) =>
                              s.teacher?.id === tutor.id &&
                              s.day_of_week === dayIndex &&
                              s.start_time?.substring(0, 5) === session.start &&
                              (!s.room || s.room === 'Linh hoạt')
                          )
                        : null;

                      return (
                        <td
                          key={dayIndex}
                          className={cn(
                            'p-3 border-b border-stone-200/50 dark:border-white/5 h-24 transition-all duration-300',
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
                              className="h-full p-3 bg-white/80 dark:bg-white/5 backdrop-blur-sm border-l-4 border-emerald-500 rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer group/card relative overflow-hidden"
                              onClick={() => onEditSlot(slot)}
                            >
                              <div className="font-black text-stone-900 dark:text-stone-100 text-[11px] line-clamp-2 leading-tight mb-1.5">
                                {slot.class?.name ||
                                  slot.student?.full_name ||
                                  slot.subject?.name}
                              </div>
                              <div className="flex items-center gap-2 mt-auto pt-1.5 border-t border-stone-200/30 dark:border-white/5">
                                {(slot.weekly_note || slot.notes) && (
                                  <ClipboardList className="w-2.5 h-2.5 text-stone-400 flex-shrink-0" />
                                )}
                                <span className="text-[9px] text-stone-400 font-bold truncate">
                                  {slot.weekly_note ?? slot.notes}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="h-full rounded-2xl border-2 border-dashed border-stone-200 dark:border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5 cursor-pointer flex items-center justify-center transition-all group/empty"
                              onClick={() => onCreateSlot(dayIndex, session, tutor.id)}
                            >
                              <Plus className="w-4 h-4 text-stone-300 dark:text-stone-700 group-hover/empty:text-blue-500 transition-colors" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr key={session.id}>
                  <td
                    colSpan={DAYS.length + 2}
                    className="p-16 text-center text-stone-400 bg-stone-500/5 dark:bg-white/3"
                  >
                    <div className="font-black uppercase tracking-[0.2em] text-xs">
                      Chưa có gia sư nào được cấu hình
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
