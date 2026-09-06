'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, updateClass, deleteClass } from '@/lib/api/client';
import { CENTER_ROOMS, STANDARD_SCHEDULES } from '@/lib/config/resources';
import { Modal } from '@/components/ui';
import {
  ChevronLeft,
  Save,
  Trash2,
  Settings,
  BookOpen,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  BadgeInfo,
  Calendar,
  CheckCircle,
  PauseCircle,
  XCircle,
  Loader2,
  ChevronDown,
  Hash,
  FileText,
  GraduationCap,
} from 'lucide-react';
import { useToast } from '@/hooks';
import { usePermissions } from '@/hooks/usePermissions';
import { ToastContainer } from '@/components/ui/Toast';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { getDisplayName } from '@/lib/utils/names';

interface ClassData {
  id: string;
  name: string;
  code: string;
  description?: string;
  schedule?: string;
  room?: string;
  teacher_id?: string;
  subject_id?: string;
  academic_year_id?: string;
  capacity?: number | null;
  max_capacity?: number | null;
  status?: 'active' | 'inactive' | 'completed';
  teacher?: {
    id: string;
    full_name: string;
    first_name?: string | null;
    last_name?: string | null;
    email: string;
  };
}

interface Teacher {
  id: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  role?: string;
}

const INSTRUCTOR_ROLE_LABELS: Record<string, string> = {
  owner: 'Chủ trung tâm',
  admin: 'Quản lý',
  super_admin: 'Quản trị hệ thống',
  teacher: 'Giáo viên',
  tutor: 'Gia sư',
};

const STATUS_OPTIONS = [
  {
    value: 'active',
    label: 'Hoạt động',
    icon: CheckCircle,
    color: 'text-emerald-600',
    activeBg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500',
    dot: 'bg-emerald-500',
  },
  {
    value: 'inactive',
    label: 'Tạm ngưng',
    icon: PauseCircle,
    color: 'text-amber-600',
    activeBg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-500',
    dot: 'bg-amber-500',
  },
  {
    value: 'completed',
    label: 'Hoàn thành',
    icon: XCircle,
    color: 'text-stone-500',
    activeBg: 'bg-stone-50 dark:bg-stone-500/10 border-stone-400',
    dot: 'bg-stone-400',
  },
];

function SelectField({
  label,
  icon: Icon,
  iconColor = 'text-stone-500',
  value,
  onChange,
  children,
  hint,
}: {
  label: string;
  icon: React.ElementType;
  iconColor?: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400 px-1">
        {label}
      </label>
      <div className="relative">
        <div
          className={cn(
            'absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none',
            iconColor
          )}
        >
          <Icon className="w-4.5 h-4.5" />
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full pl-11 pr-10 py-2 rounded-2xl font-bold text-sm appearance-none outline-none transition-all',
            'bg-stone-50 dark:bg-stone-900/50',
            'border border-stone-200 dark:border-stone-700',
            'focus:border-stone-900 dark:focus:border-stone-400',
            'text-stone-800 dark:text-stone-200',
            'focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-stone-400/10',
            'h-[50px]'
          )}
        >
          {children}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {hint && <p className="text-[10px] text-stone-400 px-1 italic">{hint}</p>}
    </div>
  );
}

function TextInput({
  label,
  icon: Icon,
  iconColor = 'text-stone-500',
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
}: {
  label: string;
  icon: React.ElementType;
  iconColor?: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400 px-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <div
          className={cn(
            'absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none',
            iconColor
          )}
        >
          <Icon className="w-4.5 h-4.5" />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={cn(
            'w-full pl-11 pr-4 py-3.5 rounded-2xl font-bold text-sm outline-none transition-all',
            'bg-stone-50 dark:bg-stone-900/50',
            'border border-stone-200 dark:border-stone-700',
            'focus:border-stone-900 dark:focus:border-stone-400',
            'text-stone-800 dark:text-stone-200',
            'placeholder:text-stone-400 dark:placeholder:text-stone-600',
            'focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-stone-400/10',
            'h-[50px]'
          )}
        />
      </div>
    </div>
  );
}

