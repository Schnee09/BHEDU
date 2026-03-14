import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDataClient } from '@/lib/auth/dataClient'
import Tabs from '@/components/ui/tabs'
import Badge from '@/components/ui/badge'
import Empty from '@/components/ui/empty'
import { Card } from '@/components/ui'
import { Icons } from '@/components/ui/Icons'
import { CakeIcon } from '@heroicons/react/24/outline'
import StudentActions from '@/components/StudentActions'
import GuardianManagement from '@/components/GuardianManagement'
import EnrollmentManager from '@/components/EnrollmentManager'
import StudentPhotoUpload from '@/components/StudentPhotoUpload'
import { AcademicBackground } from '@/components/Academic/AcademicBackground'
import { cn } from '@/lib/utils'

/**
 * Admin Student Detail Page - Academic Refinement
 * Localized and standardized for professional education management.
 */

async function fetchStudentWithClient(supabase: any, id: string) {
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, address, date_of_birth, photo_url, created_at, role')
    .eq('id', id)
    .maybeSingle()

  if (pErr) return { profile: null, enrollments: [], attendance: [], grades: [], error: pErr.message }
  if (!profile) return { profile: null, enrollments: [], attendance: [], grades: [] }

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
      .select('id, class_id, date, status, notes')
      .eq('student_id', id)
      .order('date', { ascending: false })
      .limit(20),
    supabase
      .from('grades')
      .select('id, assignment_id, points_earned, score, feedback, graded_at, assignments(title, total_points, max_points)')
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
      .select('id, invoice_number, status, total_amount, paid_amount, balance, issue_date, due_date')
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
  ])

  return {
    profile,
    enrollments: (enrollments as unknown[]) ?? [],
    attendance: (attendance as unknown[]) ?? [],
    grades: (grades as unknown[]) ?? [],
    account: (account ?? null) as unknown,
    invoices: (invoices as unknown[]) ?? [],
    payments: (payments as unknown[]) ?? [],
    audits: (audits as unknown[]) ?? [],
  }
}

