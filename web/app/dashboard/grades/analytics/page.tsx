'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import { percentageToLetterGrade, getLetterGradeColor } from '@/lib/gradeService';
import {
  ExclamationTriangleIcon,
  SparklesIcon,
  ChartBarSquareIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { PageErrorBoundary } from '@/components/ErrorBoundary';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonStatCard } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';

interface Class {
  id: string;
  name: string;
  code: string;
}

interface CategoryGrade {
  category_id: string;
  category_name: string;
  percentage: number;
  letter_grade: string;
}

interface StudentGrade {
  student_id: string;
  student_name: string;
  student_number: string;
  overall_percentage: number;
  letter_grade: string;
  category_grades: CategoryGrade[];
}

interface GradeDistribution {
  grade: string;
  count: number;
  percentage: number;
  [key: string]: any;
}

interface CategoryStats {
  category_name: string;
  average: number;
  highest: number;
  lowest: number;
  median: number;
}

// Year-over-year trend data type
interface YearTrendData {
  year: string;
  average: number;
  highest: number;
  lowest: number;
}

// Chart color palette for beautiful gradients
const CHART_COLORS = {
  grades: ['#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444', '#dc2626'],
  pieColors: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'],
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
};

export default function GradeAnalyticsPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadGrades();
    } else {
      setGrades([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      const response = await apiFetch('/api/classes/my-classes');
      const safeParseJson = async (r: Response) => {
        try {
          return await r.json();
        } catch {
          return { error: r.statusText || `HTTP ${r.status}` };
        }
      };

      if (!response.ok) {
        const err = await safeParseJson(response);
        console.error('Failed to load classes:', err);
        return;
      }

      const data = await safeParseJson(response);
      setClasses(data.data || data.classes || data);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadGrades = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/grades/student-overview?classId=${selectedClass}`);
      const safeParseJson = async (r: Response) => {
        try {
          return await r.json();
        } catch {
          return { error: r.statusText || `HTTP ${r.status}` };
        }
      };

      if (!response.ok) {
        const err = await safeParseJson(response);
        console.error('Failed to load grades:', err);
        setGrades([]);
        return;
      }

      const data = await safeParseJson(response);
      setGrades(data.data || data.student_grades || data.grades || data);
    } catch (error) {
      console.error('Failed to load grades:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate class statistics
  const getClassStats = () => {
    if (grades.length === 0) return null;

    const percentages = grades.map((g) => g.overall_percentage).filter((p) => !isNaN(p));
    if (percentages.length === 0) return null;

    const average = percentages.reduce((a, b) => a + b, 0) / percentages.length;
    const highest = Math.max(...percentages);
    const lowest = Math.min(...percentages);
    const sorted = [...percentages].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 0
        ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
        : (sorted[mid] ?? 0);

    return { average, highest, lowest, median, total: percentages.length };
  };

  // Calculate grade distribution
  const getGradeDistribution = (): GradeDistribution[] => {
    if (grades.length === 0) return [];

    const distribution: Record<string, number> = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      F: 0,
    };

    grades.forEach((g) => {
      if (g.letter_grade) {
        const current = distribution[g.letter_grade];
        if (current !== undefined) {
          distribution[g.letter_grade] = current + 1;
        }
      }
    });

    return Object.entries(distribution).map(([grade, count]) => ({
      grade,
      count,
      percentage: grades.length > 0 ? (count / grades.length) * 100 : 0,
    }));
  };

  // Calculate category statistics
  const getCategoryStats = (): CategoryStats[] => {
    if (grades.length === 0) return [];

    const categoryData: Record<string, number[]> = {};

    grades.forEach((student) => {
      student.category_grades.forEach((cat) => {
        if (!categoryData[cat.category_name]) {
          categoryData[cat.category_name] = [];
        }
        const data = categoryData[cat.category_name];
        if (data && !isNaN(cat.percentage)) {
          data.push(cat.percentage);
        }
      });
    });

    return Object.entries(categoryData).map(([category_name, percentages]) => {
      if (percentages.length === 0) {
        return { category_name, average: 0, highest: 0, lowest: 0, median: 0 };
      }

      const average = percentages.reduce((a, b) => a + b, 0) / percentages.length;
      const highest = Math.max(...percentages);
      const lowest = Math.min(...percentages);
      const sorted = [...percentages].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median =
        sorted.length % 2 === 0
          ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
          : (sorted[mid] ?? 0);

      return { category_name, average, highest, lowest, median };
    });
  };

  // Identify struggling students
  const getStrugglingStudents = () => {
    return grades
      .filter((g) => g.overall_percentage < 70)
      .sort((a, b) => a.overall_percentage - b.overall_percentage);
  };

  // Identify top performers
  const getTopPerformers = () => {
    return grades
      .filter((g) => g.overall_percentage >= 90)
      .sort((a, b) => b.overall_percentage - a.overall_percentage);
  };

  const classStats = getClassStats();
  const gradeDistribution = getGradeDistribution();
  const categoryStats = getCategoryStats();
  const strugglingStudents = getStrugglingStudents();
  const topPerformers = getTopPerformers();
  const selectedClassData = classes.find((c) => c.id === selectedClass);

  return (
    <PageErrorBoundary pageName="Phân tích điểm số">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
              <h1 className="text-2xl md:text-3xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                Phân Tích Điểm Số
              </h1>
            </div>
            <p className="text-stone-500 font-medium pl-4 uppercase tracking-[0.2em] text-[10px]">
              Thống kê và xu hướng học tập
            </p>
          </div>
        </div>

        {/* Class Selector - Premium Glass UI */}
        <div className="bg-white/60 dark:bg-stone-900/40 backdrop-blur-xl rounded-[32px] p-6 border border-stone-200 dark:border-white/10 shadow-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />

          <label className="block text-xs font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] mb-4">
            Chọn lớp học để phân tích
          </label>
          <div className="relative max-w-md">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-6 py-4 bg-white/80 dark:bg-stone-900/80 border border-stone-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-stone-900 dark:text-white appearance-none pr-12 font-bold"
            >
              <option value="">-- Tất cả các lớp --</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.code})
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
              <Icons.ChevronDown className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Analytics Content */}
        {selectedClass && selectedClassData && (
          <div className="space-y-8">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SkeletonStatCard />
                <SkeletonStatCard />
                <SkeletonStatCard />
                <SkeletonStatCard />
              </div>
            ) : grades.length === 0 ? (
              <EmptyState
                title="Chưa có dữ liệu điểm"
                description={`Lớp ${selectedClassData.name} hiện chưa được ghi điểm nào cho học kỳ này.`}
                icon={<Icons.Assignments className="w-12 h-12" />}
              />
            ) : (
              <>
                {/* Class Statistics Cards */}
                {classStats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-sm border border-indigo-100 p-6 hover:shadow-md transition-shadow">
                      <div className="text-sm font-medium text-indigo-700 mb-2">Điểm TB Lớp</div>
                      <div
                        className={`text-3xl font-bold ${getLetterGradeColor(percentageToLetterGrade(classStats.average))}`}
                      >
                        {classStats.average.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {percentageToLetterGrade(classStats.average)}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-100 p-6 hover:shadow-md transition-shadow">
                      <div className="text-sm font-medium text-green-700 mb-2">Điểm Cao Nhất</div>
                      <div className="text-3xl font-bold text-green-600">
                        {classStats.highest.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {percentageToLetterGrade(classStats.highest)}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl shadow-sm border border-red-100 p-6 hover:shadow-md transition-shadow">
                      <div className="text-sm font-medium text-red-700 mb-2">Điểm Thấp Nhất</div>
                      <div className="text-3xl font-bold text-red-600">
                        {classStats.lowest.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {percentageToLetterGrade(classStats.lowest)}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl shadow-sm border border-purple-100 p-6 hover:shadow-md transition-shadow">
                      <div className="text-sm font-medium text-purple-700 mb-2">Điểm Trung Vị</div>
                      <div
                        className={`text-3xl font-bold ${getLetterGradeColor(percentageToLetterGrade(classStats.median))}`}
                      >
                        {classStats.median.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {percentageToLetterGrade(classStats.median)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Grade Distribution Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Phân Bố Điểm</h2>
                  <div className="space-y-3">
                    {gradeDistribution
                      .filter((d) => d.count > 0)
                      .map((dist) => (
                        <div key={dist.grade}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className={`font-semibold ${getLetterGradeColor(dist.grade)}`}>
                              {dist.grade}
                            </span>
                            <span className="text-gray-600">
                              {dist.count} học sinh ({dist.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                dist.grade.startsWith('A')
                                  ? 'bg-green-500'
                                  : dist.grade.startsWith('B')
                                    ? 'bg-green-400'
                                    : dist.grade.startsWith('C')
                                      ? 'bg-yellow-500'
                                      : dist.grade.startsWith('D')
                                        ? 'bg-orange-500'
                                        : 'bg-red-500'
                              }`}
                              style={{ width: `${dist.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Year-over-Year Trend Chart - Enhanced with Area + Line */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6 hover:shadow-xl transition-shadow duration-300">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    📈 Xu Hướng Điểm Theo Năm
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    So sánh điểm trung bình qua các năm học
                  </p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={
                          classStats
                            ? [
                                {
                                  year: 'Học kỳ hiện tại',
                                  average: classStats.average,
                                  highest: classStats.highest,
                                  lowest: classStats.lowest,
                                },
                              ]
                            : []
                        }
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="colorHighest" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                          }}
                          formatter={(value: any) => [`${Number(value).toFixed(1)}%`, '']}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Area
                          type="monotone"
                          dataKey="highest"
                          stroke="#22c55e"
                          fillOpacity={1}
                          fill="url(#colorHighest)"
                          name="Cao nhất"
                          animationBegin={0}
                          animationDuration={1500}
                          animationEasing="ease-out"
                        />
                        <Area
                          type="monotone"
                          dataKey="average"
                          stroke="#6366f1"
                          fillOpacity={1}
                          fill="url(#colorAverage)"
                          name="Trung bình"
                          animationBegin={300}
                          animationDuration={1500}
                          animationEasing="ease-out"
                        />
                        <Line
                          type="monotone"
                          dataKey="lowest"
                          stroke="#ef4444"
                          strokeWidth={2}
                          name="Thấp nhất"
                          dot={{ r: 5, fill: '#ef4444' }}
                          strokeDasharray="5 5"
                          animationBegin={600}
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* NEW: Donut Pie Chart for Grade Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      🥧 Phân Bố Điểm (Biểu đồ tròn)
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">Tỷ lệ học sinh theo loại điểm</p>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={gradeDistribution.filter((d) => d.count > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="count"
                            nameKey="grade"
                            animationBegin={0}
                            animationDuration={1200}
                            animationEasing="ease-out"
                          >
                            {gradeDistribution
                              .filter((d) => d.count > 0)
                              .map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    entry.grade.startsWith('A')
                                      ? '#10b981'
                                      : entry.grade.startsWith('B')
                                        ? '#22c55e'
                                        : entry.grade.startsWith('C')
                                          ? '#eab308'
                                          : entry.grade.startsWith('D')
                                            ? '#f97316'
                                            : '#ef4444'
                                  }
                                  stroke="white"
                                  strokeWidth={2}
                                />
                              ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                            }}
                            formatter={(value: any, name: any) => [`${value} học sinh`, name]}
                          />
                          <Legend
                            layout="vertical"
                            verticalAlign="middle"
                            align="right"
                            iconType="circle"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Enhanced Bar Chart */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      📊 Biểu Đồ Cột Phân Bố
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">Số lượng học sinh theo điểm</p>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={gradeDistribution.filter((d) => d.count > 0)}
                          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                        >
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                          <XAxis
                            dataKey="grade"
                            tick={{ fill: '#6b7280', fontSize: 11 }}
                            axisLine={{ stroke: '#e5e7eb' }}
                          />
                          <YAxis
                            tick={{ fill: '#6b7280', fontSize: 11 }}
                            axisLine={{ stroke: '#e5e7eb' }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                            }}
                            cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                            formatter={(value: any) => [`${value} học sinh`, 'Số lượng']}
                          />
                          <Bar
                            dataKey="count"
                            fill="url(#barGradient)"
                            radius={[8, 8, 0, 0]}
                            name="Số học sinh"
                            animationBegin={200}
                            animationDuration={1200}
                            animationEasing="ease-out"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Category Performance */}
                {categoryStats.length > 0 && (
                  <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-gray-200 dark:border-stone-700 p-4 sm:p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Thống Kê Theo Loại Điểm
                    </h2>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3 mobile-card-list">
                      {categoryStats.map((cat, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-50 dark:bg-stone-800 rounded-xl p-4 border border-gray-200 dark:border-stone-700"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {cat.category_name}
                            </p>
                            <span
                              className={`text-lg font-bold ${getLetterGradeColor(percentageToLetterGrade(cat.average))}`}
                            >
                              {cat.average.toFixed(1)}%
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center text-sm">
                            <div className="bg-white dark:bg-stone-900 rounded-lg p-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Trung vị</p>
                              <p className="font-medium text-gray-800 dark:text-gray-200">
                                {cat.median.toFixed(1)}%
                              </p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-2">
                              <p className="text-xs text-green-600 dark:text-green-400">Cao nhất</p>
                              <p className="font-semibold text-green-600 dark:text-green-400">
                                {cat.highest.toFixed(1)}%
                              </p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-2">
                              <p className="text-xs text-red-600 dark:text-red-400">Thấp nhất</p>
                              <p className="font-semibold text-red-600 dark:text-red-400">
                                {cat.lowest.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto table-scroll-container">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-stone-800 border-b border-gray-200 dark:border-stone-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Loại điểm
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Trung bình
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Trung vị
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Cao nhất
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Thấp nhất
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-stone-700">
                          {categoryStats.map((cat, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-gray-50 dark:hover:bg-stone-800/50 transition-colors"
                            >
                              <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                                {cat.category_name}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`font-semibold ${getLetterGradeColor(percentageToLetterGrade(cat.average))}`}
                                >
                                  {cat.average.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">
                                {cat.median.toFixed(1)}%
                              </td>
                              <td className="px-4 py-3 text-center text-green-600 dark:text-green-400 font-semibold">
                                {cat.highest.toFixed(1)}%
                              </td>
                              <td className="px-4 py-3 text-center text-red-600 dark:text-red-400 font-semibold">
                                {cat.lowest.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Students Needing Attention */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Struggling Students */}
                  {strugglingStudents.length > 0 && (
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl shadow-sm border border-red-200 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
                        <h2 className="text-lg font-semibold text-red-900">Học Sinh Cần Hỗ Trợ</h2>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">Học sinh có điểm dưới 70%</p>
                      <div className="space-y-3">
                        {strugglingStudents.slice(0, 10).map((student) => (
                          <div
                            key={student.student_id}
                            className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100"
                          >
                            <div>
                              <div className="font-medium text-gray-900">
                                {student.student_name}
                              </div>
                              <div className="text-sm text-gray-600">
                                ID: {student.student_number}
                              </div>
                            </div>
                            <div className="text-right">
                              <div
                                className={`text-xl font-bold ${getLetterGradeColor(student.letter_grade)}`}
                              >
                                {student.letter_grade}
                              </div>
                              <div className="text-sm text-gray-600">
                                {student.overall_percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {strugglingStudents.length > 10 && (
                        <div className="mt-3 text-sm text-gray-500 text-center">
                          +{strugglingStudents.length - 10} more students
                        </div>
                      )}
                    </div>
                  )}

                  {/* Top Performers */}
                  {topPerformers.length > 0 && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <SparklesIcon className="w-6 h-6 text-green-500" />
                        <h2 className="text-lg font-semibold text-green-900">Học Sinh Xuất Sắc</h2>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">Học sinh có điểm từ 90% trở lên</p>
                      <div className="space-y-3">
                        {topPerformers.slice(0, 10).map((student) => (
                          <div
                            key={student.student_id}
                            className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100"
                          >
                            <div>
                              <div className="font-medium text-gray-900">
                                {student.student_name}
                              </div>
                              <div className="text-sm text-gray-600">
                                ID: {student.student_number}
                              </div>
                            </div>
                            <div className="text-right">
                              <div
                                className={`text-xl font-bold ${getLetterGradeColor(student.letter_grade)}`}
                              >
                                {student.letter_grade}
                              </div>
                              <div className="text-sm text-gray-600">
                                {student.overall_percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {topPerformers.length > 10 && (
                        <div className="mt-3 text-sm text-gray-500 text-center text-[10px] font-black uppercase tracking-widest text-stone-400">
                          +{topPerformers.length - 10} học sinh khác
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Initial Empty State */}
        {!selectedClass && (
          <EmptyState
            title="Bắt đầu phân tích"
            description="Vui lòng chọn một lớp học từ danh sách phía trên để xem thống kê hiệu suất học tập và biểu đồ xu hướng."
            actionLabel="Tải danh sách mới"
            onAction={loadClasses}
            icon={<Icons.Chart className="w-12 h-12" />}
            className="bg-white/40 dark:bg-stone-900/20 backdrop-blur-sm"
          />
        )}
      </div>
    </PageErrorBoundary>
  );
}
