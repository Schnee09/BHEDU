import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Tabs from "@/components/ui/tabs";
import Badge from "@/components/ui/badge";
import Empty from "@/components/ui/empty";

async function fetchStudent(id: string) {
  const supabase = await createClient();

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, address, date_of_birth, created_at, role")
    .eq("id", id)
    .maybeSingle();

  if (pErr) {
    // RLS or other error
    return { profile: null, enrollments: [], classes: [], attendance: [], grades: [], error: pErr.message };
  }
  if (!profile) return { profile: null, enrollments: [], classes: [], attendance: [], grades: [] };

  const [{ data: enrollments }, { data: attendance }, { data: grades }] = await Promise.all([
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
  ]);

  return { profile, enrollments: (enrollments as unknown[]) ?? [], attendance: (attendance as unknown[]) ?? [], grades: (grades as unknown[]) ?? [] };
}

export default async function StudentDetail({ params }: { params: { id: string } }) {
  const { id } = params;
  const { profile, enrollments, attendance, grades } = await fetchStudent(id);

  if (!profile) return notFound();

  const overview = (
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
            <div className="text-xl font-bold text-gray-700">—</div>
            <div className="text-gray-600">Balance</div>
          </div>
        </div>
      </section>
    </div>
  );

  const enrollmentsSection = (
    <section className="bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">Classes & Enrollments</h2>
      {enrollments.length === 0 ? (
        <Empty title="No enrollments" description="This student is not enrolled in any classes." />
      ) : (
        <ul className="space-y-2">
          {/* eslint-disable @typescript-eslint/no-explicit-any */}
          {enrollments.map((e: any) => (
            <li key={e.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{e.classes?.name ?? e.class_id}</p>
                <p className="text-xs text-gray-500">Grade: {e.classes?.grade ?? '-'}</p>
              </div>
              <span className="text-xs text-gray-500">{new Date(e.enrolled_at).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      )}
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
      <Empty title="Coming soon" description="Student accounts, invoices, and payments will appear here." />
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

  const activitySection = (
    <section className="bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">Activity</h2>
      <Empty title="Coming soon" description="A unified timeline of attendance, grades, and other events." />
    </section>
  );

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <Link href="/dashboard/students" className="text-sm text-blue-700 hover:underline">← Back to Students</Link>
      </div>

      <Tabs
        tabs={[
          { key: "overview", label: "Overview", content: overview },
          { key: "enrollments", label: "Enrollments", content: enrollmentsSection },
          { key: "attendance", label: "Attendance", content: attendanceSection },
          { key: "grades", label: "Grades", content: gradesSection },
          { key: "finance", label: "Finance", content: financeSection },
          { key: "documents", label: "Documents", content: documentsSection },
          { key: "notes", label: "Notes", content: notesSection },
          { key: "activity", label: "Activity", content: activitySection },
        ]}
      />
    </div>
  );
}
