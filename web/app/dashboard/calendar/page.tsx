"use client";

import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { apiFetch } from "@/lib/api/client";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    Filter,
    BookOpen,
    Clock,
    Flag,
    AlertCircle,
    PartyPopper,
} from "lucide-react";

interface CalendarEvent {
    id: string;
    title: string;
    description: string | null;
    event_type: string;
    start_date: string;
    end_date: string | null;
    start_time: string | null;
    end_time: string | null;
    is_all_day: boolean;
    color: string;
}

const EVENT_TYPES = {
    general: { label: "Chung", icon: CalendarIcon, color: "#6366f1" },
    exam: { label: "Kiểm tra", icon: BookOpen, color: "#ef4444" },
    holiday: { label: "Nghỉ lễ", icon: PartyPopper, color: "#22c55e" },
    meeting: { label: "Họp", icon: Clock, color: "#f59e0b" },
    deadline: { label: "Deadline", icon: AlertCircle, color: "#ec4899" },
};

export default function AcademicCalendarPage() {
    const { profile, loading: profileLoading } = useProfile();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<"month" | "list">("month");
    const [filterType, setFilterType] = useState<string>("all");

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const response = await apiFetch(`/api/calendar?year=${year}&month=${month}`);
            const data = await response.json();
            setEvents(data.events || []);
        } catch (error) {
            console.error("Failed to fetch calendar events:", error);
            // Mock data for demo
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            setEvents([
                { id: "1", title: "Khai giảng năm học mới", description: "Lễ khai giảng", event_type: "general", start_date: `${year}-09-05`, end_date: null, start_time: "07:30", end_time: "09:00", is_all_day: false, color: "#6366f1" },
                { id: "2", title: "Nghỉ lễ Quốc khánh", description: "Nghỉ lễ 2/9", event_type: "holiday", start_date: `${year}-09-02`, end_date: null, start_time: null, end_time: null, is_all_day: true, color: "#22c55e" },
                { id: "3", title: "Kiểm tra giữa kỳ", description: "Kiểm tra các môn", event_type: "exam", start_date: `${year}-${String(month + 1).padStart(2, "0")}-15`, end_date: `${year}-${String(month + 1).padStart(2, "0")}-20`, start_time: null, end_time: null, is_all_day: true, color: "#ef4444" },
                { id: "4", title: "Họp phụ huynh", description: "Họp phụ huynh học kỳ 1", event_type: "meeting", start_date: `${year}-${String(month + 1).padStart(2, "0")}-25`, end_date: null, start_time: "14:00", end_time: "16:00", is_all_day: false, color: "#f59e0b" },
                { id: "5", title: "Nộp báo cáo", description: "Deadline nộp báo cáo", event_type: "deadline", start_date: `${year}-${String(month + 1).padStart(2, "0")}-28`, end_date: null, start_time: "17:00", end_time: null, is_all_day: false, color: "#ec4899" },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [currentDate]);

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay() || 7; // Monday = 1

        const days: (Date | null)[] = [];

        // Add empty cells for days before the first of the month
        for (let i = 1; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const getEventsForDate = (date: Date) => {
        const dateStr = date.toISOString().split("T")[0];
        return events.filter((event) => {
            const start = event.start_date;
            const end = event.end_date || event.start_date;
            return dateStr >= start && dateStr <= end;
        }).filter((event) => filterType === "all" || event.event_type === filterType);
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const filteredEvents = filterType === "all"
        ? events
        : events.filter((e) => e.event_type === filterType);

    if (profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lịch học tập</h1>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">Xem sự kiện và lịch trình</p>
                    </div>

                    {profile?.role === "admin" && (
                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
                            <Plus className="w-4 h-4" />
                            Thêm sự kiện
                        </button>
                    )}
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    {/* Month Navigation */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[180px] text-center">
                            {currentDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
                        </span>
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="ml-2 px-3 py-1 text-sm bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-lg"
                        >
                            Hôm nay
                        </button>
                    </div>

                    {/* View Toggle */}
                    <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg ml-auto">
                        <button
                            onClick={() => setViewMode("month")}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === "month"
                                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400"
                                }`}
                        >
                            Tháng
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === "list"
                                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400"
                                }`}
                        >
                            Danh sách
                        </button>
                    </div>

                    {/* Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                        >
                            <option value="all">Tất cả</option>
                            {Object.entries(EVENT_TYPES).map(([key, { label }]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border p-12 text-center">
                        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" />
                    </div>
                ) : viewMode === "month" ? (
                    /* Month View */
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {/* Day Headers */}
                        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700">
                            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
                                <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7">
                            {getDaysInMonth().map((date, index) => (
                                <div
                                    key={index}
                                    className={`min-h-[120px] p-2 border-b border-r border-gray-50 dark:border-gray-700/50 ${date ? "hover:bg-gray-50 dark:hover:bg-gray-700/30" : "bg-gray-50 dark:bg-gray-800/50"
                                        }`}
                                >
                                    {date && (
                                        <>
                                            <div className={`text-sm font-medium mb-1 ${isToday(date)
                                                    ? "w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center"
                                                    : "text-gray-900 dark:text-white"
                                                }`}>
                                                {date.getDate()}
                                            </div>
                                            <div className="space-y-1">
                                                {getEventsForDate(date).slice(0, 3).map((event) => (
                                                    <div
                                                        key={event.id}
                                                        className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                                                        style={{ backgroundColor: `${event.color}20`, color: event.color, borderLeft: `2px solid ${event.color}` }}
                                                        title={event.title}
                                                    >
                                                        {event.title}
                                                    </div>
                                                ))}
                                                {getEventsForDate(date).length > 3 && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        +{getEventsForDate(date).length - 3} more
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* List View */
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredEvents.length === 0 ? (
                            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                                <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Không có sự kiện nào</p>
                            </div>
                        ) : (
                            filteredEvents
                                .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                                .map((event) => {
                                    const EventIcon = EVENT_TYPES[event.event_type as keyof typeof EVENT_TYPES]?.icon || CalendarIcon;
                                    return (
                                        <div key={event.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className="p-2 rounded-lg"
                                                    style={{ backgroundColor: `${event.color}20` }}
                                                >
                                                    <EventIcon className="w-5 h-5" style={{ color: event.color }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-gray-900 dark:text-white">{event.title}</h3>
                                                    {event.description && (
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{event.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                        <span>{new Date(event.start_date).toLocaleDateString("vi-VN")}</span>
                                                        {!event.is_all_day && event.start_time && (
                                                            <span>{event.start_time} - {event.end_time}</span>
                                                        )}
                                                        {event.is_all_day && <span>Cả ngày</span>}
                                                    </div>
                                                </div>
                                                <span
                                                    className="px-2 py-1 text-xs font-medium rounded-full"
                                                    style={{ backgroundColor: `${event.color}20`, color: event.color }}
                                                >
                                                    {EVENT_TYPES[event.event_type as keyof typeof EVENT_TYPES]?.label || event.event_type}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                    </div>
                )}

                {/* Legend */}
                <div className="mt-6 flex flex-wrap gap-3">
                    {Object.entries(EVENT_TYPES).map(([key, { label, color }]) => (
                        <div
                            key={key}
                            className="flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium"
                            style={{ backgroundColor: `${color}20`, color }}
                        >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                            {label}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
