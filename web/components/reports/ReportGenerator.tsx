'use client';

/**
 * Report Generator Component
 * 
 * UI for generating and downloading various report types:
 * - Report Cards (Học bạ)
 * - Attendance Reports (Điểm danh)
 * - Transcripts (Bảng điểm)
 * - Class Performance (Báo cáo lớp)
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api/client';
import {
    generateReportCardHTML,
    generateAttendanceReportHTML,
    generateTranscriptHTML,
    printReport,
    downloadHTML,
    type ReportConfig,
    type ReportCardData,
    type AttendanceReportData,
} from '@/lib/reports/pdfGenerator';

type ReportType = 'report_card' | 'attendance' | 'transcript' | 'class_performance';

interface ReportOption {
    id: ReportType;
    title: string;
    titleVi: string;
    description: string;
    icon: React.ReactNode;
}

const REPORT_OPTIONS: ReportOption[] = [
    {
        id: 'report_card',
        title: 'Report Card',
        titleVi: 'Học Bạ',
        description: 'Bảng điểm cá nhân của học sinh theo học kỳ',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },
    {
        id: 'attendance',
        title: 'Attendance Report',
        titleVi: 'Báo Cáo Điểm Danh',
        description: 'Thống kê đi học của học sinh theo thời gian',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
        ),
    },
    {
        id: 'transcript',
        title: 'Transcript',
        titleVi: 'Bảng Điểm Toàn Khóa',
        description: 'Bảng điểm tổng hợp tất cả các học kỳ',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
        ),
    },
    {
        id: 'class_performance',
        title: 'Class Performance',
        titleVi: 'Báo Cáo Lớp Học',
        description: 'Tổng hợp kết quả học tập của cả lớp',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
    },
];

interface Class {
    id: string;
    name: string;
}

interface Student {
    id: string;
    full_name: string;
    student_code?: string;
}

export default function ReportGenerator() {
    const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
    const [classes, setClasses] = useState<Class[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedStudent, setSelectedStudent] = useState<string>('');
    const [dateFrom, setDateFrom] = useState<string>(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().split('T')[0];
    });
    const [dateTo, setDateTo] = useState<string>(() => new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    // Load classes on mount
    useEffect(() => {
        loadClasses();
    }, []);

    // Load students when class changes
    useEffect(() => {
        if (selectedClass) {
            loadStudents(selectedClass);
        } else {
            setStudents([]);
        }
    }, [selectedClass]);

    const loadClasses = async () => {
        try {
            setLoading(true);
            const res = await apiFetch('/api/classes');
            if (res.ok) {
                const data = await res.json();
                setClasses(data.classes || data || []);
            }
        } catch (error) {
            console.error('Failed to load classes:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStudents = async (classId: string) => {
        try {
            const res = await apiFetch(`/api/classes/${classId}/students`);
            if (res.ok) {
                const data = await res.json();
                setStudents(data.students || data || []);
            }
        } catch (error) {
            console.error('Failed to load students:', error);
        }
    };

    const generateReport = async () => {
        if (!selectedReport) return;

        setGenerating(true);
        try {
            const config: ReportConfig = {
                title: REPORT_OPTIONS.find(r => r.id === selectedReport)?.titleVi || '',
                schoolName: 'TRUNG TÂM GIÁO DỤC BÙI HOÀNG', // TODO: Get from settings
                academicYear: '2024-2025',
                generatedAt: new Date(),
            };

            let htmlContent = '';

            switch (selectedReport) {
                case 'report_card':
                    // Fetch student report card data
                    const rcRes = await apiFetch(`/api/reports/report-card?studentId=${selectedStudent}&dateFrom=${dateFrom}&dateTo=${dateTo}`);
                    if (rcRes.ok) {
                        const data: ReportCardData = await rcRes.json();
                        htmlContent = generateReportCardHTML(data, config);
                    }
                    break;

                case 'attendance':
                    // Fetch attendance data
                    const attRes = await apiFetch(`/api/reports/attendance?classId=${selectedClass}&dateFrom=${dateFrom}&dateTo=${dateTo}`);
                    if (attRes.ok) {
                        const data: AttendanceReportData = await attRes.json();
                        htmlContent = generateAttendanceReportHTML(data, config);
                    }
                    break;

                case 'transcript':
                    // Fetch transcript data
                    const trRes = await apiFetch(`/api/reports/transcript?studentId=${selectedStudent}`);
                    if (trRes.ok) {
                        const data = await trRes.json();
                        htmlContent = generateTranscriptHTML(data, config);
                    }
                    break;

                default:
                    console.error('Report type not implemented');
            }

            if (htmlContent) {
                printReport(htmlContent);
            }
        } catch (error) {
            console.error('Failed to generate report:', error);
        } finally {
            setGenerating(false);
        }
    };

    const needsStudent = selectedReport === 'report_card' || selectedReport === 'transcript';
    const needsClass = selectedReport === 'attendance' || selectedReport === 'class_performance';
    const needsDateRange = selectedReport === 'attendance';

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Tạo Báo Cáo</h2>
                        <p className="text-sm text-muted-foreground">Chọn loại báo cáo và thông tin cần thiết</p>
                    </div>
                </div>
            </CardHeader>

            <CardBody>
                {/* Report Type Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-foreground mb-3">
                        Loại báo cáo
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {REPORT_OPTIONS.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => setSelectedReport(option.id)}
                                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${selectedReport === option.id
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50 hover:bg-muted/5'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${selectedReport === option.id
                                    ? 'bg-primary text-white'
                                    : 'bg-muted/10 text-muted-foreground'
                                    }`}>
                                    {option.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-foreground">{option.titleVi}</span>
                                        {selectedReport === option.id && (
                                            <Badge variant="success" size="sm">Đã chọn</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filters based on report type */}
                {selectedReport && (
                    <div className="space-y-4 p-4 bg-muted/5 rounded-xl">
                        {/* Class Selection */}
                        {(needsClass || needsStudent) && (
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Lớp học
                                </label>
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    disabled={loading}
                                >
                                    <option value="">-- Chọn lớp --</option>
                                    {classes.map((cls) => (
                                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Student Selection */}
                        {needsStudent && selectedClass && (
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Học sinh
                                </label>
                                <select
                                    value={selectedStudent}
                                    onChange={(e) => setSelectedStudent(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    <option value="">-- Chọn học sinh --</option>
                                    {students.map((student) => (
                                        <option key={student.id} value={student.id}>
                                            {student.full_name} {student.student_code ? `(${student.student_code})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Date Range */}
                        {needsDateRange && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Từ ngày
                                    </label>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Đến ngày
                                    </label>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Generate Button */}
                        <div className="pt-4">
                            <Button
                                size="lg"
                                fullWidth
                                onClick={generateReport}
                                isLoading={generating}
                                disabled={
                                    !selectedReport ||
                                    (needsStudent && !selectedStudent) ||
                                    (needsClass && !selectedClass)
                                }
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                Tạo và In Báo Cáo
                            </Button>
                        </div>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}

export { ReportGenerator };
