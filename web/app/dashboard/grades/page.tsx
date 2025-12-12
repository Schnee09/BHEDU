/**
 * Grades Navigation Page - Refactored with Modern Components
 * 
 * Features:
 * - Uses Card components for navigation
 * - Uses useUser hook for role checking
 * - Better visual hierarchy
 * - Responsive grid layout
 */

"use client";

import Link from "next/link";
import { useUser } from "@/hooks";
import { Card, LoadingState } from "@/components/ui";
import { Icons } from "@/components/ui/Icons";
import { PencilSquareIcon, ClipboardDocumentListIcon, DocumentChartBarIcon, DocumentTextIcon, AcademicCapIcon } from "@heroicons/react/24/outline";

interface NavCard {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles: string[];
}

const navCards: NavCard[] = [
  {
    href: "/dashboard/grades/entry",
    title: "Grade Entry",
    description: "Enter and update student grades for assignments",
    icon: PencilSquareIcon,
    roles: ["teacher", "admin"],
  },
  {
    href: "/dashboard/grades/assignments",
    title: "Manage Assignments",
    description: "Create and manage assignments and categories",
    icon: ClipboardDocumentListIcon,
    roles: ["teacher", "admin"],
  },
  {
    href: "/dashboard/grades/analytics",
    title: "Grade Analytics",
    description: "View class performance and grade distributions",
    icon: DocumentChartBarIcon,
    roles: ["teacher", "admin"],
  },
  {
    href: "/dashboard/grades/reports",
    title: "Grade Reports",
    description: "Generate and export detailed grade reports",
    icon: DocumentTextIcon,
    roles: ["teacher", "admin"],
  },
  {
    href: "/dashboard/scores",
    title: "My Grades",
    description: "View your grades and assignment scores",
    icon: AcademicCapIcon,
    roles: ["student"],
  },
];

export default function GradesPageModern() {
  const { user, loading } = useUser();
  
  if (loading) {
    return <LoadingState message="Loading..." />;
  }
  
  const userRole = user?.role || "";
  const availableCards = navCards.filter(card => 
    card.roles.includes(userRole)
  );
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Grades & Assignments</h1>
          <p className="text-lg text-gray-600">
            {userRole === "student" 
              ? "View your grades and academic progress"
              : "Manage grades, assignments, and reports"}
          </p>
        </div>
        
        {/* Navigation Cards */}
        {availableCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
            {availableCards.map((card) => (
              <Link key={card.href} href={card.href}>
                <Card 
                  className="h-full p-8 bg-white hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer border-gray-200"
                >
                  <div className="flex flex-col items-start h-full">
                    <div className="p-3 bg-stone-100 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                      <card.icon className="w-10 h-10 text-stone-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-stone-900 mb-3">
                      {card.title}
                    </h2>
                    <p className="text-stone-500 text-base flex-grow leading-relaxed">
                      {card.description}
                    </p>
                    <div className="mt-6 px-6 py-2 bg-stone-900 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-stone-800 transition-colors">
                      Open
                      <Icons.ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="text-center py-16" padding="lg">
            <Icons.Lock className="w-12 h-12 text-stone-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-stone-900 mb-3">
              Access Restricted
            </h3>
            <p className="text-stone-500 text-lg">
              You don't have access to grades features.
            </p>
          </Card>
        )}
        
        {/* Quick Stats for Teachers/Admins */}
        {(userRole === "teacher" || userRole === "admin") && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card padding="lg" className="bg-stone-50 border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                  <span className="text-stone-700 font-medium">Pending Grades</span>
                  <span className="font-bold text-2xl text-stone-600">-</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                  <span className="text-stone-700 font-medium">Active Assignments</span>
                  <span className="font-bold text-2xl text-stone-600">-</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                  <span className="text-stone-700 font-medium">Total Students</span>
                  <span className="font-bold text-2xl text-stone-600">-</span>
                </div>
              </div>
            </Card>
            
            <Card padding="lg" className="bg-stone-50 border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 mb-4">Recent Activity</h3>
              <div className="text-center py-8 text-stone-500">
                <Icons.Grades className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                <p>No recent activity</p>
              </div>
            </Card>
            
            <Card padding="lg" className="bg-stone-50 border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 mb-4">Upcoming Deadlines</h3>
              <div className="text-center py-8 text-stone-500">
                <Icons.Attendance className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                <p>No upcoming deadlines</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
