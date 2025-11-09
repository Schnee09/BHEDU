"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
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
        const { data: classes } = await supabase
          .from("classes")
          .select("id")
          .eq("teacher_id", profile.id);
        query = query.in(
          "class_id",
          classes?.map((c) => c.id) || []
        );
      }

      // Student: only own attendance
      if (profile.role === "student") {
        query = query.eq("student_id", profile.id);
      }

      const { data, error } = await query;
      if (error) console.error("❌ Error fetching attendance:", error);
      setAttendance(
        data?.map((a) => ({
          ...a,
          student_name: (a.profiles && 'full_name' in a.profiles) ? (a.profiles.full_name as string) || "Unknown" : "Unknown",
          class_name: (a.classes && 'name' in a.classes) ? (a.classes.name as string) || "Unknown" : "Unknown",
        })) || []
      );
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
