'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

interface ClassItem {
  id: string;
  name: string;
  room: string | null;
  schedule: string | null;
  status: string;
  capacity: number | null;
  teacher: {
    id: string;
    first_name: string;
    last_name: string;
    subjects?: { id: string; name: string; code: string };
  };
  academic_years: { id: string; name: string };
  _count?: { enrollments: number };
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: 'amber' | 'emerald' | 'sky' | 'rose';
}) {
  const colors = {
    amber:
      'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200/60 dark:border-amber-700/40',
    emerald:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-700/40',
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border-sky-200/60 dark:border-sky-700/40',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200/60 dark:border-rose-700/40',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border',
        colors[color]
      )}
    >
      <span className="font-black text-sm">{value}</span>
      <span className="opacity-70">{label}</span>
    </span>
  );
}

function ClassCard({ cls }: { cls: ClassItem }) {
  const subject = cls.teacher?.subjects?.name ?? 'Môn học';
  const studentCount = cls._count?.enrollments ?? 0;
  const capacity = cls.capacity ?? '—';
  const fillPct = cls.capacity
    ? Math.min(100, Math.round((studentCount / cls.capacity) * 100))
    : null;

  return (
    <Link
      href={routes.teacher.classDetail(cls.id)}
      className={cn(
        'group relative flex flex-col gap-5 p-6 rounded-[28px]',
        'bg-white/70 dark:bg-stone-900/50 backdrop-blur-xl',
        'border border-stone-200/60 dark:border-white/[0.06]',
        'shadow-sm hover:shadow-[0_20px_60px_-20px_rgba(245,158,11,0.18)]',
        'transition-all duration-500 hover:-translate-y-1',
        'hover:border-amber-400/40',
        'overflow-hidden cursor-pointer'
      )}
    >
      {/* Amber glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[28px] bg-gradient-to-br from-amber-400/5 via-transparent to-transparent" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                'inline-block w-2 h-2 rounded-full flex-shrink-0',
                cls.status === 'active' ? 'bg-emerald-500' : 'bg-stone-400'
              )}
            />
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400">
              {cls.academic_years?.name ?? 'Năm học'}
            </span>
          </div>
          <h3 className="text-xl font-black text-stone-900 dark:text-stone-50 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-300">
            {cls.name}
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">{subject}</p>
        </div>

        {/* Arrow indicator */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors duration-300">
          <svg
            className="w-4 h-4 text-stone-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Info pills */}
      <div className="flex flex-wrap gap-2">
        <StatPill label="học sinh" value={studentCount} color="sky" />
        {cls.room && <StatPill label="phòng" value={cls.room} color="amber" />}
        {cls.schedule && <StatPill label="" value={cls.schedule} color="emerald" />}
      </div>

      {/* Capacity bar */}
      {fillPct !== null && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>Sĩ số</span>
            <span className="font-semibold">
              {studentCount}/{capacity}
            </span>
          </div>
          <div className="h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-1000"
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
      <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-amber-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>
      <div>
        <p className="font-black text-xl text-stone-800 dark:text-stone-100">
          Chưa có lớp được phân công
        </p>
        <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
          Liên hệ quản trị viên để được phân lớp dạy.
        </p>
      </div>
    </div>
  );
}

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/teacher/classes')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setClasses(d.data);
        else setError(d.message ?? 'Lỗi tải dữ liệu');
      })
      .catch(() => setError('Không thể kết nối máy chủ.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/20 to-stone-100 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 space-y-10">
        {/* Page Header */}
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-2">
                Giáo viên
              </p>
              <h1 className="text-3xl md:text-4xl font-black text-stone-900 dark:text-stone-50 tracking-tight">
                Lớp dạy của tôi
              </h1>
              <p className="text-stone-500 dark:text-stone-400 mt-1">
                {!loading && !error ? `${classes.length} lớp đang phụ trách` : 'Đang tải...'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-52 rounded-[28px] bg-stone-200/60 dark:bg-stone-800/60 animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        {!loading && !error && classes.length === 0 && <EmptyState />}

        {!loading && !error && classes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {classes.map((cls) => (
              <ClassCard key={cls.id} cls={cls} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
