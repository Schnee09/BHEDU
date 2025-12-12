/**
 * Reports Dashboard
 * 
 * Features:
 * - Overview statistics
 * - Quick reports for students, classes, grades
 * - Export capabilities
 */

"use client";

import { useEffect, useState } from "react";
import { useFetch, useToast } from "@/hooks";
import { apiFetch } from "@/lib/api/client";
import { 
  Button, 
  Card, 
  CardHeader,
  Badge,
  SkeletonStatCard,
} from "@/components/ui";
import { CardBody } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/Card";
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
    title: 'Student Report',
    description: 'Comprehensive student enrollment and demographics report',
    icon: Icons.Students,
    color: 'text-blue-600 bg-blue-100',
    available: true
  },
  {
    id: 'classes',
    title: 'Class Report',
    description: 'Class distribution and teacher assignments',
    icon: Icons.Classes,
    color: 'text-green-600 bg-green-100',
    available: true
  },
  {
    id: 'grades',
    title: 'Academic Report',
    description: 'Grade distribution and academic performance analysis',
    icon: Icons.Grades,
    color: 'text-purple-600 bg-purple-100',
    available: true
  },
  {
    id: 'attendance',
    title: 'Attendance Report',
    description: 'Student attendance patterns and trends',
    icon: Icons.Attendance,
    color: 'text-orange-600 bg-orange-100',
    available: false
  }
];

export default function ReportsPage() {
  const toast = useToast();
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Fetch statistics for overview
  const { data: studentsData, loading: loadingStudents } = useFetch<{
    students: { id: string }[];
    total: number;
    statistics?: { total_students: number; active_students: number; inactive_students: number };
  }>('/api/admin/students?limit=1');
  
  const { data: classesData, loading: loadingClasses } = useFetch<{
    data: { id: string }[];
  }>('/api/admin/classes');
  
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
      toast.warning('Not Available', 'This report type is coming soon');
      return;
    }

    setSelectedReport(type);
    setGeneratingReport(true);

    try {
      let csvContent = '';
      let filename = '';

      if (type === 'students') {
        // Fetch all students for export
        const response = await apiFetch('/api/admin/students?limit=1000');
        if (!response.ok) throw new Error('Failed to fetch students');
        const data = await response.json();
        
        if (data.students) {
          const headers = ["ID", "Full Name", "Email", "Phone", "Grade Level", "Status", "Created At"];
          const rows = data.students.map((s: Record<string, unknown>) => [
            s.id,
            s.full_name || '',
            s.email || '',
            s.phone || '',
            s.grade_level || '',
            s.status || 'active',
            s.created_at ? new Date(s.created_at as string).toLocaleDateString() : ''
          ]);
          
          csvContent = [
            headers.join(","),
            ...rows.map((row: string[]) => row.map(cell => `"${cell}"`).join(","))
          ].join("\n");
          filename = `student_report_${new Date().toISOString().split("T")[0]}.csv`;
        }
      } else if (type === 'classes') {
        const response = await apiFetch('/api/admin/classes');
        if (!response.ok) throw new Error('Failed to fetch classes');
        const data = await response.json();
        
        if (data.data) {
          const headers = ["ID", "Name", "Grade Level", "Academic Year", "Capacity", "Created At"];
          const rows = data.data.map((c: Record<string, unknown>) => [
            c.id,
            c.name || '',
            c.grade_level || '',
            c.academic_year || '',
            c.capacity || '',
            c.created_at ? new Date(c.created_at as string).toLocaleDateString() : ''
          ]);
          
          csvContent = [
            headers.join(","),
            ...rows.map((row: string[]) => row.map(cell => `"${cell}"`).join(","))
          ].join("\n");
          filename = `class_report_${new Date().toISOString().split("T")[0]}.csv`;
        }
      } else if (type === 'grades') {
        const response = await apiFetch('/api/admin/courses');
        const data = await response.json();
        
        if (data.data) {
          const headers = ["ID", "Course Name", "Description", "Has Teacher", "Created At"];
          const rows = data.data.map((c: Record<string, unknown>) => [
            c.id,
            (c.title || c.name || '') as string,
            (c.description || '') as string,
            c.teacher_id ? 'Yes' : 'No',
            c.created_at ? new Date(c.created_at as string).toLocaleDateString() : ''
          ]);
          
          csvContent = [
            headers.join(","),
            ...rows.map((row: string[]) => row.map(cell => `"${cell}"`).join(","))
          ].join("\n");
          filename = `academic_report_${new Date().toISOString().split("T")[0]}.csv`;
        }
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
        
        toast.success('Report Generated', `${reportConfig.title} has been downloaded`);
      }
    } catch (error) {
      toast.error('Error', 'Failed to generate report');
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
            Reports
          </h1>
          <p className="text-stone-500 mt-1">Generate and download comprehensive school reports</p>
        </div>
      </div>

      {/* Overview Statistics */}
      <div>
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Overview</h2>
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
                label="Total Students"
                value={stats.students.total}
                color="blue"
                icon={<Icons.Students className="w-6 h-6" />}
                trend={stats.students.active > 0 ? { value: stats.students.active, isPositive: true } : undefined}
              />
              <StatCard
                label="Classes"
                value={stats.classes.total}
                color="green"
                icon={<Icons.Classes className="w-6 h-6" />}
              />
              <StatCard
                label="Courses"
                value={stats.courses.total}
                color="purple"
                icon={<Icons.Teachers className="w-6 h-6" />}
                trend={stats.courses.withTeacher > 0 ? { value: stats.courses.withTeacher, isPositive: true } : undefined}
              />
              <StatCard
                label="Reports"
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
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Generate Reports</h2>
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
                        <Badge variant="warning">Coming Soon</Badge>
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
                      Generate & Download
                    </>
                  ) : 'Coming Soon'}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader title="Quick Actions" />
        <CardBody>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleGenerateReport('students')}
              disabled={generatingReport}
            >
              <Icons.Download className="w-4 h-4 mr-2" />
              Export All Students
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleGenerateReport('classes')}
              disabled={generatingReport}
            >
              <Icons.Download className="w-4 h-4 mr-2" />
              Export All Classes
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleGenerateReport('grades')}
              disabled={generatingReport}
            >
              <Icons.Download className="w-4 h-4 mr-2" />
              Export All Courses
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
