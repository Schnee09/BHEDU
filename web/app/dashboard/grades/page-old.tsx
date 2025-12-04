"use client";

import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";

export default function GradesPage() {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading...</p>
      </div>
    );
  }

  const isTeacherOrAdmin = profile?.role === "teacher" || profile?.role === "admin";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Grades</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isTeacherOrAdmin && (
          <>
            <Link href="/dashboard/grades/entry">
              <div className="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white">
                <h2 className="text-xl font-semibold mb-2">Grade Entry</h2>
                <p className="text-gray-600">Enter and update student grades for assignments</p>
              </div>
            </Link>

            <Link href="/dashboard/grades/assignments">
              <div className="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white">
                <h2 className="text-xl font-semibold mb-2">Manage Assignments</h2>
                <p className="text-gray-600">Create and manage assignments and categories</p>
              </div>
            </Link>

            <Link href="/dashboard/grades/analytics">
              <div className="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white">
                <h2 className="text-xl font-semibold mb-2">Grade Analytics</h2>
                <p className="text-gray-600">View class performance and grade distributions</p>
              </div>
            </Link>

            <Link href="/dashboard/grades/reports">
              <div className="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white">
                <h2 className="text-xl font-semibold mb-2">Grade Reports</h2>
                <p className="text-gray-600">Generate and export detailed grade reports</p>
              </div>
            </Link>
          </>
        )}

        {profile?.role === "student" && (
          <Link href="/dashboard/scores">
            <div className="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white">
              <h2 className="text-xl font-semibold mb-2">My Grades</h2>
              <p className="text-gray-600">View your grades and assignments</p>
            </div>
          </Link>
        )}
      </div>

      {!isTeacherOrAdmin && profile?.role !== "student" && (
        <div className="text-center text-gray-500 mt-8">
          <p>You don&apos;t have access to grades features.</p>
        </div>
      )}
    </div>
  );
}
