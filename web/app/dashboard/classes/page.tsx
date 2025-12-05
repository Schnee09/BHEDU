/**
 * Classes Page - Refactored with Modern Components
 * 
 * Features:
 * - Uses useFetch hook for data loading
 * - Card components for class display
 * - Modal for enrollment
 * - Statistics dashboard
 * - Better visual design
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useFetch, useToast } from "@/hooks";
import { 
  Button, 
  Card, 
  Badge,
  LoadingState,
  EmptyState,
  Modal,
} from "@/components/ui";
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
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  
  // Fetch classes with statistics (use admin route to bypass RLS)
  const { data, loading, error, refetch } = useFetch<{
    classes?: ClassData[];
    data?: ClassData[];
    statistics?: ClassStats;
  }>('/api/admin/classes');
  
  // Handle success
  useEffect(() => {
    if (data) {
      const classesArray = data.classes || data.data || [];
      logger.info('Classes loaded', { count: classesArray.length });
    }
  }, [data]);
  
  // Handle error
  useEffect(() => {
    if (error) {
      toast.error('Failed to load classes', error);
      logger.error('Classes fetch error', new Error(error));
    }
  }, [error, toast]);
  
  const classes = data?.classes || data?.data || [];
  const statistics = data?.statistics;
  
  const handleEnrollClick = (classData: ClassData) => {
    setSelectedClass(classData);
    setShowEnrollModal(true);
  };
  
  if (loading) {
    return <LoadingState message="Loading classes..." />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Toast Container */}
        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Classes</h1>
          <p className="text-lg text-gray-600">
            Manage your classes and enrollments
          </p>
        </div>
        
        {/* Statistics Dashboard with Gradients */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card padding="md" className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">Total Classes</p>
                  <p className="text-4xl font-bold text-blue-900">
                    {statistics.total_classes}
                  </p>
                </div>
                <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-3xl">📚</span>
                </div>
              </div>
            </Card>
            
            <Card padding="md" className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">Total Students</p>
                  <p className="text-4xl font-bold text-green-900">
                    {statistics.total_students}
                  </p>
                </div>
                <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-3xl">👥</span>
                </div>
              </div>
            </Card>
            
            <Card padding="md" className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 mb-1">Avg. Enrollment</p>
                  <p className="text-4xl font-bold text-purple-900">
                    {statistics.average_enrollment.toFixed(1)}
                  </p>
                </div>
                <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-3xl">📊</span>
                </div>
              </div>
            </Card>
            
            <Card padding="md" className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700 mb-1">Teachers</p>
                  <p className="text-4xl font-bold text-amber-900">
                    {Object.keys(statistics.by_teacher || {}).length}
                  </p>
                </div>
                <div className="w-14 h-14 bg-amber-100 rounded-lg flex items-center justify-center">
                  <span className="text-3xl">👨‍🏫</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      
      {/* Error State */}
      {error && (
        <Card className="mb-6 border-red-500">
          <div className="text-red-600">
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
          icon={<span className="text-6xl">📚</span>}
          title="No classes found"
          description="No classes have been created yet"
        />
      )}
      
      {/* Classes Grid */}
      {classes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classData) => (
            <Card 
              key={classData.id}
              padding="lg"
              className="hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-white"
            >
              <div className="flex flex-col h-full">
                {/* Class Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="font-bold text-xl text-gray-900 mb-2 leading-tight">
                      {classData.name}
                    </h2>
                    <Badge variant="info" className="text-xs font-medium">
                      {classData.code}
                    </Badge>
                  </div>
                  {classData.enrollment_count !== undefined && (
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-800 rounded-full px-4 py-2 text-sm font-bold shadow-sm">
                      {classData.enrollment_count} 👥
                    </div>
                  )}
                </div>
                
                {/* Class Details */}
                <div className="space-y-3 mb-4 flex-grow">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-400 text-lg">👨‍🏫</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {classData.teacher?.full_name || 'Not assigned'}
                      </p>
                      {classData.teacher?.email && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {classData.teacher.email}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {classData.schedule && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <span className="text-blue-500 text-lg">🕐</span>
                      <p className="text-sm text-blue-900 font-medium">{classData.schedule}</p>
                    </div>
                  )}
                  
                  {classData.room && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <span className="text-green-500 text-lg">📍</span>
                      <p className="text-sm text-green-900 font-medium">{classData.room}</p>
                    </div>
                  )}
                  
                  {classData.description && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2 italic">
                      {classData.description}
                    </p>
                  )}
                  
                  <p className="text-xs text-gray-400 mt-3 flex items-center gap-2">
                    <span>📅</span>
                    <span>Created: {new Date(classData.created_at).toLocaleDateString()}</span>
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t-2 border-gray-100">
                  <Link href={`/dashboard/classes/${classData.id}`} className="flex-1">
                    <Button variant="outline" fullWidth size="sm" className="font-semibold">
                      View Details
                    </Button>
                  </Link>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => handleEnrollClick(classData)}
                    className="px-6 font-semibold"
                  >
                    Enroll
                  </Button>
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
          
          <div className="text-sm text-gray-600">
            <p>
              Enrollment functionality will be implemented soon. 
              This will allow you to:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Enroll students in the class</li>
              <li>Set enrollment start date</li>
              <li>Add student to gradebook</li>
              <li>Send welcome notification</li>
            </ul>
          </div>
          
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setShowEnrollModal(false);
                setSelectedClass(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                toast.info('Coming Soon', 'Enrollment feature will be available soon');
                setShowEnrollModal(false);
                setSelectedClass(null);
              }}
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
