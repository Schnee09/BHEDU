'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/useToast';
import { Loader2, Eye, EyeOff, ShieldAlert, LogOut, KeyRound } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

export default function ProfileSecurityTab() {
  const toast = useToast();
  const supabase = createClient();

  // ── Password ──────────────────────────────────────────────────────
  const [pwd, setPwd] = useState({ new: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // ── Session info (real from Supabase Auth) ────────────────────────
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data: { user } }: { data: { user: User | null } }) => setAuthUser(user));
  }, []);

  const pwdMismatch = pwd.confirm.length > 0 && pwd.new !== pwd.confirm;
  const pwdTooShort = pwd.new.length > 0 && pwd.new.length < 6;

  const handlePwdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdMismatch || pwdTooShort) return;
    setPwdLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwd.new });
      if (error) toast.error('Thất bại', error.message);
      else {
        toast.success('Đã cập nhật', 'Mật khẩu mới đã có hiệu lực ngay bây giờ.');
        setPwd({ new: '', confirm: '' });

        // Record audit log
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('audit_logs').insert({
              user_id: user.id,
              user_email: user.email,
              action: 'user.password_reset',
              resource_type: 'auth',
              resource_id: user.id,
            });
          }
        } catch {
          // non-critical
        }
      }
    } finally {
      setPwdLoading(false);
    }
  };

  const handleLogoutOthers = async () => {
    if (!confirm('Đăng xuất tất cả thiết bị khác. Phiên hiện tại sẽ được giữ nguyên. Tiếp tục?'))
      return;
    setLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'others' });
      if (error) toast.error('Thất bại', error.message);
      else toast.success('Thành công', 'Tất cả phiên đăng nhập khác đã bị thu hồi.');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <motion.div
      key="security"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-8"
    >
      <div>
        <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-1">
          Bảo mật tài khoản
        </h3>
        <p className="text-xs text-stone-400 dark:text-stone-500">
          Mật khẩu và quản lý phiên đăng nhập.
        </p>
      </div>

      {/* ── Change Password ── */}
      <section
        id="change-password-section"
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 scroll-mt-20"
      >
        <div className="flex items-center gap-2 mb-6">
          <ShieldAlert className="w-4 h-4 text-stone-400" />
          <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
            Thay đổi mật khẩu
          </h4>
        </div>

        <form onSubmit={handlePwdSubmit} className="space-y-4 max-w-sm">
          {/* New password */}
          <div>
            <label className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider block mb-1.5">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                id="new-password-input"
                required
                type={showPwd ? 'text' : 'password'}
                value={pwd.new}
                onChange={(e) => setPwd((p) => ({ ...p, new: e.target.value }))}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full text-sm bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-800 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-600"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pwdTooShort && <p className="text-[11px] text-red-500 mt-1">Tối thiểu 6 ký tự</p>}
          </div>

          {/* Confirm */}
          <div>
            <label className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider block mb-1.5">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <input
                required
                type={showConfirm ? 'text' : 'password'}
                value={pwd.confirm}
                onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full text-sm bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-800 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-600"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pwdMismatch && <p className="text-[11px] text-red-500 mt-1">Mật khẩu không khớp</p>}
          </div>

          <button
            type="submit"
            disabled={pwdLoading || pwdMismatch || pwdTooShort}
            className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg text-xs font-semibold hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors disabled:opacity-40"
          >
            {pwdLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <KeyRound className="w-3.5 h-3.5" />
            )}
            Cập nhật mật khẩu
          </button>
        </form>
      </section>

      {/* ── Account & Session ── */}
      <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <LogOut className="w-4 h-4 text-stone-400" />
          <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
            Phiên đăng nhập
          </h4>
        </div>

        {/* Account fact rows */}
        <div className="space-y-0 mb-6 bg-stone-50 dark:bg-stone-950 rounded-lg border border-stone-100 dark:border-stone-800 overflow-hidden">
          {[
            {
              label: 'Email tài khoản',
              value: authUser?.email ?? '—',
            },
            {
              label: 'Đăng nhập lần cuối',
              value: authUser?.last_sign_in_at
                ? new Date(authUser.last_sign_in_at).toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—',
            },
            {
              label: 'Xác thực qua',
              value:
                authUser?.app_metadata?.provider === 'email'
                  ? 'Email & Mật khẩu'
                  : (authUser?.app_metadata?.provider ?? '—'),
            },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-start justify-between px-4 py-3 border-b border-stone-100 dark:border-stone-800 last:border-0"
            >
              <span className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                {row.label}
              </span>
              <span className="text-xs font-medium text-stone-700 dark:text-stone-300 text-right max-w-[60%] break-all">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Danger zone */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mb-4 leading-relaxed">
            Nếu bạn nghi ngờ tài khoản bị truy cập trái phép, hãy thu hồi tất cả phiên đăng nhập từ
            các thiết bị khác. Phiên làm việc trên thiết bị này sẽ không bị ảnh hưởng.
          </p>
          <button
            onClick={handleLogoutOthers}
            disabled={loggingOut}
            className="flex items-center gap-2 px-4 py-2.5 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
          >
            {loggingOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            Thu hồi tất cả phiên khác
          </button>
        </div>
      </section>
    </motion.div>
  );
}
