"use client";

/**
 * Modern Dashboard - Swiss Modernism 2.0 Design
 * Following ui-ux-pro-max guidelines:
 * - Professional Blue color scheme
 * - Heroicons SVG icons (NO EMOJIS)
 * - Proper hover states without layout shift
 * - WCAG AA accessibility
 * - 150-300ms animations
 */

import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import LoadingScreen from "@/components/LoadingScreen";
import { StatCard } from "@/components/ui/Card";
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
    <main id="main-content" className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <header>
          <h1 className="text-4xl font-bold text-slate-900 font-heading">
            {getRoleTitle()}
          </h1>
          <p className="text-lg text-slate-600 mt-2">
            Welcome back, {profile?.full_name ?? "User"} • {getRoleDescription()}
          </p>
        </header>

        {/* Stats Grid */}
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
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6 font-heading flex items-center gap-2">
              <Icons.Chart className="w-6 h-6 text-blue-600" />
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
          </div>
        </section>
      </div>
    </main>
  );
}

/**
 * Quick Action Card Component
 * Clean, accessible action cards with proper hover states
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
    blue: 'text-blue-600 group-hover:bg-blue-50',
    purple: 'text-purple-600 group-hover:bg-purple-50',
    green: 'text-green-600 group-hover:bg-green-50',
    orange: 'text-orange-600 group-hover:bg-orange-50',
    slate: 'text-slate-600 group-hover:bg-slate-50',
  };

  return (
    <Link
      href={href}
      className="group p-5 border border-slate-200 rounded-lg transition-all duration-200 hover:border-slate-300 hover:shadow-md cursor-pointer bg-white"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2 rounded-lg transition-colors duration-200 ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
            {title}
          </p>
        </div>
      </div>
      <p className="text-sm text-slate-600">
        {description}
      </p>
    </Link>
  );
}
