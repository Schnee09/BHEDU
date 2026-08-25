'use client';

import React, { useState } from 'react';
import { Modal, Button, Input, Alert } from '@/components/ui';
import { Checkbox } from '@/components/ui/form';
import { Icons } from '@/components/ui/Icons';
import { apiFetch } from '@/lib/api/client';
import { logger } from '@/lib/logger';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string; full_name: string; email: string } | null;
}

export default function ResetPasswordModal({ isOpen, onClose, user }: ResetPasswordModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: '',
    send_email: true,
  });
  const [resetResult, setResetResult] = useState<{ password: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (passwordData.new_password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_password: passwordData.new_password,
          send_email: passwordData.send_email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResetResult({ password: data.new_password });
        logger.audit('Password reset', {}, { userId: user.id });
      } else {
        throw new Error(data.error || 'Không thể đặt lại mật khẩu');
      }
    } catch (err: any) {
      setError(err.message || 'Không thể đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResetResult(null);
    setPasswordData({ new_password: '', confirm_password: '', send_email: true });
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Khôi phục mật khẩu" size="md">
      {resetResult ? (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-3xl flex items-center justify-center">
              <Icons.Success className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-stone-900 dark:text-white">Thành công!</h3>
              <p className="text-sm text-stone-500 font-medium">
                Mật khẩu của <b>{user?.full_name}</b> đã được thay đổi.
              </p>
            </div>
          </div>

          <div className="bg-stone-50 dark:bg-stone-900/50 p-8 rounded-[40px] border-2 border-dashed border-stone-200 dark:border-white/5 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 blur-2xl rounded-full" />
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">
              Mật khẩu truy cập mới
            </p>
            <div className="flex items-center justify-center gap-3">
              <code className="text-4xl font-black text-amber-600 dark:text-amber-500 tracking-wider">
                {resetResult.password}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(resetResult.password)}
                className="p-2 hover:bg-stone-200 dark:hover:bg-white/5 rounded-xl transition-colors"
                title="Sao chép"
              >
                <Icons.Edit className="w-5 h-5 text-stone-400" />
              </button>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-2xl flex items-start gap-3 border border-amber-100 dark:border-amber-500/20">
            <Icons.Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900/80 dark:text-amber-200 font-medium leading-relaxed">
              {passwordData.send_email
                ? 'Hệ thống đã gửi email thông báo kèm mật khẩu mới cho người dùng. Họ có thể đăng nhập ngay bây giờ.'
                : 'Người dùng không nhận được email tự động. Vui lòng cung cấp mật khẩu này trực tiếp cho họ.'}
            </p>
          </div>

          <div className="flex justify-center pt-2">
            <Button
              onClick={handleClose}
              variant="success"
              className="rounded-2xl px-12 h-14 shadow-lg shadow-emerald-600/20"
            >
              Hoàn tất & Đóng
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-stone-50 dark:bg-white/5 rounded-3xl border border-stone-100 dark:border-white/5">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Icons.Lock className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-stone-400 uppercase tracking-widest">
                Đang đặt lại mật khẩu cho
              </p>
              <p className="font-bold text-stone-900 dark:text-white truncate">{user?.full_name}</p>
            </div>
          </div>

          {error && (
            <Alert variant="error" title="Lỗi" message={error} onClose={() => setError(null)} />
          )}

          <div className="space-y-4">
            <Input
              label="Mật khẩu mới"
              type="password"
              autoComplete="new-password"
              name="bhedu_reset_new_password"
              placeholder="Nhập mật khẩu mới..."
              value={passwordData.new_password}
              onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
              required
              className="h-14 rounded-2xl"
              leftIcon={<Icons.Lock className="w-4 h-4" />}
            />

            <Input
              label="Xác nhận mật khẩu"
              type="password"
              autoComplete="new-password"
              name="bhedu_reset_confirm_password"
              placeholder="Nhập lại mật khẩu mới..."
              value={passwordData.confirm_password}
              onChange={(e) =>
                setPasswordData({ ...passwordData, confirm_password: e.target.value })
              }
              required
              className="h-14 rounded-2xl"
              leftIcon={<Icons.Lock className="w-4 h-4" />}
              error={
                passwordData.confirm_password &&
                passwordData.new_password !== passwordData.confirm_password
                  ? 'Mật khẩu xác nhận không khớp'
                  : undefined
              }
            />

            <div className="pt-2 px-1">
              <Checkbox
                label="Gửi email thông báo"
                description="Hệ thống sẽ gửi email kèm mật khẩu mới cho người dùng sau khi thay đổi thành công."
                checked={passwordData.send_email}
                onChange={(e) => setPasswordData({ ...passwordData, send_email: e.target.checked })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-14 rounded-xl font-bold"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="success"
              isLoading={loading}
              className="flex-1 h-14 rounded-xl shadow-lg shadow-emerald-600/20 font-bold"
              leftIcon={<Icons.Lock className="w-4 h-4" />}
            >
              Đặt lại mật khẩu
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
