'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'
import { useToast } from '@/hooks'
import {
    UserPlusIcon,
    XMarkIcon,
    MagnifyingGlassIcon,
    AcademicCapIcon,
    CheckIcon,
    PencilIcon,
    TrashIcon,
    UsersIcon,
    CalendarIcon,
    BookOpenIcon,
    UserIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline'

interface Class {
    id: string
    name: string
    code: string
    grade_level?: string
    teacher?: {
        id: string
        full_name: string
    }
    _count?: {
        enrollments: number
    }
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
    status?: string
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
    const [selectedToRemove, setSelectedToRemove] = useState<Set<string>>(new Set())
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
    const [editingEnrollment, setEditingEnrollment] = useState<string | null>(null)

    useEffect(() => {
        loadClasses()
        loadAllStudents()
    }, [])

    useEffect(() => {
        if (selectedClass) {
            loadEnrollments()
            setSelectedToRemove(new Set())
        } else {
            setEnrolledStudents([])
        }
    }, [selectedClass])

    const loadClasses = async () => {
        try {
            const response = await apiFetch('/api/classes?include_count=true')
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
                loadClasses() // Refresh count
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
                loadClasses()
            } else {
                const data = await response.json()
                toast.error(data.error || 'Không thể xóa học sinh')
            }
        } catch (error) {
            toast.error('Lỗi khi xóa học sinh')
        }
    }

    const handleBulkRemove = async () => {
        if (selectedToRemove.size === 0) return
        if (!confirm(`Xác nhận xóa ${selectedToRemove.size} học sinh khỏi lớp?`)) return

        try {
            let successCount = 0
            for (const studentId of selectedToRemove) {
                const response = await apiFetch(
                    `/api/classes/${selectedClass}/enrollments?studentId=${studentId}`,
                    { method: 'DELETE' }
                )
                if (response.ok) successCount++
            }

            toast.success(`Đã xóa ${successCount} học sinh khỏi lớp`)
            setSelectedToRemove(new Set())
            loadEnrollments()
            loadClasses()
        } catch (error) {
            toast.error('Lỗi khi xóa học sinh')
        }
    }

    const handleUpdateStatus = async (studentId: string, newStatus: string) => {
        try {
            const response = await apiFetch(
                `/api/classes/${selectedClass}/enrollments/${studentId}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                }
            )

            if (response.ok) {
                toast.success('Đã cập nhật trạng thái')
                loadEnrollments()
                setEditingEnrollment(null)
            } else {
                const data = await response.json()
                toast.error(data.error || 'Không thể cập nhật')
            }
        } catch (error) {
            toast.error('Lỗi khi cập nhật trạng thái')
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

    const toggleRemoveSelection = (studentId: string) => {
        const newSelection = new Set(selectedToRemove)
        if (newSelection.has(studentId)) {
            newSelection.delete(studentId)
        } else {
            newSelection.add(studentId)
        }
        setSelectedToRemove(newSelection)
    }

    const toggleSelectAllForRemove = () => {
        if (selectedToRemove.size === filteredEnrolled.length) {
            setSelectedToRemove(new Set())
        } else {
            setSelectedToRemove(new Set(filteredEnrolled.map(e => e.student_id)))
        }
    }

    // Filter available students
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

    // Filter enrolled by status
    const filteredEnrolled = enrolledStudents.filter(e => {
        if (statusFilter === 'all') return true
        return e.status === statusFilter
    })

    const selectedClassData = classes.find(c => c.id === selectedClass)

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('vi-VN')
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <AcademicCapIcon className="w-8 h-8 text-indigo-600" />
                        Quản lý ghi danh
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Ghi danh học sinh vào các lớp học
                    </p>
                </div>

                {/* Class Selector */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Chọn lớp
                    </label>
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full md:w-96 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">Chọn lớp...</option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>
                                {cls.name} ({cls.code}) - {cls._count?.enrollments || 0} HS
                            </option>
                        ))}
                    </select>
                </div>

                {/* Class Info Card */}
                {selectedClassData && (
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 mb-6 text-white shadow-lg">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold">{selectedClassData.name}</h2>
                                <p className="text-indigo-100 text-sm mt-1">Mã: {selectedClassData.code}</p>
                            </div>
                            <div className="flex flex-wrap gap-6">
                                <div className="flex items-center gap-2">
                                    <UsersIcon className="w-5 h-5 text-indigo-200" />
                                    <div>
                                        <p className="text-2xl font-bold">{enrolledStudents.length}</p>
                                        <p className="text-xs text-indigo-200">Học sinh</p>
                                    </div>
                                </div>
                                {selectedClassData.grade_level && (
                                    <div className="flex items-center gap-2">
                                        <BookOpenIcon className="w-5 h-5 text-indigo-200" />
                                        <div>
                                            <p className="text-lg font-bold">{selectedClassData.grade_level}</p>
                                            <p className="text-xs text-indigo-200">Khối</p>
                                        </div>
                                    </div>
                                )}
                                {selectedClassData.teacher && (
                                    <div className="flex items-center gap-2">
                                        <UserIcon className="w-5 h-5 text-indigo-200" />
                                        <div>
                                            <p className="text-sm font-medium">{selectedClassData.teacher.full_name}</p>
                                            <p className="text-xs text-indigo-200">GVCN</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {selectedClass && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Enrolled Students */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="bg-indigo-50 dark:bg-indigo-900/30 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <CheckIcon className="w-5 h-5 text-indigo-600" />
                                            Đã ghi danh ({filteredEnrolled.length})
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value as any)}
                                            className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="all">Tất cả</option>
                                            <option value="active">Đang học</option>
                                            <option value="inactive">Nghỉ học</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Bulk Actions */}
                            {selectedToRemove.size > 0 && (
                                <div className="bg-red-50 dark:bg-red-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                    <span className="text-sm text-red-700 dark:text-red-300">
                                        Đã chọn {selectedToRemove.size} học sinh
                                    </span>
                                    <button
                                        onClick={handleBulkRemove}
                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg flex items-center gap-1"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                        Xóa tất cả
                                    </button>
                                </div>
                            )}

                            {loading ? (
                                <div className="p-8 text-center text-gray-500">Đang tải...</div>
                            ) : filteredEnrolled.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    <AcademicCapIcon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                                    Chưa có học sinh nào trong lớp
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[500px] overflow-y-auto">
                                    {/* Select All Header */}
                                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 flex items-center gap-3 sticky top-0">
                                        <input
                                            type="checkbox"
                                            checked={selectedToRemove.size === filteredEnrolled.length && filteredEnrolled.length > 0}
                                            onChange={toggleSelectAllForRemove}
                                            className="w-4 h-4 text-indigo-600 rounded"
                                        />
                                        <span className="text-xs text-gray-500 font-medium">Chọn tất cả</span>
                                    </div>

                                    {filteredEnrolled.map(student => (
                                        <div key={student.student_id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedToRemove.has(student.student_id)}
                                                onChange={() => toggleRemoveSelection(student.student_id)}
                                                className="w-4 h-4 text-indigo-600 rounded"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                                    {student.full_name}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{student.email}</p>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                                    {student.student_code && (
                                                        <span>Mã: {student.student_code}</span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <CalendarIcon className="w-3 h-3" />
                                                        {formatDate(student.enrollment_date)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="relative">
                                                {editingEnrollment === student.student_id ? (
                                                    <select
                                                        defaultValue={student.status || 'active'}
                                                        onChange={(e) => handleUpdateStatus(student.student_id, e.target.value)}
                                                        onBlur={() => setEditingEnrollment(null)}
                                                        autoFocus
                                                        className="text-xs px-2 py-1 border rounded"
                                                    >
                                                        <option value="active">Đang học</option>
                                                        <option value="inactive">Nghỉ học</option>
                                                        <option value="completed">Hoàn thành</option>
                                                        <option value="withdrawn">Rút lui</option>
                                                    </select>
                                                ) : (
                                                    <button
                                                        onClick={() => setEditingEnrollment(student.student_id)}
                                                        className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                                                            student.status === 'active' || !student.status
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                : student.status === 'inactive'
                                                                ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                        }`}
                                                    >
                                                        {student.status === 'active' || !student.status ? 'Đang học' :
                                                         student.status === 'inactive' ? 'Nghỉ học' :
                                                         student.status === 'completed' ? 'Hoàn thành' : 'Rút lui'}
                                                        <ChevronDownIcon className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handleRemoveEnrollment(student.student_id)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="bg-green-50 dark:bg-green-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <UserPlusIcon className="w-5 h-5 text-green-600" />
                                    Thêm học sinh
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Chọn học sinh để ghi danh vào lớp
                                </p>
                            </div>

                            {/* Search */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="relative">
                                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Tìm theo tên, email, mã HS..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Student List */}
                            <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
                                {filteredStudents.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        Không tìm thấy học sinh
                                    </div>
                                ) : (
                                    filteredStudents.slice(0, 50).map(student => (
                                        <label
                                            key={student.id}
                                            className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-3 cursor-pointer ${
                                                selectedToEnroll.has(student.id) ? 'bg-green-50 dark:bg-green-900/20' : ''
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedToEnroll.has(student.id)}
                                                onChange={() => toggleStudentSelection(student.id)}
                                                className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 dark:text-white truncate">{student.full_name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{student.email}</p>
                                            </div>
                                            {student.grade_level && (
                                                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                                    {student.grade_level}
                                                </span>
                                            )}
                                        </label>
                                    ))
                                )}
                            </div>

                            {/* Enroll Button */}
                            {selectedToEnroll.size > 0 && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
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
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <AcademicCapIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Chọn một lớp để quản lý
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            Chọn lớp từ danh sách ở trên để xem và quản lý học sinh
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
