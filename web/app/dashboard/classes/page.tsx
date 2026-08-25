/**
 * Classes Page
 * - RLS filters data at DB level per user role
 * - Admin-only fetches are isolated inside modals (lazy-loaded on open)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '@/lib/routes';
import { useToast } from '@/hooks';
import { usePermissions, PermissionGuard } from '@/hooks/usePermissions';
import { getClasses } from '@/lib/api/client';
import { Search, LayoutGrid, List as ListIcon, Plus, RefreshCw } from 'lucide-react';

import { Card, Button, EmptyState } from '@/components/ui';
import { Icons } from '@/components/ui/Icons';
import { ToastContainer } from '@/components/ui/Toast';
import { logger } from '@/lib/logger';

import ClassListGrid from '@/components/classes/ClassListGrid';
import ClassListTable from '@/components/classes/ClassListTable';
import CreateClassModal from '@/components/classes/CreateClassModal';
import EnrollmentModal from '@/components/classes/EnrollmentModal';

interface Teacher {
  id: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
}

interface ClassData {
  id: string;
  name: string;
  code: string;
  created_at: string;
  teacher_id: string;
  course_id?: string | null;
  teacher?: Teacher;
  course?: { id: string; name: string; code: string };
  academic_year?: { id: string; name: string };
  enrollment_count?: number;
  description?: string;
  schedule?: string;
  room?: string;
}

interface ClassStats {
  total_classes: number;
  total_students: number;
  average_enrollment: number;
  by_teacher: Record<string, number>;
}

export default function ClassesPage() {
  const toast = useToast();
  const router = useRouter();
  const {
    can,
    isStudent,
    isTeacher,
    isExactTeacher,
    loading: permissionsLoading,
    role,
  } = usePermissions();

  useEffect(() => {
    if (!permissionsLoading && isExactTeacher) {
      router.replace(routes.teacher.classes());
    }
  }, [isExactTeacher, permissionsLoading, router]);

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [statistics, setStatistics] = useState<ClassStats | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [enrollTarget, setEnrollTarget] = useState<ClassData | null>(null);

  const canManageClasses = can('classes.create') || can('classes.edit');
  const canEnrollStudents = can('classes.enroll');

  const fetchClasses = useCallback(async () => {
    if (permissionsLoading) return;
    setLoading(true);
    setError(null);
    try {
      const res = (await getClasses({ limit: 50 })) as any;
      const classesData = (res.data || res.classes || []) as ClassData[];
      setClasses(classesData);

      // Compute client-side stats from what RLS returned
      let totalStudents = 0;
      const byTeacher: Record<string, number> = {};
      classesData.forEach((cls) => {
        if (cls.teacher_id) byTeacher[cls.teacher_id] = (byTeacher[cls.teacher_id] || 0) + 1;
        totalStudents += cls.enrollment_count || 0;
      });

      const totalClasses = res.pagination?.totalItems || classesData.length;
      setStatistics(
        res.statistics ?? {
          total_classes: totalClasses,
          total_students: totalStudents,
          average_enrollment: totalClasses > 0 ? totalStudents / totalClasses : 0,
          by_teacher: byTeacher,
        }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error fetching classes';
      setError(msg);
      toast.error('Lỗi', msg);
      logger.error('[ClassesPage]', err);
    } finally {
      setLoading(false);
    }
  }, [permissionsLoading, role]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // ─── Loading skeleton ────────────────────────────────────────────────
  if (permissionsLoading || loading) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
          <div className="mb-6">
            <div className="h-10 w-64 bg-stone-200 dark:bg-stone-800 rounded-3xl animate-pulse mb-2" />
            <div className="h-6 w-96 bg-stone-200 dark:bg-stone-800 rounded-2xl animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-crystal p-6 rounded-2xl">
                <div className="h-4 w-20 bg-stone-200 dark:bg-stone-700 rounded-xl animate-pulse mb-3" />
                <div className="h-8 w-12 bg-stone-200 dark:bg-stone-700 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-crystal p-6 rounded-2xl">
                <div className="h-6 w-32 bg-stone-200 dark:bg-stone-700 rounded-xl animate-pulse mb-4" />
                <div className="space-y-3">
                  <div className="h-4 w-full bg-stone-200 dark:bg-stone-700 rounded-xl animate-pulse" />
                  <div className="h-4 w-3/4 bg-stone-200 dark:bg-stone-700 rounded-xl animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Main render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-transparent relative overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto px-2.5 sm:px-6 lg:px-10 py-3 sm:py-6 relative z-10">
        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />

        {/* Control Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 mb-4 sm:mb-6 bg-white dark:bg-stone-900 p-3 sm:p-4 rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-xs">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-amber-500 transition-colors" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên lớp, mã lớp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
            />
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200/60 dark:border-white/5">
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Xem dạng thẻ"
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-stone-700 shadow-2xs text-amber-600 dark:text-amber-400' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                aria-label="Xem dạng bảng"
                className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-stone-700 shadow-2xs text-amber-600 dark:text-amber-400' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={fetchClasses}
              disabled={loading}
              aria-label="Làm mới"
              className="p-2 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-600 dark:text-stone-300 transition-all shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <PermissionGuard permissions="classes.create">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs rounded-xl transition-all shadow-xs press-effect ml-auto sm:ml-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo lớp học</span>
              </button>
            </PermissionGuard>
          </div>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
            {[
              {
                label: 'Tổng lớp học',
                value: statistics.total_classes,
                icon: <ListIcon className="w-4 h-4" />,
                color: 'bg-blue-500/10 text-blue-500',
              },
              {
                label: 'Tổng học sinh',
                value: statistics.total_students,
                icon: <Icons.Users className="w-4 h-4" />,
                color: 'bg-emerald-500/10 text-emerald-500',
              },
              {
                label: 'Sĩ số TB',
                value: (Number(statistics.average_enrollment) || 0).toFixed(1),
                icon: <Icons.Classes className="w-4 h-4" />,
                color: 'bg-emerald-500/10 text-emerald-500',
              },
              {
                label: 'Giáo viên',
                value: Object.keys(statistics.by_teacher || {}).length,
                icon: <Icons.Users className="w-4 h-4" />,
                color: 'bg-amber-500/10 text-amber-500',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-white/10 rounded-2xl p-3 sm:p-4 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 sm:p-2.5 ${stat.color} rounded-xl shrink-0`}>
                    {stat.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-0.5 truncate">
                      {stat.label}
                    </p>
                    <p className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 leading-none">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="mb-6 border-error">
            <div className="text-error">
              <p className="font-semibold">Error loading classes</p>
              <p className="text-sm mt-1">{error}</p>
              <Button variant="outline" onClick={fetchClasses} className="mt-3">
                Retry
              </Button>
            </div>
          </Card>
        )}

        {/* Empty state */}
        {!loading && classes.length === 0 && !error && (
          <EmptyState
            icon={<Icons.Classes className="w-16 h-16 text-stone-400" />}
            title={
              canManageClasses
                ? 'Không tìm thấy lớp học'
                : isStudent
                  ? 'Không có lớp học đã đăng ký'
                  : 'Không có lớp học được giao'
            }
            description={
              canManageClasses
                ? 'Chưa có lớp học nào được tạo'
                : isStudent
                  ? 'Bạn chưa đăng ký lớp học nào. Liên hệ quản trị viên để được đăng ký.'
                  : 'Bạn chưa được giao lớp học nào. Liên hệ quản trị viên để được giao lớp học.'
            }
          />
        )}

        {/* Class list */}
        {classes.length > 0 &&
          (viewMode === 'grid' ? (
            <ClassListGrid
              classes={classes}
              searchQuery={searchQuery}
              canEnrollStudents={canEnrollStudents}
              onEnrollClick={(cls) => setEnrollTarget(cls)}
            />
          ) : (
            <ClassListTable classes={classes} searchQuery={searchQuery} />
          ))}

        {/* Modals — rendered conditionally; admin data only fetched when opened */}
        <PermissionGuard permissions="classes.create">
          <CreateClassModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={fetchClasses}
          />
        </PermissionGuard>

        <PermissionGuard permissions="classes.enroll">
          <EnrollmentModal
            classData={enrollTarget}
            isOpen={!!enrollTarget}
            onClose={() => setEnrollTarget(null)}
            onSuccess={fetchClasses}
          />
        </PermissionGuard>
      </div>
    </div>
  );
}
