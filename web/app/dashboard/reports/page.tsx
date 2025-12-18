/**
 * Reports Dashboard
 * 
 * Features:
 * - Overview statistics
 * - Quick reports for students, classes, grades
 * - Export capabilities
 */

"use client";

import { useState, useEffect } from "react";
import { useFetch, useToast } from "@/hooks";
import { apiFetch } from "@/lib/api/client";
import { 
  Button, 
  Card, 
  Badge,
  SkeletonStatCard,
} from "@/components/ui";
import { StatCard, CardBody, CardHeader } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { ToastContainer } from "@/components/ui/Toast";

interface ReportStats {
  students: {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
  };
  classes: {
    total: number;
    activeClasses: number;
  };
  courses: {
    total: number;
    withTeacher: number;
  };
  grades: {
    total: number;
    averageScore: number;
    passing: number;
    failing: number;
  };
}

type ReportType = 'students' | 'classes' | 'grades' | 'attendance';

interface ReportConfig {
  id: ReportType;
  title: string;
  description: string;
  icon: any;
  color: string;
  available: boolean;
}

const reportTypes: ReportConfig[] = [
  {
    id: 'students',
    title: 'Báo cáo học sinh',
    description: 'Báo cáo toàn diện về tuyển sinh và nhân khẩu học học sinh',
    icon: Icons.Students,
    color: 'text-blue-600 bg-blue-100',
    available: true
  },
  {
    id: 'classes',
    title: 'Báo cáo lớp học',
    description: 'Phân bố lớp học và phân công giáo viên',
    icon: Icons.Classes,
    color: 'text-green-600 bg-green-100',
    available: true
  },
  {
    id: 'grades',
    title: 'Báo cáo học tập',
    description: 'Phân bố điểm và phân tích thành tích học tập',
    icon: Icons.Grades,
    color: 'text-purple-600 bg-purple-100',
    available: true
  },
  {
    id: 'attendance',
    title: 'Báo cáo điểm danh',
    description: 'Mô hình và xu hướng điểm danh của học sinh',
    icon: Icons.Attendance,
    color: 'text-orange-600 bg-orange-100',
    available: true
  }
];

