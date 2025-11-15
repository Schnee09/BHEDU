"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";

interface NavLink {
  href: string;
  label: string;
  icon: string;
}

interface NavSection {
  title: string;
  links: NavLink[];
}

export default function Sidebar() {
  const { profile } = useProfile();
  const pathname = usePathname();

  if (!profile) return null;

  const role = (profile.role ?? "student") as "admin" | "teacher" | "student";

  // Define navigation structure based on role (like Canvas/Moodle)
  const getNavSections = (): NavSection[] => {
    if (role === "admin") {
      return [
        {
          title: "Dashboard",
          links: [
            { href: "/dashboard", label: "Home", icon: "🏠" },
          ]
        },
        {
          title: "Academic",
          links: [
            { href: "/dashboard/courses", label: "Courses", icon: "📚" },
            { href: "/dashboard/classes", label: "Classes", icon: "📘" },
            { href: "/dashboard/students", label: "Students", icon: "👥" },
          ]
        },
        {
          title: "Attendance",
          links: [
            { href: "/dashboard/attendance/mark", label: "Mark Attendance", icon: "✅" },
            { href: "/dashboard/attendance/qr", label: "QR Codes", icon: "📱" },
            { href: "/dashboard/attendance/reports", label: "Reports", icon: "📊" },
          ]
        },
        {
          title: "Grades",
          links: [
            { href: "/dashboard/grades/assignments", label: "Assignments", icon: "📝" },
            { href: "/dashboard/grades/entry", label: "Grade Entry", icon: "📊" },
            { href: "/dashboard/grades/reports", label: "Report Cards", icon: "📄" },
            { href: "/dashboard/grades/analytics", label: "Analytics", icon: "📈" },
          ]
        },
        {
          title: "Administration",
          links: [
            { href: "/dashboard/users", label: "User Management", icon: "👤" },
            { href: "/dashboard/users/import", label: "Import Users", icon: "📥" },
            { href: "/dashboard/students/import", label: "Import Students", icon: "📥" },
            { href: "/dashboard/admin/data", label: "Data Viewer", icon: "🔍" },
            { href: "/dashboard/reports", label: "Reports", icon: "📑" },
            { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
          ]
        },
        {
          title: "Financial",
          links: [
            { href: "/dashboard/finance", label: "Dashboard", icon: "💰" },
            { href: "/dashboard/finance/fees", label: "Fee Management", icon: "💵" },
            { href: "/dashboard/finance/accounts", label: "Student Accounts", icon: "👥" },
            { href: "/dashboard/finance/invoices", label: "Invoices", icon: "📄" },
            { href: "/dashboard/finance/payments", label: "Payments", icon: "💳" },
            { href: "/dashboard/finance/reports", label: "Financial Reports", icon: "📊" },
          ]
        }
      ];
    } else if (role === "teacher") {
      return [
        {
          title: "Dashboard",
          links: [
            { href: "/dashboard", label: "Home", icon: "🏠" },
          ]
        },
        {
          title: "Teaching",
          links: [
            { href: "/dashboard/courses", label: "My Courses", icon: "�" },
            { href: "/dashboard/classes", label: "My Classes", icon: "�" },
          ]
        },
        {
          title: "Attendance",
          links: [
            { href: "/dashboard/attendance/mark", label: "Mark Attendance", icon: "✅" },
            { href: "/dashboard/attendance/qr", label: "QR Codes", icon: "📱" },
            { href: "/dashboard/attendance/reports", label: "Reports", icon: "�" },
          ]
        },
        {
          title: "Grades",
          links: [
            { href: "/dashboard/grades/assignments", label: "Assignments", icon: "📝" },
            { href: "/dashboard/grades/entry", label: "Grade Entry", icon: "📊" },
            { href: "/dashboard/grades/reports", label: "Report Cards", icon: "📄" },
            { href: "/dashboard/grades/analytics", label: "Analytics", icon: "📈" },
          ]
        }
      ];
    } else {
      // Student view
      return [
        {
          title: "Dashboard",
          links: [
            { href: "/dashboard", label: "Home", icon: "🏠" },
          ]
        },
        {
          title: "Learning",
          links: [
            { href: "/dashboard/classes", label: "My Classes", icon: "📘" },
            { href: "/dashboard/assignments", label: "Assignments", icon: "📝" },
            { href: "/dashboard/scores", label: "My Grades", icon: "📊" },
          ]
        },
        {
          title: "Attendance",
          links: [
            { href: "/dashboard/attendance", label: "My Attendance", icon: "📅" },
            { href: "/checkin", label: "QR Check-in", icon: "📱" },
          ]
        }
      ];
    }
  };

  const navSections = getNavSections();

  return (
    <aside className="w-64 bg-gradient-to-b from-amber-50 to-white shadow-xl border-r border-amber-200 fixed h-full overflow-y-auto">
      <div className="p-4">
        {/* Header with Brand Colors */}
        <div className="mb-6 pb-4 border-b-2 border-amber-300">
          <div className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white px-4 py-3 rounded-lg shadow-md">
            <h2 className="text-xl font-bold tracking-wide">BH-EDU</h2>
            <p className="text-xs mt-1 opacity-90">Bethel Heights</p>
          </div>
          <div className="mt-3 px-2">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">{role} Portal</p>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-3 px-3">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.links.map((link) => {
                  const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold shadow-md transform scale-105"
                            : "text-amber-900 hover:bg-amber-100 hover:text-amber-800"
                        }`}
                      >
                        <span className="text-lg">{link.icon}</span>
                        <span className="text-sm">{link.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
