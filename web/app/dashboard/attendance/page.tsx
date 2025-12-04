"use client";

import Link from "next/link";
import { Card } from "@/components/ui";

export default function AttendanceLandingPage() {
  const sections = [
    {
      title: "Mark Attendance",
      description: "Manually mark student attendance for classes",
      href: "/dashboard/attendance/mark",
      icon: "✓",
      gradient: "from-blue-50 to-indigo-50",
      iconBg: "bg-blue-500",
      borderColor: "border-blue-200"
    },
    {
      title: "QR Code Attendance",
      description: "Generate QR codes for students to self-check in",
      href: "/dashboard/attendance/qr",
      icon: "⊡",
      gradient: "from-green-50 to-emerald-50",
      iconBg: "bg-green-500",
      borderColor: "border-green-200"
    },
    {
      title: "Attendance Reports",
      description: "View and analyze attendance data and trends",
      href: "/dashboard/attendance/reports",
      icon: "📊",
      gradient: "from-purple-50 to-pink-50",
      iconBg: "bg-purple-500",
      borderColor: "border-purple-200"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Attendance Management</h1>
          <p className="text-lg text-gray-600">
            Choose an attendance management option below
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {sections.map((section) => (
            <Link key={section.href} href={section.href}>
              <Card className={`h-full bg-gradient-to-br ${section.gradient} ${section.borderColor} hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer`} padding="lg">
                <div className="flex flex-col items-center text-center">
                  <div className={`${section.iconBg} text-white p-6 rounded-2xl text-4xl mb-6 shadow-lg`}>
                    {section.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {section.title}
                  </h3>
                  <p className="text-gray-700 text-base leading-relaxed">
                    {section.description}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200" padding="lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
              💡
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-blue-900 mb-3">Quick Tips</h3>
              <ul className="text-base text-blue-800 space-y-2">
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Use <strong>Mark Attendance</strong> for traditional roll call</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Use <strong>QR Code</strong> for contactless student check-ins</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>View <strong>Reports</strong> to track attendance patterns and trends</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

