"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { Card, LoadingState, Badge, Button } from "@/components/ui";
import { Icons } from "@/components/ui/Icons";

interface ClassDetail {
  id: string;
  name: string;
  code: string;
  description?: string;
  schedule?: string;
  room?: string;
  created_at: string;
  teacher?: {
    id: string;
    full_name: string;
    email: string;
  };
  enrollment_count?: number;
  students?: Array<{
    id: string;
    full_name: string;
    email: string;
    student_code?: string;
  }>;
}

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClassDetail = async () => {
      try {
        setLoading(true);
        const response = await apiFetch(`/api/admin/classes/${classId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Class not found");
            return;
          }
          throw new Error("Failed to fetch class details");
        }

        const data = await response.json();
        setClassData(data.class || data.data || data);
      } catch (err: any) {
        console.error("[ClassDetail] Error:", err);
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchClassDetail();
    }
  }, [classId]);

  if (loading) {
    return <LoadingState message="Loading class details..." />;
  }

  if (error || !classData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <Icons.Classes className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error === "Class not found" ? "Class Not Found" : "Error Loading Class"}
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "Unable to load class details. Please try again."}
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.back()} variant="outline">
              Go Back
            </Button>
            <Link href="/dashboard/classes">
              <Button>View All Classes</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{classData.name}</h1>
            <Badge variant="info">{classData.code}</Badge>
          </div>
          <p className="text-gray-600">Class Details & Enrollment</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.back()} variant="outline">
            Back
          </Button>
          <Link href={`/dashboard/classes/${classId}/edit`}>
            <Button>Edit Class</Button>
          </Link>
        </div>
      </div>

      {/* Class Information Card */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Class Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-600">Class Name</label>
            <p className="text-lg text-gray-900 mt-1">{classData.name}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Class Code</label>
            <p className="text-lg text-gray-900 mt-1">{classData.code}</p>
          </div>

          {classData.description && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-600">Description</label>
              <p className="text-gray-900 mt-1">{classData.description}</p>
            </div>
          )}

          {classData.schedule && (
            <div>
              <label className="text-sm font-medium text-gray-600">Schedule</label>
              <p className="text-gray-900 mt-1">{classData.schedule}</p>
            </div>
          )}

          {classData.room && (
            <div>
              <label className="text-sm font-medium text-gray-600">Room</label>
              <p className="text-gray-900 mt-1">{classData.room}</p>
            </div>
          )}

          {classData.teacher && (
            <div>
              <label className="text-sm font-medium text-gray-600">Teacher</label>
              <p className="text-gray-900 mt-1">{classData.teacher.full_name}</p>
              <p className="text-sm text-gray-600">{classData.teacher.email}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-600">Total Students</label>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {classData.enrollment_count || classData.students?.length || 0}
            </p>
          </div>
        </div>
      </Card>

      {/* Students List */}
      {classData.students && classData.students.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Enrolled Students</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Code
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classData.students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{student.student_code || "—"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/students/${student.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href={`/dashboard/attendance/mark?class=${classId}`}>
            <button className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left">
              <Icons.Attendance className="w-6 h-6 text-green-600 mb-2" />
              <div className="font-semibold text-gray-900">Take Attendance</div>
              <div className="text-sm text-gray-600">Mark attendance for this class</div>
            </button>
          </Link>

          <Link href={`/dashboard/grades/entry?class=${classId}`}>
            <button className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-left">
              <Icons.Grades className="w-6 h-6 text-orange-600 mb-2" />
              <div className="font-semibold text-gray-900">Enter Grades</div>
              <div className="text-sm text-gray-600">Grade assignments for students</div>
            </button>
          </Link>

          <Link href={`/dashboard/grades/assignments?class=${classId}`}>
            <button className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all text-left">
              <Icons.Assignments className="w-6 h-6 text-teal-600 mb-2" />
              <div className="font-semibold text-gray-900">Manage Assignments</div>
              <div className="text-sm text-gray-600">Create and edit assignments</div>
            </button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
