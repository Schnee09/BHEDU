'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  GraduationCap,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  RefreshCw,
  Zap,
  Move,
  Loader2,
  BookOpen,
  ChevronRight,
  X,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDisplayName, normalizeVietnamese } from '@/lib/utils/names';
import { TimetableSlot, TeacherOption, StudentOption, SubjectOption } from '@/lib/timetable/types';
import { DAYS, ALL_SESSIONS } from '@/lib/timetable/constants';
import { getSubjectColor } from '@/lib/timetable/subject-colors';
import { apiFetch } from '@/lib/api/client';
import { useToast } from '@/hooks/useToast';

/**
 * Resolves the actual subjects that a tutor is assigned to teach
 * based on teacher_subjects, teaching_subjects, specialization, and timetable history.
 */
export function getTutorSubjects(
  tutor: TeacherOption,
  allSubjects: SubjectOption[],
  slots: TimetableSlot[] = []
): SubjectOption[] {
  const result: SubjectOption[] = [];
  const addedIds = new Set<string>();

  const addSubject = (sub: SubjectOption | undefined | null) => {
    if (sub && sub.id && !addedIds.has(sub.id)) {
      addedIds.add(sub.id);
      result.push(sub);
    }
  };

  // 1. From join table tutor.teacher_subjects
  if (Array.isArray(tutor.teacher_subjects)) {
    for (const ts of tutor.teacher_subjects) {
      const matched =
        allSubjects.find((s) => s.id === ts.subject_id || s.id === ts.subjects?.id) ||
        (ts.subjects
          ? ({
              id: ts.subjects.id,
              name: ts.subjects.name,
              code: ts.subjects.code || '',
            } as SubjectOption)
          : null);
      addSubject(matched);
    }
  }

  // 2. From tutor.teaching_subjects (array of string names, UUIDs, or codes)
  if (Array.isArray(tutor.teaching_subjects)) {
    for (const raw of tutor.teaching_subjects) {
      if (!raw || typeof raw !== 'string') continue;
      const rawTrimmed = raw.trim();
      const rawNorm = normalizeVietnamese(rawTrimmed);

      // Try exact ID match
      let matched = allSubjects.find((s) => s.id === rawTrimmed);
      // Try code match
      if (!matched && rawTrimmed.length <= 10) {
        matched = allSubjects.find((s) => s.code?.toLowerCase() === rawTrimmed.toLowerCase());
      }
      // Try exact normalized name match
      if (!matched) {
        matched = allSubjects.find((s) => normalizeVietnamese(s.name) === rawNorm);
      }
      // Try contains match
      if (!matched) {
        matched = allSubjects.find(
          (s) =>
            normalizeVietnamese(s.name).includes(rawNorm) ||
            rawNorm.includes(normalizeVietnamese(s.name))
        );
      }

      if (matched) {
        addSubject(matched);
      }
    }
  }

  // 3. From specialization or department (e.g. "Toán Học", "Vật Lý")
  const specText = [tutor.specialization, tutor.department].filter(Boolean).join(' ');
  if (specText.trim()) {
    const specNorm = normalizeVietnamese(specText);
    for (const sub of allSubjects) {
      const subNorm = normalizeVietnamese(sub.name);
      if (subNorm && (specNorm.includes(subNorm) || subNorm.includes(specNorm))) {
        addSubject(sub);
      }
    }
  }

  // 4. From existing slot history for this tutor
  if (slots.length > 0) {
    const tutorSlotSubs = slots
      .filter((s) => (s.teacher_id === tutor.id || s.teacher?.id === tutor.id) && s.subject)
      .map((s) => s.subject!);
    for (const sSub of tutorSlotSubs) {
      const matched = allSubjects.find((s) => s.id === sSub.id) || (sSub as SubjectOption);
      addSubject(matched);
    }
  }

  return result;
}

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
  onMoveSlot?: (
    slotId: string,
    newDay: number,
    newStartTime: string,
    newEndTime: string,
    newRoom: string,
    newTeacherId?: string
  ) => Promise<void> | void;
  canEdit?: boolean;
}

