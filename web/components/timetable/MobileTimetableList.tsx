'use client';

import { useRef, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Edit3, MapPin, Users, BookOpen, Clock, CalendarDays, Plus, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDisplayName } from '@/lib/utils/names';

interface MobileTimetableListProps {
  slots: any[];
  days: string[];
  weekDates: Date[];
  currentDay: number;
  onDayChange: (dayIndex: number) => void;
  onEditSlot: (slot: any) => void;
  onDeleteSlot: (slotId: string) => void; // Keep for interface compatibility
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
  onCreateSlot,
  viewMode,
  sessions,
  isLoading,
}: MobileTimetableListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | 'none'>('none');
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);

  // Auto-scroll to selected day
  useEffect(() => {
    if (scrollRef.current) {
      const selectedBtn = scrollRef.current.children[currentDay] as HTMLElement;
      if (selectedBtn) {
        const scrollLeft =
          selectedBtn.offsetLeft - scrollRef.current.offsetWidth / 2 + selectedBtn.offsetWidth / 2;
        scrollRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [currentDay]);

  const handleDayChange = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= days.length) return;
    setAnimationDirection(newIndex > currentDay ? 'right' : 'left');
    onDayChange(newIndex);
  };

  // Swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0]?.clientX ?? 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0]?.clientX ?? 0;
  };
  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    if (distance > 50 && currentDay < days.length - 1) handleDayChange(currentDay + 1);
    if (distance < -50 && currentDay > 0) handleDayChange(currentDay - 1);
  };

  // Group slots into sessions or flexible time blocks for current day
  const currentDaySlots = slots.filter((s) => s.day_of_week === currentDay);
  
  const dailySlots = sessions.map((session) => {
    const sessionStart = session.start || '00:00';
    const sessionEnd = session.end || '23:59';
    const sessionStartHour = parseInt(sessionStart.split(':')[0] || '0', 10);
    const sessionEndHour = parseInt(sessionEnd.split(':')[0] || '23', 10);

    const matchedSlots = currentDaySlots.filter((s) => {
      if (!s.start_time) return false;
      const slotHour = parseInt(s.start_time.split(':')[0] || '0', 10);
      // Match exact start or hour range
      return s.start_time.startsWith(sessionStart) || (slotHour >= sessionStartHour && slotHour <= sessionEndHour);
    });

    return { session, slots: matchedSlots };
  });

  // Also gather any orphan slots that didn't match standard sessions
  const matchedSlotIds = new Set(dailySlots.flatMap((d) => d.slots.map((s) => s.id)));
  const orphanSlots = currentDaySlots.filter((s) => !matchedSlotIds.has(s.id));
  if (orphanSlots.length > 0) {
    dailySlots.push({
      session: { id: 'other', label: 'Khung giờ khác', time: 'Linh hoạt', start: '00:00', end: '23:59' },
      slots: orphanSlots,
    });
  }


  const getSlotStyles = (slot: any) => {
    if (viewMode === 'tutoring') return 'border-l-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10';
    if (viewMode === 'teacher')
      return 'border-l-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10';
    if (viewMode === 'class') return 'border-l-amber-600 bg-amber-600/5 dark:bg-amber-600/10';
    return 'border-l-amber-500 bg-amber-500/5 dark:bg-amber-500/10';
  };

  const currentDate = weekDates[currentDay] ?? new Date();

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:hidden bg-transparent -mx-4 sm:-mx-6">
      {/* Day Selector - Premium Sticky */}
      <div className="sticky top-0 z-30 space-y-0.5">
        <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border-b border-stone-200/50 dark:border-white/5 py-3">
          <div
            ref={scrollRef}
            className="flex overflow-x-auto px-4 gap-3 no-scrollbar scroll-smooth"
          >
            {days.map((day, index) => {
              const date = weekDates[index];
              if (!date) return null;
              const isToday = new Date().toDateString() === date.toDateString();
              const isSelected = currentDay === index;

              return (
                <button
                  key={day}
                  onClick={() => handleDayChange(index)}
                  className={cn(
                    'flex flex-col items-center justify-center min-w-[64px] h-[76px] rounded-[24px] transition-all duration-300 relative press-effect tap-target',
                    isSelected
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105'
                      : 'bg-stone-500/5 dark:bg-white/5 text-stone-500 dark:text-stone-400 border border-stone-200/50 dark:border-white/5',
                    isToday &&
                      !isSelected &&
                      'ring-2 ring-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-500'
                  )}
                >
                  <span
                    className={cn(
                      'text-[10px] font-black uppercase tracking-[0.15em] mb-1 opacity-70',
                      isSelected ? 'text-amber-50' : ''
                    )}
                  >
                    {day}
                  </span>
                  <span className="text-xl font-black">{format(date, 'dd')}</span>

                  {/* Active Glow */}
                  {isSelected && (
                    <div className="absolute -bottom-1 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-2.5 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200/50 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,166,35,0.5)] animate-pulse" />
            <span className="text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest leading-none">
              {format(currentDate, 'EEEE, dd/MM', { locale: vi })}
            </span>
          </div>
          <span className="text-[10px] font-black tracking-widest text-amber-600 dark:text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full uppercase border border-amber-500/20">
            {viewMode === 'room' && 'Hành lang'}
            {viewMode === 'class' && 'Theo Lớp'}
            {viewMode === 'teacher' && 'Giáo viên'}
            {viewMode === 'tutoring' && 'Học kèm'}
          </span>
        </div>
      </div>

      {/* Slots List */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-6 pb-24"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 bg-stone-200/50 dark:bg-white/5 rounded-[32px] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div
            key={currentDay}
            className={cn(
              'space-y-6',
              animationDirection === 'right'
                ? 'animate-slide-left'
                : animationDirection === 'left'
                  ? 'animate-slide-right'
                  : 'animate-fade-in'
            )}
          >
            {dailySlots.map(({ session, slots: currentSlots }, idx) => (
              <div key={session.id} className="relative pl-6">
                {/* Timeline Path */}
                {idx !== dailySlots.length - 1 && (
                  <div className="absolute left-[8px] top-10 bottom-[-24px] w-[1px] bg-gradient-to-b from-stone-300 dark:from-stone-700 to-transparent" />
                )}

                {/* Timeline Node */}
                <div
                  className={cn(
                    'absolute left-0 top-3 w-4 h-4 rounded-full border-2 z-10 transition-all duration-500',
                    currentSlots.length > 0
                      ? 'border-white dark:border-stone-900 bg-amber-500 shadow-[0_0_12px_rgba(245,166,35,0.4)]'
                      : 'border-stone-100 dark:border-stone-800 bg-stone-300 dark:bg-stone-700'
                  )}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <h3 className="font-black text-stone-900 dark:text-stone-100 text-lg tracking-tight leading-none mb-1">
                        {session.label}
                      </h3>
                      <div className="flex items-center gap-1.5 opacity-50">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {session.time}
                        </span>
                      </div>
                    </div>
                  </div>

                  {currentSlots.length > 0 ? (
                    <div className="space-y-3">
                      {currentSlots.map((slot: any) => (
                        <div
                          key={slot.id}
                          onClick={() => onEditSlot(slot)}
                          className={cn(
                            'relative overflow-hidden rounded-[28px] p-5 border-l-[6px] shadow-sm glass-premium transition-all active:scale-[0.97]',
                            getSlotStyles(slot)
                          )}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Context Badge */}
                              {viewMode === 'room' && slot.room && (
                                <div className="mb-2">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 uppercase tracking-widest">
                                    <MapPin className="w-2.5 h-2.5 mr-1" />
                                    {slot.room.split('-').pop()?.trim()}
                                  </span>
                                </div>
                              )}
                              <div className="font-black text-stone-900 dark:text-stone-100 text-lg leading-tight tracking-tight line-clamp-2">
                                {slot.class?.name || getDisplayName(slot.student) || 'N/A'}
                              </div>

                              {/* Status Badge */}
                              <div className="mt-1.5 flex items-center gap-2">
                                <span className={cn(
                                  "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                                  slot.status === 'completed' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" :
                                  slot.status === 'cancelled' ? "bg-red-500/10 text-red-600 border-red-500/30" :
                                  slot.status === 'makeup' ? "bg-sky-500/10 text-sky-600 border-sky-500/30" :
                                  "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                )}>
                                  {slot.status === 'completed' ? '🟢 Hoàn thành' :
                                   slot.status === 'cancelled' ? '🔴 Hủy ca' :
                                   slot.status === 'makeup' ? '🔵 Học bù' : '🟡 Đã xếp'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {slot.teacher?.phone && (
                                <a
                                  href={`tel:${slot.teacher.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-500/20 active:scale-95 transition-all"
                                  title="Gọi cho Giáo viên"
                                >
                                  <Phone size={16} />
                                </a>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditSlot(slot);
                                }}
                                className="w-10 h-10 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center text-stone-400 shadow-sm border border-stone-200/50 dark:border-white/5 active:bg-amber-500 active:text-white transition-all"
                              >
                                <Edit3 size={18} />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-stone-200/50 dark:border-white/5">
                            {slot.subject && (
                              <div className="flex items-center gap-1.5">
                                <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 font-black text-[11px] uppercase tracking-wider border border-amber-500/20 truncate">
                                  {slot.subject.name}
                                </span>
                              </div>
                            )}
                            {slot.teacher && (
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-xl bg-stone-500/10 dark:bg-white/10 flex items-center justify-center shrink-0">
                                  <Users className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                                </div>
                                <span className="truncate font-bold text-[11px] text-stone-600 dark:text-stone-300">
                                  {getDisplayName(slot.teacher).split(' ').pop()}
                                </span>
                              </div>
                            )}
                          </div>

                          {(slot.notes || slot.weekly_note) && (
                            <div className="mt-4 p-3 rounded-2xl bg-stone-500/5 dark:bg-white/5 border border-stone-200/30 dark:border-white/5 flex items-start gap-2">
                              <div className="mt-1 w-1 h-1 rounded-full bg-amber-500 shrink-0 shadow-[0_0_4px_rgba(245,166,35,0.8)]" />
                              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium italic line-clamp-1">
                                {slot.weekly_note || slot.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}

                      <button
                        onClick={() => onCreateSlot(currentDay, session)}
                        className="w-full h-12 border border-dashed border-stone-200 dark:border-white/5 rounded-[24px] flex items-center justify-center text-stone-400 transition-all active:scale-95 bg-transparent gap-2 text-[10px] font-black uppercase tracking-widest"
                      >
                        <Plus size={14} className="text-amber-500" />
                        Thêm tiết học
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onCreateSlot(currentDay, session)}
                      className="w-full h-24 border border-dashed border-stone-200 dark:border-white/5 rounded-[32px] flex flex-col items-center justify-center text-stone-400 hover:bg-amber-500 transition-all active:scale-95 gap-2 group bg-stone-500/3 dark:bg-white/3"
                    >
                      <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center group-hover:bg-white/20">
                        <Plus size={16} className="group-hover:text-white" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-white">
                        Trống - Chạm để thêm
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
