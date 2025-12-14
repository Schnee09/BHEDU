"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { routes } from "@/lib/routes";

// Heroicons SVG Components
const Icons = {
  Home: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Book: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  BookOpen: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  CheckCircle: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  QrCode: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  ),
  Chart: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  DocumentText: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Document: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  TrendingUp: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Wrench: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  AcademicCap: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M12 14l9-5-9-5-9 5 9 5z" />
      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  User: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Download: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  Search: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  ClipboardList: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  CurrencyDollar: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  CreditCard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  Cog: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavSection {
  title: string;
  links: NavLink[];
  collapsed?: boolean;
}

export default function Sidebar() {
  const { profile } = useProfile();
  const pathname = usePathname();
  const router = useRouter();
  const [_showProfileMenu, _setShowProfileMenu] = useState(false);
  const [_collapsedSections, setCollapsedSections] = useState<string[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!profile) return null;

  const role = (profile.role ?? "student") as "admin" | "staff" | "teacher" | "student";

  const _handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const _toggleSection = (title: string) => {
    setCollapsedSections(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  // Define navigation structure based on role (like Canvas/Moodle)
  const getNavSections = (): NavSection[] => {
    if (role === "admin") {
      return [
        {
          title: "Dashboard",
          links: [
            { href: "/dashboard", label: "Home", icon: <Icons.Home /> },
          ]
        },
        {
          title: "Academic",
          links: [
            { href: "/dashboard/courses", label: "Course Catalog", icon: <Icons.Book /> },
            { href: "/dashboard/classes", label: "My Classes", icon: <Icons.BookOpen /> },
            { href: "/dashboard/students", label: "Students", icon: <Icons.Users /> },
          ]
        },
        {
          title: "Attendance",
          links: [
            { href: "/dashboard/attendance/mark", label: "Mark Attendance", icon: <Icons.CheckCircle /> },
            { href: "/dashboard/attendance/qr", label: "QR Codes", icon: <Icons.QrCode /> },
            { href: "/dashboard/attendance/reports", label: "Reports", icon: <Icons.Chart /> },
          ]
        },
        {
          title: "Grades",
          links: [
            { href: routes.grades.assignments(), label: "Assignments", icon: <Icons.ClipboardList /> },
            { href: routes.grades.entry(), label: "Grade Entry", icon: <Icons.Chart /> },
            { href: routes.grades.conductEntry(), label: "Conduct Grades", icon: <Icons.AcademicCap /> },
            { href: routes.grades.reports(), label: "Report Cards", icon: <Icons.Document /> },
            { href: routes.grades.analytics(), label: "Analytics", icon: <Icons.TrendingUp /> },
          ]
        },
        {
          title: "Administration",
          links: [
            { href: "/dashboard/admin/diagnostic", label: "🔧 API Diagnostic", icon: <Icons.Wrench /> },
            { href: "/dashboard/admin/students", label: "Admin — Students", icon: <Icons.Users /> },
            { href: "/dashboard/classes", label: "Classes Management", icon: <Icons.Book /> },
            { href: "/dashboard/users", label: "Users/Teachers Management", icon: <Icons.User /> },
            { href: "/dashboard/assignments", label: "Assignments Management", icon: <Icons.ClipboardList /> },
            { href: "/dashboard/attendance", label: "Attendance Management", icon: <Icons.Calendar /> },
            { href: "/dashboard/attendance/reports", label: "Attendance Reports", icon: <Icons.Chart /> },
            { href: routes.grades.list(), label: "Grades Management", icon: <Icons.AcademicCap /> },
            { href: "/dashboard/students/import", label: "Import Students", icon: <Icons.Download /> },
            { href: "/dashboard/admin/data", label: "Data — Quick", icon: <Icons.Search /> },
            { href: "/dashboard/admin/data-viewer", label: "Data Viewer (table)", icon: <Icons.Document /> },
            { href: "/dashboard/admin/data-dump", label: "Data Dump (export)", icon: <Icons.Download /> },
            // Impersonation removed: feature disabled / deferred
            { href: "/dashboard/admin/student", label: "Student (legacy)", icon: <Icons.DocumentText /> },
            { href: "/dashboard/reports", label: "Reports", icon: <Icons.DocumentText /> },
          ]
        },
        {
          title: "Settings",
          links: [
            { href: "/dashboard/admin/academic-years", label: "Academic Years", icon: <Icons.Calendar /> },
            { href: "/dashboard/admin/grading-scales", label: "Grading Scales", icon: <Icons.Chart /> },
            { href: "/dashboard/admin/fee-types", label: "Fee Types", icon: <Icons.CurrencyDollar /> },
            { href: "/dashboard/settings", label: "General Settings", icon: <Icons.Cog /> },
          ]
        },
        {
          title: "Financial",
          links: [
            { href: "/dashboard/admin/finance/student-accounts", label: "Student Accounts", icon: <Icons.Users /> },
            { href: "/dashboard/admin/finance/invoices", label: "Invoices", icon: <Icons.Document /> },
            { href: "/dashboard/admin/finance/payments", label: "Payments", icon: <Icons.CreditCard /> },
            { href: "/dashboard/admin/finance/reports", label: "Financial Reports", icon: <Icons.Chart /> },
          ]
        }
      ];
    } else if (role === "staff") {
      // Staff: Sub-admin with operational access (no system config)
      return [
        {
          title: "Dashboard",
          links: [
            { href: "/dashboard", label: "Home", icon: <Icons.Home /> },
          ]
        },
        {
          title: "People",
          links: [
            { href: "/dashboard/students", label: "Students", icon: <Icons.Users /> },
            { href: "/dashboard/users", label: "Teachers", icon: <Icons.User /> },
            { href: "/dashboard/students/import", label: "Import Students", icon: <Icons.Download /> },
          ]
        },
        {
          title: "Academic",
          links: [
            { href: "/dashboard/courses", label: "Courses", icon: <Icons.Book /> },
            { href: "/dashboard/classes", label: "Classes", icon: <Icons.BookOpen /> },
          ]
        },
        {
          title: "Attendance",
          links: [
            { href: "/dashboard/attendance", label: "Overview", icon: <Icons.Calendar /> },
            { href: "/dashboard/attendance/mark", label: "Mark Attendance", icon: <Icons.CheckCircle /> },
            { href: "/dashboard/attendance/qr", label: "QR Codes", icon: <Icons.QrCode /> },
            { href: "/dashboard/attendance/reports", label: "Reports", icon: <Icons.Chart /> },
          ]
        },
        {
          title: "Grades",
          links: [
            { href: routes.grades.list(), label: "Overview", icon: <Icons.AcademicCap /> },
            { href: routes.grades.reports(), label: "Report Cards", icon: <Icons.Document /> },
            { href: routes.grades.analytics(), label: "Analytics", icon: <Icons.TrendingUp /> },
          ]
        },
        {
          title: "Financial",
          links: [
            { href: "/dashboard/admin/finance/student-accounts", label: "Student Accounts", icon: <Icons.Users /> },
            { href: "/dashboard/admin/finance/invoices", label: "Invoices", icon: <Icons.Document /> },
            { href: "/dashboard/admin/finance/payments", label: "Payments", icon: <Icons.CreditCard /> },
            { href: "/dashboard/admin/finance/reports", label: "Reports", icon: <Icons.Chart /> },
          ]
        },
        {
          title: "Reports",
          links: [
            { href: "/dashboard/reports", label: "All Reports", icon: <Icons.DocumentText /> },
            { href: "/dashboard/admin/data", label: "Data Export", icon: <Icons.Download /> },
          ]
        }
      ];
    } else if (role === "teacher") {
      return [
        {
          title: "Dashboard",
          links: [
            { href: "/dashboard", label: "Home", icon: <Icons.Home /> },
          ]
        },
        {
          title: "Teaching",
          links: [
            { href: "/dashboard/courses", label: "My Courses", icon: <Icons.Book /> },
            { href: "/dashboard/classes", label: "My Classes", icon: <Icons.BookOpen /> },
          ]
        },
        {
          title: "Attendance",
          links: [
            { href: "/dashboard/attendance/mark", label: "Mark Attendance", icon: <Icons.CheckCircle /> },
            { href: "/dashboard/attendance/qr", label: "QR Codes", icon: <Icons.QrCode /> },
            { href: "/dashboard/attendance/reports", label: "Reports", icon: <Icons.Chart /> },
          ]
        },
        {
          title: "Grades",
          links: [
            { href: routes.grades.assignments(), label: "Assignments", icon: <Icons.ClipboardList /> },
            { href: routes.grades.entry(), label: "Grade Entry", icon: <Icons.Chart /> },
            { href: routes.grades.conductEntry(), label: "Conduct Grades", icon: <Icons.AcademicCap /> },
            { href: routes.grades.reports(), label: "Report Cards", icon: <Icons.Document /> },
            { href: routes.grades.analytics(), label: "Analytics", icon: <Icons.TrendingUp /> },
          ]
        }
      ];
    } else {
      // Student view
      return [
        {
          title: "Dashboard",
          links: [
            { href: "/dashboard", label: "Home", icon: <Icons.Home /> },
          ]
        },
        {
          title: "Learning",
          links: [
            { href: "/dashboard/classes", label: "My Classes", icon: <Icons.BookOpen /> },
            { href: "/dashboard/assignments", label: "Assignments", icon: <Icons.ClipboardList /> },
            { href: "/dashboard/scores", label: "My Grades", icon: <Icons.Chart /> },
          ]
        },
        {
          title: "Attendance",
          links: [
            { href: "/dashboard/attendance", label: "My Attendance", icon: <Icons.Calendar /> },
            { href: "/checkin", label: "QR Check-in", icon: <Icons.QrCode /> },
          ]
        }
      ];
    }
  };

  const navSections = getNavSections();

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 
          bg-stone-800 text-white rounded-xl 
          shadow-md
          hover:bg-stone-900
          transition-all duration-200 cursor-pointer"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-72 fixed h-full overflow-y-auto z-40 transition-all duration-300 ease-out
        bg-white dark:bg-[#1E1E1E] border-r border-gray-200 dark:border-[#3A3A3A]
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      <div className="p-5">
        {/* Header - Brand Card */}
        <div className="mb-8">
          <div className="px-5 py-4 rounded-2xl bg-green-600 text-white">
            <h2 className="text-2xl font-bold tracking-tight font-heading">BH-EDU</h2>
            <p className="text-sm mt-1 text-green-100 font-medium">Bethel Heights Academy</p>
          </div>
          <div className="mt-4 px-1">
            <span className="inline-block px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full
              bg-gray-100 dark:bg-[#3A3A3A] text-gray-700 dark:text-[#C0C0C0] border border-gray-200 dark:border-[#4A4A4A]">
              {role} Portal
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-6">
          {navSections.map((section) => {
            return (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-[#9A9A9A] uppercase tracking-wider mb-3 px-3">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.links.map((link) => {
                  const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold border border-green-200 dark:border-green-800"
                            : "text-gray-600 dark:text-[#C0C0C0] hover:bg-gray-50 dark:hover:bg-[#2D2D2D] hover:text-gray-900 dark:hover:text-[#E8E8E8]"
                        }`}
                      >
                        <span className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-[#757575] group-hover:text-gray-600 dark:group-hover:text-[#C0C0C0]'}`}>{link.icon}</span>
                        <span className="text-sm">{link.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )})}
        </nav>
      </div>
    </aside>
    </>
  );
}
