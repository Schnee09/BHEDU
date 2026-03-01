"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { getRoleBadgeClass, getRoleLabel } from "@/lib/role-utils";
import { cn } from "@/lib/utils";
import PasswordSettingsModal from "@/components/profile/PasswordSettingsModal";
import { useToast } from "@/hooks/useToast";
import { Button, Input, Textarea } from "@/components/ui";
import { splitFullName } from "@/lib/utils/names";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Lỗi", "Vui lòng đăng nhập lại để tiếp tục");
        setSaving(false);
        return;
      }

      const { first_name, last_name } = splitFullName(formData.full_name);

      console.log('[ProfileUpdate] Attempting update:', {
        profile_id: userProfile?.id,
        auth_uid: user.id,
        payload: {
          full_name: formData.full_name,
          first_name,
          last_name,
          phone: formData.phone,
          personal_email: formData.personal_email
        }
      });

      // 1. Update Profile Table (Official Source)
      // After identity consolidation, profiles.id === auth.users.id
      const { error: profileError, data: updatedData } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          first_name: first_name,
          last_name: last_name,
          phone: formData.phone,
          address: formData.address,
          date_of_birth: formData.date_of_birth || null,
          personal_email: formData.personal_email || null,
          user_id: user.id, // Ensure user_id link is maintained
          updated_at: new Date().toISOString()
        })
        .eq("id", userProfile?.id) // exactly matching the context's primary key
        .select();


      // 2. Sync with Auth Metadata (to prevent staleness in headers/sessions)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
          first_name: first_name,
          last_name: last_name,
        }
      });

      if (profileError) {
        console.error('[ProfileUpdate] Supabase Profile Error:', profileError);
        toast.error("Lỗi cập nhật hồ sơ", profileError.message);
      } else if (!updatedData || updatedData.length === 0) {
        console.error('[ProfileUpdate] Update executed but 0 rows changed.');
        toast.error("Không thể lưu", "Hồ sơ không tồn tại hoặc bạn không có quyền chỉnh sửa.");
      } else {
        if (authError) {
          console.warn('[ProfileUpdate] Auth metadata sync failed (non-critical):', authError);
        }

        await refreshProfile(); // Refresh the global context
        toast.success("Thành công", "Hồ sơ của bạn đã được cập nhật Pro Max!");
      }
    } catch (err: any) {
      console.error('[ProfileUpdate] Crash:', err);
      toast.error("Lỗi hệ thống", err?.message || "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.");
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="font-black text-stone-400 uppercase tracking-widest text-[10px]">Đang tải hồ sơ...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Hero Profile Header */}
      <div className="relative overflow-hidden bg-white dark:bg-stone-900 rounded-[48px] border border-stone-100 dark:border-white/5 shadow-2xl shadow-stone-200/50 dark:shadow-none p-1 ">
        <div className="bg-gradient-to-br from-stone-50 to-white dark:from-stone-800/50 dark:to-stone-900 rounded-[44px] p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
          <div className="relative">
            <div className="w-36 h-36 rounded-[48px] bg-gradient-to-tr from-amber-400 via-amber-600 to-amber-700 p-1.5 shadow-2xl relative z-10">
              <div className="w-full h-full rounded-[44px] bg-stone-900 flex items-center justify-center text-4xl font-black text-white overflow-hidden relative group">
                {formData.full_name?.charAt(0) || userProfile?.email?.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="absolute -inset-4 bg-amber-500/20 blur-3xl rounded-full animate-pulse" />
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-stone-800 rounded-2xl shadow-lg flex items-center justify-center border-4 border-stone-50 dark:border-stone-900">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <h1 className="text-4xl font-black text-stone-900 dark:text-white tracking-tight">
                  {formData.full_name || "Thành viên mới"}
                </h1>
                {userProfile?.role && (
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/10",
                    getRoleBadgeClass(userProfile.role)
                  )}>
                    {getRoleLabel(userProfile.role)}
                  </span>
                )}
              </div>
              <p className="text-stone-500 dark:text-stone-400 font-bold flex items-center justify-center md:justify-start gap-2">
                <Icons.Success className="w-4 h-4 text-primary" />
                ID: <span className="font-mono text-stone-400">{userProfile?.id?.slice(0, 12).toUpperCase()}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-2">
              <div className="flex items-center gap-2.5 text-stone-400 text-xs font-bold uppercase tracking-wider bg-stone-100/50 dark:bg-white/5 px-4 py-2 rounded-2xl">
                <Icons.Calendar className="w-4 h-4 text-amber-500" />
                Gia nhập: {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : '---'}
              </div>
              <div className="flex items-center gap-2.5 text-stone-400 text-xs font-bold uppercase tracking-wider bg-stone-100/50 dark:bg-white/5 px-4 py-2 rounded-2xl truncate max-w-[250px]">
                <Icons.Mail className="w-4 h-4 text-amber-500 shrink-0" />
                {userProfile?.email}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              className="rounded-2xl h-14 px-8 border-stone-200 dark:border-white/10"
              onClick={() => setShowPasswordModal(true)}
              leftIcon={<Icons.Lock className="w-4 h-4" />}
            >
              Bảo mật
            </Button>
            <Button
              variant="gold"
              className="rounded-2xl h-14 px-8"
              onClick={handleSubmit}
              isLoading={saving}
              leftIcon={<Icons.Save className="w-4 h-4" />}
            >
              Lưu hồ sơ
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info Side - Left */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-[40px] border-stone-100 dark:border-white/5 shadow-sm overflow-hidden glass-premium h-full">
            <CardHeader className="p-8 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-xl">
                    <Icons.Users className="w-6 h-6 text-amber-500" />
                  </div>
                  Thông tin cá nhân
                </h2>
              </div>
            </CardHeader>
            <CardBody className="p-10 space-y-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Input
                    label="Họ và tên đầy đủ"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    required
                    className="h-14 rounded-2xl"
                  />
                  <Input
                    label="Ngày tháng năm sinh"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="h-14 rounded-2xl"
                  />
                  <Input
                    label="Số điện thoại liên lạc"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="09xx xxx xxx"
                    className="h-14 rounded-2xl"
                  />
                  <Input
                    label="Email cá nhân (Dự phòng)"
                    type="email"
                    value={formData.personal_email}
                    onChange={(e) => setFormData({ ...formData, personal_email: e.target.value })}
                    placeholder="email@example.com"
                    className="h-14 rounded-2xl"
                  />
                  <div className="md:col-span-2">
                    <Textarea
                      label="Địa chỉ thường trú"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Nhập địa chỉ của bạn..."
                      rows={3}
                      className="rounded-[24px]"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    variant="gold"
                    type="submit"
                    isLoading={saving}
                    className="rounded-2xl h-14 px-12"
                  >
                    Cập nhật thông tin
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        {/* Right Side - Account Details & Stats */}
        <div className="space-y-8">
          <Card className="rounded-[40px] border-stone-100 dark:border-white/5 shadow-sm overflow-hidden glass-premium">
            <CardHeader className="p-8 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30">
              <h2 className="text-lg font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-xl">
                  <Icons.Lock className="w-5 h-5 text-amber-500" />
                </div>
                Tài khoản hệ thống
              </h2>
            </CardHeader>
            <CardBody className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="p-4 rounded-3xl bg-stone-100/50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Email đăng nhập</p>
                  <p className="font-bold text-stone-900 dark:text-stone-100 truncate">{userProfile?.email}</p>
                </div>

                <div className="p-4 rounded-3xl bg-stone-100/50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Cơ sở đào tạo</p>
                  <p className="font-bold text-stone-900 dark:text-stone-100">Cơ sở chính</p>
                </div>

                <div className="p-4 rounded-3xl bg-stone-100/50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Trạng thái tài khoản</p>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-500 font-black uppercase text-[10px] tracking-widest">
                    <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    Đang hoạt động
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  variant="outline"
                  className="w-full h-14 rounded-2xl border-stone-200 dark:border-white/10 font-black uppercase tracking-widest text-[10px]"
                  onClick={() => setShowPasswordModal(true)}
                >
                  Đổi mật khẩu bảo mật
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Quick Notice Card */}
          <div className="bg-gradient-to-br from-amber-500/10 to-stone-100 dark:to-stone-800 rounded-[40px] p-8 border border-amber-500/10">
            <div className="flex items-center gap-3 mb-4">
              <Icons.Info className="w-6 h-6 text-amber-600" />
              <h3 className="font-black text-amber-900 dark:text-amber-400 uppercase tracking-tight">Lưu ý bảo mật</h3>
            </div>
            <p className="text-xs text-amber-800/70 dark:text-amber-200/50 font-medium leading-relaxed">
              Thông tin hồ sơ của bạn được mã hóa và bảo vệ theo tiêu chuẩn V2 Pro Max. Hãy đảm bảo thông tin liên lạc luôn chính xác để nhận được các thông báo quan trọng từ trung tâm.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PasswordSettingsModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
      {/* Debug Data (Temporary for Troubleshooting) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-12 p-6 rounded-3xl bg-gray-900 text-gray-300 font-mono text-xs overflow-auto">
          <h3 className="text-amber-500 font-bold mb-4 uppercase tracking-widest text-sm">Debug Information (Dev Only)</h3>
          <div className="space-y-4">
            <div>
              <p className="text-gray-500 mb-1">Row IDs:</p>
              <p>Profile ID: <span className="text-white">{userProfile?.id}</span></p>
              <p>User ID: <span className="text-white">{userProfile?.user_id}</span></p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Raw Profiles DB Data:</p>
              <pre className="mt-1 bg-black/30 p-2 rounded">
                {JSON.stringify(userProfile, null, 2)}
              </pre>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-[10px] border-gray-700 hover:bg-gray-800"
                onClick={() => refreshProfile()}
              >
                Force Context Refresh
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
