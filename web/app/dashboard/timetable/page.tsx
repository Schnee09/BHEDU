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
    Plus,
    Edit,
    BookOpen,
    Users,
    X,
    Trash2,
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
}

const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const TIME_SLOTS = [
    "07:00", "07:45", "08:30", "09:15", "10:00", "10:45",
    "13:00", "13:45", "14:30", "15:15", "16:00", "16:45"
];

const SUBJECT_COLORS: Record<string, string> = {
    TOAN: "bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700",
    VAN: "bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-700",
    ANH: "bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700",
    LY: "bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-700",
    HOA: "bg-pink-100 dark:bg-pink-900/40 border-pink-300 dark:border-pink-700",
    OTHER: "bg-teal-100 dark:bg-teal-900/40 border-teal-300 dark:border-teal-700",
    default: "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600",
};

export default function TimetablePage() {
    const { profile, loading: profileLoading } = useProfile();
    const [slots, setSlots] = useState<TimetableSlot[]>([]);
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [subjects, setSubjects] = useState<{ id: string; name: string; code: string }[]>([]);
    const [teachers, setTeachers] = useState<{ id: string; full_name: string }[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        subject_id: "",
        teacher_id: "",
        day_of_week: 0,
        start_time: "07:00",
        end_time: "07:45",
        room: ""
    });

    const fetchTimetable = async () => {
        if (!selectedClass) {
            setSlots([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await apiFetch(`/api/timetable?class_id=${selectedClass}`);
            const text = await response.text();

            // Check for HTML error response
            if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
                throw new Error('API returned HTML');
            }

            const data = JSON.parse(text);
            const slots = data.slots || [];

            // Use real data (even if empty) - don't fall back to mock
            setSlots(slots);
        } catch (error) {
            console.error("Failed to fetch timetable:", error);
            // On error, show empty timetable instead of mock data
            setSlots([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await apiFetch("/api/classes");
            const text = await response.text();

            // Check for HTML error response
            if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
                throw new Error('API returned HTML');
            }

            const data = JSON.parse(text);
            setClasses(data.classes || []);
            if (data.classes?.length > 0) {
                setSelectedClass(data.classes[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch classes:", error);
            // Mock data
            setClasses([
                { id: "1", name: "10A1" },
                { id: "2", name: "10A2" },
                { id: "3", name: "11A1" },
            ]);
            setSelectedClass("1");
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

    const openCreateModal = () => {
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
        start.setDate(start.getDate() - start.getDay() + 1); // Monday
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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Thời khóa biểu</h1>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">Xem và quản lý lịch học</p>
                    </div>

                    {profile?.role === "admin" && (
                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm tiết học
                        </button>
                    )}
                </div>

                {/* Filters & Navigation */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200"
                    >
                        <option value="">Chọn lớp</option>
                        {classes.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>

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
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-700">
                                        <th className="w-20 p-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                                            <Clock className="w-4 h-4 inline mr-1" /> Giờ
                                        </th>
                                        {DAYS.map((day, i) => (
                                            <th key={day} className="p-3 text-center">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{day}</div>
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
                                                return (
                                                    <td key={dayIndex} className="p-1">
                                                        {slot ? (
                                                            <div
                                                                className={`p-2 rounded-lg border ${getSubjectColor(slot.subject?.code)} cursor-pointer hover:scale-[1.02] transition-transform relative group`}
                                                                onClick={() => profile?.role === "admin" && openEditModal(slot)}
                                                            >
                                                                <div className="font-medium text-sm text-gray-900 dark:text-white">
                                                                    {slot.subject?.name || "N/A"}
                                                                </div>
                                                                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                                    <Users className="w-3 h-3" />
                                                                    {slot.teacher?.full_name || "N/A"}
                                                                </div>
                                                                {slot.room && (
                                                                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                                                        <MapPin className="w-3 h-3" />
                                                                        {slot.room}
                                                                    </div>
                                                                )}
                                                                {/* Delete button (admin only) */}
                                                                {profile?.role === "admin" && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            deleteSlot(slot.id);
                                                                        }}
                                                                        disabled={deleting === slot.id}
                                                                        className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded transition-all"
                                                                        title="Xóa tiết học"
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
                                                            <div className="h-16" />
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
                <div className="mt-6 flex flex-wrap gap-3">
                    {Object.entries(SUBJECT_COLORS).slice(0, -1).map(([code, color]) => (
                        <div key={code} className={`px-3 py-1 rounded-lg text-xs font-medium ${color}`}>
                            {code}
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Slot Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg">
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Môn học</label>
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phòng</label>
                                <input
                                    type="text"
                                    value={formData.room}
                                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                    placeholder="Ví dụ: A101"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                            <button onClick={() => { setShowModal(false); setEditingSlot(null); }} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                Hủy
                            </button>
                            <button
                                onClick={saveSlot}
                                disabled={saving}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
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
