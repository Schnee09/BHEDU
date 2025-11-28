"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";

type Assignment = {
  id: string;
  title: string;
  due_date: string | null;
  class_id: string;
  class_name?: string;
};

export default function AssignmentsPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profileLoading || !profile) return;

    const fetchAssignments = async () => {
      setLoading(true);
      let query = supabase
        .from("assignments")
        .select("id, title, due_date, class_id, classes(name)")
        .order("due_date", { ascending: true });

      // Admin: see all assignments (no filter needed)
      if (profile.role === "admin") {
        console.log('[Assignments] Admin role, fetching all assignments');
        // No filter - admins see everything
      }
      // Teachers: only own classes' assignments
      else if (profile.role === "teacher") {
        const { data: classesData } = await supabase
          .from("classes")
          .select("id")
          .eq("teacher_id", profile.id);
        const classIds = (classesData as Array<{ id: string }> | null)?.map((c) => c.id) || [];
        query = query.in("class_id", classIds);
      }
      // Students: only enrolled class assignments
      else if (profile.role === "student") {
        const { data: enrollmentsData } = await supabase
          .from("enrollments")
          .select("class_id")
          .eq("student_id", profile.id);
        const enrolledIds = (enrollmentsData as Array<{ class_id: string }> | null)?.map((e) => e.class_id) || [];
        query = query.in("class_id", enrolledIds);
      }

      const { data, error } = await query;
      if (error) {
        console.error("[Assignments] ❌ Error fetching assignments:", error);
      } else {
        console.log('[Assignments] Fetched', data?.length || 0, 'assignments');
      }
      const mapped: Assignment[] = Array.isArray(data)
        ? (data as unknown[]).map((raw) => {
            const r = raw as {
              id: unknown;
              title?: unknown;
              due_date?: unknown;
              class_id?: unknown;
              classes?: { name?: unknown };
            };
            return {
              id: String(r.id as string | number),
              title: String((r.title as string | undefined) || "Untitled"),
              due_date: (r.due_date as string | null | undefined) ?? null,
              class_id: String((r.class_id as string | number | undefined) || ""),
              class_name: (r.classes?.name as string | undefined) || "Unknown",
            };
          })
        : [];
      setAssignments(mapped);
      setLoading(false);
    };

    fetchAssignments();
  }, [profile, profileLoading]);

  if (profileLoading || loading) return <p>Loading assignments...</p>;
  if (!assignments.length) return <p>No assignments found.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Assignments</h1>
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Title</th>
            <th className="p-3 text-left">Class</th>
            <th className="p-3 text-left">Due Date</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((a) => (
            <tr key={a.id} className="border-t hover:bg-gray-50">
              <td className="p-3">{a.title}</td>
              <td className="p-3">{a.class_name}</td>
              <td className="p-3">
                {a.due_date
                  ? new Date(a.due_date).toLocaleDateString()
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
