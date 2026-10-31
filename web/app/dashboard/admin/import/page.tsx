'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, Calendar, Users } from 'lucide-react';
import PageGuard from '@/components/PageGuard';

const workflows = [
  {
    title: 'Hồ sơ học sinh',
    description: 'Kiểm tra file CSV, xem trước dữ liệu và theo dõi lỗi theo từng dòng.',
    action: 'Mở trang nhập học sinh',
    href: '/dashboard/students/import',
    icon: Users,
    accent: 'amber',
  },
  {
    title: 'Điểm số',
    description: 'Chọn lớp, môn học và học kỳ trước khi nhập bảng điểm Excel.',
    action: 'Mở trang nhập điểm',
    href: '/dashboard/grades/entry',
    icon: BookOpen,
    accent: 'blue',
  },
  {
    title: 'Điểm danh buổi học',
    description: 'Ghi nhận trạng thái học sinh theo đúng lớp và buổi học.',
    action: 'Mở trang điểm danh',
    href: '/dashboard/attendance/mark',
    icon: Calendar,
    accent: 'emerald',
  },
] as const;

const accentClasses = {
  amber: {
    card: 'hover:border-amber-400 dark:hover:border-amber-500',
    icon: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    action: 'text-amber-700 dark:text-amber-300',
    ring: 'focus-visible:ring-amber-500',
  },
  blue: {
    card: 'hover:border-blue-400 dark:hover:border-blue-500',
    icon: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
    action: 'text-blue-700 dark:text-blue-300',
    ring: 'focus-visible:ring-blue-500',
  },
  emerald: {
    card: 'hover:border-emerald-400 dark:hover:border-emerald-500',
    icon: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    action: 'text-emerald-700 dark:text-emerald-300',
    ring: 'focus-visible:ring-emerald-500',
  },
} as const;

export default function ImportHubPage() {
  return (
    <PageGuard permissions="users.bulk_import">
      <ImportHub />
    </PageGuard>
  );
}

function ImportHub() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 dark:bg-stone-950 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 border-b border-stone-200 pb-6 dark:border-white/10">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Quản lý dữ liệu
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
            Nhập dữ liệu vào hệ thống
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600 dark:text-stone-300">
            Chọn đúng quy trình để hệ thống kiểm tra đầy đủ thông tin lớp học, phân quyền và lịch sử
            thay đổi trước khi lưu dữ liệu.
          </p>
        </header>

        <section aria-labelledby="import-workflows-heading">
          <h2 id="import-workflows-heading" className="sr-only">
            Các quy trình nhập dữ liệu
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {workflows.map((workflow) => {
              const Icon = workflow.icon;
              const colors = accentClasses[workflow.accent];

              return (
                <button
                  key={workflow.href}
                  type="button"
                  onClick={() => router.push(workflow.href)}
                  className={`group flex min-h-64 cursor-pointer flex-col rounded-2xl border border-stone-200 bg-white p-6 text-left shadow-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-stone-900 dark:focus-visible:ring-offset-stone-950 ${colors.card} ${colors.ring}`}
                >
                  <span
                    className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl ${colors.icon}`}
                  >
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                    {workflow.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-stone-600 dark:text-stone-300">
                    {workflow.description}
                  </p>
                  <span
                    className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold ${colors.action}`}
                  >
                    {workflow.action}
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
