'use client'

import React, { useState } from 'react';
import {
    Modal,
    Button,
    Input,
    Alert
} from '@/components/ui';
import { Icons } from '@/components/ui/Icons';
import { apiFetch } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/useToast';

interface DeleteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: { id: string, full_name: string, email: string } | null;
}

export default function DeleteUserModal({ isOpen, onClose, onSuccess, user }: DeleteUserModalProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [confirmEmail, setConfirmEmail] = useState('');

    const handleDelete = async () => {
        if (!user) return;

        if (confirmEmail !== user.email) {
            toast.error('Lỗi', 'Email xác nhận không khớp');
            return;
        }

        setLoading(true);

        try {
            logger.info('Deleting user', { userId: user.id, email: user.email });

            const response = await apiFetch(`/api/admin/users/${user.id}?permanent=true`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Thành công', `Người dùng "${user.full_name}" đã được xóa vĩnh viễn.`);
                logger.audit('User deleted', {}, {
                    userId: user.id,
                    email: user.email
                });
                onSuccess();
            } else {
                throw new Error(data.error || 'Không thể xóa người dùng');
            }
        } catch (err: any) {
            toast.error('Lỗi', err.message || 'Không thể xóa người dùng');
            logger.error('Error deleting user', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setConfirmEmail('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Xác nhận xóa vĩnh viễn"
            size="md"
            footer={
                <div className="flex gap-3 justify-end w-full">
                    <Button variant="outline" onClick={handleClose} disabled={loading} className="rounded-xl">
                        Hủy bỏ
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleDelete}
                        isLoading={loading}
                        disabled={confirmEmail !== user?.email}
                        className="rounded-xl px-8"
                        leftIcon={<Icons.Trash className="w-4 h-4" />}
                    >
                        Xóa người dùng
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="flex flex-col items-center text-center space-y-4 pt-2">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-[32px] flex items-center justify-center animate-pulse">
                        <Icons.Error className="w-10 h-10 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight">Hành động nguy hiểm!</h3>
                        <p className="text-sm text-stone-500 max-w-xs mx-auto">
                            Bạn đang chuẩn bị xóa vĩnh viễn tài khoản của <b>{user?.full_name}</b>. Hành động này không thể hoàn tác.
                        </p>
                    </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-3xl border border-red-100 dark:border-red-500/20 space-y-3">
                    <div className="flex items-center gap-3">
                        <Icons.Info className="w-5 h-5 text-red-600 shrink-0" />
                        <p className="text-xs font-black text-red-900 dark:text-red-400 uppercase tracking-widest">Lưu ý quan trọng</p>
                    </div>
                    <ul className="text-[11px] text-red-800/70 dark:text-red-300 space-y-1 ml-8 list-disc font-medium">
                        <li>Tất cả dữ liệu hồ sơ sẽ bị xóa vĩnh viễn.</li>
                        <li>Các liên kết đào tạo và lịch sử sẽ bị ngắt kết nối.</li>
                        <li>Người dùng sẽ không thể đăng nhập vào hệ thống nữa.</li>
                    </ul>
                </div>

                <div className="space-y-3 group">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">
                        Nhập email <b>{user?.email}</b> để xác nhận
                    </label>
                    <Input
                        placeholder="Nhập email người dùng..."
                        value={confirmEmail}
                        onChange={(e) => setConfirmEmail(e.target.value)}
                        className="h-14 rounded-2xl border-red-200 dark:border-red-500/20 focus:border-red-500 focus:ring-red-500/10"
                        autoFocus
                    />
                </div>
            </div>
        </Modal>
    );
}
