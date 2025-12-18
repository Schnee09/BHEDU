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
        const errorMessage = errorData.error || 'Không thể tải điểm danh';
        
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
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải bản ghi điểm danh';
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
            Quá nhiều yêu cầu
          </p>
          <p className="text-sm mt-1">
            Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng đợi trước khi thử lại.
          </p>
          {retryCountdown !== null && retryCountdown > 0 ? (
            <p className="text-sm mt-2">
              Bạn có thể thử lại sau <span className="font-bold">{retryCountdown}</span> giây
            </p>
          ) : (
            <button
              onClick={fetchAttendance}
              className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors text-sm font-medium"
            >
              Thử lại
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
          <p className="font-medium">Lỗi tải điểm danh</p>
          <p className="text-sm mt-1">{error}</p>
          {error.includes('Profile not found') && (
            <p className="text-sm mt-2">
              Hồ sơ của bạn chưa được thiết lập. Vui lòng liên hệ với quản trị viên.
            </p>
          )}
          {error.includes('Database error') && (
            <p className="text-sm mt-2">
              Có vấn đề khi truy cập cơ sở dữ liệu điểm danh. Điều này có thể là vấn đề cấu hình.
            </p>
          )}
          {error.includes('Internal server error') && (
            <p className="text-sm mt-2">
              Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.
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
        case 'present': return <Badge variant="success">Có mặt</Badge>;
        case 'late': return <Badge variant="warning">Muộn</Badge>;
        case 'absent': return <Badge variant="danger">Vắng mặt</Badge>; // Changed destructive to danger based on badge.tsx
        case 'excused': return <Badge variant="default">Có phép</Badge>; // Changed secondary to default
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
        header: 'Ngày', 
        render: (row: AttendanceRecord) => new Date(row.date).toLocaleDateString('vi-VN') 
      },
      { 
        key: 'class', 
        header: 'Lớp', 
        render: (row: AttendanceRecord) => row.class?.name || 'Lớp không xác định' 
      },
      { 
        key: 'time', 
        header: 'Thời gian', 
        render: (row: AttendanceRecord) => row.check_in_time ? new Date(row.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-' 
      },
      { 
        key: 'status', 
        header: 'Trạng thái', 
        render: (row: AttendanceRecord) => getStatusBadge(row.status) 
      },
      { 
        key: 'notes', 
        header: 'Ghi chú', 
        render: (row: AttendanceRecord) => row.notes || '-' 
      }
    ];

    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
              <Icons.Attendance className="w-8 h-8 text-stone-600" />
              Điểm danh của tôi
            </h1>
            <p className="text-stone-500 mt-1">Theo dõi lịch sử điểm danh lớp học của bạn</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-500">Tỷ lệ điểm danh</p>
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
                <p className="text-sm font-medium text-stone-500">Có mặt</p>
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
                <p className="text-sm font-medium text-stone-500">Muộn</p>
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
                <p className="text-sm font-medium text-stone-500">Vắng mặt</p>
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
            <h3 className="text-lg font-semibold text-stone-900">Lịch sử điểm danh</h3>
          </CardHeader>
          <CardBody>
            {records.length === 0 ? (
              <div className="text-center py-8 text-stone-500">
                Không tìm thấy bản ghi điểm danh nào.
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
      title: "Điểm danh thủ công",
      description: "Điểm danh thủ công cho học sinh trong lớp",
      href: routes.attendance.mark(),
      icon: Icons.Success,
      color: "text-stone-600 bg-stone-100"
    },
    {
      title: "Điểm danh bằng mã QR",
      description: "Tạo mã QR để học sinh tự điểm danh",
      href: routes.attendance.qr(),
      icon: Icons.View,
      color: "text-stone-600 bg-stone-100"
    },
    {
      title: "Báo cáo điểm danh",
      description: "Xem và phân tích dữ liệu điểm danh và xu hướng",
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
            Quản lý điểm danh
          </h1>
          <p className="text-stone-500 mt-1">Chọn một tùy chọn quản lý điểm danh bên dưới</p>
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
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Mẹo nhanh</h3>
            <ul className="space-y-2 text-stone-700">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-stone-500 rounded-full" />
                <span>Sử dụng <strong>Điểm danh thủ công</strong> cho việc điểm danh truyền thống</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-stone-500 rounded-full" />
                <span>Sử dụng <strong>Điểm danh bằng mã QR</strong> để học sinh tự điểm danh nhanh</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-stone-500 rounded-full" />
                <span>Kiểm tra <strong>Báo cáo điểm danh</strong> để xem tóm tắt hàng tuần và hàng tháng</span>
              </li>
            </ul>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}