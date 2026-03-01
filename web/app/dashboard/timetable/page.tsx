"use client";

import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { usePermissions } from "@/hooks/usePermissions";
import PageGuard from "@/components/PageGuard";
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
    Building,
    BookOpen,
    Filter,
    CheckCircle2,
    Info,
    Layout,
    AlertCircle,
    Link as LinkIcon
} from "lucide-react";
import Link from "next/link";
import MobileTimetableList from "@/components/timetable/MobileTimetableList";
import { cn } from "@/lib/utils";
import { getDisplayName } from "@/lib/utils/names";
import {
    Button,
    Card,
    Badge,
    Modal,
    Input,
    LoadingState,
    Alert,
    EmptyState,
} from "@/components/ui";
import { useToast } from "@/hooks/useToast";

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
    course_id?: string;
    course?: {
        id: string;
        name: string;
        code: string;
    };
    teacher_id?: string;
    teacher?: {
        full_name: string;
        teacher_subjects?: Array<{
            subject_id: string;
            is_primary: boolean;
            subjects: {
                id: string;
                name: string;
                code: string;
            }
        }>;
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
    return (
        <PageGuard permissions="timetable.view">
            <TimetableContent />
        </PageGuard>
    );
}

function TimetableContent() {
    const { profile, loading: profileLoading } = useProfile();
    const { isAdmin: isSystemAdmin, isStaff: isSystemStaff, isTeacher, isStudent } = usePermissions();
    const [slots, setSlots] = useState<TimetableSlot[]>([]);
    // ... rest of state
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

    const isAdmin = isSystemAdmin || isSystemStaff;
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
            // Unwrap V2 response if needed
            const slotsData = data.data?.slots || data.slots || [];
            setSlots(slotsData);
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
            // Unwrap V2 response if needed
            const slotsData = data.data?.slots || data.slots || [];
            setSlots(slotsData);
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
            // Unwrap V2 response if needed
            const classesData = data.data?.data || data.data || data.classes || [];
            setClasses(classesData);
        } catch (error) {
            console.error("Failed to fetch classes:", error);
        }
    };

    const fetchSubjectsAndTeachers = async () => {
        try {
            const [subRes, teacherRes, tutorRes, studentRes] = await Promise.all([
                apiFetch('/api/subjects'),
                apiFetch('/api/admin/users?role=teacher&limit=1000'),
                apiFetch('/api/tutors?limit=1000'),
                apiFetch('/api/admin/users?role=student&limit=1000')
            ]);
            const subData = await subRes.json();
            const teacherData = await teacherRes.json();
            const tutorData = await tutorRes.json();
            const studentData = await studentRes.json();

            setSubjects(subData.data || subData.subjects || []);
            setTeachers(teacherData.data?.data || teacherData.data || teacherData.users || []);
            setTutors(tutorData.data || tutorData.tutors || []);
            setStudents(studentData.data?.data || studentData.data || studentData.users || []);
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
                    class_id: formData.class_id || null,
                    student_id: formData.student_id || null,
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
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 p-4 sm:p-8">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 bg-white dark:bg-gray-800/80 p-8 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-premium backdrop-blur-md">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Layout className="w-6 h-6 text-primary" />
                            </div>
                            <Badge variant="warning">Quản trị</Badge>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white uppercase leading-none">
                            {viewMode === 'room' ? 'Lịch Sử Dụng Phòng' : 'Quản Lý Thời Khóa Biểu'}
                        </h1>
                        <p className="text-muted mt-2 max-w-2xl font-medium">
                            {weekDatesDesktop[0].toLocaleDateString('vi-VN')} - {weekDatesDesktop[6].toLocaleDateString('vi-VN')}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 items-end">
                        <div className="flex items-center gap-3 bg-gray-100 dark:bg-white/5 p-1.5 rounded-2xl">
                            <div className="flex items-center gap-3 px-3 border-r border-gray-200 dark:border-gray-700 mr-1 pr-4">
                                <Link href="/dashboard/my-schedule" className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                                    <LinkIcon className="w-3 h-3" />
                                    Cá nhân
                                </Link>
                                <span className="text-stone-300 dark:text-stone-700">•</span>
                                <Link href="/dashboard/calendar" className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                                    <LinkIcon className="w-3 h-3" />
                                    Sự kiện
                                </Link>
                            </div>
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
                                <span className="text-sm font-black px-4 min-w-[150px] text-center">
                                    Tuần {weekDatesDesktop[0].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - {weekDatesDesktop[6].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
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
                </div>
            </div>

            {/* View Mode Tabs - Only for Admin/Staff */}
            {isAdmin && (
                <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 gap-4">
                    <div className="flex bg-gray-100 dark:bg-white/5 p-1.5 rounded-2xl w-full sm:w-auto">
                        <button
                            onClick={() => setViewMode('room')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2",
                                viewMode === 'room'
                                    ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                                    : "text-muted hover:text-gray-900 dark:hover:text-white"
                            )}
                        >
                            <Building className="w-4 h-4" />
                            Theo phòng
                        </button>
                        <button
                            onClick={() => setViewMode('class')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2",
                                viewMode === 'class'
                                    ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                                    : "text-muted hover:text-gray-900 dark:hover:text-white"
                            )}
                        >
                            <Users className="w-4 h-4" />
                            Theo lớp
                        </button>
                        <button
                            onClick={() => setViewMode('teacher')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2",
                                viewMode === 'teacher'
                                    ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                                    : "text-muted hover:text-gray-900 dark:hover:text-white"
                            )}
                        >
                            <GraduationCap className="w-4 h-4" />
                            Theo giáo viên
                        </button>
                    </div>

                    <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
                        {viewMode === 'room' && (
                            <div className="flex bg-gray-100 dark:bg-white/5 p-1.5 rounded-2xl">
                                {CAMPUSES.map(campus => (
                                    <button
                                        key={campus.id}
                                        onClick={() => setSelectedCampus(campus.id)}
                                        className={cn(
                                            "px-6 py-2.5 rounded-xl text-sm font-black transition-all",
                                            (campus as any).upcoming ? "opacity-30 cursor-not-allowed" : "cursor-pointer",
                                            selectedCampus === campus.id
                                                ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                                                : "text-muted hover:text-gray-900 dark:hover:text-white"
                                        )}
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
                                className="w-full sm:w-64 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/5 rounded-xl text-sm font-black text-gray-900 dark:text-white focus:border-primary outline-none transition-all shadow-sm"
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
                                className="w-full sm:w-64 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/5 rounded-xl text-sm font-black text-gray-900 dark:text-white focus:border-primary outline-none transition-all shadow-sm"
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
                    <LoadingState message="Đang tải dữ liệu thời khóa biểu..." />
                ) : viewMode === 'room' && isTutoring ? (
                    /* Tutoring View */
                    tutoringViewMode === 'list' ? (
                        /* List View for Tutoring - Premium Refresh */
                        <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl border border-stone-200/50 dark:border-white/5">
                            <div className="p-8 border-b border-stone-200/50 dark:border-white/5 bg-white/60 dark:bg-stone-900/60 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-amber-500/10 rounded-2xl">
                                        <ClipboardList className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-stone-900 dark:text-stone-100 text-xl tracking-tight">Lịch học kèm tuần này</h3>
                                        <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">Danh sách quản lý tập trung</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => openCreateModal(0, ALL_SESSIONS[4], 'Linh hoạt')}
                                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-[20px] text-sm font-black transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
                                >
                                    <Plus className="w-4 h-4" /> Thêm lịch học kèm
                                </button>
                            </div>
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-stone-500/5 dark:bg-white/2">
                                            <th className="p-5 text-left text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">Thứ / Ngày</th>
                                            <th className="p-5 text-left text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">Ca học</th>
                                            <th className="p-5 text-left text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">Gia sư</th>
                                            <th className="p-5 text-left text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">Học sinh / Lớp</th>
                                            <th className="p-5 text-left text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">Môn học</th>
                                            <th className="p-5 text-left text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">Ghi chú</th>
                                            <th className="p-5 text-center text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] w-32">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {slots.filter(s => !s.room || s.room === 'Linh hoạt').length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="p-32 text-center">
                                                    <div className="bg-stone-500/5 dark:bg-white/5 w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-stone-200/50 dark:border-white/5">
                                                        <Search className="w-10 h-10 text-stone-300 dark:text-stone-700" />
                                                    </div>
                                                    <p className="text-stone-900 dark:text-stone-100 font-black text-xl tracking-tight">Trống lịch học kèm</p>
                                                    <p className="text-stone-400 font-bold uppercase tracking-widest text-xs mt-2">Chưa có lịch nào được tạo trong tuần này</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            slots.filter(s => !s.room || s.room === 'Linh hoạt').map(slot => (
                                                <tr key={slot.id} className="group transition-colors hover:bg-stone-500/5 dark:hover:bg-white/3">
                                                    <td className="p-5">
                                                        <div className="font-black text-stone-900 dark:text-stone-100 text-base leading-none mb-1.5">{DAYS[slot.day_of_week]}</div>
                                                        <div className="text-[10px] text-amber-500 font-black uppercase tracking-widest">{weekDatesDesktop[slot.day_of_week]?.toLocaleDateString('vi-VN')}</div>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="inline-flex px-3 py-1 bg-amber-500/10 rounded-xl text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest border border-amber-500/20">
                                                            {ALL_SESSIONS.find(s => s.start === slot.start_time?.substring(0, 5))?.label || slot.start_time}
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-white/5 shadow-sm border border-stone-200/50 dark:border-white/5 flex items-center justify-center text-stone-900 dark:text-stone-100 font-black text-xs">
                                                                {slot.teacher?.full_name?.charAt(0) || '?'}
                                                            </div>
                                                            <span className="font-black text-stone-900 dark:text-stone-100 text-sm tracking-tight">{slot.teacher?.full_name || 'Chưa phân công'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 font-black text-stone-900 dark:text-stone-100 text-sm tracking-tight">
                                                        {slot.student?.full_name || slot.class?.name || slot.subject?.name || 'N/A'}
                                                    </td>
                                                    <td className="p-5 text-amber-600 dark:text-amber-500 text-[11px] font-black uppercase tracking-widest">
                                                        {slot.subject?.name}
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="text-xs text-stone-400 dark:text-stone-500 font-medium italic line-clamp-1 max-w-[200px]" title={slot.notes || ''}>
                                                            {slot.notes || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                                            <button
                                                                onClick={() => openEditModal(slot)}
                                                                className="w-10 h-10 bg-white dark:bg-white/5 text-stone-400 hover:text-amber-500 rounded-2xl shadow-sm border border-stone-200/50 dark:border-white/5 flex items-center justify-center transition-all"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteSlot(slot.id)}
                                                                className="w-10 h-10 bg-white dark:bg-white/5 text-stone-400 hover:text-red-500 rounded-2xl shadow-sm border border-stone-200/50 dark:border-white/5 flex items-center justify-center transition-all"
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
                            <div className="p-6 border-t border-stone-200/50 dark:border-white/5 bg-stone-500/5 dark:bg-white/2 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,166,35,0.6)]"></div>
                                    <span className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">
                                        Tổng cộng: <span className="text-stone-900 dark:text-stone-100">{slots.filter(s => !s.room || s.room === 'Linh hoạt').length}</span> buổi học kèm
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                        : (
                            /* Teacher Grid View for Tutoring - Premium Refresh */
                            <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl border border-stone-200/50 dark:border-white/5">
                                <div className="p-6 border-b border-stone-200/50 dark:border-white/5 bg-white/60 dark:bg-stone-900/60 flex items-center gap-4">
                                    <div className="p-2.5 bg-amber-500/10 rounded-2xl">
                                        <GraduationCap className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">Lịch học kèm theo gia sư</h3>
                                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">Phân bổ giảng dạy theo ngày</p>
                                    </div>
                                </div>
                                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] relative custom-scrollbar">
                                    <table className="w-full border-separate border-spacing-0">
                                        <thead className="sticky top-0 z-30">
                                            <tr className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md">
                                                <th className="p-4 border-b border-stone-200/50 dark:border-white/5 text-center text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] w-24 sticky left-0 z-40 bg-white/95 dark:bg-stone-900/95">Ca học</th>
                                                <th className="p-4 border-b border-stone-200/50 dark:border-white/5 text-center text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] w-32 sticky left-24 z-40 bg-white/95 dark:bg-stone-900/95">Gia sư</th>
                                                {DAYS.map((day, i) => (
                                                    <th key={day} className="p-4 border-b border-stone-200/50 dark:border-white/5 text-center min-w-[200px] bg-transparent">
                                                        <div className="font-black text-stone-900 dark:text-stone-100 uppercase tracking-tighter text-base">{day}</div>
                                                        <div className="text-[10px] text-amber-500 font-black uppercase tracking-widest mt-0.5">
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
                                                        <tr key={`${session.id}-${tutor.id}`} className="group transition-colors">
                                                            {tutorIdx === 0 && (
                                                                <td rowSpan={tutors.length} className="p-4 border-b border-stone-200/50 dark:border-white/5 align-middle text-center sticky left-0 z-20 bg-white/90 dark:bg-stone-900/90 shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
                                                                    <div className="font-black text-amber-500 text-lg leading-tight">{session.label}</div>
                                                                    <div className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest mt-1">{session.time}</div>
                                                                </td>
                                                            )}
                                                            <td className="p-2 border-b border-stone-200/50 dark:border-white/5 text-center bg-stone-500/5 dark:bg-white/3 w-32 sticky left-24 z-20">
                                                                <div className="text-xs font-black text-stone-500 dark:text-stone-400 truncate px-2">{getDisplayName(tutor).split(' ').pop()}</div>
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
                                                                    <td key={dayIndex} className={cn(
                                                                        "p-3 border-b border-stone-200/50 dark:border-white/5 h-24 transition-all duration-300",
                                                                        !isAvailable ? "bg-stone-500/5 dark:bg-white/2 opacity-30" : "group-hover:bg-stone-500/2 dark:group-hover:bg-white/2"
                                                                    )}>
                                                                        {!isAvailable ? (
                                                                            <div className="h-full w-full rounded-2xl border border-stone-200/5 dark:border-white/2 flex items-center justify-center">
                                                                                <span className="text-[10px] text-stone-300 dark:text-stone-700 font-black uppercase tracking-widest">Off</span>
                                                                            </div>
                                                                        ) : slot ? (
                                                                            <div
                                                                                className="h-full p-3 bg-white/80 dark:bg-white/5 backdrop-blur-sm border-l-4 border-amber-500 rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer group/card relative overflow-hidden"
                                                                                onClick={() => openEditModal(slot)}
                                                                            >
                                                                                <div className="font-black text-stone-900 dark:text-stone-100 text-[11px] line-clamp-2 leading-tight mb-1.5">
                                                                                    {slot.class?.name || slot.student?.full_name || slot.subject?.name}
                                                                                </div>
                                                                                <div className="flex items-center gap-2 mt-auto pt-1.5 border-t border-stone-200/30 dark:border-white/5">
                                                                                    {(slot.weekly_note || slot.notes) && (
                                                                                        <ClipboardList className="w-2.5 h-2.5 text-stone-400 flex-shrink-0" />
                                                                                    )}
                                                                                    <span className="text-[9px] text-stone-400 font-bold truncate">{slot.weekly_note ?? slot.notes}</span>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div
                                                                                className="h-full rounded-2xl border-2 border-dashed border-stone-200 dark:border-white/5 hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer flex items-center justify-center transition-all group/empty"
                                                                                onClick={() => {
                                                                                    setFormData({ ...formData, teacher_id: tutor.id });
                                                                                    openCreateModal(dayIndex, session, 'Linh hoạt');
                                                                                }}
                                                                            >
                                                                                <Plus className="w-4 h-4 text-stone-300 dark:text-stone-700 group-hover/empty:text-amber-500 transition-colors" />
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr key={session.id}>
                                                        <td colSpan={DAYS.length + 2} className="p-16 text-center text-stone-400 bg-stone-500/5 dark:bg-white/3">
                                                            <div className="font-black uppercase tracking-[0.2em] text-xs">Chưa có gia sư nào được cấu hình</div>
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
                    /* Room-based View - Premium Board Layout */
                    <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl border border-stone-200/50 dark:border-white/5">
                        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] relative custom-scrollbar">
                            <table className="w-full border-separate border-spacing-0">
                                <thead className="sticky top-0 z-30">
                                    <tr className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-md">
                                        <th className="p-4 border-b border-stone-200/50 dark:border-white/5 text-center text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] w-28 sticky left-0 z-40 bg-white/95 dark:bg-stone-900/95">Ca học</th>
                                        <th className="p-4 border-b border-stone-200/50 dark:border-white/5 text-center text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] w-20 sticky left-28 z-40 bg-white/95 dark:bg-stone-900/95">Phòng</th>
                                        {DAYS.map((day, i) => (
                                            <th key={day} className="p-4 border-b border-stone-200/50 dark:border-white/5 text-center min-w-[200px] bg-transparent">
                                                <div className="font-black text-stone-900 dark:text-stone-100 uppercase tracking-tighter text-base">{day}</div>
                                                <div className="text-[10px] text-amber-500 font-black uppercase tracking-widest mt-0.5">
                                                    {weekDatesDesktop[i].toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {ALL_SESSIONS.map((session, sessionIdx) => (
                                        currentCampus?.rooms.map((room, roomIdx) => (
                                            <tr key={`${session.id}-${room}`} className="group transition-colors">
                                                {roomIdx === 0 && (
                                                    <td rowSpan={currentCampus.rooms.length} className="p-4 border-b border-stone-200/50 dark:border-white/5 align-middle text-center sticky left-0 z-20 bg-white/90 dark:bg-stone-900/90 shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
                                                        <div className="font-black text-amber-500 text-lg leading-tight">{session.label}</div>
                                                        <div className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest mt-1">{session.time}</div>
                                                    </td>
                                                )}
                                                <td className="p-2 border-b border-stone-200/50 dark:border-white/5 text-center bg-stone-500/5 dark:bg-white/3 w-20 sticky left-28 z-20">
                                                    <div className="text-sm font-black text-stone-900 dark:text-stone-100">{room}</div>
                                                </td>
                                                {DAYS.map((_, dayIndex) => {
                                                    const isAvailable = session.days.includes(dayIndex);
                                                    const slot = isAvailable ? getSlotForRoomCell(room, dayIndex, session.start) : null;

                                                    return (
                                                        <td key={dayIndex} className={cn(
                                                            "p-3 border-b border-stone-200/50 dark:border-white/5 h-28 transition-all duration-300",
                                                            !isAvailable ? "bg-stone-500/5 dark:bg-white/2 opacity-30" : "group-hover:bg-stone-500/2 dark:group-hover:bg-white/2"
                                                        )}>
                                                            {!isAvailable ? (
                                                                <div className="h-full w-full rounded-2xl border border-stone-200/5 dark:border-white/2 flex items-center justify-center">
                                                                    <span className="text-[10px] text-stone-300 dark:text-stone-700 font-black uppercase tracking-widest">Off</span>
                                                                </div>
                                                            ) : slot ? (
                                                                <div
                                                                    className="h-full p-4 bg-white/80 dark:bg-white/5 backdrop-blur-sm border-l-4 border-amber-500 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group/card relative overflow-hidden"
                                                                    onClick={() => openEditModal(slot)}
                                                                >
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <div className="font-black text-stone-900 dark:text-stone-100 text-[13px] leading-tight line-clamp-2">
                                                                            {slot.student?.full_name || slot.class?.name || "N/A"}
                                                                        </div>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); deleteSlot(slot.id); }}
                                                                            className="p-1.5 opacity-0 group-hover/card:opacity-100 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all z-10"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                    {slot.subject && (
                                                                        <div className="text-amber-600 dark:text-amber-500 text-[10px] font-black uppercase tracking-wider mb-2">{slot.subject.name}</div>
                                                                    )}
                                                                    <div className="flex items-center gap-3 mt-auto">
                                                                        {slot.teacher && (
                                                                            <div className="text-stone-500 dark:text-stone-400 text-[10px] font-bold flex items-center gap-1.5">
                                                                                <div className="w-4 h-4 rounded-full bg-stone-500/10 flex items-center justify-center">
                                                                                    <Users className="w-2.5 h-2.5" />
                                                                                </div>
                                                                                {getDisplayName(slot.teacher).split(' ').pop()}
                                                                            </div>
                                                                        )}
                                                                        {slot.has_weekly_note && (
                                                                            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,166,35,0.6)]" title="Ghi chú tuần này" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    className="h-full rounded-2xl border-2 border-dashed border-stone-200 dark:border-white/5 hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer flex items-center justify-center transition-all group/empty"
                                                                    onClick={() => openCreateModal(dayIndex, session, `${currentCampus.name} - ${room}`)}
                                                                >
                                                                    <div className="p-2.5 rounded-2xl bg-stone-500/5 dark:bg-white/5 group-hover/empty:scale-110 group-hover/empty:bg-amber-500 group-hover/empty:text-white transition-all text-stone-300 dark:text-stone-700">
                                                                        <Plus className="w-4 h-4" />
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
                        <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl border border-stone-200/50 dark:border-white/5">
                            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] relative custom-scrollbar">
                                <table className="w-full border-separate border-spacing-0">
                                    <thead className="sticky top-0 z-30">
                                        <tr className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md">
                                            <th className="p-4 border-b border-stone-200/50 dark:border-white/5 text-center text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] w-28 sticky left-0 z-40 bg-white/95 dark:bg-stone-900/95">Ca học</th>
                                            {DAYS.map((day, i) => (
                                                <th key={day} className="p-4 border-b border-stone-200/50 dark:border-white/5 text-center min-w-[200px] bg-transparent">
                                                    <div className="font-black text-stone-900 dark:text-stone-100 uppercase tracking-tighter text-base">{day}</div>
                                                    <div className="text-[10px] text-amber-500 font-black uppercase tracking-widest mt-0.5">
                                                        {weekDatesDesktop[i].toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ALL_SESSIONS.map((session) => (
                                            <tr key={session.id} className="group transition-colors">
                                                <td className="p-4 border-b border-stone-200/50 dark:border-white/5 align-middle text-center sticky left-0 z-20 bg-white/90 dark:bg-stone-900/90 shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
                                                    <div className="font-black text-amber-500 text-lg leading-tight">{session.label}</div>
                                                    <div className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest mt-1">{session.time}</div>
                                                </td>
                                                {DAYS.map((_, dayIndex) => {
                                                    const isAvailable = session.days.includes(dayIndex);
                                                    const slot = isAvailable ? getSlotForClassCell(dayIndex, session.start) : null;
                                                    return (
                                                        <td key={dayIndex} className={cn(
                                                            "p-3 border-b border-stone-200/50 dark:border-white/5 h-28 transition-all duration-300",
                                                            !isAvailable ? "bg-stone-500/5 dark:bg-white/2 opacity-30" : "group-hover:bg-stone-500/2 dark:group-hover:bg-white/2"
                                                        )}>
                                                            {!isAvailable ? (
                                                                <div className="h-full w-full rounded-2xl border border-stone-200/5 dark:border-white/2 flex items-center justify-center">
                                                                    <span className="text-[10px] text-stone-300 dark:text-stone-700 font-black uppercase tracking-widest">Off</span>
                                                                </div>
                                                            ) : slot ? (
                                                                <div
                                                                    className="h-full p-4 bg-white/80 dark:bg-white/5 backdrop-blur-sm border-l-4 border-amber-500 rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer group/card relative overflow-hidden"
                                                                    onClick={() => openEditModal(slot)}
                                                                >
                                                                    <div className="font-black text-stone-900 dark:text-stone-100 text-[13px] leading-tight line-clamp-2 mb-2">{slot.subject?.name || "N/A"}</div>
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center">
                                                                            <Users className="w-3 h-3 text-amber-600 dark:text-amber-500" />
                                                                        </div>
                                                                        <span className="text-stone-500 dark:text-stone-400 text-[10px] font-bold truncate">{slot.teacher?.full_name || "Chưa phân công"}</span>
                                                                    </div>
                                                                    {slot.room && (
                                                                        <div className="text-stone-400 dark:text-stone-500 text-[9px] flex items-center gap-1 truncate font-medium">
                                                                            <MapPin className="w-2.5 h-2.5" />
                                                                            {slot.room}
                                                                        </div>
                                                                    )}
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); deleteSlot(slot.id); }}
                                                                        className="absolute top-2 right-2 p-1.5 opacity-0 group-hover/card:opacity-100 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all z-10"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    className="h-full rounded-2xl border-2 border-dashed border-stone-200 dark:border-white/5 hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer flex items-center justify-center transition-all group/empty"
                                                                    onClick={() => openCreateModal(dayIndex, session)}
                                                                >
                                                                    <div className="p-2.5 rounded-2xl bg-stone-500/5 dark:bg-white/5 group-hover/empty:scale-110 group-hover/empty:bg-amber-500 group-hover/empty:text-white transition-all text-stone-300 dark:text-stone-700">
                                                                        <Plus className="w-4 h-4" />
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
                        <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-2xl border border-stone-200/50 dark:border-white/5">
                            <div className="p-6 border-b border-stone-200/50 dark:border-white/5 bg-white/60 dark:bg-stone-900/60 flex items-center gap-4">
                                <div className="p-2.5 bg-amber-500/10 rounded-2xl">
                                    <GraduationCap className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">
                                        Lịch dạy: <span className="text-amber-500">{teachers.find(t => t.id === selectedTeacher)?.full_name}</span>
                                    </h3>
                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">Thời khóa biểu cá nhân giáo viên</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] relative custom-scrollbar">
                                <table className="w-full border-separate border-spacing-0">
                                    <thead className="sticky top-0 z-30">
                                        <tr className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md">
                                            <th className="p-4 border-b border-stone-200/50 dark:border-white/5 text-center text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] w-28 sticky left-0 z-40 bg-white/95 dark:bg-stone-900/95">Ca học</th>
                                            {DAYS.map((day, i) => (
                                                <th key={day} className="p-4 border-b border-stone-200/50 dark:border-white/5 text-center min-w-[200px] bg-transparent">
                                                    <div className="font-black text-stone-900 dark:text-stone-100 uppercase tracking-tighter text-base">{day}</div>
                                                    <div className="text-[10px] text-amber-500 font-black uppercase tracking-widest mt-0.5">
                                                        {weekDatesDesktop[i].toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ALL_SESSIONS.map((session) => (
                                            <tr key={session.id} className="group transition-colors">
                                                <td className="p-4 border-b border-stone-200/50 dark:border-white/5 align-middle text-center sticky left-0 z-20 bg-white/90 dark:bg-stone-900/90 shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
                                                    <div className="font-black text-amber-500 text-lg leading-tight">{session.label}</div>
                                                    <div className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest mt-1">{session.time}</div>
                                                </td>
                                                {DAYS.map((_, dayIndex) => {
                                                    const isAvailable = session.days.includes(dayIndex);
                                                    const slot = isAvailable ? getSlotForTeacherCell(selectedTeacher, dayIndex, session.start) : null;
                                                    return (
                                                        <td key={dayIndex} className={cn(
                                                            "p-3 border-b border-stone-200/50 dark:border-white/5 h-28 transition-all duration-300",
                                                            !isAvailable ? "bg-stone-500/5 dark:bg-white/2 opacity-30" : "group-hover:bg-stone-500/2 dark:group-hover:bg-white/2"
                                                        )}>
                                                            {!isAvailable ? (
                                                                <div className="h-full w-full rounded-2xl border border-stone-200/5 dark:border-white/2 flex items-center justify-center">
                                                                    <span className="text-[10px] text-stone-300 dark:text-stone-700 font-black uppercase tracking-widest">Off</span>
                                                                </div>
                                                            ) : slot ? (
                                                                <div
                                                                    className="h-full p-4 bg-white/80 dark:bg-white/5 backdrop-blur-sm border-l-4 border-amber-500 rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer group/card relative overflow-hidden"
                                                                    onClick={() => openEditModal(slot)}
                                                                >
                                                                    <div className="font-black text-stone-900 dark:text-stone-100 text-[13px] leading-tight line-clamp-2 mb-2">
                                                                        {slot.student?.full_name || slot.class?.name || "N/A"}
                                                                    </div>
                                                                    <div className="text-amber-600 dark:text-amber-500 text-[10px] font-black uppercase tracking-widest mb-2">
                                                                        {slot.subject?.name || "Môn học"}
                                                                    </div>
                                                                    {slot.room && (
                                                                        <div className="text-stone-400 dark:text-stone-500 text-[9px] flex items-center gap-1 truncate font-medium">
                                                                            <MapPin className="w-2.5 h-2.5" />
                                                                            {slot.room}
                                                                        </div>
                                                                    )}
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); deleteSlot(slot.id); }}
                                                                        className="absolute top-2 right-2 p-1.5 opacity-0 group-hover/card:opacity-100 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all z-10"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="h-full rounded-2xl border-2 border-dashed border-stone-200 dark:border-white/5 flex items-center justify-center">
                                                                    <span className="text-[10px] text-stone-300 dark:text-stone-700 font-black uppercase tracking-widest">Empty</span>
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
            <Modal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingSlot(null); }}
                title={editingSlot ? 'Chỉnh sửa tiết học' : 'Thêm tiết học mới'}
                size="md"
                footer={(
                    <>
                        <Button
                            variant="ghost"
                            onClick={() => { setShowModal(false); setEditingSlot(null); }}
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            variant="primary"
                            isLoading={saving}
                            disabled={!formData.subject_id || (formData.room === 'Linh hoạt' ? !formData.student_id : !formData.class_id)}
                            onClick={saveSlot}
                            leftIcon={editingSlot ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        >
                            {editingSlot ? 'Cập nhật' : 'Lưu lại'}
                        </Button>
                    </>
                )}
            >
                <div className="space-y-6">
                    {/* Context Info */}
                    {formData.room && (
                        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex gap-4">
                            <div className="p-2 bg-primary/10 rounded-lg h-fit">
                                <MapPin className="w-4 h-4 text-primary" />
                            </div>
                            <div className="grid grid-cols-3 gap-y-1 flex-1">
                                <div className="text-[10px] text-primary font-black uppercase tracking-widest">Phòng</div>
                                <div className="text-[10px] text-primary font-black uppercase tracking-widest">Ngày</div>
                                <div className="text-[10px] text-primary font-black uppercase tracking-widest">Ca học</div>
                                <div className="text-sm font-black text-gray-900 dark:text-white">{formData.room}</div>
                                <div className="text-sm font-black text-gray-900 dark:text-white">{DAYS[formData.day_of_week]}</div>
                                <div className="text-sm font-black text-gray-900 dark:text-white px-2 py-0.5 bg-white dark:bg-gray-800 rounded-md border border-primary/10 w-fit">{formData.start_time}</div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-5">
                        {formData.room === 'Linh hoạt' ? (
                            <>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs font-black text-muted uppercase tracking-widest ml-1">Học sinh *</label>
                                    <select
                                        value={formData.student_id}
                                        onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/5 rounded-xl text-sm font-black focus:border-primary outline-none transition-all shadow-sm"
                                    >
                                        <option value="">-- Chọn học sinh --</option>
                                        {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2 sm:col-span-1 space-y-2">
                                    <label className="text-xs font-black text-muted uppercase tracking-widest ml-1">Môn học *</label>
                                    <select
                                        value={formData.subject_id}
                                        onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/5 rounded-xl text-sm font-black focus:border-primary outline-none transition-all shadow-sm"
                                    >
                                        <option value="">-- Chọn môn --</option>
                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2 sm:col-span-1 space-y-2">
                                    <label className="text-xs font-black text-muted uppercase tracking-widest ml-1">Gia sư *</label>
                                    <select
                                        value={formData.teacher_id}
                                        onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/5 rounded-xl text-sm font-black focus:border-primary outline-none transition-all shadow-sm"
                                    >
                                        <option value="">-- Chọn gia sư --</option>
                                        {tutors.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                                    </select>
                                </div>
                            </>
                        ) : (
                            <div className="col-span-2 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-muted uppercase tracking-widest ml-1">Lớp *</label>
                                    <select
                                        value={formData.class_id}
                                        onChange={(e) => {
                                            const classId = e.target.value;
                                            const selectedClassObj = classes.find(c => c.id === classId);

                                            // 1. Try course_id
                                            let subjectId = selectedClassObj?.course_id || "";

                                            // 2. Try teacher's primary subject from teacher_subjects join table
                                            if (!subjectId && selectedClassObj?.teacher?.teacher_subjects) {
                                                const primarySubject = selectedClassObj.teacher.teacher_subjects.find(ts => ts.is_primary);
                                                if (primarySubject) {
                                                    subjectId = primarySubject.subject_id;
                                                } else if (selectedClassObj.teacher.teacher_subjects.length > 0) {
                                                    // Use first subject if no primary is set
                                                    subjectId = selectedClassObj.teacher.teacher_subjects[0].subject_id;
                                                }
                                            }

                                            setFormData(prev => ({
                                                ...prev,
                                                class_id: classId,
                                                teacher_id: selectedClassObj?.teacher_id || prev.teacher_id,
                                                subject_id: subjectId || prev.subject_id
                                            }));
                                        }}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/5 rounded-xl text-sm font-black focus:border-primary outline-none transition-all shadow-sm"
                                    >
                                        <option value="">-- Chọn lớp --</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                {formData.class_id && (
                                    <div className="p-4 bg-primary/5 border border-dashed border-primary/20 rounded-2xl flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-muted uppercase tracking-tighter">Giáo viên:</span>
                                            <span className="text-sm font-black text-primary">
                                                {getDisplayName(teachers.find(t => t.id === formData.teacher_id))}
                                            </span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[10px] font-black text-muted uppercase tracking-tighter mb-1">Môn học:</span>
                                            <select
                                                value={formData.subject_id}
                                                onChange={e => setFormData({ ...formData, subject_id: e.target.value })}
                                                className="w-full bg-transparent text-sm font-black text-primary border-b border-primary/20 focus:border-primary focus:outline-none pb-1 cursor-pointer"
                                            >
                                                <option value="">-- Chưa có --</option>
                                                {subjects.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {(!formData.room || editingSlot) && (
                        <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-5">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-muted uppercase tracking-widest">Tùy chọn nâng cao</span>
                                <div className="h-[1px] flex-1 bg-gray-100 dark:bg-white/5" />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-muted uppercase tracking-widest ml-1">Thứ</label>
                                    <select
                                        value={formData.day_of_week}
                                        onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/5 rounded-xl text-sm font-black focus:border-primary outline-none transition-all shadow-sm"
                                    >
                                        {DAYS.map((day, i) => <option key={i} value={i}>{day}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-muted uppercase tracking-widest ml-1">Ca học</label>
                                    <select
                                        value={formData.start_time}
                                        onChange={(e) => {
                                            const session = ALL_SESSIONS.find(s => s.start === e.target.value);
                                            setFormData({ ...formData, start_time: e.target.value, end_time: session?.end || formData.end_time });
                                        }}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/5 rounded-xl text-sm font-black focus:border-primary outline-none transition-all shadow-sm"
                                    >
                                        {ALL_SESSIONS.map(p => <option key={p.id} value={p.start}>{p.label} ({p.time})</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-muted uppercase tracking-widest ml-1">Vị trí / Phòng</label>
                                <select
                                    value={formData.room}
                                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/5 rounded-xl text-sm font-black focus:border-primary outline-none transition-all shadow-sm"
                                >
                                    <option value="">-- Chọn phòng --</option>
                                    <option value="Linh hoạt">🎓 Học kèm (Linh hoạt)</option>
                                    {CAMPUSES.filter(c => c.id !== 'HK').flatMap(c => c.rooms.map(room => `${c.name} - ${room}`)).map(room => (
                                        <option key={room} value={room}>{room}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-muted uppercase tracking-widest ml-1">Ghi chú mặc định</label>
                            <textarea
                                value={formData.notes || ""}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/5 rounded-xl text-sm font-medium focus:border-primary outline-none transition-all shadow-sm min-h-[80px] resize-none"
                                placeholder="Ghi chú áp dụng cho tất cả các tuần..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-primary uppercase tracking-widest ml-1">Ghi chú riêng tuần này</label>
                            <textarea
                                value={formData.weekly_note || ""}
                                onChange={(e) => setFormData({ ...formData, weekly_note: e.target.value })}
                                className="w-full px-4 py-3 bg-primary/[0.02] dark:bg-primary/[0.05] border-2 border-primary/20 rounded-xl text-sm font-medium focus:border-primary outline-none transition-all shadow-sm min-h-[80px] resize-none"
                                placeholder="Ghi chú chỉ áp dụng cho tuần hiện tại..."
                            />
                            {formData.weekly_note && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary hover:text-primary-dark font-black"
                                    onClick={() => setFormData({ ...formData, weekly_note: "" })}
                                    leftIcon={<Trash2 className="w-3 h-3" />}
                                >
                                    Xóa ghi chú tuần này
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
