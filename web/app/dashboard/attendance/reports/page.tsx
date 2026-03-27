'use client';

import { useState, useEffect } from 'react';
import { apiFetch, getClasses, getAttendance } from '@/lib/api/client';
import { toast } from 'react-hot-toast';
import { ChartBarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { parseISO, format, subDays, startOfWeek, endOfWeek, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';

// Types matching V2 API response with joined relations
interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks: string | null;
  student?: {
    id: string;
    email?: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    student_code?: string;
  };
  class?: {
    id: string;
    name: string;
    code?: string;
  };
}

interface Analytics {
  totalRecords: number;
  totalPresent: number;
  totalAbsent: number;
  attendanceRate: number;
  byStatus: Record<string, number>;
  byClass: Record<string, { name: string; count: number; present: number; rate: number }>;
  byStudent: Record<
    string,
    { name: string; studentId: string; count: number; present: number; rate: number }
  >;
}

interface ClassOption {
  id: string;
  name: string;
}

export default function AttendanceReportsPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('week');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'overview' | 'details'>('overview');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, dateRange, startDate, endDate, statusFilter]);

  const loadClasses = async () => {
    try {
      const res = await getClasses({ limit: 100 });
      const classList = (res.data || []) as any[];
      setClasses(classList.map((c) => ({ id: c.id, name: c.name })));
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const setQuickRange = (range: string) => {
    setDateRange(range);
    // Actual dates will be calculated in loadReports or verify here?
    // Better to let loadReports handle logic or set explicit dates here.
    // For now, loadReports logic is preserved.
  };

  const loadReports = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const today = new Date();
      let start = '';
      let end = today.toISOString().split('T')[0] ?? '';

      if (dateRange === 'today') {
        start = end;
      } else if (dateRange === 'week') {
        const weekAgo = subDays(today, 7);
        start = weekAgo.toISOString().split('T')[0] ?? '';
      } else if (dateRange === 'month') {
        const monthAgo = subMonths(today, 1);
        start = monthAgo.toISOString().split('T')[0] ?? '';
      } else if (dateRange === 'term') {
        const termStart = subMonths(today, 3);
        start = format(termStart, 'yyyy-MM-dd');
      } else if (dateRange === 'custom') {
        start = startDate;
        end = endDate;
      }

      // Prepare V2 Params
      const params: any = {
        limit: 1000, // Fetch large batch for reports
        startDate: start,
        endDate: end,
      };
      if (selectedClass) params.class_id = selectedClass;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;

      const res = await getAttendance(params);
      const data = (res.data || []) as AttendanceRecord[];
      setRecords(data);

      // Calculate Analytics on Client
      computeAnalytics(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
      //   alert('Không thể tải báo cáo') // Silently fail or show toast
    } finally {
      setLoading(false);
    }
  };

  const computeAnalytics = (data: AttendanceRecord[]) => {
    const totalRecords = data.length;
    if (totalRecords === 0) {
      setAnalytics(null);
      return;
    }

    const totalPresent = data.filter((r) => r.status === 'present').length;
    const totalAbsent = data.filter((r) => r.status === 'absent').length;

    // Attendance Rate: Present / Total * 100
    const attendanceRate = Math.round((totalPresent / totalRecords) * 100);

    const byStatus: Record<string, number> = {};
    data.forEach((r) => {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    });

    const byClass: Record<string, any> = {};
    const byStudent: Record<string, any> = {};

    data.forEach((r) => {
      // By Class
      const clsId = r.class_id;
      if (!byClass[clsId]) {
        byClass[clsId] = {
          name: r.class?.name || 'Unknown Class',
          count: 0,
          present: 0,
          rate: 0,
        };
      }
      byClass[clsId].count++;
      if (r.status === 'present') byClass[clsId].present++;

      // By Student
      const stuId = r.student_id;
      if (!byStudent[stuId]) {
        byStudent[stuId] = {
          name: r.student?.full_name || r.student?.email || 'Unknown',
          studentId: r.student?.student_code || r.student?.id || stuId,
          count: 0,
          present: 0,
          rate: 0,
        };
      }
      byStudent[stuId].count++;
      if (r.status === 'present') byStudent[stuId].present++;
    });

    // Calculate Rates
    Object.values(byClass).forEach((c) => {
      c.rate = Math.round((c.present / c.count) * 100);
    });
    Object.values(byStudent).forEach((s) => {
      s.rate = Math.round((s.present / s.count) * 100);
    });

    setAnalytics({
      totalRecords,
      totalPresent,
      totalAbsent,
      attendanceRate,
      byStatus,
      byClass,
      byStudent,
    });
  };

  const handleExport = () => {
    if (records.length === 0) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }

    setExporting(true);
    try {
      // Create CSV content
      const headers = ['Date', 'Student Name', 'Student ID', 'Class', 'Status', 'Remarks'];
      const rows = records.map((record) => [
        format(parseISO(record.date), 'dd/MM/yyyy'),
        record.student?.full_name || record.student?.email || '',
        record.student?.student_code || record.student?.id || '',
        record.class?.name || '',
        record.status === 'present' ? 'Có mặt' : 'Vắng',
        record.remarks || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Không thể xuất dữ liệu');
    } finally {
      setExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      late: 'bg-yellow-100 text-yellow-800',
      excused: 'bg-blue-100 text-blue-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-blue-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get top and bottom performers
  const studentStats = analytics
    ? Object.values(analytics.byStudent).sort((a: any, b: any) => b.rate - a.rate)
    : [];
  const topPerformers = studentStats.slice(0, 5);
  const bottomPerformers = studentStats.slice(-5).reverse();

  return (
    <div className="min-h-screen bg-transparent py-8 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1600px] mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ChartBarIcon className="w-8 h-8 text-indigo-600" />
            Báo Cáo Điểm Danh
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Xem phân tích, xu hướng và chi tiết điểm danh
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bộ lọc</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Class Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lớp học</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tất cả lớp</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khoảng thời gian
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="today">Hôm nay</option>
                <option value="week">7 ngày qua</option>
                <option value="month">30 ngày qua</option>
                <option value="term">3 tháng qua</option>
                <option value="custom">Tùy chọn</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tất cả</option>
                <option value="present">Có mặt</option>
                <option value="absent">Vắng</option>
              </select>
            </div>

            {/* View Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chế độ xem</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'overview' | 'details')}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="overview">Tổng quan</option>
                <option value="details">Chi tiết</option>
              </select>
            </div>
          </div>

          {/* Date Shortcuts */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-xs font-medium text-gray-500 self-center mr-1">Nhanh:</span>
            <button
              onClick={() => setQuickRange('today')}
              className={`px-3 py-1 text-xs rounded-full border ${dateRange === 'today' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setQuickRange('week')}
              className={`px-3 py-1 text-xs rounded-full border ${dateRange === 'week' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
            >
              7 ngày qua
            </button>
            <button
              onClick={() => setQuickRange('month')}
              className={`px-3 py-1 text-xs rounded-full border ${dateRange === 'month' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
            >
              30 ngày qua
            </button>
          </div>

          {/* Export Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleExport}
              disabled={exporting || records.length === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {exporting ? 'Đang xuất...' : '📥 Xuất CSV'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải báo cáo...</p>
          </div>
        ) : (
          <>
            {viewMode === 'overview' && analytics && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-indigo-700">Tổng số bản ghi</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {analytics.totalRecords}
                        </p>
                      </div>
                      <ChartBarIcon className="w-10 h-10 text-indigo-400" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-green-700">Tỉ lệ điểm danh</p>
                        <p
                          className={`text-3xl font-bold mt-2 ${getRateColor(analytics.attendanceRate)}`}
                        >
                          {analytics.attendanceRate}%
                        </p>
                      </div>
                      <ArrowTrendingUpIcon className="w-10 h-10 text-green-400" />
                    </div>
                    {/* Progress indicator */}
                    <div className="relative h-2 bg-green-100 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-1000"
                        style={{ width: `${analytics.attendanceRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl shadow-sm p-6 col-span-2">
                    <div className="flex items-center justify-around">
                      <div className="text-center">
                        <p className="text-sm font-medium text-green-700">Có mặt</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                          {analytics.totalPresent}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-red-700">Vắng mặt</p>
                        <p className="text-3xl font-bold text-red-600 mt-2">
                          {analytics.totalAbsent}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Phân Loại Trạng Thái</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <p className="text-sm text-gray-600">Có mặt</p>
                      <p className="text-2xl font-bold text-green-600">{analytics.totalPresent}</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-xl">
                      <p className="text-sm text-gray-600">Vắng</p>
                      <p className="text-2xl font-bold text-red-600">{analytics.totalAbsent}</p>
                    </div>
                  </div>
                </div>

                {/* Attendance Status Pie Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Biểu Đồ Trạng Thái</h2>
                    <div className="h-64" style={{ minHeight: '256px' }}>
                      <ResponsiveContainer width="100%" height={256}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Có mặt', value: analytics.totalPresent, color: '#22c55e' },
                              { name: 'Vắng', value: analytics.totalAbsent, color: '#ef4444' },
                            ].filter((d) => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${name} ${((percent || 0) * 100).toFixed(0)}%`
                            }
                          >
                            {[
                              { name: 'Có mặt', value: analytics.totalPresent, color: '#22c55e' },
                              { name: 'Vắng', value: analytics.totalAbsent, color: '#ef4444' },
                            ]
                              .filter((d) => d.value > 0)
                              .map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => [value, 'Số lượng']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Class Comparison Bar Chart */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Tỉ Lệ Theo Lớp</h2>
                    <div className="h-64" style={{ minHeight: '256px' }}>
                      <ResponsiveContainer width="100%" height={256}>
                        <BarChart
                          data={Object.values(analytics.byClass)
                            .slice(0, 6)
                            .map((c: any) => ({
                              name: c.name.length > 10 ? c.name.substring(0, 10) + '...' : c.name,
                              rate: c.rate,
                              present: c.present,
                            }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                            }}
                            formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Tỉ lệ']}
                          />
                          <Bar
                            dataKey="rate"
                            fill="#6366f1"
                            radius={[4, 4, 0, 0]}
                            name="Tỉ lệ điểm danh"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Class Performance */}
                {Object.keys(analytics.byClass).length > 0 && (
                  <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm p-4 sm:p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Thống Kê Theo Lớp
                    </h2>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3 mobile-card-list animate-fade-in">
                      {Object.entries(analytics.byClass)
                        .sort((a: any, b: any) => b[1].rate - a[1].rate)
                        .map(([classId, stats]: [string, any]) => (
                          <div
                            key={classId}
                            className="bg-white dark:bg-[#1A1410] rounded-2xl p-5 border border-stone-100 dark:border-[#2C2420] shadow-sm press-effect"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <p className="font-bold text-stone-900 dark:text-stone-100 text-lg">
                                {stats.name}
                              </p>
                              <div className="text-right">
                                <span className={`text-xl font-black ${getRateColor(stats.rate)}`}>
                                  {stats.rate}%
                                </span>
                                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest leading-none">
                                  Tỉ lệ
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-6 pt-3 border-t border-stone-50 dark:border-white/5">
                              <div>
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">
                                  Tổng số
                                </p>
                                <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                                  {stats.count}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">
                                  Có mặt
                                </p>
                                <p className="text-sm font-bold text-green-600">{stats.present}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto table-scroll-container">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-stone-700">
                        <thead className="bg-gray-50 dark:bg-stone-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Lớp
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Tổng số
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Có mặt
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Tỉ lệ
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-stone-900 divide-y divide-gray-200 dark:divide-stone-700">
                          {Object.entries(analytics.byClass)
                            .sort((a: any, b: any) => b[1].rate - a[1].rate)
                            .map(([classId, stats]: [string, any]) => (
                              <tr
                                key={classId}
                                className="hover:bg-gray-50 dark:hover:bg-stone-800/50 transition-colors"
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {stats.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {stats.count}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {stats.present}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className={`font-semibold ${getRateColor(stats.rate)}`}>
                                    {stats.rate}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Student Performance */}
                {studentStats.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Performers */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        🏆 Điểm Danh Tốt Nhất
                      </h2>
                      <div className="space-y-3">
                        {topPerformers.map((student: any, index: number) => (
                          <div
                            key={`top-${student.studentId || index}-${student.name}`}
                            className="flex items-center justify-between p-3 bg-white rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
                              <div>
                                <p className="font-medium text-gray-900">{student.name}</p>
                                <p className="text-xs text-gray-600">{student.studentId}</p>
                              </div>
                            </div>
                            <span className={`text-lg font-bold ${getRateColor(student.rate)}`}>
                              {student.rate}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Performers */}
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl shadow-sm p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Cần Chú Ý</h2>
                      <div className="space-y-3">
                        {bottomPerformers.map((student: any, index: number) => (
                          <div
                            key={`bottom-${student.studentId || index}-${student.name}`}
                            className="flex items-center justify-between p-3 bg-white rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{student.name}</p>
                              <p className="text-xs text-gray-600">{student.studentId}</p>
                            </div>
                            <span className={`text-lg font-bold ${getRateColor(student.rate)}`}>
                              {student.rate}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {viewMode === 'details' && (
              <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-stone-700 flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Chi Tiết Bản Ghi ({records.length})
                  </h2>
                  <div className="relative w-full md:w-64">
                    <input
                      type="text"
                      placeholder="Tìm tên học sinh..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-stone-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-stone-800"
                    />
                    <svg
                      className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden p-4 space-y-3 mobile-card-list animate-fade-in pb-20">
                  {records.filter((r) =>
                    (r.student?.full_name || r.student?.email || '')
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  ).length === 0 ? (
                    <div className="text-center py-12 text-stone-500 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                      Không tìm thấy bản ghi nào khớp với tìm kiếm
                    </div>
                  ) : (
                    records
                      .filter((r) =>
                        (r.student?.full_name || r.student?.email || '')
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                      )
                      .map((record) => (
                        <div
                          key={record.id}
                          className="bg-white dark:bg-[#1A1410] rounded-2xl p-5 border border-stone-100 dark:border-[#2C2420] shadow-sm press-effect relative overflow-hidden"
                        >
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-1 ${record.status === 'present' ? 'bg-green-500' : 'bg-red-500'}`}
                          />

                          {/* Header with status */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-stone-900 dark:text-stone-100 text-lg leading-tight truncate">
                                {record.student?.full_name || record.student?.email}
                              </p>
                              <p className="text-xs text-stone-500 dark:text-stone-400 font-mono mt-1">
                                {record.student?.student_code || record.student?.id || 'ID-XXXX'}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${getStatusColor(record.status)}`}
                            >
                              {record.status === 'present' ? 'Có mặt' : 'Vắng'}
                            </span>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-stone-50 dark:border-white/5">
                            <div>
                              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">
                                Ngày
                              </p>
                              <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                                {record.date ? format(parseISO(record.date), 'dd/MM/yyyy') : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">
                                Lớp
                              </p>
                              <p className="text-sm font-bold text-stone-700 dark:text-stone-300 truncate">
                                {record.class?.name || record.class?.code || 'N/A'}
                              </p>
                            </div>
                          </div>

                          {record.remarks && (
                            <div className="mt-3 p-3 bg-stone-50 dark:bg-white/5 rounded-xl">
                              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">
                                Ghi chú
                              </p>
                              <p className="text-xs text-stone-600 dark:text-stone-400 italic">
                                "{record.remarks}"
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto table-scroll-container">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-stone-700">
                    <thead className="bg-gray-50 dark:bg-stone-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Ngày
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Học sinh
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Lớp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Ghi chú
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-stone-900 divide-y divide-gray-200 dark:divide-stone-700">
                      {records
                        .filter((r) =>
                          (r.student?.full_name || r.student?.email || '')
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                        )
                        .map((record) => (
                          <tr
                            key={record.id}
                            className="hover:bg-gray-50 dark:hover:bg-stone-800/50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {record.date ? format(parseISO(record.date), 'dd/MM/yyyy') : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {record.student?.full_name || record.student?.email}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {record.student?.student_code || record.student?.id}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {record.class?.name || record.class?.code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}
                              >
                                {record.status === 'present' ? 'CÓ MẶT' : 'VẮNG'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                              {record.remarks || '-'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {records.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      Không tìm thấy bản ghi nào với bộ lọc đã chọn
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
