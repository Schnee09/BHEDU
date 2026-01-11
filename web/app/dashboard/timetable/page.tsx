"use client";

import { useState, useEffect, DragEvent } from "react";
import { useProfile } from "@/hooks/useProfile";
import { apiFetch } from "@/lib/api/client";
import {
    Calendar,
    Clock,
    MapPin,
    ChevronLeft,
    ChevronRight,
    Plus,
    Users,
    X,
    Trash2,
    GripVertical,
    BookOpen,
    Building,
} from "lucide-react";

interface TimetableSlot {
    id: string;
    class_id: string;
    subject: { id: string; name: string; code: string } | null;
    teacher: { id: string; full_name: string } | null;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room: string | null;
    notes: string | null;
}

interface ClassOption {
    id: string;
    name: string;
    room?: string;
}

interface SubjectOption {
    id: string;
    name: string;
    code: string;
}

interface TeacherOption {
    id: string;
    full_name: string;
}

interface DragItem {
    type: 'subject' | 'teacher';
    id: string;
    name: string;
    code?: string;
}

const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const TIME_SLOTS = [
    "07:00", "07:45", "08:30", "09:15", "10:00", "10:45",
    "13:00", "13:45", "14:30", "15:15", "16:00", "16:45"
];

const SUBJECT_COLORS: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
    TOAN: {
        bg: "bg-blue-50 dark:bg-blue-950/50",
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-700 dark:text-blue-300",
        gradient: "from-blue-500 to-indigo-600"
    },
    VAN: {
        bg: "bg-purple-50 dark:bg-purple-950/50",
        border: "border-purple-200 dark:border-purple-800",
        text: "text-purple-700 dark:text-purple-300",
        gradient: "from-purple-500 to-pink-600"
    },
    ANH: {
        bg: "bg-emerald-50 dark:bg-emerald-950/50",
        border: "border-emerald-200 dark:border-emerald-800",
        text: "text-emerald-700 dark:text-emerald-300",
        gradient: "from-emerald-500 to-teal-600"
    },
    LY: {
        bg: "bg-orange-50 dark:bg-orange-950/50",
        border: "border-orange-200 dark:border-orange-800",
        text: "text-orange-700 dark:text-orange-300",
        gradient: "from-orange-500 to-red-600"
    },
    HOA: {
        bg: "bg-pink-50 dark:bg-pink-950/50",
        border: "border-pink-200 dark:border-pink-800",
        text: "text-pink-700 dark:text-pink-300",
        gradient: "from-pink-500 to-rose-600"
    },
    SINH: {
        bg: "bg-teal-50 dark:bg-teal-950/50",
        border: "border-teal-200 dark:border-teal-800",
        text: "text-teal-700 dark:text-teal-300",
        gradient: "from-teal-500 to-cyan-600"
    },
    SU: {
        bg: "bg-amber-50 dark:bg-amber-950/50",
        border: "border-amber-200 dark:border-amber-800",
        text: "text-amber-700 dark:text-amber-300",
        gradient: "from-amber-500 to-yellow-600"
    },
    DIA: {
        bg: "bg-cyan-50 dark:bg-cyan-950/50",
        border: "border-cyan-200 dark:border-cyan-800",
        text: "text-cyan-700 dark:text-cyan-300",
        gradient: "from-cyan-500 to-sky-600"
    },
    default: {
        bg: "bg-slate-50 dark:bg-slate-800/50",
        border: "border-slate-200 dark:border-slate-700",
        text: "text-slate-700 dark:text-slate-300",
        gradient: "from-slate-500 to-gray-600"
    },
};

const ROOMS = ["A101", "A102", "A103", "A201", "A202", "B101", "B102", "B201", "Lab1", "Lab2", "Gym"];

