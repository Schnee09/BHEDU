'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  student_number: string;
}

interface Grade {
  id: string;
  score: number | null;
  submitted_at: string;
  graded_at: string | null;
  enrollment: {
    id: string;
    student: Student;
  };
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  type: string;
  max_points: number;
  due_date: string;
  published: boolean;
  created_at: string;
  class: {
    id: string;
    name: string;
    code: string;
    grade_level: string;
    academic_year: {
      id: string;
      year_name: string;
      status: string;
    };
    teacher: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  category: {
    id: string;
    name: string;
    weight: number;
  } | null;
  grades: Grade[];
  statistics: {
    total_submissions: number;
    graded_submissions: number;
    pending_submissions: number;
    average_score: number;
    max_points: number;
  };
}

export default function AssignmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions'>('overview');
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then(p => setResolvedParams(p));
  }, [params]);

  useEffect(() => {
    if (resolvedParams) {
      fetchAssignmentDetails();
    }
  }, [resolvedParams]);

  const fetchAssignmentDetails = async () => {
    if (!resolvedParams) return;
    
    try {
      setLoading(true);
      setError('');
      const response: any = await apiFetch(`/api/admin/assignments/${resolvedParams.id}`);
      if (response.success) {
        setAssignment(response.assignment);
      } else {
        setError(response.error || 'Failed to load assignment details');
      }
    } catch (err: unknown) {
      console.error('Error fetching assignment details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assignment details');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!assignment) return;

    try {
      const response: any = await apiFetch(`/api/admin/assignments/${assignment.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ published: !assignment.published })
      });

      if (response.success) {
        fetchAssignmentDetails();
      } else {
        alert(response.error || 'Failed to update assignment');
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      alert('An error occurred while updating the assignment');
    }
  };

  const handleDelete = async () => {
    if (!assignment) return;

    if (!confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      const response: any = await apiFetch(`/api/admin/assignments/${assignment.id}`, {
        method: 'DELETE'
      });

      if (response.success) {
        router.push('/dashboard/admin/assignments');
      } else {
        alert(response.error || 'Failed to delete assignment');
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('An error occurred while deleting the assignment');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Assignment not found'}
        </div>
        <button
          onClick={() => router.push('/dashboard/admin/assignments')}
          className="text-blue-600 hover:underline"
        >
          ← Back to Assignments
        </button>
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'homework': return 'bg-blue-100 text-blue-800';
      case 'quiz': return 'bg-purple-100 text-purple-800';
      case 'exam': return 'bg-red-100 text-red-800';
      case 'project': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number, maxPoints: number) => {
    const percentage = (score / maxPoints) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/admin/assignments')}
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Back to Assignments
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{assignment.title}</h1>
            <div className="flex items-center space-x-3 text-gray-600">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(assignment.type)}`}>
                {assignment.type}
              </span>
              <span>•</span>
              <span>{assignment.max_points} points</span>
              <span>•</span>
              <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              assignment.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {assignment.published ? 'Published' : 'Draft'}
            </span>
            <button
              onClick={handleTogglePublish}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              {assignment.published ? 'Unpublish' : 'Publish'}
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-2 font-medium ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`pb-4 px-2 font-medium ${
              activeTab === 'submissions'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Submissions ({assignment.statistics.total_submissions})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Statistics Cards */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Total Submissions</h3>
            <p className="text-3xl font-bold text-blue-600">{assignment.statistics.total_submissions}</p>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Graded</h3>
            <p className="text-3xl font-bold text-green-600">{assignment.statistics.graded_submissions}</p>
            <p className="text-sm text-gray-600 mt-1">
              {assignment.statistics.pending_submissions} pending
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Average Score</h3>
            <p className="text-3xl font-bold text-purple-600">
              {assignment.statistics.average_score.toFixed(1)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              out of {assignment.statistics.max_points}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Completion Rate</h3>
            <p className="text-3xl font-bold text-orange-600">
              {assignment.statistics.total_submissions > 0
                ? ((assignment.statistics.graded_submissions / assignment.statistics.total_submissions) * 100).toFixed(0)
                : 0}%
            </p>
          </div>

          {/* Class Information Card */}
          <div className="bg-white p-6 rounded-lg border lg:col-span-2">
            <h3 className="text-lg font-bold mb-4">Class Information</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Class</dt>
                <dd>
                  <a
                    href={`/dashboard/admin/classes/${assignment.class.id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {assignment.class.name} ({assignment.class.code})
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Grade Level</dt>
                <dd className="text-gray-900">{assignment.class.grade_level}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Teacher</dt>
                <dd>
                  <a
                    href={`/dashboard/admin/teachers/${assignment.class.teacher.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {assignment.class.teacher.first_name} {assignment.class.teacher.last_name}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Academic Year</dt>
                <dd className="text-gray-900">{assignment.class.academic_year.year_name}</dd>
              </div>
            </dl>
          </div>

          {/* Assignment Details Card */}
          <div className="bg-white p-6 rounded-lg border lg:col-span-2">
            <h3 className="text-lg font-bold mb-4">Assignment Details</h3>
            <dl className="space-y-3">
              {assignment.category && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Category</dt>
                  <dd className="text-gray-900">{assignment.category.name} ({assignment.category.weight}%)</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${getTypeColor(assignment.type)}`}>
                    {assignment.type}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="text-gray-900">{new Date(assignment.created_at).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>

          {/* Description Card */}
          {assignment.description && (
            <div className="bg-white p-6 rounded-lg border lg:col-span-4">
              <h3 className="text-lg font-bold mb-4">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'submissions' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Student Submissions</h2>
          </div>

          {assignment.grades.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No submissions yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignment.grades.map((grade) => {
                    const percentage = grade.score !== null
                      ? ((grade.score / assignment.max_points) * 100).toFixed(1)
                      : null;

                    return (
                      <tr key={grade.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-medium mr-3">
                              {grade.enrollment.student.first_name[0]}{grade.enrollment.student.last_name[0]}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {grade.enrollment.student.first_name} {grade.enrollment.student.last_name}
                              </div>
                              <div className="text-sm text-gray-500">{grade.enrollment.student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {grade.enrollment.student.student_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {grade.score !== null ? (
                            <span className={`text-lg font-bold ${getScoreColor(grade.score, assignment.max_points)}`}>
                              {grade.score} / {assignment.max_points}
                            </span>
                          ) : (
                            <span className="text-gray-400">Not graded</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {percentage !== null ? (
                            <span className={`font-medium ${getScoreColor(parseFloat(percentage), 100)}`}>
                              {percentage}%
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(grade.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {grade.graded_at ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Graded
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
