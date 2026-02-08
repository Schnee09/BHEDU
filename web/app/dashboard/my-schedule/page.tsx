"use client";

import { useState, useEffect, useMemo } from "react";
import { useProfile } from "@/hooks/useProfile";
import { usePermissions } from "@/hooks/usePermissions";
import { apiFetch } from "@/lib/api/client";
import { getStartOfWeek, isToday, getWeekDates, formatDateISO } from "@/lib/utils/date";
import {
    Calendar,
    Clock,
    MapPin,
    ChevronLeft,
    ChevronRight,
    Users,
    BookOpen,
    Building,
    AlertCircle,
    GraduationCap,
    Timer,
    Layout,
    Plus,
    CalendarDays,
} from "lucide-react";
import {
    Button,
    Card,
    Badge,
    LoadingState,
    Alert,
    EmptyState,
} from "@/components/ui";
import { cn } from "@/lib/utils";

interface TimetableSlot {
    id: string;
    class_id: string;
    student_id?: string;
    subject: { id: string; name: string; code: string } | null;
    teacher: { id: string; full_name: string } | null;
    student?: { id: string; full_name: string } | null;
    class?: { id: string; name: string } | null;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room: string | null;
    notes: string | null;
    weekly_note?: string | null;
    has_weekly_note?: boolean;
}

interface ClassInfo {
    id: string;
    name: string;
}

const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
const START_HOUR = 7;
const END_HOUR = 22;
const HOUR_SLOTS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

