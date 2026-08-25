'use client';

import { useState, useEffect } from 'react';
import { apiFetch, enrollStudent } from '@/lib/api/client';
import { Modal, Button } from '@/components/ui';
import { useToast } from '@/hooks';
import { getDisplayName } from '@/lib/utils/names';
import { GraduationCap, Users, UserPlus, AlertCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function EnrollmentModal({
  classData,
  isOpen,
  onClose,
  onSuccess,
}: EnrollmentModalProps) {
  const toast = useToast();
  const [availableStudents, setAvailableStudents] = useState<
    { id: string; full_name: string; email: string; student_code?: string }[]
  >([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (!isOpen || !classData) return;
    setSelectedStudentId('');
    setSearchQuery('');
    setLoadingStudents(true);

    async function fetchAvailableStudents() {
      try {
        // Fetch active students and existing class students in parallel
        const [studentsRes, classStudentsRes] = await Promise.allSettled([
          apiFetch('/api/students?limit=100'),
          apiFetch(`/api/classes/${classData!.id}/students`),
        ]);

        let studentsList: any[] = [];
        const enrolledIds = new Set<string>();

        if (studentsRes.status === 'fulfilled' && studentsRes.value.ok) {
          const studentsJson = await studentsRes.value.json();
          studentsList =
            studentsJson.data?.data || studentsJson.data || studentsJson.students || [];
        } else {
          // Fallback: try basic students fetch
          const fallbackRes = await apiFetch('/api/students');
          if (fallbackRes.ok) {
            const fallbackJson = await fallbackRes.json();
            studentsList =
              fallbackJson.data?.data || fallbackJson.data || fallbackJson.students || [];
          }
        }

        if (classStudentsRes.status === 'fulfilled' && classStudentsRes.value.ok) {
          const classStudentsJson = await classStudentsRes.value.json();
          const enrolledList = classStudentsJson.data || classStudentsJson.students || [];
          enrolledList.forEach((e: any) => {
            if (e.id) enrolledIds.add(e.id);
            if (e.student_id) enrolledIds.add(e.student_id);
          });
        }

        const available = studentsList.filter((s: any) => s && s.id && !enrolledIds.has(s.id));
        setAvailableStudents(available);
      } catch (err) {
        console.error('[EnrollmentModal] Error loading students:', err);
        toast.error('Lỗi', 'Không thể tải danh sách học sinh');
      } finally {
        setLoadingStudents(false);
      }
    }

    fetchAvailableStudents();
  }, [isOpen, classData?.id]);

  const handleEnroll = async () => {
    if (!classData || !selectedStudentId) {
      toast.warning('Cần chọn', 'Vui lòng chọn học sinh để ghi danh');
      return;
    }
    setEnrolling(true);
    try {
      await enrollStudent(selectedStudentId, classData.id);
      toast.success('Thành công', 'Đã ghi danh học sinh vào lớp');
      onClose();
      onSuccess();
    } catch (err) {
      toast.error('Lỗi', err instanceof Error ? err.message : 'Ghi danh thất bại');
    } finally {
      setEnrolling(false);
    }
  };

  const filteredStudents = availableStudents.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.full_name?.toLowerCase().includes(q) ||
      s.student_code?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ghi danh vào lớp học" size="md">
      <div className="space-y-4 pt-1">
        {/* Class Overview Summary Banner */}
        {classData && (
          <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/20 rounded-2xl border border-amber-200/60 dark:border-amber-900/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-black text-sm text-stone-900 dark:text-white truncate">
                    {classData.name}
                  </h4>
                  {classData.code && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-mono font-bold text-[9px] uppercase">
                      {classData.code}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                  GV: {classData.teacher ? getDisplayName(classData.teacher) : 'Chưa chỉ định'}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">
                Sĩ số
              </span>
              <span className="text-xs font-black text-stone-900 dark:text-white">
                {classData.enrollment_count || 0} HS
              </span>
            </div>
          </div>
        )}

        {/* Student Selector Section */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
            Chọn học sinh <span className="text-rose-500">*</span>
          </label>

          {loadingStudents ? (
            <div className="flex items-center justify-center gap-2 py-6 text-stone-400 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200/60 dark:border-white/5">
              <div className="w-4 h-4 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
              <span className="text-xs font-bold">Đang tải danh sách học sinh...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Optional Quick Search Filter if list > 5 */}
              {availableStudents.length > 5 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên, mã hoặc email..."
                    className="w-full h-9 pl-8 pr-3 bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>
              )}

              {/* Select dropdown */}
              <div className="relative">
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full h-11 px-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                >
                  <option value="">
                    -- Chọn học sinh từ danh sách ({filteredStudents.length}) --
                  </option>
                  {filteredStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} {s.student_code ? `(${s.student_code})` : ''}{' '}
                      {s.email ? `- ${s.email}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {availableStudents.length === 0 && (
                <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-900/30 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>Tất cả học sinh trong hệ thống đã được ghi danh vào lớp này.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100 dark:border-white/5">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={enrolling}
            className="h-10 px-4 rounded-xl text-xs font-bold"
          >
            Hủy bỏ
          </Button>

          <Button
            type="button"
            variant="gold"
            onClick={handleEnroll}
            disabled={!selectedStudentId || enrolling}
            isLoading={enrolling}
            className="h-10 px-5 rounded-xl text-xs font-bold gap-1.5 shadow-md shadow-amber-500/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Ghi danh</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
