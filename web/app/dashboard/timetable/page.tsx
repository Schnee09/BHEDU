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
    GraduationCap,
    ClipboardList,
    Search,
    ChevronDown,
    Save,
} from "lucide-react";
import MobileTimetableList from "@/components/timetable/MobileTimetableList";


interface TimetableSlot {
    id: string;
    class_id: string;
    student_id?: string;
    subject: { id: string; name: string; code: string } | null;
    teacher: { id: string; full_name: string; phone?: string } | null;
    student?: { id: string; full_name: string } | null;
    class?: { id: string; name: string } | null;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room: string | null;
    notes: string | null; // Default notes
    weekly_note?: string | null; // Week-specific notes
    has_weekly_note?: boolean; // Flag for visual indicator
}

interface ClassOption {
    id: string;
    name: string;
    teacher_id?: string;
    teacher?: {
        id: string;
        full_name: string;
        subject_id?: string;
        subjects?: {
            id: string;
            name: string;
            code: string;
        }
    }
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

interface StudentOption {
    id: string;
    full_name: string;
}

// Campuses configuration (Cơ sở)
const CAMPUSES = [
    {
        id: "NQ",
        name: "Ngô Quyền",
        rooms: ["P.1", "P.2", "P.3", "P.4", "P.5", "P.6", "P.7", "P.8", "P.9", "P.10"]
    },
    {
        id: "DVB",
        name: "Đặng Văn Bi",
        rooms: ["P.1", "P.2", "P.3", "P.4"]
    },
    {
        id: "HK",
        name: "Học kèm",
        rooms: ["Linh hoạt"],
        isFlexible: true // Special flag for tutoring - no fixed room
    },
];

const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

// Weekday sessions (Thứ 2-6): 17h - 21h30 (3 sessions of 1h30' each)
const WEEKDAY_SESSIONS = [
    { id: 1, label: "Ca 1", time: "17:00 - 18:30", start: "17:00", end: "18:30" },
    { id: 2, label: "Ca 2", time: "18:30 - 20:00", start: "18:30", end: "20:00" },
    { id: 3, label: "Ca 3", time: "20:00 - 21:30", start: "20:00", end: "21:30" },
];

// Saturday sessions: 8h-11h (2 sessions), 14h-21h30 (5 sessions)
const SATURDAY_SESSIONS = [
    { id: 1, label: "S1", time: "08:00 - 09:30", start: "08:00", end: "09:30" },
    { id: 2, label: "S2", time: "09:30 - 11:00", start: "09:30", end: "11:00" },
    { id: 3, label: "C1", time: "14:00 - 15:30", start: "14:00", end: "15:30" },
    { id: 4, label: "C2", time: "15:30 - 17:00", start: "15:30", end: "17:00" },
    { id: 5, label: "C3", time: "17:00 - 18:30", start: "17:00", end: "18:30" },
    { id: 6, label: "C4", time: "18:30 - 20:00", start: "18:30", end: "20:00" },
    { id: 7, label: "C5", time: "20:00 - 21:30", start: "20:00", end: "21:30" },
];

// Sunday sessions: 8h-11h (2 sessions), 14h-20h (4 sessions)
const SUNDAY_SESSIONS = [
    { id: 1, label: "S1", time: "08:00 - 09:30", start: "08:00", end: "09:30" },
    { id: 2, label: "S2", time: "09:30 - 11:00", start: "09:30", end: "11:00" },
    { id: 3, label: "C1", time: "14:00 - 15:30", start: "14:00", end: "15:30" },
    { id: 4, label: "C2", time: "15:30 - 17:00", start: "15:30", end: "17:00" },
    { id: 5, label: "C3", time: "17:00 - 18:30", start: "17:00", end: "18:30" },
    { id: 6, label: "C4", time: "18:30 - 20:00", start: "18:30", end: "20:00" },
];

// All unique sessions across all days for row headers
const ALL_SESSIONS = [
    { id: 1, label: "S1", time: "08:00 - 09:30", start: "08:00", end: "09:30", days: [5, 6] },
    { id: 2, label: "S2", time: "09:30 - 11:00", start: "09:30", end: "11:00", days: [5, 6] },
    { id: 3, label: "C1", time: "14:00 - 15:30", start: "14:00", end: "15:30", days: [5, 6] },
    { id: 4, label: "C2", time: "15:30 - 17:00", start: "15:30", end: "17:00", days: [5, 6] },
    { id: 5, label: "Ca 1", time: "17:00 - 18:30", start: "17:00", end: "18:30", days: [0, 1, 2, 3, 4, 5, 6] },
    { id: 6, label: "Ca 2", time: "18:30 - 20:00", start: "18:30", end: "20:00", days: [0, 1, 2, 3, 4, 5, 6] },
    { id: 7, label: "Ca 3", time: "20:00 - 21:30", start: "20:00", end: "21:30", days: [0, 1, 2, 3, 4, 5] }, // Not Sunday
];

// Helper to get sessions available for a specific day
const getSessionsForDay = (dayIndex: number) => {
    return ALL_SESSIONS.filter(s => s.days.includes(dayIndex));
};

// Check if a session is available on a specific day
const isSessionAvailable = (sessionStart: string, dayIndex: number) => {
    const session = ALL_SESSIONS.find(s => s.start === sessionStart);
    return session ? session.days.includes(dayIndex) : false;
};

// Legacy PERIODS for backward compatibility
const PERIODS = WEEKDAY_SESSIONS;

export default function TimetablePage() {
    const { profile, loading: profileLoading } = useProfile();
    const [slots, setSlots] = useState<TimetableSlot[]>([]);
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [subjects, setSubjects] = useState<SubjectOption[]>([]);
    const [teachers, setTeachers] = useState<TeacherOption[]>([]);
    const [tutors, setTutors] = useState<TeacherOption[]>([]);  // Separate list for tutors
    const [students, setStudents] = useState<StudentOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentWeek, setCurrentWeek] = useState(new Date());

