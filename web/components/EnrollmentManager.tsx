"use client";

import { useState, useEffect } from "react";
import { apiFetch } from '@/lib/api/client';
import { showToast } from "@/components/ToastProvider";

interface Class {
  id: string;
  name: string;
  code: string;
  schedule?: string;
  teacher_name?: string;
  capacity?: number;
  enrolled_count?: number;
}

interface Enrollment {
  id: string;
  class_id: string;
  class_name: string;
  class_code: string;
  schedule?: string;
  teacher_name?: string;
  enrollment_date: string;
  status: string;
}

interface EnrollmentManagerProps {
  studentId: string;
}

export default function EnrollmentManager({ studentId }: EnrollmentManagerProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [scheduleConflicts, setScheduleConflicts] = useState<string[]>([]);
  const [processingEnrollment, setProcessingEnrollment] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [enrollmentsRes, classesRes] = await Promise.all([
        apiFetch(`/api/admin/students/${studentId}/enrollments`),
        apiFetch("/api/admin/classes?status=active"),
      ]);

      if (enrollmentsRes.ok && classesRes.ok) {
        const enrollmentsData = await enrollmentsRes.json();
        const classesData = await classesRes.json();

        setEnrollments(enrollmentsData.enrollments || []);
        
        // Filter out classes the student is already enrolled in
        const enrolledClassIds = new Set(enrollmentsData.enrollments?.map((e: Enrollment) => e.class_id) || []);
        const available = classesData.classes?.filter((c: Class) => !enrolledClassIds.has(c.id)) || [];
        setAvailableClasses(available);
      }
    } catch (error) {
      console.error("Error fetching enrollment data:", error);
      showToast.error("Failed to load enrollment data");
    } finally {
      setLoading(false);
    }
  };

  const checkScheduleConflict = (newSchedule?: string) => {
    if (!newSchedule) return [];

    const conflicts: string[] = [];
    enrollments.forEach((enrollment) => {
      if (enrollment.schedule && hasTimeOverlap(enrollment.schedule, newSchedule)) {
        conflicts.push(`${enrollment.class_name} (${enrollment.schedule})`);
      }
    });
    return conflicts;
  };

  const hasTimeOverlap = (schedule1: string, schedule2: string): boolean => {
    // Simple schedule conflict detection
    // Format expected: "Mon/Wed 10:00-11:30" or "Tue/Thu 14:00-15:30"
    const days1 = schedule1.split(" ")[0]?.toLowerCase() || "";
    const days2 = schedule2.split(" ")[0]?.toLowerCase() || "";
    
    // Check if any day overlaps
    const dayAbbrevs = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const hasDayOverlap = dayAbbrevs.some(day => 
      days1.includes(day) && days2.includes(day)
    );

    if (!hasDayOverlap) return false;

    // If days overlap, check time ranges
    const time1 = schedule1.split(" ")[1];
    const time2 = schedule2.split(" ")[1];
    if (!time1 || !time2) return false;

    const [start1, end1] = time1.split("-");
    const [start2, end2] = time2.split("-");
    if (!start1 || !end1 || !start2 || !end2) return false;

    // Convert to minutes for easier comparison
    const toMinutes = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      return (hours || 0) * 60 + (minutes || 0);
    };

    const s1 = toMinutes(start1);
    const e1 = toMinutes(end1);
    const s2 = toMinutes(start2);
    const e2 = toMinutes(end2);

    // Check if time ranges overlap
    return (s1 < e2 && s2 < e1);
  };

  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
    const selectedClass = availableClasses.find(c => c.id === classId);
    const conflicts = checkScheduleConflict(selectedClass?.schedule);
    setScheduleConflicts(conflicts);
  };

  const handleAddEnrollment = async () => {
    if (!selectedClassId) {
      showToast.error("Please select a class");
      return;
    }

    if (scheduleConflicts.length > 0) {
      const confirmed = window.confirm(
        `This class has a schedule conflict with:\n${scheduleConflicts.join("\n")}\n\nEnroll anyway?`
      );
      if (!confirmed) return;
    }

    const selectedClass = availableClasses.find(c => c.id === selectedClassId);
    if (selectedClass?.capacity && selectedClass?.enrolled_count && 
        selectedClass.enrolled_count >= selectedClass.capacity) {
      const confirmed = window.confirm(
        `This class is at full capacity (${selectedClass.capacity} students).\n\nEnroll anyway?`
      );
      if (!confirmed) return;
    }

    const toastId = showToast.loading("Enrolling student...");
    setProcessingEnrollment(selectedClassId);

    try {
      const response = await apiFetch("/api/admin/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          class_id: selectedClassId,
        }),
      });

      if (response.ok) {
        showToast.dismiss(toastId);
        showToast.success("Student enrolled successfully");
        setSelectedClassId("");
        setScheduleConflicts([]);
        setShowAddDropdown(false);
        await fetchData(); // Refresh data
      } else {
        const error = await response.json();
        showToast.dismiss(toastId);
        showToast.error(error.error || "Failed to enroll student");
      }
    } catch (error) {
      console.error("Error enrolling student:", error);
      showToast.dismiss(toastId);
      showToast.error("An error occurred while enrolling");
    } finally {
      setProcessingEnrollment(null);
    }
  };

  const handleRemoveEnrollment = async (enrollmentId: string, className: string) => {
    const confirmed = window.confirm(
      `Remove student from "${className}"?\n\nThis will set the enrollment status to inactive.`
    );
    if (!confirmed) return;

    const toastId = showToast.loading("Removing enrollment...");
    setProcessingEnrollment(enrollmentId);

    try {
      const response = await apiFetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showToast.dismiss(toastId);
        showToast.success("Enrollment removed successfully");
        await fetchData(); // Refresh data
      } else {
        const error = await response.json();
        showToast.dismiss(toastId);
        showToast.error(error.error || "Failed to remove enrollment");
      }
    } catch (error) {
      console.error("Error removing enrollment:", error);
      showToast.dismiss(toastId);
      showToast.error("An error occurred while removing enrollment");
    } finally {
      setProcessingEnrollment(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Enrollment Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Quick Enrollment</h3>
          {!showAddDropdown && (
            <button
              onClick={() => setShowAddDropdown(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              + Add Class
            </button>
          )}
        </div>

        {showAddDropdown && (
          <div className="space-y-4 rounded-lg bg-gray-50 p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => handleClassSelect(e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={processingEnrollment !== null}
              >
                <option value="">-- Choose a class --</option>
                {availableClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.code} - {cls.name}
                    {cls.schedule && ` (${cls.schedule})`}
                    {cls.capacity && ` - ${cls.enrolled_count || 0}/${cls.capacity} enrolled`}
                  </option>
                ))}
              </select>
              {availableClasses.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  No available classes. Student may already be enrolled in all active classes.
                </p>
              )}
            </div>

            {scheduleConflicts.length > 0 && (
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                <p className="text-sm font-medium text-yellow-800 mb-1">
                  ⚠️ Schedule Conflict Detected
                </p>
                <p className="text-sm text-yellow-700">
                  This class conflicts with: {scheduleConflicts.join(", ")}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleAddEnrollment}
                disabled={!selectedClassId || processingEnrollment !== null}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Enroll Student
              </button>
              <button
                onClick={() => {
                  setShowAddDropdown(false);
                  setSelectedClassId("");
                  setScheduleConflicts([]);
                }}
                disabled={processingEnrollment !== null}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Current Enrollments */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Current Enrollments ({enrollments.length})
        </h3>

        {enrollments.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">
            Student is not currently enrolled in any classes.
          </p>
        ) : (
          <div className="space-y-3">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {enrollment.class_code}
                    </span>
                    <span className="text-gray-600">-</span>
                    <span className="text-gray-900">{enrollment.class_name}</span>
                    {enrollment.status !== "active" && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {enrollment.status}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex gap-4 text-sm text-gray-500">
                    {enrollment.schedule && (
                      <span>📅 {enrollment.schedule}</span>
                    )}
                    {enrollment.teacher_name && (
                      <span>👤 {enrollment.teacher_name}</span>
                    )}
                    <span>Enrolled: {new Date(enrollment.enrollment_date).toLocaleDateString()}</span>
                  </div>
                </div>

                {enrollment.status === "active" && (
                  <button
                    onClick={() => handleRemoveEnrollment(enrollment.id, enrollment.class_name)}
                    disabled={processingEnrollment === enrollment.id}
                    className="ml-4 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingEnrollment === enrollment.id ? "Removing..." : "Remove"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
