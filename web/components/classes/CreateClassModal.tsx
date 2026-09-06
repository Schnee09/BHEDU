'use client';

import { useState, useEffect } from 'react';
import { apiFetch, createClass } from '@/lib/api/client';
import { CENTER_ROOMS, STANDARD_SCHEDULES } from '@/lib/config/resources';
import { Modal } from '@/components/ui';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/hooks';
import { getDisplayName } from '@/lib/utils/names';
import { X, Save, RefreshCw, Calendar, MapPin, Clock, Sparkles } from 'lucide-react';

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

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface AcademicYear {
  id: string;
  name: string;
}

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EMPTY_FORM = {
  name: '',
  code: '',
  description: '',
  teacherId: '',
  subjectId: '',
  academicYearId: '',
  room: '',
  schedule: '',
  capacity: 40,
  status: 'active',
};

const WEEK_DAYS = [
  { day: 0, label: 'Thứ 2' },
  { day: 1, label: 'Thứ 3' },
  { day: 2, label: 'Thứ 4' },
  { day: 3, label: 'Thứ 5' },
  { day: 4, label: 'Thứ 6' },
  { day: 5, label: 'Thứ 7' },
  { day: 6, label: 'Chủ Nhật' },
];

export default function CreateClassModal({ isOpen, onClose, onSuccess }: CreateClassModalProps) {
  const toast = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [customRoom, setCustomRoom] = useState('');
  const [useCustomRoom, setUseCustomRoom] = useState(false);
  const [customSchedule, setCustomSchedule] = useState('');
  const [useCustomSchedule, setUseCustomSchedule] = useState(false);
  const [dynamicRooms, setDynamicRooms] = useState<string[]>(CENTER_ROOMS);
  const [dynamicSchedules, setDynamicSchedules] = useState<string[]>(STANDARD_SCHEDULES);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 2, 4]); // Mặc định T2, T4, T6
  const [autoSchedule, setAutoSchedule] = useState(true);

  // Fetch dropdown data only when this privileged modal mounts
  useEffect(() => {
    if (!isOpen) return;
    setForm(EMPTY_FORM);
    setCustomRoom('');
    setUseCustomRoom(false);
    setCustomSchedule('');
    setUseCustomSchedule(false);
    setSelectedDays([0, 2, 4]);
    setAutoSchedule(true);
    setLoadingData(true);

    async function fetchDropdownData() {
      try {
        const [teachersRes, subjectsRes, ayRes, roomsRes, schedulesRes] = await Promise.all([
          apiFetch('/api/teachers'),
          apiFetch('/api/subjects'),
          apiFetch('/api/academic-years'),
          apiFetch('/api/settings?key=center_rooms'),
          apiFetch('/api/settings?key=center_schedules'),
        ]);

        if (teachersRes.ok) {
          const json = await teachersRes.json();
          setTeachers(json.data?.teachers || json.teachers || json.data?.data || []);
        }
        if (subjectsRes.ok) {
          const json = await subjectsRes.json();
          setSubjects(json.subjects || json.data || []);
        }
        if (ayRes.ok) {
          const json = await ayRes.json();
          setAcademicYears(json.data || json.academicYears || []);
        }
        if (roomsRes.ok) {
          const json = await roomsRes.json();
          const setting = json.setting;
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
            } else if (Array.isArray(rawRooms)) {
              setDynamicRooms(rawRooms);
            }
          }
        }
        if (schedulesRes.ok) {
          const json = await schedulesRes.json();
          const setting = json.setting;
          if (setting && Array.isArray(setting.value_json)) {
            setDynamicSchedules(setting.value_json);
          }
        }
      } catch (err) {
        console.error('[CreateClassModal] Failed to load dropdown data:', err);
      } finally {
        setLoadingData(false);
      }
    }

    fetchDropdownData();
  }, [isOpen]);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.warning('Thiếu thông tin', 'Vui lòng nhập tên lớp học');
      return;
    }
    setCreating(true);

    const resolvedRoom = useCustomRoom ? customRoom.trim() : form.room.trim();
    const resolvedSchedule = useCustomSchedule ? customSchedule.trim() : form.schedule.trim();

    try {
      // 1. Create Class Record (with auto-timetable generation built into repository)
      await createClass({
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        description: form.description.trim() || undefined,
        teacher_id: form.teacherId || undefined,
        subject_id: form.subjectId || undefined,
        academic_year_id: form.academicYearId || undefined,
        room: resolvedRoom || undefined,
        schedule: resolvedSchedule || undefined,
        capacity: form.capacity,
        status: form.status,
        days_of_week: selectedDays,
        auto_schedule: autoSchedule,
      });

      if (autoSchedule && resolvedSchedule && selectedDays.length > 0) {
        toast.success(
          'Tạo lớp thành công',
          `Đã tạo lớp ${form.name} và tự động xếp ${selectedDays.length} tiết học lên Thời Khóa Biểu!`
        );
      } else {
        toast.success('Tạo thành công', 'Lớp học đã được tạo thành công');
      }

      onClose();
      onSuccess();
    } catch (err) {
      toast.error('Lỗi', err instanceof Error ? err.message : 'Tạo lớp học thất bại');
    } finally {
      setCreating(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all';
  const selectClass =
    'w-full pl-12 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none h-[48px]';
  const labelClass = 'block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-800 animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50 shrink-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Thêm lớp học mới</h3>
            <p className="text-sm text-gray-500">
              Khởi tạo một lớp học mới và đồng bộ thời khóa biểu
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            disabled={creating}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6 overflow-y-auto">
          {loadingData ? (
            <div className="flex items-center justify-center py-12 text-gray-400 gap-3">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-sm font-bold">Đang tải dữ liệu...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>
                    Tên lớp học <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className={inputClass}
                    placeholder="VD: Lớp 10A1"
                  />
                </div>
                <div>
                  <label className={labelClass}>Mã lớp học</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                    className={`${inputClass} uppercase`}
                    placeholder="VD: 10A1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>
                    Khóa học / Môn học <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Icons.Classes className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                    <select
                      value={form.subjectId}
                      onChange={(e) => setForm((p) => ({ ...p, subjectId: e.target.value }))}
                      className={selectClass}
                    >
                      <option value="">-- Chọn môn / khóa học --</option>
                      {subjects.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Giáo viên phụ trách</label>
                  <div className="relative group">
                    <Icons.Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <select
                      value={form.teacherId}
                      onChange={(e) => setForm((p) => ({ ...p, teacherId: e.target.value }))}
                      className={selectClass}
                    >
                      <option value="">-- Chọn giáo viên phụ trách --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {getDisplayName(t)}{' '}
                          {t.role && t.role !== 'teacher'
                            ? `(${INSTRUCTOR_ROLE_LABELS[t.role] || t.role})`
                            : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>
                    Năm học <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <select
                      value={form.academicYearId}
                      onChange={(e) => setForm((p) => ({ ...p, academicYearId: e.target.value }))}
                      className={selectClass}
                    >
                      <option value="">-- Chọn năm học --</option>
                      {academicYears.map((ay) => (
                        <option key={ay.id} value={ay.id}>
                          {ay.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  {!useCustomRoom ? (
                    <>
                      <label className={labelClass}>Phòng học</label>
                      <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 z-10" />
                        <select
                          value={form.room}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'custom') {
                              setUseCustomRoom(true);
                              setForm((p) => ({ ...p, room: '' }));
                            } else {
                              setForm((p) => ({ ...p, room: val }));
                            }
                          }}
                          className={selectClass}
                        >
                          <option value="">-- Chọn phòng học --</option>
                          {dynamicRooms.map((r) => (
                            <option key={r} value={r}>
                              Phòng {r}
                            </option>
                          ))}
                          <option value="custom">-- Phòng học khác (Tự nhập) --</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <label className={labelClass.replace('mb-2', '')}>Nhập tên phòng</label>
                        <button
                          type="button"
                          onClick={() => {
                            setUseCustomRoom(false);
                            setCustomRoom('');
                            setForm((p) => ({ ...p, room: '' }));
                          }}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
                        >
                          Chọn từ danh sách
                        </button>
                      </div>
                      <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 z-10" />
                        <input
                          type="text"
                          value={customRoom}
                          onChange={(e) => setCustomRoom(e.target.value)}
                          className={inputClass}
                          placeholder="Nhập tên phòng học khác..."
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Schedule & Days */}
              <div className="p-4 bg-stone-50 dark:bg-stone-900/60 rounded-2xl border border-stone-200/80 dark:border-white/5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    {!useCustomSchedule ? (
                      <>
                        <label className={labelClass}>Khung giờ / Ca học</label>
                        <div className="relative group">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 z-10" />
                          <select
                            value={form.schedule}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'custom') {
                                setUseCustomSchedule(true);
                                setForm((p) => ({ ...p, schedule: '' }));
                              } else {
                                setForm((p) => ({ ...p, schedule: val }));
                              }
                            }}
                            className={selectClass}
                          >
                            <option value="">-- Chọn ca học --</option>
                            {dynamicSchedules.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                            <option value="custom">-- Khung giờ khác (Tự nhập) --</option>
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center mb-2">
                          <label className={labelClass.replace('mb-2', '')}>Nhập khung giờ</label>
                          <button
                            type="button"
                            onClick={() => {
                              setUseCustomSchedule(false);
                              setCustomSchedule('');
                              setForm((p) => ({ ...p, schedule: '' }));
                            }}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
                          >
                            Chọn từ danh sách
                          </button>
                        </div>
                        <div className="relative group">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 z-10" />
                          <input
                            type="text"
                            value={customSchedule}
                            onChange={(e) => setCustomSchedule(e.target.value)}
                            className={inputClass}
                            placeholder="VD: 17:30 - 19:00"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Sĩ số tối đa</label>
                    <input
                      type="number"
                      value={form.capacity}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, capacity: parseInt(e.target.value) || 0 }))
                      }
                      className={inputClass}
                      placeholder="VD: 40"
                      min={1}
                    />
                  </div>
                </div>

                {/* Day selector pills */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      Ngày học trong tuần:
                    </label>
                    <span className="text-[11px] text-stone-400">
                      {selectedDays.length === 0
                        ? 'Chưa chọn ngày nào'
                        : `Đã chọn ${selectedDays.length} ngày`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {WEEK_DAYS.map(({ day, label }) => {
                      const isSelected = selectedDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            setSelectedDays((prev) =>
                              isSelected ? prev.filter((d) => d !== day) : [...prev, day].sort()
                            );
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                            isSelected
                              ? 'bg-amber-500 text-white border-amber-500 shadow-sm scale-105'
                              : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-amber-400'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Auto Schedule Switch */}
                <label className="flex items-center gap-2.5 pt-2 border-t border-stone-200/60 dark:border-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSchedule}
                    onChange={(e) => setAutoSchedule(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Tự động đồng bộ các tiết học lên Thời Khóa Biểu
                  </span>
                </label>
              </div>

              <div>
                <label className={labelClass}>Trạng thái lớp</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as any }))}
                  className={inputClass}
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Tạm ngưng</option>
                  <option value="completed">Đã hoàn thành</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Mô tả lớp học</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                  rows={2}
                  placeholder="Nhập mô tả ngắn gọn về lớp học..."
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            disabled={creating}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || loadingData}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {creating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Tạo lớp học</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
