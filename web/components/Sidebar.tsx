"use client";

import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";

export default function Sidebar() {
  const { profile } = useProfile();

  if (!profile) return null;

  const roleLinks = {
    admin: [
      { href: "/dashboard/classes", label: "Classes", icon: "📘" },
      { href: "/dashboard/students", label: "Students", icon: "🎓" },
      { href: "/dashboard/assignments", label: "Assignments", icon: "📝" },
      { href: "/dashboard/attendance", label: "Attendance", icon: "📅" },
    ],
    teacher: [
      { href: "/dashboard/classes", label: "My Classes", icon: "📗" },
      { href: "/dashboard/assignments", label: "Assignments", icon: "📝" },
    ],
    student: [
      { href: "/dashboard/classes", label: "Enrolled Classes", icon: "📘" },
      { href: "/dashboard/assignments", label: "My Assignments", icon: "📝" },
    ],
  } as const;

  // ✅ Explicitly narrow the role
  const role = (profile.role ?? "student") as keyof typeof roleLinks;

  return (
    <aside className="w-64 bg-white shadow-md p-4">
      <h2 className="text-xl font-semibold mb-4 capitalize">{role} Panel</h2>
      <ul className="space-y-2">
        {roleLinks[role].map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100"
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
