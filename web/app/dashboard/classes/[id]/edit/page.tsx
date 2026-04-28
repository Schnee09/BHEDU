"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, updateClass, deleteClass } from "@/lib/api/client";
import { Card, LoadingState, Button, Modal, Input, Textarea } from "@/components/ui";
import {
    ChevronLeft,
    Save,
    Trash2,
    Settings,
    BookOpen,
    Clock,
    MapPin,
    User,
    AlertTriangle,
    Info,
    BadgeInfo,
    Layout,
    Calendar
} from "lucide-react";
import { useToast } from "@/hooks";
import { usePermissions } from "@/hooks/usePermissions";
import { ToastContainer } from "@/components/ui/Toast";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { getDisplayName } from "@/lib/utils/names";

interface ClassData {
    id: string;
    name: string;
    code: string;
    description?: string;
    schedule?: string;
    room?: string;
    teacher_id?: string;
    teacher?: {
        id: string;
        full_name: string;
        first_name?: string | null;
        last_name?: string | null;
        email: string;
    };
}

interface Teacher {
    id: string;
    full_name: string;
    first_name?: string | null;
    last_name?: string | null;
    email: string;
}

export default function EditClassPage() {
    const params = useParams();
    const router = useRouter();
    const toast = useToast();
    const classId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [courses, setCourses] = useState<{ id: string; name: string; code: string }[]>([]);
    const [academicYears, setAcademicYears] = useState<{ id: string; name: string }[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        schedule: '',
        room: '',
        teacher_id: '',
        course_id: '',
        academic_year_id: '',
    });

    const { can } = usePermissions();
    const canDelete = can('classes.delete');

    // Delete state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch class data directly by ID (optimized), teachers, and courses in parallel
                const [classRes, teachersRes, coursesRes, academicYearsRes] = await Promise.all([
                    apiFetch(`/api/classes/${classId}`),
                    apiFetch('/api/admin/users?role=teacher&limit=1000'),
                    apiFetch('/api/admin/courses?limit=1000'),
                    apiFetch('/api/academic-years')
                ]);

                if (!classRes.ok) {
                    throw new Error('Failed to fetch class');
                }

                const classJson = await classRes.json();
                // Handle V2 response structure { success: true, class: { ... } }
                const classData = classJson.class || classJson.data;

                if (!classData) {
                    toast.error('Lỗi', 'Không tìm thấy lớp học');
                    router.push(routes.classes.list());
                    return;
                }

                setFormData({
                    name: classData.name || '',
                    code: classData.code || '',
                    description: classData.description || '',
                    schedule: classData.schedule || '',
                    room: classData.room || '',
                    teacher_id: classData.teacher_id || classData.teacher?.id || '',
                    course_id: classData.course_id || classData.course?.id || '',
                    academic_year_id: classData.academic_year_id || '',
                });

                if (teachersRes.ok) {
                    const teachersJson = await teachersRes.json();
                    setTeachers(teachersJson.users || teachersJson.data || []);
                }

                if (coursesRes.ok) {
                    const coursesJson = await coursesRes.json();
                    setCourses(coursesJson.courses || coursesJson.data || []);
                }

                if (academicYearsRes.ok) {
                    const ayJson = await academicYearsRes.json();
                    setAcademicYears(ayJson.data || ayJson.academicYears || []);
                }
            } catch (err) {
                console.error('Error loading class:', err);
                toast.error('Lỗi', 'Không thể tải thông tin lớp học');
            } finally {
                setLoading(false);
            }
        };

        if (classId) {
            fetchData();
        }
    }, [classId]); // Removed router, toast as they trigger loops

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteClass(classId);

            toast.success('Thành công', 'Đã xóa lớp học');
            router.push(routes.classes.list());
        } catch (err) {
            console.error('Delete error:', err);
            toast.error('Lỗi', 'Không thể xóa lớp học');
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.warning('Thiếu thông tin', 'Vui lòng nhập tên lớp học');
            return;
        }

        setSaving(true);
        try {
            await updateClass(classId, {
                name: formData.name.trim(),
                code: formData.code.trim() || undefined,
                description: formData.description.trim() || undefined,
                schedule: formData.schedule.trim() || undefined,
                room: formData.room.trim() || undefined,
                teacher_id: formData.teacher_id || undefined,
                course_id: formData.course_id || undefined,
                academic_year_id: formData.academic_year_id || undefined,
            });

            toast.success('Thành công', 'Đã cập nhật lớp học');
            setTimeout(() => {
                router.push(routes.classes.detail(classId));
            }, 1000);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Cập nhật thất bại';
            toast.error('Lỗi', message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] gap-8">
                <div className="relative">
                    <div className="w-20 h-20 border-8 border-blue-500/20 border-t-blue-600 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Settings className="w-8 h-8 text-blue-600 animate-pulse" />
                    </div>
                </div>
                <div className="text-center">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tighter">Đang trích xuất dữ liệu</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hệ thống đang tải cấu hình lớp học...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
            <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />

            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-500/10 rounded-full mb-3">
                        <BadgeInfo className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Chỉnh sửa lớp học</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                        Cấu hình <span className="text-blue-600">{formData.name}</span>
                    </h1>
                    <p className="text-sm text-gray-400 mt-2 font-bold uppercase tracking-widest">Mã lớp: {formData.code || 'CHƯA CÓ'}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => router.push(routes.classes.detail(classId))}
                        className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 font-bold rounded-2xl hover:text-gray-900 transition-all flex items-center gap-2"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-8 py-3 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        Lưu cấu hình
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Essential Info */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white dark:bg-gray-800 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-xl p-10 space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8">
                            <Layout className="w-12 h-12 text-blue-500/5" />
                        </div>

                        <div className="border-l-4 border-blue-500 pl-6">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Thông tin cơ bản</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Định danh và quản lý chính</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Input
                                label="Tên lớp học"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="VD: Lớp 10A1"
                                required
                                leftIcon={<BookOpen className="w-5 h-5" />}
                            />
                            <Input
                                label="Mã lớp"
                                value={formData.code}
                                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                                placeholder="VD: 10A1"
                                leftIcon={<BadgeInfo className="w-5 h-5" />}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-black text-gray-900 dark:text-white mb-2 uppercase tracking-widest leading-none" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                                Giáo viên chủ nhiệm
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 transition-transform group-hover:scale-110">
                                    <User className="w-5 h-5" />
                                </div>
                                <select
                                    value={formData.teacher_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, teacher_id: e.target.value }))}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-500 rounded-[1.5rem] font-bold text-gray-700 dark:text-gray-300 transition-all outline-none appearance-none"
                                >
                                    <option value="">-- Chọn giáo viên --</option>
                                    {teachers.map((teacher) => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {getDisplayName(teacher)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold italic px-2">Giáo viên sẽ nhận được thông báo khi có thay đổi trong lớp này.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-black text-gray-900 dark:text-white mb-2 uppercase tracking-widest leading-none" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                                Khóa học
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 transition-transform group-hover:scale-110">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <select
                                    value={formData.course_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, course_id: e.target.value }))}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-emerald-500 dark:focus:border-emerald-500 rounded-[1.5rem] font-bold text-gray-700 dark:text-gray-300 transition-all outline-none appearance-none"
                                >
                                    <option value="">-- Chọn khóa học --</option>
                                    {courses.map((course) => (
                                        <option key={course.id} value={course.id}>
                                            {course.name} ({course.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-black text-gray-900 dark:text-white mb-2 uppercase tracking-widest leading-none" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                                Năm học
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 transition-transform group-hover:scale-110">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <select
                                    value={formData.academic_year_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, academic_year_id: e.target.value }))}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-500 rounded-[1.5rem] font-bold text-gray-700 dark:text-gray-300 transition-all outline-none appearance-none"
                                >
                                    <option value="">-- Chọn năm học --</option>
                                    {academicYears.map((ay) => (
                                        <option key={ay.id} value={ay.id}>
                                            {ay.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <Textarea
                            label="Mô tả lớp học"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Mô tả mục tiêu hoặc đặc điểm của lớp..."
                            rows={4}
                        />
                    </div>

                    {/* Schedule Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-xl p-10 space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8">
                            <Clock className="w-12 h-12 text-emerald-500/5" />
                        </div>

                        <div className="border-l-4 border-emerald-500 pl-6">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Lịch biểu & Địa điểm</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Thời gian và không gian học tập</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Input
                                label="Phòng học"
                                value={formData.room}
                                onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                                placeholder="VD: A101"
                                leftIcon={<MapPin className="w-5 h-5" />}
                            />
                            <Input
                                label="Lịch học"
                                value={formData.schedule}
                                onChange={(e) => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
                                placeholder="VD: Thứ 2-6, 7:00-11:30"
                                leftIcon={<Clock className="w-5 h-5" />}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions & Danger Zone */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-gray-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full" />
                        <h3 className="text-lg font-black text-white mb-6 uppercase tracking-widest flex items-center gap-3">
                            <Info className="w-5 h-5 text-blue-500" />
                            Hướng dẫn
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex gap-3 text-xs text-gray-400 leading-relaxed font-bold">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0 mt-1" />
                                Tên lớp cần ngắn gọn, dễ nhận diện.
                            </li>
                            <li className="flex gap-3 text-xs text-gray-400 leading-relaxed font-bold">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0 mt-1" />
                                Lịch học sẽ tự động đồng bộ vào lịch biểu của giáo viên và học sinh.
                            </li>
                        </ul>
                    </div>

                    {canDelete && (
                        <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] border-2 border-red-50 dark:border-red-900/20 shadow-xl space-y-6">
                            <h3 className="text-lg font-black text-red-600 flex items-center gap-2 uppercase tracking-tighter">
                                <Trash2 className="w-5 h-5" />
                                Vùng nguy hiểm
                            </h3>
                            <p className="text-xs font-bold text-gray-400 leading-relaxed">
                                Hành động xóa lớp học sẽ xóa vĩnh viễn dữ liệu ghi danh và không thể khôi phục.
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(true)}
                                className="w-full py-4 bg-red-50 dark:bg-red-500/10 text-red-600 font-black rounded-2xl hover:bg-red-600 hover:text-white transition-all active:scale-95"
                            >
                                Xóa lớp học này
                            </button>
                        </div>
                    )}
                </div>
            </form>

            {/* Modal Xóa - Modernized */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title=""
            >
                <div className="p-8 text-center space-y-8 animate-in zoom-in duration-300">
                    <div className="w-24 h-24 bg-red-50 dark:bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl shadow-red-500/10">
                        <AlertTriangle className="w-12 h-12 text-red-500" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Xác nhận xóa lớp?</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                            Bạn đang thực hiện xóa lớp <span className="font-black text-red-600 underline">{formData.name}</span>. Hành động này sẽ được ghi lại trong nhật ký hệ thống.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="w-full py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-600/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {deleting ? "Đang xử lý..." : "Xác nhận xóa vĩnh viễn"}
                        </button>
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="w-full py-4 bg-gray-50 dark:bg-gray-700 text-gray-400 font-black rounded-2xl hover:bg-gray-100 transition-all font-bold"
                        >
                            Nhấn để quay lại
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
