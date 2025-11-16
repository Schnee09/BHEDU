"use client";

import Link from "next/link";

export default function AdminAttendancePage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Attendance Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/attendance/mark">
          <div className="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white">
            <h2 className="text-xl font-semibold mb-2">Mark Attendance</h2>
            <p className="text-gray-600">Record student attendance for classes</p>
          </div>
        </Link>

        <Link href="/admin/attendance/qr">
          <div className="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white">
            <h2 className="text-xl font-semibold mb-2">QR Code Attendance</h2>
            <p className="text-gray-600">Generate QR codes for check-in</p>
          </div>
        </Link>

        <Link href="/admin/attendance/reports">
          <div className="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white">
            <h2 className="text-xl font-semibold mb-2">Attendance Reports</h2>
            <p className="text-gray-600">View attendance statistics and reports</p>
          </div>
        </Link>

        <Link href="/dashboard/attendance">
          <div className="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white">
            <h2 className="text-xl font-semibold mb-2">Recent Attendance</h2>
            <p className="text-gray-600">View recent attendance records</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
