'use client';

import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { Modal, Button } from '@/components/ui';
import {
  Plus,
  Edit3,
  MapPin,
  Trash2,
  GraduationCap,
  ClipboardList,
  Search,
  ChevronDown,
  Check,
  X,
  Clock,
  BookOpen,
  Users,
  User,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { usePermissions } from '@/hooks/usePermissions';
import { getDisplayName } from '@/lib/utils/names';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import {
  TimetableSlot,
  ClassOption,
  SubjectOption,
  TeacherOption,
  StudentOption,
} from '@/lib/timetable/types';
import {
  CAMPUSES,
  DAYS,
  ALL_SESSIONS,
} from '@/lib/timetable/constants';

const INSTRUCTOR_ROLE_LABELS: Record<string, string> = {
  owner: 'Chủ trung tâm',
  admin: 'Quản lý',
  super_admin: 'Quản trị hệ thống',
  teacher: 'Giáo viên',
  tutor: 'Gia sư',
};

// Module-level in-memory cache to prevent re-fetching thousands of records on every modal open
interface OptionsCacheData {
  classes: ClassOption[];
  subjects: SubjectOption[];
  teachers: TeacherOption[];
  tutors: TeacherOption[];
  students: StudentOption[];
  dynamicRooms: string[];
  dynamicSchedules: string[];
  timestamp: number;
}

let optionsCache: OptionsCacheData | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

interface SearchableSelectProps<T> {
  options: T[];
  value: string;
  onChange: (value: string) => void;
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string;
  placeholder: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

const SearchableSelect = memo(function SearchableSelect<T>({
  options = [],
  value,
  onChange,
  getOptionLabel,
  getOptionValue,
  placeholder,
  searchPlaceholder = 'Tìm kiếm...',
  disabled = false,
  icon,
}: SearchableSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const safeOptions = useMemo(() => {
    if (Array.isArray(options)) return options;
    if (options && typeof options === 'object') {
      const list = (options as any).data || (options as any).users || (options as any).tutors || (options as any).classes || (options as any).subjects;
      if (Array.isArray(list)) return list;
    }
    return [];
  }, [options]);

  const selectedOption = useMemo(
    () => safeOptions.find((o) => getOptionValue(o) === value),
    [safeOptions, value, getOptionValue]
  );

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return safeOptions;
    const lowerSearch = search.toLowerCase();
    return safeOptions.filter((o) =>
      getOptionLabel(o).toLowerCase().includes(lowerSearch)
    );
  }, [safeOptions, search, getOptionLabel]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-3 bg-white dark:bg-stone-800 border-2 border-stone-200/80 dark:border-white/10 rounded-2xl text-xs font-black flex items-center justify-between outline-none transition-all shadow-sm text-left",
          isOpen ? "border-amber-500 ring-4 ring-amber-500/10" : "hover:border-stone-300 dark:hover:border-white/20",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        disabled={disabled}
      >
        <div className="flex items-center gap-2.5 truncate">
          {icon && <span className="text-stone-400 shrink-0">{icon}</span>}
          <span className={cn("truncate", !selectedOption && "text-stone-400 font-medium")}>
            {selectedOption ? getOptionLabel(selectedOption) : placeholder}
          </span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-stone-400 transition-transform duration-200 shrink-0 ml-2", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-2.5 border-b border-stone-100 dark:border-white/5 flex items-center gap-2 bg-stone-50/50 dark:bg-stone-900/50">
            <Search className="w-4 h-4 text-stone-400 shrink-0 ml-1" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent border-none outline-none text-xs font-bold text-stone-900 dark:text-white placeholder:text-stone-400"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="p-1 hover:bg-stone-200/50 dark:hover:bg-white/10 rounded-lg text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="max-h-56 overflow-y-auto py-1.5 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-stone-400 text-center font-bold uppercase tracking-wider">
                Không tìm thấy kết quả
              </div>
            ) : (
              filteredOptions.map((option) => {
                const optVal = getOptionValue(option);
                const optLabel = getOptionLabel(option);
                const isSelected = optVal === value;
                return (
                  <button
                    key={optVal}
                    type="button"
                    onClick={() => {
                      onChange(optVal);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={cn(
                      "w-full px-4 py-2.5 text-left text-xs font-black flex items-center justify-between transition-colors",
                      isSelected
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "hover:bg-stone-100 dark:hover:bg-white/5 text-stone-700 dark:text-stone-200"
                    )}
                  >
                    <span className="truncate">{optLabel}</span>
                    {isSelected && <Check className="w-4 h-4 text-amber-500 shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}) as <T>(props: SearchableSelectProps<T>) => React.ReactElement | null;

interface TimetableSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingSlot: TimetableSlot | null;
  initialData?: Partial<TimetableSlot>;
  currentWeekStart: string;
}

export default function TimetableSlotModal({
  isOpen,
  onClose,
  onSuccess,
  editingSlot,
  initialData,
  currentWeekStart,
}: TimetableSlotModalProps) {
  const { can } = usePermissions();
  const toast = useToast();
  const canEdit = can('timetable.edit');

  const [saving, setSaving] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Slot mode: 'class' (Lớp tập trung) vs 'tutoring' (Học kèm 1-on-1 hoặc nhóm 2-3 em)
  const [slotMode, setSlotMode] = useState<'class' | 'tutoring'>('class');

  // Custom Time Toggle
  const [useCustomTime, setUseCustomTime] = useState(false);

  // Multi-student selection for micro-group tutoring (kèm nhóm 2-3 em)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Options
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [tutors, setTutors] = useState<TeacherOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);

  // Dynamic settings from API
  const [dynamicRooms, setDynamicRooms] = useState<string[]>([]);
  const [dynamicSchedules, setDynamicSchedules] = useState<string[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    class_id: '',
    student_id: '',
    subject_id: '',
    teacher_id: '',
    day_of_week: 0,
    start_time: '17:00',
    end_time: '18:30',
    room: '',
    notes: '',
    weekly_note: '',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled' | 'makeup',
  });

  // Conflict Checking State
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [checkingConflict, setCheckingConflict] = useState(false);

  // Sync form state when modal opens or editingSlot/initialData changes
  useEffect(() => {
    if (isOpen) {
      if (editingSlot) {
        const isTutoring = !editingSlot.room || editingSlot.room === 'Linh hoạt' || !!editingSlot.student_id;
        setSlotMode(isTutoring ? 'tutoring' : 'class');
        setSelectedStudentIds(editingSlot.student_id ? [editingSlot.student_id] : []);

        const startTime = editingSlot.start_time?.substring(0, 5) || '17:00';
        const endTime = editingSlot.end_time?.substring(0, 5) || '18:30';

        setFormData({
          class_id: editingSlot.class_id || '',
          student_id: editingSlot.student_id || '',
          subject_id: editingSlot.subject?.id || '',
          teacher_id: editingSlot.teacher?.id || '',
          day_of_week: editingSlot.day_of_week ?? 0,
          start_time: startTime,
          end_time: endTime,
          room: editingSlot.room || (isTutoring ? 'Linh hoạt' : ''),
          notes: editingSlot.notes || '',
          weekly_note: editingSlot.weekly_note || '',
          status: editingSlot.status || 'scheduled',
        });
      } else if (initialData) {
        const isTutoring = initialData.room === 'Linh hoạt' || !!initialData.student_id;
        setSlotMode(isTutoring ? 'tutoring' : 'class');
        setSelectedStudentIds(initialData.student_id ? [initialData.student_id] : []);

        const startTime = initialData.start_time?.substring(0, 5) || '17:00';
        const endTime = initialData.end_time?.substring(0, 5) || '18:30';

        setFormData({
          class_id: initialData.class_id || '',
          student_id: initialData.student_id || '',
          subject_id: '',
          teacher_id: '',
          day_of_week: initialData.day_of_week ?? 0,
          start_time: startTime,
          end_time: endTime,
          room: initialData.room || (isTutoring ? 'Linh hoạt' : ''),
          notes: '',
          weekly_note: '',
          status: 'scheduled',
        });
      } else {
        setSelectedStudentIds([]);
      }
    }
  }, [isOpen, editingSlot, initialData]);

  // Handle Mode Switch (Class vs Tutoring)
  const handleModeSwitch = (mode: 'class' | 'tutoring') => {
    setSlotMode(mode);
    if (mode === 'tutoring') {
      setFormData((prev) => ({
        ...prev,
        room: 'Linh hoạt',
        class_id: '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        room: prev.room === 'Linh hoạt' ? '' : prev.room,
        student_id: '',
      }));
      setSelectedStudentIds([]);
    }
  };

  // Conflict Checking Effect with debounce and pre-check validation
  useEffect(() => {
    if (!isOpen || !canEdit) return;

    // Skip conflict check if neither teacher nor physical room is set
    if (
      (!formData.teacher_id && (!formData.room || formData.room === 'Linh hoạt')) ||
      !formData.start_time ||
      !formData.end_time ||
      formData.day_of_week === undefined
    ) {
      setConflictMessage(null);
      return;
    }

    const checkConflict = async () => {
      setCheckingConflict(true);
      try {
        const res = await apiFetch('/api/timetable/check-conflict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacher_id: formData.teacher_id || null,
            student_id: slotMode === 'tutoring' ? (formData.student_id || selectedStudentIds[0] || null) : null,
            room: formData.room || null,
            day_of_week: formData.day_of_week,
            start_time: formData.start_time,
            end_time: formData.end_time,
            exclude_slot_id: editingSlot?.id || null,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.has_conflict) {
            setConflictMessage(json.conflict_reason);
          } else {
            setConflictMessage(null);
          }
        }
      } catch (err) {
        console.error('Failed to check timetable conflict:', err);
      } finally {
        setCheckingConflict(false);
      }
    };

    const timer = setTimeout(checkConflict, 600);
    return () => clearTimeout(timer);
  }, [
    formData.teacher_id,
    formData.student_id,
    selectedStudentIds,
    slotMode,
    formData.room,
    formData.day_of_week,
    formData.start_time,
    formData.end_time,
    isOpen,
    editingSlot?.id,
  ]);

  // Fetch Options with caching to avoid heavy network re-fetches
  useEffect(() => {
    if (isOpen && canEdit) {
      fetchOptions();
    }
  }, [isOpen, canEdit]);

  const fetchOptions = async () => {
    const now = Date.now();
    if (optionsCache && now - optionsCache.timestamp < CACHE_TTL) {
      setClasses(optionsCache.classes);
      setSubjects(optionsCache.subjects);
      setTeachers(optionsCache.teachers);
      setTutors(optionsCache.tutors);
      setStudents(optionsCache.students);
      setDynamicRooms(optionsCache.dynamicRooms);
      setDynamicSchedules(optionsCache.dynamicSchedules);
      return;
    }

    setLoadingOptions(true);
    try {
      const [classRes, subRes, teacherRes, tutorRes, studentRes, roomsRes, schedulesRes] = await Promise.all([
        apiFetch('/api/classes'),
        apiFetch('/api/subjects'),
        apiFetch('/api/admin/users?role=instructors&limit=1000'),
        apiFetch('/api/tutors?limit=1000'),
        apiFetch('/api/admin/users?role=student&limit=1000'),
        apiFetch('/api/settings?key=center_rooms'),
        apiFetch('/api/settings?key=center_schedules'),
      ]);

      const classData = await classRes.json();
      const subData = await subRes.json();
      const teacherData = await teacherRes.json();
      const tutorData = await tutorRes.json();
      const studentData = await studentRes.json();

      const classRaw = classData.data?.data || classData.data || classData.classes;
      const fetchedClasses: ClassOption[] = Array.isArray(classRaw) ? classRaw : [];

      const subRaw = subData.data || subData.subjects;
      const fetchedSubjects: SubjectOption[] = Array.isArray(subRaw) ? subRaw : [];

      const teacherRaw = teacherData.data?.data || teacherData.data || teacherData.users;
      const fetchedTeachers: TeacherOption[] = Array.isArray(teacherRaw) ? teacherRaw : [];

      const tutorRaw = tutorData.data || tutorData.tutors;
      const fetchedTutors: TeacherOption[] = Array.isArray(tutorRaw) ? tutorRaw : [];

      const studentRaw = studentData.data?.data || studentData.data || studentData.users;
      const fetchedStudents: StudentOption[] = Array.isArray(studentRaw) ? studentRaw : [];

      let fetchedRooms: string[] = [];
      if (roomsRes.ok) {
        const roomsJson = await roomsRes.json();
        if (roomsJson.setting?.value_json) {
          const rawRooms = roomsJson.setting.value_json;
          if (rawRooms && typeof rawRooms === 'object' && !Array.isArray(rawRooms)) {
            for (const [branch, rms] of Object.entries(rawRooms)) {
              if (Array.isArray(rms)) {
                rms.forEach((r) => fetchedRooms.push(`${branch} - ${r}`));
              }
            }
          } else if (Array.isArray(rawRooms)) {
            fetchedRooms = rawRooms;
          }
        }
      }

      let fetchedSchedules: string[] = [];
      if (schedulesRes.ok) {
        const schedulesJson = await schedulesRes.json();
        if (schedulesJson.setting?.value_json && Array.isArray(schedulesJson.setting.value_json)) {
          fetchedSchedules = schedulesJson.setting.value_json;
        }
      }

      setClasses(fetchedClasses);
      setSubjects(fetchedSubjects);
      setTeachers(fetchedTeachers);
      setTutors(fetchedTutors);
      setStudents(fetchedStudents);
      setDynamicRooms(fetchedRooms);
      setDynamicSchedules(fetchedSchedules);

      // Save to cache
      optionsCache = {
        classes: fetchedClasses,
        subjects: fetchedSubjects,
        teachers: fetchedTeachers,
        tutors: fetchedTutors,
        students: fetchedStudents,
        dynamicRooms: fetchedRooms,
        dynamicSchedules: fetchedSchedules,
        timestamp: now,
      };
    } catch (e) {
      console.error('Failed to fetch modal options:', e);
    } finally {
      setLoadingOptions(false);
    }
  };

  const sessionsFromSchedules = React.useMemo(() => {
    if (dynamicSchedules.length === 0) {
      return ALL_SESSIONS;
    }

    return dynamicSchedules.map((s, idx) => {
      const parts = s.split('-');
      const start = parts[0]?.trim() || '17:00';
      const end = parts[1]?.trim() || '18:30';

      const startHour = parseInt(start.split(':')[0] || '17');
      const days = startHour < 17 ? [5, 6] : [0, 1, 2, 3, 4, 5, 6];

      let label = `Ca ${idx + 1}`;
      if (startHour < 12) {
        label = startHour === 8 ? 'S1' : 'S2';
      } else if (startHour < 17) {
        label = startHour === 14 ? 'C1' : 'C2';
      } else {
        const eveningIndex = startHour === 17 ? 1 : startHour === 18 ? 2 : 3;
        label = `Ca ${eveningIndex}`;
      }

      return {
        id: idx + 1,
        label,
        time: s,
        start,
        end,
        days,
      };
    });
  }, [dynamicSchedules]);

  const handleSave = async () => {
    if (slotMode === 'tutoring') {
      const effectiveStudents = editingSlot
        ? (formData.student_id ? [formData.student_id] : [])
        : (selectedStudentIds.length > 0 ? selectedStudentIds : (formData.student_id ? [formData.student_id] : []));

      if (effectiveStudents.length === 0) {
        toast.warning('Thiếu thông tin', 'Vui lòng chọn ít nhất 1 học sinh phụ đạo');
        return;
      }
    } else {
      if (!formData.class_id) {
        toast.warning('Thiếu thông tin', 'Vui lòng chọn lớp học');
        return;
      }
    }

    if (!formData.subject_id) {
      toast.warning('Thiếu thông tin', 'Vui lòng chọn môn học');
      return;
    }

    setSaving(true);
    try {
      const isEditing = !!editingSlot;

      if (slotMode === 'tutoring' && !isEditing && selectedStudentIds.length > 1) {
        // Create multiple slots for micro-group (2-3 students) in the same session
        const createPromises = selectedStudentIds.map((stId) =>
          apiFetch('/api/timetable', {
            method: 'POST',
            body: JSON.stringify({
              ...formData,
              class_id: null,
              student_id: stId,
              subject_id: formData.subject_id || null,
              teacher_id: formData.teacher_id || null,
              room: 'Linh hoạt',
            }),
            headers: { 'Content-Type': 'application/json' },
          })
        );

        const responses = await Promise.all(createPromises);
        for (const res of responses) {
          const json = await res.json();
          if (!json.success) {
            throw new Error(json.error || 'Lỗi khi lưu tiết học kèm nhóm');
          }
        }
      } else {
        const url = isEditing ? `/api/timetable/${editingSlot.id}` : '/api/timetable';
        const method = isEditing ? 'PUT' : 'POST';

        const response = await apiFetch(url, {
          method,
          body: JSON.stringify({
            ...formData,
            class_id: slotMode === 'class' ? formData.class_id || null : null,
            student_id: slotMode === 'tutoring' ? (formData.student_id || selectedStudentIds[0] || null) : null,
            subject_id: formData.subject_id || null,
            teacher_id: formData.teacher_id || null,
            room: slotMode === 'tutoring' ? 'Linh hoạt' : formData.room || null,
          }),
          headers: { 'Content-Type': 'application/json' },
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Lỗi khi lưu tiết học');
        }

        // Save weekly note if provided
        const slotId = isEditing ? editingSlot.id : result.slot?.id;
        if (slotId && formData.weekly_note) {
          await apiFetch('/api/timetable/weekly-notes', {
            method: 'POST',
            body: JSON.stringify({
              slot_id: slotId,
              week_start_date: currentWeekStart,
              notes: formData.weekly_note,
            }),
            headers: { 'Content-Type': 'application/json' },
          });
        } else if (slotId && !formData.weekly_note && editingSlot?.has_weekly_note) {
          await apiFetch(
            `/api/timetable/weekly-notes?slot_id=${slotId}&week_start_date=${currentWeekStart}`,
            { method: 'DELETE' }
          );
        }
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to save slot:', error);
      toast.error('Lỗi khi lưu tiết học', error.message || 'Lỗi không xác định');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSlot ? 'Chỉnh Sửa Tiết Học' : 'Thêm Tiết Học Mới'}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="ghost" onClick={onClose} className="rounded-2xl font-bold">
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            isLoading={saving}
            disabled={
              loadingOptions ||
              !formData.subject_id ||
              (slotMode === 'tutoring'
                ? !formData.student_id && selectedStudentIds.length === 0
                : !formData.class_id)
            }
            onClick={handleSave}
            leftIcon={editingSlot ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            className="rounded-2xl px-6 font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md shadow-amber-500/20"
          >
            {editingSlot ? 'Cập Nhật' : 'Tạo Tiết Học'}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Segmented Mode Selector: Regular Class vs Tutoring */}
        <div className="p-1.5 bg-stone-100 dark:bg-stone-800 rounded-2xl flex gap-1 border border-stone-200/60 dark:border-white/5">
          <button
            type="button"
            onClick={() => handleModeSwitch('class')}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2",
              slotMode === 'class'
                ? "bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-sm scale-[1.01]"
                : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
            )}
          >
            <Users className="w-4 h-4" /> Lớp Tập Trung
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('tutoring')}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2",
              slotMode === 'tutoring'
                ? "bg-white dark:bg-stone-900 text-blue-600 dark:text-blue-400 shadow-sm scale-[1.01]"
                : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
            )}
          >
            <BookOpen className="w-4 h-4" /> Học Kèm (1-3 em)
          </button>
        </div>

        {/* Real-time Conflict Alert Banner */}
        {conflictMessage && (
          <div className="bg-amber-500/10 border-2 border-amber-500/30 dark:bg-amber-950/30 rounded-2xl p-4 flex gap-3 text-amber-800 dark:text-amber-200 animate-in fade-in slide-in-from-top-1">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-black uppercase tracking-wider block mb-1 text-amber-700 dark:text-amber-300">
                ⚠️ Cảnh báo trùng lịch:
              </span>
              <span className="font-bold">{conflictMessage}</span>
            </div>
          </div>
        )}

        {/* Core Info Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">
              {slotMode === 'class' ? 'Thông Tin Lớp Học' : 'Thông Tin Ca Học Kèm'}
            </span>
            <div className="h-[1px] flex-1 bg-stone-200/60 dark:bg-white/5" />
          </div>

          {slotMode === 'tutoring' ? (
            /* Tutoring Inputs */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                    Học sinh phụ đạo * {!editingSlot && '(Kèm 1-on-1 hoặc Nhóm 2-3 em)'}
                  </label>
                  {!editingSlot && selectedStudentIds.length > 0 && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Đã chọn {selectedStudentIds.length}/3 em
                    </span>
                  )}
                </div>
                <SearchableSelect
                  options={students}
                  value={formData.student_id}
                  onChange={(val) => {
                    if (editingSlot) {
                      setFormData((prev) => ({ ...prev, student_id: val }));
                      setSelectedStudentIds([val]);
                    } else {
                      if (!selectedStudentIds.includes(val)) {
                        if (selectedStudentIds.length >= 3) {
                          alert('Nhóm kèm tối đa 3 học sinh cùng lúc.');
                          return;
                        }
                        const updated = [...selectedStudentIds, val];
                        setSelectedStudentIds(updated);
                        setFormData((prev) => ({ ...prev, student_id: updated[0] || '' }));
                      }
                    }
                  }}
                  getOptionLabel={(s) => s.full_name}
                  getOptionValue={(s) => s.id}
                  placeholder={editingSlot ? '-- Chọn học sinh --' : '-- Thêm học sinh vào ca kèm (1-3 em) --'}
                  searchPlaceholder="Tìm tên học sinh..."
                  disabled={loadingOptions}
                  icon={<User className="w-4 h-4" />}
                />

                {/* Badges for selected students in creation mode */}
                {!editingSlot && selectedStudentIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {selectedStudentIds.map((stId) => {
                      const studentObj = students.find((s) => s.id === stId);
                      return (
                        <span
                          key={stId}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                        >
                          <User className="w-3 h-3" />
                          {studentObj?.full_name || 'Học sinh'}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = selectedStudentIds.filter((id) => id !== stId);
                              setSelectedStudentIds(updated);
                              setFormData((prev) => ({ ...prev, student_id: updated[0] || '' }));
                            }}
                            className="hover:text-red-500 ml-1 rounded-full hover:bg-emerald-500/20 p-0.5 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Gia sư / Giáo viên *
                </label>
                <SearchableSelect
                  options={tutors.length > 0 ? tutors : teachers}
                  value={formData.teacher_id}
                  onChange={(val) => setFormData((prev) => ({ ...prev, teacher_id: val }))}
                  getOptionLabel={(t) => t.full_name}
                  getOptionValue={(t) => t.id}
                  placeholder="-- Chọn gia sư --"
                  searchPlaceholder="Tìm tên gia sư..."
                  disabled={loadingOptions}
                  icon={<GraduationCap className="w-4 h-4" />}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Môn học *
                </label>
                <SearchableSelect
                  options={subjects}
                  value={formData.subject_id}
                  onChange={(val) => setFormData((prev) => ({ ...prev, subject_id: val }))}
                  getOptionLabel={(s) => s.name}
                  getOptionValue={(s) => s.id}
                  placeholder="-- Chọn môn học --"
                  searchPlaceholder="Tìm môn học..."
                  disabled={loadingOptions}
                  icon={<BookOpen className="w-4 h-4" />}
                />
              </div>
            </div>
          ) : (
            /* Regular Class Inputs */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Lớp học *
                </label>
                <SearchableSelect
                  options={classes}
                  value={formData.class_id}
                  getOptionLabel={(c) => c.name}
                  getOptionValue={(c) => c.id}
                  onChange={(val) => {
                    const selectedClassObj = classes.find((c) => c.id === val);
                    let subjectId = selectedClassObj?.subject_id || '';

                    if (!subjectId && selectedClassObj?.teacher?.teacher_subjects) {
                      const primarySubject = selectedClassObj.teacher.teacher_subjects.find(
                        (ts) => ts.is_primary
                      );
                      if (primarySubject) {
                        subjectId = primarySubject.subject_id;
                      } else if (selectedClassObj.teacher.teacher_subjects.length > 0) {
                        subjectId = selectedClassObj.teacher.teacher_subjects[0]?.subject_id || '';
                      }
                    }

                    setFormData((prev) => ({
                      ...prev,
                      class_id: val,
                      teacher_id: selectedClassObj?.teacher_id || prev.teacher_id,
                      subject_id: subjectId || prev.subject_id,
                    }));
                  }}
                  placeholder="-- Chọn lớp học --"
                  searchPlaceholder="Tìm tên lớp học..."
                  disabled={loadingOptions}
                  icon={<Users className="w-4 h-4" />}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Giáo viên phụ trách *
                </label>
                <SearchableSelect
                  options={teachers}
                  value={formData.teacher_id}
                  onChange={(val) => setFormData((prev) => ({ ...prev, teacher_id: val }))}
                  getOptionLabel={(t) => {
                    const roleLabel = t.role && t.role !== 'teacher' ? ` (${INSTRUCTOR_ROLE_LABELS[t.role] || t.role})` : '';
                    return `${getDisplayName(t)}${roleLabel}`;
                  }}
                  getOptionValue={(t) => t.id}
                  placeholder="-- Chọn giáo viên --"
                  searchPlaceholder="Tìm giáo viên..."
                  disabled={loadingOptions}
                  icon={<GraduationCap className="w-4 h-4" />}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Môn học *
                </label>
                <SearchableSelect
                  options={subjects}
                  value={formData.subject_id}
                  onChange={(val) => setFormData((prev) => ({ ...prev, subject_id: val }))}
                  getOptionLabel={(s) => s.name}
                  getOptionValue={(s) => s.id}
                  placeholder="-- Chọn môn học --"
                  searchPlaceholder="Tìm môn học..."
                  disabled={loadingOptions}
                  icon={<BookOpen className="w-4 h-4" />}
                />
              </div>
            </div>
          )}
        </div>

        {/* Time, Day & Location Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">
              Lịch Học & Phòng Xếp
            </span>
            <div className="h-[1px] flex-1 bg-stone-200/60 dark:bg-white/5" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Day of Week */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Thứ trong tuần *
              </label>
              <select
                value={formData.day_of_week}
                onChange={(e) => setFormData((prev) => ({ ...prev, day_of_week: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 bg-white dark:bg-stone-800 border-2 border-stone-200/80 dark:border-white/10 rounded-2xl text-xs font-black text-stone-900 dark:text-white outline-none focus:border-amber-500 transition-all shadow-sm cursor-pointer"
              >
                {DAYS.map((day, i) => (
                  <option key={i} value={i}>
                    🗓️ {day}
                  </option>
                ))}
              </select>
            </div>

            {/* Room / Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Phòng / Vị trí *
              </label>
              <select
                value={formData.room}
                onChange={(e) => setFormData((prev) => ({ ...prev, room: e.target.value }))}
                className="w-full px-4 py-3 bg-white dark:bg-stone-800 border-2 border-stone-200/80 dark:border-white/10 rounded-2xl text-xs font-black text-stone-900 dark:text-white outline-none focus:border-amber-500 transition-all shadow-sm cursor-pointer"
                disabled={slotMode === 'tutoring'}
              >
                <option value="">-- Chọn phòng --</option>
                <option value="Linh hoạt">🎓 Học kèm (Linh hoạt)</option>
                {(dynamicRooms.length > 0
                  ? dynamicRooms
                  : CAMPUSES.filter((c) => c.id !== 'HK').flatMap((c) =>
                      c.rooms.map((room) => `${c.name} - ${room}`)
                    )
                ).map((room) => (
                  <option key={room} value={room}>
                    🏢 {room}
                  </option>
                ))}
              </select>
            </div>

            {/* Session Preset vs Custom Time Switcher */}
            <div className="col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Khung giờ học *
                </label>
                <button
                  type="button"
                  onClick={() => setUseCustomTime(!useCustomTime)}
                  className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Clock className="w-3 h-3" />
                  {useCustomTime ? 'Dùng ca mẫu cố định' : 'Tùy chỉnh giờ bắt đầu/kết thúc'}
                </button>
              </div>

              {!useCustomTime ? (
                <select
                  value={formData.start_time}
                  onChange={(e) => {
                    const session = sessionsFromSchedules.find((s) => s.start === e.target.value);
                    setFormData((prev) => ({
                      ...prev,
                      start_time: e.target.value,
                      end_time: session?.end || prev.end_time,
                    }));
                  }}
                  className="w-full px-4 py-3 bg-white dark:bg-stone-800 border-2 border-stone-200/80 dark:border-white/10 rounded-2xl text-xs font-black text-stone-900 dark:text-white outline-none focus:border-amber-500 transition-all shadow-sm cursor-pointer"
                >
                  {sessionsFromSchedules.map((p) => (
                    <option key={p.id} value={p.start}>
                      ⏰ {p.label} ({p.time})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-stone-400">Giờ bắt đầu:</span>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData((prev) => ({ ...prev, start_time: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-stone-800 border-2 border-stone-200/80 dark:border-white/10 rounded-2xl text-xs font-black text-stone-900 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-stone-400">Giờ kết thúc:</span>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData((prev) => ({ ...prev, end_time: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-stone-800 border-2 border-stone-200/80 dark:border-white/10 rounded-2xl text-xs font-black text-stone-900 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Slot Status Selection Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">
              Trạng Thái Tiết Học
            </span>
            <div className="h-[1px] flex-1 bg-stone-200/60 dark:bg-white/5" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'scheduled', label: '🟡 Đã xếp', color: 'border-amber-500/40 text-amber-600 bg-amber-500/10' },
              { id: 'completed', label: '🟢 Hoàn thành', color: 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10' },
              { id: 'cancelled', label: '🔴 Hủy ca', color: 'border-rose-500/40 text-rose-600 bg-rose-500/10' },
              { id: 'makeup', label: '🔵 Học bù', color: 'border-sky-500/40 text-sky-600 bg-sky-500/10' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, status: st.id as any }))}
                className={cn(
                  "py-2.5 px-3 rounded-2xl text-xs font-black border-2 transition-all text-center",
                  formData.status === st.id
                    ? `${st.color} shadow-sm scale-[1.02]`
                    : "border-stone-200/70 dark:border-white/5 text-stone-500 hover:border-stone-300"
                )}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes Section */}
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider">
              Ghi chú cố định (Áp dụng cho mọi tuần)
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full px-4 py-3 bg-white dark:bg-stone-800 border-2 border-stone-200/80 dark:border-white/10 rounded-2xl text-xs font-medium text-stone-900 dark:text-white outline-none focus:border-amber-500 transition-all shadow-sm min-h-[70px] resize-none"
              placeholder="Nhập ghi chú áp dụng lâu dài cho tiết học này..."
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Ghi chú riêng cho tuần này ({currentWeekStart})
              </label>
              {formData.weekly_note && (
                <button
                  type="button"
                  className="text-[11px] font-bold text-rose-500 hover:underline flex items-center gap-1"
                  onClick={() => setFormData((prev) => ({ ...prev, weekly_note: '' }))}
                >
                  <Trash2 className="w-3 h-3" /> Xóa ghi chú tuần
                </button>
              )}
            </div>
            <textarea
              value={formData.weekly_note || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, weekly_note: e.target.value }))}
              className="w-full px-4 py-3 bg-amber-500/[0.04] dark:bg-amber-500/[0.08] border-2 border-amber-500/20 rounded-2xl text-xs font-medium text-stone-900 dark:text-white outline-none focus:border-amber-500 transition-all shadow-sm min-h-[70px] resize-none"
              placeholder="Nhập dặn dò/thay đổi chỉ áp dụng riêng cho tuần này..."
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

