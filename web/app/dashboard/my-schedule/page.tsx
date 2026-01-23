"use client";

import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
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
    subject: { id: string; name: string; code: string } | null;
    teacher: { id: string; full_name: string } | null;
    class?: { id: string; name: string } | null;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room: string | null;
    notes: string | null;
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
    const [slots, setSlots] = useState<TimetableSlot[]>([]);
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [error, setError] = useState<string | null>(null);

    const isStudent = profile?.role === "student";
    const isTeacher = profile?.role === "teacher";

    const fetchMySchedule = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiFetch('/api/timetable/my');
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
        if (profile?.role === "admin" || profile?.role === "staff") {
            window.location.href = '/dashboard/timetable';
            return;
        }
        fetchMySchedule();
    }, [profileLoading, profile?.role]);

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

    const title = isStudent ? "Lịch học của tôi" : isTeacher ? "Lịch giảng dạy" : "Lịch trình";
    const totalSlots = slots.length;
    const uniqueSubjects = new Set(slots.map(s => s.subject?.name)).size;

    return (
        <div className="min-h-screen bg-gray-50/30 dark:bg-gray-900/30 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-gray-800/80 p-8 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-premium backdrop-blur-md">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <Layout className="w-5 h-5 text-indigo-500" />
                            </div>
                            <Badge variant="indigo" className="font-black">CÁ NHÂN</Badge>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white uppercase">
                            {title}
                        </h1>
                        <p className="text-muted mt-2 max-w-lg font-medium">
                            {isStudent ? "Xem và quản lý lịch học các môn bạn đã đăng ký." : "Theo dõi các tiết dạy và kế hoạch giảng dạy trong tuần."}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-100 dark:bg-white/5 p-1.5 rounded-2xl">
                        <Button 
                            variant="primary" 
                            size="sm" 
                            className="rounded-xl px-5"
                            onClick={() => setCurrentWeek(new Date())}
                        >
                            Hôm nay
                        </Button>
                        <div className="flex items-center">
                            <Button variant="ghost" size="sm" onClick={() => {
                                const prev = new Date(currentWeek);
                                prev.setDate(prev.getDate() - 7);
                                setCurrentWeek(prev);
                            }}>
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <span className="text-sm font-black px-4 min-w-[120px] text-center">
                                T.{currentWeek.getMonth() + 1} / {currentWeek.getFullYear()}
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => {
                                const next = new Date(currentWeek);
                                next.setDate(next.getDate() + 7);
                                setCurrentWeek(next);
                            }}>
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                {!loading && slots.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: "Tiết/tuần", value: totalSlots, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
                            { label: "Môn học", value: uniqueSubjects, icon: BookOpen, color: "text-purple-500", bg: "bg-purple-500/10" },
                            { label: isStudent ? "Lớp đang học" : "Lớp đang dạy", value: classes.length, icon: GraduationCap, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                            { label: "Thời lượng", value: `${Math.round(totalSlots * 1.5)}h`, icon: Timer, color: "text-amber-500", bg: "bg-amber-500/10" },
                        ].map((stat, i) => (
                            <Card key={i} variant="premium" className="relative group overflow-hidden">
                                <div className={cn("absolute top-0 right-0 p-3 rounded-bl-3xl transition-transform group-hover:scale-110", stat.bg)}>
                                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                                </div>
                                <div className="p-1 text-sm font-black text-muted uppercase tracking-[0.2em] mb-1">{stat.label}</div>
                                <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{stat.value}</div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Main Schedule Grid */}
                <div className="relative">
                    {loading ? (
                        <div className="h-[500px] flex items-center justify-center bg-white/50 dark:bg-gray-800/50 rounded-[40px] border-4 border-dashed border-gray-100 dark:border-white/5">
                            <LoadingState message="Đang đồng bộ lịch trình..." />
                        </div>
                    ) : error ? (
                        <Alert variant="danger" title="Lỗi hệ thống" className="rounded-3xl">
                            {error}
                        </Alert>
                    ) : slots.length === 0 ? (
                        <EmptyState 
                            title="Lịch trình trống" 
                            description={isStudent ? "Bạn chưa có tiết học nào được xếp trong tuần này." : "Chưa có tiết chuẩn bị giảng dạy nào."}
                            icon={<Calendar className="w-12 h-12" />}
                            className="bg-white/50 dark:bg-gray-800/50"
                        />
                    ) : (
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[40px] shadow-premium-lg border border-gray-100 dark:border-white/5 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1000px] border-collapse">
                                    <thead>
                                        <tr className="bg-gray-500/5 dark:bg-white/2">
                                            <th className="w-32 p-6 text-left">
                                                <div className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Khung giờ</div>
                                            </th>
                                            {DAYS.map((day, i) => (
                                                <th 
                                                    key={day} 
                                                    className={cn(
                                                        "p-6 text-center border-l border-gray-100 dark:border-white/5",
                                                        isToday(weekDates[i]) ? "bg-primary/5" : ""
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "text-xs font-black uppercase tracking-[0.1em] mb-1.5",
                                                        isToday(weekDates[i]) ? "text-primary" : "text-muted"
                                                    )}>{day}</div>
                                                    <div className={cn(
                                                        "text-base font-black px-3 py-1 rounded-xl inline-block transition-all",
                                                        isToday(weekDates[i]) ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-gray-900 dark:text-white"
                                                    )}>
                                                        {weekDates[i].getDate()}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {PERIODS.map((period) => (
                                            <tr key={period.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                                                <td className="p-6 border-r border-gray-100 dark:border-white/5">
                                                    <div className="text-xs font-black text-gray-900 dark:text-gray-100 mb-1">{period.label}</div>
                                                    <div className="text-[10px] font-bold text-muted whitespace-nowrap">{period.time}</div>
                                                </td>
                                                {DAYS.map((_, dayIndex) => {
                                                    const slot = getSlotForCell(dayIndex, period.start);
                                                    const theme = getTheme(slot?.subject?.code);

                                                    return (
                                                        <td 
                                                            key={dayIndex} 
                                                            className={cn(
                                                                "p-3 border-l border-gray-100 dark:border-white/5 align-top",
                                                                isToday(weekDates[dayIndex]) ? "bg-primary/[0.02]" : ""
                                                            )}
                                                        >
                                                            {slot ? (
                                                                <div className={cn(
                                                                    "p-4 rounded-3xl border-2 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-lg",
                                                                    theme.bg, theme.border
                                                                )}>
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <div className={cn("w-1.5 h-1.5 rounded-full", theme.dot)} />
                                                                        <span className={cn("text-[10px] font-black uppercase tracking-widest", theme.text)}>
                                                                            {slot.subject?.code || "SUB"}
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    <div className="font-black text-sm text-gray-900 dark:text-white mb-3 line-clamp-2 leading-tight">
                                                                        {slot.subject?.name}
                                                                    </div>

                                                                    <div className="space-y-1.5">
                                                                        {slot.class && (
                                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted">
                                                                                <Building className="w-3 h-3 text-primary" />
                                                                                <span>{slot.class.name}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted">
                                                                            <Users className="w-3 h-3 text-primary" />
                                                                            <span className="truncate">{slot.teacher?.full_name || "Chưa xác định"}</span>
                                                                        </div>
                                                                        {slot.room && (
                                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted">
                                                                                <MapPin className="w-3 h-3 text-red-500" />
                                                                                <span className="font-black">{slot.room}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {slot.notes && (
                                                                        <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 italic text-[9px] text-muted font-medium line-clamp-2">
                                                                            " {slot.notes} "
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="min-h-[100px] rounded-3xl group-hover:bg-primary/[0.01] transition-colors" />
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
                    <Card variant="glass" className="p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-primary/10 rounded-2xl">
                                <BookOpen className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Danh sách lớp phụ trách</h3>
                                <p className="text-xs text-muted font-bold uppercase tracking-widest mt-1">Thông tin chi tiết các đơn vị học tập</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {classes.map(c => (
                                <Badge 
                                    key={c.id} 
                                    className="px-6 py-3 rounded-2xl bg-white dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 text-sm font-black text-gray-700 dark:text-gray-300 shadow-sm hover:scale-105 transition-transform cursor-default"
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
