'use client';

import React from 'react';
import { Plus, Trash2, Edit3, Search, ClipboardList } from 'lucide-react';
import { TimetableSlot } from '@/lib/timetable/types';
import { DAYS, ALL_SESSIONS } from '@/lib/timetable/constants';
import { cn } from '@/lib/utils';

interface TutoringListViewProps {
  slots: TimetableSlot[];
  weekDates: Date[];
  onEditSlot: (slot: TimetableSlot) => void;
  onDeleteSlot: (slotId: string) => void;
  onCreateSlot: (dayIndex: number, session: any, room: string) => void;
  onUpdateStatus?: (slotId: string, newStatus: 'scheduled' | 'completed' | 'cancelled' | 'makeup') => void;
}

export default function TutoringListView({
  slots,
  weekDates,
  onEditSlot,
  onDeleteSlot,
  onCreateSlot,
  onUpdateStatus,
}: TutoringListViewProps) {
  const tutoringSlots = slots.filter((s) => !s.room || s.room === 'Linh hoạt');

  return (
    <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl border border-stone-200/50 dark:border-white/5">
      <div className="p-8 border-b border-stone-200/50 dark:border-white/5 bg-white/60 dark:bg-stone-900/60 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-2xl">
            <ClipboardList className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="font-black text-stone-900 dark:text-stone-100 text-xl tracking-tight">
              Lịch học kèm tuần này
            </h3>
            <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">
              Danh sách quản lý tập trung
            </p>
          </div>
        </div>
        <button
          onClick={() => onCreateSlot(0, ALL_SESSIONS[4], 'Linh hoạt')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-[20px] text-sm font-black transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Thêm lịch học kèm
        </button>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full">
          <thead>
            <tr className="bg-stone-500/5 dark:bg-white/2">
              <th className="p-5 text-left text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">
                Thứ / Ngày
              </th>
              <th className="p-5 text-left text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">
                Ca học
              </th>
              <th className="p-5 text-left text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">
                Gia sư
              </th>
              <th className="p-5 text-left text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">
                Học sinh / Lớp
              </th>
              <th className="p-5 text-left text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">
                Môn học
              </th>
              <th className="p-5 text-left text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">
                Trạng thái
              </th>
              <th className="p-5 text-center text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] w-32">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {tutoringSlots.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-32 text-center">
                  <div className="bg-stone-500/5 dark:bg-white/5 w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-stone-200/50 dark:border-white/5">
                    <Search className="w-10 h-10 text-stone-300 dark:text-stone-700" />
                  </div>
                  <p className="text-stone-900 dark:text-stone-100 font-black text-xl tracking-tight">
                    Trống lịch học kèm
                  </p>
                  <p className="text-stone-400 font-bold uppercase tracking-widest text-xs mt-2">
                    Chưa có lịch nào được tạo trong tuần này
                  </p>
                </td>
              </tr>
            ) : (
              tutoringSlots.map((slot) => (
                <tr
                  key={slot.id}
                  className="group transition-colors hover:bg-stone-500/5 dark:hover:bg-white/3"
                >
                  <td className="p-5">
                    <div className="font-black text-stone-900 dark:text-stone-100 text-base leading-none mb-1.5">
                      {DAYS[slot.day_of_week]}
                    </div>
                    <div className="text-[10px] text-blue-500 font-black uppercase tracking-widest">
                      {weekDates[slot.day_of_week]?.toLocaleDateString('vi-VN')}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="inline-flex px-3 py-1 bg-blue-500/10 rounded-xl text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest border border-blue-500/20">
                      {ALL_SESSIONS.find(
                        (s) => s.start === slot.start_time?.substring(0, 5)
                      )?.label || slot.start_time}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white dark:bg-white/5 shadow-sm border border-stone-200/50 dark:border-white/5 flex items-center justify-center text-stone-900 dark:text-stone-100 font-black text-xs">
                        {slot.teacher?.full_name?.charAt(0) || '?'}
                      </div>
                      <span className="font-black text-stone-900 dark:text-stone-100 text-sm tracking-tight">
                        {slot.teacher?.full_name || 'Chưa phân công'}
                      </span>
                    </div>
                  </td>
                  <td className="p-5 font-black text-stone-900 dark:text-stone-100 text-sm tracking-tight">
                    {slot.student?.full_name ||
                      slot.class?.name ||
                      slot.subject?.name ||
                      'N/A'}
                  </td>
                  <td className="p-5 text-emerald-600 dark:text-emerald-500 text-[11px] font-black uppercase tracking-widest">
                    {slot.subject?.name}
                  </td>
                  <td className="p-5">
                    {onUpdateStatus ? (
                      <select
                        value={slot.status || 'scheduled'}
                        onChange={(e) =>
                          onUpdateStatus(slot.id, e.target.value as any)
                        }
                        className={cn(
                          'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider outline-none border transition-all cursor-pointer',
                          slot.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
                            : slot.status === 'cancelled'
                            ? 'bg-red-500/10 text-red-600 border-red-500/30 dark:text-red-400'
                            : slot.status === 'makeup'
                            ? 'bg-sky-500/10 text-sky-600 border-sky-500/30 dark:text-sky-400'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400'
                        )}
                      >
                        <option value="scheduled">🟡 Đã xếp</option>
                        <option value="completed">🟢 Hoàn thành</option>
                        <option value="cancelled">🔴 Hủy ca</option>
                        <option value="makeup">🔵 Học bù</option>
                      </select>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        {slot.status === 'completed'
                          ? 'Hoàn thành'
                          : slot.status === 'cancelled'
                          ? 'Hủy ca'
                          : slot.status === 'makeup'
                          ? 'Học bù'
                          : 'Đã xếp'}
                      </span>
                    )}
                  </td>
                  <td className="p-5">
                    <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                      <button
                        onClick={() => onEditSlot(slot)}
                        className="w-10 h-10 bg-white dark:bg-white/5 text-stone-400 hover:text-blue-500 rounded-2xl shadow-sm border border-stone-200/50 dark:border-white/5 flex items-center justify-center transition-all"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteSlot(slot.id)}
                        className="w-10 h-10 bg-white dark:bg-white/5 text-stone-400 hover:text-red-500 rounded-2xl shadow-sm border border-stone-200/50 dark:border-white/5 flex items-center justify-center transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="p-6 border-t border-stone-200/50 dark:border-white/5 bg-stone-500/5 dark:bg-white/2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
          <span className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">
            Tổng cộng:{' '}
            <span className="text-stone-900 dark:text-stone-100">
              {tutoringSlots.length}
            </span>{' '}
            buổi học kèm
          </span>
        </div>
      </div>
    </div>
  );
}