export default function EditClassPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const classId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<{ id: string; name: string; code: string }[]>([]);
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    schedule: '',
    room: '',
    teacher_id: '',
    subject_id: '',
    academic_year_id: '',
    capacity: 40,
    status: 'active',
  });

  const [customRoom, setCustomRoom] = useState('');
  const [useCustomRoom, setUseCustomRoom] = useState(false);
  const [customSchedule, setCustomSchedule] = useState('');
  const [useCustomSchedule, setUseCustomSchedule] = useState(false);
  const [dynamicRooms, setDynamicRooms] = useState<string[]>(CENTER_ROOMS);
  const [dynamicSchedules, setDynamicSchedules] = useState<string[]>(STANDARD_SCHEDULES);

  const { can } = usePermissions();
  const canDelete = can('classes.delete');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classRes, teachersRes, coursesRes, academicYearsRes, roomsRes, schedulesRes] =
          await Promise.all([
            apiFetch(`/api/classes/${classId}`),
            apiFetch('/api/teachers'),
            apiFetch('/api/subjects'),
            apiFetch('/api/academic-years'),
            apiFetch('/api/settings?key=center_rooms'),
            apiFetch('/api/settings?key=center_schedules'),
          ]);

        if (!classRes.ok) throw new Error('Failed to fetch class');

        const classJson = await classRes.json();
        const classData: ClassData = classJson.class || classJson.data;

        if (!classData) {
          toast.error('Lỗi', 'Không tìm thấy lớp học');
          router.push(routes.classes.list());
          return;
        }

        let currentRooms = CENTER_ROOMS;
        if (roomsRes.ok) {
          const roomsJson = await roomsRes.json();
          const setting = roomsJson.setting;
          if (setting && setting.value_json) {
            const rawRooms = setting.value_json;
            if (rawRooms && typeof rawRooms === 'object' && !Array.isArray(rawRooms)) {
              const flatRooms: string[] = [];
              for (const [branch, rms] of Object.entries(rawRooms)) {
                if (Array.isArray(rms)) {
                  rms.forEach((r) => {
                    flatRooms.push(`${branch} - ${r}`);
                  });
                }
              }
              setDynamicRooms(flatRooms);
              currentRooms = flatRooms;
            } else if (Array.isArray(rawRooms)) {
              setDynamicRooms(rawRooms);
              currentRooms = rawRooms;
            }
          }
        }

        let currentSchedules = STANDARD_SCHEDULES;
        if (schedulesRes.ok) {
          const schedulesJson = await schedulesRes.json();
          const setting = schedulesJson.setting;
          if (setting && Array.isArray(setting.value_json)) {
            setDynamicSchedules(setting.value_json);
            currentSchedules = setting.value_json;
          }
        }

        const fetchedRoom = classData.room || '';
        const isRoomPredefined = currentRooms.includes(fetchedRoom);
        const hasRoom = fetchedRoom !== '';

        const fetchedSchedule = classData.schedule || '';
        const isSchedulePredefined = currentSchedules.includes(fetchedSchedule);
        const hasSchedule = fetchedSchedule !== '';

        setFormData({
          name: classData.name || '',
          code: classData.code || '',
          description: classData.description || '',
          schedule: hasSchedule && isSchedulePredefined ? fetchedSchedule : '',
          room: hasRoom && isRoomPredefined ? fetchedRoom : '',
          teacher_id: classData.teacher_id || classData.teacher?.id || '',
          subject_id: classData.subject_id || '',
          academic_year_id: classData.academic_year_id || '',
          capacity: classData.capacity ?? classData.max_capacity ?? 40,
          status: classData.status || 'active',
        });

        if (hasRoom && !isRoomPredefined) {
          setUseCustomRoom(true);
          setCustomRoom(fetchedRoom);
        }
        if (hasSchedule && !isSchedulePredefined) {
          setUseCustomSchedule(true);
          setCustomSchedule(fetchedSchedule);
        }

        if (teachersRes.ok) {
          const j = await teachersRes.json();
          setTeachers(j.data?.teachers || j.teachers || j.users || j.data || []);
        }
        if (coursesRes.ok) {
          const j = await coursesRes.json();
          setCourses(j.subjects || j.courses || j.data || []);
        }
        if (academicYearsRes.ok) {
          const j = await academicYearsRes.json();
          setAcademicYears(j.data || j.academicYears || []);
        }
      } catch (err) {
        console.error('Error loading class:', err);
        toast.error('Lỗi', 'Không thể tải thông tin lớp học');
      } finally {
        setLoading(false);
      }
    };

    if (classId) fetchData();
  }, [classId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteClass(classId);
      toast.success('Thành công', 'Đã xóa lớp học');
      router.push(routes.classes.list());
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Lỗi', 'Không thể xóa lớp học');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!formData.name.trim()) {
      toast.warning('Thiếu thông tin', 'Vui lòng nhập tên lớp học');
      return;
    }

    setSaving(true);
    try {
      await updateClass(classId, {
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
        description: formData.description.trim() || undefined,
        schedule: useCustomSchedule
          ? customSchedule.trim() || undefined
          : formData.schedule.trim() || undefined,
        room: useCustomRoom ? customRoom.trim() || undefined : formData.room.trim() || undefined,
        teacher_id: formData.teacher_id || undefined,
        subject_id: formData.subject_id || undefined,
        academic_year_id: formData.academic_year_id || undefined,
        capacity: formData.capacity,
        status: formData.status,
      });

      toast.success('Thành công', 'Đã cập nhật lớp học');
      setTimeout(() => {
        router.push(routes.classes.detail(classId));
      }, 800);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Cập nhật thất bại';
      toast.error('Lỗi', message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-stone-200 dark:border-stone-800 border-t-stone-900 dark:border-t-stone-100 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Settings className="w-6 h-6 text-stone-900 dark:text-stone-100 animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-black text-stone-900 dark:text-white uppercase tracking-tight">
            Đang tải dữ liệu
          </h2>
          <p className="text-xs font-medium text-stone-400 mt-1">Vui lòng chờ trong giây lát...</p>
        </div>
      </div>
    );
  }

  const activeStatus =
    STATUS_OPTIONS.find((s) => s.value === formData.status) ?? STATUS_OPTIONS[0]!;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />

      {/* ───────────── HEADER ───────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => router.push(routes.classes.detail(classId))}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors mb-3"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại lớp học
          </button>
          <h1 className="text-3xl md:text-4xl font-black text-stone-900 dark:text-white tracking-tight">
            Chỉnh sửa{' '}
            <span className="text-[var(--color-primary,#e11d48)]">
              {formData.name || 'Lớp học'}
            </span>
          </h1>
          {formData.code && (
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-1">
              Mã lớp: {formData.code}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => router.push(routes.classes.detail(classId))}
            className="px-5 py-2.5 text-sm font-bold text-stone-500 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl transition-all"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={saving}
            className="px-6 py-2.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-black rounded-xl hover:opacity-90 transition-all shadow-lg shadow-stone-900/20 flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu thay đổi
          </button>
        </div>
      </div>

      {/* ───────────── FORM ───────────── */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: 2/3 — Thông tin chính */}
        <div className="lg:col-span-2 space-y-6">
          {/* Block 1: Thông tin định danh */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-stone-100 dark:border-stone-800">
              <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-stone-600 dark:text-stone-400" />
              </div>
              <div>
                <h2 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider">
                  Thông tin cơ bản
                </h2>
                <p className="text-[10px] text-stone-400 uppercase tracking-widest">
                  Định danh lớp học
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="Tên lớp học"
                icon={BookOpen}
                iconColor="text-stone-500"
                value={formData.name}
                onChange={(v) => setFormData((p) => ({ ...p, name: v }))}
                placeholder="VD: Lớp 10A1"
                required
              />
              <TextInput
                label="Mã lớp"
                icon={Hash}
                iconColor="text-stone-400"
                value={formData.code}
                onChange={(v) => setFormData((p) => ({ ...p, code: v }))}
                placeholder="VD: 10A1"
              />
            </div>

            <SelectField
              label="Giáo viên phụ trách"
              icon={User}
              iconColor="text-stone-500"
              value={formData.teacher_id}
              onChange={(v) => setFormData((p) => ({ ...p, teacher_id: v }))}
              hint="Giáo viên sẽ được thông báo khi có thay đổi liên quan tới lớp."
            >
              <option value="">— Chưa phân công —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {getDisplayName(t)}{' '}
                  {t.role && t.role !== 'teacher'
                    ? `(${INSTRUCTOR_ROLE_LABELS[t.role] || t.role})`
                    : ''}
                </option>
              ))}
            </SelectField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                label="Khóa học"
                icon={GraduationCap}
                iconColor="text-stone-500"
                value={formData.subject_id}
                onChange={(v) => setFormData((p) => ({ ...p, subject_id: v }))}
              >
                <option value="">— Chưa gán khóa học —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="Năm học"
                icon={Calendar}
                iconColor="text-stone-500"
                value={formData.academic_year_id}
                onChange={(v) => setFormData((p) => ({ ...p, academic_year_id: v }))}
              >
                <option value="">— Chưa gán năm học —</option>
                {academicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>
                    {ay.name}
                  </option>
                ))}
              </SelectField>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400 px-1">
                Mô tả lớp học
              </label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 w-4 h-4 text-stone-400 pointer-events-none" />
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Mô tả mục tiêu hoặc đặc điểm của lớp..."
                  rows={3}
                  className={cn(
                    'w-full pl-11 pr-4 py-3.5 rounded-2xl font-medium text-sm outline-none transition-all resize-none',
                    'bg-stone-50 dark:bg-stone-900/50',
                    'border border-stone-200 dark:border-stone-700',
                    'focus:border-stone-900 dark:focus:border-stone-400',
                    'text-stone-800 dark:text-stone-200',
                    'placeholder:text-stone-400',
                    'focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-stone-400/10'
                  )}
                />
              </div>
            </div>
          </div>

          {/* Block 2: Lịch biểu & Địa điểm */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-stone-100 dark:border-stone-800">
              <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <Clock className="w-4 h-4 text-stone-600 dark:text-stone-400" />
              </div>
              <div>
                <h2 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider">
                  Lịch biểu &amp; Địa điểm
                </h2>
                <p className="text-[10px] text-stone-400 uppercase tracking-widest">
                  Thời gian và phòng học
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* ROOM PICKER */}
              <div className="space-y-2">
                {!useCustomRoom ? (
                  <SelectField
                    label="Phòng học"
                    icon={MapPin}
                    iconColor="text-stone-500"
                    value={formData.room}
                    onChange={(v) => {
                      if (v === 'custom') {
                        setUseCustomRoom(true);
                        setFormData((p) => ({ ...p, room: '' }));
                      } else {
                        setFormData((p) => ({ ...p, room: v }));
                      }
                    }}
                  >
                    <option value="">— Chưa chọn phòng —</option>
                    {dynamicRooms.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                    <option value="custom">✏️ Tự nhập phòng khác...</option>
                  </SelectField>
                ) : (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400 px-1">
                      Phòng học (Tự nhập)
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-stone-400">
                        <MapPin className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="text"
                        value={customRoom}
                        onChange={(e) => setCustomRoom(e.target.value)}
                        placeholder="VD: Phòng đặc biệt A"
                        className={cn(
                          'w-full pl-11 pr-32 py-3.5 rounded-2xl font-bold text-sm outline-none transition-all',
                          'bg-stone-50 dark:bg-stone-900/50',
                          'border border-stone-200 dark:border-stone-700',
                          'focus:border-stone-900 dark:focus:border-stone-400',
                          'text-stone-800 dark:text-stone-200',
                          'focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-stone-400/10',
                          'h-[50px]'
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setUseCustomRoom(false);
                          setCustomRoom('');
                          setFormData((p) => ({ ...p, room: '' }));
                        }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[10px] font-bold text-stone-500 hover:text-stone-955 dark:text-stone-400 dark:hover:text-stone-100 bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200/80 dark:hover:bg-stone-700/80 rounded-xl transition-all border border-stone-200/50 dark:border-stone-700/50 shadow-sm"
                      >
                        Chọn danh sách
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SCHEDULE PICKER */}
              <div className="space-y-2">
                {!useCustomSchedule ? (
                  <SelectField
                    label="Lịch học"
                    icon={Clock}
                    iconColor="text-stone-500"
                    value={formData.schedule}
                    onChange={(v) => {
                      if (v === 'custom') {
                        setUseCustomSchedule(true);
                        setFormData((p) => ({ ...p, schedule: '' }));
                      } else {
                        setFormData((p) => ({ ...p, schedule: v }));
                      }
                    }}
                  >
                    <option value="">— Chưa chọn lịch —</option>
                    {dynamicSchedules.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                    <option value="custom">✏️ Tự nhập lịch học khác...</option>
                  </SelectField>
                ) : (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400 px-1">
                      Lịch học (Tự nhập)
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-stone-400">
                        <Clock className="w-4.5 h-4.5" />
                      </div>
                      <input
                        type="text"
                        value={customSchedule}
                        onChange={(e) => setCustomSchedule(e.target.value)}
                        placeholder="VD: Thứ 2-6, 7:00 - 11:30"
                        className={cn(
                          'w-full pl-11 pr-32 py-3.5 rounded-2xl font-bold text-sm outline-none transition-all',
                          'bg-stone-50 dark:bg-stone-900/50',
                          'border border-stone-200 dark:border-stone-700',
                          'focus:border-stone-900 dark:focus:border-stone-400',
                          'text-stone-800 dark:text-stone-200',
                          'focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-stone-400/10',
                          'h-[50px]'
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setUseCustomSchedule(false);
                          setCustomSchedule('');
                          setFormData((p) => ({ ...p, schedule: '' }));
                        }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[10px] font-bold text-stone-500 hover:text-stone-955 dark:text-stone-400 dark:hover:text-stone-100 bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200/80 dark:hover:bg-stone-700/80 rounded-xl transition-all border border-stone-200/50 dark:border-stone-700/50 shadow-sm"
                      >
                        Chọn danh sách
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sĩ số */}
            <TextInput
              label="Sĩ số tối đa"
              icon={BadgeInfo}
              iconColor="text-stone-500"
              value={formData.capacity}
              onChange={(v) => setFormData((p) => ({ ...p, capacity: parseInt(v) || 0 }))}
              placeholder="VD: 40"
              type="number"
              required
            />
          </div>
        </div>

        {/* RIGHT: 1/3 — Trạng thái + Action */}
        <div className="lg:col-span-1 space-y-5">
          {/* Trạng thái lớp — Badge Radio */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
              <activeStatus.icon
                className={cn('w-4 h-4', activeStatus?.color ?? 'text-stone-500')}
              />
              <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                Trạng thái lớp
              </h3>
            </div>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((opt) => {
                const isActive = formData.status === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, status: opt.value }))}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all font-bold text-sm',
                      isActive
                        ? opt.activeBg
                        : 'border-stone-100 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:border-stone-200 dark:hover:border-stone-700'
                    )}
                  >
                    <opt.icon
                      className={cn(
                        'w-4 h-4 flex-shrink-0',
                        isActive ? opt.color : 'text-stone-400'
                      )}
                    />
                    <span className={isActive ? opt.color : ''}>{opt.label}</span>
                    {isActive && <div className={cn('ml-auto w-2 h-2 rounded-full', opt.dot)} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save action card */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-150 dark:border-stone-800 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800/80">
              <Save className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
                Lưu thay đổi
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Thay đổi sẽ được cập nhật ngay lập tức và đồng bộ với giáo viên, học sinh.
            </p>
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-bold rounded-xl hover:bg-stone-850 dark:hover:bg-stone-50 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button
                type="button"
                onClick={() => router.push(routes.classes.detail(classId))}
                className="w-full py-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 transition-all text-center"
              >
                Hủy bỏ, quay lại
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          {canDelete && (
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-red-100 dark:border-red-950/30 p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-2 border-b border-red-100/50 dark:border-red-950/20">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-500">
                  Thao tác nguy hiểm
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Xóa vĩnh viễn lớp học và toàn bộ dữ liệu ghi danh. Hành động này không thể khôi
                phục.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full py-2.5 text-xs font-bold text-red-600 bg-red-50/50 dark:bg-red-500/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all border border-red-100 dark:border-red-500/10"
              >
                Xóa lớp học này
              </button>
            </div>
          )}
        </div>
      </form>

      {/* DELETE MODAL */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="">
        <div className="p-8 text-center space-y-6 animate-in zoom-in duration-200">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>

          <div>
            <h2 className="text-xl font-black text-stone-900 dark:text-white mb-2 tracking-tight">
              Xác nhận xóa lớp?
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed max-w-xs mx-auto">
              Bạn đang xóa lớp <span className="font-black text-red-600">{formData.name}</span>.
              Hành động này sẽ được ghi lại trong nhật ký hệ thống.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full py-3.5 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-600/20 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              {deleting ? 'Đang xóa...' : 'Xác nhận xóa vĩnh viễn'}
            </button>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="w-full py-3 text-sm text-stone-500 font-bold hover:text-stone-900 dark:hover:text-white transition-colors"
            >
              Quay lại, không xóa
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
