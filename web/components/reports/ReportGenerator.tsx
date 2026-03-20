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
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import {
  FileText,
  ClipboardCheck,
  BookOpen,
  Users,
  Printer,
  Calendar,
  ChevronRight,
  Search,
} from 'lucide-react';
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
import { logger } from '@/lib/logger';
import { usePerformanceMonitor } from '@/lib/performanceMonitor';

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
    description: 'Bảng điểm cá nhân của học sinh theo từng học kỳ cụ thể.',
    icon: <FileText className="w-6 h-6" />,
  },
  {
    id: 'attendance',
    title: 'Attendance Report',
    titleVi: 'Điểm Danh',
    description: 'Thống kê tình trạng chuyên cần và đi học muộn.',
    icon: <ClipboardCheck className="w-6 h-6" />,
  },
  {
    id: 'transcript',
    title: 'Transcript',
    titleVi: 'Bảng Điểm',
    description: 'Tổng hợp kết quả học tập toàn khóa của học sinh.',
    icon: <BookOpen className="w-6 h-6" />,
  },
  {
    id: 'class_performance',
    title: 'Class Performance',
    titleVi: 'Báo Cáo Lớp',
    description: 'Phân tích hiệu suất học tập của toàn bộ lớp học.',
    icon: <Users className="w-6 h-6" />,
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
    return d.toISOString().split('T')[0] ?? '';
  });
  const [dateTo, setDateTo] = useState<string>(() => new Date().toISOString().split('T')[0] ?? '');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Performance monitoring
  usePerformanceMonitor('ReportGenerator');

  // Load classes on mount
  useEffect(() => {
    loadClasses();
    logger.info('ReportGenerator mounted');
  }, []);

  // Load students when class changes
  useEffect(() => {
    if (selectedClass) {
      loadStudents(selectedClass);
      logger.debug('Class selected for reports', { classId: selectedClass });
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

    logger.info('Starting report generation', { type: selectedReport, classId: selectedClass });
    setGenerating(true);
    const startTime = performance.now();
    try {
      // Fetch school settings
      let schoolName = 'TRUNG TÂM GIÁO DỤC BÙI HOÀNG';
      let academicYear = '2024-2025';

      try {
        const settingsRes = await apiFetch('/api/settings?category=school');
        if (settingsRes.ok) {
          const { settings } = await settingsRes.json();
          if (settings.school_name) schoolName = settings.school_name;
        }

        const academicRes = await apiFetch('/api/settings?key=academic_year');
        if (academicRes.ok) {
          const { settings } = await academicRes.json();
          if (settings.academic_year) academicYear = settings.academic_year;
        }
      } catch {
        // Use defaults if settings fetch fails
      }

      const config: ReportConfig = {
        title: REPORT_OPTIONS.find((r) => r.id === selectedReport)?.titleVi || '',
        schoolName,
        academicYear,
        generatedAt: new Date(),
      };

      let htmlContent = '';

      switch (selectedReport) {
        case 'report_card':
          // Fetch student report card data
          const rcRes = await apiFetch(
            `/api/reports/report-card?studentId=${selectedStudent}&dateFrom=${dateFrom}&dateTo=${dateTo}`
          );
          if (rcRes.ok) {
            const data: ReportCardData = await rcRes.json();
            htmlContent = generateReportCardHTML(data, config);
          }
          break;

        case 'attendance':
          // Fetch attendance data
          const attRes = await apiFetch(
            `/api/reports/attendance?classId=${selectedClass}&dateFrom=${dateFrom}&dateTo=${dateTo}`
          );
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
        toast.success('Báo cáo đã sẵn sàng để in');
      } else {
        toast.error('Không tìm thấy dữ liệu cho báo cáo này');
        logger.warn('Empty report data', { type: selectedReport });
      }

      const duration = performance.now() - startTime;
      logger.info('Report generated successfully', { type: selectedReport, duration });
    } catch (error) {
      console.error('Failed to generate report:', error);
      logger.error('Failed to generate report', error, { type: selectedReport });
      toast.error('Lỗi khi tạo báo cáo. Vui lòng thử lại.');
    } finally {
      setGenerating(false);
    }
  };

  const needsStudent = selectedReport === 'report_card' || selectedReport === 'transcript';
  const needsClass = selectedReport === 'attendance' || selectedReport === 'class_performance';
  const needsDateRange = selectedReport === 'attendance';

  return (
    <Card className="glass-premium rounded-[40px] border border-white/20 dark:border-white/5 shadow-2xl shadow-stone-500/10 overflow-hidden">
      <CardHeader className="p-8 border-b border-white/10">
        <div className="flex items-center gap-5">
          <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Printer className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
              Hệ Thống Báo Cáo
            </h2>
            <p className="text-sm font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mt-1">
              Xuất dữ liệu học tập và điểm danh chuyên nghiệp
            </p>
          </div>
        </div>
      </CardHeader>

      <CardBody className="p-8">
        {/* Report Type Selection */}
        <div className="mb-10">
          <label className="block text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] mb-4">
            1. Chọn loại báo cáo
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REPORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedReport(option.id)}
                className={cn(
                  'group relative flex items-start gap-5 p-6 rounded-[32px] border-2 text-left transition-all duration-300',
                  selectedReport === option.id
                    ? 'border-amber-500 bg-amber-500/5 ring-4 ring-amber-500/10'
                    : 'border-stone-100 dark:border-white/5 hover:border-amber-500/30 hover:bg-stone-50/50 dark:hover:bg-white/5'
                )}
              >
                <div
                  className={cn(
                    'p-4 rounded-2xl transition-all duration-300',
                    selectedReport === option.id
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                      : 'bg-stone-100 dark:bg-white/5 text-stone-400 dark:text-stone-500 group-hover:bg-amber-500/10 group-hover:text-amber-500'
                  )}
                >
                  {option.icon}
                </div>
                <div className="flex-1 pr-6">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-stone-900 dark:text-white uppercase tracking-tight">
                      {option.titleVi}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mt-2 line-clamp-2 leading-relaxed">
                    {option.description}
                  </p>
                </div>
                {selectedReport === option.id && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2">
                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filters based on report type */}
        {selectedReport && (
          <div className="animate-fade-in-up space-y-8 p-8 bg-stone-50/50 dark:bg-white/5 rounded-[32px] border border-stone-100 dark:border-white/10">
            <label className="block text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">
              2. Cấu hình thông tin
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Class Selection */}
              {(needsClass || needsStudent) && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-black text-stone-700 dark:text-stone-200 uppercase tracking-tight">
                    <Users className="w-4 h-4 text-amber-500" />
                    Lớp học
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-stone-200 dark:border-white/10 bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-bold focus:outline-none focus:border-amber-500 transition-all appearance-none cursor-pointer"
                    disabled={loading}
                  >
                    <option value="">-- Chọn lớp --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Student Selection */}
              {needsStudent && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-black text-stone-700 dark:text-stone-200 uppercase tracking-tight">
                    <Search className="w-4 h-4 text-amber-500" />
                    Học sinh
                  </label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-stone-200 dark:border-white/10 bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-bold focus:outline-none focus:border-amber-500 transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedClass}
                  >
                    <option value="">-- Chọn học sinh --</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.full_name}{' '}
                        {student.student_code ? `(${student.student_code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date Range */}
              {needsDateRange && (
                <>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-black text-stone-700 dark:text-stone-200 uppercase tracking-tight">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      Từ ngày
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border-2 border-stone-200 dark:border-white/10 bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-bold focus:outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-black text-stone-700 dark:text-stone-200 uppercase tracking-tight">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      Đến ngày
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border-2 border-stone-200 dark:border-white/10 bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-bold focus:outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Generate Button */}
            <div className="pt-6 border-t border-stone-200 dark:border-white/10">
              <Button
                size="lg"
                className="w-full py-8 rounded-[24px] bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all"
                onClick={generateReport}
                isLoading={generating}
                disabled={
                  !selectedReport ||
                  (needsStudent && !selectedStudent) ||
                  (needsClass && !selectedClass)
                }
              >
                <Printer className="w-6 h-6 mr-3" />
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
