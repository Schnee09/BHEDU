'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useToast } from '@/hooks/useToast';
import { AcademicBackground } from '@/components/Academic/AcademicBackground';
import {
  Calendar,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  RefreshCw,
  Layers,
  ArrowRight,
  CheckCircle,
  Tag,
  CalendarDays,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Semester {
  id: string;
  name: string;
  code: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  academic_year_id?: string;
}

interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_active?: boolean;
  terms?: Array<{ name: string; start_date: string; end_date: string }>;
}

export default function AcademicYearsAndSemestersPage() {
  const toast = useToast();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'hierarchical' | 'semesters'>('hierarchical');

  // Academic Year Modal
  const [showYearModal, setShowYearModal] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [yearSubmitting, setYearSubmitting] = useState(false);
  const [yearForm, setYearForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_current: false,
    is_active: true,
  });

  // Semester Modal
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [semesterSubmitting, setSemesterSubmitting] = useState(false);
  const [semesterForm, setSemesterForm] = useState({
    name: '',
    code: '',
    start_date: '',
    end_date: '',
    is_active: false,
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.allSettled([fetchYears(), fetchSemesters()]);
    setLoading(false);
  };

  const fetchYears = async () => {
    try {
      const response = await apiFetch('/api/admin/academic-years');
      const data = await response.json();
      setYears(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error fetching academic years:', error);
      toast.error('Lỗi', 'Không thể tải danh sách năm học');
    }
  };

  const fetchSemesters = async () => {
    try {
      const response = await apiFetch('/api/admin/semesters');
      const data = await response.json();
      setSemesters(data.semesters || (Array.isArray(data) ? data : data.data || []));
    } catch (error) {
      console.error('Error fetching semesters:', error);
      toast.error('Lỗi', 'Không thể tải danh sách học kỳ');
    }
  };

  // --- Year Actions ---
  const handleOpenAddYear = () => {
    const currentYear = new Date().getFullYear();
    setEditingYear(null);
    setYearForm({
      name: `${currentYear} - ${currentYear + 1}`,
      start_date: `${currentYear}-09-01`,
      end_date: `${currentYear + 1}-06-30`,
      is_current: false,
      is_active: true,
    });
    setShowYearModal(true);
  };

  const handleOpenEditYear = (year: AcademicYear) => {
    setEditingYear(year);
    setYearForm({
      name: year.name,
      start_date: (year.start_date ? year.start_date.split('T')[0] : '') ?? '',
      end_date: (year.end_date ? year.end_date.split('T')[0] : '') ?? '',
      is_current: !!year.is_current,
      is_active: year.is_active ?? true,
    });
    setShowYearModal(true);
  };

  const handleSaveYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearForm.name || !yearForm.start_date || !yearForm.end_date) return;

    setYearSubmitting(true);
    try {
      if (editingYear) {
        const response = await apiFetch(`/api/admin/academic-years/${editingYear.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(yearForm),
        });
        if (!response.ok) throw new Error('Failed to update');
        toast.success('Thành công', 'Đã cập nhật năm học');
      } else {
        const response = await apiFetch('/api/admin/academic-years', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(yearForm),
        });
        if (!response.ok) throw new Error('Failed to create');
        toast.success('Thành công', 'Đã tạo năm học mới');
      }

      setShowYearModal(false);
      fetchYears();
    } catch (error) {
      toast.error('Thất bại', 'Lỗi khi lưu năm học');
    } finally {
      setYearSubmitting(false);
    }
  };

  const handleDeleteYear = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa năm học "${name}"?`)) return;

    try {
      const response = await apiFetch(`/api/admin/academic-years/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      toast.success('Đã xóa', `Đã xóa năm học ${name}`);
      fetchYears();
    } catch (error) {
      toast.error('Lỗi', 'Không thể xóa năm học này');
    }
  };

  const handleSetCurrentYear = async (id: string, name: string) => {
    try {
      const response = await apiFetch(`/api/admin/academic-years/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_current: true }),
      });
      if (!response.ok) throw new Error('Failed to set current');
      toast.success('Thành công', `Đã đặt "${name}" làm năm học hiện tại`);
      fetchYears();
    } catch (error) {
      toast.error('Lỗi', 'Không thể đặt năm học hiện tại');
    }
  };

  // --- Semester Actions ---
  const handleOpenAddSemester = (defaultYear?: AcademicYear) => {
    const currentYear = defaultYear
      ? new Date(defaultYear.start_date).getFullYear()
      : new Date().getFullYear();
    setEditingSemester(null);
    setSemesterForm({
      name: 'Học kỳ 1 (HK1)',
      code: `HK1-${currentYear}`,
      start_date: `${currentYear}-09-01`,
      end_date: `${currentYear}-12-31`,
      is_active: false,
    });
    setShowSemesterModal(true);
  };

  const handleOpenEditSemester = (semester: Semester) => {
    setEditingSemester(semester);
    setSemesterForm({
      name: semester.name,
      code: semester.code,
      start_date: semester.start_date.split('T')[0] ?? '',
      end_date: semester.end_date.split('T')[0] ?? '',
      is_active: semester.is_active,
    });
    setShowSemesterModal(true);
  };

  const handleSaveSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(semesterForm.end_date) <= new Date(semesterForm.start_date)) {
      toast.error('Lỗi', 'Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }

    setSemesterSubmitting(true);
    try {
      const url = editingSemester
        ? `/api/admin/semesters/${editingSemester.id}`
        : '/api/admin/semesters';
      const method = editingSemester ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(semesterForm),
      });

      if (response.ok) {
        toast.success('Thành công', editingSemester ? 'Đã cập nhật học kỳ' : 'Đã thêm học kỳ mới');
        setShowSemesterModal(false);
        fetchSemesters();
      } else {
        const data = await response.json();
        toast.error('Lỗi', data.error || 'Thao tác thất bại');
      }
    } catch {
      toast.error('Lỗi', 'Đã xảy ra lỗi khi lưu học kỳ');
    } finally {
      setSemesterSubmitting(false);
    }
  };

  const handleSetActiveSemester = async (semesterId: string, name: string) => {
    try {
      const response = await apiFetch(`/api/admin/semesters/${semesterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true }),
      });
      if (response.ok) {
        toast.success('Thành công', `Đã kích hoạt "${name}"`);
        fetchSemesters();
      } else {
        toast.error('Lỗi', 'Không thể kích hoạt học kỳ');
      }
    } catch {
      toast.error('Lỗi', 'Đã xảy ra lỗi khi kích hoạt học kỳ');
    }
  };

  const handleDeleteSemester = async (semesterId: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa học kỳ "${name}"?`)) return;

    try {
      const response = await apiFetch(`/api/admin/semesters/${semesterId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('Thành công', `Đã xóa học kỳ "${name}"`);
        fetchSemesters();
      } else {
        toast.error('Lỗi', 'Không thể xóa học kỳ');
      }
    } catch {
      toast.error('Lỗi', 'Đã xảy ra lỗi khi xóa học kỳ');
    }
  };

  const calculateProgress = (startDateStr: string, endDateStr: string): number => {
    try {
      const start = new Date(startDateStr).getTime();
      const end = new Date(endDateStr).getTime();
      const now = Date.now();
      if (now <= start) return 0;
      if (now >= end) return 100;
      const total = end - start;
      const current = now - start;
      return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
    } catch {
      return 0;
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getSemesterStatus = (semester: Semester) => {
    const now = new Date();
    const start = new Date(semester.start_date);
    const end = new Date(semester.end_date);

    if (now < start)
      return { label: 'Sắp tới', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' };
    if (now > end)
      return { label: 'Đã kết thúc', color: 'bg-stone-100 dark:bg-white/5 text-stone-400' };
    return {
      label: 'Đang diễn ra',
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    };
  };

  const filteredYears = years.filter((y) =>
    y.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSemesters = semesters.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group semesters by year dates (or show all matching)
  const getSemestersForYear = (year: AcademicYear) => {
    const yearStart = new Date(year.start_date).getTime();
    const yearEnd = new Date(year.end_date).getTime();

    return semesters.filter((sem) => {
      const semStart = new Date(sem.start_date).getTime();
      return semStart >= yearStart - 30 * 86400000 && semStart <= yearEnd + 30 * 86400000;
    });
  };

  return (
    <div className="relative bg-transparent font-['Be_Vietnam_Pro'] text-stone-900 dark:text-stone-100 py-3 sm:py-6 px-2.5 sm:px-6 lg:px-8">
      <AcademicBackground />
      <div className="max-w-[1600px] mx-auto relative z-10 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-200 dark:border-stone-800 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              <Calendar className="w-4 h-4" />
              <span>CẤU HÌNH HỌC VỤ • ACADEMIC TIMELINES</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-stone-950 dark:text-white">
              Năm học & <span className="text-amber-500">Học kỳ</span>
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              Quản lý đồng bộ năm học và phân kỳ giai đoạn học tập cho toàn bộ trung tâm
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative group flex-1 md:flex-none">
              <input
                type="text"
                placeholder="Tìm năm học hoặc học kỳ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20 outline-none w-full md:w-64 shadow-sm"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            </div>

            <div className="flex bg-stone-100 dark:bg-white/5 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTab('hierarchical')}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5',
                  activeTab === 'hierarchical'
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm'
                    : 'text-stone-400 hover:text-stone-600'
                )}
              >
                <Layers className="w-3.5 h-3.5" /> Theo năm học
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('semesters')}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5',
                  activeTab === 'semesters'
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm'
                    : 'text-stone-400 hover:text-stone-600'
                )}
              >
                <CalendarDays className="w-3.5 h-3.5" /> Tất cả học kỳ ({semesters.length})
              </button>
            </div>

            <button
              onClick={() => handleOpenAddSemester()}
              className="h-11 px-4 bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-700 dark:text-stone-300 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" /> Thêm học kỳ
            </button>

            <button
              onClick={handleOpenAddYear}
              className="h-11 px-6 bg-stone-900 dark:bg-amber-600 hover:bg-stone-800 dark:hover:bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-lg flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" /> Thêm năm học
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-xs font-mono text-stone-400">Đang tải dữ liệu năm học & học kỳ...</p>
          </div>
        ) : activeTab === 'hierarchical' ? (
          /* Hierarchical View: Bento Cards for Years with Embedded Semesters */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {filteredYears.map((year) => {
              const progress = calculateProgress(year.start_date, year.end_date);
              const isCurrent = year.is_current;
              const yearSemesters = getSemestersForYear(year);

              return (
                <div
                  key={year.id}
                  className={cn(
                    'group p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between space-y-4 sm:space-y-6',
                    isCurrent
                      ? 'bg-white dark:bg-stone-900/90 border-amber-500/40 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20'
                      : 'bg-white dark:bg-stone-900/50 border-stone-200/80 dark:border-white/5 hover:border-stone-300 dark:hover:border-white/20 shadow-2xs'
                  )}
                >
                  <div className="space-y-4 sm:space-y-5">
                    {/* Top Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                            isCurrent
                              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                              : 'bg-stone-100 dark:bg-white/5 text-stone-500 group-hover:bg-amber-500/10 group-hover:text-amber-500'
                          )}
                        >
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg sm:text-xl font-black tracking-tight text-stone-950 dark:text-white truncate">
                            {year.name}
                          </h3>
                          <p className="text-xs text-stone-500 font-medium mt-0.5 flex items-center gap-1.5 truncate">
                            <Clock className="w-3.5 h-3.5 opacity-60 shrink-0" />
                            {formatDate(year.start_date)} &mdash; {formatDate(year.end_date)}
                          </p>
                        </div>
                      </div>

                      <div className="self-start sm:self-auto shrink-0">
                        {isCurrent ? (
                          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider rounded-full border border-amber-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Năm học hiện tại
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetCurrentYear(year.id, year.name)}
                            className="px-2.5 py-1 bg-stone-100 dark:bg-white/5 hover:bg-amber-500/10 hover:text-amber-500 text-stone-500 text-[10px] font-bold uppercase tracking-wider rounded-full transition-colors"
                          >
                            Đặt hiện tại
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 bg-stone-50 dark:bg-white/[0.02] p-3 sm:p-3.5 rounded-xl border border-stone-100 dark:border-white/5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-stone-600 dark:text-stone-300 flex items-center gap-1.5 text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          Tiến độ năm học
                        </span>
                        <span className="font-mono font-bold text-stone-900 dark:text-white text-xs">
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 sm:h-2 rounded-full bg-stone-200/60 dark:bg-white/10 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-1000',
                            isCurrent
                              ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                              : 'bg-stone-400 dark:bg-stone-600'
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Semesters belonging to this Year */}
                    <div className="space-y-2.5 pt-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10.5px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-amber-500" />
                          Học kỳ trực thuộc ({yearSemesters.length})
                        </span>
                        <button
                          onClick={() => handleOpenAddSemester(year)}
                          className="text-[10.5px] font-bold text-amber-500 hover:text-amber-600 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Thêm học kỳ
                        </button>
                      </div>

                      <div className="space-y-2">
                        {yearSemesters.map((sem) => {
                          return (
                            <div
                              key={sem.id}
                              className={cn(
                                'p-2.5 sm:p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all',
                                sem.is_active
                                  ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20'
                                  : 'bg-stone-50 dark:bg-white/[0.02] border-stone-100 dark:border-white/5'
                              )}
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white">
                                    {sem.name}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded-md bg-stone-200/60 dark:bg-white/10 font-mono text-[9.5px] font-bold text-stone-600 dark:text-stone-400">
                                    {sem.code}
                                  </span>
                                  {sem.is_active && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase">
                                      Đang kích hoạt
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10.5px] text-stone-400 font-medium">
                                  {formatDate(sem.start_date)} &mdash; {formatDate(sem.end_date)}
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                                {!sem.is_active && (
                                  <button
                                    onClick={() => handleSetActiveSemester(sem.id, sem.name)}
                                    className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-stone-200/80 dark:bg-white/10 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors"
                                  >
                                    Kích hoạt
                                  </button>
                                )}
                                <button
                                  onClick={() => handleOpenEditSemester(sem)}
                                  className="p-1 text-stone-400 hover:text-amber-500 rounded-lg hover:bg-stone-200/50 dark:hover:bg-white/10 transition-colors"
                                  title="Chỉnh sửa học kỳ"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                {!sem.is_active && (
                                  <button
                                    onClick={() => handleDeleteSemester(sem.id, sem.name)}
                                    className="p-1 text-stone-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                    title="Xóa học kỳ"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {yearSemesters.length === 0 && (
                          <div className="p-3 rounded-xl bg-stone-50 dark:bg-white/[0.01] border border-dashed border-stone-200 dark:border-white/5 text-center text-xs text-stone-400">
                            Chưa có học kỳ nào gắn với năm học này.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-stone-100 dark:border-white/5 gap-2 text-xs">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEditYear(year)}
                        className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-amber-500/10 hover:text-amber-500 text-stone-600 dark:text-stone-300 font-bold transition-colors flex items-center gap-1.5 text-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Sửa năm học
                      </button>
                      {!isCurrent && (
                        <button
                          onClick={() => handleDeleteYear(year.id, year.name)}
                          className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 text-stone-600 dark:text-stone-300 font-bold transition-colors flex items-center gap-1.5 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Xóa
                        </button>
                      )}
                    </div>

                    <span className="text-[10px] font-mono text-stone-400 self-end sm:self-auto">
                      ID: {year.id.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredYears.length === 0 && (
              <div className="col-span-full p-16 text-center space-y-4 rounded-3xl bg-white dark:bg-stone-900 border border-dashed border-stone-200 dark:border-white/10">
                <Calendar className="w-12 h-12 text-stone-400 mx-auto opacity-40" />
                <p className="text-stone-500 font-bold text-sm">
                  Chưa có năm học nào khớp với tìm kiếm.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Semesters Only View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSemesters.map((sem) => {
              const status = getSemesterStatus(sem);

              return (
                <div
                  key={sem.id}
                  className={cn(
                    'p-6 rounded-[28px] border transition-all duration-300 flex flex-col justify-between space-y-5',
                    sem.is_active
                      ? 'bg-white dark:bg-stone-900/90 border-amber-500/30 shadow-lg ring-2 ring-amber-500/10'
                      : 'bg-white dark:bg-stone-900/50 border-stone-100 dark:border-white/5 shadow-sm'
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-block mb-1',
                            status.color
                          )}
                        >
                          {status.label}
                        </span>
                        <h3 className="text-lg font-black tracking-tight text-stone-900 dark:text-white">
                          {sem.name}
                        </h3>
                        <span className="text-xs font-mono font-bold text-stone-400">
                          Mã: {sem.code}
                        </span>
                      </div>

                      {sem.is_active && (
                        <div className="p-2 bg-amber-500 text-white rounded-xl shadow-md">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-white/[0.02] border border-stone-100 dark:border-white/5 text-xs text-stone-600 dark:text-stone-300 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>
                        {formatDate(sem.start_date)} &mdash; {formatDate(sem.end_date)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-stone-100 dark:border-white/5 text-xs">
                    {!sem.is_active && (
                      <button
                        onClick={() => handleSetActiveSemester(sem.id, sem.name)}
                        className="flex-1 py-2 bg-emerald-500 text-white font-bold rounded-xl text-center hover:bg-emerald-600 transition-colors text-xs"
                      >
                        Kích hoạt
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEditSemester(sem)}
                      className="px-3 py-2 bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 rounded-xl font-bold transition-colors"
                    >
                      Sửa
                    </button>
                    {!sem.is_active && (
                      <button
                        onClick={() => handleDeleteSemester(sem.id, sem.name)}
                        className="px-3 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl font-bold transition-colors"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Year */}
        <Dialog open={showYearModal} onOpenChange={setShowYearModal}>
          <DialogContent className="sm:max-w-[560px] rounded-[36px] border border-stone-200 dark:border-white/10 bg-white dark:bg-stone-900 shadow-2xl p-0 overflow-hidden">
            <form onSubmit={handleSaveYear} className="flex flex-col">
              <div className="p-8 pb-6 border-b border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-black tracking-tight text-stone-950 dark:text-white">
                      {editingYear ? 'Chỉnh sửa năm học' : 'Tạo năm học mới'}
                    </DialogTitle>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      Cấu hình khung thời gian năm học cho toàn trung tâm.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Tên năm học *
                  </label>
                  <Input
                    value={yearForm.name}
                    onChange={(e) => setYearForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ví dụ: 2025 - 2026"
                    required
                    className="h-12 rounded-2xl font-bold bg-stone-50 dark:bg-white/5 border-stone-200 dark:border-white/10"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      Ngày bắt đầu *
                    </label>
                    <Input
                      type="date"
                      value={yearForm.start_date}
                      onChange={(e) =>
                        setYearForm((prev) => ({ ...prev, start_date: e.target.value }))
                      }
                      required
                      className="h-12 rounded-2xl font-bold bg-stone-50 dark:bg-white/5 border-stone-200 dark:border-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      Ngày kết thúc *
                    </label>
                    <Input
                      type="date"
                      value={yearForm.end_date}
                      onChange={(e) =>
                        setYearForm((prev) => ({ ...prev, end_date: e.target.value }))
                      }
                      required
                      className="h-12 rounded-2xl font-bold bg-stone-50 dark:bg-white/5 border-stone-200 dark:border-white/10"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-white/[0.03] border border-stone-100 dark:border-white/5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-bold text-sm text-stone-900 dark:text-white block">
                        Đặt làm năm học hiện tại
                      </span>
                      <span className="text-xs text-stone-500">
                        Áp dụng tự động cho các lớp học và thời khóa biểu mới.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={yearForm.is_current}
                      onChange={(e) =>
                        setYearForm((prev) => ({ ...prev, is_current: e.target.checked }))
                      }
                      className="w-5 h-5 rounded-lg text-amber-500 focus:ring-amber-500/20"
                    />
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/[0.02] flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowYearModal(false)}
                  className="rounded-2xl h-11 px-5 font-bold"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={yearSubmitting}
                  className="rounded-2xl h-11 px-6 font-black uppercase text-xs tracking-wider bg-stone-900 dark:bg-amber-600 text-white"
                >
                  {yearSubmitting ? 'Đang lưu...' : editingYear ? 'Cập nhật' : 'Tạo mới'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal Semester */}
        <Dialog open={showSemesterModal} onOpenChange={setShowSemesterModal}>
          <DialogContent className="sm:max-w-[560px] rounded-[36px] border border-stone-200 dark:border-white/10 bg-white dark:bg-stone-900 shadow-2xl p-0 overflow-hidden">
            <form onSubmit={handleSaveSemester} className="flex flex-col">
              <div className="p-8 pb-6 border-b border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-black tracking-tight text-stone-950 dark:text-white">
                      {editingSemester ? 'Chỉnh sửa học kỳ' : 'Thêm học kỳ mới'}
                    </DialogTitle>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      Quy định khung thời gian học tập cho từng học kỳ.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      Tên học kỳ *
                    </label>
                    <Input
                      value={semesterForm.name}
                      onChange={(e) =>
                        setSemesterForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Học kỳ 1 (HK1)"
                      required
                      className="h-12 rounded-2xl font-bold bg-stone-50 dark:bg-white/5 border-stone-200 dark:border-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      Mã định danh *
                    </label>
                    <Input
                      value={semesterForm.code}
                      onChange={(e) =>
                        setSemesterForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                      }
                      placeholder="HK1-2025"
                      required
                      className="h-12 rounded-2xl font-mono font-bold bg-stone-50 dark:bg-white/5 border-stone-200 dark:border-white/10 uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      Ngày bắt đầu *
                    </label>
                    <Input
                      type="date"
                      value={semesterForm.start_date}
                      onChange={(e) =>
                        setSemesterForm((prev) => ({ ...prev, start_date: e.target.value }))
                      }
                      required
                      className="h-12 rounded-2xl font-bold bg-stone-50 dark:bg-white/5 border-stone-200 dark:border-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      Ngày kết thúc *
                    </label>
                    <Input
                      type="date"
                      value={semesterForm.end_date}
                      onChange={(e) =>
                        setSemesterForm((prev) => ({ ...prev, end_date: e.target.value }))
                      }
                      required
                      className="h-12 rounded-2xl font-bold bg-stone-50 dark:bg-white/5 border-stone-200 dark:border-white/10"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-white/[0.03] border border-stone-100 dark:border-white/5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-bold text-sm text-stone-900 dark:text-white block">
                        Kích hoạt học kỳ này ngay
                      </span>
                      <span className="text-xs text-stone-500">
                        Đặt làm học kỳ hiện tại đang diễn ra của trung tâm.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={semesterForm.is_active}
                      onChange={(e) =>
                        setSemesterForm((prev) => ({ ...prev, is_active: e.target.checked }))
                      }
                      className="w-5 h-5 rounded-lg text-amber-500 focus:ring-amber-500/20"
                    />
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/[0.02] flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSemesterModal(false)}
                  className="rounded-2xl h-11 px-5 font-bold"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={semesterSubmitting}
                  className="rounded-2xl h-11 px-6 font-black uppercase text-xs tracking-wider bg-stone-900 dark:bg-amber-600 text-white"
                >
                  {semesterSubmitting ? 'Đang lưu...' : editingSemester ? 'Cập nhật' : 'Tạo mới'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
