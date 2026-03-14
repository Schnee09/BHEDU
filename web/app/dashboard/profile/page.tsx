"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/useToast";
import { Button, Input, Textarea } from "@/components/ui";
import { Icons } from "@/components/ui/Icons";
import { getRoleBadgeClass, getRoleLabel } from "@/lib/role-utils";
import { cn } from "@/lib/utils";
import PasswordSettingsModal from "@/components/profile/PasswordSettingsModal";
import { splitFullName } from "@/lib/utils/names";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { AcademicBackground } from "@/components/Academic/AcademicBackground";
import { FeedbackOverlay } from "@/components/Academic/FeedbackOverlay";

export default function ProfilePage() {
  const { profile: userProfile, loading: profileLoading, refreshProfile } = useProfile();
  const toast = useToast();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    date_of_birth: "",
    personal_email: "",
  });

  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const supabase = createClient();

  const [hasInitialized, setHasInitialized] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // 3D Tilt Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  useEffect(() => {
    if (userProfile && !hasInitialized) {
      setFormData({
        full_name: userProfile.full_name || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
        address: userProfile.address || "",
        date_of_birth: userProfile.date_of_birth?.split('T')[0] || "",
        personal_email: userProfile.personal_email || "",
      });
      setHasInitialized(true);
    }
  }, [userProfile, hasInitialized]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      const { first_name, last_name } = splitFullName(formData.full_name);

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          first_name,
          last_name,
          phone: formData.phone,
          address: formData.address,
          date_of_birth: formData.date_of_birth || null,
          personal_email: formData.personal_email || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error('Cập nhật thất bại', json.error || 'Vui lòng thử lại.');
        return;
      }

      // Keep auth metadata in sync (best-effort)
      await supabase.auth.updateUser({
        data: { full_name: formData.full_name, first_name, last_name }
      });

      await refreshProfile();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      toast.error('Lỗi hệ thống', 'Vui lòng thử lại sau.');
    } finally {
      setSaving(false);
    }
  };



  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="font-sans font-bold text-stone-500 uppercase tracking-widest text-[10px] animate-pulse">Đang đồng bộ dữ liệu...</p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 260, damping: 20 } },
  };

  return (
    <div className="noise-overlay min-h-screen p-4 md:p-12 lg:p-20 relative overflow-hidden bg-transparent font-sans selection:bg-primary/30 text-stone-900 dark:text-stone-100">
      <AcademicBackground />
      <FeedbackOverlay isVisible={showSuccess} />


      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[1400px] mx-auto relative z-10 space-y-20"
      >
        {/* Header Section */}
        <section className="flex flex-col lg:flex-row items-end gap-12 lg:gap-24">
          <motion.div
            variants={itemVariants}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, perspective: 1000 }}
            className="relative group shrink-0"
          >
            <div className="w-56 h-56 md:w-72 md:h-72 glass-premium rounded-2xl p-2 rotate-1 group-hover:rotate-0 transition-all duration-1000 shadow-xl relative overflow-hidden">
              <div className="w-full h-full bg-stone-950 flex items-center justify-center text-8xl font-serif font-bold text-white relative overflow-hidden rounded-xl">
                <span className="relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  {formData.full_name?.charAt(0) || "?"}
                </span>
                <div className={`absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-primary/30 to-transparent`} />
              </div>

              {/* Scanline Effect on hover */}
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <div className={`w-full h-[1px] bg-primary/50 absolute top-0 animate-scanline`} />
              </div>
            </div>
            {/* Energy Status */}
            <div className={`absolute -bottom-4 -right-4 w-12 h-12 glass-premium rounded-xl flex items-center justify-center shadow-lg border-white/10`}>
              <div className={`w-4 h-4 bg-primary rounded-full animate-pulse opacity-80`} />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex-1 space-y-8">
            <div className="flex flex-wrap items-center gap-6">
              <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight leading-tight text-stone-900 dark:text-stone-100 italic drop-shadow-sm">
                {formData.full_name || "Hồ sơ cá nhân"}
              </h1>
              <span className={cn(
                "px-6 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest h-fit shadow-md border-l-4 bg-white/80 dark:bg-stone-900",
                `border-l-primary`,
                getRoleBadgeClass(userProfile?.role)
              )}>
                {getRoleLabel(userProfile?.role)}
              </span>
            </div>
            <p className="text-stone-700 dark:text-stone-300 font-mono text-xs tracking-widest uppercase flex items-center gap-4 font-medium">
              <span className={`w-12 h-[1px] bg-stone-300 dark:bg-white/10`} />
              Mã định danh (CID): {userProfile?.id?.slice(0, 12).toUpperCase() || "UNBOUND"}
            </p>

            <div className="flex flex-wrap gap-6 pt-4">
              <div className="glass-crystal px-8 py-4 flex items-center gap-4 rounded-sharp border-b-2 border-primary group hover:bg-stone-500/5 transition-colors shadow-sm">
                <Icons.Calendar className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold uppercase text-stone-700 dark:text-stone-300 tracking-widest">
                  Gia nhập: {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString('vi-VN') : '2024'}
                </span>
              </div>
              <div className="glass-crystal px-8 py-4 flex items-center gap-4 rounded-sharp border-b-2 border-red-600 group hover:bg-stone-500/5 transition-colors shadow-sm">
                <Icons.Mail className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold uppercase text-stone-700 dark:text-stone-300 tracking-widest">
                  {userProfile?.email}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Core Actions Desk */}
          <motion.div variants={itemVariants} className="hidden lg:flex flex-col gap-6">
            <Button
              variant="secondary"
              onClick={() => setShowPasswordModal(true)}
              className="rounded-sharp h-20 w-20 p-0 glass-crystal border-none hover:glow-gold hover:scale-105 active:scale-95 transition-all duration-300"
              title="Bảo mật tài khoản"
            >
              <Icons.Lock className="w-8 h-8 text-stone-800 dark:text-stone-200" />
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleSubmit()}
              isLoading={saving}
              className={`rounded-sharp h-32 w-32 p-0 bg-primary text-white hover:bg-primary/90 shadow-primary/20 border-none group relative overflow-hidden scale-110 shadow-2xl`}
            >
              <div className="flex flex-col items-center gap-3 relative z-10">
                <Icons.Save className="w-8 h-8" />
                <span className="font-bold uppercase text-[12px] tracking-widest">Lưu thay đổi</span>
              </div>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </Button>
          </motion.div>
        </section>

        {/* Form Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-32">
          <motion.div variants={itemVariants} className="lg:col-span-8 space-y-16">
            <div className="space-y-10">
              <div className="flex items-center gap-6 text-primary">
                <div className={`w-12 h-1 bg-primary/20 rounded-full`} />
                <h2 className="text-2xl font-serif font-bold tracking-tight italic">Thông tin định danh</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <Input
                  label="Họ và Tên Đầy Đủ"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className="rounded-xl border border-stone-300 dark:border-stone-800 bg-white/50 dark:bg-white/5 focus:border-primary h-14 text-base font-bold"
                />
                <Input
                  label="Ngày Sinh Nhật"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="rounded-xl border border-stone-300 dark:border-stone-800 bg-white/50 dark:bg-white/5 focus:border-primary h-14"
                />
                <Input
                  label="Số Điện Thoại Liên Hệ"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="09xx xxx xxx"
                  className="rounded-xl border border-stone-300 dark:border-stone-800 bg-white/50 dark:bg-white/5 focus:border-primary h-14 font-bold"
                />
                <Input
                   label="Email Cá Nhân (Phụ)"
                  type="email"
                  value={formData.personal_email}
                  onChange={(e) => setFormData({ ...formData, personal_email: e.target.value })}
                  placeholder="username@gmail.com"
                  className="rounded-xl border border-stone-300 dark:border-stone-800 bg-white/50 dark:bg-white/5 focus:border-primary h-14"
                />
                <div className="md:col-span-2">
                  <Textarea
                    label="Địa chỉ thường trú"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Nhập địa chỉ căn hộ, số nhà..."
                    rows={4}
                    className="rounded-xl border border-stone-300 dark:border-stone-800 bg-white/50 dark:bg-white/5 focus:border-primary text-base"
                  />
                </div>
              </div>
            </div>

            <div className="lg:hidden flex gap-6 pt-12">
              <Button
                variant="primary"
                onClick={() => handleSubmit()}
                isLoading={saving}
                className={`flex-1 rounded-sharp h-20 uppercase font-bold tracking-widest bg-primary text-white shadow-2xl border-none`}
              >
                Lưu thay đổi
              </Button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-4 space-y-16">
            <div className="space-y-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-1.5 bg-stone-300 dark:bg-stone-700" />
                <h2 className="text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight">Hệ Thống & Bảo Mật</h2>
              </div>

              <div className="glass-premium rounded-2xl p-8 space-y-8 relative overflow-hidden border border-stone-200/50 dark:border-white/10 shadow-md">
                <div className="space-y-6">
                  <div className="group cursor-default">
                    <p className="text-[10px] font-bold text-stone-700 dark:text-stone-400 uppercase tracking-widest mb-1.5 font-sans underline decoration-primary/20 underline-offset-4">Email đăng nhập</p>
                    <p className="font-bold text-stone-900 dark:text-stone-100 truncate text-lg transition-colors duration-300">
                      {userProfile?.email}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-stone-700 dark:text-stone-400 uppercase tracking-widest mb-1.5 font-sans underline decoration-primary/20 underline-offset-4">Đơn vị trực thuộc</p>
                    <p className="font-bold text-stone-900 dark:text-stone-100 text-base">BH-EDU VIỆT NAM</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-stone-700 dark:text-stone-400 uppercase tracking-widest mb-1.5 font-sans underline decoration-primary/20 underline-offset-4">Trạng thái xác thực</p>
                    <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400 font-bold uppercase text-[11px] tracking-widest">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500/50" />
                      Hợp lệ
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-stone-200 dark:border-white/5">
                  <Button
                    variant="ghost"
                    className="p-0 h-auto text-[11px] font-bold uppercase tracking-widest text-primary hover:text-primary-hover transition-all flex items-center group bg-transparent shadow-none border-none"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    <span>Thay đổi mật mã bảo vệ</span>
                    <Icons.ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>

              {/* Cultural Advisory */}
              <div className="bg-stone-900 p-8 rounded-2xl space-y-4 border-l-4 border-primary/50 shadow-xl">
                <div className="flex items-center gap-4 text-primary">
                  <Icons.Info className="w-5 h-5 opacity-80" />
                  <p className="font-bold uppercase text-[10px] tracking-widest opacity-80">Lời nhắc hệ thống</p>
                </div>
                <p className="text-xs leading-relaxed text-stone-100 font-medium italic">
                  Thông tin cá nhân được bảo mật theo tiêu chuẩn học thuật. Vui lòng đảm bảo các liên hệ luôn chính xác để nhận thông báo quan trọng.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div >

      <PasswordSettingsModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div >
  );
}
