"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  // Simple debounce to avoid spamming queries while typing
  const debouncedSearch = useMemo(() => {
    const value = search.trim();
    return value.length >= 2 ? value : "";
  }, [search]);

  useEffect(() => {
    if (profileLoading || !profile) return;

    const fetchStudents = async () => {
      setLoading(true);
      let query = supabase
        .from("profiles")
        .select("id, full_name, role, created_at")
        .eq("role", "student");

      if (debouncedSearch) {
        query = query.ilike("full_name", `%${debouncedSearch}%`);
      }

      // Teachers only see students in their classes
      if (profile.role === "teacher") {
        const { data: teacherClasses } = await supabase
          .from("classes")
          .select("id")
          .eq("teacher_id", profile.id);
        const classIds = (teacherClasses as Array<{ id: string }> | null)?.map((c) => c.id) || [];
        if (classIds.length) {
          const { data: enrollments } = await supabase
            .from("enrollments")
            .select("student_id")
            .in("class_id", classIds);
          const studentIds = (enrollments as Array<{ student_id: string }> | null)?.map((e) => e.student_id) || [];
          if (studentIds.length) {
            query = query.in("id", studentIds);
          } else {
            setStudents([]);
            setLoading(false);
            return;
          }
        }
      }

      const from = page * pageSize;
      const to = from + pageSize - 1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = (query as any)
        .order("created_at", { ascending: false })
        .range(from, to);
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
  }, [profile, profileLoading, debouncedSearch, page]);

  if (profileLoading || loading) return <p>Loading students...</p>;
  if (!students.length) return <p>No students found.</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="text-2xl font-bold">Students</h1>
        <div className="flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name (min 2 characters)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>
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
              <td className="p-3">
                <Link href={`/dashboard/students/${s.id}`} className="text-blue-700 hover:underline">
                  {s.full_name}
                </Link>
              </td>
              <td className="p-3 capitalize">{s.role}</td>
              <td className="p-3">
                {new Date(s.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between mt-4">
        <button
          className="px-3 py-2 border rounded disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          Previous
        </button>
        <div className="text-sm text-gray-600">Page {page + 1}</div>
        <button
          className="px-3 py-2 border rounded"
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
