'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  Heart,
  Loader2,
  Search,
} from 'lucide-react';

type Relationship = 'parent' | 'father' | 'mother' | 'guardian' | 'grandparent' | 'other';

interface StudentLookupResult {
  id: string;
  full_name: string;
  student_code: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

const RELATIONSHIP_OPTIONS: Array<{ value: Relationship; label: string }> = [
  { value: 'parent', label: 'Bố/Mẹ' },
  { value: 'father', label: 'Bố' },
  { value: 'mother', label: 'Mẹ' },
  { value: 'guardian', label: 'Người giám hộ' },
  { value: 'grandparent', label: 'Ông/Bà' },
  { value: 'other', label: 'Khác' },
];

export default function LinkStudentPage() {
  const router = useRouter();
  const [studentCode, setStudentCode] = useState('');
  const [relationship, setRelationship] = useState<Relationship>('parent');
  const [student, setStudent] = useState<StudentLookupResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const lookupStudent = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedCode = studentCode.trim().toUpperCase();
    if (!normalizedCode) return;

    setSearching(true);
    setError(null);
    setStudent(null);

    try {
      const response = await fetch('/api/auth/student-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_code: normalizedCode }),
      });
      const result = (await response.json()) as ApiResponse<StudentLookupResult>;
      if (!response.ok || !result.data) {
        throw new Error(result.error || 'Không tìm thấy học sinh với mã đã nhập.');
      }
      setStudent(result.data);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Không thể tra cứu học sinh.'
      );
    } finally {
      setSearching(false);
    }
  };

  const requestLink = async (event: FormEvent) => {
    event.preventDefault();
    if (!student) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/parent/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student.id, relationship }),
      });
      const result = (await response.json()) as ApiResponse<unknown>;
      if (!response.ok) throw new Error(result.error || 'Không thể gửi yêu cầu kết nối.');
      setSubmitted(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Không thể gửi yêu cầu kết nối.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted && student) {
    return (
      <main className="mx-auto flex max-w-lg flex-col items-center px-4 py-12 text-center sm:py-20">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
          <CheckCircle2
            className="h-10 w-10 text-emerald-700 dark:text-emerald-400"
            aria-hidden="true"
          />
        </div>
        <h1 className="text-2xl font-bold text-stone-950 dark:text-white">
          Đã gửi yêu cầu kết nối
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
          Trung tâm sẽ xác minh yêu cầu kết nối với <strong>{student.full_name}</strong>. Sau khi
          được duyệt, bạn có thể theo dõi thông tin học tập của học sinh trên hệ thống.
        </p>
        <button
          type="button"
          onClick={() => router.push('/dashboard/parent')}
          className="mt-8 cursor-pointer rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Về trang tổng quan
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-8 sm:py-10">
      <header className="flex items-start gap-4">
        <Link
          href="/dashboard/parent"
          aria-label="Quay lại trang tổng quan"
          className="cursor-pointer rounded-xl border border-stone-200 bg-white p-2.5 text-stone-700 transition-colors hover:border-blue-400 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-950 dark:text-white sm:text-3xl">
            Kết nối với học sinh
          </h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Nhập mã học sinh do trung tâm cung cấp để gửi yêu cầu kết nối.
          </p>
        </div>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-8">
        {!student ? (
          <form onSubmit={lookupStudent} className="space-y-5">
            <div>
              <label
                htmlFor="student-code"
                className="mb-2 block text-sm font-semibold text-stone-800 dark:text-stone-200"
              >
                Mã học sinh
              </label>
              <div className="relative">
                <GraduationCap
                  className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
                  aria-hidden="true"
                />
                <input
                  id="student-code"
                  value={studentCode}
                  onChange={(event) => setStudentCode(event.target.value.toUpperCase())}
                  autoComplete="off"
                  placeholder="Ví dụ: HS20260001"
                  className="h-12 w-full rounded-xl border border-stone-300 bg-white pl-11 pr-4 font-mono text-sm font-semibold uppercase text-stone-950 outline-none transition-colors placeholder:font-sans placeholder:font-normal placeholder:normal-case focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-stone-700 dark:bg-stone-950 dark:text-white"
                />
              </div>
              <p className="mt-2 text-xs leading-5 text-stone-500 dark:text-stone-400">
                Chỉ dùng mã chính thức trên tài khoản hoặc phiếu thông tin do trung tâm cấp.
              </p>
            </div>
            {error && <ErrorMessage message={error} />}
            <button
              type="submit"
              disabled={searching || !studentCode.trim()}
              className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {searching ? (
                <Loader2
                  className="h-5 w-5 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : (
                <Search className="h-5 w-5" aria-hidden="true" />
              )}
              {searching ? 'Đang tra cứu…' : 'Tra cứu học sinh'}
            </button>
          </form>
        ) : (
          <form onSubmit={requestLink} className="space-y-6">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                Học sinh đã tìm thấy
              </p>
              <p className="mt-1 text-lg font-bold text-stone-950 dark:text-white">
                {student.full_name}
              </p>
              <p className="font-mono text-sm text-stone-600 dark:text-stone-300">
                {student.student_code}
              </p>
              <button
                type="button"
                onClick={() => {
                  setStudent(null);
                  setError(null);
                }}
                className="mt-3 cursor-pointer text-sm font-semibold text-blue-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-300"
              >
                Chọn học sinh khác
              </button>
            </div>

            <fieldset>
              <legend className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                Mối quan hệ với học sinh
              </legend>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {RELATIONSHIP_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors ${relationship === option.value ? 'border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200' : 'border-stone-200 text-stone-700 hover:border-blue-300 dark:border-stone-700 dark:text-stone-300'}`}
                  >
                    <input
                      type="radio"
                      name="relationship"
                      value={option.value}
                      checked={relationship === option.value}
                      onChange={() => setRelationship(option.value)}
                      className="h-4 w-4 accent-blue-600"
                    />
                    <Heart className="h-4 w-4" aria-hidden="true" />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="rounded-xl bg-stone-100 p-4 text-sm leading-6 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
              Yêu cầu cần được trung tâm xác minh trước khi bạn có thể xem điểm, chuyên cần và các
              thông tin liên quan.
            </div>
            {error && <ErrorMessage message={error} />}
            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && (
                <Loader2
                  className="h-5 w-5 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              )}
              {submitting ? 'Đang gửi yêu cầu…' : 'Gửi yêu cầu kết nối'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
