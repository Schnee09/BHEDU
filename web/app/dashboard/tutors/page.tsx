"use client";

import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { usePermissions } from "@/hooks/usePermissions";
import PageGuard from "@/components/PageGuard";
import { apiFetch } from "@/lib/api/client";
import {
    Plus,
    Search,
    Edit3,
    Trash2,
    GraduationCap,
    Phone,
    Mail,
    BookOpen,
    DollarSign
} from "lucide-react";

import UserFormModal from "@/components/users/UserFormModal";

interface Tutor {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    photo_url: string | null;
    teacher_type: string;
    specialization: string | null;
    teaching_subjects: string[];
    hourly_rate: number | null;
    bio: string | null;
}

export default function TutorsPage() {
    return (
        <PageGuard permissions="users.view">
            <TutorsContent />
        </PageGuard>
    );
}

function TutorsContent() {
    const { profile, loading: profileLoading } = useProfile();
    const { isAdmin: isSystemAdmin, isStaff } = usePermissions();
    const [tutors, setTutors] = useState<Tutor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // User Form Modal state
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingTutor, setEditingTutor] = useState<Tutor | null>(null);

    // Check if user can manage tutors (isAdmin or isStaff)
    const canManage = isSystemAdmin || isStaff;

    const fetchTutors = async () => {
        setLoading(true);
        try {
            const response = await apiFetch("/api/tutors");
            const data = await response.json();
            setTutors(data.tutors || []);
        } catch (error) {
            console.error("Failed to fetch tutors:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTutors();
    }, []);

    const openCreateModal = () => {
        setEditingTutor(null);
        setShowUserModal(true);
    };

    const openEditModal = (tutor: Tutor) => {
        setEditingTutor(tutor);
        setShowUserModal(true);
    };

    const deleteTutor = async (id: string) => {
        if (!confirm("Bạn có chắc muốn xóa gia sư này?")) return;

        try {
            const response = await apiFetch(`/api/tutors/${id}`, { method: "DELETE" });
            const result = await response.json();
            if (result.success) {
                await fetchTutors();
            }
        } catch (error) {
            console.error("Failed to delete tutor:", error);
        }
    };

    const filteredTutors = tutors.filter(tutor =>
        tutor.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 relative z-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <GraduationCap className="w-8 h-8 text-emerald-600" />
                        Quản lý Gia sư
                    </h1>
                    <p className="text-gray-500 mt-1">Quản lý danh sách sinh viên dạy kèm</p>
                </div>
                {canManage && (
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Thêm gia sư
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Tìm gia sư theo tên, email, môn dạy..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                    <div className="text-2xl font-bold text-emerald-700">{tutors.length}</div>
                    <div className="text-sm text-emerald-600">Tổng số gia sư</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <div className="text-2xl font-bold text-green-700">
                        {tutors.filter(t => t.teaching_subjects?.length > 0).length}
                    </div>
                    <div className="text-sm text-green-600">Có môn dạy</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="text-2xl font-bold text-blue-700">
                        {tutors.filter(t => t.hourly_rate).length}
                    </div>
                    <div className="text-sm text-blue-600">Có mức lương</div>
                </div>
            </div>

            {/* Tutor Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto" />
                    <p className="mt-4 text-gray-500">Đang tải...</p>
                </div>
            ) : filteredTutors.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">
                        {searchQuery ? "Không tìm thấy gia sư nào" : "Chưa có gia sư nào"}
                    </p>
                    {!searchQuery && canManage && (
                        <button
                            onClick={openCreateModal}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                            Thêm gia sư đầu tiên
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTutors.map((tutor) => (
                        <div
                            key={tutor.id}
                            className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow p-4"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                        {tutor.photo_url ? (
                                            <img
                                                src={tutor.photo_url}
                                                alt={tutor.full_name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <GraduationCap className="w-6 h-6 text-emerald-600" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{tutor.full_name}</h3>
                                        <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                                            Gia sư
                                        </span>
                                    </div>
                                </div>
                                {canManage && (
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => openEditModal(tutor)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteTutor(tutor.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 text-sm">
                                {tutor.email && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        {tutor.email}
                                    </div>
                                )}
                                {tutor.phone && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        {tutor.phone}
                                    </div>
                                )}
                                {tutor.specialization && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <BookOpen className="w-4 h-4 text-gray-400" />
                                        {tutor.specialization}
                                    </div>
                                )}
                                {tutor.hourly_rate && (
                                    <div className="flex items-center gap-2 text-green-600 font-medium">
                                        <DollarSign className="w-4 h-4" />
                                        {tutor.hourly_rate.toLocaleString('vi-VN')}đ/giờ
                                    </div>
                                )}
                            </div>

                            {tutor.bio && (
                                <p className="mt-3 text-sm text-gray-500 italic line-clamp-2">{tutor.bio}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Standard User Form Modal for Tutors */}
            <UserFormModal
                isOpen={showUserModal}
                onClose={() => {
                    setShowUserModal(false);
                    setEditingTutor(null);
                }}
                onSuccess={() => {
                    setShowUserModal(false);
                    setEditingTutor(null);
                    fetchTutors();
                }}
                initialRole="tutor"
                user={editingTutor}
            />
        </div>
    );
}
