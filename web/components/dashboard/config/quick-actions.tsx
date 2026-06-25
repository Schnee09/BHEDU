import React from 'react';
import { Icons } from '@/components/ui/Icons';
import { routes } from '@/lib/routes';
import { DashboardColor } from '../styles/color-variants';

export interface QuickActionItem {
  href: string;
  icon: React.ReactNode;
  title: string;
  color: DashboardColor;
}

export const adminQuickActions: QuickActionItem[] = [
  {
    href: routes.students.list(),
    icon: <Icons.Students />,
    title: 'Học sinh',
    color: 'orange',
  },
  {
    href: routes.users.list(),
    icon: <Icons.Teachers />,
    title: 'Giảng viên',
    color: 'emerald',
  },
  {
    href: routes.classes.list(),
    icon: <Icons.Classes />,
    title: 'Lớp học',
    color: 'green',
  },
  {
    href: '/dashboard/settings',
    icon: <Icons.Settings />,
    title: 'Cài đặt',
    color: 'slate',
  },
];

export const teacherQuickActions: QuickActionItem[] = [
  {
    href: routes.teacher.classes(),
    icon: <Icons.Classes />,
    title: 'Lớp dạy',
    color: 'blue',
  },
  {
    href: routes.grades?.list?.() || '/dashboard/grades',
    icon: <Icons.Grades />,
    title: 'Nhập điểm',
    color: 'emerald',
  },
  {
    href: routes.attendance.mark(),
    icon: <Icons.Attendance />,
    title: 'Điểm danh',
    color: 'orange',
  },
  {
    href: routes.timetable.mySchedule(),
    icon: <Icons.Calendar />,
    title: 'Lịch dạy',
    color: 'amber',
  },
];

export const studentQuickActions: QuickActionItem[] = [
  {
    href: routes.grades.transcripts(),
    icon: <Icons.Grades />,
    title: 'Học bạ',
    color: 'emerald',
  },
  {
    href: routes.attendance.history(),
    icon: <Icons.Attendance />,
    title: 'Điểm danh',
    color: 'orange',
  },
  {
    href: routes.timetable.mySchedule(),
    icon: <Icons.Calendar />,
    title: 'Thời khóa biểu',
    color: 'blue',
  },
  {
    href: routes.profile(),
    icon: <Icons.Users />,
    title: 'Hồ sơ',
    color: 'slate',
  },
];

export const tutorQuickActions: QuickActionItem[] = [
  {
    href: routes.tutor.students(),
    icon: <Icons.Students />,
    title: 'Học sinh kèm',
    color: 'blue',
  },
  {
    href: routes.timetable.mySchedule(),
    icon: <Icons.Calendar />,
    title: 'Lịch kèm',
    color: 'amber',
  },
  {
    href: routes.grades.list(),
    icon: <Icons.Grades />,
    title: 'Kết quả',
    color: 'emerald',
  },
  {
    href: routes.profile(),
    icon: <Icons.Users />,
    title: 'Hồ sơ',
    color: 'slate',
  },
];
