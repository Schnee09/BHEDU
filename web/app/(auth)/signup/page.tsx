"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import GuestGuard from "@/components/GuestGuard";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, CheckCircle, Phone, ShieldCheck } from "lucide-react";
import { UserRole } from "@/lib/role-utils";
import { logger } from "@/lib/logger";
import { usePerformanceMonitor } from "@/lib/performanceMonitor";

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-slate-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 px-4 py-12">
        <div className="w-full max-w-md">
          {/* Invitation Banner */}
          {inviterName && (
            <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-1 rounded-2xl shadow-lg ring-4 ring-purple-500/10">
                <div className="bg-white dark:bg-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Lời mời từ hệ thống</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-gray-200">
                      <span className="font-bold text-slate-900 dark:text-white">{inviterName}</span> đã mời bạn tham gia với vai trò <span className="font-bold text-slate-900 dark:text-white capitalize">{role}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="glass-premium rounded-[40px] shadow-2xl shadow-purple-500/10 dark:shadow-purple-500/10 border border-white/20 dark:border-white/5 p-8 sm:p-12 animate-card-entrance">
            {/* Logo and Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-[24px] shadow-2xl shadow-purple-500/30 group-hover:scale-110 transition-transform duration-500">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-black text-stone-900 dark:text-white mb-2 uppercase tracking-tighter">
                Tạo tài khoản
              </h2>
              <p className="text-sm font-bold text-stone-500 dark:text-gray-400 uppercase tracking-widest">Đăng ký để bắt đầu hành trình</p>
            </div>

            {/* Google Sign Up Button - Hidden if invite present */}
            {!inviteToken && (
              <>
                <button
                  type="button"
                  onClick={signUpWithGoogle}
                  disabled={googleLoading || loading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  {googleLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  {googleLoading ? "Đang kết nối..." : "Đăng ký với Google"}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-gray-800 text-slate-500 dark:text-gray-400 font-medium">hoặc đăng ký bằng email/SĐT</span>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={signUp} className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-200 mb-2">
                  Họ và tên
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500" />
                  <input
                    className="w-full border-2 border-slate-200 dark:border-gray-600 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white dark:bg-gray-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    type="text"
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-gray-200 mb-2">
                    Địa chỉ Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500" />
                    <input
                      className="w-full border-2 border-slate-200 dark:border-gray-600 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white dark:bg-gray-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      placeholder="ban@example.com"
                      required={!phone}
                      disabled={!!inviteToken && !!email}
                    />
                  </div>
                </div>

                {!email && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-gray-200 mb-2">
                      Email cá nhân (Tùy chọn)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500" />
                      <input
                        className="w-full border-2 border-slate-200 dark:border-gray-600 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white dark:bg-gray-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400"
                        value={personalEmail}
                        onChange={(e) => setPersonalEmail(e.target.value)}
                        type="email"
                        placeholder="gmail@example.com"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-gray-200 mb-2">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500" />
                    <input
                      className="w-full border-2 border-slate-200 dark:border-gray-600 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white dark:bg-gray-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      type="tel"
                      placeholder="0987xxx..."
                      required={!email}
                      disabled={!!inviteToken && !!phone}
                    />
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-200 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500" />
                  <input
                    className="w-full border-2 border-slate-200 dark:border-gray-600 pl-10 pr-12 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white dark:bg-gray-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Ít nhất 6 ký tự"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Role Display for Non-invitees */}
              {!inviteToken && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-3 rounded-xl">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    <span className="font-bold">Lưu ý:</span> Bạn đang đăng ký với vai trò <b>Phụ huynh</b>. Để đăng ký các vai trò khác, vui lòng liên hệ quản trị viên để nhận mã mời.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang tạo tài khoản...
                  </>
                ) : (
                  <>
                    Tạo tài khoản
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Error/Success Messages */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-red-700 dark:text-red-300 text-sm font-medium flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              </div>
            )}
            {message && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl">
                <p className="text-green-700 dark:text-green-300 text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  {message}
                </p>
              </div>
            )}

            {/* Login Link */}
            <p className="text-center text-sm mt-6 text-slate-600 dark:text-gray-300">
              Đã có tài khoản?{" "}
              <a href="/login" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold hover:underline transition-colors">
                Đăng nhập
              </a>
            </p>
          </div>
        </div>
      </div>
    </GuestGuard>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-purple-600" /></div>}>
      <SignupPageContent />
    </Suspense>
  );
}


