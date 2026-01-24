"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { getRoleBadgeClass, getRoleLabel } from "@/lib/role-utils";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { profile: userProfile, loading: profileLoading } = useProfile();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    date_of_birth: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
        address: userProfile.address || "",
        date_of_birth: userProfile.date_of_birth || "",
      });
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage("Chưa xác thực");
        setSaving(false);
        return;
      }

      const { error } = await (supabase as any)
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          date_of_birth: formData.date_of_birth || null,
        })
        .eq("user_id", user.id);

      if (error) {
        setMessage(`Lỗi: ${error.message}`);
      } else {
        setMessage("Hồ sơ đã được cập nhật thành công!");
      }
    } catch (err) {
      setMessage("Không thể cập nhật hồ sơ");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="font-black text-stone-400 uppercase tracking-widest text-[10px]">Đang tải hồ sơ Pro Max</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in relative">
      {/* Background Bloomb */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      
      {/* Visual Identity Header */}
      <div className="flex flex-col md:flex-row items-center gap-8 bg-white/40 dark:bg-white/5 backdrop-blur-xl p-8 rounded-[48px] border border-stone-100 dark:border-white/5 shadow-sm">
         <div className="relative group">
            <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-white text-4xl font-black shadow-2xl relative z-10 overflow-hidden">
               {formData.full_name?.charAt(0) || userProfile?.email?.charAt(0).toUpperCase()}
               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center cursor-pointer">
                  <Icons.Camera className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100" />
               </div>
            </div>
            <div className="absolute -inset-4 bg-amber-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
         </div>
         
         <div className="text-center md:text-left flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
               <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight">{formData.full_name || "Thành viên mới"}</h1>
               {userProfile?.role && (
                 <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/10", getRoleBadgeClass(userProfile.role))}>
                   {getRoleLabel(userProfile.role)}
                 </span>
               )}
            </div>
            <p className="text-stone-500 dark:text-stone-400 font-medium">Bùi Hoàng Education &bull; ID: {userProfile?.id?.slice(0, 8)}</p>
            <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
               <div className="flex items-center gap-2 text-stone-400 text-xs">
                  <Icons.Calendar className="w-4 h-4" /> Tham gia: {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : '---'}
               </div>
               <div className="flex items-center gap-2 text-green-500 text-xs font-bold">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Đang hoạt động
               </div>
            </div>
         </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-2 space-y-6">
           <Card className="rounded-[40px] overflow-hidden border-stone-100 dark:border-white/5 glass-premium shadow-sm">
             <CardHeader className="py-6 px-10 border-b border-stone-100 dark:border-white/5 bg-gradient-to-br from-stone-50 to-transparent dark:from-white/2">
                <h2 className="text-lg font-black tracking-tight uppercase text-stone-400 flex items-center gap-3">
                   <Icons.Users className="w-5 h-5 text-amber-500" /> Thông tin cơ bản
                </h2>
             </CardHeader>
             <CardBody className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2 group">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1 transition-colors group-focus-within:text-amber-500">Họ và tên</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full px-5 py-4 bg-stone-50 dark:bg-white/5 border border-transparent focus:border-amber-500/30 rounded-2xl focus:ring-4 focus:ring-amber-500/10 transition-all font-bold text-stone-800 dark:text-stone-200 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2 group">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Ngày sinh</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        className="w-full px-5 py-4 bg-stone-50 dark:bg-white/5 border border-transparent focus:border-amber-500/30 rounded-2xl focus:ring-4 focus:ring-amber-500/10 transition-all font-bold text-stone-800 dark:text-stone-200 outline-none"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2 group">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1 transition-colors group-focus-within:text-amber-500">Địa chỉ cư trú</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="w-full px-5 py-4 bg-stone-50 dark:bg-white/5 border border-transparent focus:border-amber-500/30 rounded-2xl focus:ring-4 focus:ring-amber-500/10 transition-all font-bold text-stone-800 dark:text-stone-200 outline-none resize-none"
                      placeholder="Nhập địa chỉ của bạn..."
                    />
                  </div>
                </div>
             </CardBody>
           </Card>

           {message && (
             <div className={cn(
               "p-6 rounded-3xl flex items-center gap-4 animate-fade-in-up shadow-xl shadow-stone-900/5",
               message.includes("Lỗi") ? "bg-red-500/10 text-red-600 border border-red-500/20" : "bg-green-500/10 text-green-600 border border-green-500/20"
             )}>
               <div className={cn("p-2 rounded-xl", message.includes("Lỗi") ? "bg-red-500/20" : "bg-green-500/20")}>
                 {message.includes("Lỗi") ? <Icons.Error className="w-5 h-5" /> : <Icons.Success className="w-5 h-5" />}
               </div>
               <p className="font-bold text-sm tracking-tight">{message}</p>
             </div>
           )}
        </div>

        {/* Right Column - Contact & Actions */}
        <div className="space-y-6">
           <Card className="rounded-[40px] overflow-hidden border-stone-100 dark:border-white/5 glass-premium shadow-sm">
             <CardHeader className="py-6 px-10 border-b border-stone-100 dark:border-white/5 bg-gradient-to-br from-stone-50 to-transparent dark:from-white/2">
                <h2 className="text-lg font-black tracking-tight uppercase text-stone-400 flex items-center gap-3">
                   <Icons.Mail className="w-5 h-5 text-amber-500" /> Liên hệ
                </h2>
             </CardHeader>
             <CardBody className="p-8 space-y-6">
                <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Email (Cố định)</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-5 py-4 bg-stone-100 dark:bg-white/2 text-stone-400 rounded-2xl font-bold cursor-not-allowed border border-transparent"
                    />
                    <Icons.Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1 transition-colors group-focus-within:text-amber-500">Số điện thoại</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-5 py-4 bg-stone-50 dark:bg-white/5 border border-transparent focus:border-amber-500/30 rounded-2xl focus:ring-4 focus:ring-amber-500/10 transition-all font-bold text-stone-800 dark:text-stone-200 outline-none"
                    placeholder="09xx.xxx.xxx"
                  />
                </div>
             </CardBody>
           </Card>

           <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="h-16 rounded-[28px] border border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-400 font-black uppercase tracking-widest text-[10px] hover:bg-stone-50 dark:hover:bg-white/5 transition-all active:scale-95 press-effect"
              >
                Trở lại
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-16 rounded-[28px] bg-stone-900 dark:bg-amber-600 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all active:scale-95 disabled:opacity-50 press-effect flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Icons.Save className="w-4 h-4" />
                    Cập nhật
                  </>
                )}
              </button>
           </div>
        </div>
      </form>
    </div>
  );
}
