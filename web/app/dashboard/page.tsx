"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import LoadingScreen from "@/components/LoadingScreen";
import { logger } from "@/lib/logger";

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalAssignments: number;
  attendanceToday: number;
  recentActivity?: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

export default function DashboardPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalAssignments: 0,
    attendanceToday: 0,
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
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();

        if (mounted && data) {
          setStats({
            totalStudents: data.totalStudents || 0,
            totalTeachers: data.totalTeachers || 0,
            totalClasses: data.totalClasses || 0,
            totalAssignments: data.totalAssignments || 0,
            attendanceToday: data.attendanceToday || 0,
            recentActivity: data.recentActivity || [],
          });
          logger.info('Dashboard stats loaded', { stats: data });
        }
      } catch (error) {
        logger.error('Error loading dashboard stats', error as Error);
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
    <main id="main-content" className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-br from-amber-600 to-yellow-700 bg-clip-text text-transparent font-heading">
          Welcome back, {profile?.full_name ?? "User"}
        </h1>
        <p className="text-stone-600 mt-3 text-lg">
          {profile?.role === "admin" && "Administrator Control Center - System Overview"}
          {profile?.role === "teacher" && "Teaching Dashboard - Your Classes & Students"}
          {profile?.role === "student" && "Learning Portal - Your Progress & Assignments"}
        </p>
      </div>

      {/* Stats Cards */}
      <section aria-label="Dashboard statistics">
        <h2 className="sr-only">Overview Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-amber-400 to-yellow-600 p-6 rounded-xl shadow-lg shadow-amber-500/30 text-white hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Students</p>
              <p className="text-4xl font-bold mt-2">{stats.totalStudents}</p>
            </div>
            <div className="h-14 w-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg shadow-blue-500/30 text-white hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Teachers</p>
              <p className="text-4xl font-bold mt-2">{stats.totalTeachers}</p>
            </div>
            <div className="h-14 w-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg shadow-purple-500/30 text-white hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Classes</p>
              <p className="text-4xl font-bold mt-2">{stats.totalClasses}</p>
            </div>
            <div className="h-14 w-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg shadow-orange-500/30 text-white hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Assignments</p>
              <p className="text-4xl font-bold mt-2">{stats.totalAssignments}</p>
            </div>
            <div className="h-14 w-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg shadow-green-500/30 text-white hover:shadow-xl hover:shadow-green-500/40 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Today's Attendance</p>
              <p className="text-4xl font-bold mt-2">{stats.attendanceToday}</p>
            </div>
            <div className="h-14 w-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* Quick Actions */}
      <section className="bg-white rounded-xl shadow-lg border border-amber-100 p-6" aria-label="Quick actions">
        <h2 className="text-2xl font-bold text-stone-900 mb-6 flex items-center font-heading">
          <svg className="w-7 h-7 text-amber-500 mr-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {profile?.role === "admin" && (
            <>
              <a
                href="/dashboard/students"
                className="p-5 border-2 border-stone-200 rounded-xl hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-200 group cursor-pointer"
                aria-label="Manage students"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <svg className="w-8 h-8 text-amber-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p className="font-semibold text-stone-900">Manage Students</p>
                </div>
                <p className="text-sm text-stone-600">View and edit student profiles</p>
              </a>
              <a
                href="/dashboard/users"
                className="p-5 border-2 border-stone-200 rounded-xl hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <svg className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="font-semibold text-stone-900">Manage Teachers</p>
                </div>
                <p className="text-sm text-stone-600">View and edit teacher profiles</p>
              </a>
              <a
                href="/dashboard/classes"
                className="p-5 border-2 border-stone-200 rounded-xl hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <svg className="w-8 h-8 text-purple-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="font-semibold text-stone-900">Manage Classes</p>
                </div>
                <p className="text-sm text-stone-600">View and organize classes</p>
              </a>
              <a
                href="/dashboard/attendance"
                className="p-5 border-2 border-amber-100 rounded-xl hover:border-green-500 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <svg className="w-8 h-8 text-green-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-semibold text-stone-900">Attendance</p>
                </div>
                <p className="text-sm text-stone-600">Track daily attendance</p>
              </a>
            </>
          )}
          {profile?.role === "teacher" && (
            <>
              <a
                href="/dashboard/classes"
                className="p-5 border-2 border-amber-100 rounded-xl hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <svg className="w-8 h-8 text-purple-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="font-semibold text-stone-900">My Classes</p>
                </div>
                <p className="text-sm text-stone-600">View your classes</p>
              </a>
              <a
                href="/dashboard/grades/assignments"
                className="p-5 border-2 border-amber-100 rounded-xl hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <svg className="w-8 h-8 text-orange-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="font-semibold text-stone-900">Assignments</p>
                </div>
                <p className="text-sm text-stone-600">Manage assignments</p>
              </a>
              <a
                href="/dashboard/grades"
                className="p-5 border-2 border-amber-100 rounded-xl hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <svg className="w-8 h-8 text-emerald-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <p className="font-semibold text-stone-900">Grades</p>
                </div>
                <p className="text-sm text-stone-600">Record and view grades</p>
              </a>
              <a
                href="/dashboard/attendance/mark"
                className="p-5 border-2 border-amber-100 rounded-xl hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <svg className="w-8 h-8 text-indigo-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="font-semibold text-stone-900">Mark Attendance</p>
                </div>
                <p className="text-sm text-stone-600">Take class attendance</p>
              </a>
            </>
          )}
          {profile?.role === "student" && (
            <>
              <a
                href="/dashboard/classes"
                className="p-5 border-2 border-amber-100 rounded-xl hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <svg className="w-8 h-8 text-purple-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="font-semibold text-stone-900">My Classes</p>
                </div>
                <p className="text-sm text-stone-600">View enrolled classes</p>
              </a>
              <a
                href="/dashboard/assignments"
                className="p-5 border-2 border-amber-100 rounded-xl hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <svg className="w-8 h-8 text-orange-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="font-semibold text-stone-900">Assignments</p>
                </div>
                <p className="text-sm text-stone-600">View and submit work</p>
              </a>
              <a
                href="/dashboard/scores"
                className="p-5 border-2 border-amber-100 rounded-xl hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <svg className="w-8 h-8 text-emerald-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <p className="font-semibold text-stone-900">My Grades</p>
                </div>
                <p className="text-sm text-stone-600">View your grades</p>
              </a>
              <a
                href="/dashboard/profile"
                className="p-5 border-2 border-amber-100 rounded-xl hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <svg className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="font-semibold text-stone-900">Profile</p>
                </div>
                <p className="text-sm text-stone-600">View and edit profile</p>
              </a>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
