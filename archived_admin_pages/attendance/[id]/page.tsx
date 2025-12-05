/**
 * Admin Attendance Record Detail Page
 * 
 * Features:
 * - View attendance record details
 * - Student and class information
 * - Edit attendance status
 * - Add notes
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { Card, LoadingState, Badge, Button } from "@/components/ui";

interface AttendanceDetail {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  created_at: string;
  student?: {
    id: string;
    full_name: string;
    email: string;
    student_code?: string;
  };
  class?: {
    id: string;
    name: string;
    teacher?: {
      full_name: string;
    };
  };
}

export default function AdminAttendanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const attendanceId = params.id as string;

  const [attendance, setAttendance] = useState<AttendanceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    status: 'present' as 'present' | 'absent' | 'late' | 'excused',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiFetch(`/api/admin/attendance/${attendanceId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch attendance record');
        }
        
        // API returns { success: true, record: {...} }
        const record = data.record || data.attendance || data.data || data;
        setAttendance(record);
        setEditData({
          status: record.status,
          notes: record.notes || '',
        });
      } catch (err) {
        console.error('Error fetching attendance:', err);
        setError(err instanceof Error ? err.message : 'Failed to load attendance record');
      } finally {
        setLoading(false);
      }
    };

    if (attendanceId) {
      fetchAttendance();
    }
  }, [attendanceId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await apiFetch(`/api/admin/attendance/${attendanceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update attendance');
      }

      const data = await response.json();
      // API returns { success: true, record: {...} }
      const updatedRecord = data.record || data.attendance || data.data || data;
      setAttendance(updatedRecord);
      setEditing(false);
    } catch (err) {
      console.error('Error updating attendance:', err);
      alert(err instanceof Error ? err.message : 'Failed to update attendance');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading attendance record..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <span className="text-6xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Record</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  if (!attendance) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <div className="text-gray-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Record Not Found</h2>
          <p className="text-gray-600 mb-4">The attendance record you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/dashboard/admin/attendance')} variant="primary">
            Back to Attendance
          </Button>
        </Card>
      </div>
    );
  }

  const statusColors = {
    present: 'success',
    absent: 'danger',
    late: 'warning',
    excused: 'info',
  } as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      <div className="container mx-auto px-4 py-8 max-w-[1200px]">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Link href="/dashboard" className="hover:text-green-600">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/admin/attendance" className="hover:text-green-600">Attendance</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Record Details</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Attendance Record</h1>
              <p className="text-gray-600 mt-1">
                {new Date(attendance.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="flex gap-3">
              {!editing ? (
                <Button variant="primary" size="sm" onClick={() => setEditing(true)}>
                  <span className="mr-2">✏️</span>
                  Edit Record
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(false);
                      setEditData({
                        status: attendance.status,
                        notes: attendance.notes || '',
                      });
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Student & Class Info */}
          <div className="space-y-6">
            {/* Student Information */}
            <Card>
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h2 className="text-xl font-bold text-gray-900">Student Information</h2>
              </div>
              {attendance.student ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Student Name</p>
                    <Link
                      href={`/dashboard/students/${attendance.student.id}`}
                      className="font-medium text-lg text-blue-600 hover:text-blue-800"
                    >
                      {attendance.student.full_name}
                    </Link>
                  </div>
                  {attendance.student.student_code && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Student Code</p>
                      <p className="font-medium text-gray-900">{attendance.student.student_code}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="font-medium text-gray-900">{attendance.student.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">Student information not available</p>
              )}
            </Card>

            {/* Class Information */}
            <Card>
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h2 className="text-xl font-bold text-gray-900">Class Information</h2>
              </div>
              {attendance.class ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Class Name</p>
                    <Link
                      href={`/dashboard/admin/classes/${attendance.class.id}`}
                      className="font-medium text-lg text-blue-600 hover:text-blue-800"
                    >
                      {attendance.class.name}
                    </Link>
                  </div>
                  {attendance.class.teacher && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Teacher</p>
                      <p className="font-medium text-gray-900">{attendance.class.teacher.full_name}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">Class information not available</p>
              )}
            </Card>
          </div>

          {/* Right Column - Attendance Details */}
          <div className="space-y-6">
            {/* Attendance Status */}
            <Card>
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h2 className="text-xl font-bold text-gray-900">Attendance Status</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(attendance.date).toLocaleDateString()}
                  </p>
                </div>
                
                {editing ? (
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">Status</label>
                    <select
                      value={editData.status}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                      <option value="excused">Excused</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Status</p>
                    <Badge variant={statusColors[attendance.status]} className="text-lg px-4 py-2">
                      {attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)}
                    </Badge>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 mb-1">Recorded At</p>
                  <p className="font-medium text-gray-900">
                    {new Date(attendance.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            {/* Notes */}
            <Card>
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h2 className="text-xl font-bold text-gray-900">Notes</h2>
              </div>
              {editing ? (
                <textarea
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  placeholder="Add notes about this attendance record..."
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              ) : (
                <div>
                  {attendance.notes ? (
                    <p className="text-gray-900 whitespace-pre-wrap">{attendance.notes}</p>
                  ) : (
                    <p className="text-gray-600 italic">No notes added</p>
                  )}
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card>
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
              </div>
              <div className="space-y-3">
                {attendance.student && (
                  <Link href={`/dashboard/students/${attendance.student.id}`}>
                    <Button variant="outline" fullWidth size="sm">
                      <span className="mr-2">👤</span>
                      View Student Profile
                    </Button>
                  </Link>
                )}
                {attendance.class && (
                  <Link href={`/dashboard/admin/classes/${attendance.class.id}`}>
                    <Button variant="outline" fullWidth size="sm">
                      <span className="mr-2">📚</span>
                      View Class Details
                    </Button>
                  </Link>
                )}
                <Link href={`/dashboard/admin/attendance?class=${attendance.class_id}`}>
                  <Button variant="outline" fullWidth size="sm">
                    <span className="mr-2">📋</span>
                    View Class Attendance
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
