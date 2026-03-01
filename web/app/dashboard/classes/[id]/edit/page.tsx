"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, updateClass, deleteClass } from "@/lib/api/client";
import { Card, LoadingState, Button, Modal } from "@/components/ui";
import { Icons } from "@/components/ui/Icons";
import { useToast } from "@/hooks";
import { usePermissions } from "@/hooks/usePermissions";
import { ToastContainer } from "@/components/ui/Toast";
import { PageHeader } from "@/components/Breadcrumb";
import { routes } from "@/lib/routes";
import { logger } from "@/lib/logger";
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
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        schedule: '',
        room: '',
        teacher_id: '',
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

                // Fetch class data directly by ID (optimized) and teachers in parallel
                const [classRes, teachersRes] = await Promise.all([
                    apiFetch(`/api/v2/classes/${classId}`),
                    apiFetch('/api/admin/users?role=teacher&limit=1000')
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
                });

                if (teachersRes.ok) {
                    const teachersJson = await teachersRes.json();
                    setTeachers(teachersJson.users || teachersJson.data || []);
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
        return <LoadingState message="Đang tải thông tin lớp học..." />;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />

            {/* Header with Breadcrumbs */}
            <PageHeader
                title="Chỉnh sửa lớp học"
                description={`Cập nhật thông tin cho lớp ${formData.name || '...'}`}
            />

            {/* Form */}
            <Card className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="col-span-1">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Tên lớp học <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-white dark:bg-stone-900 border border-gray-300 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="VD: Lớp 10A1"
                            />
                        </div>

                        <div className="col-span-1">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Mã lớp
                            </label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-white dark:bg-stone-900 border border-gray-300 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="VD: 10A1"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Giáo viên chủ nhiệm
                            </label>
                            <select
                                value={formData.teacher_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, teacher_id: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-white dark:bg-stone-900 border border-gray-300 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            >
                                <option value="">-- Chọn giáo viên --</option>
                                {teachers.map((teacher) => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {getDisplayName(teacher)} ({teacher.email || 'Không có email'})
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1.5 text-xs text-gray-500">Giáo viên sẽ có quyền quản lý điểm và điểm danh cho lớp này.</p>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Mô tả
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-white dark:bg-stone-900 border border-gray-300 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                rows={3}
                                placeholder="Mô tả về lớp học..."
                            />
                        </div>

                        <div className="col-span-1">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Phòng học
                            </label>
                            <input
                                type="text"
                                value={formData.room}
                                onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-white dark:bg-stone-900 border border-gray-300 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="VD: A101"
                            />
                        </div>

                        <div className="col-span-1">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Lịch học
                            </label>
                            <input
                                type="text"
                                value={formData.schedule}
                                onChange={(e) => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-white dark:bg-stone-900 border border-gray-300 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="VD: Thứ 2-6, 7:00-11:30"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push(routes.classes.detail(classId))}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={!formData.name.trim() || saving}
                            isLoading={saving}
                        >
                            Lưu thay đổi
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Delete Section */}
            {canDelete && (
                <Card className="mt-8 p-6 border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-900/10">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Xóa lớp học</h3>
                            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                                Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan (điểm, điểm danh) có thể bị ảnh hưởng.
                            </p>
                        </div>
                        <Button
                            variant="danger"
                            onClick={() => setShowDeleteModal(true)}
                            leftIcon={<Icons.Trash className="w-4 h-4" />}
                        >
                            Xóa lớp
                        </Button>
                    </div>
                </Card>
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Xác nhận xóa lớp học"
            >
                <div>
                    <p className="text-gray-600 mb-6">
                        Bạn có chắc chắn muốn xóa lớp học <strong>{formData.name}</strong> ({formData.code}) không?
                        Hành động này <strong className="text-red-600">không thể phục hồi</strong>.
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteModal(false)}
                            disabled={deleting}
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            isLoading={deleting}
                        >
                            Xóa vĩnh viễn
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
