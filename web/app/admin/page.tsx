"use client";

import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/dashboard/users">
          <div className="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white">
            <h2 className="text-xl font-semibold mb-2">👥 User Management</h2>
            <p className="text-gray-600">Manage users, roles, and permissions</p>
          </div>
        </Link>

        <Link href="/admin/students">
          <div className="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white">
            <h2 className="text-xl font-semibold mb-2">🎓 Students</h2>
            <p className="text-gray-600">View and manage student records</p>
          </div>
        </Link>

        <Link href="/dashboard/classes">
          <div className="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white">
            <h2 className="text-xl font-semibold mb-2">📚 Classes</h2>
            <p className="text-gray-600">Manage classes and enrollments</p>
          </div>
        </Link>

        <Link href="/admin/grades">
          <div className="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white">
            <h2 className="text-xl font-semibold mb-2">📊 Grades</h2>
            <p className="text-gray-600">Grade entry, analytics, and reports</p>
          </div>
        </Link>

        <Link href="/admin/attendance">
          <div className="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white">
            <h2 className="text-xl font-semibold mb-2">✅ Attendance</h2>
            <p className="text-gray-600">Mark attendance and view reports</p>
          </div>
        </Link>

        <Link href="/dashboard/finance">
          <div className="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white">
            <h2 className="text-xl font-semibold mb-2">💰 Finance</h2>
            <p className="text-gray-600">Manage fees, payments, and invoices</p>
          </div>
        </Link>

        <Link href="/dashboard/settings">
          <div className="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white">
            <h2 className="text-xl font-semibold mb-2">⚙️ Settings</h2>
            <p className="text-gray-600">System settings and configuration</p>
          </div>
        </Link>

        <Link href="/dashboard/admin/data">
          <div className="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white">
            <h2 className="text-xl font-semibold mb-2">🗄️ Database Admin</h2>
            <p className="text-gray-600">Direct database table management</p>
          </div>
        </Link>

        <Link href="/dashboard/reports">
          <div className="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white">
            <h2 className="text-xl font-semibold mb-2">📈 Reports</h2>
            <p className="text-gray-600">Generate comprehensive reports</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
