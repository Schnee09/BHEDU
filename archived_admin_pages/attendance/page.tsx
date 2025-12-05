'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProfile } from '@/hooks/useProfile';
import { showToast } from '@/components/ToastProvider';
import { apiFetch } from '@/lib/api/client';

interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused' | 'half_day';
  check_in_time: string | null;
  check_out_time: string | null;
  notes: string | null;
  marked_by: string | null;
  created_at: string;
  student?: {
    full_name: string;
  };
  class?: {
    name: string;
  };
}

export default function AdminAttendancePage() {
  const { profile, loading: profileLoading } = useProfile();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (profileLoading || !profile) return;
    if (profile.role !== 'admin' && profile.role !== 'teacher') {
      showToast.error('Access denied');
      return;
    }
    fetchAttendance();
  }, [profile, profileLoading, dateFilter, statusFilter]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateFilter) params.date = dateFilter;
      if (statusFilter) params.status = statusFilter;

      const result = await api.attendance.list(params);
      console.log('[Attendance] Fetched', result.length, 'records');
      setRecords(result);
    } catch (error) {
      console.error('[Attendance] Fetch error:', error);
      showToast.error('Failed to load attendance');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'excused': return 'bg-blue-100 text-blue-800';
      case 'half_day': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (profileLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading attendance...</p>
      </div>
    );
  }

  if (profile?.role !== 'admin' && profile?.role !== 'teacher') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Access denied. Admin or Teacher only.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Attendance Management</h1>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Date:</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
              <option value="half_day">Half Day</option>
            </select>
          </div>

          <Link
            href="/dashboard/admin/attendance/mark"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
          >
            ✁EMark Attendance
          </Link>
        </div>

        <div className="text-sm text-gray-600 mb-2">
          Showing {records.length} record(s)
        </div>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg">No attendance records found</p>
          <p className="text-gray-400 text-sm mt-2">
            {dateFilter || statusFilter 
              ? 'Try adjusting your filters' 
              : 'Start marking attendance to see records here'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Student</th>
                <th className="p-3 text-left">Class</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Times</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="p-3 text-gray-900 font-medium">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-gray-600">
                    {record.student?.full_name || 'Unknown Student'}
                  </td>
                  <td className="p-3 text-gray-600">
                    {record.class?.name || 'Unknown Class'}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-600">
                    {record.check_in_time && (
                      <div>In: {new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    )}
                    {record.check_out_time && (
                      <div>Out: {new Date(record.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/admin/attendance/${record.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </Link>
                      {record.notes && (
                        <span className="text-xs text-gray-400" title={record.notes}>💬</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
