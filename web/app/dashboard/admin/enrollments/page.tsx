'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'
import { useToast } from '@/hooks'
import {
    UserPlusIcon,
    XMarkIcon,
    MagnifyingGlassIcon,
    AcademicCapIcon,
    CheckIcon
} from '@heroicons/react/24/outline'

interface Class {
    id: string
    name: string
    code: string
}

interface Student {
    id: string
    full_name: string
    email: string
    student_code?: string
    grade_level?: string
}

interface Enrollment {
    enrollment_id: string
    student_id: string
    full_name: string
    email: string
    student_code?: string
    enrollment_date?: string
}

export default function EnrollmentsPage() {
    const toast = useToast()
    const [classes, setClasses] = useState<Class[]>([])
    const [selectedClass, setSelectedClass] = useState<string>('')
    const [enrolledStudents, setEnrolledStudents] = useState<Enrollment[]>([])
    const [availableStudents, setAvailableStudents] = useState<Student[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(false)
    const [enrolling, setEnrolling] = useState(false)
    const [selectedToEnroll, setSelectedToEnroll] = useState<Set<string>>(new Set())

    useEffect(() => {
        loadClasses()
        loadAllStudents()
    }, [])

    useEffect(() => {
        if (selectedClass) {
            loadEnrollments()
        } else {
            setEnrolledStudents([])
        }
    }, [selectedClass])

    const loadClasses = async () => {
        try {
            const response = await apiFetch('/api/classes')
            if (response.ok) {
                const data = await response.json()
                setClasses(data.classes || data.data || [])
            }
        } catch (error) {
            console.error('Failed to load classes:', error)
        }
    }

    const loadAllStudents = async () => {
        try {
            const response = await apiFetch('/api/admin/users?role=student&limit=200')
            if (response.ok) {
                const data = await response.json()
                setAvailableStudents(data.users || data.data || [])
            }
        } catch (error) {
            console.error('Failed to load students:', error)
        }
    }

    const loadEnrollments = async () => {
        try {
            setLoading(true)
            const response = await apiFetch(`/api/classes/${selectedClass}/enrollments`)
            if (response.ok) {
                const data = await response.json()
                setEnrolledStudents(data.enrollments || data.data || [])
            }
        } catch (error) {
            console.error('Failed to load enrollments:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEnrollStudents = async () => {
        if (selectedToEnroll.size === 0 || !selectedClass) return

        try {
            setEnrolling(true)
            const response = await apiFetch(`/api/classes/${selectedClass}/enrollments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentIds: Array.from(selectedToEnroll) })
            })

            if (response.ok) {
                toast.success(`Đã ghi danh ${selectedToEnroll.size} học sinh`)
                setSelectedToEnroll(new Set())
                loadEnrollments()
            } else {
                const data = await response.json()
                toast.error(data.error || 'Không thể ghi danh học sinh')
            }
        } catch (error) {
            toast.error('Lỗi khi ghi danh học sinh')
        } finally {
            setEnrolling(false)
        }
    }

    const handleRemoveEnrollment = async (studentId: string) => {
        if (!confirm('Xác nhận xóa học sinh khỏi lớp?')) return

        try {
            const response = await apiFetch(
                `/api/classes/${selectedClass}/enrollments?studentId=${studentId}`,
                { method: 'DELETE' }
            )

            if (response.ok) {
                toast.success('Đã xóa học sinh khỏi lớp')
                loadEnrollments()
            } else {
                const data = await response.json()
                toast.error(data.error || 'Không thể xóa học sinh')
            }
        } catch (error) {
            toast.error('Lỗi khi xóa học sinh')
        }
    }

    const toggleStudentSelection = (studentId: string) => {
        const newSelection = new Set(selectedToEnroll)
        if (newSelection.has(studentId)) {
            newSelection.delete(studentId)
        } else {
            newSelection.add(studentId)
        }
        setSelectedToEnroll(newSelection)
    }

    // Filter available students: not already enrolled and match search
    const enrolledIds = new Set(enrolledStudents.map(e => e.student_id))
    const filteredStudents = availableStudents.filter(s => {
        if (enrolledIds.has(s.id)) return false
        if (!searchTerm) return true
        const term = searchTerm.toLowerCase()
        return (
            s.full_name?.toLowerCase().includes(term) ||
            s.email?.toLowerCase().includes(term) ||
            s.student_code?.toLowerCase().includes(term)
        )
    })

    const selectedClassData = classes.find(c => c.id === selectedClass)

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <AcademicCapIcon className="w-8 h-8 text-indigo-600" />
                        Quản lý ghi danh
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Ghi danh học sinh vào các lớp học
                    </p>
                </div>

                {/* Class Selector */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chọn lớp
                    </label>
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full md:w-96 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">Chọn lớp...</option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>
                                {cls.name} ({cls.code})
                            </option>
                        ))}
                    </select>
                </div>

                {selectedClass && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Enrolled Students */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="bg-indigo-50 px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <CheckIcon className="w-5 h-5 text-indigo-600" />
                                    Đã ghi danh ({enrolledStudents.length})
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {selectedClassData?.name}
                                </p>
                            </div>

                            {loading ? (
                                <div className="p-8 text-center text-gray-500">Đang tải...</div>
                            ) : enrolledStudents.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <AcademicCapIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    Chưa có học sinh nào trong lớp
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
                                    {enrolledStudents.map(student => (
                                        <div key={student.student_id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">{student.full_name}</p>
                                                <p className="text-sm text-gray-500">{student.email}</p>
                                                {student.student_code && (
                                                    <p className="text-xs text-gray-400">Mã HS: {student.student_code}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleRemoveEnrollment(student.student_id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Xóa khỏi lớp"
                                            >
                                                <XMarkIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Add Students */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="bg-green-50 px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <UserPlusIcon className="w-5 h-5 text-green-600" />
                                    Thêm học sinh
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Chọn học sinh để ghi danh vào lớp
                                </p>
                            </div>

                            {/* Search */}
                            <div className="p-4 border-b border-gray-200">
                                <div className="relative">
                                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Tìm theo tên, email, mã HS..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                            </div>

                            {/* Student List */}
                            <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
                                {filteredStudents.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        Không tìm thấy học sinh
                                    </div>
                                ) : (
                                    filteredStudents.slice(0, 50).map(student => (
                                        <label
                                            key={student.id}
                                            className={`p-4 hover:bg-gray-50 flex items-center gap-3 cursor-pointer ${selectedToEnroll.has(student.id) ? 'bg-green-50' : ''
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedToEnroll.has(student.id)}
                                                onChange={() => toggleStudentSelection(student.id)}
                                                className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{student.full_name}</p>
                                                <p className="text-sm text-gray-500 truncate">{student.email}</p>
                                            </div>
                                            {student.grade_level && (
                                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                                    {student.grade_level}
                                                </span>
                                            )}
                                        </label>
                                    ))
                                )}
                            </div>

                            {/* Enroll Button */}
                            {selectedToEnroll.size > 0 && (
                                <div className="p-4 bg-gray-50 border-t border-gray-200">
                                    <button
                                        onClick={handleEnrollStudents}
                                        disabled={enrolling}
                                        className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {enrolling ? (
                                            <>
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                                                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"></path>
                                                </svg>
                                                Đang xử lý...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlusIcon className="w-5 h-5" />
                                                Ghi danh {selectedToEnroll.size} học sinh
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!selectedClass && (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <AcademicCapIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Chọn một lớp để quản lý
                        </h3>
                        <p className="text-gray-500">
                            Chọn lớp từ danh sách ở trên để xem và quản lý học sinh
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
