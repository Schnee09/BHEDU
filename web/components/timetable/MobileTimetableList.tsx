"use client";

import { useRef, useEffect, useState } from "react";
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
    const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | 'none'>('none');
    const touchStart = useRef<number | null>(null);
    const touchEnd = useRef<number | null>(null);

    // Auto-scroll to selected day on mount/change
    useEffect(() => {
        if (scrollRef.current) {
            const selectedBtn = scrollRef.current.children[currentDay] as HTMLElement;
            if (selectedBtn) {
                // Center the selected day
                const scrollLeft = selectedBtn.offsetLeft - scrollRef.current.offsetWidth / 2 + selectedBtn.offsetWidth / 2;
                scrollRef.current.scrollTo({
                    left: scrollLeft,
                    behavior: 'smooth'
                });
            }
        }
    }, [currentDay]);

    // Handle day change with animation
    const handleDayChange = (newIndex: number) => {
        if (newIndex < 0 || newIndex >= days.length) return;
        setAnimationDirection(newIndex > currentDay ? 'right' : 'left');
        onDayChange(newIndex);
    };

    // Swipe handlers
    const onTouchStart = (e: React.TouchEvent) => {
        touchEnd.current = null;
        touchStart.current = e.targetTouches[0].clientX;
    };

    const onTouchMove = (e: React.TouchEvent) => {
        touchEnd.current = e.targetTouches[0].clientX;
    };

    const onTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;
        const distance = touchStart.current - touchEnd.current;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe && currentDay < days.length - 1) {
            handleDayChange(currentDay + 1);
        }
        if (isRightSwipe && currentDay > 0) {
            handleDayChange(currentDay - 1);
        }
    };

    // Filter slots for the current day
    const dailySlots = sessions.map(session => {
        const sessionSlots = slots.filter(s =>
            s.day_of_week === currentDay &&
            s.start_time === session.start
        );
        return { session, slots: sessionSlots };
    });

    const getSlotColor = (slot: any) => {
        if (viewMode === 'tutoring') return 'border-l-purple-500 bg-purple-50/50 dark:bg-purple-900/10';
        if (viewMode === 'teacher') return 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10';
        if (viewMode === 'class') return 'border-l-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10';
        return 'border-l-blue-500 bg-white dark:bg-gray-800 border dark:border-gray-700'; // Default clean look
    };

    const currentDate = weekDates[currentDay];

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] md:hidden bg-gray-50 dark:bg-gray-950 -mx-4 sm:-mx-6">
            {/* Day Selector - Sticky Header */}
            <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 shadow-sm">
                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto py-3 px-4 gap-3 no-scrollbar scroll-smooth"
                >
                    {days.map((day, index) => {
                        const date = weekDates[index];
                        const isToday = new Date().toDateString() === date.toDateString();
                        const isSelected = currentDay === index;

                        return (
                            <button
                                key={day}
                                onClick={() => handleDayChange(index)}
                                className={cn(
                                    "flex flex-col items-center justify-center min-w-[64px] h-[72px] rounded-2xl transition-all duration-200 press-effect tap-target",
                                    isSelected
                                        ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25 scale-105 font-bold"
                                        : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-transparent hover:border-gray-200 dark:hover:border-gray-700",
                                    isToday && !isSelected && "ring-1 ring-amber-500/50 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400"
                                )}
                            >
                                <span className={cn(
                                    "text-[11px] font-medium uppercase tracking-wider mb-0.5",
                                    isSelected ? "text-amber-50" : "text-gray-400"
                                )}>{day}</span>
                                <span className="text-xl leading-none">{format(date, 'dd')}</span>
                            </button>
                        );
                    })}
                </div>
                
                {/* Info Bar */}
                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                        {format(currentDate, "EEEE, dd/MM", { locale: vi })}
                    </span>
                    <span className="text-[10px] font-bold tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 rounded-full uppercase">
                        {viewMode === 'room' && 'Phòng'}
                        {viewMode === 'class' && 'Lớp'}
                        {viewMode === 'teacher' && 'Giáo viên'}
                        {viewMode === 'tutoring' && 'Học kèm'}
                    </span>
                </div>
            </div>

            {/* Slots List Area with Swipe */}
            <div 
                className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-5 pb-safe"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl skeleton-shimmer" />
                        ))}
                    </div>
                ) : (
                    <div 
                        key={currentDay} // Force re-render for animation
                        className={cn(
                            "animate-fade-in",
                            animationDirection === 'right' ? "animate-slide-left" : 
                            animationDirection === 'left' ? "animate-slide-right" : ""
                        )}
                    >
                        {dailySlots.map(({ session, slots: currentSlots }, idx) => (
                            <div key={session.id} className="relative pl-4 pb-6 last:pb-0">
                                {/* Timeline Line */}
                                {idx !== dailySlots.length - 1 && (
                                    <div className="absolute left-[7px] top-8 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800" />
                                )}

                                {/* Timeline Dot */}
                                <div className={cn(
                                    "absolute left-0 top-3 w-4 h-4 rounded-full border-[3px] shadow-sm z-10 transition-colors",
                                    currentSlots.length > 0 
                                        ? "border-white dark:border-gray-900 bg-amber-500" 
                                        : "border-gray-50 dark:border-gray-900 bg-gray-300 dark:bg-gray-700"
                                )} />

                                <div className="ml-5">
                                    <div className="flex items-center gap-2 mb-3">
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
                                                        "relative overflow-hidden rounded-2xl p-4 border-l-4 shadow-sm transition-all card-pressable",
                                                        getSlotColor(slot)
                                                    )}
                                                >
                                                    <div className="flex justify-between items-start gap-3 mb-2">
                                                        <div className="flex-1 min-w-0">
                                                            {/* Room Badge */}
                                                            {viewMode === 'room' && slot.room && (
                                                                <div className="mb-1.5">
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
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
                                                                className="tap-target w-8 h-8 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 press-effect"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm mt-3">
                                                        {slot.subject && (
                                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                                                    <BookOpen className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                                                </div>
                                                                <span className="truncate font-medium text-xs">{slot.subject.name}</span>
                                                            </div>
                                                        )}
                                                        {slot.teacher && (
                                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                                <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                                                    <Users className="w-3 h-3 text-green-600 dark:text-green-400" />
                                                                </div>
                                                                <span className="truncate text-xs">{slot.teacher.full_name}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Notes Preview */}
                                                    {(slot.notes || slot.weekly_note) && (
                                                        <div className="mt-3 pt-2.5 border-t border-gray-200/50 dark:border-gray-700/50 flex items-start gap-1.5">
                                                            <div className="mt-0.5 w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 italic line-clamp-1">
                                                                {slot.weekly_note || slot.notes}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Secondary Add Button */}
                                            <button
                                                onClick={() => onCreateSlot(currentDay, session)}
                                                className="w-full h-12 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex items-center justify-center text-gray-400 hover:text-amber-500 hover:border-amber-300 transition-colors gap-2 text-sm font-medium tap-target press-effect"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Thêm tiết khác
                                            </button>
                                        </div>
                                    ) : (
                                        // Empty State for Session
                                        <button
                                            onClick={() => onCreateSlot(currentDay, session)}
                                            className="w-full h-24 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:text-amber-500 hover:border-amber-300 hover:bg-amber-50/10 transition-all gap-2 group tap-target press-effect bg-white/50 dark:bg-gray-800/20"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition-colors">
                                                <Plus className="w-5 h-5 group-hover:text-amber-600" />
                                            </div>
                                            <span className="text-xs font-medium">Trống - Chạm để thêm</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Spacer for bottom nav */}
                <div className="h-20" /> 
            </div>
        </div>
    );
}
