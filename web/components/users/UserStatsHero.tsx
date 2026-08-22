'use client';

import React from 'react';
import { Users, UserCheck, GraduationCap, Award, ShieldCheck, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UserStatsData {
  total_users: number;
  active_users: number;
  inactive_users: number;
  admin_count: number;
  teacher_count: number;
  student_count: number;
  parent_count?: number;
  tutor_count?: number;
  recent_signups?: number;
}

interface UserStatsHeroProps {
  stats: UserStatsData | null;
  loading?: boolean;
}

export function UserStatsHero({ stats, loading }: UserStatsHeroProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-stone-100 dark:bg-stone-900/50 animate-pulse border border-stone-200/60 dark:border-stone-800"
          />
        ))}
      </div>
    );
  }

  const total = stats?.total_users || 0;
  const active = stats?.active_users || 0;
  const activeRate = total > 0 ? Math.round((active / total) * 100) : 100;
  const students = stats?.student_count || 0;
  const teachers = (stats?.teacher_count || 0) + (stats?.tutor_count || 0);
  const adminsAndParents = (stats?.admin_count || 0) + (stats?.parent_count || 0);

  // Distribution calculations
  const studentPct = total > 0 ? Math.round((students / total) * 100) : 0;
  const teacherPct = total > 0 ? Math.round((teachers / total) * 100) : 0;
  const adminParentPct = total > 0 ? Math.max(0, 100 - studentPct - teacherPct) : 0;

  const cards = [
    {
      label: 'Tổng người dùng',
      value: total.toLocaleString('vi-VN'),
      subtext: stats?.recent_signups ? `+${stats.recent_signups} tuần này` : 'Toàn hệ thống',
      icon: Users,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10 dark:bg-amber-500/15',
      borderColor: 'border-amber-500/20',
    },
    {
      label: 'Đang hoạt động',
      value: `${activeRate}%`,
      subtext: `${active.toLocaleString('vi-VN')} tài khoản mở`,
      icon: UserCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      borderColor: 'border-emerald-500/20',
    },
    {
      label: 'Học sinh',
      value: students.toLocaleString('vi-VN'),
      subtext: `${studentPct}% tổng thành viên`,
      icon: GraduationCap,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10 dark:bg-blue-500/15',
      borderColor: 'border-blue-500/20',
    },
    {
      label: 'Giáo viên & Gia sư',
      value: teachers.toLocaleString('vi-VN'),
      subtext: `${teacherPct}% tổng thành viên`,
      icon: Award,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-500/10 dark:bg-teal-500/15',
      borderColor: 'border-teal-500/20',
    },
    {
      label: 'Quản trị & Phụ huynh',
      value: adminsAndParents.toLocaleString('vi-VN'),
      subtext: `${adminParentPct}% tổng thành viên`,
      icon: ShieldCheck,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10 dark:bg-amber-500/15',
      borderColor: 'border-amber-500/20',
    },
  ];

  return (
    <div className="space-y-3.5">
      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={cn(
                'relative p-4 rounded-2xl transition-all duration-200',
                'bg-white dark:bg-[#14120E] border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md hover:border-stone-300 dark:hover:border-stone-700'
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 truncate">
                  {card.label}
                </span>
                <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center shrink-0', card.bgColor)}>
                  <Icon className={cn('w-4 h-4', card.color)} />
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-1">
                <span className="text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                  {card.value}
                </span>
              </div>

              <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500 mt-1 truncate">
                {card.subtext}
              </p>
            </div>
          );
        })}
      </div>

      {/* High-Tech Role Distribution Bar */}
      {total > 0 && (
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#14120E] border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              <span>Phân bổ vai trò thành viên</span>
            </div>
            <div className="flex items-center gap-4 text-[10px]">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Học sinh ({studentPct}%)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-500" /> Giáo viên/Gia sư ({teacherPct}%)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Quản trị & Khác ({adminParentPct}%)
              </span>
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden flex">
            <div
              style={{ width: `${studentPct}%` }}
              className="h-full bg-blue-500 transition-all duration-500"
              title={`Học sinh: ${students}`}
            />
            <div
              style={{ width: `${teacherPct}%` }}
              className="h-full bg-teal-500 transition-all duration-500"
              title={`Giáo viên: ${teachers}`}
            />
            <div
              style={{ width: `${adminParentPct}%` }}
              className="h-full bg-amber-500 transition-all duration-500"
              title={`Quản trị & Phụ huynh: ${adminsAndParents}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
