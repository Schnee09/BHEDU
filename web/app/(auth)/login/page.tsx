"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import GuestGuard from "@/components/GuestGuard";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setError(error.message);
    else {
      let userRole = data.user?.user_metadata?.role as string | undefined;
      if (!userRole) {
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", data.user?.id)
          .single();
  userRole = (profileRow as { role?: unknown } | null)?.role as string | undefined;
      }

      if (userRole === "admin" || userRole === "staff") router.replace("/dashboard");
      else if (userRole === "teacher") router.replace("/dashboard/classes");
      else router.replace("/dashboard");
    }

    setLoading(false);
  };

  const signInWithMagicLink = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) setError(error.message);
    else setMessage("Check your email for the magic link to sign in.");
    setLoading(false);
  };

  const signInDemo = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: "admin@example.com",
      password: "password",
    });
    setLoading(false);

    if (error) setError(error.message);
    else router.replace("/dashboard");
  };

  return (
    <GuestGuard>
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-white px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card with glass effect */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl shadow-blue-500/10 border border-blue-100/50 p-8">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-3 rounded-2xl shadow-lg shadow-blue-500/30">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-blue-800 bg-clip-text text-transparent font-heading mb-2">
              Chào mừng trở lại
            </h2>
            <p className="text-slate-600">Đăng nhập để truy cập bảng điều khiển</p>
          </div>

        <form onSubmit={signInWithPassword} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Địa chỉ Email
            </label>
            <input
              className="w-full border-2 border-slate-200 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-900 placeholder-slate-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="ban@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Mật khẩu
            </label>
            <input
              className="w-full border-2 border-slate-200 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-900 placeholder-slate-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang đăng nhập...
              </span>
            ) : "Đăng nhập"}
          </button>

          <div className="flex justify-between items-center text-sm mt-4">
            <button
              type="button"
              onClick={signInWithMagicLink}
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
            >
              Sử dụng Magic Link
            </button>
            <a
              href="/forgot-password"
              className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
            >
              Quên mật khẩu?
            </a>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-700 font-medium">HOẶC</span>
            </div>
          </div>

          <button
            type="button"
            onClick={signInDemo}
            disabled={loading}
            className="w-full py-3 bg-stone-700 hover:bg-stone-800 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2"
          >
            Đăng nhập Demo
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            </div>
          )}
          {message && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm font-medium flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {message}
              </p>
            </div>
          )}
        </form>

        <p className="text-center text-sm mt-6 text-slate-600">
          Chưa có tài khoản?{" "}
          <a href="/signup" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors">
            Tạo tài khoản
          </a>
        </p>
        </div>
      </div>
    </div>
    </GuestGuard>
  );
}
