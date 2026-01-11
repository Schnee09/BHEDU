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
} from "lucide-react";

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
    { id: 1, label: "Tiết 1", time: "7:30 - 8:15", start: "07:30" },
    { id: 2, label: "Tiết 2", time: "8:15 - 9:00", start: "08:15" },
    { id: 3, label: "Tiết 3", time: "9:00 - 9:45", start: "09:00" },
    { id: 4, label: "Tiết 4", time: "10:00 - 10:45", start: "10:00" },
    { id: 5, label: "Tiết 5", time: "10:45 - 11:30", start: "10:45" },
    { id: 6, label: "Tiết 6", time: "13:00 - 13:45", start: "13:00" },
    { id: 7, label: "Tiết 7", time: "13:45 - 14:30", start: "13:45" },
    { id: 8, label: "Tiết 8", time: "14:30 - 15:15", start: "14:30" },
    { id: 9, label: "Tiết 9", time: "15:30 - 16:15", start: "15:30" },
    { id: 10, label: "Tiết 10", time: "16:15 - 17:00", start: "16:15" },
];

const SUBJECT_COLORS: Record<string, string> = {
    MATH: "bg-blue-100 border-blue-300 text-blue-800",
    LIT: "bg-purple-100 border-purple-300 text-purple-800",
    ENG: "bg-emerald-100 border-emerald-300 text-emerald-800",
    PHY: "bg-orange-100 border-orange-300 text-orange-800",
    CHEM: "bg-pink-100 border-pink-300 text-pink-800",
    OTHER: "bg-gray-100 border-gray-300 text-gray-800",
    default: "bg-indigo-100 border-indigo-300 text-indigo-800",
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
            setError('Không thể tải lịch học');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (profileLoading) return;
        if (profile?.role === "admin" || profile?.role === "staff") {
            // Redirect admin to management page
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

    const getSubjectColor = (code?: string) => {
        return SUBJECT_COLORS[code || ""] || SUBJECT_COLORS.default;
    };

    const getWeekDates = () => {
        const start = new Date(currentWeek);
        start.setDate(start.getDate() - start.getDay() + 1);
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

    if (profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    const title = isStudent ? "Lịch học của tôi" : isTeacher ? "Lịch giảng dạy" : "Lịch học";
    const totalSlots = slots.length;
    const uniqueSubjects = new Set(slots.map(s => s.subject?.name)).size;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <span className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-xl">
                            <Calendar className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </span>
                        {title}
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        {isStudent && "Xem lịch học các môn bạn đã đăng ký trong tuần"}
                        {isTeacher && "Xem lịch các tiết bạn đang giảng dạy trong tuần"}
                    </p>
                </div>

                {/* Stats cards */}
                {!loading && slots.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="text-2xl font-bold text-indigo-600">{totalSlots}</div>
                            <div className="text-sm text-gray-500">Tiết/tuần</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="text-2xl font-bold text-emerald-600">{uniqueSubjects}</div>
                            <div className="text-sm text-gray-500">Môn học</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="text-2xl font-bold text-purple-600">{classes.length}</div>
                            <div className="text-sm text-gray-500">{isStudent ? "Lớp" : "Lớp dạy"}</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="text-2xl font-bold text-amber-600">{Math.round(totalSlots * 45 / 60)}h</div>
                            <div className="text-sm text-gray-500">Thời lượng</div>
                        </div>
                    </div>
                )}

                {/* Week navigation */}
                <div className="flex items-center justify-between mb-6 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => {
                            const prev = new Date(currentWeek);
                            prev.setDate(prev.getDate() - 7);
                            setCurrentWeek(prev);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="text-center">
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            {weekDates[0].toLocaleDateString("vi-VN", { day: "2-digit", month: "long" })} - {weekDates[6].toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" })}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentWeek(new Date())}
                            className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 rounded-lg font-medium hover:bg-indigo-200 transition-colors"
                        >
                            Tuần này
                        </button>
                        <button
                            onClick={() => {
                                const next = new Date(currentWeek);
                                next.setDate(next.getDate() + 7);
                                setCurrentWeek(next);
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Schedule Grid */}
                {loading ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-lg">
                        <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" />
                        <p className="mt-4 text-gray-500">Đang tải lịch học...</p>
                    </div>
                ) : error ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-lg">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <p className="text-red-500">{error}</p>
                    </div>
                ) : slots.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-lg">
                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg font-medium">
                            {isStudent ? "Bạn chưa được xếp lịch học" : "Bạn chưa được phân công giảng dạy"}
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                            Liên hệ phòng đào tạo nếu có thắc mắc
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px]">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                                        <th className="w-28 p-4 text-left text-sm font-semibold">
                                            <Clock className="w-4 h-4 inline mr-2" />Tiết
                                        </th>
                                        {DAYS.map((day, i) => (
                                            <th
                                                key={day}
                                                className={`p-4 text-center min-w-[120px] ${isToday(weekDates[i]) ? 'bg-white/20' : ''}`}
                                            >
                                                <div className="font-bold">{day}</div>
                                                <div className={`text-xs ${isToday(weekDates[i]) ? 'bg-white text-indigo-600 rounded-full px-2 py-0.5 inline-block mt-1' : 'opacity-80'}`}>
                                                    {weekDates[i].toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {PERIODS.map((period) => (
                                        <tr key={period.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                                            <td className="p-3 text-center border-r border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                                <div className="text-sm font-bold text-gray-700 dark:text-gray-300">{period.label}</div>
                                                <div className="text-xs text-gray-500">{period.time}</div>
                                            </td>
                                            {DAYS.map((_, dayIndex) => {
                                                const slot = getSlotForCell(dayIndex, period.start);

                                                return (
                                                    <td key={dayIndex} className={`p-1.5 ${isToday(weekDates[dayIndex]) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                                                        {slot ? (
                                                            <div className={`p-3 rounded-xl border-2 ${getSubjectColor(slot.subject?.code)} shadow-sm`}>
                                                                <div className="font-bold text-sm">
                                                                    {slot.subject?.name || "N/A"}
                                                                </div>
                                                                {slot.class && (
                                                                    <div className="flex items-center gap-1 text-xs mt-1.5 opacity-80">
                                                                        <Building className="w-3 h-3" />
                                                                        {slot.class.name}
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-1 text-xs mt-1 opacity-75">
                                                                    <Users className="w-3 h-3" />
                                                                    <span className="truncate">{slot.teacher?.full_name || "TBA"}</span>
                                                                </div>
                                                                {slot.room && (
                                                                    <div className="flex items-center gap-1 text-xs mt-1 opacity-60">
                                                                        <MapPin className="w-3 h-3" />
                                                                        <span className="font-semibold">{slot.room}</span>
                                                                    </div>
                                                                )}
                                                                {slot.notes && (
                                                                    <div className="mt-2 text-xs bg-white/50 dark:bg-gray-900/30 rounded p-1 italic">
                                                                        📝 {slot.notes}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="h-20 rounded-xl" />
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

                {/* Classes list */}
                {!loading && classes.length > 0 && (
                    <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                            {isStudent ? "📚 Lớp đang học" : "📚 Lớp đang dạy"}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {classes.map(c => (
                                <span
                                    key={c.id}
                                    className="px-3 py-1.5 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 dark:from-indigo-900 dark:to-purple-900 dark:text-indigo-300 rounded-full text-sm font-medium"
                                >
                                    {c.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
