'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import PageGuard from '@/components/PageGuard';
import { apiFetch } from '@/lib/api/client';
import { routes } from '@/lib/routes';
import {
  ArrowRight,
  BookOpen,
  CircleDollarSign,
  ContactRound,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  TriangleAlert,
  UserPlus,
} from 'lucide-react';

type ReceptionStudent = {
  id: string;
  full_name: string | null;
  student_code: string | null;
  student_id: string | null;
  phone: string | null;
  personal_email: string | null;
  grade_level: string | null;
  status: string | null;
  active_enrollments: Array<{
    id: string;
    enrollment_date: string;
    class: { id: string; name: string; schedule?: string | null; room?: string | null };
  }>;
  finance: {
    outstanding: number;
    open_invoices: number;
    overdue_invoices: number;
  };
};

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function ReceptionPage() {
  return (
    <PageGuard permissions={['students.view', 'finance.view']} requireAll>
      <ReceptionWorkspace />
    </PageGuard>
  );
}

function ReceptionWorkspace() {
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<ReceptionStudent[]>([]);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchStudents = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = query.trim();
    if (normalized.length < 2) {
      setError('Nhập ít nhất 2 ký tự: tên, mã học sinh, CCCD, điện thoại hoặc email.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(
        `/api/admin/reception/students?q=${encodeURIComponent(normalized)}`
      );
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Không thể tra cứu học sinh');
      }
      setStudents(payload.data?.students || []);
      setSearchedQuery(payload.data?.query || normalized);
    } catch (searchError) {
      setStudents([]);
      setError(searchError instanceof Error ? searchError.message : 'Không thể tra cứu học sinh');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-400">
            <ContactRound className="h-4 w-4" />
            Tiếp nhận & chăm sóc học sinh
          </div>
          <h1 className="text-2xl font-black tracking-tight text-stone-950 dark:text-white sm:text-3xl">
            Tiếp nhận học sinh
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-stone-600 dark:text-stone-300">
            Tra cứu hồ sơ, lớp đang học và tình trạng học phí tại một nơi.
          </p>
        </div>
        <Link
          href={routes.students.list()}
          className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-xs font-bold text-stone-800 transition-colors hover:border-amber-400 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20 dark:border-white/15 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-amber-950/30"
        >
          <UserPlus className="h-4 w-4" />
          Danh sách & tạo hồ sơ
        </Link>
      </header>

      <section className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-stone-900 sm:p-6">
        <form onSubmit={searchStudents} role="search" className="space-y-3">
          <label
            htmlFor="reception-student-search"
            className="text-sm font-bold text-stone-800 dark:text-stone-100"
          >
            Tra cứu hồ sơ học sinh
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
              <input
                id="reception-student-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tên, mã HS, CCCD, số điện thoại hoặc email…"
                autoComplete="off"
                className="h-12 w-full rounded-xl border border-stone-300 bg-white pl-12 pr-4 text-sm text-stone-950 shadow-sm transition-colors placeholder:text-stone-500 hover:border-amber-400 focus-visible:border-amber-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/15 dark:border-white/15 dark:bg-stone-950 dark:text-white dark:placeholder:text-stone-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 text-sm font-black text-stone-950 shadow-sm transition-colors hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {loading ? 'Đang tra cứu…' : 'Tra cứu'}
            </button>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Thông tin chỉ hiển thị cho nhân sự có quyền xem hồ sơ và học phí.
          </p>
        </form>
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
        >
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {searchedQuery && !loading && !error && (
        <section aria-live="polite" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-black text-stone-900 dark:text-white">
              {students.length} kết quả cho “{searchedQuery}”
            </h2>
            <span className="text-xs text-stone-500">Tối đa 12 hồ sơ gần nhất</span>
          </div>

          {students.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center dark:border-white/15 dark:bg-stone-900">
              <ContactRound className="mx-auto h-9 w-9 text-stone-400" />
              <p className="mt-3 font-bold text-stone-900 dark:text-white">
                Không tìm thấy hồ sơ phù hợp
              </p>
              <p className="mt-1 text-sm text-stone-500">
                Kiểm tra lại thông tin trước khi tạo hồ sơ học sinh mới.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {students.map((student) => (
                <article
                  key={student.id}
                  className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-colors hover:border-amber-400 dark:border-white/10 dark:bg-stone-900 dark:hover:border-amber-600"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-black text-stone-950 dark:text-white">
                          {student.full_name || 'Chưa có họ tên'}
                        </h3>
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                          {student.student_code || 'Chưa có mã'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                        {[
                          student.grade_level,
                          student.status === 'active' ? 'Đang hoạt động' : student.status,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <Link
                      href={routes.students.detail(student.id)}
                      className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-3 text-xs font-bold text-white transition-colors hover:bg-amber-500 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20 dark:bg-white dark:text-stone-950"
                    >
                      Mở hồ sơ <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="rounded-xl bg-stone-50 p-3 dark:bg-white/[0.04]">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-500">
                        <BookOpen className="h-3.5 w-3.5" /> Lớp đang học
                      </p>
                      <p className="mt-1 text-lg font-black text-stone-950 dark:text-white">
                        {student.active_enrollments.length}
                      </p>
                    </div>
                    <div className="rounded-xl bg-stone-50 p-3 dark:bg-white/[0.04]">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-500">
                        <CircleDollarSign className="h-3.5 w-3.5" /> Còn phải đóng
                      </p>
                      <p
                        className={`mt-1 truncate text-sm font-black ${student.finance.outstanding > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}
                      >
                        {money.format(student.finance.outstanding)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-stone-50 p-3 dark:bg-white/[0.04]">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-500">
                        <TriangleAlert className="h-3.5 w-3.5" /> Quá hạn
                      </p>
                      <p className="mt-1 text-lg font-black text-stone-950 dark:text-white">
                        {student.finance.overdue_invoices}
                      </p>
                    </div>
                  </div>

                  {student.active_enrollments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {student.active_enrollments.map((enrollment) => (
                        <span
                          key={enrollment.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1 text-[11px] font-semibold text-stone-700 dark:border-white/10 dark:text-stone-300"
                        >
                          <GraduationCap className="h-3.5 w-3.5 text-amber-600" />
                          {enrollment.class.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-stone-100 pt-3 text-xs text-stone-600 dark:border-white/5 dark:text-stone-300">
                    {student.phone && (
                      <a
                        href={`tel:${student.phone}`}
                        className="inline-flex cursor-pointer items-center gap-1.5 hover:text-amber-700 dark:hover:text-amber-300"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {student.phone}
                      </a>
                    )}
                    {student.personal_email && (
                      <a
                        href={`mailto:${student.personal_email}`}
                        className="inline-flex cursor-pointer items-center gap-1.5 hover:text-amber-700 dark:hover:text-amber-300"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {student.personal_email}
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
