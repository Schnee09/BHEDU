'use client';

import React from 'react';
import { Users, GraduationCap, Award, BookOpen, ShieldCheck, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserStatsData } from './UserStatsHero';

interface UserRoleTabsProps {
  activeTab: string;
  onTabChange: (role: string) => void;
  stats: UserStatsData | null;
}

export function UserRoleTabs({ activeTab, onTabChange, stats }: UserRoleTabsProps) {
  const tabs = [
    {
      id: 'all',
      label: 'Tất cả',
      icon: Users,
      count: stats?.total_users,
    },
    {
      id: 'student',
      label: 'Học sinh',
      icon: GraduationCap,
      count: stats?.student_count,
    },
    {
      id: 'teacher',
      label: 'Giáo viên',
      icon: Award,
      count: stats?.teacher_count,
    },
    {
      id: 'tutor',
      label: 'Gia sư',
      icon: BookOpen,
      count: stats?.tutor_count,
    },
    {
      id: 'parent',
      label: 'Phụ huynh',
      icon: Heart,
      count: stats?.parent_count,
    },
    {
      id: 'admin',
      label: 'Quản trị viên',
      icon: ShieldCheck,
      count: stats?.admin_count,
    },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-stone-200 dark:border-stone-800">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const hasCount = tab.count !== undefined;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all -mb-px shrink-0 cursor-pointer border',
              isActive
                ? 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 shadow-sm'
                : 'bg-transparent text-stone-600 dark:text-stone-400 border-transparent hover:bg-stone-100 dark:hover:bg-[#1C1A16] hover:text-stone-900 dark:hover:text-stone-200'
            )}
          >
            <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-amber-500' : 'text-stone-400')} />
            <span>{tab.label}</span>
            {hasCount && (
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-black',
                  isActive
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                )}
              >
                {tab.count?.toLocaleString('vi-VN')}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
