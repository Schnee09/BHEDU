'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';

interface Class {
  id: string;
  name: string;
  code: string;
  grade_level: string;
  status: string;
  room_number: string | null;
  academic_year: {
    id: string;
    year_name: string;
    status: string;
  };
  enrollments: { count: number }[];
}

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  status: string;
  hire_date: string | null;
  date_of_birth: string | null;
  address: string | null;
  emergency_contact: string | null;
  qualifications: string | null;
  notes: string | null;
  created_at: string;
  classes: Class[];
  statistics: {
    total_classes: number;
    active_classes: number;
    total_students: number;
  };
  recent_activity: {
    id: string;
    name: string;
    updated_at: string;
  }[];
}

export default function TeacherDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'profile'>('overview');
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then(p => setResolvedParams(p));
  }, [params]);

  useEffect(() => {
    if (resolvedParams) {
      fetchTeacherDetails();
    }
  }, [resolvedParams]);

  const fetchTeacherDetails = async () => {
    if (!resolvedParams) return;
    
    try {
      setLoading(true);
      setError('');
      const response: any = await apiFetch(`/api/admin/teachers/${resolvedParams.id}`);
      if (response.success) {
        setTeacher(response.teacher);
      } else {
        setError(response.error || 'Failed to load teacher details');
      }
    } catch (err: unknown) {
      console.error('Error fetching teacher details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load teacher details');
    } finally {
      setLoading(false);
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

  if (error || !teacher) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Teacher not found'}
        </div>
        <button
          onClick={() => router.push('/dashboard/admin/teachers')}
          className="text-blue-600 hover:underline"
        >
          ← Back to Teachers
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/admin/teachers')}
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Back to Teachers
        </button>
        
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl mr-4">
              {teacher.first_name[0]}{teacher.last_name[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">
                {teacher.first_name} {teacher.last_name}
              </h1>
              <p className="text-gray-600">{teacher.email}</p>
              {teacher.department && (
                <p className="text-sm text-gray-500">{teacher.department}</p>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              teacher.status === 'active' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {teacher.status}
            </span>
            <button
              onClick={() => router.push(`/dashboard/admin/teachers?edit=${teacher.id}`)}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Edit Profile
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
            onClick={() => setActiveTab('classes')}
            className={`pb-4 px-2 font-medium ${
              activeTab === 'classes'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Classes ({teacher.statistics.total_classes})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 px-2 font-medium ${
              activeTab === 'profile'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Full Profile
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Statistics Cards */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Total Classes</h3>
            <p className="text-3xl font-bold text-blue-600">{teacher.statistics.total_classes}</p>
            <p className="text-sm text-gray-600 mt-1">
              {teacher.statistics.active_classes} active
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Total Students</h3>
            <p className="text-3xl font-bold text-green-600">{teacher.statistics.total_students}</p>
            <p className="text-sm text-gray-600 mt-1">Across all classes</p>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Department</h3>
            <p className="text-xl font-bold text-gray-900">
              {teacher.department || 'Not assigned'}
            </p>
          </div>

          {/* Contact Information Card */}
          <div className="bg-white p-6 rounded-lg border md:col-span-2">
            <h3 className="text-lg font-bold mb-4">Contact Information</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-gray-900">{teacher.email}</dd>
              </div>
              {teacher.phone && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="text-gray-900">{teacher.phone}</dd>
                </div>
              )}
              {teacher.emergency_contact && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Emergency Contact</dt>
                  <dd className="text-gray-900">{teacher.emergency_contact}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Employment Information Card */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-bold mb-4">Employment</h3>
            <dl className="space-y-3">
              {teacher.hire_date && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Hire Date</dt>
                  <dd className="text-gray-900">
                    {new Date(teacher.hire_date).toLocaleDateString()}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    teacher.status === 'active' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {teacher.status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Recent Activity */}
          {teacher.recent_activity && teacher.recent_activity.length > 0 && (
            <div className="bg-white p-6 rounded-lg border lg:col-span-3">
              <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
              <div className="space-y-2">
                {teacher.recent_activity.map((activity) => (
                  <div key={activity.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <span className="font-medium">{activity.name}</span>
                    <span className="text-sm text-gray-600">
                      Updated {new Date(activity.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'classes' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Assigned Classes</h2>
          </div>

          {teacher.classes.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No classes assigned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacher.classes.map((cls) => (
                <a
                  key={cls.id}
                  href={`/dashboard/admin/classes/${cls.id}`}
                  className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg">{cls.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      cls.status === 'active' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {cls.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Code:</span>
                      <span className="font-mono">{cls.code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Grade:</span>
                      <span className="font-medium">{cls.grade_level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Students:</span>
                      <span className="font-medium">{cls.enrollments?.[0]?.count || 0}</span>
                    </div>
                    {cls.room_number && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Room:</span>
                        <span className="font-medium">{cls.room_number}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Year:</span>
                      <span className="text-xs">{cls.academic_year.year_name}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-bold mb-4">Personal Information</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                <dd className="text-gray-900">{teacher.first_name} {teacher.last_name}</dd>
              </div>
              {teacher.date_of_birth && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                  <dd className="text-gray-900">
                    {new Date(teacher.date_of_birth).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {teacher.address && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="text-gray-900">{teacher.address}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-bold mb-4">Professional Information</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Department</dt>
                <dd className="text-gray-900">{teacher.department || 'Not assigned'}</dd>
              </div>
              {teacher.qualifications && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Qualifications</dt>
                  <dd className="text-gray-900 whitespace-pre-wrap">{teacher.qualifications}</dd>
                </div>
              )}
              {teacher.hire_date && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Hire Date</dt>
                  <dd className="text-gray-900">
                    {new Date(teacher.hire_date).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {teacher.notes && (
            <div className="bg-white p-6 rounded-lg border md:col-span-2">
              <h3 className="text-lg font-bold mb-4">Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{teacher.notes}</p>
            </div>
          )}

          <div className="bg-white p-6 rounded-lg border md:col-span-2">
            <h3 className="text-lg font-bold mb-4">System Information</h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">User ID</dt>
                <dd className="text-gray-900 font-mono text-sm">{teacher.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="text-gray-900">
                  {new Date(teacher.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
