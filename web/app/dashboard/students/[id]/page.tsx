import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDataClient } from '@/lib/auth/dataClient';
import Tabs from '@/components/ui/tabs';
import Badge from '@/components/ui/badge';
import Empty from '@/components/ui/empty';
import { Card } from '@/components/ui';
import { Icons } from '@/components/ui/Icons';
import { CakeIcon } from '@heroicons/react/24/outline';
import StudentActions from '@/components/StudentActions';
import GuardianManagement from '@/components/GuardianManagement';
import EnrollmentManager from '@/components/EnrollmentManager';
import StudentPhotoUpload from '@/components/StudentPhotoUpload';
import StudentNotes from '@/components/StudentNotes';
import StudentDocuments from '@/components/StudentDocuments';
import { cn } from '@/lib/utils';

import StudentStatusPanel from '../../../../components/StudentStatusPanel';
import ImportHistoryPanel from '../../../../components/ImportHistoryPanel';
import { ZaloCopyButton } from '@/components/ui/ZaloCopyButton';
import { generateAttendanceZaloMessage } from '@/lib/utils/zaloTemplates';

/**
 * Fetch student data using the provided Supabase client.
 * This allows higher-privilege callers (admin) to pass a service client
 * so RLS won't hide student-related rows.
 */
async function fetchStudentWithClient(supabase: any, id: string) {
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select(
      'id, full_name, email, phone, address, date_of_birth, photo_url, created_at, role, student_code, student_id'
    )
    .eq('id', id)
    .maybeSingle();

  if (pErr) {
    // RLS or other error
    return {
      profile: null,
      enrollments: [],
      classes: [],
      attendance: [],
      grades: [],
      error: pErr.message,
    };
  }
  if (!profile) return { profile: null, enrollments: [], classes: [], attendance: [], grades: [] };

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
      .limit(20),
    supabase
      .from('grades')
      .select(
        'id, score, points_earned, component_type, semester, graded_at, subjects(code, name), classes(name)'
      )
      .eq('student_id', id)
      .order('graded_at', { ascending: false })
      .limit(20),
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

  // Centralized: choose the appropriate data client for this viewer.
  // The helper returns the supabase client and the detected viewer role
  // so pages can adapt what they show.
  const { supabase: dataClient, viewerRole, user } = await getDataClient();

  const { profile, enrollments, attendance, grades, account, invoices, payments, audits } =
    await fetchStudentWithClient(dataClient, id);

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

  if (!profile) return notFound();

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

  const overview = (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-amber-500/5 to-blue-500/5 rounded-[2rem] blur-2xl" />
        <div className="relative bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl rounded-[2rem] border border-stone-200 dark:border-white/5 shadow-2xl p-8 overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start text-center lg:text-left">
            {/* Profile Info */}
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative group p-1 bg-stone-100 dark:bg-white/5 rounded-3xl transition-transform hover:scale-[1.02]">
                <StudentPhotoUpload
                  studentId={id}
                  currentPhotoUrl={(profile as { photo_url?: string | null }).photo_url}
                />
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-center lg:justify-start gap-3">
                    <div className="w-1.5 h-6 bg-amber-500 rounded-full shadow-accent-glow" />
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">
                      Học sinh
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight">
                    {profile.full_name}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-stone-100 dark:bg-white/5 rounded-full border border-stone-200/50 dark:border-white/10">
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">
                      UID
                    </span>
                    <span className="text-[10px] font-black text-stone-900 dark:text-white uppercase">
                      {profile.student_code || '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">
                      CID
                    </span>
                    <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase">
                      {profile.student_id || '—'}
                    </span>
                  </div>
                  {enrollments.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="font-black text-[9px] uppercase tracking-widest px-3 h-6 border-stone-200/50"
                    >
                      Lớp: {(enrollments[0] as any)?.classes?.name}
                    </Badge>
                  )}
                  <Badge
                    variant="success"
                    className="font-black text-[9px] uppercase tracking-widest px-3 h-6 shadow-sm border-transparent"
                  >
                    {profile.status === 'active' ? 'Đang theo học' : 'Hồ sơ lưu trữ'}
                  </Badge>
                </div>

                <p className="text-stone-500 dark:text-stone-400 font-medium flex items-center justify-center lg:justify-start gap-2">
                  <Icons.Email className="w-4 h-4 text-stone-400" /> {profile.email}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:ml-auto w-full lg:w-auto">
              <StatCardSmall
                label="Chuyên cần"
                value={`${attendanceRate}%`}
                color="emerald"
                icon={<Icons.Attendance className="w-4 h-4" />}
              />
              <StatCardSmall
                label="Điểm TB"
                value={averageGrade}
                color="blue"
                icon={<Icons.Grades className="w-4 h-4" />}
              />
              <StatCardSmall
                label="Lớp học"
                value={enrollments.length}
                color="amber"
                icon={<Icons.Classes className="w-4 h-4" />}
              />
              <StatCardSmall
                label="Điểm số"
                value={grades.length}
                color="stone"
                icon={<Icons.Success className="w-4 h-4" />}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Info */}
        <div className="bg-white dark:bg-stone-900/50 rounded-3xl border border-stone-200 dark:border-white/5 shadow-xl p-8 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Icons.Students className="w-5 h-5 text-amber-600" />
              </div>
              Thông tin cá nhân
            </h3>
            <Link href={`/dashboard/students/${id}/edit`}>
              <button className="text-[10px] font-black text-amber-600 uppercase tracking-widest hover:underline">
                Chỉnh sửa
              </button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem label="Số điện thoại" value={profile.phone} icon="📱" />
            <InfoItem label="UID (Mã truy cập)" value={profile.student_code} icon="🔐" />
            <InfoItem label="CID (Mã định danh)" value={profile.student_id} icon="🆔" />
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
              icon={<Icons.Calendar className="w-4 h-4 text-blue-500" />}
            />
            <InfoItem label="Địa chỉ" value={profile.address} icon="📍" className="md:col-span-1" />
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="bg-white dark:bg-stone-900/50 rounded-3xl border border-stone-200 dark:border-white/5 shadow-xl p-8 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-serif font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Icons.Attendance className="w-5 h-5 text-emerald-600" />
              </div>
              Tổng quan điểm danh
            </h3>
          </div>

          {attendanceStats.total === 0 ? (
            <div className="text-center py-12 text-stone-400 font-black uppercase tracking-widest text-xs bg-stone-50 dark:bg-white/5 rounded-2xl">
              Chưa có dữ liệu điểm danh
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-stone-100 dark:text-white/5"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${attendanceRate * 3.64} 364`}
                      strokeLinecap="round"
                      className={cn(
                        'transition-all duration-1000',
                        attendanceRate >= 80
                          ? 'text-emerald-500'
                          : attendanceRate >= 60
                            ? 'text-amber-500'
                            : 'text-rose-500'
                      )}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-stone-900 dark:text-white leading-none">
                      {attendanceRate}%
                    </span>
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest mt-1">
                      Tỉ lệ
                    </span>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-1 gap-4 w-full">
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
            </div>
          )}
        </div>
      </div>

      {/* Recent Grades */}
      {grades.length > 0 && (
        <Card className="hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Icons.Grades className="w-5 h-5 text-amber-600" />
              </div>
              Điểm số gần đây
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {grades.slice(0, 6).map((g: any) => (
              <div
                key={g.id}
                className="bg-stone-50 dark:bg-white/5 rounded-2xl p-4 text-center border border-stone-100 dark:border-white/5 hover:border-amber-500/30 transition-all group"
              >
                <p className="text-2xl font-black text-stone-900 dark:text-white mb-1 group-hover:text-amber-500 transition-colors">
                  {g.score ?? g.points_earned}
                </p>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest truncate">
                  {g.subjects?.name ?? '—'}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Finance Summary */}
      {accountInfo && (
        <div className="glass-premium rounded-[2.5rem] p-8 border-none relative overflow-hidden group shadow-2xl shadow-emerald-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/90 via-emerald-600 to-teal-700 opacity-100 transition-opacity group-hover:opacity-95" />
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700 ease-out">
            <Icons.Finance className="w-40 h-40 text-white" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <span className="text-[10px] font-black text-emerald-100/80 uppercase tracking-[0.3em]">
                Trạng thái tài chính
              </span>
              <div className="flex items-center gap-4">
                <h3 className="text-4xl font-serif font-black text-white uppercase tracking-tight tabular-nums">
                  ₫{Number(accountInfo.balance).toLocaleString('vi-VN')}
                </h3>
                <div className="bg-white/20 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/20 shadow-lg">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">
                    {accountInfo.status}
                  </span>
                </div>
              </div>
            </div>
            {accountInfo.last_payment_date && (
              <div className="text-left md:text-right border-l md:border-l-0 md:bg-white/10 md:backdrop-blur-md md:p-6 md:rounded-3xl border-white/20 pl-6 md:pl-6 transition-all hover:bg-white/20">
                <p className="text-[9px] font-black text-emerald-100/70 uppercase tracking-widest mb-1">
                  Giao dịch thu phí cuối
                </p>
                <p className="text-xl font-black text-white">
                  {new Date(accountInfo.last_payment_date).toLocaleDateString('vi-VN')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const statusSection = (
    <StudentStatusPanel
      studentId={id}
      currentStatus={profile.status as any}
      isAdmin={hasAdminAccess}
    />
  );

  const guardiansSection = <GuardianManagement studentId={id} />;

  const importSection = <ImportHistoryPanel />;

  const documentsSection = <StudentDocuments studentId={id} />;

  const notesSection = <StudentNotes studentId={id} />;

  const enrollmentsSection = (
    <section>
      <EnrollmentManager studentId={id} />
    </section>
  );

  const attendanceSection = (
    <Card
      padding="none"
      className="overflow-hidden border-stone-200 dark:border-white/5 bg-white dark:bg-stone-900/50 shadow-xl"
    >
      <div className="p-8 border-b border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/[0.02]">
        <h2 className="text-xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <Icons.Attendance className="w-5 h-5 text-emerald-600" />
          </div>
          Lịch sử Điểm danh
        </h2>
      </div>

      {attendance.length === 0 ? (
        <div className="p-12">
          <Empty
            title="Sẵn sàng ghi nhận"
            description="Chưa tìm thấy bản ghi điểm danh nào tồn tại trong hệ thống."
          />
        </div>
      ) : (
        <div className="p-2">
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 p-2">
            {attendance.map((a: any) => (
              <div
                key={a.id}
                className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-white/5 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="font-serif italic font-black text-stone-900 dark:text-white capitalize">
                    {new Date(a.date).toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </div>
                  <Badge
                    variant={
                      a.status === 'present'
                        ? 'success'
                        : a.status === 'absent'
                          ? 'danger'
                          : 'warning'
                    }
                    className="font-black text-[9px] uppercase tracking-widest px-3"
                  >
                    {a.status === 'present'
                      ? 'Có mặt'
                      : a.status === 'absent'
                        ? 'Vắng mặt'
                        : 'Đi muộn'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-stone-400">
                  <span>Lớp học</span>
                  <span className="text-stone-700 dark:text-stone-300">
                    {a.classes?.name ?? a.class_id}
                  </span>
                </div>
                {a.notes && (
                  <div className="pt-2 border-t border-stone-50 dark:border-white/5">
                    <p className="text-[10px] text-stone-500 leading-relaxed italic">
                      &quot;{a.notes}&quot;
                    </p>
                  </div>
                )}
                <div className="pt-2 flex justify-end">
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

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-stone-100 dark:border-white/5 shadow-inner m-4">
            <table className="min-w-full text-sm font-sans">
              <thead className="bg-stone-50/50 dark:bg-white/[0.02]">
                <tr>
                  <th className="text-left px-6 py-4 font-black text-stone-400 uppercase tracking-widest text-[10px]">
                    Thời gian
                  </th>
                  <th className="text-left px-6 py-4 font-black text-stone-400 uppercase tracking-widest text-[10px]">
                    Lớp học đào tạo
                  </th>
                  <th className="text-left px-6 py-4 font-black text-stone-400 uppercase tracking-widest text-[10px]">
                    Trạng thái
                  </th>
                  <th className="text-left px-6 py-4 font-black text-stone-400 uppercase tracking-widest text-[10px]">
                    Ghi chú hệ thống
                  </th>
                  <th className="text-right px-6 py-4 font-black text-stone-400 uppercase tracking-widest text-[10px]">
                    Báo cáo Zalo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 dark:divide-white/5">
                {attendance.map((a: any) => (
                  <tr key={a.id} className="hover:bg-emerald-500/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-serif italic font-black text-stone-900 dark:text-white capitalize">
                          {new Date(a.date).toLocaleDateString('vi-VN', { weekday: 'long' })}
                        </span>
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                          {new Date(a.date).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-stone-600 dark:text-stone-300">
                      {a.classes?.name ?? a.class_id}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          a.status === 'present'
                            ? 'success'
                            : a.status === 'absent'
                              ? 'danger'
                              : 'warning'
                        }
                        className="font-black text-[9px] uppercase tracking-widest px-3"
                      >
                        {a.status === 'present'
                          ? 'Có mặt'
                          : a.status === 'absent'
                            ? 'Vắng mặt'
                            : 'Đi muộn'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-stone-500 italic text-xs group-hover:text-stone-900 dark:group-hover:text-stone-300 transition-colors">
                      {a.notes ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
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
        </div>
      )}
    </Card>
  );

  const gradesSection = (
    <Card
      padding="none"
      className="overflow-hidden border-stone-200 dark:border-white/5 bg-white dark:bg-stone-900/50 shadow-xl"
    >
      <div className="p-8 border-b border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/[0.02]">
        <h2 className="text-xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
            <Icons.Grades className="w-5 h-5 text-amber-600" />
          </div>
          Kết quả Học tập
        </h2>
      </div>

      {grades.length === 0 ? (
        <div className="p-12">
          <Empty
            title="Bảng điểm trống"
            description="Hệ thống chưa ghi nhận bất kỳ kết quả học tập nào gần đây."
          />
        </div>
      ) : (
        <div className="p-2">
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 p-2">
            {grades.map((g: any) => {
              const componentLabels: Record<string, string> = {
                oral: 'Miệm',
                fifteen_min: '15 phút',
                one_period: '1 tiết',
                midterm: 'Giữa kỳ',
                final: 'Cuối kỳ',
              };
              return (
                <div
                  key={g.id}
                  className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-white/5 shadow-sm relative overflow-hidden group hover:border-amber-500/30 transition-all"
                >
                  <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:scale-110 transition-transform bg-amber-500 rounded-full">
                    <Icons.Grades className="w-16 h-16" />
                  </div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="space-y-1">
                      <h4 className="font-serif italic font-black text-stone-900 dark:text-white text-lg">
                        {g.subjects?.name ?? '—'}
                      </h4>
                      <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                        {g.graded_at ? new Date(g.graded_at).toLocaleDateString('vi-VN') : '—'}
                      </div>
                    </div>
                    <div className="text-2xl font-black text-amber-600 bg-amber-500/10 px-4 py-2 rounded-2xl border border-amber-500/10">
                      {g.score ?? g.points_earned ?? '—'}
                    </div>
                  </div>
                  <div className="flex gap-2 relative z-10">
                    <Badge
                      variant="default"
                      className="bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 font-black text-[9px] uppercase tracking-widest px-3 border-transparent"
                    >
                      {componentLabels[g.component_type] ?? g.component_type}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-stone-100 dark:border-white/5 shadow-inner m-4">
            <table className="min-w-full text-sm font-sans">
              <thead className="bg-stone-50/50 dark:bg-white/[0.02]">
                <tr>
                  <th className="text-left px-6 py-4 font-black text-stone-400 uppercase tracking-widest text-[10px]">
                    Lĩnh vực chuyên môn
                  </th>
                  <th className="text-left px-6 py-4 font-black text-stone-400 uppercase tracking-widest text-[10px]">
                    Cột điểm
                  </th>
                  <th className="text-left px-6 py-4 font-black text-stone-400 uppercase tracking-widest text-[10px]">
                    Trọng số / Kết quả
                  </th>
                  <th className="text-left px-6 py-4 font-black text-stone-400 uppercase tracking-widest text-[10px]">
                    Ngày ghi nhận
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 dark:divide-white/5">
                {grades.map((g: any) => {
                  const componentLabels: Record<string, string> = {
                    oral: 'Miệm',
                    fifteen_min: '15 phút',
                    one_period: '1 tiết',
                    midterm: 'Giữa kỳ',
                    final: 'Cuối kỳ',
                  };
                  return (
                    <tr key={g.id} className="hover:bg-amber-500/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-amber-500 shadow-amber-glow" />
                          <span className="font-serif italic font-black text-stone-900 dark:text-white uppercase tracking-tight">
                            {g.subjects?.name ?? '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="info"
                          className="bg-stone-100 dark:bg-white/5 text-stone-500 font-black text-[9px] uppercase tracking-widest border-transparent"
                        >
                          {componentLabels[g.component_type] ?? g.component_type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-amber-600">
                            {g.score ?? g.points_earned ?? '—'}
                          </span>
                          <span className="text-[10px] font-black text-stone-300 uppercase leading-none mt-1">
                            / 10.0
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-stone-500 font-black text-[10px] uppercase tracking-widest">
                        {g.graded_at ? new Date(g.graded_at).toLocaleDateString('vi-VN') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );

  const financeSection = (
    <Card padding="lg" className="border-none shadow-none bg-transparent">
      <h2 className="text-2xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-3">
        <Icons.Finance className="w-7 h-7 text-amber-500" /> Hồ sơ Tài chính
      </h2>

      {accountInfo ? (
        <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCardSmall
            label="Trạng thái tài khoản"
            value={accountInfo?.status ?? '—'}
            color="stone"
            icon={<Icons.Clipboard className="w-4 h-4" />}
          />
          <StatCardSmall
            label="Số dư hiện tại"
            value={`₫${accountInfo?.balance?.toLocaleString('vi-VN') ?? '0'}`}
            color="emerald"
            icon={<Icons.Payment className="w-4 h-4" />}
          />
          <StatCardSmall
            label="Thanh toán gần nhất"
            value={
              accountInfo?.last_payment_date
                ? new Date(accountInfo.last_payment_date).toLocaleDateString('vi-VN')
                : 'Chưa có'
            }
            color="blue"
            icon={<Icons.Calendar className="w-4 h-4" />}
          />
        </div>
      ) : (
        <Empty title="Không có tài khoản" description="Không tìm thấy tài khoản học sinh." />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <Icons.Finance className="w-5 h-5 text-amber-500" /> Hóa đơn học phí
            </h3>
            {invoiceRows.length > 0 && (
              <Badge
                variant="default"
                className="bg-amber-500/10 text-amber-600 font-black text-[9px] px-3"
              >
                {invoiceRows.length} Bản ghi
              </Badge>
            )}
          </div>

          {invoiceRows.length === 0 ? (
            <Empty title="Chưa có dữ liệu hóa đơn" />
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-stone-100 dark:border-white/5 overflow-hidden shadow-inner">
              <table className="min-w-full text-[11px] font-sans">
                <thead className="bg-stone-50/50 dark:bg-white/[0.02]">
                  <tr>
                    <th className="px-6 py-4 text-left font-black text-stone-400 uppercase tracking-widest">
                      Mã hóa đơn
                    </th>
                    <th className="px-6 py-4 text-left font-black text-stone-400 uppercase tracking-widest">
                      Số tiền
                    </th>
                    <th className="px-6 py-4 text-left font-black text-stone-400 uppercase tracking-widest">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-left font-black text-stone-400 uppercase tracking-widest">
                      Hạn thanh toán
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 dark:divide-white/5">
                  {invoiceRows.map((inv) => (
                    <tr key={inv.id} className="hover:bg-amber-500/[0.02] transition-colors">
                      <td className="px-6 py-4 font-black text-stone-800 dark:text-stone-200 uppercase tracking-tighter">
                        INV-{inv.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 font-black text-amber-600">
                        ₫{inv.total_amount.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={inv.status === 'paid' ? 'success' : 'warning'}
                          className="font-black text-[9px] uppercase tracking-widest"
                        >
                          {inv.status === 'paid' ? 'Đã thu' : 'Chưa thu'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-stone-500 font-medium">
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString('vi-VN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <Icons.Payment className="w-5 h-5 text-emerald-500" /> Thanh toán gần đây
            </h3>
            {paymentRows.length > 0 && (
              <Badge
                variant="default"
                className="bg-emerald-500/10 text-emerald-600 font-black text-[9px] px-3"
              >
                Lịch sử thu phí
              </Badge>
            )}
          </div>

          {paymentRows.length === 0 ? (
            <Empty title="Chưa có lịch sử thanh toán" />
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-stone-100 dark:border-white/5 overflow-hidden shadow-inner">
              <table className="min-w-full text-[11px] font-sans">
                <thead className="bg-stone-50/50 dark:bg-white/[0.02]">
                  <tr>
                    <th className="px-6 py-4 text-left font-black text-stone-400 uppercase tracking-widest">
                      Ngày thu
                    </th>
                    <th className="px-6 py-4 text-left font-black text-stone-400 uppercase tracking-widest">
                      Số tiền
                    </th>
                    <th className="px-6 py-4 text-left font-black text-stone-400 uppercase tracking-widest">
                      Phương thức
                    </th>
                    <th className="px-6 py-4 text-left font-black text-stone-400 uppercase tracking-widest">
                      Tham chiếu
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 dark:divide-white/5">
                  {paymentRows.map((p) => (
                    <tr key={p.id} className="hover:bg-emerald-500/[0.02] transition-colors">
                      <td className="px-6 py-4 text-stone-600 font-medium font-serif italic">
                        {p.payment_date
                          ? new Date(p.payment_date).toLocaleDateString('vi-VN')
                          : '—'}
                      </td>
                      <td className="px-6 py-4 font-black text-emerald-600 text-sm">
                        ₫{p.amount?.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="default"
                          className="bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 font-black text-[9px] uppercase tracking-widest"
                        >
                          {p.payment_methods?.name ?? '—'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-stone-400 font-mono text-[10px]">
                        {p.transaction_reference ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  const activitySection = (
    <Card
      padding="lg"
      className="border-none shadow-2xl bg-white dark:bg-stone-900 rounded-[2.5rem]"
    >
      <h2 className="text-xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight mb-6 flex items-center gap-2">
        <Icons.History className="w-6 h-6 text-amber-500" /> Nhật ký hoạt động
      </h2>
      {auditRows.length === 0 ? (
        <Empty
          title="Chưa ghi nhận hoạt động nào"
          description="Hoạt động hệ thống của người dùng này sẽ xuất hiện tại đây."
        />
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-[26px] top-4 bottom-4 w-0.5 bg-stone-100 dark:bg-white/5" />

          <ul className="space-y-8 relative z-10">
            {auditRows.map((a) => (
              <li key={a.id} className="flex items-start gap-6 group">
                <div className="relative flex-shrink-0">
                  <div className="w-[52px] h-[52px] rounded-2xl bg-white dark:bg-stone-900 border border-stone-100 dark:border-white/5 shadow-sm flex items-center justify-center transition-all group-hover:scale-110 group-hover:border-amber-500/30">
                    {a.action.includes('create') ? (
                      <Icons.Add className="w-5 h-5 text-emerald-500" />
                    ) : a.action.includes('delete') ? (
                      <Icons.Delete className="w-5 h-5 text-rose-500" />
                    ) : a.action.includes('login') ? (
                      <Icons.Lock className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Icons.Edit className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                </div>

                <div className="flex-1 pt-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="default"
                        className="bg-stone-50 dark:bg-white/5 text-stone-500 dark:text-stone-400 font-black text-[9px] uppercase tracking-[0.1em] px-3 py-1 border-stone-100 dark:border-white/5"
                      >
                        {a.action.toUpperCase()}
                      </Badge>
                      <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest italic opacity-60">
                        {new Date(a.created_at).toLocaleString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </h4>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-50/50 dark:bg-white/[0.02] border border-stone-100/50 dark:border-white/5 transition-all group-hover:border-amber-500/10 group-hover:bg-amber-500/[0.01]">
                    <p className="text-xs text-stone-600 dark:text-stone-400 font-medium leading-relaxed">
                      Tài khoản định danh{' '}
                      <span className="font-mono font-bold text-stone-900 dark:text-stone-200">
                        UID: {a.actor_id?.slice(0, 8).toUpperCase() || 'SYSTEM'}
                      </span>{' '}
                      đã thực hiện ghi nhận này vào Nhật ký hệ thống.
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen bg-transparent py-8 px-4 sm:px-6 lg:px-10 overflow-x-hidden">
      <div className="p-4 md:p-10 max-w-[1600px] mx-auto space-y-8 relative z-10">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              href="/dashboard/students"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
            >
              <span>←</span>
              <span>Quay lại danh sách</span>
            </Link>
            <Link
              href={`/dashboard/students/${id}/progress`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg font-medium text-sm"
            >
              <Icons.Chart className="w-4 h-4" />
              <span>Theo dõi Tiến độ</span>
            </Link>
          </div>
          <StudentActions studentId={id} studentName={profile.full_name} isAdmin={hasAdminAccess} />
        </div>

        {(() => {
          const tabs: { key: string; label: string; content: React.ReactNode }[] = [
            { key: 'overview', label: 'Tổng quan', content: overview },
            { key: 'status', label: 'Trạng thái', content: statusSection },
            { key: 'enrollments', label: 'Ghi danh', content: enrollmentsSection },
            { key: 'guardians', label: 'Phụ huynh', content: guardiansSection },
            { key: 'attendance', label: 'Điểm danh', content: attendanceSection },
            { key: 'grades', label: 'Điểm', content: gradesSection },
            { key: 'imports', label: 'Nhập', content: importSection },
            { key: 'documents', label: 'Tài liệu', content: documentsSection },
            { key: 'notes', label: 'Ghi chú', content: notesSection },
          ];
          if (showFinance)
            tabs.splice(5, 0, { key: 'finance', label: 'Tài chính', content: financeSection });
          if (showActivity)
            tabs.push({ key: 'activity', label: 'Hoạt động', content: activitySection });
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
    emerald: 'text-emerald-600 bg-emerald-500/5 border-emerald-500/10',
    blue: 'text-blue-600 bg-blue-500/5 border-blue-500/10',
    amber: 'text-amber-600 bg-amber-500/5 border-amber-500/10',
    stone: 'text-stone-600 bg-stone-500/5 border-stone-500/10',
  };

  return (
    <div
      className={cn(
        'rounded-3xl p-6 border transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden group',
        colorMap[color]
      )}
    >
      {/* Decorative Glow */}
      <div
        className={cn(
          'absolute -top-10 -right-10 w-24 h-24 blur-3xl opacity-10 transition-opacity group-hover:opacity-20',
          color === 'emerald'
            ? 'bg-emerald-500'
            : color === 'blue'
              ? 'bg-blue-500'
              : color === 'amber'
                ? 'bg-amber-500'
                : 'bg-stone-500'
        )}
      />

      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div
          className={cn(
            'p-2 rounded-xl transition-colors',
            color === 'emerald'
              ? 'bg-emerald-500/10'
              : color === 'blue'
                ? 'bg-blue-500/10'
                : color === 'amber'
                  ? 'bg-amber-500/10'
                  : 'bg-stone-500/10'
          )}
        >
          {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
          {label}
        </span>
      </div>
      <p className="text-2xl font-black tabular-nums tracking-tight relative z-10">{value}</p>
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
        'p-4 bg-stone-50 dark:bg-white/5 rounded-2xl border border-stone-100 dark:border-white/5 group hover:border-amber-500/20 transition-all',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
          {label}
        </span>
      </div>
      <p className="font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight ml-7">
        {value || '—'}
      </p>
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
  const percentage = Math.round((value / total) * 100) || 0;
  const colorMap = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
        <span className="text-stone-400">{label}</span>
        <span
          className={cn(
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
      <div className="h-1.5 bg-stone-100 dark:bg-white/5 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-1000', colorMap[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
