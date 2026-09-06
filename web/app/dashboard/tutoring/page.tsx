'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageGuard from '@/components/PageGuard';
import { Badge, LoadingState, Button } from '@/components/ui';
import { BookOpen, Plus, GraduationCap, ListFilter, Download, Sparkles } from 'lucide-react';
import { useTimetableState } from '@/lib/timetable/useTimetableState';
import { DAYS } from '@/lib/timetable/constants';
import { getDisplayName } from '@/lib/utils/names';

// Components
import TutoringStatsWidget from '@/components/tutoring/TutoringStatsWidget';
import TutoringListView from '@/components/timetable/TutoringListView';
import TutoringTeacherGridView from '@/components/timetable/TutoringTeacherGridView';
import TutoringDispatchBoard from '@/components/tutoring/TutoringDispatchBoard';
import TimetableQuickActionModal from '@/components/timetable/TimetableQuickActionModal';
import TimetableSlotModal from '@/components/timetable/TimetableSlotModal';
import TimetableControlToolbar from '@/components/timetable/TimetableControlToolbar';

export default function TutoringManagementPage() {
  const state = useTimetableState();
  const router = useRouter();
  const isManager = state.isAdmin || state.canEdit;

  const [tutoringViewTab, setTutoringViewTab] = useState<'dispatch' | 'list' | 'teacher'>(
    isManager ? 'dispatch' : 'list'
  );
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Role-aware tutoring slots: Managers see all; Tutors see only their own
  const tutoringSlots = React.useMemo(() => {
    let slots = state.slots.filter((s) => !s.room || s.room === 'Linh hoạt' || !!s.student_id);

    if (!isManager && state.profile?.id) {
      slots = slots.filter(
        (s) => s.teacher_id === state.profile?.id || s.teacher?.id === state.profile?.id
      );
    }

    if (statusFilter) {
      slots = slots.filter((s) => (s.status || 'scheduled') === statusFilter);
    }
    return slots;
  }, [state.slots, statusFilter, isManager, state.profile?.id]);

  const handleExportPayroll = () => {
    const headers = [
      'Thứ / Ngày',
      'Thời gian',
      'Gia sư',
      'Học sinh',
      'Môn học',
      'Trạng thái',
      'Ghi chú',
    ];
    const rows = tutoringSlots.map((s) => [
      `${DAYS[s.day_of_week]} (${state.weekDates[s.day_of_week]?.toLocaleDateString('vi-VN') || ''})`,
      `${s.start_time?.substring(0, 5)} - ${s.end_time?.substring(0, 5)}`,
      getDisplayName(s.teacher) || 'Chưa phân công',
      getDisplayName(s.student) || s.class?.name || 'N/A',
      s.subject?.name || 'N/A',
      s.status === 'completed'
        ? 'Hoàn thành'
        : s.status === 'cancelled'
          ? 'Hủy ca'
          : s.status === 'makeup'
            ? 'Học bù'
            : 'Đã xếp',
      `"${(s.weekly_note || s.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      isManager
        ? `Bang_Cham_Cong_Gia_Su_${new Date().toISOString().substring(0, 10)}.csv`
        : `Lich_Day_Gia_Su_${new Date().toISOString().substring(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageGuard permissions={['timetable.view']}>
      <div className="min-h-screen bg-stone-50/50 dark:bg-stone-900/50 p-4 sm:p-8">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-200/80 dark:border-white/10 shadow-xs">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <Badge variant={isManager ? 'info' : 'success'} className="text-xs font-semibold">
                  {isManager ? 'Phân hệ Quản lý Học Kèm' : 'Lịch Dạy Kèm Gia Sư'}
                </Badge>
                {state.loading && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-blue-500 animate-pulse ml-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Đang nạp ca học...
                  </div>
                )}
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-stone-900 dark:text-white leading-tight">
                {isManager ? 'Quản lý đào tạo học kèm' : 'Lịch dạy kèm của tôi'}
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                {isManager
                  ? 'Điều phối gia sư, học sinh phụ đạo & quản lý danh sách ca học kèm tập trung'
                  : `Danh sách các ca học kèm và học sinh phụ trách của gia sư ${state.profile?.full_name || ''}`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleExportPayroll}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-semibold text-xs sm:text-sm transition-all border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-2 cursor-pointer"
                title={
                  isManager ? 'Xuất CSV Bảng chấm công Gia sư tuần này' : 'Xuất lịch dạy cá nhân'
                }
              >
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />{' '}
                <span>{isManager ? 'Bảng chấm công Gia sư' : 'Xuất lịch dạy'}</span>
              </button>
              {isManager && (
                <Button
                  variant="primary"
                  size="sm"
                  className="rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
                  onClick={() => state.openCreateModal(0, undefined, 'Linh hoạt')}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Thêm ca học kèm
                </Button>
              )}
            </div>
          </div>

          {/* Tutoring Overview Analytics Stats Widget */}
          <TutoringStatsWidget
            slots={isManager ? state.slots : tutoringSlots}
            tutors={
              isManager ? state.tutors : state.tutors.filter((t) => t.id === state.profile?.id)
            }
          />

          {/* Control Toolbar */}
          <TimetableControlToolbar
            activeTab="personal"
            setActiveTab={() => {}}
            displayLayout={state.displayLayout}
            onLayoutChange={state.handleLayoutChange}
            currentWeek={state.currentWeek}
            setCurrentWeek={state.setCurrentWeek}
            weekDates={state.weekDates}
            selectedCampus={state.selectedCampus}
            setSelectedCampus={state.setSelectedCampus}
            selectedClass={state.selectedClass}
            setSelectedClass={state.setSelectedClass}
            selectedTeacher={state.selectedTeacher}
            setSelectedTeacher={state.setSelectedTeacher}
            classes={state.classes}
            teachers={state.teachers}
            isAdmin={state.isAdmin}
            searchQuery={state.searchQuery}
            setSearchQuery={state.setSearchQuery}
            onPrint={state.handlePrint}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            mode="tutoring"
          />

          {/* View Tab Selector: Role-aware */}
          <div className="flex justify-between items-center bg-white dark:bg-stone-900 p-1.5 rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-xs">
            <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl gap-1 overflow-x-auto w-full no-scrollbar">
              {isManager && (
                <button
                  onClick={() => setTutoringViewTab('dispatch')}
                  className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    tutoringViewTab === 'dispatch'
                      ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-500" /> Bàn điều phối (Matchmaker)
                </button>
              )}
              <button
                onClick={() => setTutoringViewTab('list')}
                className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  tutoringViewTab === 'list'
                    ? 'bg-white dark:bg-stone-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                <ListFilter className="w-4 h-4" />{' '}
                {isManager ? 'Danh sách ca học kèm' : 'Danh sách ca dạy của tôi'}
              </button>
              <button
                onClick={() => setTutoringViewTab('teacher')}
                className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  tutoringViewTab === 'teacher'
                    ? 'bg-white dark:bg-stone-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                <GraduationCap className="w-4 h-4" />{' '}
                {isManager ? 'Lưới ma trận Gia sư' : 'Lịch tuần của tôi'}
              </button>
            </div>
          </div>

          {/* Main Tutoring Content */}
          {state.loading ? (
            <LoadingState message="Đang tải danh sách ca học kèm..." />
          ) : tutoringViewTab === 'dispatch' && isManager ? (
            <TutoringDispatchBoard
              slots={state.slots}
              tutors={state.tutors}
              weekDates={state.weekDates}
              onEditSlot={state.openEditModal}
              onDeleteSlot={state.handleDeleteSlot}
              onCreateSlot={state.openCreateModal}
              onUpdateStatus={state.handleUpdateSlotStatus}
              onRefresh={state.refetchSlots}
              canEdit={state.canEdit}
            />
          ) : tutoringViewTab === 'list' ? (
            <TutoringListView
              slots={tutoringSlots}
              weekDates={state.weekDates}
              onEditSlot={state.openEditModal}
              onDeleteSlot={state.handleDeleteSlot}
              onCreateSlot={state.openCreateModal}
              onUpdateStatus={state.handleUpdateSlotStatus}
            />
          ) : (
            <TutoringTeacherGridView
              slots={isManager ? state.slots : tutoringSlots}
              tutors={
                isManager
                  ? state.tutors
                  : state.tutors.filter((t) => t.id === state.profile?.id).length > 0
                    ? state.tutors.filter((t) => t.id === state.profile?.id)
                    : [
                        {
                          id: state.profile?.id || '',
                          full_name: state.profile?.full_name || 'Gia sư',
                        },
                      ]
              }
              weekDates={state.weekDates}
              onEditSlot={state.openEditModal}
              onCreateSlot={(d, s, tId) => state.openCreateModal(d, s, 'Linh hoạt')}
            />
          )}

          {/* Quick Action Popover */}
          <TimetableQuickActionModal
            slot={state.activeActionSlot}
            onClose={() => state.setActiveActionSlot(null)}
            onEdit={state.openEditModal}
            onDelete={state.handleDeleteSlot}
            onUpdateStatus={state.handleUpdateSlotStatus}
            canEdit={state.canEdit}
          />

          {/* Create/Edit Slot Modal */}
          <TimetableSlotModal
            isOpen={state.showEditModal}
            onClose={() => state.setShowEditModal(false)}
            onSuccess={state.refetchSlots}
            editingSlot={state.editingSlot}
            initialData={state.initialModalData}
            currentWeekStart={state.currentWeekStart}
          />
        </div>
      </div>
    </PageGuard>
  );
}
