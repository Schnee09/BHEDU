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
    Plus,
    X,
    Trash2,
    Edit3,
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

interface SubjectOption {
    id: string;
    name: string;
    code: string;
}

interface TeacherOption {
    id: string;
    full_name: string;
}

const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

const PERIODS = [
    { id: 1, label: "Tiết 1", time: "7:30 - 8:15", start: "07:30", end: "08:15" },
    { id: 2, label: "Tiết 2", time: "8:15 - 9:00", start: "08:15", end: "09:00" },
    { id: 3, label: "Tiết 3", time: "9:00 - 9:45", start: "09:00", end: "09:45" },
    { id: 4, label: "Tiết 4", time: "10:00 - 10:45", start: "10:00", end: "10:45" },
    { id: 5, label: "Tiết 5", time: "10:45 - 11:30", start: "10:45", end: "11:30" },
    { id: 6, label: "Tiết 6", time: "13:00 - 13:45", start: "13:00", end: "13:45" },
    { id: 7, label: "Tiết 7", time: "13:45 - 14:30", start: "13:45", end: "14:30" },
    { id: 8, label: "Tiết 8", time: "14:30 - 15:15", start: "14:30", end: "15:15" },
    { id: 9, label: "Tiết 9", time: "15:30 - 16:15", start: "15:30", end: "16:15" },
    { id: 10, label: "Tiết 10", time: "16:15 - 17:00", start: "16:15", end: "17:00" },
];

const ROOMS = ["A101", "A102", "A103", "A201", "A202", "B101", "B102", "B201", "Lab1", "Lab2"];

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
    const [subjects, setSubjects] = useState<SubjectOption[]>([]);
    const [teachers, setTeachers] = useState<TeacherOption[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [currentWeek, setCurrentWeek] = useState(new Date());

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        subject_id: "",
        teacher_id: "",
        day_of_week: 0,
        start_time: "07:30",
        end_time: "08:15",
        room: ""
    });

    const isAdmin = profile?.role === "admin" || profile?.role === "staff";

    // Fetch timetable based on role
    const fetchTimetable = async () => {
        setLoading(true);
        try {
            if (isAdmin && selectedClass) {
                const response = await apiFetch(`/api/timetable?class_id=${selectedClass}`);
                const data = await response.json();
                setSlots(data.slots || []);
            } else if (!isAdmin) {
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
        if (!selectedClass || !formData.subject_id) return;

        setSaving(true);
        try {
            const isEditing = !!editingSlot;
            const url = isEditing ? `/api/timetable/${editingSlot.id}` : '/api/timetable';
            const method = isEditing ? 'PUT' : 'POST';

            const response = await apiFetch(url, {
                method,
                body: JSON.stringify({
                    class_id: selectedClass,
                    ...formData,
                    subject_id: formData.subject_id || null,
                    teacher_id: formData.teacher_id || null
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to save');
            }

            setShowModal(false);
            setEditingSlot(null);
            fetchTimetable();
        } catch (error: any) {
            console.error('Failed to save slot:', error);
            alert('Lỗi khi lưu: ' + (error.message || 'Unknown error'));
        } finally {
            setSaving(false);
        }
    };

    const deleteSlot = async (slotId: string) => {
        if (!confirm('Bạn có chắc muốn xóa tiết học này?')) return;

        setDeleting(slotId);
        try {
            await apiFetch(`/api/timetable/${slotId}`, { method: 'DELETE' });
            fetchTimetable();
        } catch (error) {
            console.error('Failed to delete slot:', error);
            alert('Lỗi khi xóa tiết học');
        } finally {
            setDeleting(null);
        }
    };

    const openCreateModal = (dayIndex?: number, period?: typeof PERIODS[0]) => {
        setEditingSlot(null);
        setFormData({
            subject_id: "",
            teacher_id: "",
            day_of_week: dayIndex ?? 0,
            start_time: period?.start ?? "07:30",
            end_time: period?.end ?? "08:15",
            room: ""
        });
        setShowModal(true);
    };

    const openEditModal = (slot: TimetableSlot) => {
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

    useEffect(() => {
        if (profileLoading) return;
        if (isAdmin) {
            fetchClasses();
            fetchSubjectsAndTeachers();
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

                    {/* Add button for admin */}
                    {isAdmin && selectedClass && (
                        <button
                            onClick={() => openCreateModal()}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg"
                        >
                            <Plus className="w-5 h-5" />
                            Thêm tiết học
                        </button>
                    )}
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
                                                            <div
                                                                className={`p-2 rounded-lg border-2 ${getSubjectColor(slot.subject?.code)} relative group ${isAdmin ? 'cursor-pointer hover:shadow-md' : ''}`}
                                                                onClick={() => isAdmin && openEditModal(slot)}
                                                            >
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

                                                                {/* Delete button for admin */}
                                                                {isAdmin && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); deleteSlot(slot.id); }}
                                                                        disabled={deleting === slot.id}
                                                                        className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded transition-all"
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
                                                                className={`h-16 rounded-lg border-2 border-dashed border-transparent ${isAdmin ? 'hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer' : ''}`}
                                                                onClick={() => isAdmin && openCreateModal(dayIndex, period)}
                                                            >
                                                                {isAdmin && (
                                                                    <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                                        <Plus className="w-4 h-4 text-indigo-400" />
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
            </div>

            {/* Modal for Create/Edit */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                {editingSlot ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
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
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tiết bắt đầu</label>
                                    <select
                                        value={formData.start_time}
                                        onChange={(e) => {
                                            const period = PERIODS.find(p => p.start === e.target.value);
                                            setFormData({ ...formData, start_time: e.target.value, end_time: period?.end || formData.end_time });
                                        }}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                    >
                                        {PERIODS.map(p => <option key={p.id} value={p.start}>{p.label} ({p.start})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phòng học</label>
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
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                            <button onClick={() => { setShowModal(false); setEditingSlot(null); }} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                Hủy
                            </button>
                            <button
                                onClick={saveSlot}
                                disabled={saving || !formData.subject_id}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                {saving ? 'Đang lưu...' : (editingSlot ? 'Cập nhật' : 'Tạo tiết học')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
