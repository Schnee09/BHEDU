"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import GuestGuard from "@/components/GuestGuard";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) setError(error.message);
    else setMessage("Kiểm tra email của bạn để nhận hướng dẫn đặt lại mật khẩu.");
    setLoading(false);
  };

  return (
    <GuestGuard>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-slate-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card with glass effect */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-2xl shadow-amber-500/10 dark:shadow-amber-500/10 border border-amber-100/50 dark:border-gray-700 p-8">
            {/* Back Link */}
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại đăng nhập
            </Link>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-2xl shadow-lg shadow-amber-500/30">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Quên mật khẩu?
              </h2>
              <p className="text-slate-600 dark:text-gray-300">Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu</p>
            </div>

            <form onSubmit={handleReset} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-200 mb-2">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-500" />
                  <input
                    className="w-full border-2 border-slate-200 dark:border-gray-600 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-white dark:bg-gray-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="ban@example.com"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  "Gửi liên kết đặt lại"
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

            {/* Sign Up Link */}
            <p className="text-center text-sm mt-6 text-slate-600 dark:text-gray-300">
              Chưa có tài khoản?{" "}
              <a href="/signup" className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold hover:underline transition-colors">
                Tạo tài khoản
              </a>
            </p>
          </div>
        </div>
      </div>
    </GuestGuard>
  );
}
