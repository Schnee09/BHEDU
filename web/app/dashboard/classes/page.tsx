"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useProfile } from "@/hooks/useProfile";

interface ClassData {
  id: string;
  name: string;
  created_at: string;
  teacher_id: string;
  teacher: {
    full_name: string;
  } | null; // ✅ single object or null
}

export default function ClassesPage() {
  const supabase = createClient();
  const { profile } = useProfile();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchClasses = async () => {
      let query = supabase
        .from("classes")
        .select(`
          id,
          name,
          created_at,
          teacher_id,
          teacher:profiles(full_name)
        `);

      // Example: teachers only see their classes
      if (profile.role === "teacher") {
        query = query.eq("teacher_id", profile.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching classes:", error);
      } else if (Array.isArray(data)) {
        const flattened: ClassData[] = (data as unknown[]).map((raw) => {
          const r = raw as {
            id: unknown;
            name?: unknown;
            created_at?: unknown;
            teacher_id?: unknown;
            teacher?: { full_name?: unknown } | Array<{ full_name?: unknown }>;
          };
          const teacherObj = Array.isArray(r.teacher)
            ? (r.teacher[0] as { full_name?: unknown }) || null
            : (r.teacher as { full_name?: unknown } | undefined) || null;
          return {
            id: String(r.id as string | number),
            name: String((r.name as string | undefined) || "Untitled"),
            created_at: String((r.created_at as string | undefined) || new Date().toISOString()),
            teacher_id: String((r.teacher_id as string | number | undefined) || ""),
            teacher: teacherObj ? { full_name: String(teacherObj.full_name || "Unknown") } : null,
          };
        });
        setClasses(flattened);
      }

      setLoading(false);
    };

    fetchClasses();
  }, [profile, supabase]);

  if (loading) return <p>Loading classes...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Classes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classes.length > 0 ? (
          classes.map((cls) => (
            <div
              key={cls.id}
              className="border p-4 rounded-lg shadow-sm hover:shadow-md transition"
            >
              <h2 className="font-semibold">{cls.name}</h2>
              <p className="text-sm text-gray-500">
                Teacher: {cls.teacher?.full_name || "Unknown"}
              </p>
              <p className="text-xs text-gray-400">
                Created: {new Date(cls.created_at).toLocaleDateString()}
              </p>
            </div>
          ))
        ) : (
          <p>No classes found.</p>
        )}
      </div>
    </div>
  );
}