export default async function AdminStudentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { supabase: dataClient, viewerRole, user } = await getDataClient()

  const { profile, enrollments, attendance, grades, account, invoices, payments, audits } = await fetchStudentWithClient(
    dataClient,
    id
  )
  if (!profile) return notFound()

  // account shape is coming from Supabase and can be null; keep a loose type here for rendering
  const accountInfo = account as any

  const showFinance = viewerRole === 'admin' || user?.id === id
  const showActivity = viewerRole === 'admin'
  const invoicesList = (invoices ?? []) as any[]
  const paymentsList = (payments ?? []) as any[]
  const auditsList = (audits ?? []) as any[]

  return (
    <div className="min-h-screen relative overflow-hidden bg-stone-50 dark:bg-[#080808] font-['Be_Vietnam_Pro'] selection:bg-red-600/30 text-stone-900 dark:text-stone-100 p-4 md:p-12 lg:p-16">
      <AcademicBackground />

      <div className="max-w-7xl mx-auto relative z-10 space-y-12">
        <div className="flex items-center justify-between flex-wrap gap-6 border-b border-stone-200 dark:border-stone-800 pb-8">
          <div className="flex flex-col gap-4">
            <Link
              href="/dashboard/students"
              className="inline-flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-red-600 transition-colors uppercase tracking-widest"
            >
              <Icons.Back className="w-4 h-4" />
              <span>Quay lại danh sách</span>
            </Link>
            <div className="flex items-center gap-6 flex-wrap">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
                {profile.full_name}
              </h1>
              <Badge color="purple" className="px-5 py-1.5 rounded-sharp uppercase tracking-widest text-[10px] font-bold">Học sinh</Badge>
            </div>
          </div>
          <StudentActions studentId={id} studentName={profile.full_name} isAdmin={viewerRole === 'admin'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Quick Stats Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="lg:col-span-2">
              <Card padding="lg" className="glass-crystal rounded-sharp border-none shadow-2xl relative overflow-hidden group">
                <div className="flex flex-col md:flex-row items-start justify-between gap-12">
                  <div className="space-y-6 flex-1">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-1 bg-red-600" />
                      <h2 className="text-xl font-bold uppercase tracking-widest text-stone-500">Thông tin cá nhân</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Email liên hệ</p>
                        <p className="font-bold text-lg">{profile.email}</p>
                      </div>
                      {profile.phone && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Số điện thoại</p>
                          <p className="font-bold text-lg">{profile.phone}</p>
                        </div>
                      )}
                      {profile.address && (
                        <div className="space-y-1 lg:col-span-2">
                          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Địa chỉ thường trú</p>
                          <p className="font-bold text-lg">{profile.address}</p>
                        </div>
                      )}
                      {profile.date_of_birth && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Ngày sinh nhật</p>
                          <p className="font-bold text-lg">{new Date(profile.date_of_birth).toLocaleDateString('vi-VN')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <Card padding="lg" className="glass-crystal rounded-sharp border-none hover:bg-white/5 transition-colors border-l-4 border-l-lime-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Lớp học hiện tại</p>
                  <p className="text-4xl font-bold mt-2">{enrollments.length}</p>
                  <p className="text-[10px] text-lime-500 font-bold uppercase tracking-widest mt-2">Đang theo học</p>
                </div>
                <Icons.Classes className="w-12 h-12 text-lime-500/20" />
              </div>
            </Card>

            <Card padding="lg" className="glass-crystal rounded-sharp border-none hover:bg-white/5 transition-colors border-l-4 border-l-red-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Chuyên cần</p>
                  <p className="text-4xl font-bold mt-2">{attendance.length}</p>
                  <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest mt-2">Bản ghi gần nhất</p>
                </div>
                <Icons.Attendance className="w-12 h-12 text-red-600/20" />
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <Card padding="md" className="glass-crystal rounded-sharp border-none p-2 shadow-2xl">
              <StudentPhotoUpload studentId={id} currentPhotoUrl={profile.photo_url} />
            </Card>

            <Card padding="lg" className="glass-crystal rounded-sharp border-none hover:bg-white/5 transition-colors border-l-4 border-l-gold-accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Điểm số & Đánh giá</p>
                  <p className="text-4xl font-bold mt-2">{grades.length}</p>
                  <p className="text-[10px] text-gold-accent font-bold uppercase tracking-widest mt-2">Bài kiểm tra</p>
                </div>
                <Icons.Grades className="w-12 h-12 text-gold-accent/20" />
              </div>
            </Card>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="pt-8">
          <Tabs
            tabs={[
              { key: 'enrollments', label: 'Lớp học', content: <EnrollmentManager studentId={id} /> },
              { key: 'guardians', label: 'Người giám hộ', content: <GuardianManagement studentId={id} /> },
              {
                key: 'attendance', label: 'Điểm danh', content: (
                  <Card padding="lg" className="glass-crystal rounded-sharp border-none shadow-2xl">
                    {attendance.length === 0 ? (
                      <Empty title="Chưa có dữ liệu" description="Học sinh này chưa có bản ghi điểm danh nào." />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 uppercase tracking-widest text-[10px] font-bold">
                              <th className="text-left px-6 py-4">Ngày</th>
                              <th className="text-left px-6 py-4">Lớp</th>
                              <th className="text-left px-6 py-4">Trạng thái</th>
                              <th className="text-left px-6 py-4">Ghi chú</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                            {attendance.map((a: any) => (
                              <tr key={a.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-bold">{new Date(a.date).toLocaleDateString('vi-VN')}</td>
                                <td className="px-6 py-4">{a.class_id}</td>
                                <td className="px-6 py-4">
                                  <Badge color={a.status === 'present' ? 'green' : a.status === 'absent' ? 'red' : 'yellow'} className="rounded-sharp uppercase text-[9px] font-bold px-3">
                                    {a.status === 'present' ? 'Có mặt' : a.status === 'absent' ? 'Vắng mặt' : 'Muộn'}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 text-stone-500">{a.notes ?? '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                )
              },
              {
                key: 'grades', label: 'Điểm số', content: (
                  <Card padding="lg" className="glass-crystal rounded-sharp border-none shadow-2xl">
                    {grades.length === 0 ? (
                      <Empty title="Chưa có dữ liệu" description="Hiện chưa có bài kiểm tra nào được chấm điểm." />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 uppercase tracking-widest text-[10px] font-bold">
                              <th className="text-left px-6 py-4">Bài tập / Bài thi</th>
                              <th className="text-left px-6 py-4">Điểm số</th>
                              <th className="text-left px-6 py-4">Ngày chấm</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                            {grades.map((g: any) => (
                              <tr key={g.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-bold text-stone-900 dark:text-stone-100">{g.assignments?.title ?? g.assignment_id}</td>
                                <td className="px-6 py-4">
                                  <span className="font-bold text-red-600 text-lg">{g.points_earned ?? g.score ?? '—'}</span>
                                  <span className="text-stone-500 text-xs">
                                    {' '}
                                    / {g.assignments?.total_points ?? g.assignments?.max_points ?? '-'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-stone-500">{g.graded_at ? new Date(g.graded_at).toLocaleDateString('vi-VN') : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                )
              },
              ...(showFinance ? [{
                key: 'finance', label: 'Tài chính', content: (
                  <Card padding="lg" className="glass-crystal rounded-sharp border-none shadow-2xl">
                    {account ? (
                      <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-8 glass-crystal rounded-sharp border-l-4 border-l-stone-500">
                          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2 text-center">Trạng thái tài khoản</p>
                          <p className="text-2xl font-bold text-center uppercase tracking-tight">{accountInfo?.status ?? '—'}</p>
                        </div>
                        <div className="p-8 glass-crystal rounded-sharp border-l-4 border-l-red-600">
                          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2 text-center">Số dư hiện tại</p>
                          <p className="text-3xl font-bold text-center text-red-600 tracking-tight">₫{accountInfo?.balance ? Number(accountInfo.balance).toLocaleString('vi-VN') : '0'}</p>
                        </div>
                        <div className="p-8 glass-crystal rounded-sharp border-l-4 border-l-gold-accent text-center">
                          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Thanh toán gần nhất</p>
                          <p className="text-sm font-bold mt-2 uppercase">{accountInfo?.last_payment_date ? new Date(accountInfo.last_payment_date).toLocaleDateString('vi-VN') : 'Chưa có giao dịch'}</p>
                        </div>
                      </div>
                    ) : (
                      <Empty title="Chưa kích hoạt" description="Tài khoản học phí cho học sinh này chưa được khởi tạo." />
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-6">
                        <h3 className="font-bold text-stone-500 uppercase tracking-widest text-[11px] px-6">Hóa đơn gần đây</h3>
                        {invoicesList.length === 0 ? (
                          <Empty title="Trống" />
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                                {invoicesList.map((inv: any) => (
                                  <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-bold">{inv.invoice_number}</td>
                                    <td className="px-6 py-4"><Badge color={inv.status === 'paid' ? 'green' : inv.status === 'overdue' ? 'red' : 'yellow'} className="rounded-sharp uppercase text-[8px] font-bold">{inv.status}</Badge></td>
                                    <td className="px-6 py-4 font-bold text-red-600">₫{Number(inv.balance).toLocaleString('vi-VN')}</td>
                                    <td className="px-6 py-4 text-stone-500 text-[10px] font-bold">{inv.due_date ? new Date(inv.due_date).toLocaleDateString('vi-VN') : '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                      <div className="space-y-6">
                        <h3 className="font-bold text-stone-500 uppercase tracking-widest text-[11px] px-6">Giao dịch thanh toán</h3>
                        {paymentsList.length === 0 ? (
                          <Empty title="Trống" />
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                                {paymentsList.map((p: any) => (
                                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 text-stone-500 text-[10px] font-bold">{p.payment_date ? new Date(p.payment_date).toLocaleDateString('vi-VN') : '—'}</td>
                                    <td className="px-6 py-4 font-bold text-lime-500">₫{Number(p.amount).toLocaleString('vi-VN')}</td>
                                    <td className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">{p.payment_methods?.name ?? '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              }] : []),
              ...(showActivity ? [{
                key: 'activity', label: 'Nhật ký', content: (
                  <Card padding="lg" className="glass-crystal rounded-sharp border-none shadow-2xl">
                    {auditsList.length === 0 ? (
                      <Empty title="Không có hoạt động" />
                    ) : (
                      <ul className="space-y-6">
                        {auditsList.map((a: any) => (
                          <li key={a.id} className="flex items-start gap-6 p-6 rounded-sharp bg-white/5 hover:bg-white/10 transition-all">
                            <div className="w-1.5 h-1.5 mt-2 rounded-full bg-red-600 animate-pulse flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-4 flex-wrap">
                                <Badge color="blue" className="rounded-sharp uppercase text-[9px] font-bold px-3">{a.action}</Badge>
                                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{new Date(a.created_at).toLocaleString('vi-VN')}</span>
                              </div>
                              <p className="text-[10px] text-stone-600 uppercase tracking-widest">Mã định danh tác nhân: {a.actor_id}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                )
              }] : []),
            ]}
          />
        </div>
      </div>
    </div>
  )
}