    // View mode: 'class', 'room', or 'teacher'
    const [viewMode, setViewMode] = useState<'class' | 'room' | 'teacher'>('room');
    const [selectedCampus, setSelectedCampus] = useState(CAMPUSES[0].id);
    const [selectedClass, setSelectedClass] = useState<string>("");
    const [selectedRoom, setSelectedRoom] = useState<string>("");
    const [selectedTeacher, setSelectedTeacher] = useState<string>("");

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        class_id: "",
        student_id: "",
        subject_id: "",
        teacher_id: "",
        day_of_week: 0,
        start_time: "17:00",
        end_time: "18:30",
        room: "",
        notes: "",
        weekly_note: "" // Weekly-specific note
    });

    const isAdmin = profile?.role === "admin" || profile?.role === "staff";
    const isTeacher = profile?.role === "teacher";
    const isStudent = profile?.role === "student";
    const currentCampus = CAMPUSES.find(c => c.id === selectedCampus);
    const isTutoring = selectedCampus === "HK";

    // Auto-select teacher's own schedule when logged in as teacher
    useEffect(() => {
        if (isTeacher && profile?.id && !selectedTeacher) {
            setSelectedTeacher(profile.id);
            setViewMode('teacher');
        }
    }, [isTeacher, profile?.id]);

    // Tutoring sub-view mode: 'teacher' grid or 'list'
    const [tutoringViewMode, setTutoringViewMode] = useState<'teacher' | 'list'>('list');

    // Mobile state
    const [currentMobileDay, setCurrentMobileDay] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1); // 0 = Mon, 6 = Sun


    // Fetch all timetable slots
    const fetchAllSlots = async () => {
        setLoading(true);
        try {
            // Calculate week start date (Monday)
            const weekStart = new Date(currentWeek);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
            const weekStartStr = weekStart.toISOString().split('T')[0];

            // Fetch all slots (no class filter) for room view
            const response = await apiFetch(`/api/timetable/all?week_start_date=${weekStartStr}`);
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
            // Calculate week start date (Monday)
            const weekStart = new Date(currentWeek);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
            const weekStartStr = weekStart.toISOString().split('T')[0];

            const response = await apiFetch(`/api/timetable?class_id=${selectedClass}&week_start_date=${weekStartStr}`);
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
            const [subRes, teacherRes, tutorRes, studentRes] = await Promise.all([
                apiFetch('/api/subjects'),
                apiFetch('/api/admin/users?role=teacher'),
                apiFetch('/api/tutors'),
                apiFetch('/api/admin/users?role=student')
            ]);
            const subData = await subRes.json();
            const teacherData = await teacherRes.json();
            const tutorData = await tutorRes.json();
            const studentData = await studentRes.json();
            setSubjects(subData.subjects || []);
            setTeachers(teacherData.users || []);
            setTutors(tutorData.tutors || []);
            setStudents(studentData.users || []);
        } catch (e) {
            console.error('Failed to fetch subjects/teachers:', e);
        }
    };

    const saveSlot = async () => {
        if (formData.room === 'Linh hoạt') {
            if (!formData.student_id) {
                alert('Vui lòng chọn học sinh');
                return;
            }
        } else {
            if (!formData.class_id) {
                alert('Vui lòng chọn lớp');
                return;
            }
        }

        if (!formData.subject_id) {
            alert('Vui lòng chọn môn học');
            return;
        }

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

            // Save weekly note if provided
            const slotId = isEditing ? editingSlot.id : result.slot?.id;
            if (slotId && formData.weekly_note) {
                // Calculate week start date (Monday)
                const weekStart = new Date(currentWeek);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
                const weekStartStr = weekStart.toISOString().split('T')[0];

                await apiFetch('/api/timetable/weekly-notes', {
                    method: 'POST',
                    body: JSON.stringify({
                        slot_id: slotId,
                        week_start_date: weekStartStr,
                        notes: formData.weekly_note
                    }),
                    headers: { 'Content-Type': 'application/json' }
                });
            } else if (slotId && !formData.weekly_note && editingSlot?.has_weekly_note) {
                // Delete weekly note if it was cleared
                const weekStart = new Date(currentWeek);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
                const weekStartStr = weekStart.toISOString().split('T')[0];

                await apiFetch(`/api/timetable/weekly-notes?slot_id=${slotId}&week_start_date=${weekStartStr}`, {
                    method: 'DELETE'
                });
            }

            setShowModal(false);
            setEditingSlot(null);
            if (viewMode === 'room') {
                await fetchAllSlots();
            } else {
                await fetchClassSlots();
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
            const response = await apiFetch(`/api/timetable/${slotId}`, { method: 'DELETE' });
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Xóa không thành công');
            }

            // Refresh data after successful delete
            if (viewMode === 'room') {
                fetchAllSlots();
            } else if (viewMode === 'teacher') {
                fetchAllSlots();
            } else {
                fetchClassSlots();
            }
        } catch (error: any) {
            console.error('Failed to delete slot:', error);
            alert('Lỗi khi xóa tiết học: ' + (error.message || 'Unknown error'));
        } finally {
            setDeleting(null);
        }
    };

    const openCreateModal = (dayIndex?: number, period?: typeof PERIODS[0], room?: string) => {
        setEditingSlot(null);
        setFormData({
            class_id: room === 'Linh hoạt' ? "" : (selectedClass || ""),
            student_id: "",
            subject_id: "",
            teacher_id: "",
            day_of_week: dayIndex ?? 0,
            start_time: period?.start ?? "17:00",
            end_time: period?.end ?? "18:30",
            room: room || "",
            notes: "",
            weekly_note: ""
        });
        setShowModal(true);
    };

    const openEditModal = (slot: TimetableSlot) => {
        setEditingSlot(slot);
        setFormData({
            class_id: slot.class_id || "",
            student_id: slot.student_id || "",
            subject_id: slot.subject?.id || "",
            teacher_id: slot.teacher?.id || "",
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            room: slot.room || "",
            notes: slot.notes || "",
            weekly_note: slot.weekly_note || ""
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
    }, [viewMode, selectedClass, currentWeek]);

    const getSlotForRoomCell = (room: string, dayIndex: number, startTime: string): TimetableSlot | undefined => {
        // Build full room name with campus prefix
        const fullRoomName = `${currentCampus?.name} - ${room}`;
        return slots.find(
            (slot) => slot.room === fullRoomName && slot.day_of_week === dayIndex && slot.start_time?.substring(0, 5) === startTime
        );
    };

    const getSlotForClassCell = (dayIndex: number, startTime: string): TimetableSlot | undefined => {
        return slots.find(
            (slot) => slot.day_of_week === dayIndex && slot.start_time?.substring(0, 5) === startTime
        );
    };

    const getSlotForTeacherCell = (teacherId: string, dayIndex: number, startTime: string): TimetableSlot | undefined => {
        return slots.find(
            (slot) => slot.teacher?.id === teacherId && slot.day_of_week === dayIndex && slot.start_time?.substring(0, 5) === startTime
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

    const weekDatesDesktop = getWeekDates();

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
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                            <Calendar className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                                {viewMode === 'room' ? 'Lịch Sử Dụng Phòng' : 'Quản Lý Thời Khóa Biểu'}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {weekDatesDesktop[0].toLocaleDateString('vi-VN')} - {weekDatesDesktop[6].toLocaleDateString('vi-VN')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                        <button
                            onClick={() => {
                                const prev = new Date(currentWeek);
                                prev.setDate(prev.getDate() - 7);
                                setCurrentWeek(prev);
                            }}
                            className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-all hover:shadow-sm text-gray-600 dark:text-gray-300"
                            title="Tuần trước"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setCurrentWeek(new Date())}
                            className="px-4 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-all"
                        >
                            Tuần hiện tại
                        </button>
                        <button
                            onClick={() => {
                                const next = new Date(currentWeek);
                                next.setDate(next.getDate() + 7);
                                setCurrentWeek(next);
                            }}
                            className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-all hover:shadow-sm text-gray-600 dark:text-gray-300"
                            title="Tuần tiếp theo"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* View Mode Tabs - Only for Admin/Staff */}
                {isAdmin && (
                    <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 gap-4">
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl w-full sm:w-auto">
                            <button
                                onClick={() => setViewMode('room')}
                                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${viewMode === 'room'
                                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
                                    }`}
                            >
                                <Building2 className="w-4 h-4" />
                                Theo phòng
                            </button>
                            <button
                                onClick={() => setViewMode('class')}
                                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${viewMode === 'class'
                                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
                                    }`}
                            >
                                <Users className="w-4 h-4" />
                                Theo lớp
                            </button>
                            <button
                                onClick={() => setViewMode('teacher')}
                                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${viewMode === 'teacher'
                                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
                                    }`}
                            >
                                <GraduationCap className="w-4 h-4" />
                                Theo giáo viên
                            </button>
                        </div>

                        {/* Condition-based selectors moved here for better layout */}
                        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
                            {viewMode === 'room' && (
                                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl w-full">
                                    {CAMPUSES.map(campus => (
                                        <button
                                            key={campus.id}
                                            onClick={() => setSelectedCampus(campus.id)}
                                            className={`flex-1 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${(campus as any).upcoming ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${selectedCampus === campus.id
                                                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                                }`}
                                            disabled={(campus as any).upcoming}
                                        >
                                            {campus.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {viewMode === 'class' && (
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="w-full sm:w-64 px-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-xl text-gray-700 dark:text-gray-200 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                >
                                    <option value="">-- Chọn lớp --</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            )}

                            {viewMode === 'teacher' && (
                                <select
                                    value={selectedTeacher}
                                    onChange={(e) => setSelectedTeacher(e.target.value)}
                                    className="w-full sm:w-64 px-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-xl text-gray-700 dark:text-gray-200 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                >
                                    <option value="">👨‍🏫 Chọn giáo viên</option>
                                    {teachers.map((t) => (
                                        <option key={t.id} value={t.id}>{t.full_name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                )}

                {/* Campus Title */}
                {viewMode === 'room' && currentCampus && (
                    <div className="text-center mb-4">
                        <h2 className="text-xl font-semibold text-blue-600">
                            {isTutoring ? '📚 HỌC KÈM' : `CƠ SỞ ${currentCampus.name.toUpperCase()}`}
                        </h2>

                        {/* Tutoring sub-view toggle */}
                        {isTutoring && (
                            <div className="flex justify-center gap-2 mt-3">
                                <button
                                    onClick={() => setTutoringViewMode('list')}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tutoringViewMode === 'list'
                                        ? 'bg-purple-100 text-purple-700 border-2 border-purple-400'
                                        : 'bg-gray-50 text-gray-600 border border-gray-300 hover:bg-gray-100'
                                        }`}
                                >
                                    📋 Danh sách
                                </button>
                                <button
                                    onClick={() => setTutoringViewMode('teacher')}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tutoringViewMode === 'teacher'
                                        ? 'bg-purple-100 text-purple-700 border-2 border-purple-400'
                                        : 'bg-gray-50 text-gray-600 border border-gray-300 hover:bg-gray-100'
                                        }`}
                                >
                                    👨‍🏫 Theo giáo viên
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Timetable Grid */}

                {/* Mobile View */}
                <MobileTimetableList
                    slots={slots}
                    days={DAYS}
                    weekDates={weekDatesDesktop}
                    currentDay={currentMobileDay}
                    onDayChange={setCurrentMobileDay}
                    onEditSlot={openEditModal}
                    onDeleteSlot={deleteSlot}
                    onCreateSlot={openCreateModal}
                    viewMode={isTutoring ? 'tutoring' : viewMode}
                    sessions={ALL_SESSIONS}
                    isLoading={loading}
                />


                <div className="hidden md:block">
                    {loading ? (
                        <div className="bg-white rounded-lg p-12 text-center">
                            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
                            <p className="mt-4 text-gray-500">Đang tải...</p>
                        </div>
                    ) : viewMode === 'room' && isTutoring ? (
                        /* Tutoring View */
                        tutoringViewMode === 'list' ? (
                            /* List View for Tutoring */
                            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-purple-50/30 dark:bg-purple-900/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                                            <ClipboardList className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Danh sách học kèm tuần này</h3>
                                    </div>
                                    <button
                                        onClick={() => openCreateModal(0, ALL_SESSIONS[4], 'Linh hoạt')}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-sm shadow-purple-200 dark:shadow-none"
                                    >
                                        <Plus className="w-4 h-4" /> Thêm lịch học kèm
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                                                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Thứ/Ngày</th>
                                                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ca</th>
                                                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Gia sư</th>
                                                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Học sinh/Lớp</th>
                                                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Môn</th>
                                                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ghi chú</th>
                                                <th className="p-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {slots.filter(s => !s.room || s.room === 'Linh hoạt').length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="p-20 text-center">
                                                        <div className="bg-gray-50 dark:bg-gray-900/50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-gray-800">
                                                            <Search className="w-8 h-8 text-gray-300" />
                                                        </div>
                                                        <p className="text-gray-500 dark:text-gray-400 font-medium">Chưa có lịch học kèm nào trong tuần này</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                slots.filter(s => !s.room || s.room === 'Linh hoạt').map(slot => (
                                                    <tr key={slot.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors group">
                                                        <td className="p-4">
                                                            <div className="font-bold text-gray-900 dark:text-white">{DAYS[slot.day_of_week]}</div>
                                                            <div className="text-[10px] text-gray-400 font-medium uppercase">{weekDatesDesktop[slot.day_of_week]?.toLocaleDateString('vi-VN')}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="inline-flex px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300">
                                                                {ALL_SESSIONS.find(s => s.start === slot.start_time?.substring(0, 5))?.label || slot.start_time}
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                                                                    {slot.teacher?.full_name?.charAt(0) || '?'}
                                                                </div>
                                                                <span className="font-bold text-blue-700 dark:text-blue-400 text-sm">{slot.teacher?.full_name || 'Chưa phân công'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                                                            {slot.student?.full_name || slot.class?.name || slot.subject?.name || 'N/A'}
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold rounded uppercase">
                                                                {slot.subject?.name}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="text-sm text-gray-500 dark:text-gray-400 italic line-clamp-1 max-w-[200px]" title={slot.notes || ''}>
                                                                {slot.notes || '-'}
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex gap-2 justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => openEditModal(slot)}
                                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                                                                >
                                                                    <Edit3 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteSlot(slot.id)}
                                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center px-6">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                                        Tổng: <span className="text-gray-900 dark:text-white">{slots.filter(s => !s.room || s.room === 'Linh hoạt').length}</span> buổi học kèm
                                    </span>
                                </div>
                            </div>
                        )
                            : (
                                /* Teacher Grid View for Tutoring */
                                <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-purple-50/30 dark:bg-purple-900/10 flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                                            <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">Lịch học kèm theo gia sư</h3>
                                    </div>
                                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] relative">
                                        <table className="w-full border-separate border-spacing-0">
                                            <thead className="sticky top-0 z-30">
                                                <tr className="bg-purple-600 dark:bg-purple-900 shadow-sm">
                                                    <th className="p-3 border-b border-purple-500 dark:border-emerald-800 text-center text-xs font-semibold text-white uppercase tracking-wider w-24 sticky left-0 z-40 bg-purple-600 dark:bg-purple-900">Ca</th>
                                                    <th className="p-3 border-b border-purple-500 dark:border-emerald-800 text-center text-xs font-semibold text-white uppercase tracking-wider w-32 sticky left-24 z-40 bg-purple-600 dark:bg-purple-900">Gia sư</th>
                                                    {DAYS.map((day, i) => (
                                                        <th key={day} className="p-3 border-b border-purple-500 dark:border-emerald-800 text-center min-w-[140px] bg-purple-600 dark:bg-purple-900">
                                                            <div className="font-bold text-white">{day}</div>
                                                            <div className="text-[10px] text-purple-200 font-medium">
                                                                {weekDatesDesktop[i].toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ALL_SESSIONS.map((session) => (
                                                    tutors.length > 0 ? (
                                                        tutors.map((tutor, tutorIdx) => (
                                                            <tr key={`${session.id}-${tutor.id}`} className="group hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-colors">
                                                                {tutorIdx === 0 && (
                                                                    <td rowSpan={tutors.length} className="p-3 border-b border-r border-gray-100 dark:border-gray-800 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 align-middle text-center sticky left-0 z-20">
                                                                        <div className="font-bold text-purple-600 dark:text-purple-400 text-base">{session.label}</div>
                                                                        <div className="text-[10px] text-gray-400 font-medium leading-tight mt-1">{session.time}</div>
                                                                    </td>
                                                                )}
                                                                <td className="p-2 border-b border-r border-gray-100 dark:border-gray-800 text-center bg-gray-50/50 dark:bg-gray-900/50 w-32 sticky left-24 z-20">
                                                                    <div className="text-xs font-bold text-gray-600 dark:text-gray-400 truncate px-1">{tutor.full_name}</div>
                                                                </td>
                                                                {DAYS.map((_, dayIndex) => {
                                                                    const isAvailable = session.days.includes(dayIndex);
                                                                    const slot = isAvailable ? slots.find(s =>
                                                                        s.teacher?.id === tutor.id &&
                                                                        s.day_of_week === dayIndex &&
                                                                        s.start_time?.substring(0, 5) === session.start &&
                                                                        (!s.room || s.room === 'Linh hoạt')
                                                                    ) : null;

                                                                    return (
                                                                        <td key={dayIndex} className={`p-2 border-b border-r border-gray-100 dark:border-gray-800 h-20 ${!isAvailable ? 'bg-gray-50/50 dark:bg-gray-900/40' : ''}`}>
                                                                            {!isAvailable ? (
                                                                                <div className="h-full w-full rounded-lg bg-gray-100/50 dark:bg-gray-800/50 flex items-center justify-center">
                                                                                    <span className="text-[10px] text-gray-300 font-bold tracking-widest">—</span>
                                                                                </div>
                                                                            ) : slot ? (
                                                                                <div
                                                                                    className="h-full p-2 bg-white dark:bg-gray-800 border-l-4 border-purple-500 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group/card relative overflow-hidden"
                                                                                    onClick={() => openEditModal(slot)}
                                                                                >
                                                                                    <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                                                                                    <div className="font-bold text-gray-900 dark:text-white text-[10px] line-clamp-2 leading-tight group-hover/card:text-purple-600 transition-colors">
                                                                                        {slot.class?.name || slot.subject?.name}
                                                                                    </div>
                                                                                    {(slot.weekly_note || slot.notes) && (
                                                                                        <div className="mt-1 text-gray-400 dark:text-gray-500 text-[9px] flex items-center gap-1 italic border-t border-gray-100 dark:border-gray-800 pt-1">
                                                                                            <ClipboardList className="w-2.5 h-2.5 flex-shrink-0" />
                                                                                            <span className="truncate">{slot.weekly_note ?? slot.notes}</span>
                                                                                            {slot.has_weekly_note && (
                                                                                                <span className="ml-auto text-blue-500" title="Ghi chú riêng tuần này">●</span>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ) : (
                                                                                <div
                                                                                    className="h-full rounded-lg border border-dashed border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/10 cursor-pointer flex items-center justify-center transition-all group/empty"
                                                                                    onClick={() => {
                                                                                        setFormData({ ...formData, teacher_id: tutor.id });
                                                                                        openCreateModal(dayIndex, session, 'Linh hoạt');
                                                                                    }}
                                                                                >
                                                                                    <Plus className="w-3 h-3 text-gray-300 group-hover/empty:text-purple-500 transition-colors" />
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr key={session.id}>
                                                            <td className="p-4 border-b border-r border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-center sticky left-0 z-20">
                                                                <div className="font-bold text-purple-600 dark:text-purple-400">{session.label}</div>
                                                            </td>
                                                            <td colSpan={DAYS.length + 1} className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm border-b">
                                                                Chưa có gia sư nào được cấu hình
                                                            </td>
                                                        </tr>
                                                    )
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )
                    ) : viewMode === 'room' ? (
                        /* Room-based View */
                        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] relative">
                                <table className="w-full border-separate border-spacing-0">
                                    <thead className="sticky top-0 z-30">
                                        <tr className="bg-gray-50 dark:bg-gray-900 shadow-sm">
                                            <th className="p-3 border-b border-r border-gray-100 dark:border-gray-800 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24 sticky left-0 z-40 bg-gray-50 dark:bg-gray-900">Ca</th>
                                            <th className="p-3 border-b border-r border-gray-100 dark:border-gray-800 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-16 sticky left-24 z-40 bg-gray-50 dark:bg-gray-900">Phòng</th>
                                            {DAYS.map((day, i) => (
                                                <th key={day} className="p-3 border-b border-r border-gray-100 dark:border-gray-800 text-center min-w-[160px] bg-gray-50 dark:bg-gray-900">
                                                    <div className="font-bold text-gray-900 dark:text-white">{day}</div>
                                                    <div className="text-[10px] text-gray-400 font-medium">
                                                        {weekDatesDesktop[i].toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ALL_SESSIONS.map((session, sessionIdx) => (
                                            currentCampus?.rooms.map((room, roomIdx) => (
                                                <tr key={`${session.id}-${room}`} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                                    {roomIdx === 0 && (
                                                        <td rowSpan={currentCampus.rooms.length} className="p-3 border-b border-r border-gray-100 dark:border-gray-800 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 align-middle text-center sticky left-0 z-20">
                                                            <div className="font-bold text-blue-600 dark:text-blue-400 text-base">{session.label}</div>
                                                            <div className="text-[10px] text-gray-400 font-medium leading-tight mt-1">{session.time}</div>
                                                        </td>
                                                    )}
                                                    <td className="p-2 border-b border-r border-gray-100 dark:border-gray-800 text-center bg-gray-50/50 dark:bg-gray-900/50 w-16 sticky left-24 z-20">
                                                        <div className="text-xs font-bold text-gray-600 dark:text-gray-400">{room}</div>
                                                    </td>
                                                    {DAYS.map((_, dayIndex) => {
                                                        const isAvailable = session.days.includes(dayIndex);
                                                        const slot = isAvailable ? getSlotForRoomCell(room, dayIndex, session.start) : null;

                                                        return (
                                                            <td key={dayIndex} className={`p-2 border-b border-r border-gray-100 dark:border-gray-800 h-24 ${!isAvailable ? 'bg-gray-50/50 dark:bg-gray-900/40' : ''}`}>
                                                                {!isAvailable ? (
                                                                    <div className="h-full w-full rounded-xl bg-gray-100/50 dark:bg-gray-800/50 flex items-center justify-center">
                                                                        <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">—</span>
                                                                    </div>
                                                                ) : slot ? (
                                                                    <div
                                                                        className="h-full p-2.5 bg-white dark:bg-gray-800 border-l-4 border-blue-500 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group/card relative overflow-hidden"
                                                                        onClick={() => openEditModal(slot)}
                                                                    >
                                                                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                                                                        <div className="font-bold text-gray-900 dark:text-white text-xs mb-1 line-clamp-1 group-hover/card:text-blue-600 transition-colors">
                                                                            {slot.student?.full_name || slot.class?.name || "N/A"}
                                                                        </div>
                                                                        {slot.subject && (
                                                                            <div className="text-blue-600 dark:text-blue-400 text-[10px] font-semibold mb-1 truncate uppercase">{slot.subject.name}</div>
                                                                        )}
                                                                        {slot.teacher && (
                                                                            <div className="text-gray-500 dark:text-gray-400 text-[10px] flex items-center gap-1 truncate">
                                                                                <Users className="w-3 h-3 flex-shrink-0" />
                                                                                {slot.teacher.full_name}
                                                                            </div>
                                                                        )}
                                                                        {(slot.weekly_note || slot.notes) && (
                                                                            <div className="mt-1.5 text-gray-400 dark:text-gray-500 text-[9px] flex items-center gap-1 italic border-t border-gray-100 dark:border-gray-800 pt-1">
                                                                                <ClipboardList className="w-2.5 h-2.5 flex-shrink-0" />
                                                                                <span className="truncate">{slot.weekly_note ?? slot.notes}</span>
                                                                                {slot.has_weekly_note && (
                                                                                    <span className="ml-auto text-blue-500" title="Ghi chú riêng tuần này">●</span>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); deleteSlot(slot.id); }}
                                                                            className="absolute top-1 right-1 p-1.5 opacity-0 group-hover/card:opacity-100 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-all z-10"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        className="h-full rounded-xl border-2 border-dashed border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer flex items-center justify-center transition-all group/empty"
                                                                        onClick={() => openCreateModal(dayIndex, session, `${currentCampus.name} - ${room}`)}
                                                                    >
                                                                        <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 group-hover/empty:scale-110 group-hover/empty:bg-blue-100 dark:group-hover/empty:bg-blue-900/30 transition-all">
                                                                            <Plus className="w-4 h-4 text-gray-300 group-hover/empty:text-blue-500 transition-colors" />
                                                                        </div>
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
                    ) : viewMode === 'class' ? (
                        /* Class-based View */
                        !selectedClass ? (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-16 text-center shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-indigo-800">
                                    <Calendar className="w-8 h-8 text-indigo-500" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Chưa chọn lớp học</h3>
                                <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto text-sm">Vui lòng chọn một lớp từ danh sách phía trên để xem thời khóa biểu chi tiết.</p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] relative">
                                    <table className="w-full border-separate border-spacing-0">
                                        <thead className="sticky top-0 z-30">
                                            <tr className="bg-indigo-600 dark:bg-indigo-900 shadow-sm">
                                                <th className="p-4 border-b border-indigo-500 dark:border-indigo-800 text-center text-xs font-semibold text-white uppercase tracking-wider w-28 sticky left-0 z-40 bg-indigo-600 dark:bg-indigo-900">Ca</th>
                                                {DAYS.map((day, i) => (
                                                    <th key={day} className="p-4 border-b border-indigo-500 dark:border-indigo-800 text-center min-w-[160px] bg-indigo-600 dark:bg-indigo-900">
                                                        <div className="font-bold text-white">{day}</div>
                                                        <div className="text-[10px] text-indigo-200 font-medium uppercase tracking-tight">
                                                            {weekDatesDesktop[i].toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ALL_SESSIONS.map((session) => (
                                                <tr key={session.id} className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                                                    <td className="p-4 border-b border-r border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 align-middle text-center sticky left-0 z-20">
                                                        <div className="font-bold text-indigo-700 dark:text-indigo-400 text-base">{session.label}</div>
                                                        <div className="text-[10px] text-gray-400 font-medium mt-1 leading-tight">{session.time}</div>
                                                    </td>
                                                    {DAYS.map((_, dayIndex) => {
                                                        const isAvailable = session.days.includes(dayIndex);
                                                        const slot = isAvailable ? getSlotForClassCell(dayIndex, session.start) : null;
                                                        return (
                                                            <td key={dayIndex} className={`p-2 border-b border-r border-gray-100 dark:border-gray-800 h-28 ${!isAvailable ? 'bg-gray-50/50 dark:bg-gray-900/40' : ''}`}>
                                                                {!isAvailable ? (
                                                                    <div className="h-full w-full rounded-xl bg-gray-100/50 dark:bg-gray-800/50 flex items-center justify-center">
                                                                        <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">—</span>
                                                                    </div>
                                                                ) : slot ? (
                                                                    <div
                                                                        className="h-full p-3 bg-white dark:bg-gray-800 border-l-4 border-indigo-500 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group/card relative overflow-hidden"
                                                                        onClick={() => openEditModal(slot)}
                                                                    >
                                                                        <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                                                                        <div className="font-bold text-gray-900 dark:text-white text-sm mb-1 line-clamp-1 group-hover/card:text-indigo-600 transition-colors">{slot.subject?.name || "N/A"}</div>
                                                                        <div className="text-indigo-600 dark:text-indigo-400 text-[10px] flex items-center gap-1 font-semibold mb-1 truncate">
                                                                            <Users className="w-3 h-3 flex-shrink-0" />
                                                                            {slot.teacher?.full_name || "Chưa phân công"}
                                                                        </div>
                                                                        {slot.room && (
                                                                            <div className="text-gray-400 dark:text-gray-500 text-[10px] flex items-center gap-1 truncate italic">
                                                                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                                                                {slot.room}
                                                                            </div>
                                                                        )}
                                                                        {(slot.weekly_note || slot.notes) && (
                                                                            <div className="mt-1.5 text-gray-400 dark:text-gray-500 text-[9px] flex items-center gap-1 italic border-t border-gray-100 dark:border-gray-800 pt-1">
                                                                                <ClipboardList className="w-2.5 h-2.5 flex-shrink-0" />
                                                                                <span className="truncate">{slot.weekly_note ?? slot.notes}</span>
                                                                                {slot.has_weekly_note && (
                                                                                    <span className="ml-auto text-blue-500" title="Ghi chú riêng tuần này">●</span>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); deleteSlot(slot.id); }}
                                                                            className="absolute top-1 right-1 p-1.5 opacity-0 group-hover/card:opacity-100 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-all z-10"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        className="h-full rounded-xl border-2 border-dashed border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 cursor-pointer flex items-center justify-center transition-all group/empty"
                                                                        onClick={() => openCreateModal(dayIndex, session)}
                                                                    >
                                                                        <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 group-hover/empty:scale-110 group-hover/empty:bg-indigo-100 dark:group-hover/empty:bg-indigo-900/30 transition-all">
                                                                            <Plus className="w-4 h-4 text-gray-300 group-hover/empty:text-indigo-500 transition-colors" />
                                                                        </div>
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
                    ) : null}

                    {/* Teacher View */}
                    {viewMode === 'teacher' && (
                        !selectedTeacher ? (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-16 text-center shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="bg-green-50 dark:bg-green-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-100 dark:border-green-800">
                                    <GraduationCap className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Chưa chọn giáo viên</h3>
                                <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto text-sm">Vui lòng chọn một giáo viên từ danh sách để xem lịch dạy chi tiết.</p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-green-50/30 dark:bg-green-900/10 flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                        <GraduationCap className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">
                                        Lịch dạy: <span className="text-green-600 dark:text-green-400">{teachers.find(t => t.id === selectedTeacher)?.full_name}</span>
                                    </h3>
                                </div>
                                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] relative">
                                    <table className="w-full border-separate border-spacing-0">
                                        <thead className="sticky top-0 z-30">
                                            <tr className="bg-emerald-600 dark:bg-emerald-900 shadow-sm">
                                                <th className="p-4 border-b border-emerald-500 dark:border-emerald-800 text-center text-xs font-semibold text-white uppercase tracking-wider w-28 sticky left-0 z-40 bg-emerald-600 dark:bg-emerald-900">Ca</th>
                                                {DAYS.map((day, i) => (
                                                    <th key={day} className="p-4 border-b border-emerald-500 dark:border-emerald-800 text-center min-w-[160px] bg-emerald-600 dark:bg-emerald-900">
                                                        <div className="font-bold text-white">{day}</div>
                                                        <div className="text-[10px] text-emerald-200 font-medium uppercase tracking-tight">
                                                            {weekDatesDesktop[i].toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ALL_SESSIONS.map((session) => (
                                                <tr key={session.id} className="group hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors">
                                                    <td className="p-4 border-b border-r border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 align-middle text-center sticky left-0 z-20">
                                                        <div className="font-bold text-emerald-700 dark:text-emerald-400 text-base">{session.label}</div>
                                                        <div className="text-[10px] text-gray-400 font-medium mt-1 leading-tight">{session.time}</div>
                                                    </td>
                                                    {DAYS.map((_, dayIndex) => {
                                                        const isAvailable = session.days.includes(dayIndex);
                                                        const slot = isAvailable ? getSlotForTeacherCell(selectedTeacher, dayIndex, session.start) : null;
                                                        return (
                                                            <td key={dayIndex} className={`p-2 border-b border-r border-gray-100 dark:border-gray-800 h-28 ${!isAvailable ? 'bg-gray-50/50 dark:bg-gray-900/40' : ''}`}>
                                                                {!isAvailable ? (
                                                                    <div className="h-full w-full rounded-xl bg-gray-100/50 dark:bg-gray-800/50 flex items-center justify-center">
                                                                        <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">—</span>
                                                                    </div>
                                                                ) : slot ? (
                                                                    <div
                                                                        className="h-full p-3 bg-white dark:bg-gray-800 border-l-4 border-emerald-500 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group/card relative overflow-hidden"
                                                                        onClick={() => openEditModal(slot)}
                                                                    >
                                                                        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                                                                        <div className="font-bold text-gray-900 dark:text-white text-sm mb-1 line-clamp-1 group-hover/card:text-emerald-600 transition-colors">
                                                                            {slot.student?.full_name || slot.class?.name || "N/A"}
                                                                        </div>
                                                                        <div className="text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold mb-1 truncate uppercase">
                                                                            {slot.subject?.name || "Môn học"}
                                                                        </div>
                                                                        {slot.room && (
                                                                            <div className="text-gray-400 dark:text-gray-500 text-[10px] flex items-center gap-1 truncate italic">
                                                                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                                                                {slot.room}
                                                                            </div>
                                                                        )}
                                                                        {(slot.weekly_note || slot.notes) && (
                                                                            <div className="mt-1.5 text-gray-400 dark:text-gray-500 text-[9px] flex items-center gap-1 italic border-t border-gray-100 dark:border-gray-800 pt-1">
                                                                                <ClipboardList className="w-2.5 h-2.5 flex-shrink-0" />
                                                                                <span className="truncate">{slot.weekly_note ?? slot.notes}</span>
                                                                                {slot.has_weekly_note && (
                                                                                    <span className="ml-auto text-blue-500" title="Ghi chú riêng tuần này">●</span>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); deleteSlot(slot.id); }}
                                                                            className="absolute top-1 right-1 p-1.5 opacity-0 group-hover/card:opacity-100 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-all z-10"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="h-full rounded-xl border-2 border-dashed border-gray-100 dark:border-gray-700 flex items-center justify-center">
                                                                        <span className="text-xs text-gray-300 font-medium">Trống</span>
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
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 transition-all">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl ${editingSlot ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                        {editingSlot ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                                            {editingSlot ? 'Chỉnh sửa' : 'Thêm tiết học mới'}
                                        </h2>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide">
                                            {editingSlot ? 'Cập nhật thông tin tiết học' : 'Đặt phòng hoặc thêm lịch học kèm'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => { setShowModal(false); setEditingSlot(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                                {/* Context Info - show what was selected from grid */}
                                {formData.room && (
                                    <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 flex gap-4">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg h-fit">
                                            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="grid grid-cols-3 gap-y-1 flex-1">
                                            <div className="text-[10px] text-blue-500 dark:text-blue-400 font-bold uppercase tracking-widest">Phòng</div>
                                            <div className="text-[10px] text-blue-500 dark:text-blue-400 font-bold uppercase tracking-widest">Ngày</div>
                                            <div className="text-[10px] text-blue-500 dark:text-blue-400 font-bold uppercase tracking-widest">Ca học</div>
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{formData.room}</div>
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{DAYS[formData.day_of_week]}</div>
                                            <div className="text-sm font-bold text-gray-900 dark:text-white tabular-nums px-2 py-0.5 bg-white dark:bg-gray-800 rounded-md border border-blue-100 dark:border-blue-800 w-fit">{formData.start_time}</div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-5">
                                    {formData.room === 'Linh hoạt' ? (
                                        /* Tutoring Mode: Student + Subject + Tutor */
                                        <>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Học sinh *</label>
                                                <div className="relative group">
                                                    <select
                                                        value={formData.student_id}
                                                        onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                                        className="w-full pl-3 pr-10 py-2.5 bg-gray-50/50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none transition-all group-hover:border-gray-200 dark:group-hover:border-gray-700"
                                                    >
                                                        <option value="">-- Chọn học sinh --</option>
                                                        {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
                                                </div>
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Môn học *</label>
                                                <div className="relative group">
                                                    <select
                                                        value={formData.subject_id}
                                                        onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                                                        className="w-full pl-3 pr-10 py-2.5 bg-gray-50/50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none transition-all group-hover:border-gray-200 dark:group-hover:border-gray-700"
                                                    >
                                                        <option value="">-- Chọn môn --</option>
                                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
                                                </div>
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Gia sư *</label>
                                                <div className="relative group">
                                                    <select
                                                        value={formData.teacher_id}
                                                        onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                                                        className="w-full pl-3 pr-10 py-2.5 bg-gray-50/50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none transition-all group-hover:border-gray-200 dark:group-hover:border-gray-700"
                                                    >
                                                        <option value="">-- Chọn gia sư --</option>
                                                        {tutors.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        /* Regular Class Mode: Only show Lớp */
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Lớp *</label>
                                            <div className="relative group">
                                                <select
                                                    value={formData.class_id}
                                                    onChange={(e) => {
                                                        const classId = e.target.value;
                                                        const selectedClassObj = classes.find(c => c.id === classId);

                                                        setFormData(prev => ({
                                                            ...prev,
                                                            class_id: classId,
                                                            teacher_id: selectedClassObj?.teacher_id || prev.teacher_id,
                                                            subject_id: selectedClassObj?.teacher?.subject_id || prev.subject_id
                                                        }));
                                                    }}
                                                    className="w-full pl-3 pr-10 py-2.5 bg-gray-50/50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none transition-all group-hover:border-gray-200 dark:group-hover:border-gray-700"
                                                >
                                                    <option value="">-- Chọn lớp --</option>
                                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
                                            </div>
                                            {formData.class_id && (
                                                <div className="mt-3 p-3 bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/30 rounded-xl flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-gray-400 uppercase tracking-tighter">Giáo viên:</span>
                                                        <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                                                            {teachers.find(t => t.id === formData.teacher_id)?.full_name || "Chưa có"}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col text-right">
                                                        <span className="text-[10px] text-gray-400 uppercase tracking-tighter">Môn học:</span>
                                                        <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                                                            {subjects.find(s => s.id === formData.subject_id)?.name || "Chưa có"}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Only show advanced options when no context or editing */}
                                {(!formData.room || editingSlot) && (
                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tùy chọn nâng cao</span>
                                            <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Thứ</label>
                                                <div className="relative group">
                                                    <select
                                                        value={formData.day_of_week}
                                                        onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                                                        className="w-full pl-3 pr-10 py-2.5 bg-gray-50/50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none transition-all group-hover:border-gray-200 dark:group-hover:border-gray-700"
                                                    >
                                                        {DAYS.map((day, i) => <option key={i} value={i}>{day}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Ca học</label>
                                                <div className="relative group">
                                                    <select
                                                        value={formData.start_time}
                                                        onChange={(e) => {
                                                            const session = ALL_SESSIONS.find(s => s.start === e.target.value);
                                                            setFormData({ ...formData, start_time: e.target.value, end_time: session?.end || formData.end_time });
                                                        }}
                                                        className="w-full pl-3 pr-10 py-2.5 bg-gray-50/50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none transition-all group-hover:border-gray-200 dark:group-hover:border-gray-700"
                                                    >
                                                        {ALL_SESSIONS.map(p => <option key={p.id} value={p.start}>{p.label} ({p.time})</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-5">
                                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Vị trí / Phòng</label>
                                            <div className="relative group">
                                                <select
                                                    value={formData.room}
                                                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                                    className="w-full pl-3 pr-10 py-2.5 bg-gray-50/50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none transition-all group-hover:border-gray-200 dark:group-hover:border-gray-700"
                                                >
                                                    <option value="">-- Chọn phòng --</option>
                                                    <option value="Linh hoạt">🎓 Học kèm (Linh hoạt)</option>
                                                    {CAMPUSES.filter(c => c.id !== 'HK').flatMap(c => c.rooms.map(room => `${c.name} - ${room}`)).map(room => (
                                                        <option key={room} value={room}>{room}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Ghi chú mặc định */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                                        Ghi chú mặc định (áp dụng mọi tuần)
                                    </label>
                                    <textarea
                                        value={formData.notes || ""}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none min-h-[60px] transition-all resize-none placeholder:text-gray-300"
                                        placeholder="Ghi chú áp dụng cho tất cả các tuần..."
                                    />
                                </div>

                                {/* Ghi chú tuần này */}
                                <div>
                                    <label className="block text-xs font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Ghi chú riêng tuần này (ưu tiên hiển thị)
                                    </label>
                                    <textarea
                                        value={formData.weekly_note || ""}
                                        onChange={(e) => setFormData({ ...formData, weekly_note: e.target.value })}
                                        className="w-full px-4 py-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-2xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none min-h-[60px] transition-all resize-none placeholder:text-blue-300"
                                        placeholder="Ghi chú chỉ áp dụng cho tuần hiện tại..."
                                    />
                                    {formData.weekly_note && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, weekly_note: "" })}
                                            className="mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                                        >
                                            ↩️ Xóa ghi chú tuần này
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex justify-end gap-3">
                                <button
                                    onClick={() => { setShowModal(false); setEditingSlot(null); }}
                                    className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={saveSlot}
                                    disabled={saving || !formData.subject_id || (formData.room === 'Linh hoạt' ? !formData.student_id : !formData.class_id)}
                                    className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 dark:shadow-none flex items-center gap-2 group/btn"
                                >
                                    {saving ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                    )}
                                    {saving ? 'Đang lưu...' : (editingSlot ? 'Cập nhật' : 'Lưu lại')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div >
        </div >
    );
}
