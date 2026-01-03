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
import { apiFetch } from "@/lib/api/client";
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
  full_name: string;
  email: string;
}

interface ClassData {
  id: string;
  name: string;
  code: string;
  created_at: string;
  teacher_id: string;
  teacher?: Teacher;
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

  // Permission checks
  const canManageClasses = can('classes.create') || can('classes.edit');
  const canEnrollStudents = can('classes.enroll');

  // Single API endpoint - RLS handles filtering based on user role
  // Only fetch when permissions are loaded
  const apiEndpoint = permissionsLoading ? null : '/api/classes';

  // Fetch classes - RLS automatically filters based on user role
  const { data, loading, error, refetch } = useFetch<{
    classes?: ClassData[];
    data?: ClassData[];
    statistics?: ClassStats;
  }>(apiEndpoint);

  // Handle success
  useEffect(() => {
    if (data) {
      const classesArray = data.classes || data.data || [];
      logger.info('Classes loaded', { count: classesArray.length, role });
    }
  }, [data, role]);

  // Handle error
  useEffect(() => {
    if (error) {
      // Show user-friendly rate limit message
      if (error.includes('Rate limit exceeded')) {
        toast.warning('Vui lòng chờ', 'Quá nhiều yêu cầu. Vui lòng chờ một chút trước khi thử lại.');
      } else {
        toast.error('Không thể tải lớp học', error);
        logger.error('Classes fetch error', new Error(error));
      }
    }
  }, [error, toast]);

  const classes = data?.classes || data?.data || [];
  const statistics = data?.statistics;

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

      if (!studentsRes.ok || !enrollmentsRes.ok) {
        throw new Error('Không thể tải dữ liệu đăng ký');
      }

      const studentsData = await studentsRes.json();
      const enrollmentsData = await enrollmentsRes.json();

      const enrolledStudentIds = new Set(
        (enrollmentsData.data || []).map((e: { student_id: string }) => e.student_id)
      );

