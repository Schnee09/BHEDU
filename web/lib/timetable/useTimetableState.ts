import { useState, useEffect, useMemo, useCallback } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { usePermissions } from '@/hooks/usePermissions';
import { apiFetch } from '@/lib/api/client';
import { useToast } from '@/hooks/useToast';
import { getWeekDates } from './utils';
import { CAMPUSES, ALL_SESSIONS } from './constants';
import { TimetableSlot, ClassOption, TeacherOption } from './types';

export type PrimaryTab = 'personal' | 'room' | 'class' | 'teacher';
export type DisplayLayout = 'timeline' | 'agenda' | 'grid';

export function useTimetableState() {
  const { profile, loading: profileLoading } = useProfile();
  const { can, role, isAdmin, isTeacher, isStudent } = usePermissions();
  const toast = useToast();

  const canEdit = can('timetable.edit') || role === 'super_admin' || role === 'owner';

  // Primary Navigation Tab
  const [activeTab, setActiveTab] = useState<PrimaryTab>('class');
  const [isTabInitialized, setIsTabInitialized] = useState(false);

  // Display Layout (timeline, agenda, grid)
  const [displayLayout, setDisplayLayout] = useState<DisplayLayout>('timeline');

  // Filter & Search States
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [selectedCampus, setSelectedCampus] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data States
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [personalSlots, setPersonalSlots] = useState<TimetableSlot[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [branchRooms, setBranchRooms] = useState<Record<string, string[]>>({});
  const [dynamicRooms, setDynamicRooms] = useState<string[]>([]);
  const [dynamicSchedules, setDynamicSchedules] = useState<string[]>([]);

  // Filter Dropdown Lists
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [tutors, setTutors] = useState<TeacherOption[]>([]);

  // Dragging States for Busy Indicators
  const [draggingSlotId, setDraggingSlotId] = useState<string | null>(null);
  const [draggingTeacherId, setDraggingTeacherId] = useState<string | null>(null);
  const [draggingClassId, setDraggingClassId] = useState<string | null>(null);

  // Quick Action Modal & Edit Modal
  const [activeActionSlot, setActiveActionSlot] = useState<TimetableSlot | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [initialModalData, setInitialModalData] = useState<Partial<TimetableSlot>>({});

  // Direct Interactive Quick Modals (Option 3 Upgrade)
  const [quickScheduleData, setQuickScheduleData] = useState<{
    isOpen: boolean;
    dayIndex: number;
    session?: any;
    room?: string;
  } | null>(null);

  const [slotActionData, setSlotActionData] = useState<{
    isOpen: boolean;
    slot: TimetableSlot | null;
  } | null>(null);

  const openQuickSchedule = (dayIndex: number, session?: any, room?: string) => {
    setQuickScheduleData({
      isOpen: true,
      dayIndex,
      session,
      room,
    });
  };

  const closeQuickSchedule = () => {
    setQuickScheduleData(null);
  };

  const openSlotAction = (slot: TimetableSlot) => {
    setSlotActionData({
      isOpen: true,
      slot,
    });
  };

  const closeSlotAction = () => {
    setSlotActionData(null);
  };

  const weekDates = useMemo(() => getWeekDates(currentWeek), [currentWeek]);
  const currentWeekStart = weekDates[0]?.toISOString().split('T')[0] || '';

  // Auto-initialize device layout preference
  useEffect(() => {
    if (isTabInitialized) return;

    const savedLayout = localStorage.getItem('timetable_display_layout') as DisplayLayout;
    if (savedLayout && ['timeline', 'grid', 'agenda'].includes(savedLayout)) {
      setDisplayLayout(savedLayout);
    } else if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setDisplayLayout('agenda');
    }

    setIsTabInitialized(true);
  }, [isTabInitialized]);

  const handleLayoutChange = (newLayout: DisplayLayout) => {
    setDisplayLayout(newLayout);
    localStorage.setItem('timetable_display_layout', newLayout);
  };

  // Fetch Filter Dropdowns & Real Resource Settings
  const fetchFilterOptions = useCallback(async () => {
    try {
      const [classRes, teacherRes, tutorRes, resourceRes] = await Promise.all([
        apiFetch('/api/classes'),
        apiFetch('/api/teachers'),
        apiFetch('/api/tutors?limit=1000'),
        apiFetch('/api/settings?category=resource'),
      ]);
      const classData = await classRes.json();
      const teacherData = await teacherRes.json();
      const tutorData = await tutorRes.json();

      const classList = classData.data?.data || classData.data || classData.classes;
      setClasses(Array.isArray(classList) ? classList : []);

      const teacherList =
        teacherData.data?.teachers ||
        teacherData.teachers ||
        teacherData.data?.data ||
        teacherData.data ||
        teacherData.users;
      setTeachers(Array.isArray(teacherList) ? teacherList : []);

      const tutorList =
        tutorData.data?.tutors ||
        tutorData.tutors ||
        tutorData.data?.data ||
        (Array.isArray(tutorData.data) ? tutorData.data : []);
      setTutors(Array.isArray(tutorList) ? tutorList : []);

      if (resourceRes.ok) {
        const resourceJson = await resourceRes.json();
        const settings = resourceJson.settings || {};

        // Real Branches
        if (
          settings.center_branches?.value_json &&
          Array.isArray(settings.center_branches.value_json)
        ) {
          setBranches(settings.center_branches.value_json);
        }

        // Real Rooms per Branch
        if (settings.center_rooms?.value_json) {
          const rawRooms = settings.center_rooms.value_json;
          if (rawRooms && typeof rawRooms === 'object' && !Array.isArray(rawRooms)) {
            setBranchRooms(rawRooms);
            const flatRooms: string[] = [];
            for (const [branch, rms] of Object.entries(rawRooms)) {
              if (Array.isArray(rms)) {
                rms.forEach((r) => flatRooms.push(`${branch} - ${r}`));
              }
            }
            setDynamicRooms(flatRooms);
          } else if (Array.isArray(rawRooms)) {
            setDynamicRooms(rawRooms);
            setBranchRooms({ 'Cơ sở chính': rawRooms });
          }
        }

        // Real Center Schedules / Shifts
        if (
          settings.center_schedules?.value_json &&
          Array.isArray(settings.center_schedules.value_json)
        ) {
          setDynamicSchedules(settings.center_schedules.value_json);
        }
      }
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    }
  }, []);

  // Fetch Main Timetable Slots (Direct center-wide query)
  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      if (selectedClass) {
        const res = await apiFetch(
          `/api/timetable?class_id=${selectedClass}&week_start_date=${currentWeekStart}`
        );
        const data = await res.json();
        setSlots(data.data?.slots || data.slots || []);
      } else {
        const res = await apiFetch(
          `/api/timetable/all?week_start_date=${currentWeekStart}&t=${Date.now()}`
        );
        const data = await res.json();
        setSlots(data.data?.slots || data.slots || []);
      }
    } catch (error) {
      console.error('Failed to fetch timetable slots:', error);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart, selectedClass]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Actions
  const openCreateModal = (dayIndex?: number, period?: any, room?: string) => {
    if (!canEdit) return;
    setEditingSlot(null);
    setInitialModalData({
      day_of_week: dayIndex ?? 0,
      start_time: period?.start ?? '17:00',
      end_time: period?.end ?? '18:30',
      room: room || '',
      class_id: room !== 'Linh hoạt' ? selectedClass : '',
    });
    setShowEditModal(true);
  };

  const openEditModal = (slot: TimetableSlot) => {
    if (canEdit) {
      setEditingSlot(slot);
      setShowEditModal(true);
    } else {
      setActiveActionSlot(slot);
    }
  };

  const handleSlotClick = (slot: TimetableSlot) => {
    setActiveActionSlot(slot);
  };

  const handleMoveSlot = async (
    slotId: string,
    newDay: number,
    newStartTime: string,
    newEndTime: string,
    newRoom: string
  ) => {
    if (!canEdit) return;
    const currentSlot = slots.find((s) => s.id === slotId);
    if (!currentSlot) return;

    // Optimistic UI Update
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? {
              ...s,
              day_of_week: newDay,
              start_time: newStartTime,
              end_time: newEndTime,
              room: newRoom,
            }
          : s
      )
    );

    try {
      const response = await apiFetch(`/api/timetable/${slotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: currentSlot.class_id || null,
          student_id: currentSlot.student_id || null,
          subject_id: currentSlot.subject?.id || null,
          teacher_id: currentSlot.teacher?.id || null,
          day_of_week: newDay,
          start_time: newStartTime,
          end_time: newEndTime,
          room: newRoom,
          notes: currentSlot.notes || '',
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Trùng lịch học hoặc phòng học!');
      }
      toast.success('Thành công', 'Đã cập nhật thời khóa biểu');
    } catch (error: any) {
      toast.error('Lỗi xếp lịch', error.message);
      fetchSlots(); // Revert optimistic update on failure
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!canEdit) return;
    if (!confirm('Bạn có chắc muốn xóa tiết học này?')) return;

    setSlots((prev) => prev.filter((s) => s.id !== slotId));

    try {
      const response = await apiFetch(`/api/timetable/${slotId}`, { method: 'DELETE' });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      toast.success('Thành công', 'Đã xóa tiết học');
    } catch (error: any) {
      toast.error('Lỗi', error.message);
      fetchSlots();
    }
  };

  const handleUpdateSlotStatus = async (
    slotId: string,
    newStatus: 'scheduled' | 'completed' | 'cancelled' | 'makeup'
  ) => {
    // NOTE: DB table `timetable_slots` does NOT have a `status` column.
    // Status is tracked client-side only via the slot's weekly_note as a lightweight workaround.
    // We persist the status change by saving it into the weekly_notes system.
    const previousSlots = [...slots];

    // Optimistic UI
    setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, status: newStatus } : s)));

    try {
      // Save status as a structured weekly note prefix
      const currentSlot = slots.find((s) => s.id === slotId);
      const existingNote = currentSlot?.weekly_note || currentSlot?.notes || '';
      // Strip any previous status prefix
      const cleanNote = existingNote.replace(
        /^\[(?:scheduled|completed|cancelled|makeup)\]\s*/i,
        ''
      );
      const noteWithStatus = `[${newStatus}] ${cleanNote}`.trim();

      if (currentWeekStart) {
        await apiFetch('/api/timetable/weekly-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slot_id: slotId,
            week_start_date: currentWeekStart,
            notes: noteWithStatus,
          }),
        });
      }

      const statusLabels: Record<string, string> = {
        scheduled: 'Đã xếp',
        completed: 'Hoàn thành',
        cancelled: 'Hủy ca',
        makeup: 'Học bù',
      };
      toast.success('Cập nhật trạng thái', `Đã chuyển sang "${statusLabels[newStatus]}"`);
    } catch (error: any) {
      toast.error('Lỗi', error.message || 'Không thể cập nhật trạng thái');
      setSlots(previousSlots); // Rollback
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return {
    profile,
    profileLoading,
    role,
    isAdmin,
    canEdit,
    activeTab,
    setActiveTab,
    displayLayout,
    handleLayoutChange,
    currentWeek,
    setCurrentWeek,
    weekDates,
    currentWeekStart,
    selectedCampus,
    setSelectedCampus,
    selectedClass,
    setSelectedClass,
    selectedTeacher,
    setSelectedTeacher,
    searchQuery,
    setSearchQuery,
    loading,
    slots,
    personalSlots,
    classes,
    teachers,
    tutors,
    branches,
    branchRooms,
    dynamicRooms,
    dynamicSchedules,
    draggingSlotId,
    setDraggingSlotId,
    draggingTeacherId,
    setDraggingTeacherId,
    draggingClassId,
    setDraggingClassId,
    activeActionSlot,
    setActiveActionSlot,
    showEditModal,
    setShowEditModal,
    editingSlot,
    initialModalData,
    quickScheduleData,
    slotActionData,
    openQuickSchedule,
    closeQuickSchedule,
    openSlotAction,
    closeSlotAction,
    openCreateModal,
    openEditModal,
    handleSlotClick,
    handleMoveSlot,
    handleDeleteSlot,
    handleUpdateSlotStatus,
    handlePrint,
    refetchSlots: fetchSlots,
  };
}
