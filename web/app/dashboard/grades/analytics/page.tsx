'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { Icons } from '@/components/ui/Icons';
import { useTranslation } from '@/contexts/I18nContext';

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
  id: string; // gioi, kha, tb, yeu
  grade: string; // Translated label
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

// Chart color palette refined for Stone/Emerald/Amber
const CHART_COLORS = {
  bands: {
    gioi: '#10b981', // Emerald-500
    kha: '#84cc16', // Lime-500
    tb: '#f59e0b', // Amber-500
    yeu: '#ef4444', // Red-500
  },
  pieColors: ['#10b981', '#84cc16', '#f59e0b', '#f97316', '#78716c', '#44403c'],
  primary: '#10b981', // Emerald-500
  accent: '#f59e0b', // Amber-500
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  base: '#78716c',
};

const safeParseJson = async (r: Response) => {
  try {
    return await r.json();
  } catch {
    return { error: r.statusText || `HTTP ${r.status}` };
  }
};

export default function GradeAnalyticsPage() {
  const { t } = useTranslation();
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

    const percentages = grades
      .map((g) => g.overall_percentage)
      .filter((p) => p !== null && typeof p === 'number' && !isNaN(p));
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

  // Calculate grade distribution using Vietnamese 10-point scale bands
  const getGradeDistribution = (): GradeDistribution[] => {
    if (grades.length === 0) return [];

    const distribution: {
      gioi: { count: number; label: string };
      kha: { count: number; label: string };
      tb: { count: number; label: string };
      yeu: { count: number; label: string };
    } = {
      gioi: { count: 0, label: t('analytics.bands.gioi') },
      kha: { count: 0, label: t('analytics.bands.kha') },
      tb: { count: 0, label: t('analytics.bands.tb') },
      yeu: { count: 0, label: t('analytics.bands.yeu') },
    };

    let totalGraded = 0;
    grades.forEach((g) => {
      const score = g.overall_percentage;
      if (score === null || typeof score !== 'number' || isNaN(score)) return;

      totalGraded++;
      if (score >= 80) distribution.gioi.count++;
      else if (score >= 65) distribution.kha.count++;
      else if (score >= 50) distribution.tb.count++;
      else distribution.yeu.count++;
    });

    return Object.entries(distribution).map(([id, data]) => ({
      id,
      grade: data.label,
      count: data.count,
      percentage: totalGraded > 0 ? (data.count / totalGraded) * 100 : 0,
    }));
  };

  // Calculate category statistics
  const getCategoryStats = (): CategoryStats[] => {
    if (grades.length === 0) return [];

    const categoryData: Record<string, number[]> = {};

    grades.forEach((student) => {
      student.category_grades.forEach((cat) => {
        if (cat.percentage !== null && typeof cat.percentage === 'number' && !isNaN(cat.percentage)) {
          if (!categoryData[cat.category_name]) {
            categoryData[cat.category_name] = [];
          }
          categoryData[cat.category_name]?.push(cat.percentage);
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
      .filter((g) => g.overall_percentage !== null && typeof g.overall_percentage === 'number' && !isNaN(g.overall_percentage) && g.overall_percentage < 70)
      .sort((a, b) => a.overall_percentage - b.overall_percentage);
  };

  // Identify top performers
  const getTopPerformers = () => {
    return grades
      .filter((g) => g.overall_percentage !== null && typeof g.overall_percentage === 'number' && !isNaN(g.overall_percentage) && g.overall_percentage >= 90)
      .sort((a, b) => b.overall_percentage - a.overall_percentage);
  };

  const classStats = getClassStats();
  const gradeDistribution = getGradeDistribution();
  const categoryStats = getCategoryStats();
  const strugglingStudents = getStrugglingStudents();
  const topPerformers = getTopPerformers();
  const selectedClassData = classes.find((c) => c.id === selectedClass);

  return (
    <PageErrorBoundary pageName={t('analytics.title')}>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-8 bg-emerald-500 rounded-full" />
              <h1 className="text-2xl md:text-3xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                {t('analytics.title')}
              </h1>
            </div>
            <p className="text-stone-500 font-medium pl-4 uppercase tracking-[0.2em] text-[10px]">
              {t('analytics.description')}
            </p>
          </div>
        </div>

        {/* Class Selector - Premium Glass UI */}
        <div className="bg-white/60 dark:bg-stone-900/40 backdrop-blur-xl rounded-[32px] p-6 border border-stone-200 dark:border-white/10 shadow-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />

          <label className="block text-xs font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] mb-4">
            {t('analytics.selectClass')}
          </label>
          <div className="relative max-w-md">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-6 py-4 bg-white/80 dark:bg-stone-900/80 border border-stone-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-stone-900 dark:text-white appearance-none pr-12 font-bold"
            >
              <option value="">-- {t('analytics.allClasses')} --</option>
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
                title={t('analytics.emptyStats')}
                description={t('analytics.noGradesDesc', { className: selectedClassData.name })}
                icon={<Icons.Assignments className="w-12 h-12" />}
              />
            ) : (
              <>
                {/* Class Statistics Cards */}
                {classStats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white/60 dark:bg-stone-900/40 backdrop-blur-xl rounded-3xl p-6 border border-stone-200 dark:border-white/5 shadow-lg group hover:border-emerald-500/50 transition-all">
                      <div className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">
                        {t('analytics.classAverage')}
                      </div>
                      <div
                        className={`text-4xl font-black ${getLetterGradeColor(percentageToLetterGrade(classStats.average))}`}
                      >
                        {classStats.average.toFixed(1)}%
                      </div>
                      <div className="text-xs font-bold text-stone-500 mt-2 uppercase">
                        {percentageToLetterGrade(classStats.average)}
                      </div>
                    </div>

                    <div className="bg-white/60 dark:bg-stone-900/40 backdrop-blur-xl rounded-3xl p-6 border border-stone-200 dark:border-white/5 shadow-lg group hover:border-emerald-500/50 transition-all">
                      <div className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">
                        {t('analytics.highestGrade')}
                      </div>
                      <div className="text-4xl font-black text-emerald-500">
                        {classStats.highest.toFixed(1)}%
                      </div>
                      <div className="text-xs font-bold text-stone-500 mt-2 uppercase">
                        {percentageToLetterGrade(classStats.highest)}
                      </div>
                    </div>

                    <div className="bg-white/60 dark:bg-stone-900/40 backdrop-blur-xl rounded-3xl p-6 border border-stone-200 dark:border-white/5 shadow-lg group hover:border-amber-500/50 transition-all">
                      <div className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">
                        {t('analytics.lowestGrade')}
                      </div>
                      <div className="text-4xl font-black text-amber-500">
                        {classStats.lowest.toFixed(1)}%
                      </div>
                      <div className="text-xs font-bold text-stone-500 mt-2 uppercase">
                        {percentageToLetterGrade(classStats.lowest)}
                      </div>
                    </div>

                    <div className="bg-white/60 dark:bg-stone-900/40 backdrop-blur-xl rounded-3xl p-6 border border-stone-200 dark:border-white/5 shadow-lg group hover:border-stone-500/50 transition-all">
                      <div className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">
                        {t('analytics.medianGrade')}
                      </div>
                      <div className={`text-4xl font-black text-stone-600 dark:text-stone-300`}>
                        {classStats.median.toFixed(1)}%
                      </div>
                      <div className="text-xs font-bold text-stone-500 mt-2 uppercase">
                        {percentageToLetterGrade(classStats.median)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Grade Distribution - Modern List */}
                <div className="bg-stone-50/50 dark:bg-stone-900/20 rounded-[32px] border border-stone-200 dark:border-white/5 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                      {t('analytics.distribution')}
                    </h2>
                  </div>

                  <div className="grid gap-6">
                    {gradeDistribution
                      .filter((d) => d.count > 0)
                      .map((dist) => (
                        <div key={dist.grade} className="group">
                          <div className="flex justify-between items-end mb-3">
                            <span className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-widest">
                              {dist.grade}
                            </span>
                            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">
                              {t('analytics.studentCount', { count: dist.count })} (
                              {dist.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-3 overflow-hidden p-0.5">
                            <div
                              className="h-full rounded-full transition-all duration-1000 ease-out"
                              style={{
                                width: `${dist.percentage}%`,
                                backgroundColor:
                                  CHART_COLORS.bands[dist.id as keyof typeof CHART_COLORS.bands] ||
                                  '#78716c',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Area Chart - Emerald Theme */}
                <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl rounded-[32px] border border-stone-200 dark:border-white/5 p-8">
                  <div className="mb-8 text-center sm:text-left">
                    <h2 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight mb-2">
                      {t('analytics.semesterOverview')}
                    </h2>
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                      {t('analytics.semesterOverviewDesc')}
                    </p>
                  </div>

                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={
                          classStats
                            ? [
                                {
                                  name: t('analytics.semesterOverview'),
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
                          <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 700, fill: '#78716c' }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 700, fill: '#78716c' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            borderRadius: '16px',
                            border: 'none',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                          }}
                          itemStyle={{
                            fontSize: '12px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="average"
                          stroke="#10b981"
                          strokeWidth={4}
                          fillOpacity={1}
                          fill="url(#colorAvg)"
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Pie Chart */}
                  <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl rounded-[32px] border border-stone-200 dark:border-white/5 p-8">
                    <h2 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight mb-8">
                      {t('analytics.distributionPie')}
                    </h2>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={gradeDistribution.filter((d) => d.count > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="count"
                            nameKey="grade"
                            animationDuration={1500}
                          >
                            {gradeDistribution
                              .filter((d) => d.count > 0)
                              .map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    CHART_COLORS.bands[
                                      entry.id as keyof typeof CHART_COLORS.bands
                                    ] || CHART_COLORS.pieColors[index % 6]
                                  }
                                  stroke="transparent"
                                />
                              ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              borderRadius: '16px',
                              border: 'none',
                              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl rounded-[32px] border border-stone-200 dark:border-white/5 p-8">
                    <h2 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight mb-8">
                      {t('analytics.distributionBar')}
                    </h2>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={gradeDistribution.filter((d) => d.count > 0)}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <XAxis
                            dataKey="grade"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#78716c' }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#78716c' }}
                          />
                          <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '16px', border: 'none' }}
                          />
                          <Bar dataKey="count" radius={[12, 12, 0, 0]} animationDuration={1500}>
                            {gradeDistribution
                              .filter((d) => d.count > 0)
                              .map((entry, index) => (
                                <Cell
                                  key={`bar-${index}`}
                                  fill={
                                    CHART_COLORS.bands[
                                      entry.id as keyof typeof CHART_COLORS.bands
                                    ] || '#10b981'
                                  }
                                />
                              ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Category Performance */}
                {categoryStats.length > 0 && (
                  <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl rounded-[32px] border border-stone-200 dark:border-white/5 p-8">
                    <h2 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight mb-8">
                      {t('analytics.categoryPerformance')}
                    </h2>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-stone-100 dark:border-white/5">
                          <tr>
                            <th className="pb-4 text-left text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
                              {t('grades.component')}
                            </th>
                            <th className="pb-4 text-center text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
                              {t('analytics.median')}
                            </th>
                            <th className="pb-4 text-center text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
                              {t('analytics.highest')}
                            </th>
                            <th className="pb-4 text-center text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
                              {t('analytics.lowest')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50 dark:divide-white/5">
                          {categoryStats.map((cat, idx) => (
                            <tr
                              key={idx}
                              className="group hover:bg-stone-50/50 dark:hover:bg-white/5 transition-colors"
                            >
                              <td className="py-4 font-bold text-stone-900 dark:text-white uppercase text-xs tracking-widest">
                                {cat.category_name}
                              </td>
                              <td className="py-4 text-center text-sm font-black text-stone-600 dark:text-stone-400">
                                {cat.median.toFixed(1)}%
                              </td>
                              <td className="py-4 text-center text-sm font-black text-emerald-500">
                                {cat.highest.toFixed(1)}%
                              </td>
                              <td className="py-4 text-center text-sm font-black text-amber-500">
                                {cat.lowest.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Struggling & Top Performers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-stone-50/50 dark:bg-stone-900/20 rounded-[32px] border border-stone-200 dark:border-white/5 p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-amber-500/10 rounded-xl">
                        <ExclamationTriangleIcon className="w-6 h-6 text-amber-500" />
                      </div>
                      <h2 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                        {t('analytics.strugglingStudents')}
                      </h2>
                    </div>
                    <div className="space-y-4">
                      {strugglingStudents.slice(0, 5).map((student) => (
                        <Link
                          key={student.student_id}
                          href={`/dashboard/grades/transcripts?student_id=${student.student_id}&class_id=${selectedClass}`}
                          className="flex items-center justify-between p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-white/5 shadow-sm hover:border-amber-500/50 transition-all group/item"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 flex items-center justify-center bg-amber-500/10 rounded-full text-[10px] font-black text-amber-600 uppercase tracking-widest">
                              {student.student_number?.slice(-2)}
                            </span>
                            <div>
                              <div className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-widest group-hover/item:text-amber-600 transition-colors">
                                {student.student_name}
                              </div>
                              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-none mt-1">
                                {student.student_number}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm font-black text-amber-600">
                                {student.overall_percentage.toFixed(1)}%
                              </div>
                              <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                                {student.letter_grade}
                              </div>
                            </div>
                            <Icons.ChevronRight className="w-4 h-4 text-stone-300 group-hover/item:translate-x-1 transition-all" />
                          </div>
                        </Link>
                      ))}
                      {strugglingStudents.length > 5 && (
                        <div className="text-center pt-2">
                          <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
                            {t('analytics.moreStudents', { count: strugglingStudents.length - 5 })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-emerald-500 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-500/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-lg border border-white/20">
                          <SparklesIcon className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-tight">
                          {t('analytics.topPerformers')}
                        </h2>
                      </div>

                      <div className="space-y-4">
                        {topPerformers.slice(0, 5).map((student) => (
                          <Link
                            key={student.student_id}
                            href={`/dashboard/grades/transcripts?student_id=${student.student_id}&class_id=${selectedClass}`}
                            className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/20 transition-all group/item"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                                A+
                              </span>
                              <div>
                                <div className="text-xs font-black uppercase tracking-widest">
                                  {student.student_name}
                                </div>
                                <div className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">
                                  {student.student_number}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-sm font-black">
                                  {student.overall_percentage.toFixed(1)}%
                                </div>
                                <div className="text-[10px] font-black opacity-60 uppercase tracking-widest">
                                  {student.letter_grade}
                                </div>
                              </div>
                              <Icons.ChevronRight className="w-4 h-4 text-white/40 group-hover/item:translate-x-1 transition-all" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </PageErrorBoundary>
  );
}
