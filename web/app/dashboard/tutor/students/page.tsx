'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

interface TutoringStudent {
  student_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  student_code: string | null;
  sessions_today: number;
  sessions_total: number;
  days: string[]; // day names
}

// Timetable slot shape from API
interface TimetableSlot {
  student_id: string;
  day_of_week: number;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    student_profiles?: { student_code: string }[];
  };
}

const DAY_NAMES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function aggregateStudents(slots: TimetableSlot[]): TutoringStudent[] {
  const jsDay = new Date().getDay();
  const todayIdx = jsDay === 0 ? 6 : jsDay - 1;

  const map = new Map<string, TutoringStudent>();
  for (const slot of slots) {
    if (!slot.student_id || !slot.student) continue;
    const s = slot.student;
    const id = slot.student_id;
    const code = s.student_profiles?.[0]?.student_code ?? null;

    if (!map.has(id)) {
      map.set(id, {
        student_id: id,
        first_name: s.first_name,
        last_name: s.last_name,
        full_name: s.full_name ?? `${s.last_name} ${s.first_name}`,
        email: s.email,
        student_code: code,
        sessions_today: 0,
        sessions_total: 0,
        days: [],
      });
    }
    const entry = map.get(id)!;
    entry.sessions_total += 1;
    if (slot.day_of_week === todayIdx) entry.sessions_today += 1;
    const dayLabel = DAY_NAMES[slot.day_of_week];
    if (dayLabel && !entry.days.includes(dayLabel)) entry.days.push(dayLabel);
  }
  // Sort days
  for (const [, v] of map) {
    v.days.sort((a, b) => DAY_NAMES.indexOf(a) - DAY_NAMES.indexOf(b));
  }
  return Array.from(map.values()).sort((a, b) => a.full_name.localeCompare(b.full_name));
}

function StudentCard({ s, index }: { s: TutoringStudent; index: number }) {
  const initials = (s.full_name ?? '?')
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  const gradients = [
    'from-amber-300 to-orange-400',
    'from-emerald-300 to-teal-400',
    'from-sky-300 to-blue-400',
    'from-yellow-300 to-amber-500',
    'from-rose-300 to-pink-400',
  ];
  const grad = gradients[index % gradients.length];

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-4 p-6 rounded-[28px]',
        'bg-white/70 dark:bg-stone-900/50 backdrop-blur-xl',
        'border border-stone-200/60 dark:border-white/[0.06]',
        'shadow-sm hover:shadow-[0_20px_60px_-20px_rgba(245,158,11,0.15)]',
        'transition-all duration-500 hover:-translate-y-1',
        'overflow-hidden',
        'animate-in fade-in slide-in-from-bottom-4 duration-500'
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[28px] bg-gradient-to-br from-amber-400/5 via-transparent to-transparent" />

      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-sm',
            grad
          )}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-stone-900 dark:text-stone-50 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-300">
            {s.full_name}
          </p>
          {s.student_code && (
            <p className="text-xs font-semibold text-stone-400 dark:text-stone-500">
              {s.student_code}
            </p>
          )}
        </div>
        {s.sessions_today > 0 && (
          <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-700/40">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Hôm nay
          </span>
        )}
      </div>

      {/* Schedule days */}
      <div className="flex flex-wrap gap-1.5">
        {DAY_NAMES.map((day) => (
          <span
            key={day}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-bold transition-colors duration-200',
              s.days.includes(day)
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-600'
            )}
          >
            {day}
          </span>
        ))}
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-800">
        <div className="text-sm text-stone-500 dark:text-stone-400">
          <span className="font-black text-stone-800 dark:text-stone-100">{s.sessions_total}</span>
          <span className="ml-1">buổi/tuần</span>
        </div>
        <a
          href={`mailto:${s.email}`}
          className="text-xs font-semibold text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors duration-200 truncate max-w-[160px]"
          onClick={(e) => e.stopPropagation()}
        >
          {s.email}
        </a>
      </div>
    </div>
  );
}

