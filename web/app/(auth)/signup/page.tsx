'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import GuestGuard from '@/components/GuestGuard';
import {
  Users,
  GraduationCap,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode: 'parent_signup' | 'student_activation'
  const [signupType, setSignupType] = useState<'parent' | 'student_activate'>('parent');

  // Fields: Parent
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [childStudentCode, setChildStudentCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Fields: Student activation
  const [studentCode, setStudentCode] = useState('');
  const [initialPassword, setInitialPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Invite token support
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [invitedRole, setInvitedRole] = useState<string | null>(null);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setInviteToken(token);
      verifyInviteToken(token);
    }
  }, [searchParams]);

  const verifyInviteToken = async (token: string) => {
    try {
      const res = await fetch(`/api/auth/verify-invite?token=${token}`);
      const data = await res.json();
      if (res.ok && data.success && data.invite) {
        setEmail(data.invite.email || '');
        setPhone(data.invite.phone || '');
        setInvitedRole(data.invite.role || 'parent');
        setSuccessMessage(`Bạn đang đăng ký theo lời mời từ Quản trị viên.`);
      } else {
        setError(data.error || 'Mã mời không hợp lệ hoặc đã hết hạn.');
      }
    } catch {
      setError('Không thể kiểm tra mã mời.');
    }
  };

  // 1. Parent Registration
  const handleParentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setError('Vui lòng nhập Họ và tên của bạn');
      return;
    }

    if (!email.trim() && !phone.trim()) {
      setError('Vui lòng cung cấp Địa chỉ Email hoặc Số điện thoại để liên lạc');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có độ dài tối thiểu 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);

    try {
      const registerEmail = email.trim() || `${phone.replace(/\D/g, '')}@parent.bhedu.vn`;
      const formattedPhone = phone.startsWith('0') ? `+84${phone.substring(1)}` : phone;

      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: registerEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: invitedRole || 'parent',
            phone: formattedPhone || undefined,
            personal_email: email.trim() || undefined,
            child_student_code: childStudentCode.trim().toUpperCase() || undefined,
          },
        },
      });

      if (authErr) {
        const lower = authErr.message.toLowerCase();
        if (lower.includes('already registered')) {
          setError('Email hoặc Số điện thoại này đã được đăng ký tài khoản.');
        } else {
          setError(authErr.message);
        }
      } else {
        setSuccessMessage(
          'Đăng ký tài khoản Phụ huynh thành công! Đang chuyển hướng vào hệ thống...'
        );
        setTimeout(() => {
          router.replace('/dashboard/parent');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi trong quá trình tạo tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Student Account Activation
  const handleStudentActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const code = studentCode.trim().toUpperCase();
    if (!code) {
      setError('Vui lòng nhập Mã học sinh (UID) do trung tâm cấp (VD: HS20260001)');
      return;
    }

    if (!initialPassword) {
      setError('Vui lòng nhập mật khẩu ban đầu được cấp');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      // 1. Resolve student login email
      const lookupRes = await fetch('/api/auth/lookup-identifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: code }),
      });
      const lookupData = await lookupRes.json();
      const studentEmail =
        lookupRes.ok && lookupData.success && lookupData.data?.email
          ? lookupData.data.email
          : `${code.toLowerCase()}@student.bhedu.vn`;

      // 2. Sign in with initial password
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: studentEmail,
        password: initialPassword,
      });

      if (signInErr) {
        setError('Mã học sinh hoặc mật khẩu ban đầu không chính xác. Vui lòng kiểm tra lại.');
        setLoading(false);
        return;
      }

      // 3. Update to new password
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateErr) {
        setError(`Đã xác thực nhưng không thể đổi mật khẩu mới: ${updateErr.message}`);
      } else {
        setSuccessMessage('Kích hoạt tài khoản & đổi mật khẩu thành công! Đang chuyển hướng...');
        setTimeout(() => {
          router.replace('/dashboard/grades');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi kích hoạt tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-stone-100 dark:bg-[#0E0D0B] text-stone-900 dark:text-stone-100 selection:bg-amber-500/30">
      {/* Main Card */}
      <div className="w-full max-w-md bg-white dark:bg-[#14120E] border border-stone-200 dark:border-stone-800 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
        {/* Header & Logo */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block group">
            <div className="relative inline-flex items-center justify-center w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/15 dark:via-white/5 dark:to-transparent border border-amber-500/25 dark:border-amber-500/30 shadow-2xl shadow-amber-500/20 group-hover:shadow-amber-500/35 group-hover:scale-105 group-hover:border-amber-500/40 transition-all duration-300 p-2.5 backdrop-blur-md">
              <Image
                src="/logo.png"
                alt="BH-EDU Logo"
                width={72}
                height={72}
                className="object-contain w-full h-full drop-shadow-[0_4px_10px_rgba(217,119,6,0.35)]"
                priority
              />
            </div>
          </Link>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-[0.25em] text-amber-700 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/20">
              TRUNG TÂM GIÁO DỤC BÙI HOÀNG
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-950 dark:text-white pt-1">
              {inviteToken
                ? 'Đăng Ký Theo Lời Mời'
                : signupType === 'parent'
                ? 'Đăng Ký Phụ Huynh'
                : 'Kích Hoạt Học Sinh'}
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Hệ thống Quản lý & Học tập Trực tuyến
            </p>
          </div>
        </div>

        {/* Alert Error / Success */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs font-semibold animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{error}</span>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2.5 text-emerald-700 dark:text-emerald-300 text-xs font-semibold animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {/* Tab Selection (only if not using fixed invite token) */}
        {!inviteToken && (
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-stone-100 dark:bg-[#1C1A16] border border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={() => {
                setSignupType('parent');
                setError(null);
              }}
              className={cn(
                'py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5',
                signupType === 'parent'
                  ? 'bg-white dark:bg-[#25221D] text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Phụ huynh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSignupType('student_activate');
                setError(null);
              }}
              className={cn(
                'py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5',
                signupType === 'student_activate'
                  ? 'bg-white dark:bg-[#25221D] text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
              )}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Kích hoạt Học sinh</span>
            </button>
          </div>
        )}

        {/* 1. Parent Signup Form */}
        {signupType === 'parent' && (
          <form onSubmit={handleParentRegister} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                Họ và tên Phụ huynh *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-stone-50 dark:bg-[#1C1A16] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs font-semibold placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                  Số điện thoại *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0987xxxxxx"
                    className="w-full h-10 pl-10 pr-4 rounded-xl bg-stone-50 dark:bg-[#1C1A16] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs font-semibold placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                  Email cá nhân
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@gmail.com"
                    className="w-full h-10 pl-10 pr-4 rounded-xl bg-stone-50 dark:bg-[#1C1A16] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs font-semibold placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                Mã học sinh của con (UID)
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={childStudentCode}
                  onChange={(e) => setChildStudentCode(e.target.value.toUpperCase())}
                  placeholder="HS2026... (nếu con đã có tài khoản)"
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-stone-50 dark:bg-[#1C1A16] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs font-semibold placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                  Mật khẩu *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full h-10 pl-10 pr-9 rounded-xl bg-stone-50 dark:bg-[#1C1A16] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs font-semibold placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                  Xác nhận MK *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full h-10 pl-10 pr-4 rounded-xl bg-stone-50 dark:bg-[#1C1A16] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs font-semibold placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Đang khởi tạo tài khoản...' : 'Hoàn tất Đăng ký'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* 2. Student Activation Form */}
        {signupType === 'student_activate' && (
          <form onSubmit={handleStudentActivate} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                Mã học sinh (UID) do trung tâm cấp *
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  required
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                  placeholder="HS20260001"
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-stone-50 dark:bg-[#1C1A16] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs font-semibold font-mono placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                Mật khẩu ban đầu được cấp *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="password"
                  required
                  value={initialPassword}
                  onChange={(e) => setInitialPassword(e.target.value)}
                  placeholder="Mật khẩu tạm thời trên phiếu tài khoản"
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-stone-50 dark:bg-[#1C1A16] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs font-semibold placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                Đặt mật khẩu cá nhân mới *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới bạn muốn đặt (>= 6 ký tự)"
                  className="w-full h-10 pl-10 pr-9 rounded-xl bg-stone-50 dark:bg-[#1C1A16] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs font-semibold placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Đang kích hoạt...' : 'Kích hoạt & Đăng nhập ngay'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Footer Navigation */}
        <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 text-center space-y-2">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Đã có tài khoản?{' '}
            <Link
              href="/login"
              className="font-bold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Đăng nhập ngay
            </Link>
          </p>

          <p className="text-[10px] text-stone-400 dark:text-stone-500">
            © {new Date().getFullYear()} Trung tâm Giáo dục BH. Bảo mật thông tin học sinh chuẩn EdTech.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <GuestGuard>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
        <SignupContent />
      </Suspense>
    </GuestGuard>
  );
}
