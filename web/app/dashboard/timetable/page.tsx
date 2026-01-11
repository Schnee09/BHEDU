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
    Building2,
    Plus,
    X,
    Trash2,
    Edit3,
    Phone,
} from "lucide-react";

interface TimetableSlot {
    id: string;
    class_id: string;
    subject: { id: string; name: string; code: string } | null;
    teacher: { id: string; full_name: string; phone?: string } | null;
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
    phone?: string;
}

// Buildings configuration
const BUILDINGS = [
    { id: "A", name: "Tòa nhà A", rooms: ["A101", "A102", "A103", "A201", "A202", "A203"] },
    { id: "B", name: "Tòa nhà B", rooms: ["B101", "B102", "B201", "B202"] },
    { id: "Lab", name: "Phòng Lab", rooms: ["Lab1", "Lab2", "Lab3"] },
    { id: "Other", name: "Khác", rooms: ["Sân", "Hội trường"] },
];

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
];

export default function TimetablePage() {
    const { profile, loading: profileLoading } = useProfile();
    const [slots, setSlots] = useState<TimetableSlot[]>([]);
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [subjects, setSubjects] = useState<SubjectOption[]>([]);
    const [teachers, setTeachers] = useState<TeacherOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentWeek, setCurrentWeek] = useState(new Date());

    // View mode: 'class' or 'room'
    const [viewMode, setViewMode] = useState<'class' | 'room'>('room');
    const [selectedBuilding, setSelectedBuilding] = useState(BUILDINGS[0].id);
    const [selectedClass, setSelectedClass] = useState<string>("");
    const [selectedRoom, setSelectedRoom] = useState<string>("");

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        class_id: "",
        subject_id: "",
        teacher_id: "",
        day_of_week: 0,
        start_time: "07:30",
        end_time: "08:15",
        room: ""
    });

    const isAdmin = profile?.role === "admin" || profile?.role === "staff";
    const currentBuilding = BUILDINGS.find(b => b.id === selectedBuilding);

    // Fetch all timetable slots
    const fetchAllSlots = async () => {
        setLoading(true);
        try {
            // Fetch all slots (no class filter) for room view
            const response = await apiFetch('/api/timetable/all');
            const data = await response.json();
            setSlots(data.slots || []);
        } catch (error) {
            console.error("Failed to fetch timetable:", error);
            setSlots([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchClassSlots = async () => {
        if (!selectedClass) {
            setSlots([]);
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
        if (!formData.class_id || !formData.subject_id) return;

        setSaving(true);
        try {
            const isEditing = !!editingSlot;
            const url = isEditing ? `/api/timetable/${editingSlot.id}` : '/api/timetable';
            const method = isEditing ? 'PUT' : 'POST';

            const response = await apiFetch(url, {
                method,
                body: JSON.stringify({
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
            if (viewMode === 'room') {
                fetchAllSlots();
            } else {
                fetchClassSlots();
            }
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
            if (viewMode === 'room') {
                fetchAllSlots();
            } else {
                fetchClassSlots();
            }
        } catch (error) {
            console.error('Failed to delete slot:', error);
            alert('Lỗi khi xóa tiết học');
        } finally {
            setDeleting(null);
        }
    };

    const openCreateModal = (dayIndex?: number, period?: typeof PERIODS[0], room?: string) => {
        setEditingSlot(null);
        setFormData({
            class_id: selectedClass || "",
            subject_id: "",
            teacher_id: "",
            day_of_week: dayIndex ?? 0,
            start_time: period?.start ?? "07:30",
            end_time: period?.end ?? "08:15",
            room: room || ""
        });
        setShowModal(true);
    };

    const openEditModal = (slot: TimetableSlot) => {
        setEditingSlot(slot);
        setFormData({
            class_id: slot.class_id,
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
        if (!isAdmin) {
            window.location.href = '/dashboard/my-schedule';
            return;
        }
        fetchClasses();
        fetchSubjectsAndTeachers();
        fetchAllSlots();
    }, [profileLoading, isAdmin]);

    useEffect(() => {
        if (viewMode === 'class' && selectedClass) {
            fetchClassSlots();
        } else if (viewMode === 'room') {
            fetchAllSlots();
        }
    }, [viewMode, selectedClass]);

    const getSlotForRoomCell = (room: string, dayIndex: number, startTime: string): TimetableSlot | undefined => {
        return slots.find(
            (slot) => slot.room === room && slot.day_of_week === dayIndex && slot.start_time?.substring(0, 5) === startTime
        );
    };

    const getSlotForClassCell = (dayIndex: number, startTime: string): TimetableSlot | undefined => {
        return slots.find(
            (slot) => slot.day_of_week === dayIndex && slot.start_time?.substring(0, 5) === startTime
        );
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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-red-700 dark:text-red-400">
                        {viewMode === 'room' ? 'LỊCH SỬ DỤNG PHÒNG' : 'QUẢN LÝ THỜI KHÓA BIỂU'}
                    </h1>
                    <div className="flex items-center justify-center gap-4 mt-2 text-sm text-blue-600">
                        <button onClick={() => {
                            const prev = new Date(currentWeek);
                            prev.setDate(prev.getDate() - 7);
                            setCurrentWeek(prev);
                        }}>&lt;&lt; Tuần trước đó</button>
                        <span className="text-gray-400">|</span>
                        <button onClick={() => setCurrentWeek(new Date())} className="font-medium">Tuần hiện tại</button>
                        <span className="text-gray-400">|</span>
                        <button onClick={() => {
                            const next = new Date(currentWeek);
                            next.setDate(next.getDate() + 7);
                            setCurrentWeek(next);
                        }}>Tuần kế tiếp &gt;&gt;</button>
                    </div>
                </div>

                {/* View Mode Tabs */}
                <div className="flex justify-center gap-2 mb-4">
                    <button
                        onClick={() => setViewMode('room')}
                        className={`px-6 py-2 rounded-t-lg font-medium border-b-2 transition-colors ${viewMode === 'room'
                                ? 'bg-white border-blue-500 text-blue-600'
                                : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <Building2 className="w-4 h-4 inline mr-2" />
                        Theo phòng
                    </button>
                    <button
                        onClick={() => setViewMode('class')}
                        className={`px-6 py-2 rounded-t-lg font-medium border-b-2 transition-colors ${viewMode === 'class'
                                ? 'bg-white border-blue-500 text-blue-600'
                                : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <Users className="w-4 h-4 inline mr-2" />
                        Theo lớp
                    </button>
                </div>

                {/* Building Tabs (Room View) */}
                {viewMode === 'room' && (
                    <div className="flex justify-center gap-1 mb-4">
                        {BUILDINGS.map(building => (
                            <button
                                key={building.id}
                                onClick={() => setSelectedBuilding(building.id)}
                                className={`px-6 py-2 rounded-lg font-medium transition-colors ${selectedBuilding === building.id
                                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-400'
                                        : 'bg-gray-50 text-gray-600 border border-gray-300 hover:bg-gray-100'
                                    }`}
                            >
                                {building.name.toUpperCase()}
                            </button>
                        ))}
                    </div>
                )}

                {/* Class Selector (Class View) */}
                {viewMode === 'class' && (
                    <div className="flex justify-center mb-4">
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium min-w-[200px]"
                        >
                            <option value="">Chọn lớp</option>
                            {classes.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Building Title */}
                {viewMode === 'room' && currentBuilding && (
                    <h2 className="text-center text-xl font-semibold text-blue-600 mb-4">
                        {currentBuilding.name.toUpperCase()}
                    </h2>
                )}

                {/* Timetable Grid */}
                {loading ? (
                    <div className="bg-white rounded-lg p-12 text-center">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
                        <p className="mt-4 text-gray-500">Đang tải...</p>
                    </div>
                ) : viewMode === 'room' ? (
                    /* Room-based View */
                    <div className="bg-white rounded-lg overflow-hidden shadow border">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b">
                                        <th className="p-2 border-r text-left text-sm font-medium text-gray-600 w-24">Phòng / Thứ</th>
                                        <th className="p-2 border-r text-center text-sm font-medium text-gray-600 w-20">Tiết</th>
                                        {DAYS.map((day, i) => (
                                            <th key={day} className="p-2 border-r text-center min-w-[140px]">
                                                <div className="font-bold text-gray-800">{day}</div>
                                                <div className="text-xs text-gray-500">
                                                    ({weekDates[i].toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })})
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentBuilding?.rooms.map((room, roomIdx) => (
                                        PERIODS.map((period, periodIdx) => (
                                            <tr key={`${room}-${period.id}`} className="border-b hover:bg-gray-50">
                                                {periodIdx === 0 && (
                                                    <td rowSpan={PERIODS.length} className="p-2 border-r bg-gray-50 align-top">
                                                        <div className="font-bold text-blue-700">{room}</div>
                                                        <div className="text-xs text-gray-500">Sức chứa: 30</div>
                                                    </td>
                                                )}
                                                <td className="p-1 border-r text-center bg-gray-50">
                                                    <div className="text-xs font-medium text-gray-600">{period.label}</div>
                                                    <div className="text-xs text-gray-400">({period.time})</div>
                                                </td>
                                                {DAYS.map((_, dayIndex) => {
                                                    const slot = getSlotForRoomCell(room, dayIndex, period.start);
                                                    return (
                                                        <td key={dayIndex} className="p-1 border-r">
                                                            {slot ? (
                                                                <div
                                                                    className="p-2 bg-blue-50 border border-blue-200 rounded text-xs cursor-pointer hover:bg-blue-100 relative group"
                                                                    onClick={() => openEditModal(slot)}
                                                                >
                                                                    <div className="font-bold text-blue-800">{slot.class?.name || slot.subject?.name || "N/A"}</div>
                                                                    <div className="text-blue-600">{slot.subject?.name}</div>
                                                                    {slot.teacher && (
                                                                        <div className="text-gray-600 mt-1">
                                                                            <Users className="w-3 h-3 inline mr-1" />
                                                                            {slot.teacher.full_name}
                                                                        </div>
                                                                    )}
                                                                    {slot.notes && (
                                                                        <div className="text-gray-500 italic mt-1">{slot.notes}</div>
                                                                    )}
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); deleteSlot(slot.id); }}
                                                                        className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded text-xs"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    className="h-12 rounded border border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer flex items-center justify-center"
                                                                    onClick={() => openCreateModal(dayIndex, period, room)}
                                                                >
                                                                    <Plus className="w-4 h-4 text-gray-300" />
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* Class-based View */
                    !selectedClass ? (
                        <div className="bg-white rounded-lg p-12 text-center">
                            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Chọn một lớp để xem thời khóa biểu</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg overflow-hidden shadow border">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                                            <th className="p-3 border-r border-indigo-400 text-left w-28">Tiết</th>
                                            {DAYS.map((day, i) => (
                                                <th key={day} className="p-3 border-r border-indigo-400 text-center min-w-[120px]">
                                                    <div className="font-bold">{day}</div>
                                                    <div className="text-xs opacity-80">{weekDates[i].toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {PERIODS.map((period) => (
                                            <tr key={period.id} className="border-b hover:bg-gray-50">
                                                <td className="p-2 border-r bg-gray-50 text-center">
                                                    <div className="font-bold text-gray-700">{period.label}</div>
                                                    <div className="text-xs text-gray-500">({period.time})</div>
                                                </td>
                                                {DAYS.map((_, dayIndex) => {
                                                    const slot = getSlotForClassCell(dayIndex, period.start);
                                                    return (
                                                        <td key={dayIndex} className="p-1 border-r">
                                                            {slot ? (
                                                                <div
                                                                    className="p-2 bg-indigo-50 border-2 border-indigo-200 rounded-lg text-sm cursor-pointer hover:shadow-md relative group"
                                                                    onClick={() => openEditModal(slot)}
                                                                >
                                                                    <div className="font-bold text-indigo-800">{slot.subject?.name || "N/A"}</div>
                                                                    <div className="text-indigo-600 text-xs mt-1">
                                                                        <Users className="w-3 h-3 inline mr-1" />
                                                                        {slot.teacher?.full_name || "Chưa phân công"}
                                                                    </div>
                                                                    {slot.room && (
                                                                        <div className="text-gray-500 text-xs">
                                                                            <MapPin className="w-3 h-3 inline mr-1" />
                                                                            {slot.room}
                                                                        </div>
                                                                    )}
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); deleteSlot(slot.id); }}
                                                                        className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    className="h-16 rounded-lg border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer flex items-center justify-center"
                                                                    onClick={() => openCreateModal(dayIndex, period)}
                                                                >
                                                                    <Plus className="w-4 h-4 text-gray-300" />
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
                    )
                )}
            </div>

            {/* Modal for Create/Edit */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl">
                        <div className="p-6 border-b flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                {editingSlot ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                {editingSlot ? 'Chỉnh sửa' : 'Đặt phòng / Thêm tiết học'}
                            </h2>
                            <button onClick={() => { setShowModal(false); setEditingSlot(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lớp *</label>
                                <select
                                    value={formData.class_id}
                                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="">Chọn lớp</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Môn học *</label>
                                <select
                                    value={formData.subject_id}
                                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="">Chọn môn học</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Giáo viên</label>
                                <select
                                    value={formData.teacher_id}
                                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="">Chọn giáo viên</option>
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Thứ</label>
                                    <select
                                        value={formData.day_of_week}
                                        onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        {DAYS.map((day, i) => <option key={i} value={i}>{day}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiết</label>
                                    <select
                                        value={formData.start_time}
                                        onChange={(e) => {
                                            const period = PERIODS.find(p => p.start === e.target.value);
                                            setFormData({ ...formData, start_time: e.target.value, end_time: period?.end || formData.end_time });
                                        }}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        {PERIODS.map(p => <option key={p.id} value={p.start}>{p.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phòng</label>
                                <select
                                    value={formData.room}
                                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="">Chọn phòng</option>
                                    {BUILDINGS.flatMap(b => b.rooms).map(room => (
                                        <option key={room} value={room}>{room}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="p-6 border-t flex justify-end gap-3">
                            <button onClick={() => { setShowModal(false); setEditingSlot(null); }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                                Hủy
                            </button>
                            <button
                                onClick={saveSlot}
                                disabled={saving || !formData.class_id || !formData.subject_id}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                {saving ? 'Đang lưu...' : (editingSlot ? 'Cập nhật' : 'Tạo')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
