"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile } from "@/hooks/useProfile";

type Student = {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
};

export default function StudentsPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profileLoading || !profile) return;

    const fetchStudents = async () => {
      setLoading(true);
      let query = supabase
        .from("profiles")
        .select("id, full_name, role, created_at")
        .eq("role", "student");

      // Teachers only see students in their classes
      if (profile.role === "teacher") {
        const { data: teacherClasses } = await supabase
          .from("classes")
          .select("id")
          .eq("teacher_id", profile.id);
        const classIds = (teacherClasses as Array<{ id: string }> | null)?.map((c) => c.id) || [];
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("student_id")
          .in("class_id", classIds);
        const studentIds = (enrollments as Array<{ student_id: string }> | null)?.map((e) => e.student_id) || [];
        query = query.in("id", studentIds);
      }

      const { data, error } = await query;
      if (error) console.error("❌ Error fetching students:", error);
      const mapped: Student[] = Array.isArray(data)
        ? (data as unknown[]).map((raw) => {
            const r = raw as {
              id: unknown;
              full_name?: unknown;
              role?: unknown;
              created_at?: unknown;
            };
            return {
              id: String(r.id as string | number),
              full_name: String((r.full_name as string | undefined) || "Unknown"),
              role: String((r.role as string | undefined) || "student"),
              created_at: String((r.created_at as string | undefined) || new Date().toISOString()),
            };
          })
        : [];
      setStudents(mapped);
      setLoading(false);
    };

    fetchStudents();
  }, [profile, profileLoading]);

  if (profileLoading || loading) return <p>Loading students...</p>;
  if (!students.length) return <p>No students found.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Students</h1>
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Full Name</th>
            <th className="p-3 text-left">Role</th>
            <th className="p-3 text-left">Joined</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id} className="border-t hover:bg-gray-50">
              <td className="p-3">{s.full_name}</td>
              <td className="p-3 capitalize">{s.role}</td>
              <td className="p-3">
                {new Date(s.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
