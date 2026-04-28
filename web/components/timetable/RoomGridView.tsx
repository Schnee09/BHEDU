'use client';

import React from 'react';
import { Plus, Trash2, Users, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDisplayName } from '@/lib/utils/names';
import { TimetableSlot } from '@/lib/timetable/types';
import { DAYS, ALL_SESSIONS } from '@/lib/timetable/constants';
import { getSlotForRoomCell } from '@/lib/timetable/utils';

interface RoomGridViewProps {
  slots: TimetableSlot[];
  currentCampus: {
    id: string;
    name: string;
    rooms: string[];
  };
  weekDates: Date[];
  onEditSlot: (slot: TimetableSlot) => void;
  onDeleteSlot: (slotId: string) => void;
  onCreateSlot: (dayIndex: number, session: any, room: string) => void;
}

export default function RoomGridView({
  slots,
  currentCampus,
  weekDates,
  onEditSlot,
  onDeleteSlot,
  onCreateSlot,
}: RoomGridViewProps) {
  return (
    <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl border border-stone-200/50 dark:border-white/5">
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] relative custom-scrollbar">
        <table className="w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-30">
            <tr className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-md">
              <th className="p-4 border-b border-stone-200/50 dark:border-white/5 text-center text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] w-28 sticky left-0 z-40 bg-white/95 dark:bg-stone-900/95">
                Ca học
              </th>
              <th className="p-4 border-b border-stone-200/50 dark:border-white/5 text-center text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] w-20 sticky left-28 z-40 bg-white/95 dark:bg-stone-900/95">
                Phòng
              </th>
              {DAYS.map((day, i) => (
                <th
                  key={day}
                  className="p-4 border-b border-stone-200/50 dark:border-white/5 text-center min-w-[200px] bg-transparent"
                >
                  <div className="font-black text-stone-900 dark:text-stone-100 uppercase tracking-tighter text-base">
                    {day}
                  </div>
                  <div className="text-[10px] text-blue-500 font-black uppercase tracking-widest mt-0.5">
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
              <React.Fragment key={session.id}>
                {currentCampus.rooms.map((room, roomIdx) => (
                  <tr key={`${session.id}-${room}`} className="group transition-colors">
                    {roomIdx === 0 && (
                      <td
                        rowSpan={currentCampus.rooms.length}
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
                    <td className="p-2 border-b border-stone-200/50 dark:border-white/5 text-center bg-stone-500/5 dark:bg-white/3 w-20 sticky left-28 z-20">
                      <div className="text-sm font-black text-stone-900 dark:text-stone-100">
                        {room}
                      </div>
                    </td>
                    {DAYS.map((_, dayIndex) => {
                      const isAvailable = session.days.includes(dayIndex);
                      const slot = isAvailable
                        ? getSlotForRoomCell(slots, currentCampus.name, room, dayIndex, session.start)
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
                              className="h-full p-4 bg-white/80 dark:bg-white/5 backdrop-blur-sm border-l-4 border-emerald-500 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group/card relative overflow-hidden"
                              onClick={() => onEditSlot(slot)}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="font-black text-stone-900 dark:text-stone-100 text-[13px] leading-tight line-clamp-2">
                                  {slot.student?.full_name || slot.class?.name || 'N/A'}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteSlot(slot.id);
                                  }}
                                  className="p-1.5 opacity-0 group-hover/card:opacity-100 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all z-10"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              {slot.subject && (
                                <div className="text-emerald-600 dark:text-emerald-500 text-[10px] font-black uppercase tracking-wider mb-2">
                                  {slot.subject.name}
                                </div>
                              )}
                              <div className="flex items-center gap-3 mt-auto">
                                {slot.teacher && (
                                  <div className="text-stone-500 dark:text-stone-400 text-[10px] font-bold flex items-center gap-1.5">
                                    <div className="w-4 h-4 rounded-full bg-stone-500/10 flex items-center justify-center">
                                      <Users className="w-2.5 h-2.5" />
                                    </div>
                                    {getDisplayName(slot.teacher).split(' ').pop()}
                                  </div>
                                )}
                                {slot.has_weekly_note && (
                                  <div
                                    className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                                    title="Ghi chú tuần này"
                                  />
                                )}
                              </div>
                            </div>
                          ) : (
                            <div
                              className="h-full rounded-2xl border-2 border-dashed border-stone-200 dark:border-white/5 hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer flex items-center justify-center transition-all group/empty"
                              onClick={() =>
                                onCreateSlot(
                                  dayIndex,
                                  session,
                                  `${currentCampus.name} - ${room}`
                                )
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
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
