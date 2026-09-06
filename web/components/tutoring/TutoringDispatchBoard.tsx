'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  GraduationCap,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  ChevronRight,
  Filter,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDisplayName } from '@/lib/utils/names';
import { TimetableSlot, TeacherOption, StudentOption, SubjectOption } from '@/lib/timetable/types';
import { DAYS, ALL_SESSIONS } from '@/lib/timetable/constants';
import { getSubjectColor } from '@/lib/timetable/subject-colors';
import { apiFetch } from '@/lib/api/client';
import { useToast } from '@/hooks/useToast';

interface TutoringDispatchBoardProps {
  slots: TimetableSlot[];
  tutors: TeacherOption[];
  weekDates: Date[];
  onEditSlot: (slot: TimetableSlot) => void;
  onDeleteSlot: (slotId: string) => void;
  onCreateSlot: (dayIndex: number, session: any, room?: string, initialData?: any) => void;
  onUpdateStatus?: (
    slotId: string,
    newStatus: 'scheduled' | 'completed' | 'cancelled' | 'makeup'
  ) => void;
  onRefresh?: () => void;
  canEdit?: boolean;
}

export default function TutoringDispatchBoard({
  slots,
  tutors,
  weekDates,
  onEditSlot,
  onDeleteSlot,
  onCreateSlot,
  onUpdateStatus,
  onRefresh,
  canEdit = true,
}: TutoringDispatchBoardProps) {
  const toast = useToast();

  // Students Pool State
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [queueFilter, setQueueFilter] = useState<'all' | 'unscheduled' | 'scheduled' | 'makeup'>(
    'all'
  );

  // Session Filter for Matrix
  const [sessionFilter, setSessionFilter] = useState<'all' | 'evening' | 'afternoon' | 'morning'>(
    'all'
  );

  // Dragging state
  const [draggedStudent, setDraggedStudent] = useState<{ id: string; name: string } | null>(null);

  // Fetch Students & Subjects list
  useEffect(() => {
    async function loadData() {
      setLoadingStudents(true);
      try {
        const [studentRes, subRes] = await Promise.all([
          apiFetch('/api/admin/users?role=student&limit=1000'),
          apiFetch('/api/subjects'),
        ]);
        if (studentRes.ok) {
          const sJson = await studentRes.json();
          const sList = sJson.data?.data || sJson.data || sJson.users || [];
          setStudents(Array.isArray(sList) ? sList : []);
        }
        if (subRes.ok) {
          const subJson = await subRes.json();
          const subList = subJson.data || subJson.subjects || [];
          setSubjects(Array.isArray(subList) ? subList : []);
        }
      } catch (err) {
        console.error('Failed to load students for dispatch board:', err);
      } finally {
        setLoadingStudents(false);
      }
    }
    loadData();
  }, []);

  // Filtered Sessions
  const activeSessions = useMemo(() => {
    if (sessionFilter === 'morning') {
      return ALL_SESSIONS.filter((s) => s.label.startsWith('S'));
    }
    if (sessionFilter === 'afternoon') {
      return ALL_SESSIONS.filter(
        (s) =>
          s.label.startsWith('C') &&
          !s.label.includes('3') &&
          !s.label.includes('4') &&
          !s.label.includes('5')
      );
    }
    if (sessionFilter === 'evening') {
      return ALL_SESSIONS.filter(
        (s) =>
          s.label.startsWith('Ca') ||
          s.label.includes('C3') ||
          s.label.includes('C4') ||
          s.label.includes('C5')
      );
    }
    return ALL_SESSIONS;
  }, [sessionFilter]);

  // Compute Tutoring Slot Counts per student
  const studentScheduleCounts = useMemo(() => {
    const counts: Record<string, { count: number; slots: TimetableSlot[]; hasMakeup: boolean }> =
      {};
    students.forEach((st) => {
      counts[st.id] = { count: 0, slots: [], hasMakeup: false };
    });

    slots.forEach((slot) => {
      const isTutoring = !slot.room || slot.room === 'Linh hoạt' || !!slot.student_id;
      if (!isTutoring) return;

      const stId = slot.student_id || slot.student?.id;
      if (stId) {
        if (!counts[stId]) {
          counts[stId] = { count: 0, slots: [], hasMakeup: false };
        }
        counts[stId].count += 1;
        counts[stId].slots.push(slot);
        if (slot.status === 'makeup' || slot.status === 'cancelled') {
          counts[stId].hasMakeup = true;
        }
      }
    });

    return counts;
  }, [students, slots]);

  // Filtered Students Queue
  const filteredQueueStudents = useMemo(() => {
    let result = [...students];

    // Search filter
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase().trim();
      result = result.filter((s) => s.full_name?.toLowerCase().includes(q));
    }

    // Queue Status filter
    if (queueFilter === 'unscheduled') {
      result = result.filter((s) => (studentScheduleCounts[s.id]?.count || 0) === 0);
    } else if (queueFilter === 'scheduled') {
      result = result.filter((s) => (studentScheduleCounts[s.id]?.count || 0) > 0);
    } else if (queueFilter === 'makeup') {
      result = result.filter((s) => studentScheduleCounts[s.id]?.hasMakeup);
    }

    return result;
  }, [students, studentSearch, queueFilter, studentScheduleCounts]);

  // Drag handlers from Left Queue to Right Matrix
  const handleStudentDragStart = (e: React.DragEvent, student: StudentOption) => {
    if (!canEdit) return;
    setDraggedStudent({ id: student.id, name: student.full_name });
    e.dataTransfer.setData('text/student-id', student.id);
    e.dataTransfer.setData('text/student-name', student.full_name);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDropOnTutorCell = (
    e: React.DragEvent,
    dayIndex: number,
    session: any,
    tutor: TeacherOption
  ) => {
    e.preventDefault();
    if (!canEdit) return;

    const studentId = e.dataTransfer.getData('text/student-id') || draggedStudent?.id;
    const studentName = e.dataTransfer.getData('text/student-name') || draggedStudent?.name;

    if (!studentId) return;

    // Check if student already has a slot at this time
    const sStart = session.start;
    const conflictStudent = slots.find(
      (s) =>
        (s.student_id === studentId || s.student?.id === studentId) &&
        s.day_of_week === dayIndex &&
        s.start_time?.substring(0, 5) === sStart
    );

    if (conflictStudent) {
      toast.warning(
        'Trùng lịch học sinh',
        `Học sinh ${studentName} đã có lịch học vào khung giờ này!`
      );
      return;
    }

    // Open Modal with prefilled data for this tutor & student!
    onCreateSlot(dayIndex, session, 'Linh hoạt', {
      student_id: studentId,
      teacher_id: tutor.id,
      room: 'Linh hoạt',
    });

    setDraggedStudent(null);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* 📋 LEFT COLUMN: HÀNG ĐỢI HỌC SINH CẦN XẾP (Student Queue Sidebar) */}
      <div className="xl:col-span-4 bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200/80 dark:border-white/10 shadow-xs p-4 sm:p-5 space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-stone-100 dark:border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                Hàng đợi học sinh
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Kéo thẻ thả vào Gia sư để xếp lịch
              </p>
            </div>
          </div>

          <span className="px-2.5 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-xs font-semibold text-stone-600 dark:text-stone-300 border border-stone-200/50 dark:border-white/5">
            {filteredQueueStudents.length} em
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm tên học sinh..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-white/10 text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100 outline-none placeholder:text-stone-400 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex bg-stone-100 dark:bg-stone-800 p-0.5 rounded-xl gap-1 text-xs font-semibold">
          <button
            onClick={() => setQueueFilter('all')}
            className={cn(
              'flex-1 py-1 rounded-lg transition-all cursor-pointer',
              queueFilter === 'all'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            )}
          >
            Tất cả
          </button>
          <button
            onClick={() => setQueueFilter('unscheduled')}
            className={cn(
              'flex-1 py-1 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer',
              queueFilter === 'unscheduled'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-stone-500 hover:text-amber-600'
            )}
          >
            <AlertCircle className="w-3 h-3" /> Chưa xếp
          </button>
          <button
            onClick={() => setQueueFilter('scheduled')}
            className={cn(
              'flex-1 py-1 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer',
              queueFilter === 'scheduled'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-500 hover:text-emerald-600'
            )}
          >
            <CheckCircle2 className="w-3 h-3" /> Đã xếp
          </button>
          <button
            onClick={() => setQueueFilter('makeup')}
            className={cn(
              'flex-1 py-1 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer',
              queueFilter === 'makeup'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-stone-500 hover:text-sky-600'
            )}
          >
            <RefreshCw className="w-3 h-3" /> Cần bù
          </button>
        </div>

        {/* Student Cards List */}
        <div className="max-h-[calc(100vh-420px)] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {loadingStudents ? (
            <div className="py-12 text-center text-xs font-medium text-stone-400 animate-pulse">
              Đang tải danh sách học sinh...
            </div>
          ) : filteredQueueStudents.length === 0 ? (
            <div className="py-12 text-center text-xs font-medium text-stone-400">
              Không tìm thấy học sinh phù hợp
            </div>
          ) : (
            filteredQueueStudents.map((student) => {
              const info = studentScheduleCounts[student.id] || {
                count: 0,
                slots: [],
                hasMakeup: false,
              };
              const count = info.count;

              return (
                <div
                  key={student.id}
                  draggable={canEdit}
                  onDragStart={(e) => handleStudentDragStart(e, student)}
                  className={cn(
                    'p-2.5 rounded-xl border transition-all select-none cursor-grab active:cursor-grabbing shadow-xs hover:shadow-sm relative group',
                    count === 0
                      ? 'bg-white dark:bg-stone-800/80 border-stone-200/80 dark:border-white/5 hover:border-amber-500/40'
                      : info.hasMakeup
                        ? 'bg-sky-50/60 dark:bg-sky-950/20 border-sky-200/80 dark:border-sky-800/30'
                        : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/30'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0',
                          count === 0
                            ? 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                            : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        )}
                      >
                        {student.full_name?.charAt(0) || 'H'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-stone-900 dark:text-stone-100 text-xs sm:text-sm truncate">
                          {student.full_name}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5 mt-0.5">
                          {info.hasMakeup ? (
                            <span className="text-sky-600 dark:text-sky-400 font-semibold">
                              🔄 Cần học bù
                            </span>
                          ) : count > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              ✓ {count} ca tuần này
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-500 font-medium">
                              Chưa có ca nào
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Schedule Button */}
                    {canEdit && (
                      <button
                        onClick={() =>
                          onCreateSlot(0, ALL_SESSIONS[4], 'Linh hoạt', {
                            student_id: student.id,
                            room: 'Linh hoạt',
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-500 hover:text-white text-amber-700 dark:text-amber-300 text-xs font-semibold transition-all border border-amber-200/60 dark:border-amber-800/40 shrink-0 cursor-pointer"
                        title="Xếp ca nhanh"
                      >
                        + Xếp ca
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 📅 RIGHT COLUMN: BÀN ĐIỀU PHỐI GIA SƯ (Tutor Dispatch Matrix) */}
      <div className="xl:col-span-8 bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200/80 dark:border-white/10 shadow-xs p-4 sm:p-5 space-y-3.5">
        {/* Header & Session Shift Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-white/5 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                Lưới điều phối gia sư
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Thả học sinh vào ô Gia sư rảnh để tự động gán ca
              </p>
            </div>
          </div>

          {/* Session Shift Filter Pills */}
          <div className="flex bg-stone-100 dark:bg-stone-800 p-0.5 rounded-xl text-xs font-semibold gap-1 self-start sm:self-auto overflow-x-auto">
            <button
              onClick={() => setSessionFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap',
                sessionFilter === 'all'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              )}
            >
              Tất cả ca
            </button>
            <button
              onClick={() => setSessionFilter('evening')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap',
                sessionFilter === 'evening'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-amber-600'
              )}
            >
              Ca Tối (17h-21h30)
            </button>
            <button
              onClick={() => setSessionFilter('afternoon')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap',
                sessionFilter === 'afternoon'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-amber-600'
              )}
            >
              Ca Chiều (14h-17h)
            </button>
            <button
              onClick={() => setSessionFilter('morning')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap',
                sessionFilter === 'morning'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-amber-600'
              )}
            >
              Ca Sáng (8h-11h)
            </button>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] relative custom-scrollbar">
          <table className="w-full border-separate border-spacing-0 min-w-[1000px]">
            {/* Sticky Header */}
            <thead className="sticky top-0 z-30">
              <tr className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md">
                <th className="p-3 border-b border-r border-stone-200/70 dark:border-white/5 text-left text-xs font-semibold text-stone-600 dark:text-stone-300 w-44 sticky left-0 z-40 bg-white/95 dark:bg-stone-900/95">
                  Gia sư & Phụ trách
                </th>
                {DAYS.map((day, i) => (
                  <th
                    key={day}
                    className="p-2.5 border-b border-r border-stone-200/70 dark:border-white/5 text-center min-w-[130px]"
                  >
                    <div className="font-semibold text-stone-900 dark:text-stone-100 text-xs sm:text-sm">
                      {day}
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                      {weekDates[i]?.toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Matrix Body by Tutors */}
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {tutors.map((tutor) => {
                const tutorSlots = slots.filter(
                  (s) => s.teacher_id === tutor.id || s.teacher?.id === tutor.id
                );
                const tutoringCount = tutorSlots.filter(
                  (s) => !s.room || s.room === 'Linh hoạt' || !!s.student_id
                ).length;

                return (
                  <React.Fragment key={tutor.id}>
                    {/* Tutor Header Row */}
                    <tr className="bg-stone-50 dark:bg-stone-800/60">
                      <td
                        colSpan={8}
                        className="p-2 px-4 border-b border-stone-200/70 dark:border-white/5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center">
                              {tutor.full_name?.charAt(0) || 'G'}
                            </div>
                            <span className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                              {tutor.full_name}
                            </span>
                            {tutor.phone && (
                              <span className="text-xs text-stone-500 font-mono">
                                • {tutor.phone}
                              </span>
                            )}
                          </div>

                          <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200/60 dark:border-emerald-800/40">
                            {tutoringCount} ca kèm tuần này
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Session Rows for this Tutor */}
                    {activeSessions.map((session) => (
                      <tr key={`${tutor.id}-${session.id}`} className="group/row">
                        {/* Session Label Column */}
                        <td className="p-2 border-b border-r border-stone-200/70 dark:border-white/5 sticky left-0 z-20 bg-white/95 dark:bg-stone-900/95 shadow-[2px_0_8px_rgba(0,0,0,0.02)]">
                          <div className="font-semibold text-amber-700 dark:text-amber-400 text-xs">
                            {session.label}
                          </div>
                          <div className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                            {session.time || `${session.start} - ${session.end}`}
                          </div>
                        </td>

                        {/* 7 Days Cells */}
                        {DAYS.map((_, dayIndex) => {
                          const isAvailable = session.days?.includes(dayIndex) ?? true;

                          // Find slot for this tutor, day, time
                          const cellSlots = isAvailable
                            ? tutorSlots.filter(
                                (s) =>
                                  s.day_of_week === dayIndex &&
                                  s.start_time?.substring(0, 5) === session.start
                              )
                            : [];

                          const regularClassSlot = cellSlots.find(
                            (s) => s.room && s.room !== 'Linh hoạt' && !s.student_id
                          );
                          const tutoringSlot = cellSlots.find(
                            (s) => !s.room || s.room === 'Linh hoạt' || !!s.student_id
                          );

                          return (
                            <td
                              key={dayIndex}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDropOnTutorCell(e, dayIndex, session, tutor)}
                              className={cn(
                                'p-2 border-b border-r border-stone-200/70 dark:border-white/5 h-20 align-top transition-all relative',
                                !isAvailable
                                  ? 'bg-stone-500/5 dark:bg-white/2 opacity-30'
                                  : regularClassSlot
                                    ? 'bg-stone-100/70 dark:bg-stone-800/40'
                                    : 'hover:bg-amber-500/[0.04]'
                              )}
                            >
                              {!isAvailable ? (
                                <div className="h-full rounded-xl border border-stone-200/30 dark:border-white/5 flex items-center justify-center">
                                  <span className="text-[9px] text-stone-400 font-bold uppercase">
                                    Nghỉ
                                  </span>
                                </div>
                              ) : regularClassSlot ? (
                                /* Busy with Regular Class */
                                <div className="h-full p-2 rounded-xl bg-stone-200/60 dark:bg-stone-800 border border-stone-300/50 dark:border-white/10 flex flex-col justify-between">
                                  <span className="text-[9px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                                    Lớp chính
                                  </span>
                                  <div className="text-[11px] font-black text-stone-800 dark:text-stone-200 truncate">
                                    {regularClassSlot.class?.name || 'Lớp học'}
                                  </div>
                                  <span className="text-[9px] text-stone-400 font-bold">
                                    {regularClassSlot.room}
                                  </span>
                                </div>
                              ) : tutoringSlot ? (
                                /* Tutoring Slot */
                                (() => {
                                  const colors = getSubjectColor(tutoringSlot.subject?.name, true);
                                  return (
                                    <div
                                      onClick={() => onEditSlot(tutoringSlot)}
                                      className={cn(
                                        'h-full p-2 rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between group/slot',
                                        colors.bg,
                                        colors.border,
                                        colors.borderLeft,
                                        'border-l-[3px]'
                                      )}
                                    >
                                      <div>
                                        <div className="font-black text-stone-900 dark:text-stone-100 text-xs truncate leading-tight">
                                          {tutoringSlot.student?.full_name || 'Học sinh'}
                                        </div>
                                        <span
                                          className={cn(
                                            'text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md border mt-0.5 inline-block',
                                            colors.badge
                                          )}
                                        >
                                          {tutoringSlot.subject?.name || 'Kèm 1-1'}
                                        </span>
                                      </div>

                                      <div className="flex items-center justify-between pt-1 border-t border-stone-200/40 dark:border-white/5 mt-1">
                                        <span className="text-[9px] font-bold text-stone-500 dark:text-stone-400">
                                          {tutoringSlot.status === 'completed'
                                            ? '🟢 Xong'
                                            : tutoringSlot.status === 'makeup'
                                              ? '🔵 Bù'
                                              : tutoringSlot.status === 'cancelled'
                                                ? '🔴 Hủy'
                                                : '🟡 Đã xếp'}
                                        </span>

                                        {canEdit && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onDeleteSlot(tutoringSlot.id);
                                            }}
                                            className="opacity-0 group-hover/slot:opacity-100 text-red-500 hover:text-red-700 text-[10px]"
                                            title="Hủy ca"
                                          >
                                            ✕
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()
                              ) : /* Empty / Available for Dropping */
                              canEdit ? (
                                <div
                                  onClick={() =>
                                    onCreateSlot(dayIndex, session, 'Linh hoạt', {
                                      teacher_id: tutor.id,
                                      room: 'Linh hoạt',
                                    })
                                  }
                                  className="h-full min-h-[50px] rounded-xl border-2 border-dashed border-stone-200/60 dark:border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/[0.05] cursor-pointer flex items-center justify-center transition-all group/cell"
                                >
                                  <Plus className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 group-hover/cell:text-emerald-500 group-hover/cell:scale-110 transition-all" />
                                </div>
                              ) : (
                                <div className="h-full rounded-xl border border-dashed border-stone-200/30 dark:border-white/5" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
