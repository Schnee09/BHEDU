"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { useProfile } from "@/hooks/useProfile";
import { apiFetch } from "@/lib/api/client";
import { Table } from "@/components/ui/table";
import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui";
import { routes } from "@/lib/routes";

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  checkInTime: string | null;
  notes: string | null;
  className: string;
  subjectName: string;
}

interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  attendanceRate: number;
}

export default function AttendancePage() {
  const { profile, loading: isProfileLoading } = useProfile();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({ totalDays: 0, presentDays: 0, absentDays: 0, attendanceRate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all'
  });

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setIsRateLimited(false);

      const res = await apiFetch('/api/attendance');

      const safeParseJson = async (r: Response) => {
        try {
          return await r.json();
        } catch {
          return { error: r.statusText || `HTTP ${r.status}` };
        }
      };

      if (!res.ok) {
        const errorData = await safeParseJson(res);
        const errorMessage = (errorData && (errorData.error || errorData.message)) || 'Không thể tải điểm danh';

        if (res.status === 401) {
          setError('Bạn chưa đăng nhập hoặc phiên đã hết hạn. Vui lòng đăng nhập lại.');
          setLoading(false);
          return;
        }

        if (res.status === 403) {
          setError('Bạn không có quyền truy cập dữ liệu điểm danh.');
          setLoading(false);
          return;
        }

        if (res.status === 429 || String(errorMessage).toLowerCase().includes('rate limit') || String(errorMessage).toLowerCase().includes('blocked')) {
          setIsRateLimited(true);
          const match = String(errorMessage).match(/Blocked until ([^\"]+)/);
          if (match) {
            const blockedUntil = new Date(match[1]).getTime();
            const now = Date.now();
            const secondsRemaining = Math.max(0, Math.ceil((blockedUntil - now) / 1000));
            setRetryCountdown(secondsRemaining);
          } else {
            setRetryCountdown(60);
          }
        }

        throw new Error(String(errorMessage));
      }

      const response = await safeParseJson(res);
      const recordsData = Array.isArray(response)
        ? response
        : (response.data || response.records || []);

      setAttendanceRecords(recordsData);

      // Calculate stats
      const totalDays = recordsData.length;
      const presentDays = recordsData.filter((r: AttendanceRecord) => r.status === 'present').length;
      const absentDays = recordsData.filter((r: AttendanceRecord) => r.status === 'absent').length;
      const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      setStats({ totalDays, presentDays, absentDays, attendanceRate });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải bản ghi điểm danh';
      console.error('Failed to fetch attendance:', err);
      setError(errorMessage);
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
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
      setLoading(false);
    }
  }, [profile, fetchAttendance]);

  if (isProfileLoading || (profile?.role === 'student' && loading)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-6 w-96 bg-gray-200 rounded animate-pulse" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show rate limit error with retry option
  if (isRateLimited && profile?.role === 'student') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="p-4 bg-yellow-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Quá nhiều yêu cầu
            </h3>
            <p className="text-gray-600 mb-4">
              Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng đợi trước khi thử lại.
            </p>
            {retryCountdown !== null && retryCountdown > 0 ? (
              <p className="text-sm text-gray-500">
                Thử lại sau: {retryCountdown} giây
              </p>
            ) : (
              <Button onClick={fetchAttendance} className="mt-4">
                Thử lại ngay
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show error if present
  if (error && profile?.role === 'student') {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </div>
    );
  }

  // STUDENT VIEW
  if (profile?.role === 'student') {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                <Icons.Attendance className="w-8 h-8 text-stone-600" />
                Điểm danh của tôi
              </h1>
              <p className="text-stone-500 mt-1">Xem lịch sử điểm danh và thống kê</p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white">
              <CardBody className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-500">Tổng số ngày</p>
                  <p className="text-2xl font-bold text-stone-900">{stats.totalDays}</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-full">
                  <Icons.Calendar className="w-5 h-5 text-blue-600" />
                </div>
              </CardBody>
            </Card>
            <Card className="bg-white">
              <CardBody className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-500">Có mặt</p>
                  <p className="text-2xl font-bold text-green-600">{stats.presentDays}</p>
                </div>
                <div className="p-2 bg-green-50 rounded-full">
                  <Icons.Success className="w-5 h-5 text-green-600" />
                </div>
              </CardBody>
            </Card>
            <Card className="bg-white">
              <CardBody className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-500">Vắng mặt</p>
                  <p className="text-2xl font-bold text-red-600">{stats.absentDays}</p>
                </div>
                <div className="p-2 bg-red-50 rounded-full">
                  <Icons.Error className="w-5 h-5 text-red-600" />
                </div>
              </CardBody>
            </Card>
            <Card className="bg-white">
              <CardBody className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-500">Tỷ lệ có mặt</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.attendanceRate}%</p>
                </div>
                <div className="p-2 bg-purple-50 rounded-full">
                  <Icons.Chart className="w-5 h-5 text-purple-600" />
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Attendance Records Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-stone-900">Lịch sử điểm danh</h2>
                  <p className="text-stone-600 text-sm">Chi tiết các buổi học đã điểm danh</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                  >
                    <Icons.Filter className="w-4 h-4" />
                    Bộ lọc
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              {showFilters && (
                <div className="mb-6 p-4 bg-stone-50 rounded-lg border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Từ ngày
                      </label>
                      <Input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Đến ngày
                      </label>
                      <Input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Trạng thái
                      </label>
                      <Select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      >
                        <option value="all">Tất cả</option>
                        <option value="present">Có mặt</option>
                        <option value="absent">Vắng mặt</option>
                        <option value="late">Đến muộn</option>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-stone-200 rounded w-full mb-2"></div>
                      <div className="h-4 bg-stone-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : attendanceRecords.length === 0 ? (
                <EmptyState
                  icon={<Icons.Calendar className="w-12 h-12" />}
                  title="Chưa có dữ liệu điểm danh"
                  description="Bạn chưa có lịch sử điểm danh nào được ghi nhận."
                />
              ) : (
                <Table
                  data={attendanceRecords}
                  keyExtractor={(record) => record.id}
                  columns={[
                    {
                      key: 'date',
                      header: 'Ngày',
                      render: (record: AttendanceRecord) => new Date(record.date).toLocaleDateString('vi-VN')
                    },
                    {
                      key: 'className',
                      header: 'Lớp',
                      render: (record: AttendanceRecord) => record.className
                    },
                    {
                      key: 'subjectName',
                      header: 'Môn học',
                      render: (record: AttendanceRecord) => record.subjectName
                    },
                    {
                      key: 'status',
                      header: 'Trạng thái',
                      render: (record: AttendanceRecord) => (
                        <Badge
                          variant={
                            record.status === 'present' ? 'success' :
                              record.status === 'absent' ? 'danger' :
                                record.status === 'late' ? 'warning' : 'default'
                          }
                        >
                          {record.status === 'present' ? 'Có mặt' :
                            record.status === 'absent' ? 'Vắng mặt' :
                              record.status === 'late' ? 'Đến muộn' : 'Chưa rõ'}
                        </Badge>
                      )
                    },
                    {
                      key: 'checkInTime',
                      header: 'Giờ điểm danh',
                      render: (record: AttendanceRecord) => record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString('vi-VN') : '-'
                    },
                    {
                      key: 'notes',
                      header: 'Ghi chú',
                      render: (record: AttendanceRecord) => record.notes || '-'
                    }
                  ]}
                />
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  const sections = [
    {
      title: "Điểm danh thủ công",
      description: "Điểm danh thủ công cho học sinh trong lớp",
      href: routes.attendance.mark(),
      icon: Icons.Success,
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
    <div className="bg-gray-50 min-h-screen">
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
                  <span>Kiểm tra <strong>Báo cáo điểm danh</strong> để xem tóm tắt hàng tuần và hàng tháng</span>
                </li>
              </ul>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}