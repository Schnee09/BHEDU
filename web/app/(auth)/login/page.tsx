"use client";

import { useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import GuestGuard from "@/components/GuestGuard";
import { Button, Input, LoadingSpinner } from "@/components/ui";
import { Icons } from "@/components/ui/Icons";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type LoginMode = 'email' | 'student_code' | 'phone';

export default function LoginPage() {
  const router = useRouter();
  const [loginMode, setLoginMode] = useState<LoginMode>('email');
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleRedirect = (role: string | null | undefined) => {
    switch (role) {
      case "owner":
        router.replace("/dashboard");
        break;
      case "super_admin":
      case "admin":
      case "staff":
        router.replace("/dashboard");
        break;
      case "teacher":
      case "tutor":
        router.replace("/dashboard/timetable");
        break;
      case "parent":
        router.replace("/dashboard/parent");
        break;
      case "student":
        router.replace("/dashboard/grades");
        break;
      default:
        router.replace("/dashboard");
    }
  };

  const getProfileRole = async (userId: string) => {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .single();
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

  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (loginMode === 'student_code') {
        const res = await fetch('/api/auth/student-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_code: studentCode }),
        });

        const lookupData = await res.json();
        if (!res.ok || !lookupData.success) {
          setError(lookupData.error || 'Không tìm thấy học sinh');
          setLoading(false);
          return;
        }

        const student = lookupData.student;
        if (student.email) {
          if (!password) {
            setError('Vui lòng nhập mật khẩu');
            setLoading(false);
            return;
          }

          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: student.email,
            password,
          });

          if (signInError) setError(signInError.message);
          else await handleAuthResult(signInData.user?.id, signInData.user?.user_metadata?.role);
        } else {
          setError('Tài khoản này chưa có email, vui lòng liên hệ NV hỗ trợ');
        }
      } else if (loginMode === 'phone') {
        if (otpMode) {
          const { data, error: otpError } = await supabase.auth.verifyOtp({
            phone: phone.startsWith('0') ? `+84${phone.substring(1)}` : phone,
            token: otp,
            type: 'sms',
          });

          if (otpError) setError(otpError.message);
          else await handleAuthResult(data.user?.id, data.user?.user_metadata?.role);
        } else {
          const { error: sendError } = await supabase.auth.signInWithOtp({
            phone: phone.startsWith('0') ? `+84${phone.substring(1)}` : phone,
          });

          if (sendError) setError(sendError.message);
          else {
            setOtpMode(true);
            setMessage("Mã OTP đã được gửi đến SĐT của bạn");
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) setError(error.message);
        else await handleAuthResult(data.user?.id, data.user?.user_metadata?.role);
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi');
    }

    setLoading(false);
  };

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <GuestGuard>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[480px] relative z-10"
      >
        {/* Card with premium glass effect */}
        <div className="glass-premium rounded-[40px] shadow-ultra border border-white/20 dark:border-white/5 p-8 sm:p-12 w-full">
          {/* Logo and Header */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative w-28 h-28 p-2 glass-crystal rounded-3xl"
              >
                <Image
                  src="/logo.png"
                  alt="Bùi Hoàng Logo"
                  fill
                  sizes="112px"
                  className="object-contain p-2"
                  priority
                />
              </motion.div>
            </div>
            <h1 className="text-4xl font-serif font-bold text-stone-900 dark:text-white mb-2 italic tracking-tight uppercase">
              BH-EDU
            </h1>
            <p className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-[0.4em] font-sans">
              Academic Management System
            </p>
          </div>

          {/* Login Mode Toggle - Standardized */}
          <div className="flex rounded-xl bg-stone-100 dark:bg-stone-900/50 p-1.5 mb-8 border border-stone-200 dark:border-white/5 shadow-inner">
            {(['email', 'phone', 'student_code'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                title={mode === 'email' ? 'Đăng nhập bằng Email' : mode === 'phone' ? 'Đăng nhập bằng SĐT' : 'Đăng nhập bằng Mã học sinh'}
                onClick={() => { setLoginMode(mode); setOtpMode(false); setError(null); setMessage(null); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300",
                  loginMode === mode
                    ? "bg-white dark:bg-stone-800 text-primary dark:text-white shadow-md scale-[1.02]"
                    : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"
                )}
              >
                {mode === 'email' && <Icons.Mail className="w-3.5 h-3.5" />}
                {mode === 'phone' && <Icons.Phone className="w-3.5 h-3.5" />}
                {mode === 'student_code' && <Icons.Teachers className="w-3.5 h-3.5" />}
                <span className="sm:inline-block">
                  {mode === 'email' ? 'Email' : mode === 'phone' ? 'SĐT' : 'Mã số'}
                </span>
              </button>
            ))}
          </div>

          {/* Content Switcher */}
          <AnimatePresence mode="wait">
            <motion.div
              key={loginMode}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* Google Sign In Button - only for email mode */}
              {loginMode === 'email' && (
                <div className="mb-8">
                  <Button
                    variant="secondary"
                    onClick={signInWithGoogle}
                    disabled={googleLoading || loading}
                    fullWidth
                    className="bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 h-14"
                  >
                    {googleLoading ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    )}
                    <span className="text-sm font-bold uppercase tracking-wider">Tiếp tục với Google</span>
                  </Button>

                  <div className="relative my-10">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-stone-200/50 dark:border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-6 bg-transparent text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest leading-none">
                        Hoặc sử dụng tài khoản
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={signInWithPassword} className="space-y-6">
                {loginMode === 'email' ? (
                  <Input
                    label="Địa chỉ Email"
                    type="email"
                    placeholder="ban@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftIcon={<Icons.Mail className="w-4 h-4" />}
                  />
                ) : loginMode === 'phone' ? (
                  <div className="space-y-6">
                    <Input
                      label="Số điện thoại"
                      type="tel"
                      placeholder="0987xxx..."
                      required
                      disabled={otpMode}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      leftIcon={<Icons.Phone className="w-4 h-4" />}
                    />
                    {otpMode && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2"
                      >
                        <Input
                          label="Mã OTP"
                          type="text"
                          placeholder="123456"
                          required
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          leftIcon={<Icons.Lock className="w-4 h-4" />}
                          className="tracking-[0.5em] text-center font-bold text-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setOtpMode(false)}
                          className="text-[10px] font-bold text-primary dark:text-stone-400 uppercase tracking-widest hover:underline"
                        >
                          Thay đổi số điện thoại
                        </button>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <Input
                    label="Mã học sinh"
                    type="text"
                    placeholder="HS2025001"
                    required
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                    leftIcon={<Icons.Teachers className="w-4 h-4" />}
                    className="uppercase font-bold tracking-wider"
                  />
                )}

                {/* Password Field - unified */}
                {loginMode !== 'phone' && (
                  <div className="space-y-2">
                    <Input
                      label="Mật khẩu"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      leftIcon={<Icons.Lock className="w-4 h-4" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
                        >
                          {showPassword ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
                        </button>
                      }
                    />
                    {loginMode === 'email' && (
                      <div className="flex justify-end">
                        <a href="/forgot-password" title="Quên mật khẩu" className="text-[10px] font-bold text-stone-500 hover:text-primary dark:hover:text-white uppercase tracking-widest transition-colors">
                          Quên mật khẩu?
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={loading || googleLoading}
                  fullWidth
                  className="h-14 mt-4 shadow-xl shadow-primary/20"
                >
                  <span className="text-sm font-bold uppercase tracking-widest">
                    {loading ? "Đang xử lý..." : (
                      otpMode ? 'Xác nhận mã OTP' : loginMode === 'phone' ? 'Gửi mã OTP' : 'Đăng nhập hệ thống'
                    )}
                  </span>
                  {!loading && <Icons.ArrowRight className="w-5 h-5 ml-2" />}
                </Button>
              </form>
            </motion.div>
          </AnimatePresence>

          {/* Error/Success Messages - Redesigned */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-8 p-5 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl"
              >
                <p className="text-red-800 dark:text-red-300 text-xs font-bold flex items-center gap-3">
                  <Icons.Warning className="w-5 h-5 flex-shrink-0" />
                  {error}
                </p>
              </motion.div>
            )}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-8 p-5 bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 rounded-xl"
              >
                <p className="text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-3">
                  <Icons.Success className="w-5 h-5 flex-shrink-0" />
                  {message}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Navigation */}
          {loginMode === 'email' && (
            <p className="text-center text-[11px] font-bold mt-10 text-stone-500 dark:text-stone-400 uppercase tracking-widest">
              Chưa có tài khoản?{" "}
              <a
                href="/signup"
                title="Tạo tài khoản"
                className="text-primary dark:text-white hover:underline transition-all underline-offset-4"
              >
                Đăng ký ngay
              </a>
            </p>
          )}

          <div className="mt-12 pt-8 border-t border-stone-200 dark:border-white/5 flex justify-center gap-8">
            <a href="/terms" className="text-[9px] font-black text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 uppercase tracking-widest transition-colors">Điều khoản</a>
            <a href="/privacy" className="text-[9px] font-black text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 uppercase tracking-widest transition-colors">Bảo mật</a>
            <a href="/support" className="text-[9px] font-black text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 uppercase tracking-widest transition-colors">Trợ giúp</a>
          </div>
        </div>
      </motion.div>
    </GuestGuard>
  );
}

