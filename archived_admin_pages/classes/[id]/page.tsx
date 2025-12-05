'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface Student {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  email: string | null;
  status: string;
}

interface Enrollment {
  id: string;
  student_id: string;
  enrolled_at: string;
  status: string;
  student: Student;
}

interface Class {
  id: string;
  name: string;
  code: string;
  description: string | null;
  grade_level: string;
  status: string;
  room_number: string | null;
  schedule: string | null;
  max_students: number | null;
  teacher_id: string;
  academic_year_id: string;
  created_at: string;
  updated_at: string;
  teacher: Teacher;
  academic_year: AcademicYear;
  enrollments: Enrollment[];
}

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onSuccess: () => void;
  currentStudentIds: string[];
}

function AddStudentModal({ isOpen, onClose, classId, onSuccess, currentStudentIds }: AddStudentModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchAvailableStudents();
    }
  }, [isOpen]);

  const fetchAvailableStudents = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/users?role=student&status=active&limit=100');
      const response = await res.json();
      if (response.success) {
        // Filter out students already enrolled
        const available = response.users.filter((s: Student) => !currentStudentIds.includes(s.id));
        setStudents(available);
      }
    } catch (err: unknown) {
      console.error('Error fetching students:', err);
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setError('Please select a student');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const res = await apiFetch('/api/admin/enrollments', {
        method: 'POST',
        body: JSON.stringify({
          class_id: classId,
          student_id: selectedStudentId,
          status: 'enrolled'
        }),
      });
      const response = await res.json();

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.error || 'Failed to enroll student');
      }
    } catch (err: unknown) {
      console.error('Error enrolling student:', err);
      setError(err instanceof Error ? err.message : 'Failed to enroll student');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name} ${s.student_number} ${s.email || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Student to Class</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Search Students
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, number, or email..."
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Select Student *
            </label>
            {loading ? (
              <div className="text-gray-500">Loading students...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-gray-500">
                {searchTerm ? 'No students found matching your search' : 'No available students to enroll'}
              </div>
            ) : (
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">-- Select a student --</option>
                {filteredStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.student_number} - {student.first_name} {student.last_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={loading || !selectedStudentId}
            >
              {loading ? 'Adding...' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClassDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [classData, setClassData] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'schedule'>('overview');
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then(p => setResolvedParams(p));
  }, [params]);

  useEffect(() => {
    if (resolvedParams) {
      fetchClassDetails();
    }
  }, [resolvedParams]);

  const fetchClassDetails = async () => {
    if (!resolvedParams) return;
    
    try {
      setLoading(true);
      setError('');
      const res = await apiFetch(`/api/admin/classes/${resolvedParams.id}`);
      const response = await res.json();
      if (response.success) {
        setClassData(response.class);
      } else {
        setError(response.error || 'Failed to load class details');
      }
    } catch (err: unknown) {
      console.error('Error fetching class details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load class details');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (enrollmentId: string) => {
    if (!confirm('Are you sure you want to remove this student from the class?')) {
      return;
    }

    try {
      const res = await apiFetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: 'DELETE',
      });
      const response = await res.json();

      if (response.success) {
        fetchClassDetails(); // Refresh the data
      } else {
        alert(response.error || 'Failed to remove student');
      }
    } catch (err: unknown) {
      console.error('Error removing student:', err);
      alert(err instanceof Error ? err.message : 'Failed to remove student');
    }
  };

  const handleUpdateEnrollmentStatus = async (enrollmentId: string, newStatus: string) => {
    try {
      const res = await apiFetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      const response = await res.json();

      if (response.success) {
        fetchClassDetails(); // Refresh the data
      } else {
        alert(response.error || 'Failed to update status');
      }
    } catch (err: unknown) {
      console.error('Error updating enrollment status:', err);
      alert(err instanceof Error ? err.message : 'Failed to update status');
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

  if (error || !classData) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Class not found'}
        </div>
        <button
          onClick={() => router.push('/dashboard/admin/classes')}
          className="text-blue-600 hover:underline"
        >
          ← Back to Classes
        </button>
      </div>
    );
  }

  const enrollmentCount = classData.enrollments?.length || 0;
  const maxStudents = classData.max_students || 0;
  const capacity = maxStudents > 0 ? `${enrollmentCount}/${maxStudents}` : enrollmentCount;
  const isFull = maxStudents > 0 && enrollmentCount >= maxStudents;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/admin/classes')}
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Back to Classes
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{classData.name}</h1>
            <p className="text-gray-600">
              {classData.code} • Grade {classData.grade_level}
            </p>
          </div>
          <div className="flex space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              classData.status === 'active' ? 'bg-green-100 text-green-800' :
              classData.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {classData.status}
            </span>
            <button
              onClick={() => router.push(`/dashboard/admin/classes?edit=${classData.id}`)}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Edit Class
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
            onClick={() => setActiveTab('students')}
            className={`pb-4 px-2 font-medium ${
              activeTab === 'students'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Students ({enrollmentCount})
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`pb-4 px-2 font-medium ${
              activeTab === 'schedule'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Schedule & Details
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Teacher Info Card */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Teacher</h3>
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                {classData.teacher.first_name[0]}{classData.teacher.last_name[0]}
              </div>
              <div>
                <p className="font-medium">
                  {classData.teacher.first_name} {classData.teacher.last_name}
                </p>
                <p className="text-sm text-gray-600">{classData.teacher.email}</p>
              </div>
            </div>
          </div>

          {/* Academic Year Card */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Academic Year</h3>
            <p className="text-xl font-bold mb-1">{classData.academic_year.name}</p>
            <p className="text-sm text-gray-600">
              {new Date(classData.academic_year.start_date).toLocaleDateString()} - {' '}
              {new Date(classData.academic_year.end_date).toLocaleDateString()}
            </p>
            <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
              classData.academic_year.status === 'active' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {classData.academic_year.status}
            </span>
          </div>

          {/* Enrollment Stats Card */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Enrollment</h3>
            <p className="text-3xl font-bold mb-1">{capacity}</p>
            <p className="text-sm text-gray-600">Students enrolled</p>
            {isFull && (
              <span className="inline-block mt-2 px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                Class Full
              </span>
            )}
            {maxStudents > 0 && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      isFull ? 'bg-orange-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min((enrollmentCount / maxStudents) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Room Info Card */}
          {classData.room_number && (
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Room</h3>
              <p className="text-2xl font-bold">{classData.room_number}</p>
            </div>
          )}

          {/* Description Card */}
          {classData.description && (
            <div className="bg-white p-6 rounded-lg border md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Description</h3>
              <p className="text-gray-700">{classData.description}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'students' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Enrolled Students</h2>
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={isFull}
            >
              {isFull ? 'Class Full' : '+ Add Student'}
            </button>
          </div>

          {enrollmentCount === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">No students enrolled yet</p>
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add First Student
              </button>
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
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrolled On
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classData.enrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-medium mr-3">
                            {enrollment.student.first_name[0]}{enrollment.student.last_name[0]}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {enrollment.student.first_name} {enrollment.student.last_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {enrollment.student.student_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {enrollment.student.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={enrollment.status}
                          onChange={(e) => handleUpdateEnrollmentStatus(enrollment.id, e.target.value)}
                          className={`text-sm px-2 py-1 rounded border ${
                            enrollment.status === 'enrolled' ? 'bg-green-50 border-green-200 text-green-800' :
                            enrollment.status === 'withdrawn' ? 'bg-red-50 border-red-200 text-red-800' :
                            'bg-gray-50 border-gray-200 text-gray-800'
                          }`}
                        >
                          <option value="enrolled">Enrolled</option>
                          <option value="dropped">Dropped</option>
                          <option value="withdrawn">Withdrawn</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleRemoveStudent(enrollment.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-bold mb-4">Schedule</h3>
            {classData.schedule ? (
              <div className="whitespace-pre-wrap text-gray-700">{classData.schedule}</div>
            ) : (
              <p className="text-gray-500">No schedule information available</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-bold mb-4">Class Information</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Class Code</dt>
                <dd className="text-gray-900 font-mono">{classData.code}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Grade Level</dt>
                <dd className="text-gray-900">{classData.grade_level}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Room Number</dt>
                <dd className="text-gray-900">{classData.room_number || 'Not assigned'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Maximum Students</dt>
                <dd className="text-gray-900">{classData.max_students || 'No limit'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="text-gray-900">{new Date(classData.created_at).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="text-gray-900">{new Date(classData.updated_at).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        classId={classData.id}
        onSuccess={fetchClassDetails}
        currentStudentIds={classData.enrollments.map(e => e.student_id)}
      />
    </div>
  );
}
