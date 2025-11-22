import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Tabs from "@/components/ui/tabs";
import Badge from "@/components/ui/badge";
import Empty from "@/components/ui/empty";
import StudentActions from "@/components/StudentActions";
import GuardianManagement from "@/components/GuardianManagement";
import EnrollmentManager from "@/components/EnrollmentManager";
import StudentPhotoUpload from "@/components/StudentPhotoUpload";

async function fetchStudent(id: string) {
  const supabase = await createClient();

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
      .select("id, class_id, enrolled_at, classes(name, grade)")
      .eq("student_id", id)
      .order("enrolled_at", { ascending: false }),
    supabase
      .from("attendance")
      .select("id, class_id, date, status, notes")
      .eq("student_id", id)
      .order("date", { ascending: false })
      .limit(20),
    supabase
      .from("grades")
      .select("id, assignment_id, points_earned, graded_at, assignments(title, total_points)")
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

export default async function StudentDetail({ params }: { params: { id: string } }) {
  const { id } = params;
  const { profile, enrollments, attendance, grades, account, invoices, payments, audits } = await fetchStudent(id);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user ?? null;
  let viewerRole: string | null = null;
  if (user) {
  const { data: viewer } = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
    viewerRole = (viewer as { role?: string } | null)?.role ?? null;
  }
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
        <section className="bg-white border border-gray-200 rounded-lg p-4 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Profile</h2>
          <div className="flex items-start justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold">{profile.full_name}</h3>
              <p className="text-gray-600">{profile.email}</p>
              <div className="mt-2 text-sm text-gray-700 space-y-1">
                {profile.phone && <p>Phone: {profile.phone}</p>}
                {profile.address && <p>Address: {profile.address}</p>}
                {profile.date_of_birth && <p>DOB: {new Date(profile.date_of_birth).toLocaleDateString()}</p>}
                <p>Joined: {new Date(profile.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <Badge color="purple">{profile.role}</Badge>
          </div>
        </section>
        <section className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Summary</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-xl font-bold text-blue-600">{enrollments.length}</div>
              <div className="text-gray-600">Classes</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="text-xl font-bold text-green-600">{attendance.length}</div>
              <div className="text-gray-600">Recent Attendance</div>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <div className="text-xl font-bold text-purple-600">{grades.length}</div>
              <div className="text-gray-600">Recent Grades</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xl font-bold text-gray-700">{accountInfo?.balance ?? '—'}</div>
              <div className="text-gray-600">Balance</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  const enrollmentsSection = (
    <section>
      <EnrollmentManager studentId={id} />
    </section>
  );

  const attendanceSection = (
    <section className="bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">Attendance</h2>
      {attendance.length === 0 ? (
        <Empty title="No attendance" description="No attendance records found for this student." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-left px-3 py-2">Class</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {/* eslint-disable @typescript-eslint/no-explicit-any */}
              {attendance.map((a: any) => (
                <tr key={a.id}>
                  <td className="px-3 py-2">{new Date(a.date).toLocaleDateString()}</td>
                  <td className="px-3 py-2">{a.class_id}</td>
                  <td className="px-3 py-2 capitalize">{a.status}</td>
                  <td className="px-3 py-2">{a.notes ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  const gradesSection = (
    <section className="bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">Grades</h2>
      {grades.length === 0 ? (
        <Empty title="No grades" description="No recent grades available." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2">Assignment</th>
                <th className="text-left px-3 py-2">Points</th>
                <th className="text-left px-3 py-2">Graded At</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {/* eslint-disable @typescript-eslint/no-explicit-any */}
              {grades.map((g: any) => (
                <tr key={g.id}>
                  <td className="px-3 py-2">{g.assignments?.title ?? g.assignment_id}</td>
                  <td className="px-3 py-2">{g.points_earned} / {g.assignments?.total_points ?? '-'}</td>
                  <td className="px-3 py-2">{g.graded_at ? new Date(g.graded_at).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  const financeSection = (
    <section className="bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">Finance</h2>
      {accountInfo ? (
        <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500">Account Status</div>
            <div className="font-semibold">{accountInfo?.status ?? '—'}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500">Balance</div>
            <div className="font-semibold">{accountInfo?.balance ?? '—'}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500">Last Payment</div>
            <div className="font-semibold">{accountInfo?.last_payment_date ? new Date(accountInfo.last_payment_date).toLocaleDateString() : '—'}</div>
          </div>
        </div>
      ) : (
        <Empty title="No account" description="No student account found." />
      )}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Recent Invoices</h3>
          {invoiceRows.length === 0 ? (
            <Empty title="No invoices" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2">#</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">Total</th>
                    <th className="text-left px-3 py-2">Balance</th>
                    <th className="text-left px-3 py-2">Due</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {invoiceRows.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-3 py-2">{inv.invoice_number}</td>
                      <td className="px-3 py-2 capitalize">{inv.status}</td>
                      <td className="px-3 py-2">{inv.total_amount}</td>
                      <td className="px-3 py-2">{inv.balance}</td>
                      <td className="px-3 py-2">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div>
          <h3 className="font-semibold mb-2">Recent Payments</h3>
          {paymentRows.length === 0 ? (
            <Empty title="No payments" />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2">Date</th>
                    <th className="text-left px-3 py-2">Amount</th>
                    <th className="text-left px-3 py-2">Method</th>
                    <th className="text-left px-3 py-2">Ref</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paymentRows.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '—'}</td>
                      <td className="px-3 py-2">{p.amount}</td>
                      <td className="px-3 py-2">{p.payment_methods?.name ?? '—'}</td>
                      <td className="px-3 py-2">{p.transaction_reference ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );

  const documentsSection = (
    <section className="bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">Documents</h2>
      <Empty title="Coming soon" description="Upload and manage student documents here." />
    </section>
  );

  const notesSection = (
    <section className="bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">Notes</h2>
      <Empty title="Coming soon" description="Keep private notes and important remarks." />
    </section>
  );

  const guardiansSection = (
    <section className="bg-white border border-gray-200 rounded-lg p-4">
      <GuardianManagement studentId={id} />
    </section>
  );

  const activitySection = (
    <section className="bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">Activity</h2>
      {auditRows.length === 0 ? (
        <Empty title="No recent activity" />
      ) : (
        <ul className="space-y-3">
          {auditRows.map((a) => (
            <li key={a.id} className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-gray-400" />
              <div>
                <div className="text-sm">
                  <span className="font-medium">{a.action}</span>
                  <span className="text-gray-500"> · {new Date(a.created_at).toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-600">Actor: {a.actor_id}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/students" className="text-sm text-blue-700 hover:underline">← Back to Students</Link>
          <Link 
            href={`/dashboard/students/${id}/progress`}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm flex items-center gap-2"
          >
            📊 Theo dõi Tiến độ
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
  );
}
