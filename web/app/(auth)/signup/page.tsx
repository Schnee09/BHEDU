"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import GuestGuard from "@/components/GuestGuard";
import { UserRole } from "@/lib/role-utils";
import { logger } from "@/lib/logger";
import { usePerformanceMonitor } from "@/lib/performanceMonitor";
import { Button, Input, LoadingSpinner } from "@/components/ui";
import { Icons } from "@/components/ui/Icons";
import { motion, AnimatePresence } from "framer-motion";

function SignupPageContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("parent");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviterName, setInviterName] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [personalEmail, setPersonalEmail] = useState("");

  usePerformanceMonitor('SignupPage');

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setInviteToken(token);
      verifyInvite(token);
    }
  }, [searchParams]);

  interface InviteResponse {
    success: boolean;
    invite?: {
      email: string;
      phone: string;
      role: string;
      invitedBy: string;
    };
    error?: string;
  }

  const verifyInvite = async (token: string) => {
    try {
      const res = await fetch(`/api/auth/verify-invite?token=${token}`);
      const data = (await res.json()) as InviteResponse;
      if (data.success && data.invite) {
        logger.info("Invite verified successfully", { token: token.slice(-6) });
        if (data.invite.email) setEmail(data.invite.email);
        if (data.invite.phone) setPhone(data.invite.phone);
        if (data.invite.role) setRole(data.invite.role as UserRole);
        if (data.invite.invitedBy) setInviterName(data.invite.invitedBy);
      } else {
        setError(data.error || "Mã mời không hợp lệ");
      }
    } catch (err) {
      console.error("Error verifying invite:", err);
      logger.error("Error verifying invite", err);
    }
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    logger.info("Attempting signup", { role, hasInvite: !!inviteToken });

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      setLoading(false);
      return;
    }

    const authOptions = {
      email: email || undefined,
      phone: phone ? (phone.startsWith('0') ? `+84${phone.substring(1)}` : phone) : undefined,
      password,
      options: {
        data: {
          full_name: name,
          role: role,
          invite_token: inviteToken,
          personal_email: personalEmail || (phone && email ? email : undefined)
        },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    };

    const { data, error } = await (phone && !email
      ? supabase.auth.signUp({ phone: authOptions.phone!, password: authOptions.password, options: authOptions.options })
      : supabase.auth.signUp({ email: authOptions.email!, password: authOptions.password, options: authOptions.options }));

    if (error) {
      setError(error.message);
      logger.error("Signup failed", error);
    } else {
      logger.info("Signup successful", { phone: !!phone, email: !!email });
      if (phone && !email) {
        setMessage("Kiểm tra điện thoại của bạn để nhận mã xác nhận!");
      } else {
        setMessage("Kiểm tra email của bạn để xác nhận tài khoản!");
      }
    }
    setLoading(false);
  };

  const signUpWithGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    logger.info("Initiating Google signup");

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
      logger.error("Google signup failed", error);
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
        <div className="glass-premium rounded-[40px] shadow-ultra border border-white/20 dark:border-white/5 p-8 sm:p-12 w-full">
          {/* Invitation Banner */}
          <AnimatePresence>
            {inviterName && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8"
              >
                <div className="glass-crystal rounded-3xl p-1 shadow-ultra border-primary/20">
                  <div className="bg-primary/5 dark:bg-white/5 rounded-2xl px-5 py-4 flex items-center gap-4">
                    <div className="bg-primary text-white p-2.5 rounded-xl shadow-lg">
                      <Icons.Security className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Lời mời từ hệ thống</p>
                      <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                        <span className="font-bold text-stone-900 dark:text-white">{inviterName}</span> đã mời bạn làm <span className="font-bold text-stone-900 dark:text-white capitalize">{role}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Logo and Header */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-primary p-5 rounded-[28px] shadow-2xl shadow-primary/30"
              >
                <Icons.User className="w-12 h-12 text-white" />
              </motion.div>
            </div>
            <h2 className="text-4xl font-serif font-bold text-stone-900 dark:text-white mb-2 italic tracking-tight uppercase">
              Đăng ký
            </h2>
            <p className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-[0.4em] font-sans">
              Join our Academic Community
            </p>
          </div>

          {/* Google Sign Up Button */}
          {!inviteToken && (
            <div className="mb-10">
              <Button
                variant="secondary"
                onClick={signUpWithGoogle}
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
                <span className="text-sm font-bold uppercase tracking-wider">Đăng ký với Google</span>
              </Button>

              <div className="relative my-10">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200/50 dark:border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-6 bg-transparent text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest leading-none">
                    Hoặc sử dụng biểu mẫu
                  </span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={signUp} className="space-y-6">
            <Input
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<Icons.User className="w-4 h-4" />}
            />

            <div className="space-y-6">
              <Input
                label="Địa chỉ Email"
                type="email"
                placeholder="ban@example.com"
                required={!phone}
                disabled={!!inviteToken && !!email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Icons.Mail className="w-4 h-4" />}
              />

              {!email && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <Input
                    label="Email cá nhân (Tùy chọn)"
                    type="email"
                    placeholder="gmail@example.com"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    leftIcon={<Icons.Mail className="w-4 h-4" />}
                  />
                </motion.div>
              )}

              <Input
                label="Số điện thoại"
                type="tel"
                placeholder="0987xxx..."
                required={!email}
                disabled={!!inviteToken && !!phone}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Icons.Phone className="w-4 h-4" />}
              />
            </div>

            <div className="space-y-2">
              <Input
                label="Mật khẩu"
                type={showPassword ? "text" : "password"}
                placeholder="Ít nhất 6 ký tự"
                required
                minLength={6}
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
            </div>

            {!inviteToken && (
              <div className="bg-stone-50 dark:bg-stone-900/40 border-l-4 border-primary p-4 rounded-xl">
                <p className="text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-widest leading-relaxed">
                  <span className="text-primary">Lưu ý:</span> Bạn đang đăng ký vai trò <b>Phụ huynh</b>. Liên hệ Quản trị viên để nhận mã mời cho các vai trò khác.
                </p>
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
                {loading ? "Đang tạo tài khoản..." : "Hoàn tất đăng ký"}
              </span>
              {!loading && <Icons.ArrowRight className="w-5 h-5 ml-2" />}
            </Button>
          </form>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-5 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl">
                <div className="text-red-800 dark:text-red-300 text-xs font-bold flex items-center gap-3">
                  <Icons.Error className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              </motion.div>
            )}
            {message && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-5 bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 rounded-xl">
                <p className="text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-3">
                  <Icons.Success className="w-5 h-5 flex-shrink-0" />
                  {message}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-[11px] font-bold mt-10 text-stone-500 dark:text-stone-400 uppercase tracking-widest">
            Đã có tài khoản?{" "}
            <a href="/login" className="text-primary dark:text-white hover:underline underline-offset-4">
              Đăng nhập
            </a>
          </p>
        </div>
      </motion.div>
    </GuestGuard>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12"><LoadingSpinner size="lg" /></div>}>
      <SignupPageContent />
    </Suspense>
  );
}
