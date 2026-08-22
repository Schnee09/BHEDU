'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!userProfile?.id) return;
    const load = async () => {
      setLogsLoading(true);
      try {
        const { data } = await supabase
          .from('audit_logs')
          .select('id, action, resource_type, created_at')
          .eq('actor_id', userProfile.id)
          .order('created_at', { ascending: false })
          .limit(8);
        if (data) setLogs(data);
      } finally {
        setLogsLoading(false);
      }
    };
    load();
  }, [userProfile?.id]);

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
      toast.success('Đã lưu', `Cập nhật thành công ${getFieldLabel(fieldKey)}.`);

      // refresh logs
      const { data: fresh } = await supabase
        .from('audit_logs')
        .select('id, action, resource_type, created_at')
        .eq('actor_id', userProfile?.id)
        .order('created_at', { ascending: false })
        .limit(8);
      if (fresh) setLogs(fresh);

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
    <div className="flex min-h-screen bg-white dark:bg-stone-950">
      {/* ── Left Sidebar ── */}
      <ProfileSidebar
        profile={userProfile}
        onPasswordChangeClick={() => setActiveTab('security')}
        refreshProfile={refreshProfile}
      />

      {/* ── Right Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 px-8 flex items-center gap-1">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 text-xs font-semibold border-b-2 transition-all -mb-px ${
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
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-0">
          {/* Tab content */}
          <main className="p-8 border-r border-stone-100 dark:border-stone-800">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <ProfileFormCard key="profile" formData={formData} onSaveField={handleSaveField} />
              )}
              {activeTab === 'notifications' && <ProfileNotificationsTab key="notifications" />}
              {activeTab === 'security' && <ProfileSecurityTab key="security" />}
            </AnimatePresence>
          </main>

          {/* Activity sidebar */}
          <aside className="p-6 bg-stone-50 dark:bg-stone-950">
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
                  Các thao tác sẽ xuất hiện tại đây
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 py-2.5 border-b border-stone-100 dark:border-stone-800/50 last:border-0"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-600 mt-1.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-stone-700 dark:text-stone-300 capitalize truncate">
                        {log.action.replace(/_/g, ' ')}
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
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
