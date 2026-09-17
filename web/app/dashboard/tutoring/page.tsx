'use client';

import React, { useState } from 'react';
import PageGuard from '@/components/PageGuard';
import { Badge, LoadingState, Button } from '@/components/ui';
import { BookOpen, Plus, Download } from 'lucide-react';
import { useTimetableState, DisplayLayout } from '@/lib/timetable/useTimetableState';
import { DAYS } from '@/lib/timetable/constants';
import { getDisplayName } from '@/lib/utils/names';

// Components
import TutoringStatsWidget from '@/components/tutoring/TutoringStatsWidget';
import TutoringListView from '@/components/timetable/TutoringListView';
import TutoringTeacherGridView from '@/components/timetable/TutoringTeacherGridView';
import TutoringDispatchBoard from '@/components/tutoring/TutoringDispatchBoard';
import ContinuousTimelineView from '@/components/timetable/ContinuousTimelineView';
import TimetableQuickActionModal from '@/components/timetable/TimetableQuickActionModal';
import TimetableSlotModal from '@/components/timetable/TimetableSlotModal';
import TimetableControlToolbar from '@/components/timetable/TimetableControlToolbar';

export type TutoringViewMode = 'dispatch' | 'grid' | 'timeline' | 'agenda';

export default function TutoringManagementPage() {
  const state = useTimetableState();
  const isManager = state.isAdmin || state.canEdit;

  const [viewMode, setViewMode] = useState<TutoringViewMode>(isManager ? 'dispatch' : 'grid');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const handleLayoutChange = (layout: DisplayLayout | 'dispatch') => {
    setViewMode(layout as TutoringViewMode);
    if (layout !== 'dispatch') {
      state.handleLayoutChange(layout);
    }
  };

  // Role-aware tutoring slots: Managers see all; Tutors see only their own
  const filteredTutoringSlots = React.useMemo(() => {
    let slots = state.slots.filter((s) => !s.room || s.room === 'Linh hoạt' || !!s.student_id);

    if (!isManager && state.profile?.id) {
      slots = slots.filter(
        (s) => s.teacher_id === state.profile?.id || s.teacher?.id === state.profile?.id
      );
    }

    if (statusFilter) {
      slots = slots.filter((s) => (s.status || 'scheduled') === statusFilter);
    }

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      slots = slots.filter(
        (s) =>
          s.teacher?.full_name?.toLowerCase().includes(q) ||
          s.student?.full_name?.toLowerCase().includes(q) ||
          s.subject?.name?.toLowerCase().includes(q) ||
          s.class?.name?.toLowerCase().includes(q) ||
          s.room?.toLowerCase().includes(q)
      );
    }

    return slots;
  }, [state.slots, statusFilter, state.searchQuery, isManager, state.profile?.id]);

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
    const rows = filteredTutoringSlots.map((s) => [
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
      <div className="min-h-screen bg-stone-50/50 dark:bg-stone-900/50 p-4 sm:p-8 pb-28 sm:pb-8">
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
            slots={filteredTutoringSlots}
            tutors={
              isManager ? state.tutors : state.tutors.filter((t) => t.id === state.profile?.id)
            }
          />

          {/* Control Toolbar with Integrated View Switcher */}
          <TimetableControlToolbar
            activeTab="personal"
            setActiveTab={() => {}}
            displayLayout={viewMode}
            onLayoutChange={handleLayoutChange}
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
            showDispatchOption={isManager}
          />

          {/* Main Tutoring Content */}
          {state.loading ? (
            <LoadingState message="Đang tải danh sách ca học kèm..." />
          ) : viewMode === 'dispatch' && isManager ? (
            <TutoringDispatchBoard
              slots={filteredTutoringSlots}
              tutors={state.tutors}
              weekDates={state.weekDates}
              onEditSlot={state.openEditModal}
              onDeleteSlot={state.handleDeleteSlot}
              onCreateSlot={state.openCreateModal}
              onUpdateStatus={state.handleUpdateSlotStatus}
              onRefresh={state.refetchSlots}
              onMoveSlot={state.handleMoveSlot}
              canEdit={state.canEdit}
            />
          ) : viewMode === 'timeline' ? (
            <ContinuousTimelineView
              slots={filteredTutoringSlots}
              weekDates={state.weekDates}
              onEditSlot={state.openEditModal}
              onDeleteSlot={state.handleDeleteSlot}
              onCreateSlot={(dayIndex, period, room) =>
                state.openCreateModal(dayIndex, period, room || 'Linh hoạt')
              }
              onMoveSlot={state.handleMoveSlot}
              viewMode="tutoring"
              isLoading={state.loading}
              searchQuery={state.searchQuery}
              selectedTeacher={state.selectedTeacher}
              selectedClass={state.selectedClass}
            />
          ) : viewMode === 'agenda' ? (
            <TutoringListView
              slots={filteredTutoringSlots}
              weekDates={state.weekDates}
              onEditSlot={state.openEditModal}
              onDeleteSlot={state.handleDeleteSlot}
              onCreateSlot={(dayIndex, session, room) =>
                state.openCreateModal(dayIndex, session, room || 'Linh hoạt')
              }
              onUpdateStatus={state.handleUpdateSlotStatus}
            />
          ) : (
            <TutoringTeacherGridView
              slots={filteredTutoringSlots}
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
              onCreateSlot={(d, s) => state.openCreateModal(d, s, 'Linh hoạt')}
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