export default function ReportsPage() {
  const toast = useToast();
  // Filters
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string }[]>([])
  const [classesList, setClassesList] = useState<any[]>([])
  const [coursesList, setCoursesList] = useState<any[]>([])

  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string | null>(null)
  const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(null)
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string | null>(null)

  // Attendance date range filters
  const [attendanceStart, setAttendanceStart] = useState<string | null>(null)
  const [attendanceEnd, setAttendanceEnd] = useState<string | null>(null)

  useEffect(() => {
    // load academic years, classes, courses for filter selects
    const load = async () => {
      try {
        const ayRes = await apiFetch('/api/admin/academic-years');
        if (ayRes.ok) {
          const ayJson = await ayRes.json().catch(() => null)
          const ay = ayJson?.data || ayJson?.academic_years || []
          setAcademicYears(ay || [])
          if (ay && ay.length > 0) setSelectedAcademicYear(prev => prev || ay[0].id)
        }

        const classesRes = await apiFetch('/api/classes');
        if (classesRes.ok) {
          const cjson = await classesRes.json().catch(() => null)
          const cls = cjson?.data || []
          setClassesList(cls || [])
        }

        const coursesRes = await apiFetch('/api/admin/courses');
        if (coursesRes.ok) {
          const cojson = await coursesRes.json().catch(() => null)
          const cos = cojson?.data || []
          setCoursesList(cos || [])
        }
      } catch (e) {
        console.error('Failed to load filter options', e)
      }
    }
    load()
  }, [])
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Fetch statistics for overview
  const { data: studentsData, loading: loadingStudents } = useFetch<{
    students: { id: string }[];
    total: number;
    statistics?: { total_students: number; active_students: number; inactive_students: number };
  }>('/api/students?limit=1');
  
  const { data: classesData, loading: loadingClasses } = useFetch<{
    data: { id: string }[];
  }>('/api/classes');
  
  const { data: coursesData, loading: loadingCourses } = useFetch<{
    data: { id: string; teacher_id?: string }[];
  }>('/api/admin/courses');

  // Calculate stats
  const stats: ReportStats = {
    students: {
      total: studentsData?.statistics?.total_students || studentsData?.total || 0,
      active: studentsData?.statistics?.active_students || 0,
      inactive: studentsData?.statistics?.inactive_students || 0,
      newThisMonth: 0
    },
    classes: {
      total: classesData?.data?.length || 0,
      activeClasses: classesData?.data?.length || 0
    },
    courses: {
      total: coursesData?.data?.length || 0,
      withTeacher: coursesData?.data?.filter(c => c.teacher_id)?.length || 0
    },
    grades: {
      total: 0,
      averageScore: 0,
      passing: 0,
      failing: 0
    }
  };

  const loading = loadingStudents || loadingClasses || loadingCourses;

  // Generate report
  const handleGenerateReport = async (type: ReportType) => {
    const reportConfig = reportTypes.find(r => r.id === type);
    if (!reportConfig?.available) {
      toast.warning('Không khả dụng', 'Loại báo cáo này sắp có');
      return;
    }

    setSelectedReport(type);
    setGeneratingReport(true);

    try {
      let csvContent = '';
      let filename = '';

      // Build shared query params for server reports
      const params = new URLSearchParams()
      params.set('format', 'csv')
      if (selectedAcademicYear) params.set('academic_year_id', selectedAcademicYear)
      if (selectedClassFilter) params.set('class_id', selectedClassFilter)
      if (selectedCourseFilter) params.set('course_id', selectedCourseFilter)

      if (type === 'students') {
        // Server-side CSV export to avoid client fetching large datasets
        const url = `/api/reports/students?${params.toString()}`
        const response = await apiFetch(url)
        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Failed to generate report' }))
          throw new Error(err.error || 'Failed to generate report')
        }

        const blob = await response.blob()
        const contentDisposition = response.headers.get('Content-Disposition') || ''
        const inferredName = contentDisposition.match(/filename="?([^";]+)"?/)?.[1]
        filename = inferredName || `student_report_${new Date().toISOString().split('T')[0]}.csv`
        const urlObj = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', urlObj)
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(urlObj)
      } else if (type === 'classes') {
        const response = await apiFetch('/api/classes');
        if (!response.ok) throw new Error('Không thể tải danh sách lớp');
        const data = await response.json();

        const classes = data?.data || data?.classes;
        if (Array.isArray(classes)) {
          const headers = ["ID", "Name", "Grade Level", "Academic Year", "Capacity", "Created At"];
          const rows: string[][] = classes.map((c: Record<string, unknown>) => {
            const createdAt = c.created_at ? new Date(String(c.created_at)).toLocaleDateString('vi-VN') : '';
            return [
              String(c.id ?? ''),
              String(c.name ?? ''),
              String(c.grade_level ?? ''),
              String(c.academic_year ?? ''),
              String(c.capacity ?? ''),
              createdAt,
            ];
          });
          
          csvContent = [
            headers.join(","),
            ...rows.map((row: string[]) => row.map(cell => `"${cell}"`).join(","))
          ].join("\n");
          filename = `class_report_${new Date().toISOString().split("T")[0]}.csv`;
        }
      } else if (type === 'grades') {
        // Use server-side grades report CSV export, include filters
        const url = `/api/reports/grades?${params.toString()}`
        const response = await apiFetch(url)
        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Failed to generate report' }))
          throw new Error(err.error || 'Failed to generate report')
        }

        const blob = await response.blob()
        const contentDisposition = response.headers.get('Content-Disposition') || ''
        const inferredName = contentDisposition.match(/filename="?([^";]+)"?/)?.[1]
        filename = inferredName || `grades_report_${new Date().toISOString().split('T')[0]}.csv`
        const urlObj = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', urlObj)
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(urlObj)
      } else if (type === 'attendance') {
        // Attendance report uses date range filters plus the shared filters
        if (attendanceStart) params.set('date_from', attendanceStart)
        if (attendanceEnd) params.set('date_to', attendanceEnd)
        const url = `/api/reports/attendance?${params.toString()}`
        const response = await apiFetch(url)
        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Failed to generate report' }))
          throw new Error(err.error || 'Failed to generate report')
        }

        const blob = await response.blob()
        const contentDisposition = response.headers.get('Content-Disposition') || ''
        const inferredName = contentDisposition.match(/filename="?([^";]+)"?/)?.[1]
        filename = inferredName || `attendance_report_${new Date().toISOString().split('T')[0]}.csv`
        const urlObj = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', urlObj)
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(urlObj)
      }
      if (csvContent && filename) {
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Đã tạo báo cáo', `${reportConfig.title} đã được tải xuống`);
      }
    } catch (error) {
      toast.error('Lỗi', 'Không thể tạo báo cáo');
      console.error('Report generation error:', error);
    } finally {
      setGeneratingReport(false);
      setSelectedReport(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Icons.Chart className="w-8 h-8 text-stone-600" />
            Báo cáo
          </h1>
          <p className="text-stone-500 mt-1">Tạo và tải xuống báo cáo toàn diện của trường</p>
        </div>
      </div>

      {/* Overview Statistics */}
      <div>
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Tổng quan</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {loading ? (
            <>
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
            </>
          ) : (
            <>
              <StatCard
                label="Tổng số học sinh"
                value={stats.students.total}
                color="blue"
                icon={<Icons.Students className="w-6 h-6" />}
                trend={stats.students.active > 0 ? { value: stats.students.active, isPositive: true } : undefined}
              />
              <StatCard
                label="Lớp học"
                value={stats.classes.total}
                color="green"
                icon={<Icons.Classes className="w-6 h-6" />}
              />
              <StatCard
                label="Môn học"
                value={stats.courses.total}
                color="purple"
                icon={<Icons.Teachers className="w-6 h-6" />}
                trend={stats.courses.withTeacher > 0 ? { value: stats.courses.withTeacher, isPositive: true } : undefined}
              />
              <StatCard
                label="Báo cáo"
                value={reportTypes.filter(r => r.available).length}
                color="slate"
                icon={<Icons.Chart className="w-6 h-6" />}
              />
            </>
          )}
        </div>
      </div>

      {/* Report Types */}
      <div>
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Tạo báo cáo</h2>
        {/* Filters */}
        <Card className="mb-4">
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm text-stone-600 mb-1">Năm học</label>
                <select
                  value={selectedAcademicYear ?? ''}
                  onChange={(e) => setSelectedAcademicYear(e.target.value || null)}
                  className="w-full border rounded px-2 py-1"
                >
                  {academicYears.map(ay => (
                    <option key={ay.id} value={ay.id}>{ay.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-stone-600 mb-1">Lớp</label>
                <select
                  value={selectedClassFilter ?? ''}
                  onChange={(e) => setSelectedClassFilter(e.target.value || null)}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="">Tất cả</option>
                  {classesList.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-stone-600 mb-1">Môn học</label>
                <select
                  value={selectedCourseFilter ?? ''}
                  onChange={(e) => setSelectedCourseFilter(e.target.value || null)}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="">Tất cả</option>
                  {coursesList.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-stone-600 mb-1">Khoảng thời gian điểm danh</label>
                <div className="flex gap-2">
                  <input type="date" value={attendanceStart ?? ''} onChange={e => setAttendanceStart(e.target.value || null)} className="border rounded px-2 py-1 w-1/2" />
                  <input type="date" value={attendanceEnd ?? ''} onChange={e => setAttendanceEnd(e.target.value || null)} className="border rounded px-2 py-1 w-1/2" />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportTypes.map((report) => (
            <Card 
              key={report.id} 
              className={`relative ${!report.available ? 'opacity-60' : ''}`}
            >
              <CardBody>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${report.color}`}>
                    <report.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-stone-900">{report.title}</h3>
                      {!report.available && (
                        <Badge variant="warning">Sắp có</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-stone-600 mb-4">{report.description}</p>
                <Button
                  onClick={() => handleGenerateReport(report.id)}
                  disabled={!report.available || generatingReport}
                  isLoading={selectedReport === report.id && generatingReport}
                  variant={report.available ? "primary" : "outline"}
                  className="w-full"
                >
                  {report.available ? (
                    <>
                      <Icons.Download className="w-4 h-4 mr-2" />
                      Tạo & Tải xuống
                    </>
                  ) : 'Sắp có'}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Hành động nhanh</h3>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleGenerateReport('students')}
              disabled={generatingReport}
            >
              <Icons.Download className="w-4 h-4 mr-2" />
              Xuất tất cả học sinh
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleGenerateReport('classes')}
              disabled={generatingReport}
            >
              <Icons.Download className="w-4 h-4 mr-2" />
              Xuất tất cả lớp học
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleGenerateReport('grades')}
              disabled={generatingReport}
            >
              <Icons.Download className="w-4 h-4 mr-2" />
              Xuất tất cả môn học
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
