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
    X,
    Trash2,
    Edit,
    CalendarDays,
    Info,
    CheckCircle2
} from "lucide-react";
import { 
    Button, 
    Card, 
    Badge, 
    Modal, 
    Input, 
    LoadingState,
    Alert,
    EmptyState
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";

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
    general: { label: "Chung", icon: CalendarIcon, color: "#6366f1", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
    exam: { label: "Kiểm tra", icon: BookOpen, color: "#ef4444", bg: "bg-red-500/10", border: "border-red-500/20" },
    holiday: { label: "Nghỉ lễ", icon: PartyPopper, color: "#22c55e", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    meeting: { label: "Họp", icon: Clock, color: "#f59e0b", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    deadline: { label: "Deadline", icon: AlertCircle, color: "#ec4899", bg: "bg-pink-500/10", border: "border-pink-500/20" },
};

export default function AcademicCalendarPage() {
    const { profile, loading: profileLoading } = useProfile();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<"month" | "list">("month");
    const [filterType, setFilterType] = useState<string>("all");
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const [saving, setSaving] = useState(false);
    const toast = useToast();

    const [formData, setFormData] = useState({
        title: "",
        event_type: "general",
        start_date: "",
        end_date: "",
        start_time: "",
        end_time: "",
        is_all_day: true,
        description: "",
        color: "#6366f1"
    });

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
            // Mock data for demo if API fails
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
        if (!profileLoading) fetchEvents();
    }, [currentDate, profileLoading]);

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay(); // Monday = 1

        const days: (Date | null)[] = [];
        for (let i = 1; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const toDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getEventsForDate = (date: Date) => {
        const dateStr = toDateString(date);
        return events.filter((event) => {
            const start = event.start_date;
            const end = event.end_date || event.start_date;
            return dateStr >= start && dateStr <= end;
        }).filter((event) => filterType === "all" || event.event_type === filterType);
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return toDateString(date) === toDateString(today);
    };

    const handleOpenAdd = () => {
        setEditingEvent(null);
        setFormData({
            title: "",
            event_type: "general",
            start_date: toDateString(new Date()),
            end_date: "",
            start_time: "",
            end_time: "",
            is_all_day: true,
            description: "",
            color: "#6366f1"
        });
        setShowModal(true);
    };

    const handleOpenEdit = (event: CalendarEvent) => {
        setEditingEvent(event);
        setFormData({
            title: event.title,
            event_type: event.event_type,
            start_date: event.start_date,
            end_date: event.end_date || "",
            start_time: event.start_time || "",
            end_time: event.end_time || "",
            is_all_day: event.is_all_day,
            description: event.description || "",
            color: event.color
        });
        setShowModal(true);
    };

    const saveEvent = async () => {
        if (!formData.title || !formData.start_date) {
            toast.error("Lỗi", "Vui lòng nhập đầy đủ thông tin bắt buộc");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                end_date: formData.end_date || null,
                start_time: formData.is_all_day ? null : formData.start_time,
                end_time: formData.is_all_day ? null : formData.end_time,
                color: EVENT_TYPES[formData.event_type as keyof typeof EVENT_TYPES]?.color || "#6366f1"
            };

            const url = editingEvent ? `/api/calendar/${editingEvent.id}` : '/api/calendar';
            const method = editingEvent ? 'PUT' : 'POST';

            const response = await apiFetch(url, {
                method,
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                toast.success("Thành công", editingEvent ? "Đã cập nhật sự kiện" : "Đã tạo sự kiện mới");
                setShowModal(false);
                fetchEvents();
            } else {
                toast.error("Lỗi", "Không thể lưu sự kiện");
            }
        } catch (error) {
            console.error('Failed to save event:', error);
            toast.error("Lỗi", "Đã xảy ra lỗi khi kết nối");
        } finally {
            setSaving(false);
        }
    };

    const deleteEvent = async (eventId: string) => {
        if (!confirm('Bạn có chắc muốn xóa sự kiện này?')) return;

        try {
            const response = await apiFetch(`/api/calendar/${eventId}`, { method: 'DELETE' });
            if (response.ok) {
                toast.success("Thành công", "Đã xóa sự kiện");
                fetchEvents();
            } else {
                toast.error("Lỗi", "Không thể xóa sự kiện");
            }
        } catch (error) {
            console.error('Failed to delete event:', error);
            toast.error("Lỗi", "Đã xảy ra lỗi");
        }
    };

    const filteredEvents = filterType === "all"
        ? events
        : events.filter((e) => e.event_type === filterType);

    if (profileLoading) return <LoadingState message="Đang tải dữ liệu..." />;

    const isAdmin = profile?.role === "admin" || profile?.role === "staff";

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-gray-800/80 p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-premium backdrop-blur-md">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <CalendarDays className="w-6 h-6 text-primary" />
                            </div>
                            <Badge variant="success">Học tập</Badge>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Lịch học tập</h1>
                        <p className="text-muted mt-2 max-w-lg">Theo dõi các sự kiện, kỳ thi và thông báo quan trọng trong năm học.</p>
                    </div>
                    {isAdmin && (
                        <Button 
                            variant="primary" 
                            size="lg"
                            leftIcon={<Plus className="w-5 h-5" />}
                            onClick={handleOpenAdd}
                            className="rounded-2xl"
                        >
                            Thêm sự kiện
                        </Button>
                    )}
                </div>

                {/* Controls & Toolbar */}
                <Card variant="glass" className="p-4 bg-white/50 dark:bg-gray-800/50">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="px-2"
                                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </Button>
                                <span className="text-base font-bold dark:text-white min-w-[140px] text-center">
                                    {currentDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
                                </span>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="px-2"
                                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </Button>
                            </div>
                            <Button 
                                variant="secondary" 
                                size="sm" 
                                onClick={() => setCurrentDate(new Date())}
                                className="rounded-xl"
                            >
                                Hôm nay
                            </Button>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* View Toggle */}
                            <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
                                <Button 
                                    variant={viewMode === "month" ? "primary" : "ghost"}
                                    size="sm"
                                    className="rounded-lg text-xs"
                                    onClick={() => setViewMode("month")}
                                >
                                    Tháng
                                </Button>
                                <Button 
                                    variant={viewMode === "list" ? "primary" : "ghost"}
                                    size="sm"
                                    className="rounded-lg text-xs"
                                    onClick={() => setViewMode("list")}
                                >
                                    Danh sách
                                </Button>
                            </div>

                            {/* Filter */}
                            <div className="relative flex items-center bg-white dark:bg-gray-700 p-2 border border-gray-200 dark:border-white/10 rounded-xl shadow-sm">
                                <Filter className="w-4 h-4 text-muted mr-2" />
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="bg-transparent text-sm font-medium outline-none cursor-pointer pr-2"
                                >
                                    <option value="all">Tất cả sự kiện</option>
                                    {Object.entries(EVENT_TYPES).map(([key, { label }]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Calendar Content */}
                {loading ? (
                    <div className="h-[600px] flex items-center justify-center bg-white/30 dark:bg-white/5 rounded-3xl border border-dashed border-gray-300 dark:border-white/10">
                        <LoadingState message="Lấy dữ liệu sự kiện..." />
                    </div>
                ) : viewMode === "month" ? (
                    <div className="bg-white dark:bg-gray-800 rounded-[32px] shadow-premium-lg border border-gray-100 dark:border-white/5 overflow-hidden">
                        {/* Day Headers */}
                        <div className="grid grid-cols-7 bg-gray-50/50 dark:bg-white/2 border-b border-gray-100 dark:border-white/5">
                            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
                                <div key={day} className="p-4 text-center text-xs font-black text-muted uppercase tracking-widest">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 min-h-[600px]">
                            {getDaysInMonth().map((date, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "group relative min-h-[140px] p-3 border-b border-r border-gray-50 dark:border-white/5 transition-all duration-300",
                                        date ? "hover:bg-primary/5 cursor-pointer" : "bg-gray-50/50 dark:bg-white/2 grayscale opacity-50"
                                    )}
                                >
                                    {date && (
                                        <>
                                            <div className={cn(
                                                "text-sm font-bold w-8 h-8 flex items-center justify-center rounded-xl mb-2 transition-all",
                                                isToday(date) 
                                                    ? "bg-primary text-white shadow-lg shadow-primary/30" 
                                                    : "text-gray-400 dark:text-gray-500 group-hover:text-primary"
                                            )}>
                                                {date.getDate()}
                                            </div>
                                            <div className="space-y-1.5">
                                                {getEventsForDate(date).slice(0, 3).map((event) => {
                                                    const type = EVENT_TYPES[event.event_type as keyof typeof EVENT_TYPES] || EVENT_TYPES.general;
                                                    return (
                                                        <div
                                                            key={event.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenEdit(event);
                                                            }}
                                                            className={cn(
                                                                "text-[10px] p-1.5 rounded-lg border flex items-center gap-1.5 transition-transform hover:scale-105 active:scale-95",
                                                                type.bg, type.border
                                                            )}
                                                            style={{ color: type.color }}
                                                            title={event.title}
                                                        >
                                                            <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: type.color }} />
                                                            <span className="font-bold truncate">{event.title}</span>
                                                        </div>
                                                    );
                                                })}
                                                {getEventsForDate(date).length > 3 && (
                                                    <div className="text-[9px] text-center font-black text-muted uppercase tracking-tighter pt-1">
                                                        +{getEventsForDate(date).length - 3} sự kiện
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
                    <Card variant="default" className="divide-y divide-gray-100 dark:divide-white/5 p-0 overflow-hidden">
                        {filteredEvents.length === 0 ? (
                            <EmptyState 
                                title="Không có sự kiện" 
                                description="Không tìm thấy sự kiện nào trong khoảng thời gian này."
                                icon={<CalendarIcon className="w-10 h-10" />}
                            />
                        ) : (
                            filteredEvents
                                .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                                .map((event) => {
                                    const type = EVENT_TYPES[event.event_type as keyof typeof EVENT_TYPES] || EVENT_TYPES.general;
                                    const Icon = type.icon;
                                    return (
                                        <div 
                                            key={event.id} 
                                            className="group p-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer flex items-center gap-6"
                                            onClick={() => handleOpenEdit(event)}
                                        >
                                            <div className={cn("w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 border shadow-sm", type.bg, type.border)}>
                                                <span className="text-lg font-black leading-none" style={{ color: type.color }}>
                                                    {new Date(event.start_date).getDate()}
                                                </span>
                                                <span className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-60" style={{ color: type.color }}>
                                                    T.{new Date(event.start_date).getMonth() + 1}
                                                </span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{event.title}</h3>
                                                    <Badge className={cn("text-[9px]", type.bg, type.border)} style={{ color: type.color }}>
                                                        {type.label}
                                                    </Badge>
                                                </div>
                                                {event.description && (
                                                    <p className="text-sm text-muted mb-2 line-clamp-1">{event.description}</p>
                                                )}
                                                <div className="flex items-center gap-4 text-xs font-bold text-muted uppercase tracking-wider">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {event.is_all_day ? "Cả ngày" : `${event.start_time}${event.end_time ? ` - ${event.end_time}` : ""}`}
                                                    </div>
                                                    {event.end_date && event.end_date !== event.start_date && (
                                                        <div className="flex items-center gap-1.5 text-primary">
                                                            <ChevronRight className="w-3.5 h-3.5" />
                                                            Đến {new Date(event.end_date).toLocaleDateString("vi-VN")}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button 
                                                    variant="secondary" 
                                                    size="sm" 
                                                    className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenEdit(event);
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                {isAdmin && (
                                                    <Button 
                                                        variant="danger" 
                                                        size="sm" 
                                                        className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteEvent(event.id);
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                    </Card>
                )}

                {/* Footer Legend */}
                <Card variant="glass" className="py-4 px-6">
                    <div className="flex flex-wrap items-center justify-center gap-6">
                        {Object.entries(EVENT_TYPES).map(([key, { label, color }]) => (
                            <div key={key} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{label}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Event Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingEvent ? 'Chỉnh sửa sự kiện' : 'Thêm sự kiện mới'}
                size="md"
                footer={(
                    <>
                        {editingEvent && isAdmin && (
                             <Button variant="danger" className="mr-auto" onClick={() => deleteEvent(editingEvent.id)}>Xóa sự kiện</Button>
                        )}
                        <Button variant="ghost" onClick={() => setShowModal(false)}>Hủy</Button>
                        <Button 
                            variant="primary" 
                            isLoading={saving} 
                            onClick={saveEvent}
                            leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        >
                            {editingEvent ? 'Lưu thay đổi' : 'Tạo sự kiện'}
                        </Button>
                    </>
                )}
            >
                <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                    <Input
                        label="Tiêu đề sự kiện"
                        placeholder="Nhập tiêu đề (vd: Thi cuối kỳ)"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        leftIcon={<Flag className="w-5 h-5" />}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-indigo-900 dark:text-indigo-200">Loại sự kiện</label>
                            <select
                                value={formData.event_type}
                                onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-3 border-black dark:border-white/20 rounded-xl font-medium shadow-[4px_4px_0px_#000] focus:shadow-[6px_6px_0px_#000] outline-none transition-all"
                            >
                                {Object.entries(EVENT_TYPES).map(([key, { label }]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <Input
                            label="Ngày bắt đầu"
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Ngày kết thúc (tùy chọn)"
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            hint="Để trống nếu chỉ có 1 ngày"
                        />
                        <div className="flex flex-col justify-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10 mt-6">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_all_day_modal"
                                    checked={formData.is_all_day}
                                    onChange={(e) => setFormData({ ...formData, is_all_day: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="is_all_day_modal" className="text-sm font-semibold select-none cursor-pointer">
                                    Sự kiện cả ngày
                                </label>
                            </div>
                        </div>
                    </div>

                    {!formData.is_all_day && (
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Giờ bắt đầu"
                                type="time"
                                value={formData.start_time}
                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                            />
                            <Input
                                label="Giờ kết thúc"
                                type="time"
                                value={formData.end_time}
                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-indigo-900 dark:text-indigo-200">Mô tả chi tiết</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            placeholder="Thêm thông tin bổ sung..."
                            className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-3 border-black dark:border-white/20 rounded-xl font-medium shadow-[4px_4px_0px_#000] focus:shadow-[6px_6px_0px_#000] outline-none transition-all placeholder:text-muted"
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
}
