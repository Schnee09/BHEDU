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

interface ClassOption {
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
    default: "bg-slate-100 border-slate-300 text-slate-800",
};

export default function TimetablePage() {
    const { profile, loading: profileLoading } = useProfile();
    const [slots, setSlots] = useState<TimetableSlot[]>([]);
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [currentWeek, setCurrentWeek] = useState(new Date());

    const isAdmin = profile?.role === "admin" || profile?.role === "staff";

    // Fetch timetable based on role
    const fetchTimetable = async () => {
        setLoading(true);
        try {
            if (isAdmin && selectedClass) {
                // Admin: Fetch for selected class
                const response = await apiFetch(`/api/timetable?class_id=${selectedClass}`);
                const data = await response.json();
                setSlots(data.slots || []);
            } else if (!isAdmin) {
                // Student/Teacher: Fetch their own timetable
                const response = await apiFetch('/api/timetable/my');
                const data = await response.json();
                setSlots(data.slots || []);
                setClasses(data.classes || []);
            }
        } catch (error) {
            console.error("Failed to fetch timetable:", error);
            setSlots([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        if (!isAdmin) return;
        try {
            const response = await apiFetch("/api/classes");
            const data = await response.json();
            setClasses(data.classes || []);
            if (data.classes?.length > 0) {
                setSelectedClass(data.classes[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch classes:", error);
        }
    };

    useEffect(() => {
        if (profileLoading) return;
        if (isAdmin) {
            fetchClasses();
        } else {
            fetchTimetable();
        }
    }, [profileLoading, isAdmin]);

    useEffect(() => {
        if (isAdmin && selectedClass) {
            fetchTimetable();
        }
    }, [selectedClass, isAdmin]);

    const getSlotForCell = (dayIndex: number, startTime: string): TimetableSlot | undefined => {
        return slots.find(
            (slot) => slot.day_of_week === dayIndex && slot.start_time === startTime
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

    const weekDates = getWeekDates();

    if (profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    const roleLabel = profile?.role === "student" ? "Thời khóa biểu của bạn"
        : profile?.role === "teacher" ? "Lịch giảng dạy"
            : "Quản lý thời khóa biểu";

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Calendar className="w-8 h-8 text-indigo-600" />
                            {roleLabel}
                        </h1>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                            {profile?.role === "student" && "Xem lịch học các lớp bạn đã đăng ký"}
                            {profile?.role === "teacher" && "Xem lịch các tiết bạn đang giảng dạy"}
                            {isAdmin && "Chọn lớp để xem và quản lý thời khóa biểu"}
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    {/* Class selector - Admin only */}
                    {isAdmin && (
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200 font-medium"
                        >
                            <option value="">Chọn lớp</option>
                            {classes.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    )}

                    {/* Show enrolled classes for students */}
                    {!isAdmin && classes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {classes.map(c => (
                                <span key={c.id} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                                    {c.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Week navigation */}
                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            onClick={() => {
                                const prev = new Date(currentWeek);
                                prev.setDate(prev.getDate() - 7);
                                setCurrentWeek(prev);
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[200px] text-center">
                            {weekDates[0].toLocaleDateString("vi-VN")} - {weekDates[6].toLocaleDateString("vi-VN")}
                        </span>
                        <button
                            onClick={() => {
                                const next = new Date(currentWeek);
                                next.setDate(next.getDate() + 7);
                                setCurrentWeek(next);
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setCurrentWeek(new Date())}
                            className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-lg"
                        >
                            Tuần này
                        </button>
                    </div>
                </div>

                {/* Timetable Grid */}
                {loading ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" />
                        <p className="mt-4 text-gray-500">Đang tải thời khóa biểu...</p>
                    </div>
                ) : (isAdmin && !selectedClass) ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Chọn một lớp để xem thời khóa biểu</p>
                    </div>
                ) : slots.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">
                            {profile?.role === "student" && "Bạn chưa có lịch học nào"}
                            {profile?.role === "teacher" && "Bạn chưa được phân công giảng dạy"}
                            {isAdmin && "Lớp này chưa có thời khóa biểu"}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px]">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-750">
                                        <th className="w-32 p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">
                                            <Clock className="w-4 h-4 inline mr-1" /> Tiết
                                        </th>
                                        {DAYS.map((day, i) => (
                                            <th key={day} className="p-3 text-center min-w-[120px]">
                                                <div className="text-sm font-bold text-gray-900 dark:text-white">{day}</div>
                                                <div className="text-xs text-gray-500">
                                                    {weekDates[i].toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {PERIODS.map((period) => (
                                        <tr key={period.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                                            <td className="p-2 text-center border-r border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                                <div className="text-sm font-bold text-gray-700 dark:text-gray-300">{period.label}</div>
                                                <div className="text-xs text-gray-500">({period.time})</div>
                                            </td>
                                            {DAYS.map((_, dayIndex) => {
                                                const slot = getSlotForCell(dayIndex, period.start);

                                                return (
                                                    <td key={dayIndex} className="p-1">
                                                        {slot ? (
                                                            <div className={`p-2 rounded-lg border-2 ${getSubjectColor(slot.subject?.code)}`}>
                                                                <div className="font-bold text-sm">
                                                                    {slot.subject?.name || "N/A"}
                                                                </div>
                                                                {slot.class && (
                                                                    <div className="text-xs mt-1 opacity-80">
                                                                        <Building className="w-3 h-3 inline mr-1" />
                                                                        {slot.class.name}
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-1 text-xs mt-1 opacity-75">
                                                                    <Users className="w-3 h-3" />
                                                                    <span className="truncate">{slot.teacher?.full_name || "Chưa phân công"}</span>
                                                                </div>
                                                                {slot.room && (
                                                                    <div className="flex items-center gap-1 text-xs mt-0.5 opacity-60">
                                                                        <MapPin className="w-3 h-3" />
                                                                        <span className="font-semibold">{slot.room}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="h-16 rounded-lg" />
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

                {/* Info panel */}
                {!isAdmin && slots.length > 0 && (
                    <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                        <h3 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-2">
                            📚 Tổng quan
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                                <div className="text-2xl font-bold text-indigo-600">{slots.length}</div>
                                <div className="text-gray-500">Tiết học/tuần</div>
                            </div>
                            <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                                <div className="text-2xl font-bold text-emerald-600">{classes.length}</div>
                                <div className="text-gray-500">{profile?.role === "student" ? "Lớp đăng ký" : "Lớp giảng dạy"}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
