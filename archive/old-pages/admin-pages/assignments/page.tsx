'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProfile } from '@/hooks/useProfile';
import { showToast } from '@/components/ToastProvider';
import { apiFetch } from '@/lib/api/client';

interface Assignment {
  id: string;
  class_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  due_date: string;
  max_points: number;
  created_at: string;
  class?: {
    name: string;
  };
  category?: {
    name: string;
  };
}

export default function AdminAssignmentsPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('');

  useEffect(() => {
    if (profileLoading || !profile) return;
    if (profile.role !== 'admin' && profile.role !== 'teacher') {
      showToast.error('Access denied');
      return;
    }
    fetchAssignments();
  }, [profile, profileLoading, classFilter]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (classFilter) params.class_id = classFilter;

      const result = await api.assignments.list(params);
      console.log('[Assignments] Fetched', result.length, 'assignments');
      setAssignments(result);
    } catch (error) {
      console.error('[Assignments] Fetch error:', error);
      showToast.error('Failed to load assignments');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (dueDate: string): boolean => {
    return new Date(dueDate) < new Date();
  };

  if (profileLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading assignments...</p>
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
        <h1 className="text-2xl font-bold mb-4">Assignments Management</h1>
        
        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Link
            href="/dashboard/admin/assignments/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
          >
            ➁ECreate Assignment
          </Link>
        </div>

        <div className="text-sm text-gray-600 mb-2">
          Showing {assignments.length} assignment(s)
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg">No assignments found</p>
          <p className="text-gray-400 text-sm mt-2">
            Create your first assignment to get started
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Class</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Points</th>
                <th className="p-3 text-left">Due Date</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignments.map((assignment) => {
                const overdue = isOverdue(assignment.due_date);
                
                return (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <Link 
                        href={`/dashboard/admin/assignments/${assignment.id}`}
                        className="text-blue-700 hover:underline font-medium"
                      >
                        {assignment.title}
                      </Link>
                      {assignment.description && (
                        <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                          {assignment.description}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-gray-600">
                      {assignment.class?.name || 'Unknown'}
                    </td>
                    <td className="p-3 text-gray-600">
                      {assignment.category?.name || '-'}
                    </td>
                    <td className="p-3 text-gray-900 font-medium">
                      {assignment.max_points}
                    </td>
                    <td className="p-3">
                      <div className={overdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                        {new Date(assignment.due_date).toLocaleDateString()}
                      </div>
                      {overdue && (
                        <span className="text-xs text-red-500">Overdue</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/admin/assignments/${assignment.id}/edit`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/dashboard/admin/assignments/${assignment.id}`}
                          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
