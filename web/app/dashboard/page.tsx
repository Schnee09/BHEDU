"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { apiFetch } from "@/lib/api/client";
import { Card, StatCard } from "@/components/ui/Card";
import { SkeletonStatCard, SkeletonCard } from "@/components/ui/skeleton";
import { Icons } from "@/components/ui/Icons";
import { logger } from "@/lib/logger";
import Link from "next/link";

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
        const response = await apiFetch('/api/dashboard/stats');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch stats');
        }
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
        // Set default empty stats to prevent loading state
        if (mounted) {
          setStats({
            totalStudents: 0,
            totalTeachers: 0,
            totalClasses: 0,
            totalAssignments: 0,
            attendanceToday: 0,
            recentActivity: [],
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadStats();
    return () => {
      mounted = false;
    };
  }, [profile]);

  if (profileLoading || loading) {
    return (
      <main className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header skeleton */}
          <div className="space-y-2">
            <div className="h-10 w-64 bg-stone-200 rounded animate-pulse" />
            <div className="h-6 w-96 bg-stone-200 rounded animate-pulse" />
          </div>
          
          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
          
          {/* Quick actions skeleton */}
          <SkeletonCard />
          
          {/* Recent activity skeleton */}
          <SkeletonCard />
        </div>
      </main>
    );
  }

  const getRoleTitle = () => {
    switch (profile?.role) {
      case "admin":
        return "Administrator Dashboard";
      case "teacher":
        return "Teacher Dashboard";
      case "student":
        return "Student Portal";
      default:
        return "Dashboard";
    }
  };

  const getRoleDescription = () => {
    switch (profile?.role) {
      case "admin":
        return "System overview and management";
      case "teacher":
        return "Manage your classes and students";
      case "student":
        return "Track your progress and assignments";
      default:
        return "Welcome to your dashboard";
    }
  };

  return (
    <main id="main-content" className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <Card as="section" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-stone-900 dark:text-stone-100 font-heading">
                {getRoleTitle()}
              </h1>
              <p className="text-lg text-stone-500 dark:text-stone-400 mt-2">
                Welcome back, <span className="font-semibold text-stone-900 dark:text-stone-100">{profile?.full_name ?? "User"}</span> • {getRoleDescription()}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
              <Icons.Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </Card>

        {/* Stats Grid - Clean Cards */}
        <section aria-label="Dashboard statistics">
          <h2 className="sr-only">Overview Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            
            <StatCard
              label="Students"
              value={stats.totalStudents}
              color="blue"
              icon={<Icons.Students className="w-6 h-6" />}
            />

            <StatCard
              label="Teachers"
              value={stats.totalTeachers}
              color="purple"
              icon={<Icons.Teachers className="w-6 h-6" />}
            />

            <StatCard
              label="Classes"
              value={stats.totalClasses}
              color="green"
              icon={<Icons.Classes className="w-6 h-6" />}
            />

            <StatCard
              label="Assignments"
              value={stats.totalAssignments}
              color="orange"
              icon={<Icons.Assignments className="w-6 h-6" />}
            />

            <StatCard
              label="Today's Attendance"
              value={stats.attendanceToday}
              color="slate"
              icon={<Icons.Attendance className="w-6 h-6" />}
            />
          </div>
        </section>

        {/* Quick Actions */}
        <section aria-label="Quick actions">
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-6 flex items-center gap-3 font-heading">
              <div className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                <Icons.Chart className="w-6 h-6" />
              </div>
              Quick Actions
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {profile?.role === "admin" && (
                <>
                  <QuickActionCard
                    href="/dashboard/students"
                    icon={<Icons.Students className="w-6 h-6" />}
                    title="Manage Students"
                    description="View and edit student profiles"
                    color="blue"
                  />
                  <QuickActionCard
                    href="/dashboard/users"
                    icon={<Icons.Teachers className="w-6 h-6" />}
                    title="Manage Teachers"
                    description="View and edit teacher profiles"
                    color="purple"
                  />
                  <QuickActionCard
                    href="/dashboard/classes"
                    icon={<Icons.Classes className="w-6 h-6" />}
                    title="Manage Classes"
                    description="View and organize classes"
                    color="green"
                  />
                  <QuickActionCard
                    href="/dashboard/attendance"
                    icon={<Icons.Attendance className="w-6 h-6" />}
                    title="Attendance"
                    description="Track daily attendance"
                    color="orange"
                  />
                </>
              )}
              
              {profile?.role === "teacher" && (
                <>
                  <QuickActionCard
                    href="/dashboard/classes"
                    icon={<Icons.Classes className="w-6 h-6" />}
                    title="My Classes"
                    description="View your classes"
                    color="blue"
                  />
                  <QuickActionCard
                    href="/dashboard/grades/assignments"
                    icon={<Icons.Assignments className="w-6 h-6" />}
                    title="Assignments"
                    description="Manage assignments"
                    color="green"
                  />
                  <QuickActionCard
                    href="/dashboard/grades"
                    icon={<Icons.Grades className="w-6 h-6" />}
                    title="Grades"
                    description="Record and view grades"
                    color="purple"
                  />
                  <QuickActionCard
                    href="/dashboard/attendance/mark"
                    icon={<Icons.Attendance className="w-6 h-6" />}
                    title="Mark Attendance"
                    description="Take class attendance"
                    color="orange"
                  />
                </>
              )}
              
              {profile?.role === "student" && (
                <>
                  <QuickActionCard
                    href="/dashboard/classes"
                    icon={<Icons.Classes className="w-6 h-6" />}
                    title="My Classes"
                    description="View enrolled classes"
                    color="blue"
                  />
                  <QuickActionCard
                    href="/dashboard/assignments"
                    icon={<Icons.Assignments className="w-6 h-6" />}
                    title="Assignments"
                    description="View and submit work"
                    color="green"
                  />
                  <QuickActionCard
                    href="/dashboard/scores"
                    icon={<Icons.Grades className="w-6 h-6" />}
                    title="My Grades"
                    description="View your grades"
                    color="purple"
                  />
                  <QuickActionCard
                    href="/dashboard/profile"
                    icon={<Icons.Users className="w-6 h-6" />}
                    title="Profile"
                    description="View and edit profile"
                    color="slate"
                  />
                </>
              )}
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}

/**
 * Quick Action Card Component
 */
interface QuickActionCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'slate';
}

function QuickActionCard({ href, icon, title, description, color }: QuickActionCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-stone-50 text-stone-700',
      icon: 'bg-stone-100 text-stone-600',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-700',
      icon: 'bg-purple-100 text-purple-600',
    },
    green: {
      bg: 'bg-green-50 text-green-700',
      icon: 'bg-green-100 text-green-600',
    },
    orange: {
      bg: 'bg-orange-50 text-orange-700',
      icon: 'bg-orange-100 text-orange-600',
    },
    slate: {
      bg: 'bg-stone-50 text-stone-700',
      icon: 'bg-stone-100 text-stone-600',
    },
  };

  const styles = colorClasses[color];

  return (
    <Link
      href={href}
      className={`group p-5 rounded-xl transition-all duration-200
        bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-sm
        hover:shadow-md hover:border-stone-300 dark:hover:border-stone-600 hover:-translate-y-0.5`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2 rounded-lg transition-colors duration-200 ${styles.icon}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-stone-900 dark:text-stone-100 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors duration-200 flex items-center gap-2">
            {title}
            <Icons.ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
          </p>
        </div>
      </div>
      <p className="text-sm text-stone-500 dark:text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-300 transition-colors duration-200">
        {description}
      </p>
    </Link>
  );
}
