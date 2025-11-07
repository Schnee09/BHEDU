"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
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

      // Teachers: only own classes’ assignments
      if (profile.role === "teacher") {
        query = query.in(
          "class_id",
          (
            await supabase
              .from("classes")
              .select("id")
              .eq("teacher_id", profile.id)
          ).data?.map((c) => c.id) || []
        );
      }

      // Students: only enrolled class assignments
      if (profile.role === "student") {
        query = query.in(
          "class_id",
          (
            await supabase
              .from("enrollments")
              .select("class_id")
              .eq("student_id", profile.id)
          ).data?.map((e) => e.class_id) || []
        );
      }

      const { data, error } = await query;
      if (error) console.error("❌ Error fetching assignments:", error);
      setAssignments(
        data?.map((a) => ({
          ...a,
          class_name: (a as any).classes?.name || "Unknown",
        })) || []
      );
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