      const available = (studentsData.students || studentsData.data || []).filter(
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
      const response = await apiFetch('/api/admin/enrollments', {
        method: 'POST',
        body: JSON.stringify({
          student_id: selectedStudentId,
          class_id: selectedClass.id,
          status: 'active'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể đăng ký học sinh');
      }

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

  // Show loading while permissions or data is loading
  if (permissionsLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-6 w-96 bg-gray-200 rounded animate-pulse" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="space-y-3">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toast Container */}
        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {canManageClasses ? "Quản lý Lớp học" : isStudent ? "Lớp học của tôi" : "Lớp học được giao"}
              </h1>
              <p className="mt-2 text-gray-600">
                {canManageClasses
                  ? `Quản lý tất cả lớp học và đăng ký • Tổng số: ${classes.length}`
                  : isStudent
                    ? `Xem lớp học đã đăng ký và tiến độ • Tổng số: ${classes.length}`
                    : `Xem và quản lý lớp học được giao • Tổng số: ${classes.length}`
                }
              </p>
            </div>
            {canManageClasses && (
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={refetch}
                  leftIcon={<Icons.Search className="w-4 h-4" />}
                  disabled={loading}
                >
                  Làm mới
                </Button>
                <PermissionGuard permissions="classes.create">
                  <Link href="/dashboard/classes">
                    <Button variant="primary" leftIcon={<Icons.Add className="w-4 h-4" />}>
                      Tạo lớp học
                    </Button>
                  </Link>
                </PermissionGuard>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="mb-8">
            <h2 className="sr-only">Thống kê lớp học</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng số lớp học</p>
                    <p className="text-3xl font-bold text-gray-900">{statistics.total_classes}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Icons.Classes className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng số học sinh</p>
                    <p className="text-3xl font-bold text-green-600">{statistics.total_students}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Icons.Students className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sĩ số trung bình</p>
                    <p className="text-3xl font-bold text-purple-600">{statistics.average_enrollment.toFixed(1)}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Icons.Chart className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Giáo viên</p>
                    <p className="text-3xl font-bold text-orange-600">{Object.keys(statistics.by_teacher || {}).length}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Icons.Teachers className="w-6 h-6 text-orange-600" />
                  </div>
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

        {/* Classes Grid */}
        {classes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classData) => (
              <div
                key={classData.id}
                className="bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 group"
              >
                <div className="p-6">
                  <div className="flex flex-col h-full">
                    {/* Class Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h2 className="font-bold text-xl text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors duration-200">
                          {classData.name}
                        </h2>
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {classData.code}
                        </div>
                      </div>
                      {classData.enrollment_count !== undefined && (
                        <div className="flex items-center gap-1.5 bg-gray-100 text-gray-700 rounded-full px-3 py-1.5 text-sm font-semibold">
                          <Icons.Students className="w-4 h-4" />
                          {classData.enrollment_count}
                        </div>
                      )}
                    </div>

                    {/* Class Details */}
                    <div className="space-y-3 mb-6 flex-grow">
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
                          <Icons.Teachers className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {classData.teacher?.full_name || 'Chưa được giao'}
                          </p>
                          {classData.teacher?.email && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {classData.teacher.email}
                            </p>
                          )}
                        </div>
                      </div>

                      {classData.schedule && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="p-1.5 bg-green-100 rounded-lg">
                            <Icons.Attendance className="w-4 h-4 text-green-600" />
                          </div>
                          <p className="text-sm text-gray-900 font-medium">{classData.schedule}</p>
                        </div>
                      )}

                      {classData.room && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="p-1.5 bg-purple-100 rounded-lg">
                            <span className="text-purple-600 text-sm">📍</span>
                          </div>
                          <p className="text-sm text-gray-900 font-medium">{classData.room}</p>
                        </div>
                      )}

                      {classData.description && (
                        <p className="text-sm text-gray-600 mt-3 line-clamp-2 italic">
                          {classData.description}
                        </p>
                      )}

                      <p className="text-xs text-gray-500 mt-3 flex items-center gap-2">
                        <Icons.Calendar className="w-4 h-4" />
                        <span>Được tạo: {new Date(classData.created_at).toLocaleDateString('vi-VN')}</span>
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      <Link href={`/dashboard/classes/${classData.id}`} className="flex-1">
                        <Button variant="outline" fullWidth size="sm" className="font-semibold hover:bg-gray-50">
                          Xem chi tiết
                        </Button>
                      </Link>
                      {canEnrollStudents && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleEnrollClick(classData)}
                          className="px-6 font-semibold"
                        >
                          Đăng ký
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enrollment Modal */}
        <Modal
          isOpen={showEnrollModal}
          onClose={() => {
            setShowEnrollModal(false);
            setSelectedClass(null);
            setSelectedStudentId("");
          }}
          title={`Đăng ký vào ${selectedClass?.name || 'Lớp học'}`}
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Thông tin lớp học</h3>
              <div className="space-y-1 text-sm text-blue-800">
                <p><strong>Mã lớp:</strong> {selectedClass?.code}</p>
                <p><strong>Giáo viên:</strong> {selectedClass?.teacher?.full_name || 'Chưa được giao'}</p>
                {selectedClass?.schedule && (
                  <p><strong>Lịch học:</strong> {selectedClass.schedule}</p>
                )}
                {selectedClass?.room && (
                  <p><strong>Phòng:</strong> {selectedClass.room}</p>
                )}
                {selectedClass?.enrollment_count !== undefined && (
                  <p><strong>Sĩ số hiện tại:</strong> {selectedClass.enrollment_count}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn học sinh để đăng ký
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Chọn học sinh --</option>
                {availableStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} ({student.email || 'Không có email'})
                  </option>
                ))}
              </select>
              {availableStudents.length === 0 && (
                <p className="text-sm text-slate-600 mt-2">
                  Không có học sinh khả dụng hoặc tất cả học sinh đã đăng ký.
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEnrollModal(false);
                  setSelectedClass(null);
                  setSelectedStudentId("");
                }}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleEnrollStudent}
                disabled={!selectedStudentId || enrolling}
                isLoading={enrolling}
              >
                Đăng ký học sinh
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
