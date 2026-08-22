'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import GuestGuard from '@/components/GuestGuard';
import {
  KeyRound,
  Mail,
  User,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isManagedNotice, setIsManagedNotice] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsManagedNotice(false);

    const raw = identifier.trim();
    if (!raw) {
      setError('Vui lòng nhập Email, Mã định danh (UID) hoặc Số điện thoại');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: raw }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể gửi yêu cầu đặt lại mật khẩu.');
      }

      if (data.data?.requiresAdminContact) {
        setIsManagedNotice(true);
      } else {
        setMessage(data.data?.message || 'Đã gửi hướng dẫn khôi phục mật khẩu. Vui lòng kiểm tra hộp thư.');
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi gửi yêu cầu khôi phục.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestGuard>
      <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-stone-100 dark:bg-[#0E0D0B] text-stone-900 dark:text-stone-100 selection:bg-amber-500/30">
        {/* Main Card */}
        <div className="w-full max-w-md bg-white dark:bg-[#14120E] border border-stone-200 dark:border-stone-800 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
          {/* Back link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại đăng nhập</span>
          </Link>

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-2">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-stone-950 dark:text-white">
              Khôi Phục Mật Khẩu
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Nhập email hoặc mã học sinh của bạn để nhận hướng dẫn đặt lại mật khẩu
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs font-semibold animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2.5 text-emerald-700 dark:text-emerald-300 text-xs font-semibold animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{message}</span>
              </div>
            </div>
          )}

          {/* Managed Account Notice */}
          {isManagedNotice && (
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800/60 space-y-2 text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Tài khoản do Trung tâm quản lý</span>
              </div>
              <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                Tài khoản học sinh này chưa liên kết email cá nhân ngoài.
              </p>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#1C1A16] border border-amber-200 dark:border-amber-900/40 text-[11px] font-semibold text-stone-800 dark:text-stone-200">
                👉 <strong>Cách xử lý:</strong> Vui lòng báo Giáo viên phụ trách lớp hoặc Quản trị viên trung tâm để được <strong>đặt lại mật khẩu ngay lập tức</strong> trong vòng 1 phút.
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                Email cá nhân, Mã học sinh (UID) hoặc SĐT
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="vidu@gmail.com hoặc HS2026..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-stone-50 dark:bg-[#1C1A16] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs font-semibold placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Đang kiểm tra...' : 'Gửi yêu cầu khôi phục'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 text-center">
            <p className="text-[10px] text-stone-400">
              © {new Date().getFullYear()} Trung tâm Giáo dục BH. Hỗ trợ kỹ thuật 24/7.
            </p>
          </div>
        </div>
      </div>
    </GuestGuard>
  );
}
