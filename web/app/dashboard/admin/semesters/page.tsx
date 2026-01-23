"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api/client";
import {
    Calendar,
    Plus,
    Edit,
    Trash2,
    CheckCircle,
    RefreshCw,
    ShieldAlert,
    Clock,
    ArrowRight,
    AlertCircle,
    Trash
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/useToast";
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

interface Semester {
    id: string;
    name: string;
    code: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

export default function SemesterManagementPage() {
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
    const [semesterToDelete, setSemesterToDelete] = useState<Semester | null>(null);
    const [submitting, setSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        start_date: "",
        end_date: "",
        is_active: false
    });

    const { isStaff, isAdmin } = usePermissions();
    const toast = useToast();

    useEffect(() => {
        fetchSemesters();
    }, []);

    const fetchSemesters = async () => {
        setLoading(true);
        try {
            const response = await apiFetch("/api/admin/semesters");
            if (response.ok) {
                const data = await response.json();
                setSemesters(data.semesters || []);
            } else {
                toast.error("Lỗi", "Không thể tải danh sách học kỳ");
            }
        } catch (error) {
            console.error("Failed to fetch semesters:", error);
            toast.error("Lỗi", "Đã xảy ra lỗi khi kết nối máy chủ");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            code: "",
            start_date: "",
            end_date: "",
            is_active: false
        });
        setEditingSemester(null);
    };

    const handleOpenAdd = () => {
        resetForm();
        setShowFormModal(true);
    };

    const handleOpenEdit = (semester: Semester) => {
        setEditingSemester(semester);
        setFormData({
            name: semester.name,
            code: semester.code,
            start_date: semester.start_date.split('T')[0],
            end_date: semester.end_date.split('T')[0],
            is_active: semester.is_active
        });
        setShowFormModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (new Date(formData.end_date) <= new Date(formData.start_date)) {
            toast.error("Lỗi", "Ngày kết thúc phải sau ngày bắt đầu");
            return;
        }

        setSubmitting(true);
        try {
            const url = editingSemester 
                ? `/api/admin/semesters/${editingSemester.id}` 
                : "/api/admin/semesters";
            const method = editingSemester ? "PUT" : "POST";

            const response = await apiFetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                toast.success("Thành công", editingSemester ? "Đã cập nhật học kỳ" : "Đã thêm học kỳ mới");
                setShowFormModal(false);
                fetchSemesters();
            } else {
                const data = await response.json();
                toast.error("Lỗi", data.error || "Thao tác thất bại");
            }
        } catch (error) {
            toast.error("Lỗi", "Đã xảy ra lỗi, vui lòng thử lại");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSetActive = async (semesterId: string) => {
        try {
            const response = await apiFetch(`/api/admin/semesters/${semesterId}/activate`, { method: "POST" });
            if (response.ok) {
                toast.success("Thành công", "Đã kích hoạt học kỳ hiện tại");
                fetchSemesters();
            } else {
                toast.error("Lỗi", "Không thể kích hoạt học kỳ");
            }
        } catch (error) {
            toast.error("Lỗi", "Đã xảy ra lỗi khi kích hoạt");
        }
    };

    const handleDelete = async () => {
        if (!semesterToDelete) return;
        
        setSubmitting(true);
        try {
            const response = await apiFetch(`/api/admin/semesters/${semesterToDelete.id}`, { method: "DELETE" });
            if (response.ok) {
                toast.success("Thành công", "Đã xóa học kỳ");
                setShowDeleteModal(false);
                fetchSemesters();
            } else {
                toast.error("Lỗi", "Không thể xóa học kỳ");
            }
        } catch (error) {
            toast.error("Lỗi", "Đã xảy ra lỗi khi xóa");
        } finally {
            setSubmitting(false);
        }
    };

    const getSemesterStatus = (semester: Semester) => {
        const now = new Date();
        const start = new Date(semester.start_date);
        const end = new Date(semester.end_date);

        if (now < start) return { label: "Sắp tới", variant: "info" as const };
        if (now > end) return { label: "Đã kết thúc", variant: "default" as const };
        return { label: "Đang diễn ra", variant: "success" as const };
    };

    if (!isStaff) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card variant="glass" className="max-w-md text-center p-8">
                    <ShieldAlert className="w-16 h-16 text-warning mx-auto mb-6 opacity-80" />
                    <h1 className="text-2xl font-bold mb-2">Không có quyền truy cập</h1>
                    <p className="text-muted mb-6">Bạn không có quyền quản lý học kỳ. Vui lòng liên hệ quản trị viên.</p>
                    <Button variant="outline" onClick={() => window.history.back()}>Quay lại</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 p-4 sm:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-gray-800/80 p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-premium backdrop-blur-md">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Calendar className="w-6 h-6 text-primary" />
                            </div>
                            <Badge variant="info">Hệ thống</Badge>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Quản lý Học kỳ</h1>
                        <p className="text-muted mt-2 max-w-lg">Cấu hình các giai đoạn học tập, thời gian bắt đầu và kết thúc của mỗi học kỳ trong năm học.</p>
                    </div>
                    <Button 
                        variant="primary" 
                        size="lg"
                        leftIcon={<Plus className="w-5 h-5" />}
                        onClick={handleOpenAdd}
                        className="rounded-2xl"
                    >
                        Thêm học kỳ mới
                    </Button>
                </div>

                {/* List Section */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-64 bg-white/50 dark:bg-white/5 rounded-3xl animate-pulse border border-gray-100 dark:border-white/5" />
                        ))}
                    </div>
                ) : semesters.length === 0 ? (
                    <EmptyState 
                        title="Chưa có học kỳ nào" 
                        description="Bắt đầu bằng cách thêm học kỳ đầu tiên cho năm học của bạn."
                        icon={<Calendar className="w-12 h-12" />}
                        action={<Button onClick={handleOpenAdd}>Thêm học kỳ</Button>}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {semesters.map((semester) => {
                            const status = getSemesterStatus(semester);
                            return (
                                <Card 
                                    key={semester.id} 
                                    variant={semester.is_active ? "outlined" : "glass"}
                                    className={cn(
                                        "group relative flex flex-col overflow-hidden transition-all duration-300 hover:scale-[1.02]",
                                        semester.is_active && "ring-2 ring-primary/20"
                                    )}
                                >
                                    {/* Glass reflection effect */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
                                    
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <Badge variant={status.variant} className="mb-2">
                                                    {status.label}
                                                </Badge>
                                                <h3 className="text-xl font-bold line-clamp-1">{semester.name}</h3>
                                                <span className="text-sm font-mono text-muted bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded mt-1 inline-block">
                                                    {semester.code}
                                                </span>
                                            </div>
                                            {semester.is_active && (
                                                <div className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/30">
                                                    <CheckCircle className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <div className="flex items-center gap-3 text-sm text-foreground/80 bg-gray-50/50 dark:bg-white/5 p-3 rounded-2xl border border-gray-100/50 dark:border-white/5">
                                                <Clock className="w-4 h-4 text-primary" />
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-bold text-muted">Thời gian</span>
                                                    <div className="flex items-center gap-2 font-medium">
                                                        {new Date(semester.start_date).toLocaleDateString("vi-VN")}
                                                        <ArrowRight className="w-3 h-3 text-muted" />
                                                        {new Date(semester.end_date).toLocaleDateString("vi-VN")}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
                                        {!semester.is_active && (
                                            <Button 
                                                variant="success" 
                                                size="sm" 
                                                className="flex-1 rounded-xl"
                                                onClick={() => handleSetActive(semester.id)}
                                            >
                                                Kích hoạt
                                            </Button>
                                        )}
                                        <Button 
                                            variant="secondary" 
                                            size="sm" 
                                            className="px-3 rounded-xl"
                                            onClick={() => handleOpenEdit(semester)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        {isAdmin && (
                                            <Button 
                                                variant="danger" 
                                                size="sm" 
                                                className="px-3 rounded-xl"
                                                onClick={() => {
                                                    setSemesterToDelete(semester);
                                                    setShowDeleteModal(true);
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Form Modal */}
            <Modal
                isOpen={showFormModal}
                onClose={() => setShowFormModal(false)}
                title={editingSemester ? "Chỉnh sửa học kỳ" : "Thêm học kỳ mới"}
                size="md"
                footer={(
                    <>
                        <Button variant="ghost" onClick={() => setShowFormModal(false)}>Hủy</Button>
                        <Button 
                            variant="primary" 
                            isLoading={submitting} 
                            onClick={handleSubmit}
                        >
                            {editingSemester ? "Cập nhật" : "Tạo học kỳ"}
                        </Button>
                    </>
                )}
            >
                <form className="space-y-5">
                    <Input
                        label="Tên học kỳ"
                        placeholder="Ví dụ: Học kỳ I (2024-2025)"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        leftIcon={<Calendar className="w-5 h-5" />}
                    />
                    <Input
                        label="Mã định danh"
                        placeholder="Ví dụ: 2024-HK1"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        required
                        hint="Mã duy nhất dùng cho hệ thống"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Ngày bắt đầu"
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            required
                        />
                        <Input
                            label="Ngày kết thúc"
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="is_active" className="text-sm font-semibold select-none cursor-pointer">
                            Đặt làm học kỳ hiện tại
                        </label>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Xác nhận xóa"
                size="sm"
                footer={(
                    <>
                        <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Hủy</Button>
                        <Button 
                            variant="danger" 
                            isLoading={submitting} 
                            onClick={handleDelete}
                            leftIcon={<Trash className="w-4 h-4" />}
                        >
                            Xóa ngay
                        </Button>
                    </>
                )}
            >
                <div className="text-center p-4">
                    <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Bạn có chắc chắn?</h3>
                    <p className="text-muted">
                        Hành động này không thể hoàn tác. Học kỳ <strong>{semesterToDelete?.name}</strong> sẽ bị xóa vĩnh viễn khỏi hệ thống.
                    </p>
                </div>
            </Modal>
        </div>
    );
}
