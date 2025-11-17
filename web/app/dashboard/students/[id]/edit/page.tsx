'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api/client'
import { showToast } from '@/components/ToastProvider'

interface StudentFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  date_of_birth: string
  gender: string
  student_id: string
  grade_level: string
  enrollment_date: string
  status: string
  notes: string
}

interface FieldError {
  field: string
  message: string
}

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [studentId, setStudentId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FieldError[]>([])
  const [formData, setFormData] = useState<StudentFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: '',
    student_id: '',
    grade_level: '',
    enrollment_date: '',
    status: 'active',
    notes: ''
  })

  useEffect(() => {
    params.then(p => {
      setStudentId(p.id)
      loadStudent(p.id)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const loadStudent = async (id: string) => {
    try {
      setLoading(true)
      const response = await apiFetch(`/api/admin/students/${id}`)
      if (response.ok) {
        const result = await response.json()
        const student = result.data
        setFormData({
          first_name: student.first_name || '',
          last_name: student.last_name || '',
          email: student.email || '',
          phone: student.phone || '',
          address: student.address || '',
          date_of_birth: student.date_of_birth || '',
          gender: student.gender || '',
          student_id: student.student_id || '',
          grade_level: student.grade_level || '',
          enrollment_date: student.enrollment_date || '',
          status: student.status || 'active',
          notes: student.notes || ''
        })
      } else {
        showToast.error('Failed to load student data')
        router.push('/dashboard/students')
      }
    } catch (error) {
      console.error('Failed to load student:', error)
      showToast.error('Failed to load student data')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FieldError[] = []

    if (!formData.first_name.trim()) {
      newErrors.push({ field: 'first_name', message: 'First name is required' })
    }

    if (!formData.last_name.trim()) {
      newErrors.push({ field: 'last_name', message: 'Last name is required' })
    }

    if (!formData.email.trim()) {
      newErrors.push({ field: 'email', message: 'Email is required' })
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.push({ field: 'email', message: 'Please enter a valid email address' })
    }

    if (formData.student_id && formData.student_id.length > 50) {
      newErrors.push({ field: 'student_id', message: 'Student ID must be 50 characters or less' })
    }

    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.push({ field: 'phone', message: 'Please enter a valid phone number' })
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      showToast.error('Please fix the errors in the form')
      return
    }

    setSaving(true)
    const loadingToast = showToast.loading('Updating student...')

    try {
      const response = await apiFetch(`/api/admin/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      showToast.dismiss(loadingToast)

      if (response.ok) {
        showToast.success('Student updated successfully!')
        setTimeout(() => {
          router.push(`/dashboard/students/${studentId}`)
        }, 1000)
      } else {
        showToast.error(result.error || 'Failed to update student')
        if (result.error?.includes('Student ID')) {
          setErrors([{ field: 'student_id', message: result.error }])
        } else if (result.error?.includes('Email')) {
          setErrors([{ field: 'email', message: result.error }])
        }
      }
    } catch (error) {
      showToast.dismiss(loadingToast)
      console.error('Failed to update student:', error)
      showToast.error('Failed to update student. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getFieldError = (field: string): string | undefined => {
    return errors.find(e => e.field === field)?.message
  }

  const handleChange = (field: keyof StudentFormData, value: string) => {
    setFormData({ ...formData, [field]: value })
    // Clear error for this field when user starts typing
    setErrors(errors.filter(e => e.field !== field))
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-500">Loading student data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Link href="/dashboard/students" className="hover:text-blue-600">Students</Link>
          <span>/</span>
          <Link href={`/dashboard/students/${studentId}`} className="hover:text-blue-600">
            {formData.first_name} {formData.last_name}
          </Link>
          <span>/</span>
          <span>Edit</span>
        </div>
        <h1 className="text-3xl font-bold">Edit Student</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    getFieldError('first_name') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {getFieldError('first_name') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('first_name')}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Student&apos;s legal first name</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    getFieldError('last_name') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {getFieldError('last_name') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('last_name')}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Student&apos;s legal last name</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    getFieldError('email') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {getFieldError('email') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('email')}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Must be unique and valid (e.g., student@school.edu)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    getFieldError('phone') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+1 (555) 123-4567"
                />
                {getFieldError('phone') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('phone')}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Contact phone number</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleChange('date_of_birth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Student&apos;s birth date</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">Optional</p>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="123 Main St, City, State ZIP"
              />
              <p className="mt-1 text-xs text-gray-500">Full mailing address</p>
            </div>
          </div>

          {/* Academic Information */}
          <div className="pt-4 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student ID
                </label>
                <input
                  type="text"
                  value={formData.student_id}
                  onChange={(e) => handleChange('student_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    getFieldError('student_id') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="2024-001"
                />
                {getFieldError('student_id') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('student_id')}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Unique identifier (e.g., 2024-001, SID12345)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade Level
                </label>
                <input
                  type="text"
                  value={formData.grade_level}
                  onChange={(e) => handleChange('grade_level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="9, 10, 11, or 12"
                />
                <p className="mt-1 text-xs text-gray-500">Current grade level (9-12 for high school)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enrollment Date
                </label>
                <input
                  type="date"
                  value={formData.enrollment_date}
                  onChange={(e) => handleChange('enrollment_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Date student enrolled at school</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="graduated">Graduated</option>
                  <option value="transferred">Transferred</option>
                  <option value="suspended">Suspended</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">Current enrollment status</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="pt-4 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional information about the student..."
              />
              <p className="mt-1 text-xs text-gray-500">Internal notes (not visible to student)</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href={`/dashboard/students/${studentId}`}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
