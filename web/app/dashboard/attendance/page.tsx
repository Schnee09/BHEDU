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
    if (profileLoading || !profile) {
      console.log('[Attendance] Waiting for profile...', { profileLoading, hasProfile: !!profile });
      return;
    }

    const fetchAttendance = async () => {
      console.log('========================================');
      console.log('[Attendance] START FETCH');
      console.log('[Attendance] Profile:', {
        id: profile.id,
        role: profile.role,
        email: profile.email,
        full_name: profile.full_name
      });
      
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

      // Admin: see all attendance (no filter needed)
      if (profile.role === "admin") {
        console.log('[Attendance] ✅ ADMIN ROLE DETECTED - No filters applied');
        console.log('[Attendance] Query will fetch ALL attendance records');
        // No filter - admins see everything
      }
      // Teacher: only attendance of own classes
      else if (profile.role === "teacher") {
        console.log('[Attendance] Teacher role, fetching classes');
        const { data: classesRaw, error: classError } = await supabase
          .from("classes")
          .select("id")
          .eq("teacher_id", profile.id);
        
        if (classError) {
          console.error('[Attendance] ❌ Error fetching teacher classes:', classError);
        }
        
        console.log('[Attendance] Teacher classes:', classesRaw);
        const classIds = (classesRaw as Array<{ id: string }> | null)?.map((c) => c.id) || [];
        console.log('[Attendance] Class IDs to filter:', classIds);
        
        if (classIds.length === 0) {
          console.warn('[Attendance] ⚠️ Teacher has NO classes assigned');
        }
        
        query = query.in("class_id", classIds);
      }
      // Student: only own attendance
      else if (profile.role === "student") {
        console.log('[Attendance] Student role, filtering to student ID:', profile.id);
        query = query.eq("student_id", profile.id);
      }
      else {
        console.warn('[Attendance] ⚠️ UNKNOWN ROLE:', profile.role);
      }

      console.log('[Attendance] Executing query...');
      const { data, error } = await query;
      
      if (error) {
        console.error("[Attendance] ❌ Error fetching attendance:");
        console.error(error);
      } else {
        console.log('[Attendance] ✅ Query successful!');
        console.log('[Attendance] Records fetched:', data?.length || 0);
        if (data && data.length > 0) {
          console.log('[Attendance] First record sample:', data[0]);
        } else {
          console.warn('[Attendance] ⚠️ NO RECORDS FOUND');
        }
      }
      console.log('========================================');
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
