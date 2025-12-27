'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import Badge from '@/components/ui/badge'
import { Icons } from '@/components/ui/Icons'

interface AttendanceRecord {
    id: string
    student_id: string
    class_id: string
    date: string
    status: 'present' | 'absent'
    notes: string | null
    student?: {
        full_name: string
        student_id: string
        email: string
    }
    class?: {
        name: string
    }
}

interface ClassOption {
    id: string
    name: string
}

export default function AttendanceHistoryPage() {
    const [records, setRecords] = useState<AttendanceRecord[]>([])
    const [classes, setClasses] = useState<ClassOption[]>([])
    const [loading, setLoading] = useState(true)

    // Filters
    const [selectedClass, setSelectedClass] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    // Pagination
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const limit = 20

    useEffect(() => {
        loadClasses()
    }, [])

    useEffect(() => {
        loadRecords()
    }, [selectedClass, selectedStatus, startDate, endDate, page])

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

    const loadRecords = useCallback(async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (selectedClass) params.append('classId', selectedClass)
            if (selectedStatus) params.append('status', selectedStatus)
            if (startDate) params.append('startDate', startDate)
            if (endDate) params.append('endDate', endDate)
            params.append('page', page.toString())
            params.append('limit', limit.toString())

            const response = await apiFetch(`/api/attendance/reports?${params}`)
            if (response.ok) {
                const data = await response.json()
                setRecords(data.data || [])
                // Calculate total pages if we have total count
                const total = data.analytics?.totalRecords || data.data?.length || 0
                setTotalPages(Math.max(1, Math.ceil(total / limit)))
            }
        } catch (error) {
            console.error('Failed to load records:', error)
        } finally {
            setLoading(false)
        }
    }, [selectedClass, selectedStatus, startDate, endDate, page])

    const filteredRecords = records.filter(record => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
            record.student?.full_name?.toLowerCase().includes(query) ||
            record.student?.student_id?.toLowerCase().includes(query) ||
            record.class?.name?.toLowerCase().includes(query)
        )
    })

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'present':
                return <Badge variant="success">Có mặt</Badge>
            case 'absent':
                return <Badge variant="danger">Vắng</Badge>
            default:
                return <Badge variant="default">{status}</Badge>
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Icons.Calendar className="w-8 h-8 text-indigo-600" />
                        Lịch Sử Điểm Danh
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Xem lịch sử điểm danh của tất cả học sinh
                    </p>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {/* Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tìm kiếm
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Tên học sinh, mã..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Class Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lớp
                                </label>
                                <Select
                                    value={selectedClass}
                                    onChange={(e) => { setSelectedClass(e.target.value); setPage(1); }}
                                >
                                    <option value="">Tất cả lớp</option>
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                                    ))}
                                </Select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Trạng thái
                                </label>
                                <Select
                                    value={selectedStatus}
                                    onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                                >
                                    <option value="">Tất cả</option>
                                    <option value="present">Có mặt</option>
                                    <option value="absent">Vắng</option>
                                </Select>
                            </div>

                            {/* Date Range */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Từ ngày
                                </label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Đến ngày
                                </label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex justify-between items-center">
                            <p className="text-sm text-gray-500">
                                Hiển thị {filteredRecords.length} bản ghi
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedClass('')
                                    setSelectedStatus('')
                                    setStartDate('')
                                    setEndDate('')
                                    setSearchQuery('')
                                    setPage(1)
                                }}
                            >
                                Xóa bộ lọc
                            </Button>
                        </div>
                    </CardBody>
                </Card>

                {/* Records Table */}
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold">Danh sách điểm danh</h2>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                                <p className="mt-2 text-gray-500">Đang tải...</p>
                            </div>
                        ) : filteredRecords.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Icons.Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Không tìm thấy bản ghi nào</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Ngày
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Học sinh
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Lớp
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Trạng thái
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Ghi chú
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredRecords.map((record) => (
                                                <tr key={record.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {new Date(record.date).toLocaleDateString('vi-VN')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {record.student?.full_name || 'N/A'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {record.student?.student_id}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {record.class?.name || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {getStatusBadge(record.status)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                        {record.notes || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="mt-4 flex items-center justify-between border-t pt-4">
                                    <p className="text-sm text-gray-500">
                                        Trang {page} / {totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page <= 1}
                                        >
                                            Trước
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page >= totalPages}
                                        >
                                            Sau
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardBody>
                </Card>
            </div>
        </div>
    )
}
