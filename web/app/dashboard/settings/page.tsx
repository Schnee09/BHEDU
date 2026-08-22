'use client';

import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import PageGuard from '@/components/PageGuard';
import {
  Settings,
  Shield,
  Bell,
  Database,
  Save,
  Search,
  RefreshCw,
  Sliders,
  Calendar,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { AcademicBackground } from '@/components/Academic/AcademicBackground';

// Lib & Types
import {
  Setting,
  NotificationChannel,
  NotificationEvent,
  NotificationTemplate,
  SecuritySession,
  ActivityLog,
  AcademicYear,
} from '@/lib/settings/types';

// Tab Components
import { GeneralSettingsTab } from '@/components/settings/GeneralSettingsTab';
import { AcademicSettingsTab } from '@/components/settings/AcademicSettingsTab';
import { AcademicYearModal } from '@/components/settings/AcademicYearModal';
import { SecuritySettingsTab } from '@/components/settings/SecuritySettingsTab';
import { NotificationSettingsTab } from '@/components/settings/NotificationSettingsTab';
import { ResourceSettingsTab } from '@/components/settings/ResourceSettingsTab';

export default function SettingsPage() {
  return (
    <PageGuard permissions="system.settings">
      <SettingsPageContent />
    </PageGuard>
  );
}

function SettingsPageContent() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

  // Academic years state
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<AcademicYear | null>(null);
  const [showAcademicYearModal, setShowAcademicYearModal] = useState(false);

  // Security data states
  const [sessionsData, setSessionsData] = useState<SecuritySession[]>([]);
  const [logsData, setLogsData] = useState<ActivityLog[]>([]);

  // Notification states
  const [channels, setChannels] = useState<NotificationChannel[]>([
    { id: 'email', label: 'Email', description: 'Gửi qua máy chủ SMTP / Resend', active: true },
    { id: 'sms', label: 'SMS Brandname', description: 'Gửi tin nhắn SMS tới số phụ huynh/học sinh', active: false },
    { id: 'push', label: 'Web / App Push', description: 'Thông báo đẩy trực tiếp trên trình duyệt & di động', active: true },
    { id: 'zalo', label: 'Zalo ZNS', description: 'Gửi tin chăm sóc khách hàng qua Zalo OA', active: false },
  ]);

  const [events, setEvents] = useState<NotificationEvent[]>([
    { id: 'scores', label: 'Điểm số mới', description: 'Thông báo khi hệ thống cập nhật điểm cho học sinh', category: 'academic', push: true, email: true, sms: false, zalo: true },
    { id: 'billing', label: 'Yêu cầu thanh toán', description: 'Thông báo khi có hóa đơn học phí mới cần thanh toán', category: 'finance', push: true, email: true, sms: true, zalo: true },
    { id: 'attendance', label: 'Điểm danh / Vắng học', description: 'Báo cáo khi học sinh vắng hoặc đến muộn trong buổi học', category: 'academic', push: true, email: false, sms: true, zalo: true },
    { id: 'schedule', label: 'Thay đổi thời khóa biểu', description: 'Thông báo khi lịch học hoặc giáo viên thay đổi', category: 'timetable', push: true, email: true, sms: false, zalo: false },
    { id: 'system', label: 'Cập nhật hệ thống', description: 'Thông báo về các bảo trì hoặc tính năng mới', category: 'system', push: true, email: true, sms: false, zalo: false },
  ]);

  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>([]);
  const [savingNotificationConfig, setSavingNotificationConfig] = useState(false);

  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.allSettled([
      fetchSettings(),
      fetchAcademicYears(),
      fetchSecurityData(),
      fetchNotificationSettings(),
    ]);
    setLoading(false);
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await apiFetch('/api/admin/academic-years');
      if (response.ok) {
        const json = await response.json();
        setAcademicYears(json.data || []);
      }
    } catch (e) {
      console.error('[Settings] Academic years fetch error:', e);
    }
  };

  const handleSaveAcademicYear = async (yearData: Partial<AcademicYear>) => {
    try {
      if (selectedAcademicYear?.id) {
        const res = await apiFetch(`/api/admin/academic-years/${selectedAcademicYear.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(yearData),
        });
        if (res.ok) {
          toast.success('Thành công', 'Cập nhật năm học thành công');
          setShowAcademicYearModal(false);
          fetchAcademicYears();
        } else {
          toast.error('Lỗi', 'Không thể cập nhật năm học');
        }
      } else {
        const res = await apiFetch('/api/admin/academic-years', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(yearData),
        });
        if (res.ok) {
          toast.success('Thành công', 'Tạo năm học mới thành công');
          setShowAcademicYearModal(false);
          fetchAcademicYears();
        } else {
          toast.error('Lỗi', 'Không thể tạo năm học');
        }
      }
    } catch (e) {
      console.error('[Settings] Academic year save error:', e);
      toast.error('Lỗi', 'Lỗi khi lưu năm học');
    }
  };

  const handleSetCurrentAcademicYear = async (yearId: string) => {
    try {
      const res = await apiFetch(`/api/admin/academic-years/${yearId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_current: true }),
      });
      if (res.ok) {
        toast.success('Thành công', 'Đã đặt làm năm học hiện tại');
        fetchAcademicYears();
      }
    } catch (e) {
      console.error('[Settings] Set current year error:', e);
      toast.error('Lỗi', 'Không thể thiết lập năm học hiện tại');
    }
  };

  const fetchSecurityData = async () => {
    try {
      const response = await apiFetch('/api/auth/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessionsData(data.data?.sessions || []);
        setLogsData(data.data?.logs || []);
      }
    } catch (error) {
      console.error('[Settings] Security Data Error:', error);
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      const response = await apiFetch('/api/admin/notifications/settings');
      if (response.ok) {
        const json = await response.json();
        if (json.data) {
          if (json.data.channels) setChannels(json.data.channels);
          if (json.data.events) setEvents(json.data.events);
          if (json.data.templates) setNotificationTemplates(json.data.templates);
        }
      }
    } catch (e) {
      console.error('[Settings] Notification settings fetch error:', e);
    }
  };

  const handleSaveNotificationConfig = async () => {
    setSavingNotificationConfig(true);
    try {
      const res = await apiFetch('/api/admin/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channels,
          events,
          templates: notificationTemplates,
        }),
      });
      if (!res.ok) throw new Error('Failed to save notification settings');
      toast.success('Thành công', 'Cấu hình kênh & mẫu thông báo đã được lưu.');
    } catch (e) {
      toast.error('Lỗi', 'Không thể lưu cấu hình thông báo');
    } finally {
      setSavingNotificationConfig(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await apiFetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        const settingsList = data.data || [];
        setSettings(settingsList);

        const formValues: Record<string, string> = {};
        settingsList.forEach((s: Setting) => {
          formValues[s.key] = s.value;
        });
        setSettingsForm(formValues);
      }
    } catch (error) {
      console.error('[Settings] Fetch Error:', error);
      toast.error('Lỗi', 'Không thể tải cấu hình');
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setSettingsForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const promises = Object.entries(settingsForm).map(async ([key, value]) => {
        const original = settings.find((s) => s.key === key);
        if (!original || original.value !== value) {
          return apiFetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value }),
          });
        }
        return null;
      });

      await Promise.all(promises.filter(Boolean));
      toast.success('Thành công', 'Đã lưu cấu hình trung tâm');
      await fetchSettings();
    } catch (error) {
      console.error('[Settings] Save Error:', error);
      toast.error('Lỗi', 'Không thể lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    try {
      const res = await apiFetch(`/api/auth/sessions?sessionId=${sessionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Thành công', 'Đã đăng xuất phiên thành công');
        fetchSecurityData();
      }
    } catch (e) {
      toast.error('Lỗi', 'Không thể hủy phiên đăng nhập');
    }
  };

  const handleLogoutOthers = async () => {
    try {
      const res = await apiFetch('/api/auth/sessions?allExceptCurrent=true', {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Thành công', 'Đã đăng xuất toàn bộ các thiết bị khác');
        fetchSecurityData();
      }
    } catch (e) {
      toast.error('Lỗi', 'Không thể đăng xuất các thiết bị khác');
    }
  };

  const tabs = [
    { id: 'general', label: 'Hồ sơ Trung tâm', icon: Settings, count: null },
    { id: 'academic', label: 'Năm học & Học vụ', icon: Calendar, count: academicYears.length || null },
    { id: 'notifications', label: 'Thông báo & Mẫu tin', icon: Bell, count: channels.filter((c) => c.active).length },
    { id: 'security', label: 'Bảo mật & Nhật ký', icon: Shield, count: null },
    { id: 'resources', label: 'Cơ sở & Tài nguyên', icon: Database, count: null },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-[#080808] gap-4">
        <AcademicBackground />
        <div className="animate-spin h-10 w-10 border-3 border-amber-500 border-t-transparent rounded-full" />
        <p className="text-xs font-mono text-stone-500 uppercase tracking-widest">
          Đang tải cấu hình trung tâm...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-stone-50 dark:bg-[#080808] font-['Be_Vietnam_Pro'] text-stone-900 dark:text-stone-100 p-4 md:p-10 lg:p-12">
      <AcademicBackground />
      <div className="max-w-[1600px] mx-auto relative z-10 space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-200 dark:border-stone-800 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              <Sliders className="w-4 h-4" />
              <span>HỆ THỐNG QUẢN TRỊ • SETTINGS CENTER</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-stone-950 dark:text-white">
              Cài đặt <span className="text-amber-500">Hệ thống</span>
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              Quản lý toàn bộ thông tin trung tâm, niên khóa học vụ, kênh thông báo và bảo mật
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative group flex-1 md:flex-none">
              <input
                type="text"
                placeholder="Tìm kiếm cài đặt nhanh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20 outline-none w-full md:w-64 transition-all shadow-sm"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            </div>

            {activeTab === 'general' && (
              <button
                onClick={saveSettings}
                disabled={saving}
                className="h-11 px-6 bg-stone-900 dark:bg-amber-600 hover:bg-stone-800 dark:hover:bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-lg hover:shadow-amber-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2 shrink-0 cursor-pointer"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Lưu cấu hình
              </button>
            )}
          </div>
        </div>

        {/* Master-Detail Layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 items-start">
          {/* Navigation Sidebar (4 Cols on LG, 3 Cols on XL) */}
          <div className="lg:col-span-4 xl:col-span-3 w-full space-y-4 sticky top-6">
            <div className="p-3 rounded-[32px] bg-white dark:bg-stone-900/80 border border-stone-200/80 dark:border-white/5 shadow-sm space-y-1.5">
              <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 scroll-hide p-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setSearchQuery('');
                      }}
                      className={cn(
                        'flex-shrink-0 flex items-center justify-between px-4 py-3.5 rounded-[22px] transition-all duration-300 relative group text-left cursor-pointer',
                        isActive
                          ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-black shadow-sm'
                          : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-white/5 font-bold'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div
                          className={cn(
                            'p-2 rounded-xl transition-colors shrink-0',
                            isActive
                              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                              : 'bg-stone-100 dark:bg-white/5 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-200'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                          {tab.label}
                        </span>
                      </div>

                      {tab.count !== null && (
                        <span
                          className={cn(
                            'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0',
                            isActive
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                              : 'bg-stone-100 dark:bg-white/5 text-stone-400'
                          )}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Dynamic Content Area */}
          <div className="lg:col-span-8 xl:col-span-9 w-full space-y-6">
            {activeTab === 'general' || searchQuery ? (
              <GeneralSettingsTab
                settings={settings}
                settingsForm={settingsForm}
                onSettingChange={handleSettingChange}
                isSearching={!!searchQuery}
                searchQuery={searchQuery}
              />
            ) : activeTab === 'academic' ? (
              <AcademicSettingsTab
                academicYears={academicYears}
                onEditYear={(year) => {
                  setSelectedAcademicYear(year);
                  setShowAcademicYearModal(true);
                }}
                onCreateYear={() => {
                  setSelectedAcademicYear(null);
                  setShowAcademicYearModal(true);
                }}
                onSetCurrentYear={handleSetCurrentAcademicYear}
              />
            ) : activeTab === 'notifications' ? (
              <NotificationSettingsTab
                channels={channels}
                events={events}
                templates={notificationTemplates}
                onToggleChannel={(i) =>
                  setChannels((prev) =>
                    prev.map((c, idx) => (idx === i ? { ...c, active: !c.active } : c))
                  )
                }
                onToggleEvent={(i, type) =>
                  setEvents((prev) =>
                    prev.map((e, idx) => (idx === i ? { ...e, [type]: !e[type] } : e))
                  )
                }
                onSaveTemplates={(newTemplates) => setNotificationTemplates(newTemplates)}
                onSaveNotificationConfig={handleSaveNotificationConfig}
                savingConfig={savingNotificationConfig}
              />
            ) : activeTab === 'security' ? (
              <SecuritySettingsTab
                sessions={sessionsData}
                logs={logsData}
                onLogoutSession={handleLogoutSession}
                onLogoutOthers={handleLogoutOthers}
              />
            ) : activeTab === 'resources' ? (
              <ResourceSettingsTab />
            ) : null}
          </div>
        </div>
      </div>

      {/* Academic Year Create/Edit Modal */}
      <AcademicYearModal
        isOpen={showAcademicYearModal}
        onClose={() => setShowAcademicYearModal(false)}
        year={selectedAcademicYear || undefined}
        onSave={handleSaveAcademicYear}
      />
    </div>
  );
}
