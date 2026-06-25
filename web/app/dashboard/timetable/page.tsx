'use client';

import { useState, useEffect, useMemo } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { usePermissions } from '@/hooks/usePermissions';
import PageGuard from '@/components/PageGuard';
import { apiFetch } from '@/lib/api/client';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  Plus,
  GraduationCap,
  Layout,
  Building,
  Link as LinkIcon,
} from 'lucide-react';
import Link from 'next/link';
import MobileTimetableList from '@/components/timetable/MobileTimetableList';
import { cn } from '@/lib/utils';
import { Button, Badge, LoadingState } from '@/components/ui';
import { useToast } from '@/hooks/useToast';

// Lib
import { TimetableSlot, ClassOption, TeacherOption } from '@/lib/timetable/types';
import { CAMPUSES, DAYS, ALL_SESSIONS } from '@/lib/timetable/constants';
import { getWeekDates } from '@/lib/timetable/utils';

// Components
import TimetableSlotModal from '@/components/timetable/TimetableSlotModal';
import RoomGridView from '@/components/timetable/RoomGridView';
import ClassGridView from '@/components/timetable/ClassGridView';
import TeacherGridView from '@/components/timetable/TeacherGridView';
import TutoringListView from '@/components/timetable/TutoringListView';
import TutoringTeacherGridView from '@/components/timetable/TutoringTeacherGridView';

