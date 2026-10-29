'use client';

import Link from 'next/link';
import { useProfile } from '@/hooks/useProfile';
import { usePermissions } from '@/hooks/usePermissions';
import { Icons } from '@/components/ui/Icons';
import AnnouncementsFeedWidget from '@/components/dashboard/widgets/AnnouncementsFeedWidget';
import StudentRequestWidget from '@/components/dashboard/widgets/StudentRequestWidget';
import type { PermissionCode } from '@/lib/auth/core';

const operationalActions: Array<{
  href: string;
  title: string;
  description: string;
  permission: PermissionCode;
  icon: typeof Icons.Students;
  color: string;
}> = [
  {
    href: '/dashboard/admin/reception',
    title: 'Tra cứu học sinh',
    description: 'Tìm nhanh hồ sơ, lớp đang học và tình trạng học phí.',
    permission: 'students.view',
    icon: Icons.Search,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    href: '/dashboard/students',
    title: 'Hồ sơ học sinh',
    description: 'Kiểm tra và cập nhật thông tin học sinh.',
    permission: 'students.view',
    icon: Icons.Students,
    color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  {
    href: '/dashboard/attendance/history',
    title: 'Chuyên cần',
    description: 'Theo dõi lịch sử điểm danh và các trường hợp cần xử lý.',
    permission: 'attendance.view',
    icon: Icons.Attendance,
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    href: '/dashboard/admin/finance',
    title: 'Thu học phí',
    description: 'Kiểm tra công nợ, khoản thu và đối soát thanh toán.',
    permission: 'finance.view',
    icon: Icons.Finance,
    color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  },
  {
    href: '/dashboard/admin/enrollments',
    title: 'Đăng ký lớp',
    description: 'Tiếp nhận và theo dõi việc xếp lớp cho học sinh.',
    permission: 'enrollments.view',
    icon: Icons.Classes,
    color: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
  },
  {
    href: '/dashboard/timetable',
    title: 'Lịch học',
    description: 'Tra cứu lịch lớp, phòng học và giáo viên phụ trách.',
    permission: 'timetable.view',
    icon: Icons.Calendar,
    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  },
];

export default function StaffDashboard() {
  const { profile } = useProfile();
  const { can, loading } = usePermissions();
  const visibleActions = operationalActions.filter((action) => can(action.permission));

  return (
    <main className="min-h-screen bg-transparent overflow-x-hidden">
      <div className="mx-auto max-w-[1600px] space-y-5 px-3 py-4 sm:px-5 sm:py-6 lg:px-6">
        <header className="flex flex-col gap-2 border-b border-stone-200/70 pb-4 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-1.5 rounded-full bg-amber-500" />
            <h1 className="text-xl font-black tracking-tight text-stone-900 dark:text-stone-100 sm:text-2xl">
              Công việc hôm nay
            </h1>
          </div>
          <p className="pl-4 text-sm font-medium text-stone-600 dark:text-stone-400">
            Xin chào {profile?.full_name || 'bạn'}, chọn công việc cần xử lý để bắt đầu.
          </p>
        </header>

        <section aria-labelledby="staff-actions-title" className="space-y-3">
          <div>
            <h2
              id="staff-actions-title"
              className="text-sm font-black uppercase tracking-wider text-stone-900 dark:text-stone-100"
            >
              Tác vụ thường dùng
            </h2>
            <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
              Hệ thống chỉ hiển thị những chức năng bạn được phân quyền.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-2xl border border-stone-200 bg-stone-100 dark:border-white/5 dark:bg-white/5"
                />
              ))}
            </div>
          ) : visibleActions.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex min-h-28 items-start gap-3 rounded-2xl border border-stone-200/80 bg-white/85 p-4 shadow-xs transition-colors duration-200 hover:border-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 dark:border-white/5 dark:bg-stone-900/70 dark:hover:border-amber-500/60"
                  >
                    <span className={`rounded-xl p-2.5 ${action.color}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2 font-black text-stone-900 dark:text-white">
                        {action.title}
                        <Icons.ChevronRight
                          className="h-4 w-4 shrink-0 text-stone-400 transition-colors group-hover:text-amber-600"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="mt-1.5 block text-xs leading-5 text-stone-600 dark:text-stone-400">
                        {action.description}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-stone-200 bg-white/80 p-5 text-sm text-stone-600 dark:border-white/5 dark:bg-stone-900/70 dark:text-stone-400">
              Tài khoản chưa được cấp tác vụ vận hành. Vui lòng liên hệ quản trị viên để kiểm tra
              quyền truy cập.
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 gap-4 pb-10 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <StudentRequestWidget />
          </div>
          <div className="xl:col-span-5">
            <AnnouncementsFeedWidget />
          </div>
        </div>
      </div>
    </main>
  );
}
