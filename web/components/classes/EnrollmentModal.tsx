"use client";

import { useState, useEffect } from "react";
import { apiFetch, enrollStudent } from "@/lib/api/client";
import { Modal } from "@/components/ui";
import { useToast } from "@/hooks";
import { getDisplayName } from "@/lib/utils/names";
import {
  X,
  Save,
  RefreshCw,
  Users,
  GraduationCap,
  AlertCircle,
} from "lucide-react";

interface ClassData {
  id: string;
  name: string;
  code: string;
  teacher?: { full_name: string; first_name?: string | null; last_name?: string | null };
  enrollment_count?: number;
}

interface EnrollmentModalProps {
  classData: ClassData | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EnrollmentModal({ classData, isOpen, onClose, onSuccess }: EnrollmentModalProps) {
  const toast = useToast();
  const [availableStudents, setAvailableStudents] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (!isOpen || !classData) return;
    setSelectedStudentId("");
    setLoadingStudents(true);

    async function fetchAvailableStudents() {
      try {
        const [studentsRes, enrollmentsRes] = await Promise.all([
          apiFetch("/api/students?status=active&limit=500"),
          apiFetch(`/api/admin/enrollments?class_id=${classData!.id}`),
        ]);

        if (!studentsRes.ok || !enrollmentsRes.ok) throw new Error("Không thể tải dữ liệu");

        const studentsJson = await studentsRes.json();
        const enrollmentsJson = await enrollmentsRes.json();

        const studentsList = studentsJson.data?.data || studentsJson.data || studentsJson.students || [];
        const enrollmentsList = enrollmentsJson.data?.data || enrollmentsJson.data || enrollmentsJson.enrollments || [];

        const enrolledIds = new Set((enrollmentsList as { student_id: string }[]).map((e) => e.student_id));
        setAvailableStudents(studentsList.filter((s: { id: string }) => !enrolledIds.has(s.id)));
      } catch (err) {
        console.error("[EnrollmentModal]", err);
        toast.error("Lỗi", "Không thể tải danh sách học sinh có sẵn");
      } finally {
        setLoadingStudents(false);
      }
    }

    fetchAvailableStudents();
  }, [isOpen, classData?.id]);

  const handleEnroll = async () => {
    if (!classData || !selectedStudentId) {
      toast.warning("Cần chọn", "Vui lòng chọn học sinh để ghi danh");
      return;
    }
    setEnrolling(true);
    try {
      await enrollStudent(selectedStudentId, classData.id);
      toast.success("Đăng ký thành công", "Học sinh đã được đăng ký vào lớp học");
      onClose();
      onSuccess();
    } catch (err) {
      toast.error("Lỗi", err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-800 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ghi danh học sinh</h3>
            <p className="text-sm text-gray-500">Đăng ký học sinh mới vào lớp {classData?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            disabled={enrolling}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          {/* Class Info Card */}
          <div className="p-6 bg-blue-50 dark:bg-blue-500/10 rounded-[2rem] border border-blue-100 dark:border-blue-700/50">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm text-blue-600">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
                  {classData?.code}
                </h4>
                <p className="text-xs text-blue-600 font-bold">{classData?.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <div>
                <span>Giáo viên:</span>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">
                  {classData?.teacher ? getDisplayName(classData.teacher) : "N/A"}
                </p>
              </div>
              <div>
                <span>Sĩ số:</span>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">
                  {classData?.enrollment_count || 0} học sinh
                </p>
              </div>
            </div>
          </div>

          {/* Student Selector */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">
              Chọn học sinh <span className="text-red-500">*</span>
            </label>
            {loadingStudents ? (
              <div className="flex items-center gap-2 py-4 text-gray-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Đang tải danh sách học sinh...</span>
              </div>
            ) : (
              <>
                <div className="relative group">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                  >
                    <option value="">-- Danh sách học sinh khả dụng --</option>
                    {availableStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.email || "No email"})
                      </option>
                    ))}
                  </select>
                </div>
                {availableStudents.length === 0 && (
                  <p className="text-xs text-orange-500 mt-2 ml-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Tất cả học sinh đã được ghi danh.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={enrolling}
              className="flex-1 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-50 transition-all"
            >
              Hủy
            </button>
            <button
              onClick={handleEnroll}
              disabled={!selectedStudentId || enrolling}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {enrolling ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
