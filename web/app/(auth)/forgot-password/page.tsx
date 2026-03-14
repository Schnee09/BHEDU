"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import GuestGuard from "@/components/GuestGuard";
import Link from "next/link";
import { Button, Input, LoadingSpinner } from "@/components/ui";
import { Icons } from "@/components/ui/Icons";
import { motion, AnimatePresence } from "framer-motion";

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
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[480px] relative z-10"
      >
        <div className="glass-premium rounded-[40px] shadow-ultra border border-white/20 dark:border-white/5 p-8 sm:p-12 w-full">
          {/* Back Link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[11px] font-bold text-stone-500 dark:text-stone-400 hover:text-primary dark:hover:text-white uppercase tracking-widest transition-all mb-10 group"
          >
            <Icons.Back className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Quay lại đăng nhập
          </Link>

          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-primary p-5 rounded-[28px] shadow-2xl shadow-primary/30"
              >
                <Icons.Lock className="w-12 h-12 text-white" />
              </motion.div>
            </div>
            <h2 className="text-4xl font-serif font-bold text-stone-900 dark:text-white mb-2 italic tracking-tight uppercase">
              Quên mật khẩu?
            </h2>
            <p className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-[0.4em] font-sans">
              Reset your Access Security
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-6">
            <Input
              label="Địa chỉ Email"
              type="email"
              placeholder="ban@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Icons.Mail className="w-4 h-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              fullWidth
              className="h-14 mt-4 shadow-xl shadow-primary/20"
            >
              <span className="text-sm font-bold uppercase tracking-widest">
                {loading ? "Đang gửi yêu cầu..." : "Gửi liên kết đặt lại"}
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
            Chưa có tài khoản?{" "}
            <Link href="/signup" className="text-primary dark:text-white hover:underline underline-offset-4">
              Tạo tài khoản
            </Link>
          </p>
        </div>
      </motion.div>
    </GuestGuard>
  );
}
