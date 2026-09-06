import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDataClient } from '@/lib/auth/dataClient';
import Tabs from '@/components/ui/tabs';
import Badge from '@/components/ui/badge';
import Empty from '@/components/ui/empty';
import { Card } from '@/components/ui';
import { Icons } from '@/components/ui/Icons';
import {
  CakeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  IdentificationIcon,
  KeyIcon,
  CalendarDaysIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  AcademicCapIcon,
  BanknotesIcon,
  ClockIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import StudentActions from '@/components/StudentActions';
import GuardianManagement from '@/components/GuardianManagement';
import EnrollmentManager from '@/components/EnrollmentManager';
import StudentPhotoUpload from '@/components/StudentPhotoUpload';
import { ZaloCopyButton } from '@/components/ui/ZaloCopyButton';
import { generateAttendanceZaloMessage } from '@/lib/utils/zaloTemplates';
import { cn } from '@/lib/utils';

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

/**
 * Fetch student data using the provided Supabase client.
 * Clean, type-safe queries adhering strictly to production schema.
 * Supports resolution by UUID, student_code (UID), student_id (CID), or phone.
 */
async function fetchStudentWithClient(supabase: any, identifier: string) {
  let profileQuery = supabase
    .from('profiles')
    .select(
      'id, full_name, email, phone, address, date_of_birth, photo_url, created_at, role, student_code, student_id, grade_level, status'
    );

  if (isUUID(identifier)) {
    profileQuery = profileQuery.eq('id', identifier);
  } else {
    profileQuery = profileQuery.or(
      `student_code.ilike.${identifier},student_id.ilike.${identifier},phone.eq.${identifier}`
    );
  }

  const { data: profile, error: pErr } = await profileQuery.maybeSingle();

  if (pErr || !profile) {
    return {
      profile: null,
      enrollments: [],
      attendance: [],
      grades: [],
      account: null,
      invoices: [],
      payments: [],
      error: pErr?.message,
    };
  }

  const realId = profile.id;

  const [
    { data: enrollments },
    { data: attendance },
    { data: grades },
    { data: account },
    { data: invoices },
    { data: payments },
  ] = await Promise.all([
    supabase
      .from('enrollments')
      .select(
        'id, class_id, enrollment_date, status, classes(id, name, schedule, sessions_per_week, room, grade_level)'
      )
      .eq('student_id', realId)
      .order('enrollment_date', { ascending: false }),
    supabase
      .from('attendance')
      .select('id, class_id, date, status, remarks, classes(id, name)')
      .eq('student_id', realId)
      .order('date', { ascending: false })
      .limit(30),
    supabase
      .from('grades')
      .select(
        'id, score, points_earned, component_type, semester, graded_at, subjects(code, name), classes(name)'
      )
      .eq('student_id', realId)
      .order('graded_at', { ascending: false })
      .limit(30),
    supabase
      .from('student_accounts')
      .select('id, student_id, balance, total_fees, total_paid, status, notes')
      .eq('student_id', realId)
      .maybeSingle(),
    supabase
      .from('invoices')
      .select('id, invoice_number, status, total_amount, paid_amount, issue_date, due_date, notes')
      .eq('student_id', realId)
      .order('issue_date', { ascending: false })
      .limit(10),
    supabase
      .from('payments')
      .select('id, amount, payment_date, invoice_id, notes')
      .eq('student_id', realId)
      .order('payment_date', { ascending: false })
      .limit(10),
  ]);

  return {
    profile,
    enrollments: (enrollments as unknown[]) ?? [],
    attendance: (attendance as unknown[]) ?? [],
    grades: (grades as unknown[]) ?? [],
    account: (account ?? null) as unknown,
    invoices: (invoices as unknown[]) ?? [],
    payments: (payments as unknown[]) ?? [],
  };
}

export default async function StudentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase: dataClient, viewerRole, user } = await getDataClient();

  const { profile, enrollments, attendance, grades, account, invoices, payments } =
    await fetchStudentWithClient(dataClient, id);

  if (!profile) return notFound();

  const studentId = profile.id;
  const hasAdminAccess = ['admin', 'super_admin', 'owner', 'staff'].includes(viewerRole || '');
  const showFinance = hasAdminAccess || user?.id === studentId || viewerRole === 'parent';

  type StudentAccount = {
    id: string;
    student_id: string;
    balance: number | null;
    total_fees: number | null;
    total_paid: number | null;
    status: string | null;
    notes: string | null;
  } | null;

  type InvoiceRow = {
    id: string;
    invoice_number: string;
    status: string;
    total_amount: number;
    paid_amount: number;
    issue_date: string | null;
    due_date: string | null;
    notes?: string | null;
  };

  type PaymentRow = {
    id: string;
    amount: number;
    payment_date: string | null;
    invoice_id: string | null;
    notes?: string | null;
  };

  const accountInfo = account as StudentAccount;
  const invoiceRows = (invoices || []) as InvoiceRow[];
  const paymentRows = (payments || []) as PaymentRow[];

  // Calculate statistics
  const attendanceStats = {
    total: attendance.length,
    present: attendance.filter((a: any) => a.status === 'present').length,
    late: attendance.filter((a: any) => a.status === 'late').length,
    absent: attendance.filter((a: any) => a.status === 'absent').length,
  };
  const attendanceRate =
    attendanceStats.total > 0
      ? Math.round(((attendanceStats.present + attendanceStats.late) / attendanceStats.total) * 100)
      : 100;

  const gradeScores = grades
    .map((g: any) => Number(g.score ?? g.points_earned))
    .filter((s: any) => !isNaN(s) && s != null);

  const averageGradeNum =
    gradeScores.length > 0
      ? gradeScores.reduce((a: number, b: number) => a + b, 0) / gradeScores.length
      : null;

  const averageGrade = averageGradeNum !== null ? averageGradeNum.toFixed(1) : '—';

  const componentLabels: Record<string, string> = {
    oral: 'Miệng',
    fifteen_min: '15 phút',
    one_period: '1 tiết',
    midterm: 'Giữa kỳ',
    final: 'Cuối kỳ',
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 1: CLASSES & ENROLLMENTS (Lớp học & Ghi danh)
  // ─────────────────────────────────────────────────────────────────────────────
  const classesSection = (
    <div className="animate-in fade-in duration-300">
      <EnrollmentManager studentId={studentId} />
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 2: ACADEMIC & GRADES (Học tập & Điểm số)
  // ─────────────────────────────────────────────────────────────────────────────
  const gradesSection = (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-white/10">
        <div>
          <h2 className="text-base font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Icons.Grades className="w-4 h-4" />
            </span>
            Bảng kết quả học tập ({grades.length} cột điểm)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Điểm trung bình tích lũy:{' '}
            <strong className="text-amber-600 font-bold">{averageGrade} / 10</strong>
            {averageGradeNum !== null && (
              <span className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                {averageGradeNum >= 8.0
                  ? 'Học lực Giỏi'
                  : averageGradeNum >= 6.5
                    ? 'Học lực Khá'
                    : averageGradeNum >= 5.0
                      ? 'Học lực Trung bình'
                      : 'Cần bồi dưỡng'}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/students/${id}/progress`}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/40 transition-all cursor-pointer"
          >
            <ChartBarIcon className="w-4 h-4" />
            <span>Biểu đồ tiến độ</span>
          </Link>
          <Link
            href={`/dashboard/students/${id}/transcript`}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold border border-amber-200/60 dark:border-amber-800/40 transition-all cursor-pointer"
          >
            <AcademicCapIcon className="w-4 h-4" />
            <span>Phiếu kết quả (In PDF)</span>
          </Link>
        </div>
      </div>

      {grades.length === 0 ? (
        <div className="p-12 bg-white dark:bg-stone-900 rounded-2xl border border-dashed border-stone-200 dark:border-white/10 text-center">
          <Empty
            title="Chưa có dữ liệu điểm"
            description="Hệ thống chưa ghi nhận bất kỳ kết quả học tập nào cho học sinh này."
          />
        </div>
      ) : (
        <>
          {/* Mobile Cards View (< md) */}
          <div className="md:hidden space-y-2.5">
            {grades.map((g: any) => (
              <div
                key={g.id}
                className="bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-900 dark:text-white truncate">
                      {g.subjects?.name ?? 'Môn học'}
                    </span>
                    <span className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-[9px] font-bold uppercase rounded-md">
                      {componentLabels[g.component_type] ?? g.component_type}
                    </span>
                  </div>
                  <div className="text-[10px] font-medium text-stone-400">
                    {g.graded_at ? new Date(g.graded_at).toLocaleDateString('vi-VN') : '—'} •{' '}
                    {g.classes?.name || 'Lớp học'}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                    {g.score ?? g.points_earned ?? '—'}
                  </span>
                  <span className="text-[10px] text-stone-400 block font-semibold">/ 10.0</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (md+) */}
          <div className="hidden md:block bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 overflow-hidden shadow-xs">
            <table className="w-full text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200/60 dark:border-white/5">
                <tr>
                  <th className="text-left px-5 py-3 font-bold text-stone-500 uppercase tracking-wider">
                    Môn học
                  </th>
                  <th className="text-left px-5 py-3 font-bold text-stone-500 uppercase tracking-wider">
                    Cột điểm
                  </th>
                  <th className="text-left px-5 py-3 font-bold text-stone-500 uppercase tracking-wider">
                    Lớp học
                  </th>
                  <th className="text-left px-5 py-3 font-bold text-stone-500 uppercase tracking-wider">
                    Điểm số
                  </th>
                  <th className="text-right px-5 py-3 font-bold text-stone-500 uppercase tracking-wider">
                    Ngày chấm
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                {grades.map((g: any) => (
                  <tr
                    key={g.id}
                    className="hover:bg-stone-50/60 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="px-5 py-3 font-bold text-stone-900 dark:text-white">
                      {g.subjects?.name ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold rounded-md">
                        {componentLabels[g.component_type] ?? g.component_type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-stone-600 dark:text-stone-400 font-medium">
                      {g.classes?.name || '—'}
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                      {g.score ?? g.points_earned ?? '—'}{' '}
                      <span className="text-[10px] text-stone-400">/ 10</span>
                    </td>
                    <td className="px-5 py-3 text-right text-stone-500 font-medium">
                      {g.graded_at ? new Date(g.graded_at).toLocaleDateString('vi-VN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 3: ATTENDANCE & CHUYÊN CẦN
  // ─────────────────────────────────────────────────────────────────────────────
  const attendanceSection = (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance Ring Card */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-white/5">
            <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Icons.Attendance className="w-4 h-4" />
              Tỉ lệ chuyên cần
            </h3>
            <span className="text-[10px] font-bold text-stone-400">
              {attendanceStats.total} buổi học
            </span>
          </div>

          <div className="flex items-center justify-center py-4">
            <div className="relative w-28 h-28 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-stone-100 dark:text-stone-800"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${attendanceRate * 3.01} 301`}
                  strokeLinecap="round"
                  className={cn(
                    'transition-all duration-700',
                    attendanceRate >= 80
                      ? 'text-emerald-500'
                      : attendanceRate >= 60
                        ? 'text-amber-500'
                        : 'text-rose-500'
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-stone-900 dark:text-white leading-none">
                  {attendanceRate}%
                </span>
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mt-0.5">
                  Đạt chuẩn
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-stone-100 dark:border-white/5 text-xs">
            <div className="p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                Có mặt
              </span>
              <span className="font-black text-sm text-stone-900 dark:text-white">
                {attendanceStats.present}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/20">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block">
                Đi muộn
              </span>
              <span className="font-black text-sm text-stone-900 dark:text-white">
                {attendanceStats.late}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-rose-50/50 dark:bg-rose-950/20">
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block">
                Vắng
              </span>
              <span className="font-black text-sm text-stone-900 dark:text-white">
                {attendanceStats.absent}
              </span>
            </div>
          </div>
        </div>

        {/* Attendance History List */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-white/5">
            <h3 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider">
              Nhật ký điểm danh từng ca dạy
            </h3>
            <span className="text-[10px] font-medium text-stone-400">Kèm nút gửi báo cáo Zalo</span>
          </div>

          {attendance.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400 font-bold bg-stone-50 dark:bg-stone-800/30 rounded-xl">
              Chưa có dữ liệu điểm danh
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-white/5 max-h-[420px] overflow-y-auto pr-1">
              {attendance.map((a: any) => (
                <div key={a.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 dark:text-white">
                        {new Date(a.date).toLocaleDateString('vi-VN', {
                          weekday: 'short',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                      <Badge
                        variant={
                          a.status === 'present'
                            ? 'success'
                            : a.status === 'absent'
                              ? 'danger'
                              : 'warning'
                        }
                        className="text-[9px] font-bold uppercase px-2 py-0.2"
                      >
                        {a.status === 'present'
                          ? 'Có mặt'
                          : a.status === 'absent'
                            ? 'Vắng mặt'
                            : 'Đi muộn'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                      Lớp: <strong>{a.classes?.name || a.class_id}</strong>
                      {a.remarks && <span className="italic ml-2">— &quot;{a.remarks}&quot;</span>}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <ZaloCopyButton
                      message={generateAttendanceZaloMessage({
                        studentName: profile?.full_name || 'Học sinh',
                        className: a.classes?.name ?? a.class_id,
                        dateStr: new Date(a.date).toLocaleDateString('vi-VN'),
                        status: a.status,
                        notes: a.remarks,
                      })}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 4: GUARDIANS & TUITION (Phụ huynh & Học phí)
  // ─────────────────────────────────────────────────────────────────────────────
  const guardianAndTuitionSection = (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. Guardians Section */}
      <section className="space-y-3">
        <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Icons.Users className="w-4 h-4" />
          </span>
          Thông tin Phụ huynh liên kết
        </h3>
        <GuardianManagement studentId={id} />
      </section>

      {/* 2. Tuition & Finance Section */}
      {showFinance && (
        <section className="space-y-4 pt-6 border-t border-stone-200/60 dark:border-white/5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <BanknotesIcon className="w-4 h-4" />
              </span>
              Học phí & Hóa đơn đóng tiền
            </h3>
          </div>

          {/* Balance KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-white/10 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Tổng học phí phát sinh
              </span>
              <p className="text-xl font-black text-stone-900 dark:text-white font-mono">
                ₫{(accountInfo?.total_fees ?? 0).toLocaleString('vi-VN')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-white/10 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Đã thanh toán
              </span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                ₫{(accountInfo?.total_paid ?? 0).toLocaleString('vi-VN')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-white/10 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                Số dư / Còn phải thu
              </span>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
                ₫{(accountInfo?.balance ?? 0).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>

          {/* Invoices Table */}
          {invoiceRows.length > 0 ? (
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 overflow-hidden shadow-xs">
              <div className="px-5 py-3 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200/60 dark:border-white/5 font-bold text-xs">
                Danh sách phiếu thu & hóa đơn ({invoiceRows.length})
              </div>
              <div className="divide-y divide-stone-100 dark:divide-white/5 text-xs">
                {invoiceRows.map((inv) => {
                  const balance = inv.total_amount - (inv.paid_amount || 0);
                  return (
                    <div
                      key={inv.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-stone-50/50 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold font-mono text-sm text-stone-900 dark:text-white">
                          {inv.invoice_number || `HD-${inv.id.slice(0, 8).toUpperCase()}`}
                        </span>
                        <div className="text-[11px] text-stone-400 flex items-center gap-3">
                          <span>
                            Ngày lập:{' '}
                            {inv.issue_date
                              ? new Date(inv.issue_date).toLocaleDateString('vi-VN')
                              : '—'}
                          </span>
                          {inv.due_date && (
                            <span>
                              Hạn đóng:{' '}
                              <strong className="text-stone-600 dark:text-stone-300">
                                {new Date(inv.due_date).toLocaleDateString('vi-VN')}
                              </strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:text-right">
                        <div>
                          <span className="font-black text-sm text-amber-600 dark:text-amber-400 block font-mono">
                            ₫{inv.total_amount.toLocaleString('vi-VN')}
                          </span>
                          <span className="text-[10px] text-stone-400 block">
                            Đã thu: ₫{(inv.paid_amount || 0).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <Badge
                          variant={
                            inv.status === 'paid'
                              ? 'success'
                              : inv.status === 'overdue'
                                ? 'danger'
                                : 'warning'
                          }
                          className="text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5"
                        >
                          {inv.status === 'paid'
                            ? 'Đã thu'
                            : inv.status === 'overdue'
                              ? 'Quá hạn'
                              : 'Chưa thu'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-6 bg-white dark:bg-stone-900 rounded-2xl border border-dashed border-stone-200 dark:border-white/10 text-center text-xs text-stone-400">
              Chưa có hóa đơn học phí nào được phát hành cho học sinh này.
            </div>
          )}
        </section>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent py-3 sm:py-6 px-2.5 sm:px-6 lg:px-10 pb-32 sm:pb-12 overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-6 relative z-10">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2.5 pb-2.5 border-b border-stone-200/60 dark:border-white/5">
          <Link
            href="/dashboard/students"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-colors p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Danh sách học sinh</span>
          </Link>

          <div className="flex items-center gap-2">
            <StudentActions
              studentId={studentId}
              studentName={profile.full_name}
              isAdmin={hasAdminAccess}
            />
          </div>
        </div>

        {/* ── COMPACT HERO PROFILE CARD ── */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 p-3.5 sm:p-5 shadow-xs space-y-3">
          {/* Identity Row (Horizontal layout) */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Student Avatar */}
            <div className="shrink-0">
              <StudentPhotoUpload
                studentId={studentId}
                currentPhotoUrl={(profile as { photo_url?: string | null }).photo_url}
                size="sm"
              />
            </div>

            {/* Student Identity */}
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-lg font-black text-stone-900 dark:text-white uppercase tracking-tight truncate">
                  {profile.full_name}
                </h1>
                {profile.grade_level && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 uppercase shrink-0">
                    {profile.grade_level}
                  </span>
                )}
                <Badge
                  variant={profile.status === 'active' ? 'success' : 'default'}
                  className="font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 shrink-0"
                >
                  {profile.status === 'active' ? 'Đang học' : 'Lưu trữ'}
                </Badge>
              </div>

              {/* Badges row: Mã học sinh, Mã định danh cá nhân, Phone, Email */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
                <span className="font-mono font-bold text-[10px] text-blue-600 dark:text-blue-400">
                  Mã HS: {profile.student_code || '—'}
                </span>
                {profile.student_id && (
                  <span className="font-mono font-bold text-[10px] text-stone-500 dark:text-stone-400">
                    Định danh cá nhân (CCCD): {profile.student_id}
                  </span>
                )}
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="inline-flex items-center gap-1 font-bold text-[11px] text-stone-700 dark:text-stone-300 hover:text-blue-600"
                  >
                    <PhoneIcon className="w-3 h-3 text-blue-500 shrink-0" />
                    <span>{profile.phone}</span>
                  </a>
                )}
                {profile.email && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-stone-400 truncate max-w-[220px]">
                    <EnvelopeIcon className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate">{profile.email}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Compact 4-Metric Strip (Clean, zero truncation, responsive 4-column) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-2.5 border-t border-stone-100 dark:border-white/5">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/60 dark:border-blue-900/30">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                <Icons.Classes className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block truncate">
                  Lớp học
                </span>
                <span className="text-xs sm:text-sm font-black text-stone-900 dark:text-white tabular-nums">
                  {enrollments.length} lớp
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/60 dark:border-amber-900/30">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <Icons.Grades className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block truncate">
                  Điểm TB (GPA)
                </span>
                <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 tabular-nums">
                  {averageGrade}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-900/30">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Icons.Attendance className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block truncate">
                  Chuyên cần
                </span>
                <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {attendanceRate}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-white/5">
              <div className="p-1.5 rounded-lg bg-stone-500/10 text-stone-600 dark:text-stone-400 shrink-0">
                <Icons.Success className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block truncate">
                  Cột điểm
                </span>
                <span className="text-xs sm:text-sm font-black text-stone-900 dark:text-white tabular-nums">
                  {grades.length} bài
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4 STREAMLINED TABS ── */}
        {(() => {
          const tabs: { key: string; label: string; content: React.ReactNode }[] = [
            { key: 'classes', label: '🏫 Lớp học & Ghi danh', content: classesSection },
            { key: 'grades', label: '📊 Học tập & Điểm số', content: gradesSection },
            { key: 'attendance', label: '📅 Chuyên cần & Điểm danh', content: attendanceSection },
            {
              key: 'guardians',
              label: '👨‍👩‍👧 Phụ huynh & Học phí',
              content: guardianAndTuitionSection,
            },
          ];
          return <Tabs tabs={tabs} />;
        })()}
      </div>
    </div>
  );
}
