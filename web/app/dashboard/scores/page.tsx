"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile } from "@/hooks/useProfile";

type Score = {
  id: string;
  class_id: string;
  student_id: string;
  value: number;
  assignment_id: string | null;
  student_name?: string;
  class_name?: string;
  assignment_title?: string;
};

export default function ScoresPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profileLoading || !profile) return;

    const fetchScores = async () => {
      setLoading(true);
      let query = supabase
        .from("scores")
        .select(
          `
          id,
          class_id,
          student_id,
          value,
          assignment_id,
          profiles(full_name),
          classes(name),
          assignments(title)
        `
        )
        .order("value", { ascending: false });

      // Teacher: only scores from their classes
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

      // Student: only own scores
      if (profile.role === "student") {
        query = query.eq("student_id", profile.id);
      }

      const { data, error } = await query;
      if (error) console.error("❌ Error fetching scores:", error);
      setScores(
        data?.map((s: any) => ({
          ...s,
          student_name: s.profiles?.full_name || "Unknown",
          class_name: s.classes?.name || "Unknown",
          assignment_title: s.assignments?.title || "N/A",
        })) || []
      );
      setLoading(false);
    };

    fetchScores();
  }, [profile, profileLoading]);

  if (profileLoading || loading) return <p>Loading scores...</p>;
  if (!scores.length) return <p>No scores found.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Scores</h1>
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Student</th>
            <th className="p-3 text-left">Class</th>
            <th className="p-3 text-left">Assignment</th>
            <th className="p-3 text-left">Score</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((s) => (
            <tr key={s.id} className="border-t hover:bg-gray-50">
              <td className="p-3">{s.student_name}</td>
              <td className="p-3">{s.class_name}</td>
              <td className="p-3">{s.assignment_title}</td>
              <td
                className={`p-3 font-semibold ${
                  s.value >= 90
                    ? "text-green-600"
                    : s.value >= 60
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {s.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
