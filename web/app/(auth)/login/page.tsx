'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import GuestGuard from '@/components/GuestGuard';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Phone,
  ArrowRight,
  ArrowLeft,
  Globe,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AuthMethod = 'standard' | 'phone_otp';

export default function LoginPage() {
  const router = useRouter();

  // Mode
  const [authMethod, setAuthMethod] = useState<AuthMethod>('standard');

  // Standard login fields (identifier can be Student Code, Teacher Code, Phone, Username or Email)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Phone OTP login fields
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // State
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleRedirect = (role: string | null | undefined) => {
    switch (role) {
      case 'owner':
      case 'super_admin':
      case 'admin':
        router.replace('/dashboard');
        break;
      case 'teacher':
      case 'tutor':
        router.replace('/dashboard/timetable');
        break;
      case 'parent':
        router.replace('/dashboard/parent');
        break;
      case 'student':
        router.replace('/dashboard/grades');
        break;
      default:
        router.replace('/dashboard');
    }
  };

  const getProfileRole = async (userId: string) => {
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    return (profileRow as { role?: string } | null)?.role;
  };

  const handleAuthResult = async (userId: string | undefined, metadataRole?: string) => {
    if (!userId) return;
    let userRole = metadataRole;
    if (!userRole) {
      userRole = await getProfileRole(userId);
    }
    handleRedirect(userRole);
  };

  // 1. Standard Multi-Identifier Sign In
  const handleStandardSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const rawIdentifier = identifier.trim();
    if (!rawIdentifier) {
      setError('Vui lòng nhập Mã học sinh, Tên đăng nhập, SĐT hoặc Email');
      return;
    }

    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setLoading(true);

    try {
      let targetEmail = rawIdentifier;

      // If user typed UID, student_code, phone or username without @, resolve to target email
      if (!rawIdentifier.includes('@')) {
        try {
          const lookupRes = await fetch('/api/auth/lookup-identifier', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: rawIdentifier }),
          });
          const lookupData = await lookupRes.json();
          if (lookupRes.ok && lookupData.success && lookupData.data?.email) {
            targetEmail = lookupData.data.email;
          } else {
            // Fallback
            targetEmail = `${rawIdentifier.toLowerCase()}@student.bhedu.vn`;
          }
        } catch {
          // Keep raw
        }
      }

      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });

      if (authErr) {
        const lower = authErr.message.toLowerCase();
        if (
          lower.includes('invalid login credentials') ||
          lower.includes('invalid_grant') ||
          lower.includes('wrong password')
        ) {
          setError('Tên đăng nhập, mã định danh hoặc mật khẩu không chính xác.');
        } else {
          setError(authErr.message);
        }
      } else {
        await handleAuthResult(data.user?.id, data.user?.user_metadata?.role);
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi trong quá trình đăng nhập.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Phone OTP Sign In
  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!phone) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }

    setLoading(true);

    const formattedPhone = phone.startsWith('0') ? `+84${phone.substring(1)}` : phone;

    try {
      if (otpSent) {
        if (!otp || otp.length < 6) {
          setError('Vui lòng nhập đầy đủ mã OTP 6 chữ số');
          setLoading(false);
          return;
        }

        const { data, error: verifyErr } = await supabase.auth.verifyOtp({
          phone: formattedPhone,
          token: otp,
          type: 'sms',
        });

        if (verifyErr) {
          setError(verifyErr.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
        } else {
          await handleAuthResult(data.user?.id, data.user?.user_metadata?.role);
        }
      } else {
        const { error: sendErr } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
        });

        if (sendErr) {
          setError(sendErr.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại số điện thoại.');
        } else {
          setOtpSent(true);
          setMessage('Mã OTP đã được gửi đến số điện thoại của bạn.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi xử lý OTP.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      const { error: googleErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (googleErr) {
        setError(googleErr.message);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể kết nối với tài khoản Google.');
      setGoogleLoading(false);
    }
  };

  return (
    <GuestGuard>
      <div className="min-h-screen flex flex-col justify-center items-center p-3 sm:p-6 bg-stone-100 dark:bg-[#0E0D0B] text-stone-900 dark:text-stone-100 selection:bg-amber-500/30">
        {/* Return to Landing Page Button */}
        <div className="w-full max-w-md mb-3 flex items-center justify-between px-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-400 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Về Trang giới thiệu</span>
          </Link>
          <span className="text-[10px] font-mono text-stone-400 flex items-center gap-1">
            <Globe className="w-3 h-3 text-amber-500" />
            Cổng thông tin BH-EDU
          </span>
        </div>

        {/* Main Card */}
        <div className="w-full max-w-md bg-white dark:bg-[#14120E] border border-stone-200 dark:border-stone-800 rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-8 space-y-4 sm:space-y-6">
          {/* Header & Logo */}
          <div className="text-center space-y-2 sm:space-y-3">
            <Link href="/" title="Về Trang giới thiệu" className="inline-block group">
              <div className="relative inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/15 dark:via-white/5 dark:to-transparent border border-amber-500/25 dark:border-amber-500/30 shadow-xl shadow-amber-500/20 group-hover:shadow-amber-500/35 group-hover:scale-105 group-hover:border-amber-500/40 transition-all duration-300 p-2 backdrop-blur-md">
                <Image
                  src="/logo.png"
                  alt="BH-EDU Logo"
                  width={60}
                  height={60}
                  className="object-contain w-full h-full drop-shadow-[0_4px_10px_rgba(217,119,6,0.35)]"
                  priority
                />
              </div>
            </Link>

            <div className="space-y-0.5 sm:space-y-1">
              <span className="inline-flex items-center gap-1 text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                TRUNG TÂM GIÁO DỤC BÙI HOÀNG
              </span>
              <h1 className="text-xl sm:text-3xl font-black tracking-tight text-stone-950 dark:text-white pt-0.5">
                Đăng Nhập BH-EDU
              </h1>
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400">
                Hệ thống Quản lý & Học tập Trực tuyến
              </p>
            </div>
          </div>

          {/* Alert messages */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs font-semibold animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
              </div>
            </div>
          )}

          {message && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2.5 text-emerald-700 dark:text-emerald-300 text-xs font-semibold animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{message}</span>
              </div>
            </div>
          )}

          {/* Auth Method Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-stone-100 dark:bg-[#1C1A16] border border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('standard');
                setError(null);
              }}
              className={cn(
                'py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5',
                authMethod === 'standard'
                  ? 'bg-white dark:bg-[#25221D] text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
              )}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Tài khoản / UID</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMethod('phone_otp');
                setError(null);
              }}
              className={cn(
                'py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5',
                authMethod === 'phone_otp'
                  ? 'bg-white dark:bg-[#25221D] text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
              )}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Mã OTP SĐT</span>
            </button>
          </div>

          {/* Form: Standard Login */}
          {authMethod === 'standard' && (
            <form onSubmit={handleStandardSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                  Tên đăng nhập / Mã định danh / Email
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Mã học sinh (HS2026...), Tên đăng nhập hoặc Email..."
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-stone-50 dark:bg-[#1C1A16] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs font-semibold placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                    Mật khẩu
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu của bạn..."
                    className="w-full h-11 pl-10 pr-10 rounded-xl bg-stone-50 dark:bg-[#1C1A16] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs font-semibold placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Đang xác thực...' : 'Đăng nhập hệ thống'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Form: Phone OTP */}
          {authMethod === 'phone_otp' && (
            <form onSubmit={handlePhoneSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                  Số điện thoại đã đăng ký
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="tel"
                    required
                    disabled={otpSent}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0987xxxxxx..."
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-stone-50 dark:bg-[#1C1A16] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs font-semibold placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              {otpSent && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                      Mã xác thực OTP (6 số)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp('');
                      }}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      Đổi số điện thoại
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full h-11 text-center tracking-[0.4em] font-mono text-base font-black rounded-xl bg-stone-50 dark:bg-[#1C1A16] border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                <span>
                  {loading
                    ? 'Đang xử lý...'
                    : otpSent
                      ? 'Xác nhận OTP & Đăng nhập'
                      : 'Gửi mã xác thực OTP'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Google Sign In Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-stone-200 dark:border-stone-800 w-full" />
            <span className="bg-white dark:bg-[#14120E] px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 shrink-0">
              Hoặc tiếp tục với
            </span>
            <div className="border-t border-stone-200 dark:border-stone-800 w-full" />
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full h-11 rounded-xl bg-stone-50 dark:bg-[#1C1A16] hover:bg-stone-100 dark:hover:bg-[#25221D] text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800 text-xs font-bold flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
              />
            </svg>
            <span>
              {googleLoading ? 'Đang kết nối Google...' : 'Đăng nhập bằng tài khoản Google'}
            </span>
          </button>

          {/* Footer Navigation */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 text-center space-y-2">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Chưa có tài khoản?{' '}
              <Link
                href="/signup"
                className="font-bold text-amber-600 dark:text-amber-400 hover:underline"
              >
                Đăng ký Phụ huynh / Kích hoạt học sinh
              </Link>
            </p>

            <p className="text-[10px] text-stone-400 dark:text-stone-500">
              © {new Date().getFullYear()} Trung tâm Giáo dục BH. Bảo mật đa lớp chuẩn EdTech.
            </p>
          </div>
        </div>
      </div>
    </GuestGuard>
  );
}
