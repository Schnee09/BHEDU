/**
 * Classes Page - Refactored with Permission System
 * 
 * Features:
 * - Uses permission hooks for access control
 * - RLS handles data filtering at database level
 * - Simplified API endpoint (RLS does the work)
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useFetch, useToast } from "@/hooks";
import { usePermissions, PermissionGuard } from "@/hooks/usePermissions";
import { apiFetch, getClasses, createClass, enrollStudent, updateClass } from "@/lib/api/client";
import { routes } from "@/lib/routes";
import {
  X,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  MoreVertical,
  GraduationCap,
  Users,
  Calendar,
  MapPin,
  Clock,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle
} from "lucide-react";


import { getDisplayName } from "@/lib/utils/names";
import {
  Button,
  Card,
  EmptyState,
  Modal,
} from "@/components/ui";
import { Icons } from "@/components/ui/Icons";
// CardGridSkeleton removed (unused)
import { ToastContainer } from "@/components/ui/Toast";
import { logger } from "@/lib/logger";


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

interface ClassData {
  id: string;
  name: string;
  code: string;
  created_at: string;
  teacher_id: string;
  course_id?: string | null;
  teacher?: Teacher;
  course?: Course;
  academic_year?: {
    id: string;
    name: string;
  };
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

export default function ClassesPageModern() {
  const toast = useToast();
  const { can, isAdmin, isStaff, isTeacher, isStudent, loading: permissionsLoading, role } = usePermissions();
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [enrolling, setEnrolling] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState("");

  // Data state
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [statistics, setStatistics] = useState<ClassStats | undefined>(undefined);
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Class Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [creating, setCreating] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '',
    code: '',
    description: '',
    teacherId: '',
    courseId: '',
    academicYearId: '',
    room: '',
    schedule: ''
  });

  // Permission checks
  const canManageClasses = can('classes.create') || can('classes.edit');
  const canEnrollStudents = can('classes.enroll');

  // Fetch classes, teachers, and courses
  const fetchClasses = async () => {
    if (permissionsLoading) return;

    setLoading(true);
    setError(null);
    try {
      const res = await getClasses({ limit: 50 }) as any;

      // Extract classes data
      const classesData = (res.data || res.classes || []) as unknown as ClassData[];
      setClasses(classesData);

      // Fetch teachers, courses, and academic years for the create modal
      const [teachersRes, coursesRes, academicYearsRes] = await Promise.all([
        apiFetch('/api/admin/users?role=teacher&limit=100'),
        apiFetch('/api/admin/courses?limit=100'),
        apiFetch('/api/academic-years')
      ]);

      if (teachersRes.ok) {
        const teachersJson = await teachersRes.json();
        setTeachers(teachersJson.users || teachersJson.data || []);
      }

      if (coursesRes.ok) {
        const coursesJson = await coursesRes.json();
        setCourses(coursesJson.courses || coursesJson.data || []);
      }

      if (academicYearsRes.ok) {
        const ayJson = await academicYearsRes.json();
        setAcademicYears(ayJson.data || ayJson.academicYears || []);
      }

      // Stats calculation
      let totalStudents = 0;
      const byTeacher: Record<string, number> = {};

      classesData.forEach(cls => {
        if (cls.teacher_id) {
          byTeacher[cls.teacher_id] = (byTeacher[cls.teacher_id] || 0) + 1;
        }
        totalStudents += (cls.enrollment_count || 0);
      });

      const totalClasses = res.pagination?.totalItems || classesData.length;
      const totalTeachersCount = Object.keys(byTeacher).length;
      const avgEnrollment = totalClasses > 0 ? totalStudents / totalClasses : 0;

      if (res.statistics) {
        setStatistics(res.statistics);
      } else {
        setStatistics({
          total_classes: totalClasses,
          total_students: totalStudents,
          average_enrollment: avgEnrollment,
          by_teacher: byTeacher
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error fetching classes';
      setError(msg);
      toast.error('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!permissionsLoading) {
      fetchClasses();
    }
  }, [permissionsLoading, role]);

  const refetch = fetchClasses;

  const handleEnrollClick = async (classData: ClassData) => {
    if (!canEnrollStudents) {
      toast.warning('Không có quyền', 'Bạn không có quyền đăng ký học sinh');
      return;
    }

    setSelectedClass(classData);
    setSelectedStudentId("");
    setShowEnrollModal(true);

    // Fetch available students (not already enrolled in this class)
    try {
      const [studentsRes, enrollmentsRes] = await Promise.all([
        apiFetch('/api/students?status=active&limit=500'),
        apiFetch(`/api/admin/enrollments?class_id=${classData.id}`)
      ]);
      // Note: Kept apiFetch for students/enrollments queries as specific client helpers for these specific availability checks might not exist or use different params.
      // Or I could use getStudents() and getEnrollments in future.

      if (!studentsRes.ok || !enrollmentsRes.ok) {
        throw new Error('Không thể tải dữ liệu đăng ký');
      }

      const studentsData = await studentsRes.json();
      const enrollmentsData = await enrollmentsRes.json();

      // Unwrap V2 response if needed
      const studentsList = studentsData.data?.data || studentsData.data || studentsData.students || [];
      const enrollmentsList = enrollmentsData.data?.data || enrollmentsData.data || enrollmentsData.enrollments || [];

      const enrolledStudentIds = new Set(
        enrollmentsList.map((e: { student_id: string }) => e.student_id)
      );

      const available = studentsList.filter(
        (s: { id: string }) => !enrolledStudentIds.has(s.id)
      );

      setAvailableStudents(available);
    } catch (err) {
      console.error('Lỗi khi tải học sinh:', err);
      toast.error('Lỗi', 'Không thể tải danh sách học sinh có sẵn');
    }
  };

  const handleEnrollStudent = async () => {
    if (!selectedClass || !selectedStudentId) {
      toast.warning('Cần chọn', 'Vui lòng chọn học sinh để ghi danh');
      return;
    }

    setEnrolling(true);
    try {
      await enrollStudent(selectedStudentId, selectedClass.id);

      toast.success('Đăng ký thành công', 'Học sinh đã được đăng ký vào lớp học');
      setShowEnrollModal(false);
      setSelectedClass(null);
      setSelectedStudentId("");
      refetch(); // Refresh class list to update enrollment counts
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đăng ký thất bại';
      toast.error('Lỗi', message);
    } finally {
      setEnrolling(false);
    }
  };

  // Create Class handlers
  const handleOpenCreateModal = async () => {
    setShowCreateModal(true);
    setNewClass({ name: '', code: '', description: '', teacherId: '', courseId: '', academicYearId: '', room: '', schedule: '' });

    // Fetch dependent data for dropdowns
    try {
      const [teachersRes, coursesRes, academicYearsRes] = await Promise.all([
        apiFetch('/api/admin/users?role=teacher&limit=1000'),
        apiFetch('/api/admin/courses?limit=1000'),
        apiFetch('/api/academic-years')
      ]);

      if (teachersRes.ok) {
        const result = await teachersRes.json();
        const teachersData = result.data?.data || result.data || result.users || [];
        setTeachers(teachersData);
      }

      if (coursesRes.ok) {
        const result = await coursesRes.json();
        const coursesData = result.data?.data || result.data || result.courses || [];
        setCourses(coursesData);
      }

      if (academicYearsRes.ok) {
        const result = await academicYearsRes.json();
        const ayData = result.data || result.academicYears || [];
        setAcademicYears(ayData);
      }
    } catch (err) {
      console.error('Failed to fetch modal data:', err);
    }
  };

  const handleCreateClass = async () => {
    if (!newClass.name.trim()) {
      toast.warning('Thiếu thông tin', 'Vui lòng nhập tên lớp học');
      return;
    }

    setCreating(true);
    try {
      await createClass({
        name: newClass.name.trim(),
        code: newClass.code.trim() || undefined,
        description: newClass.description.trim() || undefined,
        teacher_id: newClass.teacherId || undefined,
        course_id: newClass.courseId || undefined,
        academic_year_id: newClass.academicYearId || undefined,
        room: newClass.room.trim() || undefined,
        schedule: newClass.schedule.trim() || undefined,
      });

      toast.success('Tạo thành công', 'Lớp học đã được tạo');
      setShowCreateModal(false);
      setNewClass({ name: '', code: '', description: '', teacherId: '', courseId: '', academicYearId: '', room: '', schedule: '' });
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Tạo lớp học thất bại';
      toast.error('Lỗi', message);
    } finally {
      setCreating(false);
    }
  };

  // Show loading while permissions or data is loading
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
                  <div className="h-4 w-1/2 bg-stone-200 dark:bg-stone-700 rounded-xl animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent relative overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-8 relative z-10">
        {/* Toast Container */}
        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />

        {/* Control Bar: Search & View Toggle */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white/50 dark:bg-stone-900/50 backdrop-blur-md p-4 rounded-[2rem] border border-white/60 dark:border-white/10 shadow-sm">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-amber-500 transition-colors" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên lớp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-stone-50/80 dark:bg-stone-900/50 border border-stone-100 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-amber-500/30 outline-none transition-all text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center p-1.5 bg-stone-100/80 dark:bg-stone-900/50 rounded-2xl border border-stone-200/50 dark:border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-stone-800 shadow-sm text-amber-600' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-white dark:bg-stone-800 shadow-sm text-amber-600' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
              >
                <ListIcon className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={refetch}
              disabled={loading}
              className="p-3.5 bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-2xl text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <PermissionGuard permissions="classes.create">
              <button
                onClick={handleOpenCreateModal}
                className="flex items-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Tạo lớp học</span>
              </button>
            </PermissionGuard>
          </div>
        </div>

        {/* Statistics Bar */}
        {statistics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div className="glass-crystal rounded-2xl p-5 hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 shrink-0">
                  <ListIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] mb-1 truncate">Tổng lớp học</p>
                  <p className="text-3xl font-black text-stone-900 dark:text-stone-100 leading-none">{statistics.total_classes}</p>
                </div>
              </div>
            </div>

            <div className="glass-crystal rounded-2xl p-5 hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] mb-1 truncate">Tổng học sinh</p>
                  <p className="text-3xl font-black text-stone-900 dark:text-stone-100 leading-none">{statistics.total_students}</p>
                </div>
              </div>
            </div>

            <div className="glass-crystal rounded-2xl p-5 hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500 shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] mb-1 truncate">Sĩ số TB</p>
                  <p className="text-3xl font-black text-stone-900 dark:text-stone-100 leading-none">{statistics.average_enrollment.toFixed(1)}</p>
                </div>
              </div>
            </div>

            <div className="glass-crystal rounded-2xl p-5 hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] mb-1 truncate">Giáo viên</p>
                  <p className="text-3xl font-black text-stone-900 dark:text-stone-100 leading-none">{Object.keys(statistics.by_teacher || {}).length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-error">
            <div className="text-error">
              <p className="font-semibold">Error loading classes</p>
              <p className="text-sm mt-1">{error}</p>
              <Button variant="outline" onClick={refetch} className="mt-3">
                Retry
              </Button>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!loading && classes.length === 0 && !error && (
          <EmptyState
            icon={<Icons.Classes className="w-16 h-16 text-stone-400" />}
            title={canManageClasses ? "Không tìm thấy lớp học" : isStudent ? "Không có lớp học đã đăng ký" : "Không có lớp học được giao"}
            description={canManageClasses
              ? "Chưa có lớp học nào được tạo"
              : isStudent
                ? "Bạn chưa đăng ký lớp học nào. Liên hệ quản trị viên để được đăng ký."
                : "Bạn chưa được giao lớp học nào. Liên hệ quản trị viên để được giao lớp học."
            }
          />
        )}

        {/* Classes Display */}
        {classes.length > 0 && (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {classes.filter(c =>
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.code.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((classData) => (
                <div
                  key={classData.id}
                  className="group relative bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8">
                    <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600 group-hover:rotate-12 transition-transform">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="mb-6">
                      <span className="inline-block px-4 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full mb-3">
                        {classData.code}
                      </span>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                        {classData.name}
                      </h2>
                      {classData.course && (
                        <div className="flex items-center gap-2 mb-3">
                          <Icons.Classes className="w-4 h-4 text-purple-500" />
                          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">{classData.course.name}</span>
                        </div>
                      )}
                      <p className="text-sm text-gray-400 line-clamp-2 italic">
                        {classData.description || "Lớp học chưa có mô tả chi tiết."}
                      </p>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700/50">
                        <div className="p-2.5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                          <Users className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Giáo viên</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {classData.teacher ? getDisplayName(classData.teacher) : 'Chưa được giao'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700/50">
                          <MapPin className="w-4 h-4 text-purple-500" />
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{classData.room || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700/50 col-span-2">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{classData.academic_year?.name || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-gray-700">
                      <div className="flex -space-x-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-10 h-10 rounded-full border-4 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <Users className="w-4 h-4 text-gray-400" />
                          </div>
                        ))}
                        <div className="w-10 h-10 rounded-full border-4 border-white dark:border-gray-800 bg-blue-500 flex items-center justify-center">
                          <span className="text-[10px] font-black text-white">+{classData.enrollment_count || 0}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link href={routes.classes.detail(classData.id)}>
                          <button className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-2xl text-gray-600 dark:text-gray-300 transition-all">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </Link>
                        <PermissionGuard permissions="classes.manage">
                          <Link href={routes.classes.edit(classData.id)}>
                            <button className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl hover:scale-105 transition-all active:scale-95 shadow-lg">
                              Quản lý
                            </button>
                          </Link>
                        </PermissionGuard>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50">
                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Lớp học</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Khóa học</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Giáo viên</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Sĩ số</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Phòng/Lịch</th>
                    <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {classes.filter(c =>
                    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.code.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((classData) => (
                    <tr key={classData.id} className="group hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600">
                            <GraduationCap className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900 dark:text-white">{classData.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{classData.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {classData.course ? (
                          <div className="flex items-center gap-2">
                            <Icons.Classes className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{classData.course.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">N/A</span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-[10px] text-gray-500">
                            {classData.teacher ? classData.teacher.full_name.charAt(0) : '?'}
                          </div>
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            {classData.teacher ? getDisplayName(classData.teacher) : 'Chưa giao'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 dark:bg-green-500/10 text-green-600 text-xs font-black rounded-full">
                          <Users className="w-3.5 h-3.5" />
                          {classData.enrollment_count || 0}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MapPin className="w-3.5 h-3.5" />
                            {classData.room || 'N/A'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {classData.schedule || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={routes.classes.detail(classData.id)}>
                            <button className="p-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-gray-600 hover:text-blue-600 shadow-sm transition-all">
                              <Search className="w-4 h-4" />
                            </button>
                          </Link>
                          <PermissionGuard permissions="classes.manage">
                            <Link href={routes.classes.edit(classData.id)}>
                              <button className="p-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold shadow-lg transition-all">
                                <Plus className="w-4 h-4" />
                              </button>
                            </Link>
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Enrollment Modal */}
        <Modal
          isOpen={showEnrollModal}
          onClose={() => {
            setShowEnrollModal(false);
            setSelectedClass(null);
            setSelectedStudentId("");
          }}
          title=""
        >
          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-800 animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ghi danh học sinh</h3>
                <p className="text-sm text-gray-500">Đăng ký học sinh mới vào lớp {selectedClass?.name}</p>
              </div>
              <button
                onClick={() => setShowEnrollModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                disabled={enrolling}
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="p-6 bg-blue-50 dark:bg-blue-500/10 rounded-[2rem] border border-blue-100 dark:border-blue-700/50">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm text-blue-600">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{selectedClass?.code}</h4>
                    <p className="text-xs text-blue-600 font-bold">{selectedClass?.name}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <div>
                    <span>Giáo viên:</span>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{selectedClass?.teacher ? getDisplayName(selectedClass.teacher) : 'N/A'}</p>
                  </div>
                  <div>
                    <span>Sĩ số:</span>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{selectedClass?.enrollment_count || 0} học sinh</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                  Chọn học sinh <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                  >
                    <option value="">-- Danh sách học sinh khả dụng --</option>
                    {availableStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.full_name} ({student.email || 'No email'})
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
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="flex-1 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-50 transition-all"
                  disabled={enrolling}
                >
                  Hủy
                </button>
                <button
                  onClick={handleEnrollStudent}
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

        {/* Create Class Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setNewClass({ name: '', code: '', description: '', teacherId: '', courseId: '', academicYearId: '', room: '', schedule: '' });
          }}
          title=""
        >
          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-800 animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Thêm lớp học mới</h3>
                <p className="text-sm text-gray-500">Khởi tạo một lớp học mới trong hệ thống</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                disabled={creating}
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                    Tên lớp học <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newClass.name}
                    onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="VD: Lớp 10A1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                    Mã lớp học <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newClass.code}
                    onChange={(e) => setNewClass(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all uppercase"
                    placeholder="VD: 10A1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                    Khóa học <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Icons.Classes className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    <select
                      value={newClass.courseId}
                      onChange={(e) => setNewClass(prev => ({ ...prev, courseId: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                    >
                      <option value="">-- Chọn khóa học --</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.name} ({course.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                    Giáo viên chủ nhiệm
                  </label>
                  <div className="relative group">
                    <Icons.Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <select
                      value={newClass.teacherId}
                      onChange={(e) => setNewClass(prev => ({ ...prev, teacherId: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                    >
                      <option value="">-- Chọn giáo viên --</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {getDisplayName(teacher)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                    Năm học <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <select
                      value={newClass.academicYearId}
                      onChange={(e) => setNewClass(prev => ({ ...prev, academicYearId: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
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
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                    Phòng học
                  </label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={newClass.room}
                      onChange={(e) => setNewClass(prev => ({ ...prev, room: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="VD: A101"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                  Lịch học
                </label>
                <div className="relative group">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={newClass.schedule}
                    onChange={(e) => setNewClass(prev => ({ ...prev, schedule: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="VD: Thứ 2-6, 7:00-11:30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                  Mô tả lớp học
                </label>
                <textarea
                  value={newClass.description}
                  onChange={(e) => setNewClass(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                  rows={3}
                  placeholder="Nhập mô tả ngắn gọn về lớp học..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-50 transition-all font-fredoka"
                  disabled={creating}
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateClass}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 font-fredoka uppercase tracking-wider text-sm"
                  disabled={!newClass.name.trim() || !newClass.courseId || !newClass.academicYearId || creating}
                >
                  {creating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Tạo lớp
                </button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
