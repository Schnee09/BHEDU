'use client';

import React from 'react';
import { useFetch } from '@/hooks/useFetch';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface Profile {
  id: string;
  full_name: string;
}

interface Class {
  id: string;
  name: string;
}

interface TimetableSlot {
  id: string;
  class_id?: string;
  student_id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string;
  notes?: string;
  subject?: Subject;
  teacher?: Profile;
  student?: Profile;
  class?: Class;
}

interface TodayScheduleWidgetProps {
  role: 'teacher' | 'student' | 'tutor' | 'parent';
  studentId?: string; // Option for parent view to filter a specific student
}

export default function TodayScheduleWidget({ role, studentId }: TodayScheduleWidgetProps) {
  // Fetch slots from my timetable
  const { data, loading, error } = useFetch<{
    slots: TimetableSlot[];
    classes: any[];
  }>('/api/timetable/my');

  const jsDay = new Date().getDay();
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1;

  // Filter slots for today
  let todaySlots = (data?.slots || []).filter((slot) => slot.day_of_week === dayIndex);

  // If a parent is viewing for a specific student, filter slots accordingly
  if (role === 'parent' && studentId) {
    todaySlots = todaySlots.filter(
      (slot) => slot.student_id === studentId || slot.class_id === studentId
    );
  }

  // Sort slots by start time
  todaySlots.sort((a, b) => a.start_time.localeCompare(b.start_time));

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  const getSessionLabel = (start?: string) => {
    if (!start) return '';
    const formattedStart = start.substring(0, 5);
    if (formattedStart === '08:00') return 'Sáng 1';
    if (formattedStart === '09:30') return 'Sáng 2';
    if (formattedStart === '14:00') return 'Chiều 1';
    if (formattedStart === '15:30') return 'Chiều 2';
    if (formattedStart === '17:00') return 'Ca 1';
    if (formattedStart === '18:30') return 'Ca 2';
    if (formattedStart === '20:00') return 'Ca 3';
    return '';
  };

  // Helper to check if a slot is currently active
  const isSlotActive = (startTime: string, endTime: string) => {
    const now = new Date();
    const timeNow = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const start = startTime.substring(0, 5);
    const end = endTime.substring(0, 5);
    return timeNow >= start && timeNow <= end;
  };

  return (
    <Card padding="p-0">
      <CardHeader className="flex items-center justify-between border-b border-stone-200/50 dark:border-white/5 bg-stone-50/50 dark:bg-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-xl shadow-accent-glow">
            <Icons.Attendance className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-serif font-black text-lg text-stone-900 dark:text-white uppercase tracking-tight">
              Lịch học & giảng dạy hôm nay
            </h3>
            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mt-0.5">
              {todaySlots.length} buổi học trong ngày
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="p-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-16 w-full bg-stone-100 dark:bg-stone-800 animate-pulse rounded-2xl" />
            <div className="h-16 w-full bg-stone-100 dark:bg-stone-800 animate-pulse rounded-2xl" />
          </div>
        ) : todaySlots.length === 0 ? (
          <div className="py-12 text-center text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest text-xs">
            Hôm nay không có tiết học nào
          </div>
        ) : (
          <div className="space-y-4">
            {todaySlots.map((slot) => {
              const active = isSlotActive(slot.start_time, slot.end_time);
              return (
                <div
                  key={slot.id}
                  className={cn(
                    'flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border transition-all duration-300 gap-4',
                    active
                      ? 'bg-amber-500/5 border-amber-500/30 dark:border-amber-500/20 shadow-md shadow-amber-500/5'
                      : 'bg-white/45 dark:bg-stone-900/40 border-stone-200/60 dark:border-white/5 hover:border-stone-300 dark:hover:border-white/10'
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Time block */}
                    <div className="flex flex-col items-center justify-center bg-stone-100 dark:bg-white/5 rounded-xl px-3 py-2 min-w-[70px]">
                      <span className="text-xs font-black text-stone-800 dark:text-stone-200 tracking-tighter">
                        {formatTime(slot.start_time)}
                      </span>
                      <div className="w-4 h-[1px] bg-stone-300 dark:bg-stone-700 my-1" />
                      <span className="text-[10px] font-bold text-stone-400">
                        {formatTime(slot.end_time)}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getSessionLabel(slot.start_time) && (
                          <span className="inline-flex px-2 py-0.5 bg-amber-500/10 text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest rounded-md">
                            {getSessionLabel(slot.start_time)}
                          </span>
                        )}
                        {slot.room && (
                          <span className="inline-flex px-2 py-0.5 bg-stone-100 dark:bg-white/5 text-[9px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest rounded-md">
                            Phòng {slot.room}
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight text-base sm:text-lg">
                        {slot.subject?.name || 'Môn học tự do'}
                      </h4>
                      <p className="text-[10px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest">
                        {role === 'tutor'
                          ? `Học sinh: ${slot.student?.full_name || 'Học nhóm'}`
                          : slot.class?.name
                            ? `Lớp: ${slot.class.name}`
                            : `Học sinh: ${slot.student?.full_name || 'Cá nhân'}`}
                        {role !== 'teacher' && role !== 'tutor' && slot.teacher?.full_name && (
                          <span className="normal-case font-medium text-stone-400">
                            {' '}
                            • GV: {slot.teacher.full_name}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions / Status */}
                  <div className="flex items-center gap-3 justify-end sm:justify-start">
                    {active && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}

                    {role === 'teacher' && slot.class_id && (
                      <Link
                        href={`/dashboard/attendance/mark?classId=${slot.class_id}`}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-900 text-xs font-black rounded-xl transition-all shadow-sm active:scale-95 uppercase tracking-wider"
                      >
                        Điểm danh
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
