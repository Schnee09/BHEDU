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
    if (profileLoading || !profile) {
      console.log('[Assignments] Waiting for profile...', { profileLoading, hasProfile: !!profile });
      return;
    }

    const fetchAssignments = async () => {
      console.log('========================================');
      console.log('[Assignments] START FETCH');
      console.log('[Assignments] Profile:', {
        id: profile.id,
        role: profile.role,
        email: profile.email,
        full_name: profile.full_name
      });
      
      setLoading(true);
      let query = supabase
        .from("assignments")
        .select("id, title, due_date, class_id, classes(name)")
        .order("due_date", { ascending: true });

      // Admin: see all assignments (no filter needed)
      if (profile.role === "admin") {
        console.log('[Assignments] ✅ ADMIN ROLE DETECTED - No filters applied');
        console.log('[Assignments] Query will fetch ALL assignments');
        // No filter - admins see everything
      }
      // Teachers: only own classes' assignments
      else if (profile.role === "teacher") {
        console.log('[Assignments] Teacher role, fetching classes');
        const { data: classesData, error: classError } = await supabase
          .from("classes")
          .select("id")
          .eq("teacher_id", profile.id);
        
        if (classError) {
          console.error('[Assignments] ❌ Error fetching teacher classes:', classError);
        }
        
        console.log('[Assignments] Teacher classes:', classesData);
        const classIds = (classesData as Array<{ id: string }> | null)?.map((c) => c.id) || [];
        console.log('[Assignments] Class IDs to filter:', classIds);
        
        if (classIds.length === 0) {
          console.warn('[Assignments] ⚠️ Teacher has NO classes assigned');
        }
        
        query = query.in("class_id", classIds);
      }
      // Students: only enrolled class assignments
      else if (profile.role === "student") {
        console.log('[Assignments] Student role, fetching enrollments');
        const { data: enrollmentsData, error: enrollError } = await supabase
          .from("enrollments")
          .select("class_id")
          .eq("student_id", profile.id);
        
        if (enrollError) {
          console.error('[Assignments] ❌ Error fetching enrollments:', enrollError);
        }
        
        console.log('[Assignments] Student enrollments:', enrollmentsData);
        const enrolledIds = (enrollmentsData as Array<{ class_id: string }> | null)?.map((e) => e.class_id) || [];
        console.log('[Assignments] Enrolled class IDs to filter:', enrolledIds);
        
        if (enrolledIds.length === 0) {
          console.warn('[Assignments] ⚠️ Student has NO enrollments');
        }
        
        query = query.in("class_id", enrolledIds);
      }
      else {
        console.warn('[Assignments] ⚠️ UNKNOWN ROLE:', profile.role);
      }

      console.log('[Assignments] Executing query...');
      const { data, error } = await query;
      
      if (error) {
        console.error("[Assignments] ❌ Error fetching assignments:");
        console.error(error);
      } else {
        console.log('[Assignments] ✅ Query successful!');
        console.log('[Assignments] Records fetched:', data?.length || 0);
        if (data && data.length > 0) {
          console.log('[Assignments] First record sample:', data[0]);
        } else {
          console.warn('[Assignments] ⚠️ NO RECORDS FOUND');
        }
      }
      console.log('========================================');
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
