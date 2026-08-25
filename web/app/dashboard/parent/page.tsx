'use client';

import { useEffect, useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { usePermissions } from '@/hooks/usePermissions';
import { StatCard } from '@/components/ui/Card';
import Link from 'next/link';
import {
  UserPlus,
  GraduationCap,
  ChevronRight,
  AlertCircle,
  CalendarCheck,
  Award,
  CreditCard,
  FileText,
  User,
} from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import ChildAttendanceTodayWidget from '@/components/dashboard/widgets/ChildAttendanceTodayWidget';
import { cn } from '@/lib/utils';

interface LinkedStudent {
  student_id: string;
  student_name: string;
  student_code: string;
  relationship: string;
}

export default function ParentDashboardPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { isParent, isAdmin } = usePermissions();
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinkedStudents = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const { apiFetch } = await import('@/lib/api/client');
      const res = await apiFetch('/api/parent/links');
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to fetch');

      const transformed = (data.data || []).map((link: any) => ({
        student_id: link.student.id,
        student_name: link.student.full_name,
        student_code: link.student.student_code,
        relationship: link.relationship,
      }));

      setStudents(transformed);
      if (transformed.length > 0) {
        setSelectedChildId(transformed[0].student_id);
      }
    } catch (err: any) {
      console.error('Error fetching linked students:', err);
      setError('Không thể tải danh sách học sinh. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profileLoading) {
      if (isParent || isAdmin) {
        fetchLinkedStudents();
      } else {
        setError('Vui lòng đăng nhập với tài khoản phụ huynh');
        setLoading(false);
      }
    }
  }, [profileLoading, isParent, isAdmin]);

  if (profileLoading || (loading && !error)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-stone-400 font-bold text-xs">Đang tải cổng phụ huynh...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-8 max-w-lg mx-auto">
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl p-4 sm:p-6 flex items-center gap-3 text-rose-700 dark:text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-bold">{error}</p>
        </div>
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto min-h-[60vh] flex flex-col items-center justify-center">
        <EmptyState
          title="Chưa kết nối học sinh"
          description="Bạn chưa liên kết tài khoản học sinh nào. Vui lòng nhập mã học sinh để bắt đầu theo dõi chuyên cần và kết quả học tập."
          action={{
            label: 'Kết nối học sinh ngay',
            href: '/dashboard/parent/link-student',
          }}
        />
      </div>
    );
  }

  const selectedChild = students.find((s) => s.student_id === selectedChildId) || students[0];

  return (
    <main className="py-3 sm:py-6 px-2.5 sm:px-6 lg:px-10 max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/60 dark:border-white/5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
            Cổng thông tin Phụ huynh
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-medium">
            Kính chào{' '}
            <strong className="text-stone-900 dark:text-white">{profile?.full_name}</strong> • Theo
            dõi học tập và chuyên cần của con
          </p>
        </div>

        <Link
          href="/dashboard/parent/link-student"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Kết nối thêm học sinh</span>
        </Link>
      </div>

      {/* Child Switcher (If multiple children) */}
      {students.length > 1 && (
        <div className="flex items-center gap-2 p-1.5 bg-stone-100 dark:bg-stone-800 rounded-2xl overflow-x-auto">
          {students.map((child) => {
            const isSelected = child.student_id === selectedChildId;
            return (
              <button
                key={child.student_id}
                onClick={() => setSelectedChildId(child.student_id)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer',
                  isSelected
                    ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                )}
              >
                <div className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center text-[10px] font-black">
                  {child.student_name.charAt(0)}
                </div>
                <span>{child.student_name}</span>
                <span className="text-[10px] opacity-60 font-mono">({child.student_code})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Child Hero & Quick Actions */}
      {selectedChild && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200/80 dark:border-white/10 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-stone-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-lg">
                {selectedChild.student_name.charAt(0)}
              </div>
              <div>
                <h2 className="text-base font-black text-stone-900 dark:text-white uppercase tracking-tight">
                  {selectedChild.student_name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  <span className="font-mono font-bold text-[11px] bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-700 dark:text-stone-300">
                    UID: {selectedChild.student_code}
                  </span>
                  <span>•</span>
                  <span>
                    Quan hệ:{' '}
                    <strong className="text-stone-900 dark:text-white">
                      {selectedChild.relationship || 'Phụ huynh'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            <Link
              href={`/dashboard/students/${selectedChild.student_id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs rounded-xl transition-all"
            >
              <span>Xem hồ sơ chi tiết</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Hub Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Link
              href={`/dashboard/parent/attendance?child_id=${selectedChild.student_id}`}
              className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-white/5 hover:border-emerald-500/40 transition-all group flex flex-col justify-between gap-3 shadow-2xs"
            >
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-stone-900 dark:text-white block group-hover:text-emerald-600 transition-colors">
                  Chuyên cần
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">Lịch sử điểm danh</span>
              </div>
            </Link>

            <Link
              href={`/dashboard/parent/grades?child_id=${selectedChild.student_id}`}
              className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-white/5 hover:border-amber-500/40 transition-all group flex flex-col justify-between gap-3 shadow-2xs"
            >
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 w-fit">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-stone-900 dark:text-white block group-hover:text-amber-600 transition-colors">
                  Bảng điểm
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">Điểm các môn học</span>
              </div>
            </Link>

            <Link
              href={`/dashboard/students/${selectedChild.student_id}/transcript`}
              className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-white/5 hover:border-blue-500/40 transition-all group flex flex-col justify-between gap-3 shadow-2xs"
            >
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 w-fit">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-stone-900 dark:text-white block group-hover:text-blue-600 transition-colors">
                  Phiếu kết quả
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">Kết quả học tập kỳ</span>
              </div>
            </Link>

            <Link
              href={`/dashboard/admin/finance/invoices?student_id=${selectedChild.student_id}`}
              className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-white/5 hover:border-stone-400 transition-all group flex flex-col justify-between gap-3 shadow-2xs"
            >
              <div className="p-2 rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 w-fit">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-stone-900 dark:text-white block">
                  Học phí
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">Hóa đơn & Đóng phí</span>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Attendance Today Widget */}
      {selectedChild && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 px-1">
            Trạng thái điểm danh hôm nay
          </h3>
          <ChildAttendanceTodayWidget childId={selectedChild.student_id} />
        </div>
      )}

      {/* All Connected Children List */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 px-1">
          Tất cả con em đã kết nối ({students.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {students.map((student) => (
            <Link
              key={student.student_id}
              href={`/dashboard/students/${student.student_id}`}
              className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 hover:border-amber-500/50 shadow-2xs transition-all flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-sm shrink-0">
                  {student.student_name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-stone-900 dark:text-white truncate group-hover:text-amber-600 transition-colors">
                    {student.student_name}
                  </p>
                  <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                    {student.student_code} • {student.relationship}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
