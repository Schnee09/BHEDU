'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/select'
import { Icons } from '@/components/ui/Icons'

interface Student {
    id: string
    full_name: string
    student_id: string
    email: string
}

interface ClassOption {
    id: string
    name: string
}

interface GradeRecord {
    id: string
    score: number
    component_type: string
    semester: number
    graded_at: string
    notes?: string
}

export default function TranscriptsPage() {
    const [classes, setClasses] = useState<ClassOption[]>([])
    const [students, setStudents] = useState<Student[]>([])
    const [selectedClass, setSelectedClass] = useState('')
    const [selectedStudent, setSelectedStudent] = useState('')
    const [grades, setGrades] = useState<GradeRecord[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingStudents, setLoadingStudents] = useState(false)

    useEffect(() => {
        loadClasses()
    }, [])

    useEffect(() => {
        if (selectedClass) {
            loadStudentsInClass()
        } else {
            setStudents([])
            setGrades([])
        }
    }, [selectedClass])

    useEffect(() => {
        if (selectedStudent && selectedClass) {
            loadGrades()
        }
    }, [selectedStudent, selectedClass])

    const loadClasses = async () => {
        try {
            const response = await apiFetch('/api/classes/my-classes')
            if (response.ok) {
                const data = await response.json()
                setClasses(data.classes || data.data || [])
            }
        } catch (error) {
            console.error('Failed to load classes:', error)
        }
    }

    const loadStudentsInClass = async () => {
        try {
            setLoadingStudents(true)
            const response = await apiFetch(`/api/classes/${selectedClass}/students`)
            if (response.ok) {
                const data = await response.json()
                setStudents(data.students || data.data || [])
            }
        } catch (error) {
            console.error('Failed to load students:', error)
            setStudents([])
        } finally {
            setLoadingStudents(false)
        }
    }

    const loadGrades = async () => {
        try {
            setLoading(true)
            // Fetch grades for this student in this class
            const response = await apiFetch(`/api/grades?studentId=${selectedStudent}&classId=${selectedClass}`)
            if (response.ok) {
                const data = await response.json()
                setGrades(data.grades || data.data || [])
            }
        } catch (error) {
            console.error('Failed to load grades:', error)
            setGrades([])
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const getGradeColor = (score: number) => {
        if (score >= 8) return 'text-green-600'
        if (score >= 6.5) return 'text-blue-600'
        if (score >= 5) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getGradeLabel = (score: number) => {
        if (score >= 8) return 'Giỏi'
        if (score >= 6.5) return 'Khá'
        if (score >= 5) return 'Trung bình'
        return 'Yếu'
    }

    const selectedClassData = classes.find(c => c.id === selectedClass)
    const selectedStudentData = students.find(s => s.id === selectedStudent)

    // Calculate average
    const averageScore = grades.length > 0
        ? grades.reduce((sum, g) => sum + g.score, 0) / grades.length
        : 0

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Icons.Grades className="w-8 h-8 text-indigo-600" />
                            Bảng Điểm Học Sinh
                        </h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Xem điểm theo lớp của từng học sinh
                        </p>
                    </div>
                    {grades.length > 0 && (
                        <Button onClick={handlePrint} className="print:hidden">
                            <Icons.Download className="w-4 h-4 mr-2" />
                            In bảng điểm
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <Card className="mb-6 print:hidden">
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Class Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lớp học
                                </label>
                                <Select
                                    value={selectedClass}
                                    onChange={(e) => {
                                        setSelectedClass(e.target.value)
                                        setSelectedStudent('')
                                        setGrades([])
                                    }}
                                >
                                    <option value="">Chọn lớp...</option>
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                                    ))}
                                </Select>
                            </div>

                            {/* Student Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Học sinh
                                </label>
                                <Select
                                    value={selectedStudent}
                                    onChange={(e) => setSelectedStudent(e.target.value)}
                                    disabled={!selectedClass || loadingStudents}
                                >
                                    <option value="">
                                        {loadingStudents ? 'Đang tải...' : 'Chọn học sinh...'}
                                    </option>
                                    {students.map(student => (
                                        <option key={student.id} value={student.id}>
                                            {student.full_name} ({student.student_id})
                                        </option>
                                    ))}
                                </Select>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-2 text-gray-500">Đang tải điểm...</p>
                    </div>
                )}

                {/* Grades Display */}
                {!loading && selectedStudent && selectedClass && (
                    <div className="space-y-6">
                        {/* Student Info Card */}
                        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                            <CardBody>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold">{selectedStudentData?.full_name || 'Học sinh'}</h2>
                                        <p className="opacity-90">Mã HS: {selectedStudentData?.student_id || '-'}</p>
                                        <p className="opacity-75 text-sm mt-1">Lớp: {selectedClassData?.name || '-'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-4xl font-bold">
                                            {averageScore > 0 ? averageScore.toFixed(1) : '-'}
                                        </p>
                                        <p className="text-sm opacity-90">Điểm trung bình</p>
                                        {averageScore > 0 && (
                                            <p className="text-lg font-semibold mt-1">{getGradeLabel(averageScore)}</p>
                                        )}
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <Card>
                                <CardBody className="text-center">
                                    <p className="text-3xl font-bold text-indigo-600">{grades.length}</p>
                                    <p className="text-sm text-gray-500">Số điểm</p>
                                </CardBody>
                            </Card>
                            <Card>
                                <CardBody className="text-center">
                                    <p className={`text-3xl font-bold ${getGradeColor(averageScore)}`}>
                                        {averageScore > 0 ? getGradeLabel(averageScore) : '-'}
                                    </p>
                                    <p className="text-sm text-gray-500">Xếp loại</p>
                                </CardBody>
                            </Card>
                            <Card>
                                <CardBody className="text-center">
                                    <p className="text-3xl font-bold text-purple-600">
                                        {grades.length > 0 ? Math.max(...grades.map(g => g.score)).toFixed(1) : '-'}
                                    </p>
                                    <p className="text-sm text-gray-500">Điểm cao nhất</p>
                                </CardBody>
                            </Card>
                        </div>

                        {/* Grades Table */}
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-semibold">Chi tiết điểm</h3>
                            </CardHeader>
                            <CardBody>
                                {grades.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">Chưa có điểm nào</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        STT
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Loại điểm
                                                    </th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                        Điểm
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Ngày chấm
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Ghi chú
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {grades.map((grade, index) => (
                                                    <tr key={grade.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-gray-500">
                                                            {index + 1}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="font-medium text-gray-900">
                                                                {grade.component_type || 'Điểm thường'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`text-xl font-bold ${getGradeColor(grade.score)}`}>
                                                                {grade.score.toFixed(1)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600">
                                                            {grade.graded_at
                                                                ? new Date(grade.graded_at).toLocaleDateString('vi-VN')
                                                                : '-'}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-500">
                                                            {grade.notes || '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </div>
                )}

                {/* Instructions */}
                {!selectedClass && (
                    <Card className="print:hidden">
                        <CardBody className="text-center py-12">
                            <Icons.Grades className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Xem bảng điểm học sinh
                            </h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                                Chọn lớp và học sinh để xem chi tiết điểm.
                                Mỗi lớp là một môn học riêng biệt.
                            </p>
                        </CardBody>
                    </Card>
                )}
            </div>
        </div>
    )
}
