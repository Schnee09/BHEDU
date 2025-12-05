'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProfile } from '@/hooks/useProfile';
import { showToast } from '@/components/ToastProvider';
import { apiFetch } from '@/lib/api/client';

interface Grade {
  id: string;
  assignment_id: string;
  student_id: string;
  score: number;
  feedback: string | null;
  graded_at: string;
  graded_by: string | null;
  created_at: string;
  assignment?: {
    title: string;
    max_points: number;
    class_id: string;
  };
  student?: {
    full_name: string;
  };
}

export default function AdminGradesPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  useEffect(() => {
    if (profileLoading || !profile) return;
    if (profile.role !== 'admin' && profile.role !== 'teacher') {
      showToast.error('Access denied');
      return;
    }
    fetchGrades();
  }, [profile, profileLoading, studentSearch, classFilter]);

  const fetchGrades = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (studentSearch.trim()) params.student_id = studentSearch.trim();
      if (classFilter) params.class_id = classFilter;

      const result = await api.grades.list(params);
      console.log('[Grades] Fetched', result.length, 'grades');
      setGrades(result);
    } catch (error) {
      console.error('[Grades] Fetch error:', error);
      showToast.error('Failed to load grades');
      setGrades([]);
    } finally {
      setLoading(false);
    }
  };

  const getLetterGrade = (score: number, maxPoints: number): string => {
    const percentage = (score / maxPoints) * 100;
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const getGradeColor = (score: number, maxPoints: number): string => {
    const percentage = (score / maxPoints) * 100;
    if (percentage >= 90) return 'bg-green-100 text-green-800';
    if (percentage >= 80) return 'bg-blue-100 text-blue-800';
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800';
    if (percentage >= 60) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  if (profileLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading grades...</p>
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
        <h1 className="text-2xl font-bold mb-4">Grades Management</h1>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex-1 min-w-[200px] max-w-md">
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Search by student..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <Link
            href="/dashboard/admin/grades/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
          >
            ➁EAdd Grade
          </Link>
        </div>

        <div className="text-sm text-gray-600 mb-2">
          Showing {grades.length} grade(s)
        </div>
      </div>

      {grades.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg">No grades found</p>
          <p className="text-gray-400 text-sm mt-2">
            Grades will appear here once assignments are graded
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Student</th>
                <th className="p-3 text-left">Assignment</th>
                <th className="p-3 text-left">Score</th>
                <th className="p-3 text-left">Grade</th>
                <th className="p-3 text-left">Graded</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {grades.map((grade) => {
                const maxPoints = grade.assignment?.max_points || 100;
                const percentage = ((grade.score / maxPoints) * 100).toFixed(1);
                const letterGrade = getLetterGrade(grade.score, maxPoints);
                const gradeColor = getGradeColor(grade.score, maxPoints);

                return (
                  <tr key={grade.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium text-gray-900">
                        {grade.student?.full_name || 'Unknown Student'}
                      </div>
                    </td>
                    <td className="p-3 text-gray-600">
                      {grade.assignment?.title || 'Unknown Assignment'}
                    </td>
                    <td className="p-3">
                      <div className="text-gray-900 font-medium">
                        {grade.score} / {maxPoints}
                      </div>
                      <div className="text-xs text-gray-500">
                        {percentage}%
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${gradeColor}`}>
                        {letterGrade}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600 text-sm">
                      {new Date(grade.graded_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/admin/grades/${grade.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </Link>
                        {grade.feedback && (
                          <span className="text-xs text-gray-400">💬</span>
                        )}
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
