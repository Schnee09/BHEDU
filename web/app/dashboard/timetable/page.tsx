'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import PageGuard from '@/components/PageGuard';
import { LoadingState } from '@/components/ui';
import { useTimetableState } from '@/lib/timetable/useTimetableState';

// Modern Unified Components
import UnifiedTimetableBoard from '@/components/timetable/UnifiedTimetableBoard';
import QuickScheduleModal from '@/components/timetable/QuickScheduleModal';
import SlotActionModal from '@/components/timetable/SlotActionModal';

export default function TimetablePage() {
  const state = useTimetableState();
  const router = useRouter();

  // Strictly filter for regular class slots (100% clean of 1-on-1 tutoring)
  const classSlots = React.useMemo(() => {
    return state.slots.filter((s) => !s.student_id);
  }, [state.slots]);

  const isTeacherUser = state.role === 'teacher' || state.role === 'tutor';

  return (
    <PageGuard permissions="classes.manage">
      <div className="min-h-screen bg-stone-50/50 dark:bg-stone-900/50 p-2.5 sm:p-5">
        <div className="max-w-[1680px] mx-auto space-y-3">
          {/* Unified Modern Timetable Board with Integrated Mobile-First Header */}
          {state.loading ? (
            <LoadingState message="Đang tải dữ liệu thời khóa biểu..." />
          ) : (
            <UnifiedTimetableBoard
              slots={classSlots}
              weekDates={state.weekDates}
              currentWeek={state.currentWeek}
              onWeekChange={state.setCurrentWeek}
              dynamicSchedules={state.dynamicSchedules}
              branches={state.branches}
              branchRooms={state.branchRooms}
              dynamicRooms={state.dynamicRooms}
              selectedCampus={state.selectedCampus}
              onSelectCampus={state.setSelectedCampus}
              classes={state.classes}
              selectedClass={state.selectedClass}
              onSelectClass={state.setSelectedClass}
              teachers={state.teachers}
              selectedTeacher={state.selectedTeacher}
              onSelectTeacher={state.setSelectedTeacher}
              searchQuery={state.searchQuery}
              onSearchQueryChange={state.setSearchQuery}
              canEdit={state.canEdit}
              onEditSlot={state.openSlotAction}
              onDeleteSlot={state.handleDeleteSlot}
              onCreateSlot={(day, session, room) => state.openQuickSchedule(day, session, room)}
              onSelectSlotForAction={state.openSlotAction}
              onPrint={state.handlePrint}
              isLoading={state.loading}
              role={state.role}
              isAdmin={state.isAdmin}
              isTeacherUser={isTeacherUser}
              onAttendanceClick={() => router.push('/dashboard/attendance/mark')}
            />
          )}
        </div>

        {/* Quick Schedule Modal (Click empty cell to schedule) */}
        <QuickScheduleModal
          isOpen={Boolean(state.quickScheduleData?.isOpen)}
          onClose={state.closeQuickSchedule}
          onSuccess={state.refetchSlots}
          initialData={state.quickScheduleData}
          classes={state.classes}
          teachers={state.teachers}
          dynamicRooms={state.dynamicRooms}
          dynamicSchedules={state.dynamicSchedules}
        />

        {/* Slot Action Modal (Click existing slot to manage/move/delete) */}
        <SlotActionModal
          isOpen={Boolean(state.slotActionData?.isOpen)}
          onClose={state.closeSlotAction}
          onSuccess={state.refetchSlots}
          slot={state.slotActionData?.slot}
          teachers={state.teachers}
          dynamicRooms={state.dynamicRooms}
          canEdit={state.canEdit}
        />
      </div>
    </PageGuard>
  );
}