export default function TimetablePage() {
  const { profile, loading: profileLoading } = useProfile();
  const { can, role } = usePermissions();
  const toast = useToast();

  const isAdmin = role === 'admin' || role === 'super_admin' || role === 'owner';
  const canEdit = can('timetable.edit') || role === 'super_admin' || role === 'owner';

  // State
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<'room' | 'class' | 'teacher'>('room');
  const [selectedCampus, setSelectedCampus] = useState(CAMPUSES[0]?.id || 'NQ');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');

  // Filter Options (Lighter lists for dropdowns)
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [tutors, setTutors] = useState<TeacherOption[]>([]);

  // Tutoring State
  const isTutoring = selectedCampus === 'HK';
  const [tutoringViewMode, setTutoringViewMode] = useState<'list' | 'teacher'>('list');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [initialModalData, setInitialModalData] = useState<Partial<TimetableSlot>>({});

  const currentCampus = CAMPUSES.find((c) => c.id === selectedCampus);
  const weekDates = useMemo(() => getWeekDates(currentWeek), [currentWeek]);
  const currentWeekStart = weekDates[0]?.toISOString().split('T')[0] || '';

  // Mobile State
  const [currentMobileDay, setCurrentMobileDay] = useState(
    new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  );

  // Data Fetching
  const fetchAllSlots = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(
        `/api/timetable/all?week_start_date=${currentWeekStart}&t=${Date.now()}`
      );
      const data = await response.json();
      const fetchedSlots = data.data?.slots || data.slots || [];
      console.log(`[TimetablePage] Fetched ${fetchedSlots.length} slots`);
      setSlots(fetchedSlots);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassSlots = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const response = await apiFetch(
        `/api/timetable?class_id=${selectedClass}&week_start_date=${currentWeekStart}`
      );
      const data = await response.json();
      setSlots(data.data?.slots || data.slots || []);
    } catch (error) {
      console.error('Failed to fetch class slots:', error);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    if (!isAdmin) return;
    try {
      const [classRes, teacherRes, tutorRes] = await Promise.all([
        apiFetch('/api/classes'),
        apiFetch('/api/admin/users?role=teacher&limit=1000'),
        apiFetch('/api/tutors?limit=1000'),
      ]);
      const classData = await classRes.json();
      const teacherData = await teacherRes.json();
      const tutorData = await tutorRes.json();

      setClasses(classData.data?.data || classData.data || classData.classes || []);
      setTeachers(teacherData.data?.data || teacherData.data || teacherData.users || []);
      setTutors(tutorData.data || tutorData.tutors || []);
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    }
  };

  useEffect(() => {
    if (profileLoading || !role) return;
    if (!isAdmin) {
      window.location.href = '/dashboard/my-schedule';
      return;
    }
    fetchFilterOptions();
  }, [profileLoading, isAdmin, role]);

  useEffect(() => {
    if (viewMode === 'class' && selectedClass) {
      fetchClassSlots();
    } else {
      fetchAllSlots();
    }
  }, [viewMode, selectedClass, currentWeek, selectedCampus]);

  // Actions
  const openCreateModal = (dayIndex?: number, period?: any, room?: string) => {
    if (!canEdit) return;
    setEditingSlot(null);
    setInitialModalData({
      day_of_week: dayIndex ?? 0,
      start_time: period?.start ?? '17:00',
      end_time: period?.end ?? '18:30',
      room: room || '',
      class_id: room !== 'Linh hoạt' ? selectedClass : '',
    });
    setShowModal(true);
  };

  const openEditModal = (slot: TimetableSlot) => {
    if (!canEdit) return;
    setEditingSlot(slot);
    setShowModal(true);
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!canEdit) return;
    if (!confirm('Bạn có chắc muốn xóa tiết học này?')) return;

    try {
      const response = await apiFetch(`/api/timetable/${slotId}`, { method: 'DELETE' });
      const result = await response.json();

      if (!result.success) throw new Error(result.error);

      toast.success('Thành công', 'Đã xóa tiết học');

      if (viewMode === 'class') fetchClassSlots();
      else fetchAllSlots();
    } catch (error: any) {
      toast.error('Lỗi', error.message);
    }
  };

  if (profileLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState />
      </div>
    );

  return (
    <PageGuard permissions={['timetable.view']}>
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 p-4 sm:p-8">
        <div className="max-w-[1600px] mx-auto space-y-8">
          {/* Header Section */}
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 bg-white dark:bg-gray-800/80 p-8 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-premium backdrop-blur-md">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Layout className="w-6 h-6 text-primary" />
                </div>
                <Badge variant="warning">Quản trị</Badge>
                {slots.length > 0 && <Badge variant="success">{slots.length} tiết học</Badge>}
                {loading && (
                  <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 animate-pulse uppercase tracking-widest ml-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Đang tải...
                  </div>
                )}
              </div>
              <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white uppercase leading-none">
                {viewMode === 'room' ? 'Lịch Sử Dụng Phòng' : 'Quản Lý Thời Khóa Biểu'}
              </h1>
              <p className="text-muted mt-2 max-w-2xl font-medium italic">
                {weekDates[0]?.toLocaleDateString('vi-VN')} -{' '}
                {weekDates[6]?.toLocaleDateString('vi-VN')}
                {slots.length === 0 && !loading && ' - Không có dữ liệu'}
              </p>
            </div>

            <div className="flex flex-col gap-3 items-end">
              <div className="flex items-center gap-3 bg-gray-100 dark:bg-white/5 p-1.5 rounded-2xl">
                <div className="flex items-center gap-3 px-3 border-r border-gray-200 dark:border-gray-700 mr-1 pr-4">
                  <Link
                    href="/dashboard/my-schedule"
                    className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-stone-500 hover:text-blue-600 transition-colors"
                  >
                    <LinkIcon className="w-3 h-3" /> Cá nhân
                  </Link>
                  <span className="text-stone-300 dark:text-stone-700">•</span>
                  <Link
                    href="/dashboard/calendar"
                    className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-stone-500 hover:text-blue-600 transition-colors"
                  >
                    <LinkIcon className="w-3 h-3" /> Sự kiện
                  </Link>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="rounded-xl px-5"
                  onClick={() => setCurrentWeek(new Date())}
                >
                  Hôm nay
                </Button>
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() - 7)))
                    }
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <span className="text-sm font-black px-4 min-w-[150px] text-center">
                    Tuần{' '}
                    {weekDates[0]?.toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                    })}{' '}
                    -{' '}
                    {weekDates[6]?.toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() + 7)))
                    }
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 gap-4">
            <div className="flex bg-gray-100 dark:bg-white/5 p-1.5 rounded-2xl w-full sm:w-auto">
              <button
                onClick={() => setViewMode('room')}
                className={cn(
                  'px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2',
                  viewMode === 'room'
                    ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                    : 'text-muted hover:text-gray-900'
                )}
              >
                <Building className="w-4 h-4" /> Theo phòng
              </button>
              <button
                onClick={() => setViewMode('class')}
                className={cn(
                  'px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2',
                  viewMode === 'class'
                    ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                    : 'text-muted hover:text-gray-900'
                )}
              >
                <Users className="w-4 h-4" /> Theo lớp
              </button>
              <button
                onClick={() => setViewMode('teacher')}
                className={cn(
                  'px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2',
                  viewMode === 'teacher'
                    ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                    : 'text-muted hover:text-gray-900'
                )}
              >
                <GraduationCap className="w-4 h-4" /> Theo giáo viên
              </button>
            </div>

            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
              {viewMode === 'room' && (
                <div className="flex bg-gray-100 dark:bg-white/5 p-1.5 rounded-2xl">
                  {CAMPUSES.map((campus) => (
                    <button
                      key={campus.id}
                      onClick={() => setSelectedCampus(campus.id)}
                      className={cn(
                        'px-6 py-2.5 rounded-xl text-sm font-black transition-all',
                        selectedCampus === campus.id
                          ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                          : 'text-muted hover:text-gray-900'
                      )}
                    >
                      {campus.name}
                    </button>
                  ))}
                </div>
              )}
              {viewMode === 'class' && (
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full sm:w-64 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/5 rounded-xl text-sm font-black text-gray-900 dark:text-white outline-none"
                >
                  <option value="">-- Chọn lớp --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
              {viewMode === 'teacher' && (
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full sm:w-64 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/5 rounded-xl text-sm font-black text-gray-900 dark:text-white outline-none"
                >
                  <option value="">👨‍🏫 Chọn giáo viên</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Campus Title */}
          {viewMode === 'room' && currentCampus && (
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold text-blue-600 uppercase">
                {isTutoring ? '📚 HỌC KÈM' : `CƠ SỞ ${currentCampus.name.toUpperCase()}`}
              </h2>
              {isTutoring && (
                <div className="flex justify-center gap-2 mt-3">
                  <button
                    onClick={() => setTutoringViewMode('list')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tutoringViewMode === 'list' ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-400' : 'bg-gray-50 text-gray-600 border border-gray-300'}`}
                  >
                    📋 Danh sách
                  </button>
                  <button
                    onClick={() => setTutoringViewMode('teacher')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tutoringViewMode === 'teacher' ? 'bg-blue-100 text-blue-700 border-2 border-blue-400' : 'bg-gray-50 text-gray-600 border border-gray-100'}`}
                  >
                    👨‍🏫 Theo giáo viên
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Grid Views */}
          <MobileTimetableList
            slots={slots}
            days={DAYS}
            weekDates={weekDates}
            currentDay={currentMobileDay}
            onDayChange={setCurrentMobileDay}
            onEditSlot={openEditModal}
            onDeleteSlot={handleDeleteSlot}
            onCreateSlot={openCreateModal}
            viewMode={isTutoring ? 'tutoring' : viewMode}
            sessions={ALL_SESSIONS}
            isLoading={loading}
          />

          <div className="hidden md:block">
            {loading ? (
              <LoadingState message="Đang tải dữ liệu thời khóa biểu..." />
            ) : viewMode === 'room' ? (
              isTutoring ? (
                tutoringViewMode === 'list' ? (
                  <TutoringListView
                    slots={slots}
                    weekDates={weekDates}
                    onEditSlot={openEditModal}
                    onDeleteSlot={handleDeleteSlot}
                    onCreateSlot={openCreateModal}
                  />
                ) : (
                  <TutoringTeacherGridView
                    slots={slots}
                    tutors={tutors}
                    weekDates={weekDates}
                    onEditSlot={openEditModal}
                    onCreateSlot={(d, s, tId) => openCreateModal(d, s, 'Linh hoạt')}
                  />
                )
              ) : (
                <RoomGridView
                  slots={slots}
                  currentCampus={currentCampus!}
                  weekDates={weekDates}
                  onEditSlot={openEditModal}
                  onDeleteSlot={handleDeleteSlot}
                  onCreateSlot={openCreateModal}
                />
              )
            ) : viewMode === 'class' ? (
              <ClassGridView
                slots={slots}
                selectedClass={selectedClass}
                classes={classes}
                weekDates={weekDates}
                onEditSlot={openEditModal}
                onDeleteSlot={handleDeleteSlot}
                onCreateSlot={openCreateModal}
              />
            ) : (
              <TeacherGridView
                slots={slots}
                selectedTeacher={selectedTeacher}
                teachers={teachers}
                weekDates={weekDates}
                onEditSlot={openEditModal}
                onDeleteSlot={handleDeleteSlot}
              />
            )}
          </div>
        </div>

        {/* Modal for Create/Edit */}
        <TimetableSlotModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={() => (viewMode === 'class' ? fetchClassSlots() : fetchAllSlots())}
          editingSlot={editingSlot}
          initialData={initialModalData}
          currentWeekStart={currentWeekStart}
        />
      </div>
    </PageGuard>
  );
}
