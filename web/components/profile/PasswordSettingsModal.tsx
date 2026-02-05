'use client'

import React, { useState } from 'react';
import {
    Modal,
    Button,
    Input,
    Alert
} from '@/components/ui';
import { Icons } from '@/components/ui/Icons';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/useToast';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PasswordSettingsModal({ isOpen, onClose }: PasswordSettingsModalProps) {
    const toast = useToast();
    const supabase = createClient();

    const [formData, setFormData] = useState({
        new_password: '',
        confirm_password: '',
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.new_password !== formData.confirm_password) {
            toast.error('Lỗi', 'Mật khẩu xác nhận không khớp');
            return;
        }

        if (formData.new_password.length < 6) {
            toast.error('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: formData.new_password,
            });

            if (error) {
                toast.error('Lỗi', error.message);
            } else {
                toast.success('Thành công', 'Mật khẩu đã được cập nhật');
                setFormData({ new_password: '', confirm_password: '' });
                onClose();
            }
        } catch (err: any) {
            toast.error('Lỗi', 'Không thể cập nhật mật khẩu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Bảo mật & Mật khẩu"
            size="md"
            footer={
                <div className="flex gap-3 justify-end w-full">
                    <Button variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">
                        Hủy bỏ
                    </Button>
                    <Button
                        variant="gold"
                        onClick={handleSubmit}
                        isLoading={loading}
                        className="rounded-xl px-8"
                    >
                        Đổi mật khẩu
                    </Button>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-500/20 flex gap-3">
                    <Icons.Info className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                        Sử dụng mật khẩu mạnh bao gồm chữ cái, chữ số và ký tự đặc biệt để bảo vệ tài khoản của bạn.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <Input
                            label="Mật khẩu mới"
                            required
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={formData.new_password}
                            onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                            leftIcon={<Icons.Lock className="w-4 h-4" />}
                            rightIcon={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="hover:text-amber-500 transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            }
                        />
                    </div>

                    <div className="relative">
                        <Input
                            label="Xác nhận mật khẩu"
                            required
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={formData.confirm_password}
                            onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                            leftIcon={<Icons.Lock className="w-4 h-4" />}
                            rightIcon={
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="hover:text-amber-500 transition-colors p-1"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            }
                            error={
                                formData.confirm_password && formData.new_password !== formData.confirm_password
                                    ? 'Mật khẩu không khớp'
                                    : undefined
                            }
                        />
                    </div>
                </div>

                <p className="text-[10px] text-stone-400 font-medium italic text-center">
                    Sau khi lưu, phiên đăng nhập hiện tại của bạn vẫn được duy trì.
                </p>
            </form>
        </Modal>
    );
}
