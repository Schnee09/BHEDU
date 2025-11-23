"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { api } from "@/lib/api-client";
import LoadingScreen from "@/components/LoadingScreen";

interface DashboardStats {
  students: number;
  teachers: number;
  classes: number;
  assignments: number;
  attendance_today: number;
}

export default function DashboardPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    students: 0,
    teachers: 0,
    classes: 0,
    assignments: 0,
    attendance_today: 0,
  });

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      if (!profile) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch counts from existing APIs
        const [studentsData, teachersData, classesData, assignmentsData, attendanceData] = await Promise.all([
          api.students.list(),
          api.teachers.list(),
          api.classes.list(),
          api.assignments.list(),
          api.attendance.list({ date: new Date().toISOString().split('T')[0] }), // Today's attendance
        ]);

        if (mounted) {
          setStats({
            students: studentsData.length || 0,
            teachers: teachersData.length || 0,
            classes: classesData.length || 0,
            assignments: assignmentsData.length || 0,
            attendance_today: attendanceData.length || 0,
          });
        }
      } catch (error) {
        console.error("[Dashboard] Error loading stats:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadStats();
    return () => {
      mounted = false;
    };
  }, [profile]);

  if (profileLoading || loading) return <LoadingScreen />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {profile?.full_name ?? "User"}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {profile?.role === "admin" && "Admin Dashboard - System Overview"}
          {profile?.role === "teacher" && "Teacher Dashboard - Your Classes"}
          {profile?.role === "student" && "Student Dashboard - Your Progress"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Students</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.students}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Teachers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.teachers}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Classes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.classes}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assignments</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.assignments}</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Attendance</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.attendance_today}</p>
            </div>
            <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {profile?.role === "admin" && (
            <>
              <a
                href="/dashboard/students"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-900">Manage Students</p>
                <p className="text-sm text-gray-600 mt-1">View and edit student profiles</p>
              </a>
              <a
                href="/dashboard/admin/teachers"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-900">Manage Teachers</p>
                <p className="text-sm text-gray-600 mt-1">View and edit teacher profiles</p>
              </a>
              <a
                href="/dashboard/admin/classes"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-900">Manage Classes</p>
                <p className="text-sm text-gray-600 mt-1">View and organize classes</p>
              </a>
              <a
                href="/dashboard/admin/attendance"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-900">Attendance</p>
                <p className="text-sm text-gray-600 mt-1">Track daily attendance</p>
              </a>
            </>
          )}
          {profile?.role === "teacher" && (
            <>
              <a
                href="/dashboard/classes"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-900">My Classes</p>
                <p className="text-sm text-gray-600 mt-1">View your classes</p>
              </a>
              <a
                href="/dashboard/admin/assignments"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-900">Assignments</p>
                <p className="text-sm text-gray-600 mt-1">Manage assignments</p>
              </a>
              <a
                href="/dashboard/admin/grades"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-900">Grades</p>
                <p className="text-sm text-gray-600 mt-1">Record and view grades</p>
              </a>
              <a
                href="/dashboard/admin/attendance"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-900">Attendance</p>
                <p className="text-sm text-gray-600 mt-1">Mark attendance</p>
              </a>
            </>
          )}
          {profile?.role === "student" && (
            <>
              <a
                href="/dashboard/classes"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-900">My Classes</p>
                <p className="text-sm text-gray-600 mt-1">View enrolled classes</p>
              </a>
              <a
                href="/dashboard/courses"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-900">Course Catalog</p>
                <p className="text-sm text-gray-600 mt-1">Browse available courses</p>
              </a>
              <a
                href="/dashboard/scores"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-900">My Grades</p>
                <p className="text-sm text-gray-600 mt-1">View your grades</p>
              </a>
              <a
                href="/dashboard/profile"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-900">Profile</p>
                <p className="text-sm text-gray-600 mt-1">View and edit profile</p>
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