export default function TutoringDispatchBoard({
  slots,
  tutors,
  weekDates,
  onEditSlot,
  onDeleteSlot,
  onCreateSlot,
  onRefresh,
  onMoveSlot,
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

  // Dragging state (supports both new student from queue and moving existing slot)
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    type: 'new-student' | 'existing-slot' | null;
    studentId?: string;
    studentName?: string;
    slotId?: string;
    sourceTutorId?: string;
    sourceDay?: number;
    sourceSessionStart?: string;
  }>({
    isDragging: false,
    type: null,
  });

  // Hovered target cell for active dropzone indicator
  const [hoveredCell, setHoveredCell] = useState<{
    tutorId: string;
    dayIndex: number;
    sessionId: string | number;
  } | null>(null);

  // Instant Dispatch mode (skip heavy modal on drop)
  const [instantMode, setInstantMode] = useState<boolean>(true);
  const [isSubmittingQuickSlot, setIsSubmittingQuickSlot] = useState<boolean>(false);

  // Quick 1-click subject selection popup when a tutor teaches multiple subjects
  const [pendingMultiSubjectDrop, setPendingMultiSubjectDrop] = useState<{
    studentId: string;
    studentName: string;
    tutor: TeacherOption;
    tutorSubjects: SubjectOption[];
    dayIndex: number;
    session: any;
  } | null>(null);

  // Close multi-subject drop dialog on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPendingMultiSubjectDrop(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fast Slot Creator
  const executeQuickSlotCreation = async (
    studentId: string,
    studentName: string,
    tutor: TeacherOption,
    dayIndex: number,
    session: any,
    subjectId: string,
    subjectName?: string
  ) => {
    try {
      setIsSubmittingQuickSlot(true);
      const res = await apiFetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          teacher_id: tutor.id,
          subject_id: subjectId,
          day_of_week: dayIndex,
          start_time: session.start,
          end_time: session.end,
          room: 'Linh hoạt',
          status: 'scheduled',
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Không thể tạo ca học');
      }

      toast.success(
        '⚡ Xếp ca thành công!',
        `Đã gán học sinh ${studentName} cho Gia sư ${tutor.full_name}${
          subjectName ? ` (Môn: ${subjectName})` : ''
        } - ${DAYS[dayIndex]}, ${session.label}`
      );
      onRefresh?.();
    } catch (err: any) {
      toast.error('Lỗi xếp ca', err.message || 'Không thể tạo ca học tự động');
    } finally {
      setIsSubmittingQuickSlot(false);
      handleDragEnd();
    }
  };

  // Helper to safely format student name without "undefined"
  const getStudentName = (s?: any) => {
    if (!s) return 'Học sinh';
    const raw = (s.full_name || getDisplayName(s) || '').trim();
    const cleaned = raw.replace(/undefined/gi, '').trim();
    return cleaned || s.email || 'Học sinh';
  };

  // Queue visibility toggle state (allows full-screen tutor grid, collapsed by default on mobile)
  const [isQueueCollapsed, setIsQueueCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1280;
    }
    return false;
  });

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
      result = result.filter((s) => getStudentName(s).toLowerCase().includes(q));
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
    const sName = getStudentName(student);
    setDragState({
      isDragging: true,
      type: 'new-student',
      studentId: student.id,
      studentName: sName,
    });
    e.dataTransfer.setData('text/drag-type', 'new-student');
    e.dataTransfer.setData('text/student-id', student.id);
    e.dataTransfer.setData('text/student-name', sName);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Drag handlers for existing slot in Matrix
  const handleSlotDragStart = (e: React.DragEvent, slot: TimetableSlot) => {
    if (!canEdit) return;
    const sName = getStudentName(slot.student);
    const sId = slot.student_id || slot.student?.id || '';
    setDragState({
      isDragging: true,
      type: 'existing-slot',
      slotId: slot.id,
      studentId: sId,
      studentName: sName,
      sourceTutorId: slot.teacher?.id || slot.teacher_id,
      sourceDay: slot.day_of_week,
      sourceSessionStart: slot.start_time?.substring(0, 5),
    });
    e.dataTransfer.setData('text/drag-type', 'existing-slot');
    e.dataTransfer.setData('text/slot-id', slot.id);
    e.dataTransfer.setData('text/student-id', sId);
    e.dataTransfer.setData('text/student-name', sName);
    e.dataTransfer.setData('text/source-tutor-id', slot.teacher?.id || slot.teacher_id || '');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDragState({ isDragging: false, type: null });
    setHoveredCell(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = dragState.type === 'existing-slot' ? 'move' : 'copy';
  };

  const handleDragEnterCell = (tutorId: string, dayIndex: number, sessionId: string | number) => {
    if (!canEdit) return;
    setHoveredCell({ tutorId, dayIndex, sessionId });
  };

  const handleDragLeaveCell = (tutorId: string, dayIndex: number, sessionId: string | number) => {
    if (
      hoveredCell?.tutorId === tutorId &&
      hoveredCell?.dayIndex === dayIndex &&
      String(hoveredCell?.sessionId) === String(sessionId)
    ) {
      setHoveredCell(null);
    }
  };

  const handleDropOnTutorCell = async (
    e: React.DragEvent,
    dayIndex: number,
    session: any,
    tutor: TeacherOption
  ) => {
    e.preventDefault();
    setHoveredCell(null);
    if (!canEdit) return;

    const dragType = e.dataTransfer.getData('text/drag-type') || dragState.type || 'new-student';
    const studentId = e.dataTransfer.getData('text/student-id') || dragState.studentId;
    const studentName =
      e.dataTransfer.getData('text/student-name') || dragState.studentName || 'Học sinh';

    // ── CASE 1: MOVING AN EXISTING SLOT ──
    if (dragType === 'existing-slot') {
      const slotId = e.dataTransfer.getData('text/slot-id') || dragState.slotId;
      if (!slotId) {
        handleDragEnd();
        return;
      }

      const sourceTutorId =
        e.dataTransfer.getData('text/source-tutor-id') || dragState.sourceTutorId;
      const sourceDay = dragState.sourceDay;
      const sourceSessionStart = dragState.sourceSessionStart;

      // If dropped onto the exact same slot position, do nothing
      if (
        sourceTutorId === tutor.id &&
        sourceDay === dayIndex &&
        sourceSessionStart === session.start
      ) {
        handleDragEnd();
        return;
      }

      // Check if target cell already has a slot or conflict
      const targetTutoringSlot = slots.find(
        (s) =>
          (s.teacher_id === tutor.id || s.teacher?.id === tutor.id) &&
          s.day_of_week === dayIndex &&
          s.start_time?.substring(0, 5) === session.start &&
          (!s.room || s.room === 'Linh hoạt' || !!s.student_id)
      );

      if (targetTutoringSlot && targetTutoringSlot.id !== slotId) {
        toast.warning(
          'Ô đã có ca học',
          `Gia sư ${tutor.full_name} đã có ca học kèm với ${getStudentName(targetTutoringSlot.student)} vào khung giờ này!`
        );
        handleDragEnd();
        return;
      }

      if (onMoveSlot) {
        await onMoveSlot(slotId, dayIndex, session.start, session.end, 'Linh hoạt', tutor.id);
        toast.success(
          'Đã chuyển ca học',
          `Đã chuyển ca của ${studentName} sang Gia sư ${tutor.full_name} (${DAYS[dayIndex]}, ${session.label})`
        );
      }
      handleDragEnd();
      return;
    }

    // ── CASE 2: DISPATCHING A NEW STUDENT FROM QUEUE ──
    if (!studentId) {
      handleDragEnd();
      return;
    }

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
      handleDragEnd();
      return;
    }

    // Detect tutor's actual subjects accurately
    const tutorSubs = getTutorSubjects(tutor, subjects, slots);

    // Fast Instant Mode:
    if (instantMode) {
      // 1. Tutor teaches EXACTLY 1 subject -> assign immediately!
      const singleSub = tutorSubs[0];
      if (tutorSubs.length === 1 && singleSub) {
        await executeQuickSlotCreation(
          studentId,
          studentName,
          tutor,
          dayIndex,
          session,
          singleSub.id,
          singleSub.name
        );
        return;
      }

      // 2. Tutor teaches MULTIPLE subjects (> 1) -> prompt 1-click modal for tutor's subjects!
      if (tutorSubs.length > 1) {
        setPendingMultiSubjectDrop({
          studentId,
          studentName,
          tutor,
          tutorSubjects: tutorSubs,
          dayIndex,
          session,
        });
        return;
      }

      // 3. Tutor has NO subject declared yet (0 subjects) -> prompt 1-click modal with available subjects
      if (subjects.length > 0) {
        setPendingMultiSubjectDrop({
          studentId,
          studentName,
          tutor,
          tutorSubjects: subjects,
          dayIndex,
          session,
        });
        return;
      }
    }

    // Fallback: Open Modal with prefilled data for this tutor & student!
    const defaultSubjectId = tutorSubs[0]?.id || (subjects.length > 0 ? subjects[0]?.id : '');
    onCreateSlot(dayIndex, session, 'Linh hoạt', {
      student_id: studentId,
      teacher_id: tutor.id,
      subject_id: defaultSubjectId,
      room: 'Linh hoạt',
    });

    handleDragEnd();
  };

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-5 items-start transition-all',
        isQueueCollapsed ? 'xl:grid-cols-1' : 'xl:grid-cols-12'
      )}
    >
      {/* 📋 LEFT COLUMN: HÀNG ĐỢI HỌC SINH CẦN XẾP (Student Queue Sidebar) */}
      {!isQueueCollapsed && (
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

            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-xs font-semibold text-stone-600 dark:text-stone-300 border border-stone-200/50 dark:border-white/5">
                {filteredQueueStudents.length} em
              </span>
              <button
                type="button"
                onClick={() => setIsQueueCollapsed(true)}
                className="p-1.5 rounded-xl border border-stone-200/80 dark:border-white/10 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all cursor-pointer shrink-0"
                title="Thu gọn hàng đợi để xem Lưới toàn màn hình"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
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

                const sName = getStudentName(student);

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
                          {sName.charAt(0).toUpperCase() || 'H'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-stone-900 dark:text-stone-100 text-xs sm:text-sm truncate">
                            {sName}
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
      )}

      {/* 📅 RIGHT COLUMN: BÀN ĐIỀU PHỐI GIA SƯ (Tutor Dispatch Matrix) */}
      <div
        className={cn(
          'bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200/80 dark:border-white/10 shadow-xs p-4 sm:p-5 space-y-3.5 transition-all',
          isQueueCollapsed ? 'xl:col-span-1' : 'xl:col-span-8'
        )}
      >
        {/* Header & Session Shift Selector */}
        <div className="space-y-3 border-b border-stone-100 dark:border-white/5 pb-3.5">
          {/* Row 1: Title & Main Control Toggles */}
          <div className="flex items-center justify-between gap-3 min-w-0">
            {/* Title & Info */}
            <div className="flex items-center gap-2.5 min-w-0">
              {isQueueCollapsed && (
                <button
                  type="button"
                  onClick={() => setIsQueueCollapsed(false)}
                  className="h-8 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
                  title="Mở lại hàng đợi học sinh để kéo thả ghép ca"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Hiện học sinh</span>
                </button>
              )}

              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 truncate">
                    Lưới điều phối gia sư
                  </h3>
                  {isQueueCollapsed && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shrink-0">
                      Toàn màn hình
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 truncate sm:whitespace-normal">
                  {isQueueCollapsed
                    ? 'Xem tổng quan lịch tuần của toàn bộ gia sư'
                    : 'Thả học sinh vào ô Gia sư rảnh để tự động gán ca'}
                </p>
              </div>
            </div>

            {/* Quick Actions (Instant Mode & Collapse Toggle) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Instant Mode Toggle Button */}
              <button
                type="button"
                onClick={() => setInstantMode(!instantMode)}
                className={cn(
                  'px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer shrink-0',
                  instantMode
                    ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-xs'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-white/10'
                )}
                title={
                  instantMode
                    ? 'Chế độ Xếp ca siêu tốc đang BẬT: Thả là tự động gán ca ngay lập tức'
                    : 'Chế độ Xếp ca thường: Thả sẽ mở popup Modal để chỉnh sửa chi tiết'
                }
              >
                {isSubmittingQuickSlot ? (
                  <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                ) : (
                  <Zap
                    className={cn(
                      'w-3.5 h-3.5',
                      instantMode ? 'text-amber-500 fill-amber-500' : 'text-stone-400'
                    )}
                  />
                )}
                <span className="hidden sm:inline">Xếp siêu tốc:</span>
                <span
                  className={
                    instantMode
                      ? 'text-amber-600 dark:text-amber-400 font-bold'
                      : 'text-stone-500 font-bold'
                  }
                >
                  {instantMode ? 'Bật' : 'Tắt'}
                </span>
              </button>

              {/* Quick Toggle Button */}
              <button
                type="button"
                onClick={() => setIsQueueCollapsed(!isQueueCollapsed)}
                className="px-2 sm:px-2.5 py-1.5 rounded-xl border border-stone-200/80 dark:border-white/10 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer shrink-0"
                title={
                  isQueueCollapsed
                    ? 'Mở cột học sinh kéo thả'
                    : 'Thu gọn cột học sinh (xem lưới rộng)'
                }
              >
                {isQueueCollapsed ? (
                  <>
                    <Users className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden sm:inline">Hiện học sinh</span>
                  </>
                ) : (
                  <>
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Lưới rộng</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Row 2: Shift Filter Pills & Action Helper */}
          <div className="flex items-center justify-between gap-2 min-w-0 pt-0.5">
            {/* Shift Filter Pills Container with horizontal scroll */}
            <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto no-scrollbar py-0.5 w-full sm:w-auto">
              <span className="text-[11px] sm:text-xs font-semibold text-stone-400 dark:text-stone-500 shrink-0 flex items-center gap-1 hidden xs:inline-flex">
                <Clock className="w-3 h-3 text-stone-400" />
                <span>Ca học:</span>
              </span>
              <div className="flex bg-stone-100 dark:bg-stone-800 p-0.5 rounded-xl text-xs font-semibold gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setSessionFilter('all')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap',
                    sessionFilter === 'all'
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  )}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setSessionFilter('evening')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap',
                    sessionFilter === 'evening'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-amber-600'
                  )}
                  title="Ca Tối (17h00 - 21h30)"
                >
                  Ca Tối
                </button>
                <button
                  type="button"
                  onClick={() => setSessionFilter('afternoon')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap',
                    sessionFilter === 'afternoon'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-amber-600'
                  )}
                  title="Ca Chiều (14h00 - 17h00)"
                >
                  Ca Chiều
                </button>
                <button
                  type="button"
                  onClick={() => setSessionFilter('morning')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap',
                    sessionFilter === 'morning'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-amber-600'
                  )}
                  title="Ca Sáng (08h00 - 11h00)"
                >
                  Ca Sáng
                </button>
              </div>
            </div>

            {/* Quick Helper Badge */}
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Kéo thả học sinh vào ô để gán ca</span>
            </div>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)] relative custom-scrollbar pb-6 sm:pb-2">
          <table className="w-full border-separate border-spacing-0 min-w-[880px] sm:min-w-[1000px]">
            {/* Sticky Header */}
            <thead className="sticky top-0 z-30">
              <tr className="bg-white dark:bg-stone-900">
                <th className="p-2.5 sm:p-3 border-b border-r border-stone-200 dark:border-stone-800 text-left text-xs font-bold text-stone-700 dark:text-stone-300 w-28 sm:w-36 md:w-44 sticky left-0 z-40 bg-white dark:bg-stone-900 shadow-[2px_0_6px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_6px_rgba(0,0,0,0.5)]">
                  <div className="whitespace-nowrap font-bold text-stone-800 dark:text-stone-200">
                    <span className="hidden sm:inline">Gia sư & Phụ trách</span>
                    <span className="sm:hidden">Ca học / Buổi</span>
                  </div>
                </th>
                {DAYS.map((day, i) => (
                  <th
                    key={day}
                    className="p-2 sm:p-2.5 border-b border-r border-stone-200/80 dark:border-stone-800 text-center min-w-[110px] sm:min-w-[130px] bg-white dark:bg-stone-900"
                  >
                    <div className="font-bold text-stone-900 dark:text-stone-100 text-xs sm:text-sm">
                      {day}
                    </div>
                    <div className="text-[11px] sm:text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
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
                const tutorSubjects = getTutorSubjects(tutor, subjects, slots);

                return (
                  <React.Fragment key={tutor.id}>
                    {/* Tutor Header Row with Sticky Left Content so name never scrolls away */}
                    <tr className="bg-stone-100/90 dark:bg-stone-800/90">
                      <td
                        colSpan={8}
                        className="p-2 px-3 sm:px-4 border-b border-stone-200/80 dark:border-stone-800"
                      >
                        <div className="sticky left-2 sm:left-4 flex items-center justify-between gap-3 max-w-[calc(100vw-4rem)] sm:max-w-none">
                          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                              {tutor.full_name?.charAt(0) || 'G'}
                            </div>
                            <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                              {tutor.full_name}
                            </span>
                            {tutor.phone && (
                              <span className="text-xs text-stone-500 font-mono hidden sm:inline">
                                • {tutor.phone}
                              </span>
                            )}
                            {/* Tutor Subject Badges */}
                            {tutorSubjects.length > 0 ? (
                              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap ml-0.5 sm:ml-1">
                                {tutorSubjects.map((sub) => {
                                  const colorStyle = getSubjectColor(sub.name);
                                  return (
                                    <span
                                      key={sub.id}
                                      className={cn(
                                        'inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold border shadow-2xs',
                                        colorStyle.badge
                                      )}
                                      title={`Gia sư phụ trách môn ${sub.name}`}
                                    >
                                      <BookOpen className="w-2.5 h-2.5 opacity-80" />
                                      {sub.name}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-[10px] sm:text-[11px] text-stone-400 italic ml-1">
                                (Chưa gán môn)
                              </span>
                            )}
                          </div>

                          <span className="px-2 sm:px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] sm:text-xs font-semibold border border-emerald-200/60 dark:border-emerald-800/40 shrink-0 whitespace-nowrap">
                            {tutoringCount} ca kèm
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Session Rows for this Tutor */}
                    {activeSessions.map((session) => (
                      <tr key={`${tutor.id}-${session.id}`} className="group/row">
                        {/* Session Label Column (100% Solid Sticky Background) */}
                        <td className="p-2 border-b border-r border-stone-200 dark:border-stone-800 sticky left-0 z-20 bg-white dark:bg-stone-900 w-28 sm:w-36 md:w-44 shadow-[2px_0_6px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_6px_rgba(0,0,0,0.5)]">
                          <div className="font-bold text-amber-700 dark:text-amber-400 text-xs">
                            {session.label}
                          </div>
                          <div className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 font-mono mt-0.5 whitespace-nowrap">
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

                          const isHovered =
                            hoveredCell?.tutorId === tutor.id &&
                            hoveredCell?.dayIndex === dayIndex &&
                            String(hoveredCell?.sessionId) === String(session.id);

                          const isSelfSlot =
                            dragState.type === 'existing-slot' &&
                            tutoringSlot &&
                            tutoringSlot.id === dragState.slotId;

                          const isConflict =
                            !isAvailable || !!regularClassSlot || (!!tutoringSlot && !isSelfSlot);

                          return (
                            <td
                              key={dayIndex}
                              onDragEnter={() =>
                                handleDragEnterCell(tutor.id, dayIndex, session.id)
                              }
                              onDragOver={handleDragOver}
                              onDragLeave={() =>
                                handleDragLeaveCell(tutor.id, dayIndex, session.id)
                              }
                              onDrop={(e) => handleDropOnTutorCell(e, dayIndex, session, tutor)}
                              className={cn(
                                'p-2 border-b border-r border-stone-200/70 dark:border-white/5 h-20 align-top transition-all relative select-none',
                                !isAvailable
                                  ? 'bg-stone-500/5 dark:bg-white/2 opacity-30'
                                  : regularClassSlot
                                    ? 'bg-stone-100/70 dark:bg-stone-800/40'
                                    : 'hover:bg-amber-500/[0.04]',
                                dragState.isDragging &&
                                  isAvailable &&
                                  !regularClassSlot &&
                                  !isHovered &&
                                  'border-2 border-dashed border-emerald-400/40 dark:border-emerald-600/30 bg-emerald-500/[0.02]',
                                isHovered &&
                                  !isConflict &&
                                  'border-2 border-emerald-500 bg-emerald-500/15 ring-4 ring-emerald-500/25 shadow-xl scale-[1.02] z-30',
                                isHovered &&
                                  isConflict &&
                                  'border-2 border-red-500 bg-red-500/15 ring-4 ring-red-500/20 shadow-xl z-30'
                              )}
                            >
                              {/* Hovering Dropzone Indicator Overlay */}
                              {isHovered && (
                                <div
                                  className={cn(
                                    'absolute inset-0 rounded-xl flex flex-col items-center justify-center p-1.5 text-white font-bold text-xs text-center shadow-lg animate-fade-in pointer-events-none z-40',
                                    isConflict
                                      ? 'bg-red-600/95 backdrop-blur-xs'
                                      : 'bg-emerald-600/95 backdrop-blur-xs'
                                  )}
                                >
                                  {isConflict ? (
                                    <>
                                      <span className="text-xs">⚠️ Đã có ca học</span>
                                      <span className="text-[10px] font-normal opacity-90">
                                        Không thể thả
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-xs">
                                        {dragState.type === 'existing-slot'
                                          ? '⚡ Chuyển ca sang đây'
                                          : '⚡ Thả để gán ca'}
                                      </span>
                                      <span className="text-[10px] font-normal opacity-90 truncate max-w-[120px]">
                                        {tutor.full_name}
                                      </span>
                                    </>
                                  )}
                                </div>
                              )}

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
                                      draggable={canEdit}
                                      onDragStart={(e) => handleSlotDragStart(e, tutoringSlot)}
                                      onDragEnd={handleDragEnd}
                                      onClick={() => onEditSlot(tutoringSlot)}
                                      className={cn(
                                        'h-full p-2 rounded-xl border transition-all cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md flex flex-col justify-between group/slot relative select-none',
                                        colors.bg,
                                        colors.border,
                                        colors.borderLeft,
                                        'border-l-[3px]',
                                        dragState.slotId === tutoringSlot.id &&
                                          'opacity-40 scale-95 ring-2 ring-amber-500/50'
                                      )}
                                      title={
                                        canEdit
                                          ? 'Bấm để sửa, hoặc kéo để chuyển ca/đổi gia sư'
                                          : undefined
                                      }
                                    >
                                      <div>
                                        <div className="flex items-center justify-between gap-1">
                                          <div className="font-black text-stone-900 dark:text-stone-100 text-xs truncate leading-tight">
                                            {getStudentName(tutoringSlot.student)}
                                          </div>
                                          {canEdit && (
                                            <span
                                              className="opacity-0 group-hover/slot:opacity-100 text-stone-400 hover:text-amber-600 transition-opacity shrink-0"
                                              title="Kéo để đổi ca"
                                            >
                                              <Move className="w-3 h-3" />
                                            </span>
                                          )}
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
                                            className="opacity-0 group-hover/slot:opacity-100 text-red-500 hover:text-red-700 text-[10px] cursor-pointer"
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
                                      subject_id: tutorSubjects[0]?.id || '',
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

      {/* 🚀 1-CLICK SUBJECT SELECTOR POPUP MODAL (When Tutor teaches > 1 subject or unspecified) */}
      {pendingMultiSubjectDrop && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => !isSubmittingQuickSlot && setPendingMultiSubjectDrop(null)}
        >
          <div
            className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200/80 dark:border-white/10 max-w-md w-full space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-stone-900 dark:text-stone-100">
                    Chọn môn học kèm (1-Chạm)
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Gia sư{' '}
                    <strong className="text-stone-700 dark:text-stone-200">
                      {pendingMultiSubjectDrop.tutor.full_name}
                    </strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSubmittingQuickSlot}
                onClick={() => setPendingMultiSubjectDrop(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Context Details Card */}
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-white/5 text-xs text-stone-600 dark:text-stone-300 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Học sinh:</span>
                <span className="font-black text-stone-900 dark:text-stone-100">
                  {pendingMultiSubjectDrop.studentName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Thời gian:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {DAYS[pendingMultiSubjectDrop.dayIndex]} • {pendingMultiSubjectDrop.session.label}{' '}
                  (
                  {pendingMultiSubjectDrop.session.time ||
                    `${pendingMultiSubjectDrop.session.start} - ${pendingMultiSubjectDrop.session.end}`}
                  )
                </span>
              </div>
            </div>

            {/* Subject Choices */}
            <div className="space-y-2">
              <div className="text-[11px] font-black text-stone-500 uppercase tracking-wider">
                Nhấp chọn môn cần xếp ca:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {pendingMultiSubjectDrop.tutorSubjects.map((sub) => {
                  const colorStyle = getSubjectColor(sub.name);
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      disabled={isSubmittingQuickSlot}
                      onClick={() => {
                        const target = pendingMultiSubjectDrop;
                        setPendingMultiSubjectDrop(null);
                        executeQuickSlotCreation(
                          target.studentId,
                          target.studentName,
                          target.tutor,
                          target.dayIndex,
                          target.session,
                          sub.id,
                          sub.name
                        );
                      }}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-2xl border text-left font-bold text-xs transition-all hover:scale-[1.02] active:scale-95 shadow-xs cursor-pointer group',
                        colorStyle.badge
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate min-w-0">
                        <BookOpen className="w-4 h-4 shrink-0 opacity-80 group-hover:scale-110 transition-transform" />
                        <div className="truncate">
                          <span className="block truncate font-bold">{sub.name}</span>
                          {sub.code && (
                            <span className="block text-[10px] opacity-75 font-mono font-normal">
                              {sub.code}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-white/5">
              <button
                type="button"
                disabled={isSubmittingQuickSlot}
                onClick={() => {
                  const target = pendingMultiSubjectDrop;
                  setPendingMultiSubjectDrop(null);
                  onCreateSlot(target.dayIndex, target.session, 'Linh hoạt', {
                    student_id: target.studentId,
                    teacher_id: target.tutor.id,
                    subject_id: target.tutorSubjects[0]?.id || '',
                    room: 'Linh hoạt',
                  });
                }}
                className="text-xs font-bold text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                Mở form chi tiết...
              </button>

              <button
                type="button"
                disabled={isSubmittingQuickSlot}
                onClick={() => setPendingMultiSubjectDrop(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
