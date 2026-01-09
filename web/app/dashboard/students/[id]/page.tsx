import Link from "next/link";
import { notFound } from "next/navigation";
import { getDataClient } from '@/lib/auth/dataClient';
import Tabs from "@/components/ui/tabs";
import Badge from "@/components/ui/badge";
import Empty from "@/components/ui/empty";
import { Card } from "@/components/ui";
import { Icons } from "@/components/ui/Icons";
import { CakeIcon } from "@heroicons/react/24/outline";
import StudentActions from "@/components/StudentActions";
import GuardianManagement from "@/components/GuardianManagement";
import EnrollmentManager from "@/components/EnrollmentManager";
import StudentPhotoUpload from "@/components/StudentPhotoUpload";
import StudentNotes from "@/components/StudentNotes";
import StudentDocuments from "@/components/StudentDocuments";

import StudentStatusPanel from "../../../../components/StudentStatusPanel";
import ImportHistoryPanel from "../../../../components/ImportHistoryPanel";

/**
 * Fetch student data using the provided Supabase client.
 * This allows higher-privilege callers (admin) to pass a service client
 * so RLS won't hide student-related rows.
 */
async function fetchStudentWithClient(supabase: any, id: string) {
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, address, date_of_birth, photo_url, created_at, role")
    .eq("id", id)
    .maybeSingle();

  if (pErr) {
    // RLS or other error
    return { profile: null, enrollments: [], classes: [], attendance: [], grades: [], error: pErr.message };
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
      .from("enrollments")
      .select("id, class_id, enrollment_date, status, classes(id, name)")
      .eq("student_id", id)
      .order("enrollment_date", { ascending: false }),
    supabase
      .from("attendance")
      .select("id, class_id, date, status, notes, classes(id, name)")
      .eq("student_id", id)
      .order("date", { ascending: false })
      .limit(20),
    supabase
      .from("grades")
      .select("id, score, points_earned, component_type, semester, graded_at, subjects(code, name), classes(name)")
      .eq("student_id", id)
      .order("graded_at", { ascending: false })
      .limit(20),
    supabase
      .from("student_accounts")
      .select("id, student_id, balance, status, last_payment_date")
      .eq("student_id", id)
      .maybeSingle(),
    supabase
      .from("invoices")
      .select("id, invoice_number, status, total_amount, paid_amount, balance, issue_date, due_date")
      .eq("student_id", id)
      .order("issue_date", { ascending: false })
      .limit(10),
    supabase
      .from("payments")
      .select("id, amount, payment_date, transaction_reference, invoice_id, payment_methods(name)")
      .eq("student_id", id)
      .order("payment_date", { ascending: false })
      .limit(10),
    supabase
      .from("audit_logs")
      .select("id, actor_id, action, resource_type, resource_id, created_at")
      .eq("resource_type", "student")
      .eq("resource_id", id)
      .order("created_at", { ascending: false })
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

  const { profile, enrollments, attendance, grades, account, invoices, payments, audits } = await fetchStudentWithClient(
    dataClient,
    id
  );

  const showFinance = viewerRole === "admin" || (user?.id === id);
  const showActivity = viewerRole === "admin";

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
  const attendanceRate = attendanceStats.total > 0
    ? Math.round(((attendanceStats.present + attendanceStats.late) / attendanceStats.total) * 100)
    : 100;

  const gradeScores = grades.map((g: any) => g.score ?? g.points_earned).filter((s: any) => s != null);
  const averageGrade = gradeScores.length > 0
    ? (gradeScores.reduce((a: number, b: number) => a + b, 0) / gradeScores.length).toFixed(1)
    : '—';

  const overview = (
    <div className="space-y-6">
      {/* Hero Section with Photo and Quick Stats */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-xl" />
        <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-xl p-6 overflow-hidden">
          {/* Student Info Row */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Photo + Name */}
            <div className="flex items-center gap-4">
              <StudentPhotoUpload
                studentId={id}
                currentPhotoUrl={(profile as { photo_url?: string | null }).photo_url}
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile.full_name}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">{profile.email}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge color="purple">{profile.role}</Badge>
                  {enrollments.length > 0 && (
                    <Badge color="blue">{(enrollments[0] as any)?.classes?.name}</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:ml-auto">
              <div className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-900/20 rounded-xl p-4 text-center border border-emerald-200/50 dark:border-emerald-700/50 hover:shadow-lg transition-all">
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{attendanceRate}%</p>
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Chuyên cần</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/20 rounded-xl p-4 text-center border border-blue-200/50 dark:border-blue-700/50 hover:shadow-lg transition-all">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{averageGrade}</p>
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Điểm TB</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/20 rounded-xl p-4 text-center border border-purple-200/50 dark:border-purple-700/50 hover:shadow-lg transition-all">
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{enrollments.length}</p>
                <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Lớp học</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/20 rounded-xl p-4 text-center border border-orange-200/50 dark:border-orange-700/50 hover:shadow-lg transition-all">
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{grades.length}</p>
                <p className="text-xs font-medium text-orange-700 dark:text-orange-300">Điểm số</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Info Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-slate-700/50 shadow-lg p-6 hover:shadow-xl transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
              <Icons.Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </span>
            Thông tin cá nhân
          </h3>
          <div className="space-y-3">
            {profile.phone && (
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xl">📱</span>
                <div>
                  <p className="text-xs text-gray-500">Điện thoại</p>
                  <p className="font-medium text-gray-900">{profile.phone}</p>
                </div>
              </div>
            )}
            {profile.address && (
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xl">📍</span>
                <div>
                  <p className="text-xs text-gray-500">Địa chỉ</p>
                  <p className="font-medium text-gray-900">{profile.address}</p>
                </div>
              </div>
            )}
            {profile.date_of_birth && (
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <CakeIcon className="w-5 h-5 text-pink-500" />
                <div>
                  <p className="text-xs text-gray-500">Ngày sinh</p>
                  <p className="font-medium text-gray-900">{new Date(profile.date_of_birth).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <Icons.Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Ngày tham gia</p>
                <p className="font-medium text-gray-900">{new Date(profile.created_at).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Summary Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-slate-700/50 shadow-lg p-6 hover:shadow-xl transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center">
              <Icons.Attendance className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </span>
            Tổng quan điểm danh
          </h3>
          {attendanceStats.total === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Chưa có dữ liệu điểm danh</div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="35" stroke="#e5e7eb" strokeWidth="6" fill="none" />
                    <circle
                      cx="40" cy="40" r="35"
                      stroke={attendanceRate >= 80 ? '#22c55e' : attendanceRate >= 60 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${attendanceRate * 2.2} 220`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-bold text-lg">
                    {attendanceRate}%
                  </span>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Có mặt</span>
                    <span className="font-semibold text-green-600">{attendanceStats.present}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Đi muộn</span>
                    <span className="font-semibold text-yellow-600">{attendanceStats.late}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Vắng mặt</span>
                    <span className="font-semibold text-red-600">{attendanceStats.absent}</span>
                  </div>
                </div>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
                <div className="bg-green-500 transition-all" style={{ width: `${(attendanceStats.present / attendanceStats.total) * 100}%` }} />
                <div className="bg-yellow-500 transition-all" style={{ width: `${(attendanceStats.late / attendanceStats.total) * 100}%` }} />
                <div className="bg-red-500 transition-all" style={{ width: `${(attendanceStats.absent / attendanceStats.total) * 100}%` }} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Grades Preview */}
      {grades.length > 0 && (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-slate-700/50 shadow-lg p-6 hover:shadow-xl transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
              <Icons.Grades className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </span>
            Điểm gần đây
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {grades.slice(0, 6).map((g: any) => (
              <div key={g.id} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 rounded-xl p-3 text-center hover:shadow-md transition-all hover:scale-[1.02]">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{g.score ?? g.points_earned}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{g.subjects?.name ?? 'N/A'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account Info (if exists) */}
      {accountInfo && (
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl border border-teal-200/50 shadow-lg p-6">
          <h3 className="text-lg font-semibold text-teal-900 mb-3 flex items-center gap-2">
            <Icons.Finance className="w-5 h-5 text-teal-600" />
            Tài khoản
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-teal-600">₫{accountInfo.balance ?? '0'}</p>
              <p className="text-sm text-teal-700 capitalize">{accountInfo.status}</p>
            </div>
            {accountInfo.last_payment_date && (
              <div className="text-right">
                <p className="text-xs text-teal-600">Thanh toán gần nhất</p>
                <p className="font-medium text-teal-900">{new Date(accountInfo.last_payment_date).toLocaleDateString('vi-VN')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const enrollmentsSection = (
    <section>
      <EnrollmentManager studentId={id} />
    </section>
  );

  const attendanceSection = (
    <Card padding="lg">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Bản ghi điểm danh</h2>
      {attendance.length === 0 ? (
        <Empty title="Không có điểm danh" description="Không tìm thấy bản ghi điểm danh nào cho học sinh này." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Ngày</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Lớp</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Trạng thái</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendance.map((a: any) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">{new Date(a.date).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">{a.classes?.name ?? a.class_id}</td>
                  <td className="px-4 py-3">
                    <Badge color={a.status === 'present' ? 'green' : a.status === 'absent' ? 'red' : 'yellow'}>
                      {a.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.notes ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  const gradesSection = (
    <Card padding="lg">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Điểm số</h2>
      {grades.length === 0 ? (
        <Empty title="Không có điểm" description="Chưa có điểm nào gần đây." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Môn học</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Loại điểm</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Điểm</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Ngày chấm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {grades.map((g: any) => {
                const componentLabels: Record<string, string> = {
                  oral: 'Miệng',
                  fifteen_min: '15 phút',
                  one_period: '1 tiết',
                  midterm: 'Giữa kỳ',
                  final: 'Cuối kỳ',
                };
                return (
                  <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{g.subjects?.name ?? 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-700">{componentLabels[g.component_type] ?? g.component_type}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-blue-600">{g.score ?? g.points_earned ?? '—'}</span>
                      <span className="text-gray-500"> / 10</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{g.graded_at ? new Date(g.graded_at).toLocaleString('vi-VN') : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  const financeSection = (
    <Card padding="lg">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Tổng quan tài chính</h2>
      {accountInfo ? (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card padding="md" className="bg-gradient-to-br from-slate-50 to-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Trạng thái tài khoản</p>
            <p className="text-xl font-bold text-gray-900 mt-2 capitalize">{accountInfo?.status ?? '—'}</p>
          </Card>
          <Card padding="md" className="bg-gradient-to-br from-emerald-50 to-green-50">
            <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Số dư hiện tại</p>
            <p className="text-xl font-bold text-emerald-900 mt-2">₫{accountInfo?.balance ?? '0'}</p>
          </Card>
          <Card padding="md" className="bg-gradient-to-br from-blue-50 to-indigo-50">
            <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Thanh toán gần nhất</p>
            <p className="text-sm font-semibold text-blue-900 mt-2">
              {accountInfo?.last_payment_date ? new Date(accountInfo.last_payment_date).toLocaleDateString('vi-VN') : 'Chưa có thanh toán'}
            </p>
          </Card>
        </div>
      ) : (
        <Empty title="Không có tài khoản" description="Không tìm thấy tài khoản học sinh." />
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-3 text-gray-900">Hóa đơn gần đây</h3>
          {invoiceRows.length === 0 ? (
            <Empty title="Không có hóa đơn" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">#</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Total</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Số dư</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Hạn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoiceRows.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{inv.invoice_number}</td>
                      <td className="px-4 py-3">
                        <Badge color={inv.status === 'paid' ? 'green' : inv.status === 'overdue' ? 'red' : 'yellow'}>
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium">₫{inv.total_amount}</td>
                      <td className="px-4 py-3 font-semibold text-red-600">₫{inv.balance}</td>
                      <td className="px-4 py-3 text-gray-600">{inv.due_date ? new Date(inv.due_date).toLocaleDateString('vi-VN') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div>
          <h3 className="font-semibold mb-3 text-gray-900">Thanh toán gần đây</h3>
          {paymentRows.length === 0 ? (
            <Empty title="Không có thanh toán" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Ngày</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Số tiền</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Phương thức</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paymentRows.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600">{p.payment_date ? new Date(p.payment_date).toLocaleDateString('vi-VN') : '—'}</td>
                      <td className="px-4 py-3 font-semibold text-green-600">₫{p.amount}</td>
                      <td className="px-4 py-3">{p.payment_methods?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{p.transaction_reference ?? '—'}</td>
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

  const documentsSection = (
    <Card padding="lg">
      <StudentDocuments studentId={id} />
    </Card>
  );

  const notesSection = (
    <Card padding="lg">
      <StudentNotes studentId={id} />
    </Card>
  );

  const guardiansSection = (
    <Card padding="lg">
      <GuardianManagement studentId={id} />
    </Card>
  );

  const statusSection = (
    <Card padding="lg">
      <StudentStatusPanel studentId={id} currentStatus={(profile as any).status ?? 'active'} isAdmin={viewerRole === 'admin'} />
    </Card>
  );

  const importSection = (
    <Card padding="lg">
      <ImportHistoryPanel />
    </Card>
  );

  const activitySection = (
    <Card padding="lg">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Nhật ký hoạt động</h2>
      {auditRows.length === 0 ? (
        <Empty title="Không có hoạt động gần đây" />
      ) : (
        <ul className="space-y-4">
          {auditRows.map((a) => (
            <li key={a.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge color="blue">{a.action}</Badge>
                  <span className="text-sm text-gray-600">·</span>
                  <span className="text-sm text-gray-500">{new Date(a.created_at).toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Actor ID: {a.actor_id}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
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
          <StudentActions
            studentId={id}
            studentName={profile.full_name}
            isAdmin={viewerRole === 'admin'}
          />
        </div>

        {(() => {
          const tabs: { key: string; label: string; content: React.ReactNode }[] = [
            { key: "overview", label: "Tổng quan", content: overview },
            { key: "status", label: "Trạng thái", content: statusSection },
            { key: "enrollments", label: "Ghi danh", content: enrollmentsSection },
            { key: "guardians", label: "Phụ huynh", content: guardiansSection },
            { key: "attendance", label: "Điểm danh", content: attendanceSection },
            { key: "grades", label: "Điểm", content: gradesSection },
            { key: "imports", label: "Nhập", content: importSection },
            { key: "documents", label: "Tài liệu", content: documentsSection },
            { key: "notes", label: "Ghi chú", content: notesSection },
          ];
          if (showFinance) tabs.splice(5, 0, { key: "finance", label: "Tài chính", content: financeSection });
          if (showActivity) tabs.push({ key: "activity", label: "Hoạt động", content: activitySection });
          return <Tabs tabs={tabs} />;
        })()}
      </div>
    </div>
  );
}
