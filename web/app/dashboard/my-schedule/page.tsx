"use client";

import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { usePermissions } from "@/hooks/usePermissions";
import { apiFetch } from "@/lib/api/client";
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
    Layout
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

const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

const PERIODS = [
    { id: 1, label: "Sáng 1", time: "08:00 - 09:30", start: "08:00" },
    { id: 2, label: "Sáng 2", time: "09:30 - 11:00", start: "09:30" },
    { id: 3, label: "Chiều 1", time: "14:00 - 15:30", start: "14:00" },
    { id: 4, label: "Chiều 2", time: "15:30 - 17:00", start: "15:30" },
    { id: 5, label: "Ca 1", time: "17:00 - 18:30", start: "17:00" },
    { id: 6, label: "Ca 2", time: "18:30 - 20:00", start: "18:30" },
    { id: 7, label: "Ca 3", time: "20:00 - 21:30", start: "20:00" },
];

const SUBJECT_THEMES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    MATH: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-600", dot: "bg-blue-500" },
    LIT: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-600", dot: "bg-purple-500" },
    ENG: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-600", dot: "bg-emerald-500" },
    PHY: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-600", dot: "bg-orange-500" },
    CHEM: { bg: "bg-pink-500/10", border: "border-pink-500/20", text: "text-pink-600", dot: "bg-pink-500" },
    default: { bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-600", dot: "bg-indigo-500" },
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
            // Get current week start date (Monday)
            const start = new Date(currentWeek);
            start.setDate(start.getDate() - (start.getDay() === 0 ? 6 : start.getDay() - 1));
            const weekStartStr = start.toISOString().split('T')[0];

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

        // Use generalized isAdmin/isStaff check (inheritance-aware)
        // Admin/Staff can now view their own schedule too (if they teach/tutor)
        /* 
        if (isAdmin || isStaff) {
            window.location.href = '/dashboard/timetable';
            return;
        }
        */

        fetchMySchedule();
    }, [profileLoading, isAdmin, isStaff, currentWeek]);

    const getSlotForCell = (dayIndex: number, startTime: string): TimetableSlot | undefined => {
        return slots.find(
            (slot) => slot.day_of_week === dayIndex && slot.start_time?.substring(0, 5) === startTime
        );
    };

    const getTheme = (code?: string) => {
        return SUBJECT_THEMES[code || ""] || SUBJECT_THEMES.default;
    };

    const getWeekDates = () => {
        const start = new Date(currentWeek);
        start.setDate(start.getDate() - (start.getDay() === 0 ? 6 : start.getDay() - 1));
        return DAYS.map((_, i) => {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            return date;
        });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const weekDates = getWeekDates();

    if (profileLoading) return <LoadingState message="Xác thực quyền truy cập..." />;

    const titleText = (isAdmin || isStaff) ? "Lịch trình của tôi" : isStudent ? "Lịch học của tôi" : isTeacher ? "Lịch giảng dạy" : "Lịch trình";
    const totalSlots = slots.length;
    const uniqueSubjects = new Set(slots.map(s => s.subject?.name)).size;

    return (
        <div className="min-h-screen bg-[#F8F7F6] dark:bg-stone-950 p-4 sm:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section - Card Style */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-[#1C1917] p-8 rounded-[32px] border border-stone-200 dark:border-white/5 shadow-sm">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                <Layout className="w-5 h-5 text-indigo-500" />
                            </div>
                            <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none px-3 py-1 font-bold">CÁ NHÂN</Badge>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-stone-900 dark:text-white uppercase">
                            {titleText}
                        </h1>
                        <p className="text-stone-500 dark:text-stone-400 mt-2 max-w-lg font-medium text-base">
                            {isStudent ? "Theo dõi các tiết học và sự kiện trong tuần của bạn." : "Theo dõi các tiết dạy và kế hoạch giảng dạy trong tuần."}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-stone-100/80 dark:bg-white/5 p-1.5 rounded-full pr-2">
                        <Button
                            className="rounded-full px-6 h-10 bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md hover:shadow-lg transition-all"
                            onClick={() => setCurrentWeek(new Date())}
                        >
                            Hôm nay
                        </Button>
                        <div className="flex items-center gap-2 pl-2">
                            <button
                                onClick={() => {
                                    const prev = new Date(currentWeek);
                                    prev.setDate(prev.getDate() - 7);
                                    setCurrentWeek(prev);
                                }}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:bg-white hover:shadow-sm transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-black px-2 min-w-[140px] text-center text-stone-700 dark:text-stone-300">
                                Tháng {currentWeek.getMonth() + 1} / {currentWeek.getFullYear()}
                            </span>
                            <button
                                onClick={() => {
                                    const next = new Date(currentWeek);
                                    next.setDate(next.getDate() + 7);
                                    setCurrentWeek(next);
                                }}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:bg-white hover:shadow-sm transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                {!loading && slots.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: isStudent ? "Tiết học/tuần" : "Tiết dạy/tuần", value: totalSlots, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
                            { label: "Môn học", value: uniqueSubjects, icon: BookOpen, color: "text-purple-500", bg: "bg-purple-500/10" },
                            { label: isStudent ? "Số lớp học" : "Lớp & Học sinh", value: classes.length + (slots.filter(s => !!s.student_id).length > 0 ? 1 : 0), valueDisplay: isStudent ? classes.length : `${classes.length} lớp${slots.some(s => !!s.student_id) ? ' + học kèm' : ''}`, icon: GraduationCap, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                            { label: "Thời lượng", value: `${Math.round(totalSlots * 1.5)}h`, icon: Timer, color: "text-amber-500", bg: "bg-amber-500/10" },
                        ].map((stat, i) => (
                            <Card key={i} className="p-6 rounded-[24px] border-stone-100 hover:shadow-md transition-all group overflow-hidden relative">
                                <div className={cn("absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-50 group-hover:scale-110 transition-transform bg-stone-50", stat.bg)}></div>
                                <div className="relative relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-xs font-black text-stone-400 uppercase tracking-widest">{stat.label}</div>
                                        <stat.icon className={cn("w-5 h-5", stat.color)} />
                                    </div>
                                    <div className="text-3xl font-black text-stone-900 dark:text-white tracking-tighter">{(stat as any).valueDisplay || stat.value}</div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Main Schedule Grid & Empty State */}
                <div className="relative">
                    {loading ? (
                        <div className="h-[500px] flex items-center justify-center bg-white/50 dark:bg-stone-900/50 rounded-[40px] border-4 border-dashed border-stone-200 dark:border-white/5">
                            <LoadingState message="Đang đồng bộ..." />
                        </div>
                    ) : error ? (
                        <Alert variant="danger" title="Lỗi kết nối" className="rounded-[32px]">
                            {error}
                        </Alert>
                    ) : slots.length === 0 ? (
                        <div className="bg-white dark:bg-[#1C1917] rounded-[40px] border border-dashed border-stone-300 dark:border-white/10 p-12">
                            <EmptyState
                                title="Lịch trình trống"
                                description={isStudent ? "Tuần này bạn chưa có lịch học nào. Hãy tận hưởng thời gian nghỉ ngơi!" : "Chưa có tiết dạy nào được xếp trong tuần này."}
                                icon={<Calendar className="w-12 h-12 text-stone-400" />}
                                className="py-20"
                            />
                        </div>
                    ) : (
                        <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl rounded-[40px] shadow-sm border border-stone-200 dark:border-white/5 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1000px] border-collapse">
                                    <thead>
                                        <tr className="bg-stone-50/50 dark:bg-white/2">
                                            <th className="w-32 p-6 text-left">
                                                <div className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Khung giờ</div>
                                            </th>
                                            {DAYS.map((day, i) => (
                                                <th
                                                    key={day}
                                                    className={cn(
                                                        "p-6 text-center border-l border-stone-100 dark:border-white/5",
                                                        isToday(weekDates[i]) ? "bg-amber-500/5" : ""
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "text-xs font-black uppercase tracking-[0.1em] mb-1.5",
                                                        isToday(weekDates[i]) ? "text-amber-600" : "text-stone-400"
                                                    )}>{day}</div>
                                                    <div className={cn(
                                                        "text-base font-black px-3 py-1 rounded-xl inline-block transition-all",
                                                        isToday(weekDates[i]) ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30" : "text-stone-900 dark:text-white"
                                                    )}>
                                                        {weekDates[i].getDate()}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                                        {PERIODS.map((period) => (
                                            <tr key={period.id} className="group hover:bg-stone-50/50 dark:hover:bg-white/2 transition-colors">
                                                <td className="p-6 border-r border-stone-100 dark:border-white/5">
                                                    <div className="text-xs font-black text-stone-900 dark:text-stone-100 mb-1">{period.label}</div>
                                                    <div className="text-[10px] font-bold text-stone-400 whitespace-nowrap">{period.time}</div>
                                                </td>
                                                {DAYS.map((_, dayIndex) => {
                                                    const slot = getSlotForCell(dayIndex, period.start);
                                                    const theme = getTheme(slot?.subject?.code);
                                                    const isTutoring = !!slot?.student_id;

                                                    return (
                                                        <td
                                                            key={dayIndex}
                                                            className={cn(
                                                                "p-3 border-l border-stone-100 dark:border-white/5 align-top",
                                                                isToday(weekDates[dayIndex]) ? "bg-amber-500/[0.02]" : ""
                                                            )}
                                                        >
                                                            {slot ? (
                                                                <div className={cn(
                                                                    "p-4 rounded-[20px] border-2 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-lg bg-white",
                                                                    theme.border
                                                                )}>
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <div className={cn("w-2 h-2 rounded-full", theme.dot)} />
                                                                        <span className={cn("text-[10px] font-black uppercase tracking-widest", theme.text)}>
                                                                            {slot.subject?.code || "SUB"}
                                                                        </span>
                                                                        {slot.student_id && (
                                                                            <Badge className="ml-1 text-[8px] h-4 py-0 px-1.5 border border-amber-500/30 text-amber-600 bg-amber-50 shadow-none">Học kèm</Badge>
                                                                        )}
                                                                        {slot.has_weekly_note && (
                                                                            <div className="ml-auto bg-amber-500 text-white p-1 h-4 w-4 rounded-full flex items-center justify-center shrink-0" title="Tiết học đã được điều chỉnh ghi chú">
                                                                                <AlertCircle className="w-2.5 h-2.5" />
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="font-bold text-sm text-stone-900 dark:text-white mb-3 line-clamp-2 leading-tight">
                                                                        {slot.subject?.name}
                                                                    </div>

                                                                    <div className="space-y-1.5 border-t border-stone-100 pt-3 mt-3">
                                                                        {slot.class && !isTutoring && (
                                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-stone-500">
                                                                                <Building className="w-3 h-3 text-stone-400" />
                                                                                <span className="truncate">{slot.class.name}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-stone-500">
                                                                            {isStudent ? (
                                                                                <>
                                                                                    <GraduationCap className="w-3 h-3 text-indigo-400" />
                                                                                    <span className="truncate">GV: {slot.teacher?.full_name || "Chưa xác định"}</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Users className="w-3 h-3 text-stone-400" />
                                                                                    <span className="truncate">
                                                                                        {slot.student?.full_name ? `HS: ${slot.student.full_name}` : (slot.class?.name || "Chưa xác định")}
                                                                                    </span>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                        {slot.room && (
                                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-stone-500">
                                                                                <MapPin className="w-3 h-3 text-red-500" />
                                                                                <span className="font-bold text-stone-900">{slot.room}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {(slot.weekly_note || slot.notes) && (
                                                                        <div className="mt-3 pt-2 border-t border-dashed border-stone-200 dark:border-white/5 italic text-[9px] text-stone-400 font-medium font-medium">
                                                                            <div className="line-clamp-2">
                                                                                "{slot.weekly_note || slot.notes}"
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className={cn(
                                                                    "min-h-[120px] rounded-[24px] border border-dashed border-stone-100 hover:border-stone-200 transition-colors flex items-center justify-center group-hover/cell:opacity-100 opacity-0",
                                                                    isToday(weekDates[dayIndex]) ? "opacity-100 bg-white/50" : ""
                                                                )}>
                                                                    {isToday(weekDates[dayIndex]) && (
                                                                        <PlusIcon />
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Class List Summary */}
                {!loading && classes.length > 0 && (
                    <Card className="p-8 rounded-[32px] border-none bg-stone-100/50 dark:bg-white/5">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-white dark:bg-stone-800 rounded-2xl shadow-sm">
                                <BookOpen className="w-6 h-6 text-stone-700 dark:text-stone-300" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight">Danh sách lớp phụ trách</h3>
                                <p className="text-xs text-stone-500 font-bold uppercase tracking-widest mt-1">Thông tin chi tiết các đơn vị học tập</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {classes.map(c => (
                                <Badge
                                    key={c.id}
                                    className="px-6 py-3 rounded-2xl bg-white dark:bg-stone-800 border-none text-sm font-black text-stone-700 dark:text-stone-300 shadow-sm hover:shadow-md hover:scale-105 transition-all cursor-default"
                                >
                                    {c.name}
                                </Badge>
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}

function PlusIcon() {
    return (
        <svg className="w-5 h-5 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    )
}