const SUBJECT_THEMES: Record<string, { bg: string; border: string; text: string; dot: string; shadow: string }> = {
    MATH: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-600", dot: "bg-blue-500", shadow: "shadow-blue-500/10" },
    LIT: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-600", dot: "bg-purple-500", shadow: "shadow-purple-500/10" },
    ENG: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-600", dot: "bg-emerald-500", shadow: "shadow-emerald-500/10" },
    PHY: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-600", dot: "bg-orange-500", shadow: "shadow-orange-500/10" },
    CHEM: { bg: "bg-pink-500/10", border: "border-pink-500/20", text: "text-pink-600", dot: "bg-pink-500", shadow: "shadow-pink-500/10" },
    default: { bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-600", dot: "bg-indigo-500", shadow: "shadow-indigo-500/10" },
};

export default function MySchedulePage() {
    const { profile, loading: profileLoading } = useProfile();
    const { isAdmin, isStaff, isTeacher, isStudent } = usePermissions();
    const [slots, setSlots] = useState<TimetableSlot[]>([]);
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [error, setError] = useState<string | null>(null);

    const fetchMySchedule = async () => {
        setLoading(true);
        setError(null);
        try {
            const weekStartStr = formatDateISO(getStartOfWeek(currentWeek));

            const response = await apiFetch(`/api/timetable/my?week_start_date=${weekStartStr}`);
            const data = await response.json();

            if (!data.success) {
                setError(data.error || 'Failed to fetch schedule');
                return;
            }

            setSlots(data.slots || []);
            setClasses(data.classes || []);
        } catch (err) {
            console.error("Failed to fetch schedule:", err);
            setError('Không thể kết nối đến máy chủ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (profileLoading) return;
        fetchMySchedule();
    }, [profileLoading, isAdmin, isStaff, currentWeek]);

    const weekDates = useMemo(() => getWeekDates(currentWeek), [currentWeek]);

    const getTheme = (code?: string) => {
        return SUBJECT_THEMES[code || ""] || SUBJECT_THEMES.default;
    };

    // Helper to calculate position in the dynamic grid
    const getPosition = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const totalMinutes = (hours - START_HOUR) * 60 + minutes;
        return (totalMinutes / 60) * 100; // Percentage from top
    };

    const getDuration = (start: string, end: string) => {
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;
        return ((endMinutes - startMinutes) / 60) * 100; // Percentage height
    };

    // Calculate overlap groups for a set of slots
    const calculateOverlap = (daySlots: TimetableSlot[]) => {
        const sorted = [...daySlots].sort((a, b) => a.start_time.localeCompare(b.start_time));
        const groups: TimetableSlot[][] = [];

        sorted.forEach(slot => {
            let placed = false;
            for (const group of groups) {
                const overlaps = group.some(s => {
                    const s1 = s.start_time;
                    const e1 = s.end_time;
                    const s2 = slot.start_time;
                    const e2 = slot.end_time;
                    return (s1 < e2 && s2 < e1);
                });
                if (overlaps) {
                    group.push(slot);
                    placed = true;
                    break;
                }
            }
            if (!placed) groups.push([slot]);
        });

        const slotMetadata = new Map<string, { width: number, offset: number }>();
        groups.forEach(group => {
            group.forEach((slot, index) => {
                slotMetadata.set(slot.id, {
                    width: 100 / group.length,
                    offset: (100 / group.length) * index
                });
            });
        });

        return slotMetadata;
    };

    if (profileLoading) return <LoadingState message="Xác thực quyền truy cập..." />;

    const titleText = (isAdmin || isStaff) ? "Lịch trình của tôi" : isStudent ? "Lịch học của tôi" : isTeacher ? "Lịch giảng dạy" : "Lịch trình";

    return (
        <div className="min-h-screen bg-[#F8F7F6] dark:bg-stone-950 p-4 sm:p-8 font-sans transition-colors duration-500">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header - BH EDU Pro Max Style */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-card p-10 rounded-[40px] border border-white/20 dark:border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                <CalendarDays className="w-6 h-6 text-white" />
                            </div>
                            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 px-4 py-1.5 font-black tracking-widest text-[10px] uppercase">Học vụ / Cá nhân</Badge>
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter text-stone-900 dark:text-white uppercase leading-none">
                            {titleText}
                        </h1>
                        <p className="text-stone-500 dark:text-stone-400 mt-4 max-w-lg font-medium text-lg leading-relaxed">
                            {isStudent ? "Theo dõi lịch học, lịch thi và các tiết học kèm của bạn." : "Quản lý lịch giảng dạy, các lớp phụ trách và ghi chú hằng tuần."}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-stone-100/50 dark:bg-white/5 p-2 rounded-[32px] border border-stone-200/50 dark:border-white/5 backdrop-blur-sm">
                        <Button
                            variant="primary"
                            className="rounded-full px-8 h-12 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
                            onClick={() => setCurrentWeek(new Date())}
                        >
                            Hôm nay
                        </Button>
                        <div className="flex items-center gap-4 px-4 py-2 bg-white dark:bg-stone-800 rounded-full shadow-sm border border-stone-100 dark:border-white/5">
                            <button
                                onClick={() => {
                                    const prev = new Date(currentWeek);
                                    prev.setDate(prev.getDate() - 7);
                                    setCurrentWeek(prev);
                                }}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-amber-500 hover:bg-amber-50 transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-black text-stone-700 dark:text-stone-200 min-w-[120px] text-center uppercase tracking-tighter">
                                Tháng {currentWeek.getMonth() + 1} / {currentWeek.getFullYear()}
                            </span>
                            <button
                                onClick={() => {
                                    const next = new Date(currentWeek);
                                    next.setDate(next.getDate() + 7);
                                    setCurrentWeek(next);
                                }}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-amber-500 hover:bg-amber-50 transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="h-[600px] flex flex-col items-center justify-center gap-4 bg-white/50 dark:bg-stone-900/50 rounded-[48px] border-4 border-dashed border-stone-200 dark:border-white/5">
                        <LoadingState message="Đang đồng bộ dữ liệu..." />
                    </div>
                ) : error ? (
                    <Alert variant="danger" title="Lỗi hệ thống" className="rounded-[32px] p-8 shadow-xl">
                        {error}
                        <Button variant="ghost" className="mt-4 underline" onClick={fetchMySchedule}>Thử lại ngay</Button>
                    </Alert>
                ) : slots.length === 0 ? (
                    <div className="bg-white dark:bg-[#1C1917] rounded-[48px] border border-dashed border-stone-300 dark:border-white/10 p-20 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-30" />
                        <EmptyState
                            title="Lịch trình tuần này trống"
                            description={isStudent ? "Tuyệt quá! Bạn chưa có lịch học nào trong tuần này. Hãy dành thời gian này để nghỉ ngơi hoặc tự ôn tập nhé." : "Hiện chưa có tiết dạy nào được xếp cho bạn trong tuần này. Nếu thấy sai sót, vui lòng liên hệ admin."}
                            icon={<Calendar className="w-16 h-16 text-amber-200 mb-6" />}
                            className="py-10"
                        />
                    </div>
                ) : (
                    <div className="glass-card rounded-[48px] shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden transition-all duration-700">
                        <div className="overflow-x-auto scrollbar-hide">
                            <div className="min-w-[1100px] relative">
                                {/* Timeline Background Grid */}
                                <div className="absolute inset-0 pt-[80px]">
                                    {HOUR_SLOTS.map((hour) => (
                                        <div key={hour} className="h-[100px] border-t border-stone-100 dark:border-white/5 flex items-start group">
                                            <span className="w-16 text-right pr-4 py-2 text-[10px] font-black text-stone-300 dark:text-stone-600 group-hover:text-amber-500 transition-colors">
                                                {hour}:00
                                            </span>
                                            <div className="flex-1 h-full border-l border-stone-100 dark:border-white/5" />
                                        </div>
                                    ))}
                                </div>

                                {/* Header Days */}
                                <div className="h-[80px] bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur-xl border-b border-stone-200 dark:border-white/5 sticky top-0 z-30 flex items-center">
                                    <div className="w-16 shrink-0" />
                                    <div className="flex-1 grid grid-cols-7 h-full">
                                        {DAYS.map((day, i) => (
                                            <div
                                                key={day}
                                                className={cn(
                                                    "flex flex-col items-center justify-center border-l border-stone-100 dark:border-white/5 transition-colors",
                                                    isToday(weekDates[i]) ? "bg-amber-500/5" : ""
                                                )}
                                            >
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest mb-1",
                                                    isToday(weekDates[i]) ? "text-amber-600" : "text-stone-400"
                                                )}>{day}</span>
                                                <div className={cn(
                                                    "text-lg font-black w-10 h-10 flex items-center justify-center rounded-2xl transition-all",
                                                    isToday(weekDates[i]) ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30" : "text-stone-900 dark:text-stone-100"
                                                )}>{weekDates[i].getDate()}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Slots Container */}
                                <div className="relative z-10 h-[calc(100px*16)]">
                                    <div className="flex pl-16 h-full">
                                        {DAYS.map((_, dayIndex) => {
                                            const daySlots = slots.filter(s => s.day_of_week === dayIndex);
                                            const overlapData = calculateOverlap(daySlots);

                                            return (
                                                <div key={dayIndex} className="flex-1 relative border-l border-stone-100 dark:border-white/5 min-h-full group hover:bg-stone-50/30 dark:hover:bg-white/2 transition-colors">
                                                    {daySlots.map((slot) => {
                                                        const top = getPosition(slot.start_time);
                                                        const height = getDuration(slot.start_time, slot.end_time);
                                                        const theme = getTheme(slot.subject?.code);
                                                        const isTutoring = !!slot.student_id;
                                                        const meta = overlapData.get(slot.id) || { width: 100, offset: 0 };

                                                        return (
                                                            <div
                                                                key={slot.id}
                                                                className="absolute transition-all duration-300 z-10 group/slot"
                                                                style={{
                                                                    top: `${(top / 60) * 100}px`,
                                                                    height: `${(height / 60) * 100}px`,
                                                                    left: `${meta.offset}%`,
                                                                    width: `${meta.width}%`,
                                                                    minHeight: '60px'
                                                                }}
                                                            >
                                                                <div className={cn(
                                                                    "w-full h-full p-3 rounded-[24px] border-2 bg-white dark:bg-stone-900 shadow-sm group-hover/slot:shadow-xl group-hover/slot:-translate-y-1 transition-all duration-300 overflow-hidden relative",
                                                                    theme.border, theme.shadow
                                                                )}>
                                                                    <div className={cn("absolute top-0 right-0 w-16 h-16 opacity-10 rounded-full -mr-8 -mt-8", theme.dot)} />

                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <div className={cn("w-2 h-2 rounded-full", theme.dot)} />
                                                                        <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", theme.text)}>
                                                                            {slot.subject?.code || "BH-EDU"}
                                                                        </span>
                                                                        {isTutoring && (
                                                                            <Badge className="h-4 p-0 px-1.5 text-[7px] bg-amber-500 text-white border-none shadow-sm">KÈM</Badge>
                                                                        )}
                                                                    </div>

                                                                    <div className="text-xs font-black text-stone-900 dark:text-white leading-tight mb-2 line-clamp-2">
                                                                        {slot.subject?.name}
                                                                    </div>

                                                                    <div className="grid grid-cols-1 gap-1.5 opacity-80">
                                                                        <div className="flex items-center gap-2 text-[9px] font-bold text-stone-500">
                                                                            <Clock className="w-3 h-3 text-stone-400" />
                                                                            <span>{slot.start_time} - {slot.end_time}</span>
                                                                        </div>
                                                                        {slot.room && (
                                                                            <div className="flex items-center gap-2 text-[9px] font-bold text-stone-500">
                                                                                <MapPin className="w-3 h-3 text-red-400" />
                                                                                <span className="text-stone-900 dark:text-stone-300">{slot.room}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex items-center gap-2 text-[9px] font-bold text-stone-500">
                                                                            <Users className="w-3 h-3 text-emerald-400" />
                                                                            <span className="truncate">{isStudent ? `GV: ${slot.teacher?.full_name}` : (slot.student?.full_name || slot.class?.name || "Lớp học")}</span>
                                                                        </div>
                                                                    </div>

                                                                    {(slot.weekly_note || slot.notes) && (
                                                                        <div className="absolute bottom-2 right-2 group/note">
                                                                            <AlertCircle className="w-4 h-4 text-amber-400 opacity-50 group-hover/note:opacity-100 transition-opacity" />
                                                                            <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-stone-900 text-white text-[10px] rounded-2xl opacity-0 group-hover/note:opacity-100 pointer-events-none transition-all shadow-2xl z-50">
                                                                                <p className="font-bold mb-1 text-amber-400">Ghi chú tiết học:</p>
                                                                                {slot.weekly_note || slot.notes}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Legend */}
                {!loading && slots.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-10 py-6">
                        {Object.entries(SUBJECT_THEMES).filter(([k]) => k !== 'default').map(([key, theme]) => (
                            <div key={key} className="flex items-center gap-3">
                                <div className={cn("w-3 h-3 rounded-full shadow-lg", theme.dot)} />
                                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{key}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx global>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(20px);
                }
                .dark .glass-card {
                    background: rgba(28, 25, 23, 0.7);
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-in {
                    animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
}
