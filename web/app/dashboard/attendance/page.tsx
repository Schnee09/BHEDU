"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { useProfile } from "@/hooks/useProfile";
import { apiFetch } from "@/lib/api/client";
import { Table } from "@/components/ui/table";
import Badge from "@/components/ui/badge";
import { routes } from "@/lib/routes";

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  check_in_time: string | null;
  notes: string | null;
  class: {
    id: string;
    name: string;
  };
}

export default function AttendancePage() {
  const { profile, loading: isProfileLoading } = useProfile();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const fetchAttendance = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsRateLimited(false);
      // Option A: canonical role-aware endpoint.
      // Server will scope results based on viewer role.
      const res = await apiFetch('/api/attendance');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to fetch attendance';
        
        // Check if rate limited
        if (res.status === 429 || errorMessage.includes('Rate limit')) {
          setIsRateLimited(true);
          // Extract retry time from error message if available
          const match = errorMessage.match(/Blocked until ([^"]+)/);
          if (match) {
            const blockedUntil = new Date(match[1]).getTime();
            const now = Date.now();
            const secondsRemaining = Math.max(0, Math.ceil((blockedUntil - now) / 1000));
            setRetryCountdown(secondsRemaining);
          } else {
            setRetryCountdown(60); // Default 60 second countdown
          }
        }
        throw new Error(errorMessage);
      }
      const response = await res.json();
      // Extract records array from response object (API returns { data: [] })
      const recordsData = Array.isArray(response)
        ? response
        : (response.data || response.records || []);
      setRecords(recordsData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load attendance records';
      console.error('Failed to fetch attendance:', err);
      setError(errorMessage);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Countdown timer for rate limit
  useEffect(() => {
    if (retryCountdown === null || retryCountdown <= 0) return;
    
    const timer = setInterval(() => {
      setRetryCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [retryCountdown]);

  // Fetch attendance for students
  useEffect(() => {
    if (profile?.role === 'student') {
      fetchAttendance();
    } else if (profile) {
      // Not a student, so we don't need to fetch records
      setIsLoading(false);
    }
  }, [profile, fetchAttendance]);

  if (isProfileLoading || (profile?.role === 'student' && isLoading)) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  // Show rate limit error with retry option
  if (isRateLimited && profile?.role === 'student') {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
          <p className="font-medium flex items-center gap-2">
            <span className="text-xl">⏳</span>
            Too Many Requests
          </p>
          <p className="text-sm mt-1">
            You've made too many requests. Please wait before trying again.
          </p>
          {retryCountdown !== null && retryCountdown > 0 ? (
            <p className="text-sm mt-2">
              You can retry in <span className="font-bold">{retryCountdown}</span> seconds
            </p>
          ) : (
            <button
              onClick={fetchAttendance}
              className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors text-sm font-medium"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show error if present
  if (error && profile?.role === 'student') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error Loading Attendance</p>
          <p className="text-sm mt-1">{error}</p>
          {error.includes('Profile not found') && (
            <p className="text-sm mt-2">
              Your profile hasn't been set up yet. Please contact your administrator.
            </p>
          )}
          {error.includes('Database error') && (
            <p className="text-sm mt-2">
              There was a problem accessing the attendance database. This might be a configuration issue.
            </p>
          )}
          {error.includes('Internal server error') && (
            <p className="text-sm mt-2">
              An unexpected error occurred. Please try again later or contact support.
            </p>
          )}
        </div>
      </div>
    );
  }

  // STUDENT VIEW
  if (profile?.role === 'student') {
    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'present': return <Badge variant="success">Present</Badge>;
        case 'late': return <Badge variant="warning">Late</Badge>;
        case 'absent': return <Badge variant="danger">Absent</Badge>; // Changed destructive to danger based on badge.tsx
        case 'excused': return <Badge variant="default">Excused</Badge>; // Changed secondary to default
        default: return <Badge variant="default">{status}</Badge>; // Changed outline to default
      }
    };

    // Calculate stats
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const late = records.filter(r => r.status === 'late').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    const columns = [
      { 
        key: 'date', 
        header: 'Date', 
        render: (row: AttendanceRecord) => new Date(row.date).toLocaleDateString() 
      },
      { 
        key: 'class', 
        header: 'Class', 
        render: (row: AttendanceRecord) => row.class?.name || 'Unknown Class' 
      },
      { 
        key: 'time', 
        header: 'Time', 
        render: (row: AttendanceRecord) => row.check_in_time ? new Date(row.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-' 
      },
      { 
        key: 'status', 
        header: 'Status', 
        render: (row: AttendanceRecord) => getStatusBadge(row.status) 
      },
      { 
        key: 'notes', 
        header: 'Notes', 
        render: (row: AttendanceRecord) => row.notes || '-' 
      }
    ];

    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
              <Icons.Attendance className="w-8 h-8 text-stone-600" />
              My Attendance
            </h1>
            <p className="text-stone-500 mt-1">Track your class attendance history</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-500">Attendance Rate</p>
                <p className="text-2xl font-bold text-stone-900">{attendanceRate}%</p>
              </div>
              <div className="p-2 bg-stone-100 rounded-full">
                <Icons.Chart className="w-5 h-5 text-stone-600" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-500">Present</p>
                <p className="text-2xl font-bold text-green-600">{present}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-full">
                <Icons.Success className="w-5 h-5 text-green-600" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-500">Late</p>
                <p className="text-2xl font-bold text-yellow-600">{late}</p>
              </div>
              <div className="p-2 bg-yellow-50 rounded-full">
                <Icons.Calendar className="w-5 h-5 text-yellow-600" />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-500">Absent</p>
                <p className="text-2xl font-bold text-red-600">{absent}</p>
              </div>
              <div className="p-2 bg-red-50 rounded-full">
                <Icons.Error className="w-5 h-5 text-red-600" />
              </div>
            </CardBody>
          </Card>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-stone-900">Attendance History</h3>
          </CardHeader>
          <CardBody>
            {records.length === 0 ? (
              <div className="text-center py-8 text-stone-500">
                No attendance records found.
              </div>
            ) : (
              <Table
                columns={columns}
                data={records}
                keyExtractor={(row) => row.id}
              />
            )}
          </CardBody>
        </Card>
      </div>
    );
  }

  // TEACHER / ADMIN VIEW
  const sections = [
    {
      title: "Mark Attendance",
      description: "Manually mark student attendance for classes",
      href: routes.attendance.mark(),
      icon: Icons.Success,
      color: "text-stone-600 bg-stone-100"
    },
    {
      title: "QR Code Attendance",
      description: "Generate QR codes for students to self-check in",
      href: routes.attendance.qr(),
      icon: Icons.View,
      color: "text-stone-600 bg-stone-100"
    },
    {
      title: "Attendance Reports",
      description: "View and analyze attendance data and trends",
      href: routes.attendance.reports(),
      icon: Icons.Chart,
      color: "text-stone-600 bg-stone-100"
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Icons.Attendance className="w-8 h-8 text-stone-600" />
            Attendance Management
          </h1>
          <p className="text-stone-500 mt-1">Choose an attendance management option below</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
              <CardBody className="flex flex-col items-center text-center p-8">
                <div className={`p-4 rounded-full mb-4 transition-colors group-hover:bg-stone-200 ${section.color}`}>
                  <section.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-stone-900 mb-2">
                  {section.title}
                </h3>
                <p className="text-stone-600">
                  {section.description}
                </p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="bg-stone-50 border-stone-200">
        <CardBody className="flex items-start gap-4">
          <div className="p-2 bg-stone-200 rounded-lg text-stone-600">
            <Icons.Info className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Quick Tips</h3>
            <ul className="space-y-2 text-stone-700">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-stone-500 rounded-full" />
                <span>Use <strong>Mark Attendance</strong> for traditional roll call</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-stone-500 rounded-full" />
                <span>Use <strong>QR Code Attendance</strong> for quick student self-check-in</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-stone-500 rounded-full" />
                <span>Check <strong>Attendance Reports</strong> for weekly and monthly summaries</span>
              </li>
            </ul>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}