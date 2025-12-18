"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";

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
      <div className="p-6">
        <p>Đang tải hồ sơ...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Icons.Users className="w-8 h-8 text-stone-600" />
            Hồ sơ của tôi
          </h1>
          <p className="text-stone-500 mt-1">Quản lý thông tin cá nhân của bạn</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-stone-900">Thông tin cá nhân</h2>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Họ và tên
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icons.Users className="h-5 w-5 text-stone-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full pl-10 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icons.Mail className="h-5 w-5 text-stone-400" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full pl-10 px-3 py-2 border border-stone-200 bg-stone-50 text-stone-500 rounded-lg cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-xs text-stone-500">Không thể thay đổi email</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Số điện thoại
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icons.Phone className="h-5 w-5 text-stone-400" />
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Ngày sinh
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icons.Calendar className="h-5 w-5 text-stone-400" />
                  </div>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full pl-10 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Địa chỉ
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 pt-2.5 pointer-events-none">
                    <Icons.Location className="h-5 w-5 text-stone-400" />
                  </div>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="w-full pl-10 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-lg flex items-center gap-2 ${
                message.includes("Error") || message.includes("Failed") 
                  ? "bg-red-50 text-red-700 border border-red-200" 
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}>
                {message.includes("Error") || message.includes("Failed") ? (
                  <Icons.Error className="w-5 h-5" />
                ) : (
                  <Icons.Success className="w-5 h-5" />
                )}
                {message}
              </div>
            )}
          </CardBody>
          <CardFooter className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Icons.Save className="w-4 h-4" />
                  Lưu thay đổi
                </>
              )}
            </button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

