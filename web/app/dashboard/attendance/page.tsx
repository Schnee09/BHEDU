"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { useProfile } from "@/hooks/useProfile";
import { usePermissions } from "@/hooks/usePermissions";
import { apiFetch, getAttendance } from "@/lib/api/client";
import { Table } from "@/components/ui/table";
import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui";
import { routes } from "@/lib/routes";
import { ResponsiveTable, MobileCard } from "@/components/ui/ResponsiveTable";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent';
  remarks: string | null;
  className: string;
  subjectName?: string;
}

interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  attendanceRate: number;
}

export default function AttendancePage() {
  const { profile, loading: isProfileLoading } = useProfile();
  const { isStudent, isTeacher, isAdmin, isStaff } = usePermissions();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({ totalDays: 0, presentDays: 0, absentDays: 0, attendanceRate: 0 });
  const [recentClasses, setRecentClasses] = useState<any[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);
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

      const params: any = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.status && filters.status !== 'all') params.status = filters.status;

      const res = await getAttendance(params);
      const recordsData = res.data || [];

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
  }, [filters]);

  // Countdown timer for rate limit logic removed as client handles basic errors, 
  // but if we want to keep rate limit UI, we'd need to intercept it.
  // For now, simplifying validation.

  // Fetch attendance for students or classes for teachers
  useEffect(() => {
    if (isStudent) {
      fetchAttendance();
    } else if (isTeacher || isStaff || isAdmin) {
      loadTeacherContext();
    }
  }, [isStudent, isTeacher, isStaff, isAdmin, fetchAttendance]);

  const loadTeacherContext = async () => {
    try {
      const res = await apiFetch('/api/classes/my-classes');
      if (res.ok) {
        const data = await res.json();
        const personal = data.myClasses || [];
        const others = (data.classes || []).filter((c: any) => !personal.some((p: any) => p.id === c.id));

        // Prioritize personal classes in the recent/main list
        setRecentClasses([...personal, ...others].slice(0, 6));
        setAllClasses(data.classes || []);
      }
    } catch (err) {
      console.error('Failed to load teacher context:', err);
    } finally {
      setLoading(false);
    }
  };

  if (isProfileLoading || (isStudent && loading)) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-8 relative z-10">
          <div className="mb-6">
            <div className="h-10 w-64 bg-stone-200 dark:bg-stone-800 rounded-3xl animate-pulse mb-2" />
            <div className="h-6 w-96 bg-stone-200 dark:bg-stone-800 rounded-2xl animate-pulse" />
          </div>
          <div className="glass-crystal rounded-2xl p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-stone-100 dark:bg-stone-800/60 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show rate limit error with retry option
  if (isRateLimited && isStudent) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-8 relative z-10">
          <div className="glass-crystal rounded-2xl p-8 text-center">
            <div className="p-4 bg-amber-500/10 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight mb-2">
              Quá nhiều yêu cầu
            </h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm mb-4">
              Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng đợi trước khi thử lại.
            </p>
            {retryCountdown !== null && retryCountdown > 0 ? (
              <p className="text-sm text-stone-400 dark:text-stone-500">
                Thử lại sau: {retryCountdown} giây
              </p>
            ) : (
              <Button onClick={fetchAttendance} className="mt-4">Thử lại ngay</Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show error if present
  if (error && isStudent) {
    return (
      <div className="bg-transparent min-h-screen">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-5 py-4 rounded-2xl">
            <p className="font-black text-sm uppercase tracking-wider">Lỗi tải điểm danh</p>
            <p className="text-sm mt-1 text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // STUDENT VIEW
  if (isStudent) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-6 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                <Icons.Attendance className="w-8 h-8 text-stone-600" />
                Điểm danh của tôi
              </h1>
              <p className="text-stone-500 mt-1">Xem lịch sử điểm danh và thống kê</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white dark:bg-[#1A1410] rounded-2xl p-4 border border-stone-100 dark:border-[#2C2420] shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group press-effect">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
                <Icons.Calendar className="w-12 h-12 text-blue-600" />
              </div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Tổng số ngày</p>
              <p className="text-3xl font-black text-stone-900 dark:text-stone-100">{stats.totalDays}</p>
              <div className="h-1 w-8 bg-blue-500 rounded-full" />
            </div>

            <div className="bg-white dark:bg-[#1A1410] rounded-2xl p-4 border border-stone-100 dark:border-[#2C2420] shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group press-effect">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
                <Icons.Success className="w-12 h-12 text-green-600" />
              </div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Có mặt</p>
              <p className="text-3xl font-black text-green-600">{stats.presentDays}</p>
              <div className="h-1 w-8 bg-green-500 rounded-full" />
            </div>

            <div className="bg-white dark:bg-[#1A1410] rounded-2xl p-4 border border-stone-100 dark:border-[#2C2420] shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group press-effect">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
                <Icons.Error className="w-12 h-12 text-red-600" />
              </div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Vắng mặt</p>
              <p className="text-3xl font-black text-red-600">{stats.absentDays}</p>
              <div className="h-1 w-8 bg-red-500 rounded-full" />
            </div>

            <div className="bg-white dark:bg-[#1C1814] rounded-2xl p-4 border border-amber-500/20 shadow-lg shadow-amber-500/5 flex flex-col justify-between h-32 relative overflow-hidden group press-effect">
              <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:scale-110 transition-transform">
                <Icons.Chart className="w-12 h-12 text-amber-500" />
              </div>
              <p className="text-xs font-bold text-amber-500/80 uppercase tracking-widest">Tỷ lệ</p>
              <p className="text-3xl font-black text-amber-500">{stats.attendanceRate}%</p>
              <div className="h-1 w-12 bg-amber-500 rounded-full" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Lịch sử điểm danh</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="tap-target px-4 rounded-xl border-stone-200 dark:border-stone-800"
              >
                <Icons.Filter className="w-4 h-4 mr-2" />
                Lọc
              </Button>
            </div>

            {showFilters && (
              <Card className="animate-slide-down">
                <CardBody>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 ml-1">Từ ngày</label>
                      <Input
                        type="date"
                        value={filters.startDate}
                        className="rounded-xl border-stone-100"
                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 ml-1">Đến ngày</label>
                      <Input
                        type="date"
                        value={filters.endDate}
                        className="rounded-xl border-stone-100"
                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 ml-1">Trạng thái</label>
                      <Select
                        value={filters.status}
                        className="rounded-xl border-stone-100"
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      >
                        <option value="all">Tất cả</option>
                        <option value="present">Có mặt</option>
                        <option value="absent">Vắng mặt</option>
                      </Select>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-stone-100 dark:bg-stone-800 rounded-2xl skeleton-shimmer" />
                ))}
              </div>
            ) : attendanceRecords.length === 0 ? (
              <EmptyState
                icon={<Icons.Calendar className="w-12 h-12 text-stone-300" />}
                title="Chưa có dữ liệu"
                description="Bạn chưa có lịch sử điểm danh nào được ghi nhận."
              />
            ) : (
              <ResponsiveTable
                mobileView={
                  <div className="space-y-3 pb-24 animate-fade-in">
                    {attendanceRecords.map((record) => (
                      <MobileCard
                        key={record.id}
                        title={record.subjectName || record.className}
                        subtitle={format(new Date(record.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
                        status={{
                          label: record.status === 'present' ? 'Có mặt' : 'Vắng mặt',
                          color: record.status === 'present' ? 'green' : 'red'
                        }}
                        fields={[
                          { label: "Lớp", value: record.className },
                          { label: "Ghi chú", value: record.remarks || '---' }
                        ]}
                        className="press-effect"
                      />
                    ))}
                  </div>
                }
              >
                <div className="bg-white dark:bg-[#1A1410] rounded-2xl border border-stone-100 dark:border-[#2C2420] overflow-hidden shadow-sm">
                  <Table
                    data={attendanceRecords}
                    keyExtractor={(record) => record.id}
                    columns={[
                      {
                        key: 'date',
                        header: 'Ngày',
                        render: (record: AttendanceRecord) => format(new Date(record.date), 'dd/MM/yyyy')
                      },
                      {
                        key: 'className',
                        header: 'Lớp',
                        render: (record: AttendanceRecord) => record.className
                      },
                      {
                        key: 'subjectName',
                        header: 'Môn học',
                        render: (record: AttendanceRecord) => record.subjectName || '-'
                      },
                      {
                        key: 'status',
                        header: 'Trạng thái',
                        render: (record: AttendanceRecord) => (
                          <Badge variant={record.status === 'present' ? 'success' : 'danger'}>
                            {record.status === 'present' ? 'Có mặt' : 'Vắng mặt'}
                          </Badge>
                        )
                      },
                      {
                        key: 'remarks',
                        header: 'Ghi chú',
                        render: (record: AttendanceRecord) => (
                          <span className="text-stone-500 italic text-sm">{record.remarks || '-'}</span>
                        )
                      }
                    ]}
                  />
                </div>
              </ResponsiveTable>
            )}
          </div>
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
    <div className="bg-transparent min-h-screen relative overflow-x-hidden">
      <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-6 relative z-10">
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
              <Card className="h-full hover:shadow-lg transition-all border-none shadow-sm ring-1 ring-stone-200 group overflow-hidden">
                <CardBody className="flex flex-col items-center text-center p-8 relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-stone-100 group-hover:bg-stone-500 transition-colors" />
                  <div className={`p-4 rounded-2xl mb-4 transition-all group-hover:scale-110 ${section.color}`}>
                    <section.icon className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 mb-2">
                    {section.title}
                  </h3>
                  <p className="text-stone-600 text-sm leading-relaxed">
                    {section.description}
                  </p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>

        {/* Teacher Recent Activity */}
        {(isTeacher || isStaff || isAdmin) && (recentClasses.length > 0) && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Icons.History className="w-5 h-5 text-stone-500" />
              {(isStaff || isAdmin) ? "Lớp của tôi & Quản lý" : "Lớp học của bạn"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentClasses.map(cls => (
                <div key={cls.id} className="bg-white dark:bg-stone-900/60 p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between hover:border-stone-400 dark:hover:border-stone-600 transition-colors group">
                  <div>
                    <p className="font-bold text-stone-900 dark:text-stone-100">{cls.name}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{cls.subject_name || 'Học Phần'}</p>
                  </div>
                  <Link
                    href={`/dashboard/attendance/mark?classId=${cls.id}`}
                    className="p-2 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg group-hover:bg-stone-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-stone-900 transition-all"
                  >
                    <Icons.Edit className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <Card className="bg-stone-900 border-none shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Icons.Attendance className="w-32 h-32 text-white" />
          </div>
          <CardBody className="flex items-start gap-6 p-8 relative z-10 text-white">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
              <Icons.Info className="w-8 h-8 text-stone-100" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3">Mẹo quản lý hiệu quả</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-stone-200">
                  <div className="w-2 h-2 bg-stone-400 rounded-full" />
                  <span>Sử dụng <strong>Điểm danh thủ công</strong> mỗi buổi học để duy trì dữ liệu chính xác.</span>
                </li>
                <li className="flex items-center gap-3 text-stone-200">
                  <div className="w-2 h-2 bg-stone-400 rounded-full" />
                  <span>Kiểm tra <strong>Báo cáo</strong> hàng tuần để phát hiện sớm các trường hợp học sinh nghỉ học nhiều.</span>
                </li>
              </ul>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}