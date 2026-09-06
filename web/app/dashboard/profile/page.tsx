'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/useToast';
import { splitFullName } from '@/lib/utils/names';
import { AnimatePresence } from 'framer-motion';
import { User, Bell, Shield, Activity } from 'lucide-react';

import ProfileSidebar from '@/components/profile/ProfileSidebar';
import ProfileFormCard from '@/components/profile/ProfileFormCard';
import ProfileNotificationsTab from '@/components/profile/ProfileNotificationsTab';
import ProfileSecurityTab from '@/components/profile/ProfileSecurityTab';

type TabId = 'profile' | 'notifications' | 'security';

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  created_at: string;
}

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Thông tin cá nhân', icon: <User className="w-3.5 h-3.5" /> },
  { id: 'notifications', label: 'Thông báo', icon: <Bell className="w-3.5 h-3.5" /> },
  { id: 'security', label: 'Bảo mật & Thiết bị', icon: <Shield className="w-3.5 h-3.5" /> },
];

const getFieldLabel = (key: string) => {
  const map: Record<string, string> = {
    full_name: 'họ và tên',
    phone: 'số điện thoại',
    address: 'địa chỉ',
    date_of_birth: 'ngày sinh',
    personal_email: 'email cá nhân',
  };
  return map[key] ?? 'thông tin';
};

const getActionMeta = (action: string) => {
  const map: Record<string, { label: string; dot: string }> = {
    'auth.login': { label: 'Đăng nhập hệ thống', dot: 'bg-sky-500 shadow-sky-500/50' },
    'auth.logout': { label: 'Đăng xuất', dot: 'bg-stone-400' },
    'user.password_reset': { label: 'Đổi mật khẩu', dot: 'bg-amber-500 shadow-amber-500/50' },
    'user.updated': { label: 'Cập nhật hồ sơ', dot: 'bg-emerald-500 shadow-emerald-500/50' },
    'attendance.marked': { label: 'Điểm danh ca học', dot: 'bg-emerald-500 shadow-emerald-500/50' },
    'attendance.updated': { label: 'Chỉnh sửa điểm danh', dot: 'bg-amber-500 shadow-amber-500/50' },
    'grade.created': { label: 'Nhập điểm số', dot: 'bg-emerald-500 shadow-emerald-500/50' },
    'grade.updated': { label: 'Chỉnh sửa điểm', dot: 'bg-amber-500 shadow-amber-500/50' },
    'payment.created': { label: 'Thanh toán học phí', dot: 'bg-green-500 shadow-green-500/50' },
    'student.enrolled': { label: 'Ghi danh lớp học', dot: 'bg-indigo-500 shadow-indigo-500/50' },
    'class.created': { label: 'Tạo lớp học mới', dot: 'bg-purple-500 shadow-purple-500/50' },
    'assignment.created': { label: 'Tạo bài tập mới', dot: 'bg-blue-500 shadow-blue-500/50' },
    'assignment.submitted': { label: 'Nộp bài tập', dot: 'bg-teal-500 shadow-teal-500/50' },
  };
  return map[action] || { label: action.replace(/[._]/g, ' '), dot: 'bg-amber-500' };
};

export default function ProfilePage() {
  const { profile: userProfile, loading: profileLoading, refreshProfile } = useProfile();
  const toast = useToast();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    personal_email: '',
  });
  const [initialized, setInitialized] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    if (userProfile && !initialized) {
      setFormData({
        full_name: userProfile.full_name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        date_of_birth: userProfile.date_of_birth?.split('T')[0] || '',
        personal_email: userProfile.personal_email || '',
      });
      setInitialized(true);
    }
  }, [userProfile, initialized]);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/profile/activity', { headers });
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
      }
    } catch {
      // non-critical
    } finally {
      setLogsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleSaveField = async (
    fieldKey: keyof typeof formData,
    newValue: string
  ): Promise<boolean> => {
    try {
      const currentName = fieldKey === 'full_name' ? newValue : formData.full_name;
      const { first_name, last_name } = splitFullName(currentName);
      const payload = {
        full_name: currentName,
        first_name,
        last_name,
        phone: fieldKey === 'phone' ? newValue : formData.phone,
        address: fieldKey === 'address' ? newValue : formData.address,
        date_of_birth:
          fieldKey === 'date_of_birth' ? newValue || null : formData.date_of_birth || null,
        personal_email: fieldKey === 'personal_email' ? newValue : formData.personal_email,
      };
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        toast.error('Không thể lưu', (await res.json()).error ?? 'Thử lại sau.');
        return false;
      }
      if (fieldKey === 'full_name') {
        await supabase.auth.updateUser({ data: { full_name: newValue, first_name, last_name } });
      }
      setFormData((prev) => ({ ...prev, [fieldKey]: newValue }));
      await refreshProfile();
      await loadLogs();
      toast.success('Đã lưu', `Cập nhật thành công ${getFieldLabel(fieldKey)}.`);

      return true;
    } catch {
      toast.error('Lỗi kết nối', 'Không thể lưu thông tin.');
      return false;
    }
  };

  if (profileLoading && !userProfile) {
    return null;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white dark:bg-stone-950 w-full max-w-full overflow-x-hidden">
      {/* ── Left Sidebar ── */}
      <ProfileSidebar profile={userProfile} refreshProfile={refreshProfile} />

      {/* ── Right Content ── */}
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 px-4 sm:px-8 flex items-center gap-1 overflow-x-auto scrollbar-none w-full">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-3.5 sm:py-4 text-xs font-semibold border-b-2 transition-all -mb-px shrink-0 cursor-pointer ${
                  active
                    ? 'border-stone-900 dark:border-stone-100 text-stone-900 dark:text-stone-100'
                    : 'border-transparent text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </header>

        {/* Main grid */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-0 w-full max-w-full overflow-x-hidden">
          {/* Tab content */}
          <main className="p-4 sm:p-8 border-b xl:border-b-0 xl:border-r border-stone-100 dark:border-stone-800 w-full max-w-full min-w-0">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <ProfileFormCard key="profile" formData={formData} onSaveField={handleSaveField} />
              )}
              {activeTab === 'notifications' && <ProfileNotificationsTab key="notifications" />}
              {activeTab === 'security' && <ProfileSecurityTab key="security" />}
            </AnimatePresence>
          </main>

          {/* Activity sidebar */}
          <aside className="p-4 sm:p-6 bg-stone-50 dark:bg-stone-950 w-full max-w-full min-w-0">
            <div className="flex items-center gap-2 mb-5">
              <Activity className="w-3.5 h-3.5 text-stone-400" />
              <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Hoạt động gần đây
              </h3>
            </div>

            {logsLoading ? (
              <div className="flex items-center gap-2 py-4">
                <div className="w-3.5 h-3.5 border-2 border-stone-200 border-t-stone-500 rounded-full animate-spin" />
                <span className="text-xs text-stone-400">Đang tải...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-stone-400 dark:text-stone-500">Chưa có hoạt động nào</p>
                <p className="text-[10px] text-stone-300 dark:text-stone-600 mt-1">
                  Các thao tác thay đổi dữ liệu sẽ xuất hiện tại đây
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log) => {
                  const meta = getActionMeta(log.action);
                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 py-2.5 border-b border-stone-100 dark:border-stone-800/50 last:border-0"
                    >
                      <div className={`w-2 h-2 rounded-full ${meta.dot} mt-1.5 flex-shrink-0`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-stone-700 dark:text-stone-300 capitalize truncate">
                          {meta.label}
                        </p>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 font-mono mt-0.5">
                          {new Date(log.created_at).toLocaleString('vi-VN', {
                            month: 'short',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
