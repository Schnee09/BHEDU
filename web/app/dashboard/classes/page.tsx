/**
 * Classes Page - Refactored with Modern Components
 * 
 * Features:
 * - Role-aware: Admin/Staff see all, Teachers see their own classes
 * - Uses useFetch hook for data loading
 * - Card components for class display
 * - Modal for enrollment (admin/staff only)
 * - Statistics dashboard
 * - Better visual design
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useFetch, useToast } from "@/hooks";
import { useProfile } from "@/hooks/useProfile";
import { apiFetch } from "@/lib/api/client";
import { 
  Button, 
  Card, 
  Badge,
  EmptyState,
  Modal,
} from "@/components/ui";
import { StatCard } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { PageHeader } from "@/components/Breadcrumb";
import { CardGridSkeleton } from "@/components/EmptyState";
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
  const { profile, loading: profileLoading } = useProfile();
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<{id: string; full_name: string; email: string}[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [enrolling, setEnrolling] = useState(false);
  
  // Determine API endpoint based on role - only when profile is loaded
  const isAdminOrStaff = profile?.role === 'admin' || profile?.role === 'staff';
  const _isTeacher = profile?.role === 'teacher';
  const isStudent = profile?.role === 'student';
  
  // Choose correct endpoint: admin sees all, teachers see their classes, students see enrolled classes
  // Use null to prevent fetching until profile is loaded
  const apiEndpoint = !profile 
    ? null 
    : isAdminOrStaff 
      ? '/api/classes' 
      : isStudent 
        ? '/api/student/classes'
        : '/api/classes/my-classes';
  
  // Fetch classes - admin/staff see all, teachers see their own, students see enrolled
  // Only fetch when apiEndpoint is not null (profile is loaded)
  const { data, loading, error, refetch } = useFetch<{
    classes?: ClassData[];
    data?: ClassData[];
    statistics?: ClassStats;
  }>(apiEndpoint);
  
  // Handle success
  useEffect(() => {
    if (data) {
      const classesArray = data.classes || data.data || [];
      logger.info('Classes loaded', { count: classesArray.length, role: profile?.role });
    }
  }, [data, profile?.role]);
  
  // Handle error
  useEffect(() => {
    if (error) {
      // Show user-friendly rate limit message
      if (error.includes('Rate limit exceeded')) {
        toast.warning('Please Wait', 'Too many requests. Please wait a moment before trying again.');
      } else {
        toast.error('Failed to load classes', error);
        logger.error('Classes fetch error', new Error(error));
      }
    }
  }, [error, toast]);
  
  const classes = data?.classes || data?.data || [];
  const statistics = data?.statistics;
  
  const handleEnrollClick = async (classData: ClassData) => {
    if (!isAdminOrStaff) {
      toast.warning('Not Allowed', 'Only admins and staff can enroll students');
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
        throw new Error('Failed to fetch enrollment data');
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
      console.error('Error fetching students:', err);
      toast.error('Error', 'Failed to load available students');
    }
  };
  
  const handleEnrollStudent = async () => {
    if (!selectedClass || !selectedStudentId) {
      toast.warning('Selection Required', 'Please select a student to enroll');
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
        throw new Error(errorData.error || 'Failed to enroll student');
      }
      
      toast.success('Enrollment Success', 'Student has been enrolled in the class');
      setShowEnrollModal(false);
      setSelectedClass(null);
      setSelectedStudentId("");
      refetch(); // Refresh class list to update enrollment counts
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Enrollment failed';
      toast.error('Error', message);
    } finally {
      setEnrolling(false);
    }
  };
  
  // Show loading while profile or data is loading
  if (profileLoading || loading || !profile) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            title="Classes"
            description="Loading classes..."
          />
          <CardGridSkeleton count={8} />
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Toast Container */}
        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
        
        {/* Header with Breadcrumb */}
        <PageHeader
          title={isAdminOrStaff ? "All Classes" : isStudent ? "My Enrolled Classes" : "My Classes"}
          description={isAdminOrStaff 
            ? "Manage all classes and enrollments" 
            : isStudent 
              ? "View your enrolled classes and progress"
              : "View and manage your assigned classes"}
          action={isAdminOrStaff ? (
            <Link href="/dashboard/classes">
              <Button variant="primary" leftIcon={<Icons.Add className="w-4 h-4" />}>
                Create Class
              </Button>
            </Link>
          ) : undefined}
        />
        
        {/* Statistics Dashboard */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Classes"
              value={statistics.total_classes}
              icon={<Icons.Classes className="w-6 h-6" />}
              color="blue"
            />
            <StatCard
              label="Total Students"
              value={statistics.total_students}
              icon={<Icons.Students className="w-6 h-6" />}
              color="green"
            />
            <StatCard
              label="Avg. Enrollment"
              value={statistics.average_enrollment.toFixed(1)}
              icon={<Icons.Chart className="w-6 h-6" />}
              color="purple"
            />
            <StatCard
              label="Teachers"
              value={Object.keys(statistics.by_teacher || {}).length}
              icon={<Icons.Teachers className="w-6 h-6" />}
              color="orange"
            />
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
          title={isAdminOrStaff ? "No classes found" : isStudent ? "No enrolled classes" : "No classes assigned"}
          description={isAdminOrStaff 
            ? "No classes have been created yet" 
            : isStudent
              ? "You are not enrolled in any classes yet. Contact an administrator to get enrolled."
              : "You don't have any classes assigned to you yet. Contact an administrator to get assigned to a class."
          }
        />
      )}
      
      {/* Classes Grid */}
      {classes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((classData) => (
            <Card 
              key={classData.id}
              className="p-6 hover:border-stone-300 transition-colors duration-200 bg-white"
            >
              <div className="flex flex-col h-full">
                {/* Class Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="font-bold text-lg text-stone-900 mb-2 leading-tight">
                      {classData.name}
                    </h2>
                    <Badge variant="info" className="text-xs font-medium">
                      {classData.code}
                    </Badge>
                  </div>
                  {classData.enrollment_count !== undefined && (
                    <div className="flex items-center gap-1.5 bg-stone-100 text-stone-700 rounded-full px-3 py-1.5 text-sm font-semibold">
                      <Icons.Students className="w-4 h-4" />
                      {classData.enrollment_count}
                    </div>
                  )}
                </div>
                
                {/* Class Details */}
                <div className="space-y-2 mb-4 flex-grow">
                  <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
                    <Icons.Teachers className="w-5 h-5 text-stone-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-stone-900">
                        {classData.teacher?.full_name || 'Not assigned'}
                      </p>
                      {classData.teacher?.email && (
                        <p className="text-xs text-stone-500 mt-0.5">
                          {classData.teacher.email}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {classData.schedule && (
                    <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
                      <Icons.Attendance className="w-5 h-5 text-stone-500" />
                      <p className="text-sm text-stone-900 font-medium">{classData.schedule}</p>
                    </div>
                  )}
                  
                  {classData.room && (
                    <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                      <span className="text-stone-500 text-lg">📍</span>
                      <p className="text-sm text-stone-900 font-medium">{classData.room}</p>
                    </div>
                  )}
                  
                  {classData.description && (
                    <p className="text-sm text-stone-600 mt-3 line-clamp-2 italic">
                      {classData.description}
                    </p>
                  )}
                  
                  <p className="text-xs text-stone-500 mt-3 flex items-center gap-2">
                    <Icons.Calendar className="w-4 h-4" />
                    <span>Created: {new Date(classData.created_at).toLocaleDateString()}</span>
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t-2 border-stone-100">
                  <Link href={`/dashboard/classes/${classData.id}`} className="flex-1">
                    <Button variant="outline" fullWidth size="sm" className="font-semibold">
                      View Details
                    </Button>
                  </Link>
                  {isAdminOrStaff && (
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => handleEnrollClick(classData)}
                      className="px-6 font-semibold"
                    >
                      Enroll
                    </Button>
                  )}
                </div>
              </div>
            </Card>
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
        title={`Enroll in ${selectedClass?.name || 'Class'}`}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Class Information</h3>
            <div className="space-y-1 text-sm text-blue-800">
              <p><strong>Code:</strong> {selectedClass?.code}</p>
              <p><strong>Teacher:</strong> {selectedClass?.teacher?.full_name || 'Not assigned'}</p>
              {selectedClass?.schedule && (
                <p><strong>Schedule:</strong> {selectedClass.schedule}</p>
              )}
              {selectedClass?.room && (
                <p><strong>Room:</strong> {selectedClass.room}</p>
              )}
              {selectedClass?.enrollment_count !== undefined && (
                <p><strong>Current Students:</strong> {selectedClass.enrollment_count}</p>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Student to Enroll
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select a student --</option>
              {availableStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.full_name} ({student.email || 'No email'})
                </option>
              ))}
            </select>
            {availableStudents.length === 0 && (
              <p className="text-sm text-slate-600 mt-2">
                No available students or all students are already enrolled.
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
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEnrollStudent}
              disabled={!selectedStudentId || enrolling}
              isLoading={enrolling}
            >
              Enroll Student
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
}
