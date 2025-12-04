"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Assignment = {
  id: string;
  title: string;
  due_date: string | null;
  class_id: string;
  class_name?: string;
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        // Call API endpoint with auth token
        const response = await fetch("/api/assignments", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch assignments");
        }

        const { data } = await response.json();
        setAssignments(data || []);
      } catch (err: any) {
        console.error("[Assignments] Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  if (loading) return <p>Loading assignments...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;
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
