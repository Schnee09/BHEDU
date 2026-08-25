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
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import StudentActions from '@/components/StudentActions';
import GuardianManagement from '@/components/GuardianManagement';
import EnrollmentManager from '@/components/EnrollmentManager';
import StudentPhotoUpload from '@/components/StudentPhotoUpload';
import StudentNotes from '@/components/StudentNotes';
import StudentDocuments from '@/components/StudentDocuments';
import StudentStatusPanel from '@/components/StudentStatusPanel';
import { ZaloCopyButton } from '@/components/ui/ZaloCopyButton';
import { generateAttendanceZaloMessage } from '@/lib/utils/zaloTemplates';
import { cn } from '@/lib/utils';

/**
 * Fetch student data using the provided Supabase client.
 */
async function fetchStudentWithClient(supabase: any, id: string) {
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select(
      'id, full_name, email, phone, address, date_of_birth, photo_url, created_at, role, student_code, student_id, grade_level, status'
    )
    .eq('id', id)
    .maybeSingle();

  if (pErr || !profile) {
    return {
      profile: null,
      enrollments: [],
      classes: [],
      attendance: [],
      grades: [],
      account: null,
      invoices: [],
      payments: [],
      audits: [],
      error: pErr?.message,
    };
  }

  const [
    { data: enrollments },
    { data: attendance },
    { data: grades },
    { data: account },
    { data: invoices },
    { data: payments },
    { data: audits },
  ] = await Promise.all([
    supabase
      .from('enrollments')
      .select('id, class_id, enrollment_date, status, classes(id, name)')
      .eq('student_id', id)
      .order('enrollment_date', { ascending: false }),
    supabase
      .from('attendance')
      .select('id, class_id, date, status, notes, classes(id, name)')
      .eq('student_id', id)
      .order('date', { ascending: false })
      .limit(30),
    supabase
      .from('grades')
      .select(
        'id, score, points_earned, component_type, semester, graded_at, subjects(code, name), classes(name)'
      )
      .eq('student_id', id)
      .order('graded_at', { ascending: false })
      .limit(30),
    supabase
      .from('student_accounts')
      .select('id, student_id, balance, status, last_payment_date')
      .eq('student_id', id)
      .maybeSingle(),
    supabase
      .from('invoices')
      .select(
        'id, invoice_number, status, total_amount, paid_amount, balance, issue_date, due_date'
      )
      .eq('student_id', id)
      .order('issue_date', { ascending: false })
      .limit(10),
    supabase
      .from('payments')
      .select('id, amount, payment_date, transaction_reference, invoice_id, payment_methods(name)')
      .eq('student_id', id)
      .order('payment_date', { ascending: false })
      .limit(10),
    supabase
      .from('audit_logs')
      .select('id, actor_id, action, resource_type, resource_id, created_at')
      .eq('resource_type', 'student')
      .eq('resource_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  return {
    profile,
    enrollments: (enrollments as unknown[]) ?? [],
    attendance: (attendance as unknown[]) ?? [],
    grades: (grades as unknown[]) ?? [],
    account: (account ?? null) as unknown,
    invoices: (invoices as unknown[]) ?? [],
    payments: (payments as unknown[]) ?? [],
    audits: (audits as unknown[]) ?? [],
  };
}

export default async function StudentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { supabase: dataClient, viewerRole, user } = await getDataClient();

  const { profile, enrollments, attendance, grades, account, invoices, payments, audits } =
    await fetchStudentWithClient(dataClient, id);

  if (!profile) return notFound();

  const hasAdminAccess = ['admin', 'super_admin', 'owner', 'staff'].includes(viewerRole || '');
  const showFinance = hasAdminAccess || user?.id === id || viewerRole === 'parent';
  const showActivity = hasAdminAccess;

  type StudentAccount = {
    id: string;
    student_id: string;
    balance: number | string | null;
    status: string | null;
    last_payment_date: string | null;
  } | null;
  type InvoiceRow = {
    id: string;
    invoice_number: string;
    status: string;
    total_amount: number | string;
    paid_amount: number | string;
    balance: number | string;
    issue_date: string | null;
    due_date: string | null;
  };
  type PaymentRow = {
    id: string;
    amount: number | string;
    payment_date: string | null;
    transaction_reference: string | null;
    invoice_id: string | null;
    payment_methods?: { name: string } | null;
  };
  type AuditRow = {
    id: string;
    actor_id: string | null;
    action: string;
    resource_type: string;
    resource_id: string;
    created_at: string;
  };

  const accountInfo = account as StudentAccount;
  const invoiceRows = invoices as InvoiceRow[];
  const paymentRows = payments as PaymentRow[];
  const auditRows = audits as AuditRow[];

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
    .map((g: any) => g.score ?? g.points_earned)
    .filter((s: any) => s != null);
  const averageGrade =
    gradeScores.length > 0
      ? (gradeScores.reduce((a: number, b: number) => a + b, 0) / gradeScores.length).toFixed(1)
      : '—';

  const componentLabels: Record<string, string> = {
    oral: 'Miệng',
    fifteen_min: '15 phút',
    one_period: '1 tiết',
    midterm: 'Giữa kỳ',
    final: 'Cuối kỳ',
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 1: OVERVIEW (Tổng quan)
  // ─────────────────────────────────────────────────────────────────────────────
  const overviewSection = (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      {/* Details 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Personal Info Card */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200/80 dark:border-white/10 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-white/5">
            <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Icons.Students className="w-4 h-4" />
              </span>
              Thông tin cá nhân
            </h3>
            <Link href={`/dashboard/students/${id}/edit`}>
              <span className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400">
                Chỉnh sửa
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <InfoItem
              label="Số điện thoại"
              value={profile.phone}
              icon={<PhoneIcon className="w-4 h-4 text-blue-500" />}
            />
            <InfoItem
              label="UID (Mã học sinh)"
              value={profile.student_code}
              icon={<KeyIcon className="w-4 h-4 text-amber-500" />}
            />
            <InfoItem
              label="CID (Mã định danh)"
              value={profile.student_id}
              icon={<IdentificationIcon className="w-4 h-4 text-emerald-500" />}
            />
            <InfoItem
              label="Ngày sinh"
              value={
                profile.date_of_birth
                  ? new Date(profile.date_of_birth).toLocaleDateString('vi-VN')
                  : null
              }
              icon={<CakeIcon className="w-4 h-4 text-pink-500" />}
            />
            <InfoItem
              label="Ngày tham gia"
              value={new Date(profile.created_at).toLocaleDateString('vi-VN')}
              icon={<CalendarDaysIcon className="w-4 h-4 text-stone-400" />}
            />
            <InfoItem
              label="Địa chỉ"
              value={profile.address}
              icon={<MapPinIcon className="w-4 h-4 text-rose-500" />}
              className="sm:col-span-2"
            />
          </div>
        </div>

        {/* Attendance Ring & Summary Card */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200/80 dark:border-white/10 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-white/5">
            <h3 className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Icons.Attendance className="w-4 h-4" />
              </span>
              Tóm tắt chuyên cần
            </h3>
          </div>

          {attendanceStats.total === 0 ? (
            <div className="text-center py-8 text-stone-400 font-bold text-xs bg-stone-50 dark:bg-white/5 rounded-2xl">
              Chưa có dữ liệu điểm danh
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
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
                    Tỉ lệ
                  </span>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 gap-2.5 w-full">
                <AttendanceRow
                  label="Có mặt"
                  value={attendanceStats.present}
                  total={attendanceStats.total}
                  color="emerald"
                />
                <AttendanceRow
                  label="Đi muộn"
                  value={attendanceStats.late}
                  total={attendanceStats.total}
                  color="amber"
                />
                <AttendanceRow
                  label="Vắng mặt"
                  value={attendanceStats.absent}
                  total={attendanceStats.total}
                  color="rose"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent 6 Grades Strip */}
      {grades.length > 0 && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200/80 dark:border-white/10 p-4 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Icons.Grades className="w-4 h-4" />
              </span>
              Điểm số mới nhất
            </h3>
            <Link
              href={`/dashboard/students/${id}/transcript`}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Phiếu kết quả học tập →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {grades.slice(0, 6).map((g: any) => (
              <div
                key={g.id}
                className="bg-stone-50 dark:bg-stone-800/50 rounded-xl p-3 text-center border border-stone-200/60 dark:border-white/5 space-y-0.5"
              >
                <p className="text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                  {g.score ?? g.points_earned}
                </p>
                <p className="text-[10px] font-bold text-stone-700 dark:text-stone-300 truncate">
                  {g.subjects?.name ?? '—'}
                </p>
                <p className="text-[9px] text-stone-400 uppercase">
                  {componentLabels[g.component_type] ?? g.component_type}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Panel */}
      <StudentStatusPanel
        studentId={id}
        currentStatus={profile.status as any}
        isAdmin={hasAdminAccess}
      />
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
            Điểm trung bình lũy kế:{' '}
            <strong className="text-amber-600 font-bold">{averageGrade}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/students/${id}/progress`}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/40 transition-all"
          >
            <ChartBarIcon className="w-4 h-4" />
            <span>Biểu đồ tiến độ</span>
          </Link>
          <Link
            href={`/dashboard/students/${id}/transcript`}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold border border-amber-200/60 dark:border-amber-800/40 transition-all"
          >
            <AcademicCapIcon className="w-4 h-4" />
            <span>Phiếu kết quả học tập</span>
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
  // TAB 3: ATTENDANCE (Chuyên cần & Điểm danh)
  // ─────────────────────────────────────────────────────────────────────────────
  const attendanceSection = (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-white/10">
        <div>
          <h2 className="text-base font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Icons.Attendance className="w-4 h-4" />
            </span>
            Lịch sử điểm danh ({attendance.length} buổi gần nhất)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Tỉ lệ chuyên cần:{' '}
            <strong className="text-emerald-600 font-bold">{attendanceRate}%</strong>
          </p>
        </div>
      </div>

      {attendance.length === 0 ? (
        <div className="p-12 bg-white dark:bg-stone-900 rounded-2xl border border-dashed border-stone-200 dark:border-white/10 text-center">
          <Empty
            title="Chưa có dữ liệu điểm danh"
            description="Chưa tìm thấy bản ghi điểm danh nào tồn tại trong hệ thống."
          />
        </div>
      ) : (
        <>
          {/* Mobile Touch Cards View (< md) */}
          <div className="md:hidden space-y-2.5">
            {attendance.map((a: any) => (
              <div
                key={a.id}
                className="bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="font-bold text-sm text-stone-900 dark:text-white block">
                      {new Date(a.date).toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-[10px] text-stone-400 font-medium">
                      Lớp:{' '}
                      <strong className="text-stone-700 dark:text-stone-300">
                        {a.classes?.name ?? a.class_id}
                      </strong>
                    </span>
                  </div>

                  <Badge
                    variant={
                      a.status === 'present'
                        ? 'success'
                        : a.status === 'absent'
                          ? 'danger'
                          : 'warning'
                    }
                    className="font-black text-[9px] uppercase tracking-wider px-2.5 py-0.5 shrink-0"
                  >
                    {a.status === 'present'
                      ? 'Có mặt'
                      : a.status === 'absent'
                        ? 'Vắng mặt'
                        : 'Đi muộn'}
                  </Badge>
                </div>

                {a.notes && (
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 italic bg-stone-50 dark:bg-stone-800/50 p-2 rounded-lg border border-stone-200/50 dark:border-white/5">
                    &quot;{a.notes}&quot;
                  </p>
                )}

                <div className="pt-1 flex justify-end border-t border-stone-100 dark:border-white/5">
                  <ZaloCopyButton
                    message={generateAttendanceZaloMessage({
                      studentName: profile?.full_name || 'Học sinh',
                      className: a.classes?.name ?? a.class_id,
                      dateStr: new Date(a.date).toLocaleDateString('vi-VN'),
                      status: a.status,
                      notes: a.notes,
                    })}
                  />
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
                    Thời gian
                  </th>
                  <th className="text-left px-5 py-3 font-bold text-stone-500 uppercase tracking-wider">
                    Lớp học
                  </th>
                  <th className="text-left px-5 py-3 font-bold text-stone-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="text-left px-5 py-3 font-bold text-stone-500 uppercase tracking-wider">
                    Ghi chú
                  </th>
                  <th className="text-right px-5 py-3 font-bold text-stone-500 uppercase tracking-wider">
                    Báo cáo Zalo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                {attendance.map((a: any) => (
                  <tr
                    key={a.id}
                    className="hover:bg-stone-50/60 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="px-5 py-3 font-bold text-stone-900 dark:text-white">
                      {new Date(a.date).toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3 font-medium text-stone-700 dark:text-stone-300">
                      {a.classes?.name ?? a.class_id}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={
                          a.status === 'present'
                            ? 'success'
                            : a.status === 'absent'
                              ? 'danger'
                              : 'warning'
                        }
                        className="font-bold text-[9px] uppercase tracking-wider px-2.5"
                      >
                        {a.status === 'present'
                          ? 'Có mặt'
                          : a.status === 'absent'
                            ? 'Vắng mặt'
                            : 'Đi muộn'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-stone-500 italic text-[11px]">
                      {a.notes || '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <ZaloCopyButton
                        message={generateAttendanceZaloMessage({
                          studentName: profile?.full_name || 'Học sinh',
                          className: a.classes?.name ?? a.class_id,
                          dateStr: new Date(a.date).toLocaleDateString('vi-VN'),
                          status: a.status,
                          notes: a.notes,
                        })}
                      />
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
  // TAB 4: MANAGEMENT & ENROLLMENTS (Lớp học, Phụ huynh & Hồ sơ)
  // ─────────────────────────────────────────────────────────────────────────────
  const managementSection = (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. Enrollments */}
      <section className="space-y-3">
        <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Icons.Classes className="w-4 h-4" />
          </span>
          Lớp học & Ghi danh
        </h3>
        <EnrollmentManager studentId={id} />
      </section>

      {/* 2. Guardians */}
      <section className="space-y-3 pt-4 border-t border-stone-200/60 dark:border-white/5">
        <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Icons.Users className="w-4 h-4" />
          </span>
          Thông tin Phụ huynh liên kết
        </h3>
        <GuardianManagement studentId={id} />
      </section>

      {/* 3. Finance (if permitted) */}
      {showFinance && (
        <section className="space-y-3 pt-4 border-t border-stone-200/60 dark:border-white/5">
          <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Icons.Finance className="w-4 h-4" />
            </span>
            Học phí & Tài chính
          </h3>

          {accountInfo && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <StatCardSmall
                label="Trạng thái tài khoản"
                value={accountInfo.status ?? '—'}
                color="stone"
                icon={<Icons.Clipboard className="w-4 h-4" />}
              />
              <StatCardSmall
                label="Số dư hiện tại"
                value={`₫${accountInfo.balance?.toLocaleString('vi-VN') ?? '0'}`}
                color="emerald"
                icon={<Icons.Payment className="w-4 h-4" />}
              />
              <StatCardSmall
                label="Thanh toán gần nhất"
                value={
                  accountInfo.last_payment_date
                    ? new Date(accountInfo.last_payment_date).toLocaleDateString('vi-VN')
                    : 'Chưa có'
                }
                color="blue"
                icon={<Icons.Calendar className="w-4 h-4" />}
              />
            </div>
          )}

          {invoiceRows.length > 0 && (
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 overflow-hidden shadow-xs">
              <div className="px-4 py-2.5 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200/60 dark:border-white/5 font-bold text-xs">
                Danh sách hóa đơn học phí ({invoiceRows.length})
              </div>
              <div className="divide-y divide-stone-100 dark:divide-white/5 text-xs">
                {invoiceRows.map((inv) => (
                  <div key={inv.id} className="p-3 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold font-mono text-stone-900 dark:text-white">
                        INV-{inv.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="text-[10px] text-stone-400 block">
                        Hạn:{' '}
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString('vi-VN') : '—'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-600 block">
                        ₫{inv.total_amount.toLocaleString('vi-VN')}
                      </span>
                      <Badge
                        variant={inv.status === 'paid' ? 'success' : 'warning'}
                        className="text-[9px] font-bold"
                      >
                        {inv.status === 'paid' ? 'Đã thu' : 'Chưa thu'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 4. Documents & Notes */}
      <section className="space-y-3 pt-4 border-t border-stone-200/60 dark:border-white/5">
        <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-stone-500/10 text-stone-600 dark:text-stone-400">
            <DocumentTextIcon className="w-4 h-4" />
          </span>
          Tài liệu & Ghi chú học vụ
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StudentDocuments studentId={id} />
          <StudentNotes studentId={id} />
        </div>
      </section>

      {/* 5. Activity Log (Admin only) */}
      {showActivity && auditRows.length > 0 && (
        <section className="space-y-3 pt-4 border-t border-stone-200/60 dark:border-white/5">
          <h3 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Icons.History className="w-4 h-4" />
            </span>
            Nhật ký hoạt động hệ thống
          </h3>
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 p-4 shadow-xs space-y-2">
            {auditRows.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between text-xs p-2 rounded-xl bg-stone-50 dark:bg-stone-800/40"
              >
                <span className="font-bold text-stone-800 dark:text-stone-200 uppercase">
                  {a.action}
                </span>
                <span className="text-[10px] text-stone-400">
                  {new Date(a.created_at).toLocaleString('vi-VN')}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent py-3 sm:py-6 px-2.5 sm:px-6 lg:px-10 overflow-x-hidden">
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
              studentId={id}
              studentName={profile.full_name}
              isAdmin={hasAdminAccess}
            />
          </div>
        </div>

        {/* ── HERO PROFILE CARD (Mobile-First) ── */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200/80 dark:border-white/10 p-4 sm:p-6 shadow-xs relative overflow-hidden space-y-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            {/* Student Avatar */}
            <div className="shrink-0 p-1 bg-stone-100 dark:bg-stone-800 rounded-2xl shadow-xs">
              <StudentPhotoUpload
                studentId={id}
                currentPhotoUrl={(profile as { photo_url?: string | null }).photo_url}
              />
            </div>

            {/* Student Identity */}
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight truncate">
                  {profile.full_name}
                </h1>
                {profile.grade_level && (
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 uppercase">
                    {profile.grade_level}
                  </span>
                )}
                <Badge
                  variant={profile.status === 'active' ? 'success' : 'default'}
                  className="font-bold text-[9px] uppercase tracking-wider px-2.5 py-0.5"
                >
                  {profile.status === 'active' ? 'Đang học' : 'Lưu trữ'}
                </Badge>
              </div>

              {/* Badges row: UID, CID, Class */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 font-mono font-bold text-[10px]">
                  UID: {profile.student_code || '—'}
                </span>
                {profile.student_id && (
                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 font-mono font-bold text-[10px]">
                    CID: {profile.student_id}
                  </span>
                )}
                {enrollments.length > 0 && (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 font-bold text-[10px]">
                    Lớp: {(enrollments[0] as any)?.classes?.name}
                  </span>
                )}
              </div>

              {/* Contact row */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-stone-500 dark:text-stone-400">
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="flex items-center gap-1 font-bold text-stone-700 dark:text-stone-300 hover:text-blue-600"
                  >
                    <PhoneIcon className="w-3.5 h-3.5 text-blue-500" />
                    <span>{profile.phone}</span>
                  </a>
                )}
                {profile.email && (
                  <span className="flex items-center gap-1 truncate max-w-[240px]">
                    <EnvelopeIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{profile.email}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 4-Stat Metric Cards Grid (2x2 on mobile, 4-col on desktop) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-stone-100 dark:border-white/5">
            <StatCardSmall
              label="Chuyên cần"
              value={`${attendanceRate}%`}
              color="emerald"
              icon={<Icons.Attendance className="w-4 h-4" />}
            />
            <StatCardSmall
              label="Điểm TB (GPA)"
              value={averageGrade}
              color="amber"
              icon={<Icons.Grades className="w-4 h-4" />}
            />
            <StatCardSmall
              label="Lớp học"
              value={enrollments.length}
              color="blue"
              icon={<Icons.Classes className="w-4 h-4" />}
            />
            <StatCardSmall
              label="Cột điểm"
              value={grades.length}
              color="stone"
              icon={<Icons.Success className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* ── 4 STREAMLINED TABS ── */}
        {(() => {
          const tabs: { key: string; label: string; content: React.ReactNode }[] = [
            { key: 'overview', label: '📱 Tổng quan', content: overviewSection },
            { key: 'grades', label: '📊 Học tập & Điểm', content: gradesSection },
            { key: 'attendance', label: '📅 Chuyên cần', content: attendanceSection },
            { key: 'management', label: '📁 Lớp học & Hồ sơ', content: managementSection },
          ];
          return <Tabs tabs={tabs} />;
        })()}
      </div>
    </div>
  );
}

function StatCardSmall({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  color: 'emerald' | 'blue' | 'amber' | 'stone';
  icon: React.ReactNode;
}) {
  const colorMap = {
    emerald:
      'text-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/30',
    blue: 'text-blue-600 bg-blue-50/60 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/30',
    amber:
      'text-amber-600 bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/30',
    stone:
      'text-stone-600 bg-stone-50 dark:bg-stone-800/50 border-stone-200/60 dark:border-white/5',
  };

  return (
    <div className={cn('rounded-2xl p-3 sm:p-4 border transition-all shadow-xs', colorMap[color])}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="p-1.5 rounded-lg bg-white dark:bg-stone-800 shadow-2xs shrink-0">
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 truncate">
          {label}
        </span>
      </div>
      <p className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tabular-nums tracking-tight">
        {value}
      </p>
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: string | null | undefined;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200/60 dark:border-white/5 flex items-center gap-2.5 min-w-0',
        className
      )}
    >
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <span className="text-[9.5px] font-bold text-stone-400 uppercase tracking-wider block">
          {label}
        </span>
        <p className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate mt-0.5">
          {value || '—'}
        </p>
      </div>
    </div>
  );
}

function AttendanceRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: 'emerald' | 'amber' | 'rose';
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  const colorMap = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
        <span className="text-stone-500">{label}</span>
        <span
          className={cn(
            'font-mono font-bold',
            color === 'emerald'
              ? 'text-emerald-600'
              : color === 'amber'
                ? 'text-amber-600'
                : 'text-rose-500'
          )}
        >
          {value} ({percentage}%)
        </span>
      </div>
      <div className="h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorMap[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
