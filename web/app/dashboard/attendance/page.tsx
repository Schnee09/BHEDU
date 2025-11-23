"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";

type Attendance = {
  id: string;
  class_id: string;
  student_id: string;
  date: string;
  status: string;
  student_name?: string;
  class_name?: string;
};

export default function AttendancePage() {
  const { profile, loading: profileLoading } = useProfile();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profileLoading || !profile) return;

    const fetchAttendance = async () => {
      console.log('[Attendance] Fetching attendance for profile:', profile.role, profile.id);
      setLoading(true);
      let query = supabase
        .from("attendance")
        .select(
          `
          id,
          class_id,
          student_id,
          date,
          status,
          profiles(full_name),
          classes(name)
        `
        )
        .order("date", { ascending: false });

      // Teacher: only attendance of own classes
      if (profile.role === "teacher") {
        console.log('[Attendance] Teacher role, fetching classes');
        const { data: classesRaw } = await supabase
          .from("classes")
          .select("id")
          .eq("teacher_id", profile.id);
        console.log('[Attendance] Teacher classes:', classesRaw);
        const classIds = (classesRaw as Array<{ id: string }> | null)?.map((c) => c.id) || [];
        query = query.in("class_id", classIds);
      }

      // Student: only own attendance
      if (profile.role === "student") {
        console.log('[Attendance] Student role, filtering to student ID');
        query = query.eq("student_id", profile.id);
      }

      const { data, error } = await query;
      if (error) {
        console.error("[Attendance] ❌ Error fetching attendance:", error);
      } else {
        console.log('[Attendance] Fetched', data?.length || 0, 'attendance records');
      }
      const mapped = Array.isArray(data)
        ? (data as unknown[]).map((raw) => {
            const r = raw as {
              id: unknown;
              class_id?: unknown;
              student_id?: unknown;
              date?: unknown;
              status?: unknown;
              profiles?: { full_name?: unknown };
              classes?: { name?: unknown };
            };
            return {
              id: String(r.id as string | number),
              class_id: String((r.class_id as string | number | undefined) || ""),
              student_id: String((r.student_id as string | number | undefined) || ""),
              date: String((r.date as string | undefined) || new Date().toISOString()),
              status: String((r.status as string | undefined) || "Unknown"),
              student_name: (r.profiles?.full_name as string | undefined) || "Unknown",
              class_name: (r.classes?.name as string | undefined) || "Unknown",
            };
          })
        : [];
      setAttendance(mapped);
      setLoading(false);
    };

    fetchAttendance();
  }, [profile, profileLoading]);

  if (profileLoading || loading) return <p>Loading attendance...</p>;
  if (!attendance.length) return <p>No attendance records found.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Attendance Records</h1>
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Student</th>
            <th className="p-3 text-left">Class</th>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {attendance.map((a) => (
            <tr key={a.id} className="border-t hover:bg-gray-50">
              <td className="p-3">{a.student_name}</td>
              <td className="p-3">{a.class_name}</td>
              <td className="p-3">
                {new Date(a.date).toLocaleDateString()}
              </td>
              <td
                className={`p-3 font-medium ${
                  a.status === "Present"
                    ? "text-green-600"
                    : a.status === "Absent"
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {a.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
