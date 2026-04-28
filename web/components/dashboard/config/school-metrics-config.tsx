import React from 'react';
import { Users, BookOpen, GraduationCap, Clock, CheckCircle2 } from 'lucide-react';

export interface SchoolMetricsData {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  averageGPA: number;
  attendanceRate: number;
  passRate: number;
  trends?: {
    students: number;
    gpa: number;
    attendance: number;
  };
}

export interface MetricItem {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'slate' | 'amber' | 'green' | 'orange';
  trend?: number;
  suffix: string;
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

export function generateSchoolMetrics(data: SchoolMetricsData): MetricItem[] {
  return [
    {
      label: 'Tổng số học sinh',
      value: data.totalStudents,
      icon: <Users className="w-5 h-5" />,
      color: 'blue',
      trend: data.trends?.students,
      suffix: '',
    },
    {
      label: 'Đội ngũ giáo viên',
      value: data.totalTeachers,
      icon: <BookOpen className="w-5 h-5" />,
      color: 'emerald',
      suffix: '',
    },
    {
      label: 'Số lượng lớp học',
      value: data.totalClasses,
      icon: <LayersIcon className="w-5 h-5" />,
      color: 'slate',
      suffix: '',
    },
    {
      label: 'Điểm trung bình (GPA)',
      value: data.averageGPA.toFixed(2),
      icon: <GraduationCap className="w-5 h-5" />,
      color: 'amber',
      trend: data.trends?.gpa,
      suffix: '',
    },
    {
      label: 'Tỷ lệ chuyên cần',
      value: data.attendanceRate.toFixed(1),
      icon: <Clock className="w-5 h-5" />,
      color: 'blue',
      trend: data.trends?.attendance,
      suffix: '%',
    },
    {
      label: 'Tỷ lệ đạt yêu cầu',
      value: data.passRate.toFixed(1),
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'green',
      suffix: '%',
    },
  ];
}
