'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import PageGuard from '@/components/PageGuard';

// --- Types ---
interface ClassDetail {
  id: string;
  name: string;
  room: string | null;
  schedule: string | null;
  status: string;
  capacity: number | null;
  teacher: { id: string; first_name: string; last_name: string; subjects?: { name: string } };
  academic_years: { id: string; name: string };
  _count?: { enrollments: number };
  stats?: {
    averageGrade: number;
    highestGrade: number;
    lowestGrade: number;
    totalEntries: number;
  };
}

interface Student {
  id: string;
  enrollment_date: string;
  status: string;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    student_profiles?: { student_code: string };
  };
}

// --- Sub-components ---
function GradeBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = Math.min(100, (score / max) * 100);
  const color =
    score >= 8
      ? 'from-emerald-400 to-emerald-500'
      : score >= 6.5
        ? 'from-amber-400 to-amber-500'
        : 'from-rose-400 to-rose-500';
  return (
    <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden w-full">
      <div
        className={cn('h-full bg-gradient-to-r rounded-full transition-all duration-1000', color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className={cn('p-5 rounded-2xl border flex flex-col gap-1', color)}>
      <p className="text-xs font-bold uppercase tracking-widest opacity-70">{label}</p>
      <p className="text-3xl font-black">{value}</p>
      {sub && <p className="text-xs opacity-60">{sub}</p>}
    </div>
  );
}

function StudentRow({ s, index }: { s: Student; index: number }) {
  const name = s.student?.full_name ?? `${s.student?.last_name} ${s.student?.first_name}`;
  const code = s.student?.student_profiles?.student_code ?? '—';

  return (
    <div
      className={cn(
        'flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300',
        'bg-white/60 dark:bg-stone-900/40 border border-stone-100 dark:border-white/[0.05]',
        'hover:border-amber-400/30 hover:bg-amber-50/40 dark:hover:bg-amber-900/10',
        'animate-in fade-in slide-in-from-left-3 duration-500'
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
        {name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-stone-900 dark:text-stone-50 truncate">{name}</p>
        <p className="text-xs text-stone-500 dark:text-stone-400">{s.student?.email}</p>
      </div>

      {/* Code badge */}
      <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-xs font-bold text-stone-600 dark:text-stone-300">
        {code}
      </span>
    </div>
  );
}

// --- Main Page ---
export default function TeacherClassDetailPageGuarded() {
  return (
    <PageGuard
      permissions={['attendance.mark', 'grades.entry', 'classes.manage']}
      requireAll={false}
    >
      <TeacherClassDetailPage />
    </PageGuard>
  );
}

function TeacherClassDetailPage() {
  const params = useParams<{ classId: string }>();
  const classId = params.classId;

  const [cls, setCls] = useState<ClassDetail | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!classId) return;
    Promise.all([
      fetch(`/api/teacher/classes/${classId}`).then((r) => r.json()),
      fetch(`/api/teacher/classes/${classId}/students`).then((r) => r.json()),
    ])
      .then(([clsData, stuData]) => {
        if (clsData.success) setCls(clsData.data);
        else setError(clsData.message ?? 'Lỗi tải lớp học');
        if (stuData.success) setStudents(stuData.data ?? []);
      })
      .catch(() => setError('Không thể kết nối máy chủ.'))
      .finally(() => setLoading(false));
  }, [classId]);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const name = s.student?.full_name?.toLowerCase() ?? '';
    const code = s.student?.student_profiles?.student_code?.toLowerCase() ?? '';
    return name.includes(q) || code.includes(q);
  });

  const stats = cls?.stats;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/20 to-stone-100 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-10">
        {/* Back link */}
        <Link
          href={routes.teacher.classes()}
          className="inline-flex items-center gap-2 text-sm font-bold text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors duration-200 group"
        >
          <svg
            className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Lớp dạy của tôi
        </Link>

        {/* Header */}
        {cls && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-2">
              {cls.academic_years?.name} · {cls.teacher?.subjects?.name ?? 'Giáo viên'}
            </p>
            <h1 className="text-3xl md:text-4xl font-black text-stone-900 dark:text-stone-50 tracking-tight">
              {cls.name}
            </h1>
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-stone-500 dark:text-stone-400">
              {cls.room && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  Phòng {cls.room}
                </span>
              )}
              {cls.schedule && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {cls.schedule}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {cls._count?.enrollments ?? 0} học sinh
              </span>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl bg-stone-200/60 dark:bg-stone-800/60 animate-pulse"
                />
              ))}
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-2xl bg-stone-200/60 dark:bg-stone-800/60 animate-pulse"
                />
              ))}
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        {!loading && !error && cls && (
          <>
            {/* Grade Stats */}
            {stats && stats.totalEntries > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                <h2 className="text-sm font-black uppercase tracking-widest text-stone-500 dark:text-stone-400 mb-4 pl-1 border-l-4 border-amber-500 pl-3">
                  Thống kê điểm số
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    label="Điểm TB"
                    value={stats.averageGrade}
                    sub="Toàn lớp"
                    color="bg-amber-50 dark:bg-amber-900/20 border-amber-200/60 dark:border-amber-700/40 text-amber-800 dark:text-amber-200"
                  />
                  <StatCard
                    label="Điểm cao nhất"
                    value={stats.highestGrade}
                    color="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/60 dark:border-emerald-700/40 text-emerald-800 dark:text-emerald-200"
                  />
                  <StatCard
                    label="Điểm thấp nhất"
                    value={stats.lowestGrade}
                    color="bg-rose-50 dark:bg-rose-900/20 border-rose-200/60 dark:border-rose-700/40 text-rose-800 dark:text-rose-200"
                  />
                  <StatCard
                    label="Tổng bài đã chấm"
                    value={stats.totalEntries}
                    color="bg-sky-50 dark:bg-sky-900/20 border-sky-200/60 dark:border-sky-700/40 text-sky-800 dark:text-sky-200"
                  />
                </div>
                {/* Average bar */}
                <div className="mt-4 space-y-2 px-1">
                  <div className="flex justify-between text-xs font-semibold text-stone-500 dark:text-stone-400">
                    <span>Điểm trung bình lớp</span>
                    <span>{stats.averageGrade} / 10</span>
                  </div>
                  <GradeBar score={stats.averageGrade} />
                </div>
              </div>
            )}

            {/* Action links */}
            <div className="flex flex-wrap gap-3 animate-in fade-in duration-700 delay-200">
              <Link
                href={`${routes.grades.entry()}?classId=${cls.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-black transition-all duration-200 shadow-sm hover:shadow-amber-200 dark:hover:shadow-amber-900/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Nhập điểm
              </Link>
              <Link
                href={`${routes.attendance.mark()}?classId=${cls.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-sm font-black hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                Điểm danh
              </Link>
            </div>

            {/* Students section */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-stone-500 dark:text-stone-400 pl-3 border-l-4 border-amber-500">
                  Danh sách học sinh ({students.length})
                </h2>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Tìm học sinh theo tên hoặc mã số..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 transition-colors duration-200"
                />
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-12 text-stone-500 dark:text-stone-400">
                  <p className="font-semibold">Không tìm thấy học sinh</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((s, i) => (
                    <StudentRow key={s.id} s={s} index={i} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