function SummaryBar({ students }: { students: TutoringStudent[] }) {
  const totalStudents = students.length;
  const todayCount = students.filter((s) => s.sessions_today > 0).length;
  const totalSessions = students.reduce((acc, s) => acc + s.sessions_total, 0);

  return (
    <div className="grid grid-cols-3 gap-4">
      {[
        {
          label: 'Học sinh kèm',
          value: totalStudents,
          color:
            'bg-sky-50 dark:bg-sky-900/20 border-sky-200/60 dark:border-sky-700/40 text-sky-800 dark:text-sky-200',
        },
        {
          label: 'Buổi hôm nay',
          value: todayCount,
          color:
            'bg-amber-50 dark:bg-amber-900/20 border-amber-200/60 dark:border-amber-700/40 text-amber-800 dark:text-amber-200',
        },
        {
          label: 'Tổng buổi/tuần',
          value: totalSessions,
          color:
            'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/60 dark:border-emerald-700/40 text-emerald-800 dark:text-emerald-200',
        },
      ].map(({ label, value, color }) => (
        <div key={label} className={cn('p-4 rounded-2xl border text-center', color)}>
          <p className="text-3xl font-black">{value}</p>
          <p className="text-xs font-bold uppercase tracking-wider opacity-70 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

export default function TutorStudentsPage() {
  const [students, setStudents] = useState<TutoringStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterToday, setFilterToday] = useState(false);

  useEffect(() => {
    fetch('/api/tutor/students')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStudents(d.data ?? []);
        else setError(d.message ?? 'Lỗi tải dữ liệu');
      })
      .catch(() => setError('Không thể kết nối máy chủ.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const nameMatch =
      s.full_name.toLowerCase().includes(q) || (s.student_code ?? '').toLowerCase().includes(q);
    if (!nameMatch) return false;
    if (filterToday && s.sessions_today === 0) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/20 to-stone-100 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-10">
        {/* Header */}
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-2">
            Gia sư
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-stone-900 dark:text-stone-50 tracking-tight">
            Học sinh kèm
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">
            {!loading && !error ? `${students.length} học sinh đang kèm` : 'Đang tải...'}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-2xl bg-stone-200/60 dark:bg-stone-800/60 animate-pulse"
                />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-44 rounded-[28px] bg-stone-200/60 dark:bg-stone-800/60 animate-pulse"
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

        {!loading && !error && (
          <>
            {/* Summary bar */}
            {students.length > 0 && <SummaryBar students={students} />}

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
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
              <button
                onClick={() => setFilterToday(!filterToday)}
                className={cn(
                  'px-5 py-3 rounded-2xl text-sm font-black border transition-all duration-200 whitespace-nowrap',
                  filterToday
                    ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-amber-400'
                )}
              >
                Chỉ hôm nay
              </button>
            </div>

            {/* Empty state */}
            {students.length === 0 && (
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-black text-xl text-stone-800 dark:text-stone-100">
                    Chưa có học sinh được phân công
                  </p>
                  <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
                    Liên hệ quản trị viên để được phân học sinh kèm.
                  </p>
                </div>
              </div>
            )}

            {students.length > 0 && filtered.length === 0 && (
              <div className="text-center py-12 text-stone-500 dark:text-stone-400">
                <p className="font-semibold">Không tìm thấy học sinh phù hợp</p>
              </div>
            )}

            {/* Grid */}
            {filtered.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filtered.map((s, i) => (
                  <StudentCard key={s.student_id} s={s} index={i} />
                ))}
              </div>
            )}

            {/* Quick link to schedule */}
            {students.length > 0 && (
              <div className="pt-2">
                <Link
                  href={routes.timetable.mySchedule()}
                  className="inline-flex items-center gap-2 text-sm font-bold text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Xem lịch kèm đầy đủ →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
