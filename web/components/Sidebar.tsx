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
            { href: "/dashboard/students/import", label: "Import Students", icon: "📥" },
            { href: "/dashboard/reports", label: "Reports", icon: "�" },
            { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
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
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 fixed h-full overflow-y-auto">
      <div className="p-4">
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">BH-EDU</h2>
          <p className="text-xs text-gray-500 mt-1 capitalize">{role} Portal</p>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.links.map((link) => {
                  const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-gray-700 hover:bg-gray-100"
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
