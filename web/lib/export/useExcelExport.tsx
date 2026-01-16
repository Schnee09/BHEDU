'use client'

/**
 * Excel Export Utility Hook
 * 
 * Provides easy Excel export functionality for any table data
 * Uses dynamic import to reduce initial bundle size
 */

interface ExcelColumn {
    header: string
    key: string
    width?: number
}

interface UseExcelExportOptions {
    filename?: string
    sheetName?: string
}

export function useExcelExport() {
    const exportToExcel = async <T extends Record<string, any>>(
        data: T[],
        columns: ExcelColumn[],
        options: UseExcelExportOptions = {}
    ) => {
        const { filename = 'export', sheetName = 'Sheet1' } = options

        // Dynamic import - xlsx is only loaded when export is triggered
        const XLSX = await import('xlsx')

        // Create worksheet data with headers
        const wsData = [
            columns.map(col => col.header),
            ...data.map(row => columns.map(col => {
                const value = row[col.key]
                // Handle nested objects
                if (typeof value === 'object' && value !== null) {
                    return value.name || value.full_name || JSON.stringify(value)
                }
                return value ?? ''
            }))
        ]

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData)

        // Set column widths
        ws['!cols'] = columns.map(col => ({ wch: col.width || 15 }))

        // Create workbook
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, sheetName)

        // Generate file and trigger download
        const timestamp = new Date().toISOString().split('T')[0]
        XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`)
    }

    return { exportToExcel }
}

/**
 * Export Button Component
 */
export function ExcelExportButton<T extends Record<string, any>>({
    data,
    columns,
    filename,
    sheetName,
    className = '',
    children
}: {
    data: T[]
    columns: ExcelColumn[]
    filename?: string
    sheetName?: string
    className?: string
    children?: React.ReactNode
}) {
    const { exportToExcel } = useExcelExport()

    const handleExport = async () => {
        await exportToExcel(data, columns, { filename, sheetName })
    }

    return (
        <button
            onClick={handleExport}
            disabled={data.length === 0}
            className={`inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm cursor-pointer ${className}`}
        >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {children || 'Excel'}
        </button>
    )
}

/**
 * Quick export helpers for common formats
 * Note: These must be called as async functions now
 */
export const exportStudents = async (students: any[], filename = 'danh_sach_hoc_sinh') => {
    const XLSX = await import('xlsx')

    const columns = [
        { header: 'Mã HS', key: 'student_code', width: 12 },
        { header: 'Họ tên', key: 'full_name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Điện thoại', key: 'phone', width: 15 },
        { header: 'Khối', key: 'grade_level', width: 8 },
        { header: 'Trạng thái', key: 'status', width: 12 },
    ]

    const wsData = [
        columns.map(col => col.header),
        ...students.map(row => columns.map(col => {
            const value = row[col.key]
            if (typeof value === 'object' && value !== null) {
                return value.name || value.full_name || JSON.stringify(value)
            }
            return value ?? ''
        }))
    ]

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    ws['!cols'] = columns.map(col => ({ wch: col.width || 15 }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Học sinh')

    const timestamp = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`)
}

export const exportGrades = async (grades: any[], filename = 'bang_diem') => {
    const XLSX = await import('xlsx')

    const columns = [
        { header: 'Mã HS', key: 'student_code', width: 12 },
        { header: 'Họ tên', key: 'student_name', width: 25 },
        { header: 'Môn học', key: 'subject_name', width: 20 },
        { header: 'Điểm miệng', key: 'oral', width: 12 },
        { header: 'Điểm 15p', key: 'fifteen_min', width: 12 },
        { header: 'Điểm 1 tiết', key: 'one_period', width: 12 },
        { header: 'Giữa kỳ', key: 'midterm', width: 12 },
        { header: 'Cuối kỳ', key: 'final', width: 12 },
        { header: 'TB', key: 'average', width: 10 },
    ]

    const wsData = [
        columns.map(col => col.header),
        ...grades.map(row => columns.map(col => {
            const value = row[col.key]
            if (typeof value === 'object' && value !== null) {
                return value.name || value.full_name || JSON.stringify(value)
            }
            return value ?? ''
        }))
    ]

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    ws['!cols'] = columns.map(col => ({ wch: col.width || 15 }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Điểm')

    const timestamp = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`)
}