export default function TimetablePage() {
    const { profile, loading: profileLoading } = useProfile();
    const [slots, setSlots] = useState<TimetableSlot[]>([]);
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [subjects, setSubjects] = useState<SubjectOption[]>([]);
    const [teachers, setTeachers] = useState<TeacherOption[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [dragOverCell, setDragOverCell] = useState<string | null>(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const [formData, setFormData] = useState({
        subject_id: "",
        teacher_id: "",
        day_of_week: 0,
        start_time: "07:00",
        end_time: "07:45",
        room: ""
    });

    // Check if user can edit (staff or admin)
    const canEdit = profile?.role === "admin" || profile?.role === "staff" || profile?.role === "teacher";

    const fetchTimetable = async () => {
        if (!selectedClass) {
            setSlots([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await apiFetch(`/api/timetable?class_id=${selectedClass}`);
            const data = await response.json();
            setSlots(data.slots || []);
        } catch (error) {
            console.error("Failed to fetch timetable:", error);
            setSlots([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
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

    const fetchSubjectsAndTeachers = async () => {
        try {
            const [subRes, teacherRes] = await Promise.all([
                apiFetch('/api/subjects'),
                apiFetch('/api/admin/users?role=teacher')
            ]);
            const subData = await subRes.json();
            const teacherData = await teacherRes.json();
            setSubjects(subData.subjects || []);
            setTeachers(teacherData.users || []);
        } catch (e) {
            console.error('Failed to fetch subjects/teachers:', e);
        }
    };

    const saveSlot = async () => {
        if (!selectedClass || !formData.start_time || !formData.end_time) return;

        setSaving(true);
        try {
            const isEditing = !!editingSlot;
            const url = isEditing ? `/api/timetable/${editingSlot.id}` : '/api/timetable';
            const method = isEditing ? 'PUT' : 'POST';

            await apiFetch(url, {
                method,
                body: JSON.stringify({
                    class_id: selectedClass,
                    ...formData,
                    subject_id: formData.subject_id || null,
                    teacher_id: formData.teacher_id || null
                }),
                headers: { 'Content-Type': 'application/json' }
            });
            setShowModal(false);
            setEditingSlot(null);
            fetchTimetable();
        } catch (error) {
            console.error('Failed to save slot:', error);
            alert('Lỗi khi lưu tiết học');
        } finally {
            setSaving(false);
        }
    };

    const deleteSlot = async (slotId: string) => {
        if (!confirm('Bạn có chắc muốn xóa tiết học này?')) return;

        setDeleting(slotId);
        try {
            await apiFetch(`/api/timetable/${slotId}`, {
                method: 'DELETE'
            });
            fetchTimetable();
        } catch (error) {
            console.error('Failed to delete slot:', error);
            alert('Lỗi khi xóa tiết học');
        } finally {
            setDeleting(null);
        }
    };

    // Quick create slot from drag-drop
    const quickCreateSlot = async (dayIndex: number, time: string, subjectId: string) => {
        if (!selectedClass) return;

        const endTimeIndex = TIME_SLOTS.indexOf(time) + 1;
        const endTime = TIME_SLOTS[endTimeIndex] || "17:30";

        setSaving(true);
        try {
            await apiFetch('/api/timetable', {
                method: 'POST',
                body: JSON.stringify({
                    class_id: selectedClass,
                    subject_id: subjectId,
                    teacher_id: null,
                    day_of_week: dayIndex,
                    start_time: time,
                    end_time: endTime,
                    room: null
                }),
                headers: { 'Content-Type': 'application/json' }
            });
            fetchTimetable();
        } catch (error) {
            console.error('Failed to quick create slot:', error);
        } finally {
            setSaving(false);
            setDragOverCell(null);
        }
    };

    const openEditModal = (slot: TimetableSlot) => {
        if (!canEdit) return;
        setEditingSlot(slot);
        setFormData({
            subject_id: slot.subject?.id || "",
            teacher_id: slot.teacher?.id || "",
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            room: slot.room || ""
        });
        setShowModal(true);
    };

    const openCreateModalForCell = (dayIndex: number, time: string) => {
        if (!canEdit) return;
        const endTimeIndex = TIME_SLOTS.indexOf(time) + 1;
        const endTime = TIME_SLOTS[endTimeIndex] || "17:30";

        setEditingSlot(null);
        setFormData({
            subject_id: "",
            teacher_id: "",
            day_of_week: dayIndex,
            start_time: time,
            end_time: endTime,
            room: ""
        });
        setShowModal(true);
    };

    const openCreateModal = () => {
        if (!canEdit) return;
        setEditingSlot(null);
        setFormData({
            subject_id: "",
            teacher_id: "",
            day_of_week: 0,
            start_time: "07:00",
            end_time: "07:45",
            room: ""
        });
        setShowModal(true);
    };

    // Drag handlers
    const handleDragStart = (e: DragEvent, item: DragItem) => {
        e.dataTransfer.setData('application/json', JSON.stringify(item));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDragOver = (e: DragEvent, cellKey: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setDragOverCell(cellKey);
    };

    const handleDragLeave = () => {
        setDragOverCell(null);
    };

    const handleDrop = async (e: DragEvent, dayIndex: number, time: string) => {
        e.preventDefault();
        setDragOverCell(null);

        if (!canEdit) return;

        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json')) as DragItem;
            if (data.type === 'subject') {
                await quickCreateSlot(dayIndex, time, data.id);
            }
        } catch (error) {
            console.error('Drop error:', error);
        }
    };

    useEffect(() => {
        fetchClasses();
        fetchSubjectsAndTeachers();
    }, []);

    useEffect(() => {
        fetchTimetable();
    }, [selectedClass]);

    const getSlotForCell = (dayIndex: number, time: string): TimetableSlot | undefined => {
        return slots.find(
            (slot) => slot.day_of_week === dayIndex && slot.start_time === time
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
    const selectedClassName = classes.find(c => c.id === selectedClass)?.name || "";

    if (profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="flex">
                {/* Sidebar - Subject/Teacher Palette (RIGHT SIDE) */}
                {canEdit && showSidebar && (
                    <div className="w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 fixed right-0 top-0 h-full overflow-y-auto z-40 pt-20 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <GripVertical className="w-4 h-4 text-white" />
                                </span>
                                Kéo thả
                            </h3>
                            <button
                                onClick={() => setShowSidebar(false)}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Subjects */}
                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                Môn học
                            </h4>
                            <div className="space-y-2">
                                {subjects.map(subject => {
                                    const colors = getSubjectColor(subject.code);
                                    return (
                                        <div
                                            key={subject.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, {
                                                type: 'subject',
                                                id: subject.id,
                                                name: subject.name,
                                                code: subject.code
                                            })}
                                            className={`rounded-xl overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-200 cursor-grab active:cursor-grabbing active:scale-95 ${colors.bg} ${colors.border}`}
                                        >
                                            <div className={`h-1 bg-gradient-to-r ${colors.gradient}`} />
                                            <div className="p-2.5 flex items-center gap-2">
                                                <GripVertical className={`w-4 h-4 ${colors.text} opacity-40`} />
                                                <span className={`text-sm font-semibold ${colors.text}`}>{subject.name}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Rooms Quick Reference */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                <Building className="w-4 h-4" />
                                Phòng học
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                {ROOMS.map(room => (
                                    <div
                                        key={room}
                                        className="px-3 py-2 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg text-xs text-center font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 shadow-sm"
                                    >
                                        <MapPin className="w-3 h-3 inline mr-1 opacity-50" />
                                        {room}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className={`flex-1 ${canEdit && showSidebar ? 'mr-64' : ''} transition-all duration-300`}>
                    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                            <div className="flex items-center gap-4">
                                {canEdit && !showSidebar && (
                                    <button
                                        onClick={() => setShowSidebar(true)}
                                        className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200"
                                        title="Hiển thị bảng kéo thả"
                                    >
                                        <GripVertical className="w-5 h-5" />
                                    </button>
                                )}
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Thời khóa biểu</h1>
                                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                                        {canEdit ? 'Kéo môn học vào ô trống hoặc nhấp để tạo' : 'Xem lịch học'}
                                    </p>
                                </div>
                            </div>

                            {canEdit && (
                                <button
                                    onClick={openCreateModal}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Thêm tiết học
                                </button>
                            )}
                        </div>

                        {/* Class Selector & Week Navigation */}
                        <div className="flex flex-wrap items-center gap-4 mb-6">
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

                            {selectedClassName && (
                                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
                                    {selectedClassName}
                                </span>
                            )}

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
                                    className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-lg"
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
                        ) : !selectedClass ? (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">Chọn một lớp để xem thời khóa biểu</p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[900px]">
                                        <thead>
                                            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750">
                                                <th className="w-20 p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">
                                                    <Clock className="w-4 h-4 inline mr-1" /> Giờ
                                                </th>
                                                {DAYS.map((day, i) => (
                                                    <th key={day} className="p-3 text-center min-w-[120px]">
                                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{day}</div>
                                                        <div className="text-xs text-gray-500">{weekDates[i].toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                            {TIME_SLOTS.map((time) => (
                                                <tr key={time} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                                                    <td className="p-2 text-sm font-medium text-gray-500 dark:text-gray-400 text-center border-r border-gray-100 dark:border-gray-700">
                                                        {time}
                                                    </td>
                                                    {DAYS.map((_, dayIndex) => {
                                                        const slot = getSlotForCell(dayIndex, time);
                                                        const cellKey = `${dayIndex}-${time}`;
                                                        const isDragOver = dragOverCell === cellKey;

                                                        return (
                                                            <td
                                                                key={dayIndex}
                                                                className="p-1"
                                                                onDragOver={(e) => canEdit && !slot && handleDragOver(e, cellKey)}
                                                                onDragLeave={handleDragLeave}
                                                                onDrop={(e) => canEdit && !slot && handleDrop(e, dayIndex, time)}
                                                            >
                                                                {slot ? (
                                                                    <div
                                                                        className={`rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-200 relative group cursor-pointer ${getSubjectColor(slot.subject?.code).bg} border ${getSubjectColor(slot.subject?.code).border}`}
                                                                        onClick={() => openEditModal(slot)}
                                                                    >
                                                                        {/* Gradient header bar */}
                                                                        <div className={`h-1.5 bg-gradient-to-r ${getSubjectColor(slot.subject?.code).gradient}`} />

                                                                        <div className="p-2">
                                                                            <div className={`font-bold text-sm ${getSubjectColor(slot.subject?.code).text}`}>
                                                                                {slot.subject?.name || "N/A"}
                                                                            </div>
                                                                            <div className={`flex items-center gap-1 text-xs mt-1.5 ${getSubjectColor(slot.subject?.code).text} opacity-75`}>
                                                                                <Users className="w-3 h-3" />
                                                                                <span className="truncate">{slot.teacher?.full_name || "Ch\u01b0a ph\u00e2n c\u00f4ng"}</span>
                                                                            </div>
                                                                            {slot.room && (
                                                                                <div className={`flex items-center gap-1 text-xs mt-1 ${getSubjectColor(slot.subject?.code).text} opacity-60`}>
                                                                                    <MapPin className="w-3 h-3" />
                                                                                    <span className="font-semibold">{slot.room}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Delete button */}
                                                                        {canEdit && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    deleteSlot(slot.id);
                                                                                }}
                                                                                disabled={deleting === slot.id}
                                                                                className="absolute top-2 right-1 p-1.5 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all shadow-lg"
                                                                                title="X\u00f3a ti\u1ebft h\u1ecdc"
                                                                            >
                                                                                {deleting === slot.id ? (
                                                                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                                ) : (
                                                                                    <Trash2 className="w-3 h-3" />
                                                                                )}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        className={`h-16 rounded-lg border-2 border-dashed transition-all ${isDragOver
                                                                            ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                                                                            : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                                                            } ${canEdit ? 'cursor-pointer' : ''}`}
                                                                        onClick={() => canEdit && openCreateModalForCell(dayIndex, time)}
                                                                    >
                                                                        {isDragOver && (
                                                                            <div className="h-full flex items-center justify-center text-indigo-500 text-xs">
                                                                                <Plus className="w-4 h-4" />
                                                                            </div>
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

                        {/* Legend */}
                        <div className="mt-8 flex flex-wrap gap-3">
                            {subjects.slice(0, 8).map((subject) => {
                                const colors = getSubjectColor(subject.code);
                                return (
                                    <div key={subject.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm ${colors.bg} ${colors.border} ${colors.text}`}>
                                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colors.gradient}`} />
                                        {subject.name}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingSlot ? 'Chỉnh sửa tiết học' : 'Thêm tiết học mới'}
                            </h2>
                            <button onClick={() => { setShowModal(false); setEditingSlot(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Môn học *</label>
                                <select
                                    value={formData.subject_id}
                                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                >
                                    <option value="">Chọn môn học</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giáo viên</label>
                                <select
                                    value={formData.teacher_id}
                                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                >
                                    <option value="">Chọn giáo viên</option>
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thứ</label>
                                <select
                                    value={formData.day_of_week}
                                    onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                >
                                    {DAYS.map((day, i) => <option key={i} value={i}>{day}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giờ bắt đầu</label>
                                    <select
                                        value={formData.start_time}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                    >
                                        {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giờ kết thúc</label>
                                    <select
                                        value={formData.end_time}
                                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                    >
                                        {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    <Building className="w-4 h-4 inline mr-1" />
                                    Phòng học
                                </label>
                                <select
                                    value={formData.room}
                                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                >
                                    <option value="">Chọn phòng</option>
                                    {ROOMS.map(room => <option key={room} value={room}>{room}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                            <button onClick={() => { setShowModal(false); setEditingSlot(null); }} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                Hủy
                            </button>
                            <button
                                onClick={saveSlot}
                                disabled={saving || !formData.subject_id}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Đang lưu...' : (editingSlot ? 'Cập nhật' : 'Tạo tiết học')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
