'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import Badge from '@/components/ui/badge';
import { Icons } from '@/components/ui/Icons';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { Calendar, Search, Filter, X, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string | null;
  student?: {
    full_name: string;
    student_id: string;
    email: string;
  };
  class?: {
    name: string;
  };
}

interface ClassOption {
  id: string;
  name: string;
}

export default function AttendanceHistoryPage() {
  const { isStudent, loading: permsLoading } = usePermissions();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    if (!permsLoading) {
      loadClasses();
    }
  }, [permsLoading]);

  useEffect(() => {
    if (!permsLoading) {
      loadRecords();
    }
  }, [permsLoading, selectedClass, selectedStatus, startDate, endDate, page]);

  const loadClasses = async () => {
    try {
      const response = await apiFetch('/api/classes/my-classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || data.data || []);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedClass) params.append('classId', selectedClass);
      if (selectedStatus) params.append('status', selectedStatus);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await apiFetch(`/api/attendance/reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRecords(data.data || []);
        // Calculate total pages
        const total = data.total || data.data?.length || 0;
        setTotalPages(Math.max(1, Math.ceil(total / limit)));
      }
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedStatus, startDate, endDate, page]);

  const filteredRecords = useMemo(() => {
    if (!searchQuery) return records;
    const query = searchQuery.toLowerCase();
    return records.filter(
      (record) =>
        record.student?.full_name?.toLowerCase().includes(query) ||
        record.student?.student_id?.toLowerCase().includes(query) ||
        record.class?.name?.toLowerCase().includes(query)
    );
  }, [records, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return (
          <Badge
            variant="success"
            className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
          >
            Có mặt
          </Badge>
        );
      case 'absent':
        return (
          <Badge
            variant="danger"
            className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
          >
            Vắng
          </Badge>
        );
      case 'late':
        return (
          <Badge
            variant="warning"
            className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
          >
            Muộn
          </Badge>
        );
      case 'excused':
        return (
          <Badge
            variant="info"
            className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
          >
            P.Nghỉ
          </Badge>
        );
      default:
        return (
          <Badge
            variant="default"
            className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
          >
            {status}
          </Badge>
        );
    }
  };

  if (permsLoading) return null;

  return (
    <div className="min-h-screen bg-transparent py-4 sm:py-8 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1200px] mx-auto space-y-6 sm:space-y-8 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest">
              <Calendar className="w-3.5 h-3.5" />
              {isStudent ? 'Cá nhân' : 'Quản trị'}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-white tracking-tight uppercase">
              {isStudent ? 'Lịch Sử Điểm Danh' : 'Báo Cáo Điểm Danh'}
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 font-medium">
              {isStudent
                ? 'Theo dõi hành trình chuyên cần của chính bạn qua từng buổi học.'
                : 'Phân tích và quản lý trạng thái chuyên cần của tất cả học sinh.'}
            </p>
          </div>

          {!isStudent && (
            <Button
              variant="primary"
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 rounded-2xl h-12 px-6"
            >
              <Icons.Download className="w-4 h-4 mr-2" />
              Xuất báo cáo
            </Button>
          )}
        </div>

        {/* Filters Panel */}
        <Card className="border-none shadow-2xl shadow-stone-200/50 dark:shadow-none bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl rounded-[2rem] overflow-visible">
          <CardBody className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {!isStudent && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">
                    Tìm kiếm
                  </label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                      type="text"
                      placeholder="Tên, mã HS, lớp..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-11 h-12 bg-stone-100/50 dark:bg-stone-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">
                  Lớp học
                </label>
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                  <Select
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setPage(1);
                    }}
                    className="pl-11 h-12 bg-stone-100/50 dark:bg-stone-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none"
                  >
                    <option value="">Tất cả lớp</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">
                  Trạng thái
                </label>
                <Select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPage(1);
                  }}
                  className="h-12 bg-stone-100/50 dark:bg-stone-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                >
                  <option value="">Toàn bộ trạng thái</option>
                  <option value="present">Có mặt</option>
                  <option value="absent">Vắng mặt</option>
                  <option value="late">Đi muộn</option>
                  <option value="excused">Có phép</option>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">
                  Khoảng thời gian
                </label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="h-12 bg-stone-100/50 dark:bg-stone-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-xs font-bold uppercase"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="h-12 bg-stone-100/50 dark:bg-stone-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-xs font-bold uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Filter Summary & Reset */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-stone-100 dark:border-stone-800 pt-6">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                  {loading ? 'Đang cập nhật...' : `Tìm thấy ${filteredRecords.length} kết quả`}
                </p>
              </div>

              {(selectedClass || selectedStatus || startDate || endDate || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedClass('');
                    setSelectedStatus('');
                    setStartDate('');
                    setEndDate('');
                    setSearchQuery('');
                    setPage(1);
                  }}
                  className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                >
                  <X className="w-3 h-3 group-hover:rotate-90 transition-transform" />
                  Bỏ bộ lọc
                </button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Main Content Area */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2.5rem] opacity-20 blur-2xl group-hover:opacity-30 transition-opacity duration-1000" />
          <Card className="border-none shadow-2xl shadow-stone-200/50 dark:shadow-none bg-white/90 dark:bg-stone-900/90 backdrop-blur-2xl rounded-[2rem] overflow-hidden relative">
            <CardBody className="p-0">
              {loading && filteredRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">
                    Đang truy xuất dữ liệu...
                  </p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-6">
                  <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center">
                    <Calendar className="w-10 h-10 text-stone-300" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-stone-900 dark:text-white font-black uppercase tracking-tight">
                      Không tìm thấy dữ liệu
                    </h3>
                    <p className="text-stone-400 text-sm font-medium mt-1">
                      Hãy thử điều chỉnh bộ lọc hoặc chọn khoảng thời gian khác.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPage(1)}
                    className="rounded-xl border-stone-200 dark:border-stone-800"
                  >
                    Tải lại trang
                  </Button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-stone-50/50 dark:bg-stone-800/50">
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400">
                            Thời gian
                          </th>
                          {!isStudent && (
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400">
                              Học sinh
                            </th>
                          )}
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400">
                            Lớp học
                          </th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400 text-center">
                            Trạng thái
                          </th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-stone-400">
                            Ghi chú
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                        {filteredRecords.map((record) => (
                          <tr
                            key={record.id}
                            className="group/row hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors"
                          >
                            <td className="px-8 py-6">
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-stone-900 dark:text-white tracking-tight">
                                  {new Date(record.date).toLocaleDateString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })}
                                </span>
                                <span className="text-[10px] font-bold text-stone-400 uppercase">
                                  {new Date(record.date).toLocaleDateString('vi-VN', {
                                    weekday: 'long',
                                  })}
                                </span>
                              </div>
                            </td>
                            {!isStudent && (
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-50 to-stone-100 dark:from-stone-800 dark:to-stone-900 flex items-center justify-center text-indigo-500 font-black tracking-tighter text-sm uppercase">
                                    {record.student?.full_name?.substring(0, 2)}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-black text-stone-900 dark:text-white tracking-tight">
                                      {record.student?.full_name}
                                    </span>
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                      {record.student?.student_id}
                                    </span>
                                  </div>
                                </div>
                              </td>
                            )}
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                                  <FileText className="w-3 h-3 text-stone-400" />
                                </div>
                                <span className="text-sm font-bold text-stone-600 dark:text-stone-300">
                                  {record.class?.name || 'Chưa xác định'}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                              {getStatusBadge(record.status)}
                            </td>
                            <td className="px-8 py-6">
                              <p
                                className={cn(
                                  'text-xs font-medium max-w-[200px] truncate transition-all',
                                  record.notes
                                    ? 'text-stone-600 dark:text-stone-400'
                                    : 'text-stone-300 dark:text-stone-600 italic'
                                )}
                              >
                                {record.notes || 'Không có ghi chú'}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Bar */}
                  <div className="px-8 py-6 bg-stone-50/50 dark:bg-stone-800/30 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                        Trang
                      </span>
                      <div className="h-8 min-w-[32px] px-2 bg-white dark:bg-stone-900 rounded-lg flex items-center justify-center text-xs font-black text-indigo-600 border border-stone-200 dark:border-stone-800">
                        {page}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                        của {totalPages}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="h-10 w-10 flex items-center justify-center rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-white dark:hover:bg-stone-900 disabled:opacity-30 disabled:pointer-events-none transition-all"
                      >
                        <ChevronLeft className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="h-10 w-10 flex items-center justify-center rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-white dark:hover:bg-stone-900 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
                      >
                        <ChevronRight className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
