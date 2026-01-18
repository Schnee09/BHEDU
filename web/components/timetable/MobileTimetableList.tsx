"use client";

import { useRef, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Edit3, Trash2, MapPin, Users, GraduationCap, BookOpen, Clock, CalendarDays, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Define simplified types based on what we see in page.tsx
// In a real scenario, we should import shared types
interface MobileTimetableListProps {
    slots: any[]; // Using any[] for flexibility since exact types are in page.tsx
    days: string[];
    weekDates: Date[];
    currentDay: number;
    onDayChange: (dayIndex: number) => void;
    onEditSlot: (slot: any) => void;
    onDeleteSlot: (slotId: string) => void;
    onCreateSlot: (dayIndex: number, session: any) => void;
    viewMode: 'room' | 'class' | 'teacher' | 'tutoring';
    sessions: any[];
    isLoading?: boolean;
}

export default function MobileTimetableList({
    slots,
    days,
    weekDates,
    currentDay,
    onDayChange,
    onEditSlot,
    onDeleteSlot,
    onCreateSlot,
    viewMode,
    sessions,
    isLoading
}: MobileTimetableListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to selected day on mount/change
    useEffect(() => {
        if (scrollRef.current) {
            const selectedBtn = scrollRef.current.children[currentDay] as HTMLElement;
            if (selectedBtn) {
                scrollRef.current.scrollTo({
                    left: selectedBtn.offsetLeft - scrollRef.current.offsetWidth / 2 + selectedBtn.offsetWidth / 2,
                    behavior: 'smooth'
                });
            }
        }
    }, [currentDay]);

    // Filter slots for the current day
    const dailySlots = sessions.map(session => {
        // Find all slots for this session and current day
        const sessionSlots = slots.filter(s =>
            s.day_of_week === currentDay &&
            s.start_time === session.start
        );

        return {
            session,
            slots: sessionSlots
        };
    });

    // For room view mode, group slots by room
    const getRoomGroups = (slotList: any[]) => {
        const groups: { [key: string]: any[] } = {};
        slotList.forEach(slot => {
            const roomName = slot.room || 'Không có phòng';
            if (!groups[roomName]) groups[roomName] = [];
            groups[roomName].push(slot);
        });
        return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    };

    const getSlotColor = (slot: any) => {
        // Determine color based on view mode or content
        if (viewMode === 'tutoring') return 'border-purple-500 bg-purple-50 dark:bg-purple-900/20';
        if (viewMode === 'teacher') return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
        if (viewMode === 'class') return 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20';
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    };

    const currentDate = weekDates[currentDay];

    return (
        <div className="flex flex-col h-full md:hidden bg-gray-50 dark:bg-gray-900/50 -mx-4 sm:-mx-6">
            {/* Day Selector - Sticky Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-800">
                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto py-3 px-4 gap-3 no-scrollbar snap-x"
                >
                    {days.map((day, index) => {
                        const date = weekDates[index];
                        const isToday = new Date().toDateString() === date.toDateString();
                        const isSelected = currentDay === index;

                        return (
                            <button
                                key={day}
                                onClick={() => onDayChange(index)}
                                className={cn(
                                    "flex flex-col items-center justify-center min-w-[70px] p-2 rounded-2xl transition-all border snap-center",
                                    isSelected
                                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-500/20"
                                        : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600",
                                    isToday && !isSelected && "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10"
                                )}
                            >
                                <span className={cn(
                                    "text-xs font-medium mb-0.5 uppercase tracking-wide",
                                    isSelected ? "text-blue-100" : "text-gray-400"
                                )}>{day}</span>
                                <span className={cn(
                                    "text-lg font-bold font-mono",
                                    isSelected ? "text-white" : "text-gray-900 dark:text-white"
                                )}>{format(date, 'dd')}</span>
                            </button>
                        );
                    })}
                </div>
                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between text-xs text-gray-500">
                    <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {format(currentDate, "EEEE, 'ngày' dd 'tháng' MM, yyyy", { locale: vi })}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-500 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full">
                        {viewMode === 'room' && 'Xem theo Phòng'}
                        {viewMode === 'class' && 'Xem theo Lớp'}
                        {viewMode === 'teacher' && 'Xem theo Giáo viên'}
                        {viewMode === 'tutoring' && 'Xem Lịch học kèm'}
                    </span>
                </div>
            </div>

            {/* Slots List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    dailySlots.map(({ session, slots: currentSlots }, idx) => (
                        <div key={session.id} className="relative pl-4 pb-4 last:pb-0">
                            {/* Timeline Line */}
                            {idx !== dailySlots.length - 1 && (
                                <div className="absolute left-[7px] top-8 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800" />
                            )}

                            {/* Timeline Dot */}
                            <div className="absolute left-0 top-3 w-4 h-4 rounded-full border-[3px] border-white dark:border-gray-900 bg-blue-500 shadow-sm z-10" />

                            <div className="ml-4">
                                <div className="flex items-baseline gap-2 mb-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{session.label}</h3>
                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {session.time}
                                    </span>
                                </div>

                                {currentSlots.length > 0 ? (
                                    <div className="space-y-3">
                                        {currentSlots.map((slot: any) => (
                                            <div
                                                key={slot.id}
                                                onClick={() => onEditSlot(slot)}
                                                className={cn(
                                                    "relative overflow-hidden rounded-2xl p-4 border-l-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98] bg-white dark:bg-gray-800",
                                                    getSlotColor(slot)
                                                )}
                                            >
                                                <div className="flex justify-between items-start gap-3 mb-2">
                                                    <div className="flex-1 min-w-0">
                                                        {/* Show room badge prominently in room view mode */}
                                                        {viewMode === 'room' && slot.room && (
                                                            <div className="mb-1">
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-600 text-white">
                                                                    <MapPin className="w-3 h-3 mr-1" />
                                                                    {slot.room}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="font-bold text-gray-900 dark:text-white text-base line-clamp-2">
                                                            {slot.class?.name || slot.student?.full_name || "N/A"}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 shrink-0">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onEditSlot(slot); }}
                                                            className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onDeleteSlot(slot.id); }}
                                                            className="p-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-lg"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    {slot.subject && (
                                                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                                                            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                                                            <span className="truncate font-medium">{slot.subject.name}</span>
                                                        </div>
                                                    )}
                                                    {slot.teacher && (
                                                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                                                            <Users className="w-3.5 h-3.5 text-green-500" />
                                                            <span className="truncate">{slot.teacher.full_name}</span>
                                                        </div>
                                                    )}
                                                    {slot.room && (
                                                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 col-span-2">
                                                            <MapPin className="w-3.5 h-3.5 text-red-500" />
                                                            <span className="truncate">{slot.room || "Chưa xếp phòng"}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Notes Preview */}
                                                {(slot.notes || slot.weekly_note) && (
                                                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                                                        <p className="text-xs text-gray-500 italic line-clamp-1">
                                                            {slot.weekly_note || slot.notes}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Secondary Add Button for existing slots session */}
                                        <button
                                            onClick={() => onCreateSlot(currentDay, session)}
                                            className="w-full py-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-300 transition-colors gap-2 text-sm font-medium"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Thêm tiết học khác
                                        </button>
                                    </div>
                                ) : (
                                    // Empty State for Session
                                    <button
                                        onClick={() => onCreateSlot(currentDay, session)}
                                        className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50/50 transition-all gap-1 group"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                            <Plus className="w-5 h-5 group-hover:text-blue-600" />
                                        </div>
                                        <span className="text-xs font-medium">Trống - Chạm để thêm</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}

                <div className="h-4" /> {/* Bot spacer */}
            </div>
        </div>
    );
}
