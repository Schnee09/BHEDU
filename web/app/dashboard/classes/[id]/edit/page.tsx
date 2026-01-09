"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { Card, LoadingState, Button } from "@/components/ui";
import { Icons } from "@/components/ui/Icons";
import { useToast } from "@/hooks";
import { ToastContainer } from "@/components/ui/Toast";
import { routes } from "@/lib/routes";

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
        email: string;
    };
}

interface Teacher {
    id: string;
    full_name: string;
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch class data and teachers in parallel
                const [classesRes, teachersRes] = await Promise.all([
                    apiFetch('/api/classes'),
                    apiFetch('/api/users?role=teacher')
                ]);

                if (!classesRes.ok) {
                    throw new Error('Failed to fetch class');
                }

                const classesJson = await classesRes.json();
                const classes = (classesJson.data || classesJson.classes || []) as ClassData[];
                const classData = classes.find((c) => c.id === classId);

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
    }, [classId, router, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.warning('Thiếu thông tin', 'Vui lòng nhập tên lớp học');
            return;
        }

        setSaving(true);
        try {
            const response = await apiFetch(`/api/classes/${classId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    name: formData.name.trim(),
                    code: formData.code.trim() || undefined,
                    description: formData.description.trim() || undefined,
                    schedule: formData.schedule.trim() || undefined,
                    room: formData.room.trim() || undefined,
                    teacher_id: formData.teacher_id || undefined,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Không thể cập nhật lớp học');
            }

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

            {/* Header */}
            <div className="mb-6">
                <Link
                    href={routes.classes.detail(classId)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 mb-4"
                >
                    <Icons.Back className="w-4 h-4" />
                    Quay lại chi tiết lớp
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa lớp học</h1>
                <p className="text-gray-600 mt-1">Cập nhật thông tin lớp học</p>
            </div>

            {/* Form */}
            <Card className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tên lớp học <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="VD: Lớp 10A1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mã lớp
                            </label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="VD: 10A1"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Giáo viên chủ nhiệm
                        </label>
                        <select
                            value={formData.teacher_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, teacher_id: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">-- Chọn giáo viên --</option>
                            {teachers.map((teacher) => (
                                <option key={teacher.id} value={teacher.id}>
                                    {teacher.full_name} ({teacher.email || 'Không có email'})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mô tả
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                            placeholder="Mô tả về lớp học..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phòng học
                            </label>
                            <input
                                type="text"
                                value={formData.room}
                                onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="VD: A101"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Lịch học
                            </label>
                            <input
                                type="text"
                                value={formData.schedule}
                                onChange={(e) => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        </div>
    );
}
