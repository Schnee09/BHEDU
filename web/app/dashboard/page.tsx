// web/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import LoadingScreen from "@/components/LoadingScreen";

export default function DashboardPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ students: 0, classes: 0, assignments: 0 });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      console.log('[Dashboard] Loading dashboard, profile:', profile);
      if (!profile) {
        console.log('[Dashboard] No profile, skipping load');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log('[Dashboard] Role:', profile.role);
        if (profile.role === "teacher") {
          // teacher -> counts of classes they teach and assignments in those classes
          console.log('[Dashboard] Fetching teacher classes...');
          const classesRes = await supabase
            .from("classes")
            .select("id", { count: "exact", head: true })
            .eq("teacher_id", profile.id);

          console.log('[Dashboard] Classes result:', classesRes);
          const classesCount = classesRes.count || 0;

          const { data: teacherClasses } = await supabase
            .from("classes")
            .select("id")
            .eq("teacher_id", profile.id);
          console.log('[Dashboard] Teacher classes:', teacherClasses);
          const teacherClassIds = (teacherClasses as Array<{ id: string }> | null)?.map((c) => c.id) || [];
          
          console.log('[Dashboard] Fetching assignments for classes:', teacherClassIds);
          const assignmentsRes = await supabase
            .from("assignments")
            .select("id", { count: "exact", head: true })
            .in("class_id", teacherClassIds);

          console.log('[Dashboard] Assignments result:', assignmentsRes);
          const assignmentsCount = assignmentsRes.count || 0;

          const finalStats = { students: 0, classes: classesCount, assignments: assignmentsCount };
          console.log('[Dashboard] Teacher stats:', finalStats);
          if (mounted) setStats(finalStats);
        } else if (profile.role === "student") {
          // student -> classes enrolled and assignments for those classes
          console.log('[Dashboard] Fetching student enrollments...');
          const enrollRes = await supabase
            .from("enrollments")
            .select("class_id", { count: "exact", head: true })
            .eq("student_id", profile.id);

          console.log('[Dashboard] Enrollments result:', enrollRes);
          const classesCount = enrollRes.count || 0;

          const { data: enrollments } = await supabase
            .from("enrollments")
            .select("class_id")
            .eq("student_id", profile.id);
          console.log('[Dashboard] Student enrollments:', enrollments);
          const enrolledIds = (enrollments as Array<{ class_id: string }> | null)?.map((e) => e.class_id) || [];
          const assignmentsRes = await supabase
            .from("assignments")
            .select("id", { count: "exact", head: true })
            .in("class_id", enrolledIds);

          console.log('[Dashboard] Student assignments result:', assignmentsRes);
          const assignmentsCount = assignmentsRes.count || 0;

          const finalStats = { students: 0, classes: classesCount, assignments: assignmentsCount };
          console.log('[Dashboard] Student stats:', finalStats);
          if (mounted) setStats(finalStats);
        } else {
          // admin or default -> global counts
          console.log('[Dashboard] Fetching admin/global stats...');
          const [studentsRes, classesRes, assignmentsRes] = await Promise.all([
            supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
            supabase.from("classes").select("id", { count: "exact", head: true }),
            supabase.from("assignments").select("id", { count: "exact", head: true }),
          ]);

          console.log('[Dashboard] Admin stats results:', { studentsRes, classesRes, assignmentsRes });
          const finalStats = {
            students: studentsRes.count || 0,
            classes: classesRes.count || 0,
            assignments: assignmentsRes.count || 0,
          };
          console.log('[Dashboard] Admin stats:', finalStats);
          if (mounted) setStats(finalStats);
        }
      } catch (err) {
        console.error("[Dashboard] Error loading stats:", err);
      } finally {
        console.log('[Dashboard] Loading complete');
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [profile]);

  if (profileLoading || loading) return <LoadingScreen />;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Welcome back, {profile?.full_name ?? "User"}</h1>
      <p className="text-sm text-gray-600">Quick overview of your workspace.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <div className="p-4 bg-white rounded shadow border">
          <p className="text-sm text-gray-500">Students</p>
          <p className="text-2xl font-bold">{stats.students}</p>
        </div>

        <div className="p-4 bg-white rounded shadow border">
          <p className="text-sm text-gray-500">Classes</p>
          <p className="text-2xl font-bold">{stats.classes}</p>
        </div>

        <div className="p-4 bg-white rounded shadow border">
          <p className="text-sm text-gray-500">Assignments</p>
          <p className="text-2xl font-bold">{stats.assignments}</p>
        </div>
      </div>
    </div>
  );
}
