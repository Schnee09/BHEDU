'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { Badge, Button } from '@/components/ui';
import {
  GraduationCap,
  Users,
  Calendar,
  ChevronLeft,
  Edit3,
  FileSpreadsheet,
  ClipboardCheck,
  TrendingUp,
  Mail,
  ChevronRight,
  Info,
  Download,
  AlertCircle,
  Clock,
  MapPin,
} from 'lucide-react';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getDisplayName } from '@/lib/utils/names';
import { usePermissions, PermissionGuard } from '@/hooks/usePermissions';

interface ClassDetail {
  id: string;
  name: string;
  code?: string;
  description?: string;
  schedule?: string;
  room?: string;
  created_at: string;
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
  enrollment_count?: number;
  students?: Array<{
    id: string;
    full_name: string;
    first_name?: string | null;
    last_name?: string | null;
    email: string;
    student_code?: string;
    status?: string;
  }>;
  course?: {
    id: string;
    name: string;
    code: string;
  };
  academic_year?: {
    id: string;
    name: string;
  };
  timetable?: Array<{
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room?: string | null;
    notes?: string | null;
    subject?: { id: string; name: string; code: string } | null;
    teacher?: { id: string; full_name: string } | null;
  }>;
}

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const { isExactTeacher, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (!permissionsLoading && isExactTeacher) {
      router.replace(routes.teacher.classDetail(classId));
    }
  }, [isExactTeacher, permissionsLoading, classId, router]);

  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'actions' | 'students' | 'details'>('actions');

  useEffect(() => {
    const fetchClassDetail = async () => {
      try {
        setLoading(true);

        const response = await apiFetch(
          `/api/classes/${classId}?include_students=true&include_timetable=true`
        );
        if (!response.ok) throw new Error('Không thể tải thông tin lớp học');

        const resJson = await response.json();
        const cls = resJson.class;

        setClassData(cls);
      } catch (err: any) {
        console.error('[ClassDetail] Error:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchClassDetail();
    }
  }, [classId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-stone-400 font-bold text-xs">Đang tải thông tin lớp học...</p>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center">
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-8 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-base font-black text-stone-900 dark:text-white uppercase tracking-tight">
            {error === 'Class not found' ? 'Không tìm thấy lớp học' : 'Lỗi tải dữ liệu'}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            {error || 'Không thể tải thông tin lớp học. Vui lòng xác nhận lại mã lớp.'}
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs rounded-xl hover:bg-stone-200 transition-all"
            >
              Quay lại
            </button>
            <Link href={routes.classes.list()}>
              <button className="px-4 py-2 bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 font-bold text-xs rounded-xl hover:bg-stone-800 transition-all">
                Danh sách lớp
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const daysOfWeek = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

  return (
    <div className="min-h-screen bg-transparent py-3 sm:py-6 px-2.5 sm:px-6 lg:px-10 overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-6 relative z-10">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2.5 pb-2.5 border-b border-stone-200/60 dark:border-white/5">
          <Link
            href="/dashboard/classes"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-colors p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Danh sách lớp học</span>
          </Link>

          <div className="flex items-center gap-2">
            <PermissionGuard permissions="classes.manage">
              <Link href={routes.classes.edit(classId)}>
                <Button
                  variant="gold"
                  size="sm"
                  className="h-9 px-4 rounded-xl font-bold text-xs gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Quản lý lớp</span>
                </Button>
              </Link>
            </PermissionGuard>
          </div>
        </div>

        {/* ── HERO CLASS CARD ── */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200/80 dark:border-white/10 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-left">
            {/* Left: Class Identity */}
            <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 min-w-0">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                <GraduationCap className="w-8 h-8" />
              </div>

              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight truncate">
                    {classData.name}
                  </h1>
                  {classData.code && (
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-mono font-bold text-[10px] uppercase">
                      {classData.code}
                    </span>
                  )}
                  <Badge
                    variant={
                      classData.status === 'active'
                        ? 'success'
                        : classData.status === 'inactive'
                          ? 'warning'
                          : 'default'
                    }
                    className="font-bold text-[9px] uppercase tracking-wider px-2.5 py-0.5"
                  >
                    {classData.status === 'active'
                      ? 'Đang học'
                      : classData.status === 'inactive'
                        ? 'Tạm ngưng'
                        : 'Đã kết thúc'}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-stone-500 dark:text-stone-400 font-medium">
                  {classData.course && (
                    <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-md text-[10px] font-bold">
                      Khóa: {classData.course.name}
                    </span>
                  )}
                  {classData.academic_year && (
                    <span className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-md text-[10px] font-bold">
                      Năm: {classData.academic_year.name}
                    </span>
                  )}
                  {classData.room && (
                    <span className="flex items-center gap-1 text-[11px] text-stone-500">
                      <MapPin className="w-3 h-3 text-amber-500" />
                      <span>Phòng {classData.room}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Teacher In-Charge */}
            <div className="sm:border-l border-stone-200/60 dark:border-white/5 sm:pl-5 flex items-center gap-3 shrink-0">
              {classData.teacher ? (
                <>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                    {getDisplayName(classData.teacher).charAt(0)}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold text-stone-900 dark:text-white truncate">
                      {getDisplayName(classData.teacher)}
                    </p>
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                      Giáo viên phụ trách
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-xs text-stone-400 italic">Chưa phân công giáo viên</p>
              )}
            </div>
          </div>

          {/* 4-Stat Metric Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-stone-100 dark:border-white/5">
            <div className="p-3 sm:p-4 rounded-2xl border bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1">
                Sĩ số lớp
              </span>
              <p className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tabular-nums">
                {(classData.students?.length !== undefined
                  ? classData.students.length
                  : classData.enrollment_count) || 0}
                {(classData.capacity || classData.max_capacity) && (
                  <span className="text-xs font-bold text-stone-400 ml-1">
                    / {classData.capacity || classData.max_capacity}
                  </span>
                )}
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl border bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-1">
                Lịch học
              </span>
              <p className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tabular-nums">
                {classData.timetable?.length || 0}{' '}
                <span className="text-xs font-bold text-stone-400">buổi/tuần</span>
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl border bg-stone-50 dark:bg-stone-800/50 border-stone-200/60 dark:border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1">
                Phòng học
              </span>
              <p className="text-base sm:text-lg font-black text-stone-900 dark:text-white truncate">
                {classData.room || 'Chưa xếp'}
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl border bg-stone-50 dark:bg-stone-800/50 border-stone-200/60 dark:border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1">
                Ngày bắt đầu
              </span>
              <p className="text-base sm:text-lg font-black text-stone-900 dark:text-white">
                {classData.created_at ? format(new Date(classData.created_at), 'dd/MM/yyyy') : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* ── STREAMLINED TABS ── */}
        <div className="flex gap-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-2xl max-w-lg border border-stone-200/60 dark:border-white/5">
          <button
            onClick={() => setActiveTab('actions')}
            className={cn(
              'flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer',
              activeTab === 'actions'
                ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            )}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Nghiệp vụ</span>
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={cn(
              'flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer',
              activeTab === 'students'
                ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            )}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Học sinh ({classData.students?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={cn(
              'flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer',
              activeTab === 'details'
                ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            )}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Thông tin</span>
          </button>
        </div>

        {/* ── TAB 1: OPERATIONS / ACTIONS ── */}
        {activeTab === 'actions' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
            {/* Quick Action Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <PermissionGuard
                permissions="attendance.mark"
                fallback={
                  <div className="p-4 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 text-center text-xs text-stone-400 bg-white dark:bg-stone-900">
                    Không có quyền điểm danh lớp này
                  </div>
                }
              >
                <Link
                  href={`/dashboard/attendance/mark?class=${classId}`}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-white/10 hover:border-emerald-500/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <ClipboardCheck className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      Mở điểm danh{' '}
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-stone-900 dark:text-white mb-0.5">
                      Điểm danh buổi học
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Ghi nhận sĩ số, hiện diện và gửi thông báo Zalo phụ huynh
                    </p>
                  </div>
                </Link>
              </PermissionGuard>

              <PermissionGuard
                permissions="grades.entry"
                fallback={
                  <div className="p-4 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 text-center text-xs text-stone-400 bg-white dark:bg-stone-900">
                    Không có quyền nhập điểm lớp này
                  </div>
                }
              >
                <Link
                  href={`/dashboard/grades/entry?class=${classId}`}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-white/10 hover:border-amber-500/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      Vào sổ điểm{' '}
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-stone-900 dark:text-white mb-0.5">
                      Sổ điểm & Đánh giá
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Nhập điểm định kỳ, kiểm tra 15p, 1 tiết, giữa kỳ và cuối kỳ
                    </p>
                  </div>
                </Link>
              </PermissionGuard>

              {/* Announcements / Utilities */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                    <Info className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-sm text-stone-900 dark:text-white">
                    Tiện ích lớp học
                  </h3>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/admin/announcements/create?classId=${classId}`}
                    className="flex-1"
                  >
                    <button className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 rounded-xl text-xs font-bold transition-all">
                      Gửi thông báo
                    </button>
                  </Link>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-2 px-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>In / PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Weekly Timetable Schedule */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 p-4 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-white/5">
                <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  Thời khóa biểu tuần
                </h3>
              </div>

              {classData.timetable && classData.timetable.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {classData.timetable.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-3.5 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200/60 dark:border-white/5 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-stone-900 dark:text-white">
                          {slot.subject?.name || classData.course?.name || 'Môn học'}
                        </span>
                        {slot.room && (
                          <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-md text-[10px] font-bold">
                            Phòng {slot.room}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-500">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>
                          {daysOfWeek[slot.day_of_week] || 'Buổi học'} •{' '}
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </span>
                      </div>
                      {slot.teacher && (
                        <p className="text-[11px] text-stone-600 dark:text-stone-400 font-medium pt-0.5">
                          GV: {slot.teacher.full_name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-6 text-xs text-stone-400 italic">
                  Chưa cấu hình lịch học cho lớp này.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: STUDENTS ── */}
        {activeTab === 'students' && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 p-4 sm:p-6 shadow-xs space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-white/5">
              <div>
                <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider">
                  Danh sách học sinh ({classData.students?.length || 0})
                </h3>
              </div>
            </div>

            {classData.students && classData.students.length > 0 ? (
              <>
                {/* Mobile Cards View (< md) */}
                <div className="md:hidden space-y-2.5">
                  {classData.students.map((student) => (
                    <Link
                      key={student.id}
                      href={`/dashboard/students/${student.id}`}
                      className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200/60 dark:border-white/5 flex items-center justify-between gap-3 hover:border-amber-500/40 transition-colors block"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-stone-200 dark:bg-stone-700 flex items-center justify-center font-bold text-stone-600 dark:text-stone-300 text-xs shrink-0">
                          {getDisplayName(student).charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-stone-900 dark:text-white truncate">
                            {getDisplayName(student)}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-0.5">
                            <span className="font-mono">{student.student_code || '—'}</span>
                            <span>•</span>
                            <Badge
                              variant={student.status === 'active' ? 'success' : 'default'}
                              className="text-[8px] px-1.5 py-0"
                            >
                              {student.status === 'active' ? 'Đang học' : 'Lưu trữ'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
                    </Link>
                  ))}
                </div>

                {/* Desktop Table View (md+) */}
                <div className="hidden md:block overflow-hidden rounded-xl border border-stone-100 dark:border-white/5">
                  <table className="w-full text-xs">
                    <thead className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200/60 dark:border-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-stone-500 uppercase tracking-wider">
                          Học sinh
                        </th>
                        <th className="px-4 py-3 text-left font-bold text-stone-500 uppercase tracking-wider">
                          Mã UID
                        </th>
                        <th className="px-4 py-3 text-left font-bold text-stone-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-right font-bold text-stone-500 uppercase tracking-wider">
                          Hồ sơ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                      {classData.students.map((student) => (
                        <tr
                          key={student.id}
                          className="hover:bg-stone-50/60 dark:hover:bg-white/5 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-bold text-stone-600 dark:text-stone-400 text-xs shrink-0">
                                {getDisplayName(student).charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-stone-900 dark:text-white">
                                  {getDisplayName(student)}
                                </p>
                                <span className="text-[9px] text-stone-400">
                                  {student.status === 'active' ? 'Đang theo học' : 'Lưu trữ'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-stone-600 dark:text-stone-400">
                            {student.student_code || '—'}
                          </td>
                          <td className="px-4 py-3 text-stone-500 truncate max-w-[200px]">
                            {student.email || '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/dashboard/students/${student.id}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:underline"
                            >
                              <span>Chi tiết</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-center py-8 text-xs text-stone-400 italic">
                Lớp học này hiện chưa có học sinh ghi danh.
              </p>
            )}
          </div>
        )}

        {/* ── TAB 3: DETAILS ── */}
        {activeTab === 'details' && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 p-4 sm:p-6 shadow-xs space-y-4 animate-in fade-in duration-300">
            <div className="pb-3 border-b border-stone-100 dark:border-white/5">
              <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider">
                Thông tin tổng quan lớp học
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-white/5 space-y-0.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Tên lớp học
                </span>
                <span className="font-bold text-stone-900 dark:text-white">{classData.name}</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-white/5 space-y-0.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Mã định danh lớp
                </span>
                <span className="font-bold font-mono text-stone-900 dark:text-white">
                  {classData.code || '—'}
                </span>
              </div>
              {classData.course && (
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-white/5 space-y-0.5">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Khóa đào tạo
                  </span>
                  <span className="font-bold text-stone-900 dark:text-white">
                    {classData.course.name}
                  </span>
                </div>
              )}
              {classData.academic_year && (
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-white/5 space-y-0.5">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Năm học
                  </span>
                  <span className="font-bold text-stone-900 dark:text-white">
                    {classData.academic_year.name}
                  </span>
                </div>
              )}
            </div>

            {classData.description && (
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-white/5 space-y-1 text-xs">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Mô tả chi tiết
                </span>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                  {classData.description}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
