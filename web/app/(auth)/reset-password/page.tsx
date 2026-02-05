"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

const supabase = getBrowserSupabase();

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message);
    } else {
      setSuccess(true);
      toast.success("Mật khẩu đã được cập nhật thành công!");
      setTimeout(() => router.push("/login"), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-stone-50 dark:bg-stone-950 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <Card className="w-full max-w-md rounded-[48px] border-none shadow-2xl bg-white/70 dark:bg-stone-900/40 backdrop-blur-2xl relative z-10 overflow-hidden">
        <div className="p-10 md:p-12 space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[32px] bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 text-amber-600 mb-2 shadow-xl">
              <Icons.Lock className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-stone-900 dark:text-white">
              Đặt mật khẩu mới
            </h1>
            <p className="text-stone-500 dark:text-stone-400 font-medium">
              Vui lòng nhập mật khẩu mới và xác nhận để tiếp tục.
            </p>
          </div>

          {success ? (
            <div className="py-12 text-center space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Icons.Success className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-bold text-stone-900 dark:text-white uppercase tracking-tight">Cập nhật thành công!</p>
                <p className="text-sm text-stone-500">Bạn sẽ được chuyển hướng sang trang đăng nhập trong giây lát...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-500 ml-1">
                    Mật khẩu mới
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 rounded-2xl bg-white/50 dark:bg-stone-800/50 border-stone-200 dark:border-white/5 font-bold focus:ring-amber-500 focus:border-amber-500"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-500 ml-1">
                    Xác nhận mật khẩu
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-14 rounded-2xl bg-white/50 dark:bg-stone-800/50 border-stone-200 dark:border-white/5 font-bold focus:ring-amber-500 focus:border-amber-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-7 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-wider shadow-xl shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Icons.History className="w-5 h-5 animate-spin" />
                    Đang xử lý
                  </span>
                ) : (
                  "Cập nhật mật khẩu"
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="text-xs font-black uppercase tracking-widest text-stone-400 hover:text-amber-600 transition-colors"
                >
                  Quay lại đăng nhập
                </button>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
