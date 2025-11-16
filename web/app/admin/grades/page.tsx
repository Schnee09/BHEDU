"use client";

import Link from "next/link";

export default function AdminGradesPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Grades Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/grades/entry">
          <div className="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white">
            <h2 className="text-xl font-semibold mb-2">Grade Entry</h2>
            <p className="text-gray-600">Enter and update student grades</p>
          </div>
        </Link>

        <Link href="/admin/grades/assignments">
          <div className="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white">
            <h2 className="text-xl font-semibold mb-2">Manage Assignments</h2>
            <p className="text-gray-600">Create and manage assignments</p>
          </div>
        </Link>

        <Link href="/admin/grades/analytics">
          <div className="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white">
            <h2 className="text-xl font-semibold mb-2">Grade Analytics</h2>
            <p className="text-gray-600">View performance analytics</p>
          </div>
        </Link>

        <Link href="/admin/grades/reports">
          <div className="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white">
            <h2 className="text-xl font-semibold mb-2">Grade Reports</h2>
            <p className="text-gray-600">Generate and export reports</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
