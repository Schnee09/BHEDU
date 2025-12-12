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
      .select("id, class_id, date, status, notes")
      .eq("student_id", id)
      .order("date", { ascending: false })
      .limit(20),
    supabase
      .from("grades")
      .select("id, assignment_id, score, feedback, graded_at, assignments(title, max_points)")
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

  const overview = (
    <div className="space-y-6">
      {/* Photo Upload Section */}
      <StudentPhotoUpload 
        studentId={id} 
        currentPhotoUrl={(profile as { photo_url?: string | null }).photo_url}
      />

      {/* Profile and Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card padding="lg" className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Profile Information</h2>
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">{profile.full_name}</h3>
              <p className="text-gray-600 mt-1">{profile.email}</p>
              <div className="mt-4 space-y-2">
                {profile.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-gray-500">📱 Phone:</span>
                    <span className="font-medium">{profile.phone}</span>
                  </div>
                )}
                {profile.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-gray-500">📍 Address:</span>
                    <span className="font-medium">{profile.address}</span>
                  </div>
                )}
                {profile.date_of_birth && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CakeIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-500">Date of Birth:</span>
                    <span className="font-medium">{new Date(profile.date_of_birth).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Icons.Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-500">Joined:</span>
                  <span className="font-medium">{new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <Badge color="purple">{profile.role}</Badge>
          </div>
        </Card>

        {/* Modern Stat Cards with Gradients */}
        <div className="space-y-4">
          <Card padding="md" className="bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Active Classes</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{enrollments.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Icons.Classes className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card padding="md" className="bg-emerald-50 border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">Attendance</p>
                <p className="text-3xl font-bold text-emerald-900 mt-1">{attendance.length}</p>
                <p className="text-xs text-emerald-600 mt-1">Recent records</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Icons.Attendance className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </Card>

          <Card padding="md" className="bg-orange-50 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Recent Grades</p>
                <p className="text-3xl font-bold text-orange-900 mt-1">{grades.length}</p>
                <p className="text-xs text-orange-600 mt-1">Assignments</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Icons.Grades className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>

          {accountInfo && (
            <Card padding="md" className="bg-teal-50 border-teal-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-teal-700">Account Balance</p>
                  <p className="text-3xl font-bold text-teal-900 mt-1">{accountInfo.balance ?? '0'}</p>
                  <p className="text-xs text-teal-600 mt-1 capitalize">{accountInfo.status}</p>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Icons.Finance className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );

  const enrollmentsSection = (
    <section>
      <EnrollmentManager studentId={id} />
    </section>
  );

  const attendanceSection = (
    <Card padding="lg">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Attendance Records</h2>
      {attendance.length === 0 ? (
        <Empty title="No attendance" description="No attendance records found for this student." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Class</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendance.map((a: any) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">{new Date(a.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{a.class_id}</td>
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
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Grades & Assignments</h2>
      {grades.length === 0 ? (
        <Empty title="No grades" description="No recent grades available." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Assignment</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Points</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Graded At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {grades.map((g: any) => (
                <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{g.assignments?.title ?? g.assignment_id}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-blue-600">{g.score}</span>
                    <span className="text-gray-500"> / {g.assignments?.max_points ?? '-'}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{g.graded_at ? new Date(g.graded_at).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  const financeSection = (
    <Card padding="lg">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Finance Overview</h2>
      {accountInfo ? (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card padding="md" className="bg-gradient-to-br from-slate-50 to-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account Status</p>
            <p className="text-xl font-bold text-gray-900 mt-2 capitalize">{accountInfo?.status ?? '—'}</p>
          </Card>
          <Card padding="md" className="bg-gradient-to-br from-emerald-50 to-green-50">
            <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Current Balance</p>
            <p className="text-xl font-bold text-emerald-900 mt-2">${accountInfo?.balance ?? '0'}</p>
          </Card>
          <Card padding="md" className="bg-gradient-to-br from-blue-50 to-indigo-50">
            <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Last Payment</p>
            <p className="text-sm font-semibold text-blue-900 mt-2">
              {accountInfo?.last_payment_date ? new Date(accountInfo.last_payment_date).toLocaleDateString() : 'No payments yet'}
            </p>
          </Card>
        </div>
      ) : (
        <Empty title="No account" description="No student account found." />
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-3 text-gray-900">Recent Invoices</h3>
          {invoiceRows.length === 0 ? (
            <Empty title="No invoices" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">#</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Total</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Balance</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Due</th>
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
                      <td className="px-4 py-3 font-medium">${inv.total_amount}</td>
                      <td className="px-4 py-3 font-semibold text-red-600">${inv.balance}</td>
                      <td className="px-4 py-3 text-gray-600">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div>
          <h3 className="font-semibold mb-3 text-gray-900">Recent Payments</h3>
          {paymentRows.length === 0 ? (
            <Empty title="No payments" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Amount</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Method</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paymentRows.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 font-semibold text-green-600">${p.amount}</td>
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
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Documents</h2>
      <Empty title="Coming soon" description="Upload and manage student documents here." />
    </Card>
  );

  const notesSection = (
    <Card padding="lg">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Notes</h2>
      <Empty title="Coming soon" description="Keep private notes and important remarks." />
    </Card>
  );

  const guardiansSection = (
    <Card padding="lg">
      <GuardianManagement studentId={id} />
    </Card>
  );

  const activitySection = (
    <Card padding="lg">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Activity Log</h2>
      {auditRows.length === 0 ? (
        <Empty title="No recent activity" />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Link 
              href="/dashboard/students" 
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
            >
              <span>←</span>
              <span>Back to Students</span>
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
          { key: "overview", label: "Overview", content: overview },
          { key: "enrollments", label: "Enrollments", content: enrollmentsSection },
          { key: "guardians", label: "Guardians", content: guardiansSection },
          { key: "attendance", label: "Attendance", content: attendanceSection },
          { key: "grades", label: "Grades", content: gradesSection },
          { key: "documents", label: "Documents", content: documentsSection },
          { key: "notes", label: "Notes", content: notesSection },
        ];
        if (showFinance) tabs.splice(5, 0, { key: "finance", label: "Finance", content: financeSection });
        if (showActivity) tabs.push({ key: "activity", label: "Activity", content: activitySection });
        return <Tabs tabs={tabs} />;
      })()}
      </div>
    </div>
  );
}
