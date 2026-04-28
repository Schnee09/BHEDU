"use client";

import { useState, useEffect } from "react";
import { apiFetch, createClass } from "@/lib/api/client";
import { Modal } from "@/components/ui";
import { Icons } from "@/components/ui/Icons";
import { useToast } from "@/hooks";
import { getDisplayName } from "@/lib/utils/names";
import {
  X,
  Save,
  RefreshCw,
  Calendar,
  MapPin,
  Clock,
} from "lucide-react";

interface Teacher {
  id: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
}

interface Course {
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
  name: "",
  code: "",
  description: "",
  teacherId: "",
  courseId: "",
  academicYearId: "",
  room: "",
  schedule: "",
};

export default function CreateClassModal({ isOpen, onClose, onSuccess }: CreateClassModalProps) {
  const toast = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Fetch dropdown data only when this privileged modal mounts
  useEffect(() => {
    if (!isOpen) return;
    setForm(EMPTY_FORM);
    setLoadingData(true);

    async function fetchDropdownData() {
      try {
        const [teachersRes, coursesRes, ayRes] = await Promise.all([
          apiFetch("/api/admin/users?role=teacher&limit=1000"),
          apiFetch("/api/admin/courses?limit=1000"),
          apiFetch("/api/academic-years"),
        ]);

        if (teachersRes.ok) {
          const json = await teachersRes.json();
          setTeachers(json.data?.data || json.data || json.users || []);
        }
        if (coursesRes.ok) {
          const json = await coursesRes.json();
          setCourses(json.data?.data || json.data || json.courses || []);
        }
        if (ayRes.ok) {
          const json = await ayRes.json();
          setAcademicYears(json.data || json.academicYears || []);
        }
      } catch (err) {
        console.error("[CreateClassModal] Failed to load dropdown data:", err);
      } finally {
        setLoadingData(false);
      }
    }

    fetchDropdownData();
  }, [isOpen]);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.warning("Thiếu thông tin", "Vui lòng nhập tên lớp học");
      return;
    }
    setCreating(true);
    try {
      await createClass({
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        description: form.description.trim() || undefined,
        teacher_id: form.teacherId || undefined,
        course_id: form.courseId || undefined,
        academic_year_id: form.academicYearId || undefined,
        room: form.room.trim() || undefined,
        schedule: form.schedule.trim() || undefined,
      });
      toast.success("Tạo thành công", "Lớp học đã được tạo");
      onClose();
      onSuccess();
    } catch (err) {
      toast.error("Lỗi", err instanceof Error ? err.message : "Tạo lớp học thất bại");
    } finally {
      setCreating(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all";
  const selectClass =
    "w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none";
  const labelClass = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-800 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Thêm lớp học mới</h3>
            <p className="text-sm text-gray-500">Khởi tạo một lớp học mới trong hệ thống</p>
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
        <div className="p-8 space-y-6">
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
                  <label className={labelClass}>
                    Mã lớp học <span className="text-red-500">*</span>
                  </label>
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
                    Khóa học <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Icons.Classes className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                    <select
                      value={form.courseId}
                      onChange={(e) => setForm((p) => ({ ...p, courseId: e.target.value }))}
                      className={selectClass}
                    >
                      <option value="">-- Chọn khóa học --</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Giáo viên chủ nhiệm</label>
                  <div className="relative group">
                    <Icons.Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <select
                      value={form.teacherId}
                      onChange={(e) => setForm((p) => ({ ...p, teacherId: e.target.value }))}
                      className={selectClass}
                    >
                      <option value="">-- Chọn giáo viên --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {getDisplayName(t)}
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
                  <label className={labelClass}>Phòng học</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={form.room}
                      onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))}
                      className={`${inputClass} pl-12`}
                      placeholder="VD: A101"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Lịch học</label>
                <div className="relative group">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={form.schedule}
                    onChange={(e) => setForm((p) => ({ ...p, schedule: e.target.value }))}
                    className={`${inputClass} pl-12`}
                    placeholder="VD: Thứ 2-6, 7:00-11:30"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Mô tả lớp học</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                  rows={3}
                  placeholder="Nhập mô tả ngắn gọn về lớp học..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={creating}
                  className="flex-1 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-50 transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!form.name.trim() || !form.courseId || !form.academicYearId || creating}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider text-sm"
                >
                  {creating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Tạo lớp
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
