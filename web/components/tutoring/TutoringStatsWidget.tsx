'use client';

import React from 'react';
import {
  BookOpen,
  Users,
  GraduationCap,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { TimetableSlot, TeacherOption } from '@/lib/timetable/types';

interface TutoringStatsWidgetProps {
  slots: TimetableSlot[];
  tutors: TeacherOption[];
}

export default function TutoringStatsWidget({ slots, tutors }: TutoringStatsWidgetProps) {
  const tutoringSlots = slots.filter((s) => !s.room || s.room === 'Linh hoạt' || !!s.student_id);
  const totalSlots = tutoringSlots.length;
  const completedSlots = tutoringSlots.filter((s) => s.status === 'completed').length;
  const scheduledSlots = tutoringSlots.filter((s) => !s.status || s.status === 'scheduled').length;

  // Unique students count
  const uniqueStudents = new Set(
    tutoringSlots.map((s) => s.student_id || s.student?.id).filter(Boolean)
  ).size;

  // Active tutors count
  const activeTutors = new Set(
    tutoringSlots.map((s) => s.teacher?.id).filter(Boolean)
  ).size;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Tutoring Slots */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-[28px] border border-stone-200/80 dark:border-white/10 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xl shrink-0">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 block">
            Tổng ca kèm tuần này
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100 leading-none">
              {totalSlots}
            </span>
            <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
              Ca học
            </span>
          </div>
        </div>
      </div>

      {/* Active Tutors */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-[28px] border border-stone-200/80 dark:border-white/10 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400 font-black text-xl shrink-0">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 block">
            Gia sư đang phụ trách
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100 leading-none">
              {activeTutors}
            </span>
            <span className="text-[10px] font-bold text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-full">
              /{tutors.length || activeTutors} Gia sư
            </span>
          </div>
        </div>
      </div>

      {/* Tutoring Students */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-[28px] border border-stone-200/80 dark:border-white/10 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 font-black text-xl shrink-0">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 block">
            Học sinh theo học
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-stone-900 dark:text-stone-100 leading-none">
              {uniqueStudents}
            </span>
            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
              Học sinh
            </span>
          </div>
        </div>
      </div>

      {/* Completed vs Pending Ratio */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-[28px] border border-stone-200/80 dark:border-white/10 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-xl shrink-0">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 block">
            Đã hoàn thành / Đã xếp
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
              {completedSlots}
            </span>
            <span className="text-xs font-bold text-stone-400">
              / {scheduledSlots} chờ dạy
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
