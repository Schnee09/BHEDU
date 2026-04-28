'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import Icons from '@/components/ui/Icons';
import { Button, Input, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import PageGuard from '@/components/PageGuard';
import { Plus } from 'lucide-react';
import {
  useCustomization,
} from '@/contexts/CustomizationContext';
import { AcademicYearModal } from '@/components/settings/AcademicYearModal';
import { useToast } from '@/hooks/useToast';
import { AcademicBackground } from '@/components/Academic/AcademicBackground';

// Lib & Types
import { 
  Setting, 
  AcademicYear, 
  GradingScale, 
  NotificationChannel, 
  NotificationEvent,
  SecuritySession,
  ActivityLog
} from '@/lib/settings/types';

// Tab Components
import { GeneralSettingsTab } from '@/components/settings/GeneralSettingsTab';
import { CustomizationTab } from '@/components/settings/CustomizationTab';
import { AcademicSettingsTab } from '@/components/settings/AcademicSettingsTab';
import { GradingSettingsTab } from '@/components/settings/GradingSettingsTab';
import { SecuritySettingsTab } from '@/components/settings/SecuritySettingsTab';
import { NotificationSettingsTab } from '@/components/settings/NotificationSettingsTab';

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
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [gradingScales, setGradingScales] = useState<GradingScale[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | undefined>(undefined);
  const toast = useToast();

  // Security data states
  const [sessionsData, setSessionsData] = useState<SecuritySession[]>([]);
  const [logsData, setLogsData] = useState<ActivityLog[]>([]);

  // Notification states
  const [channels, setChannels] = useState<NotificationChannel[]>([
    { id: 'email', label: 'Email Notifications', icon: Icons.Mail, active: true },
    { id: 'sms', label: 'SMS Notifications', icon: Icons.Phone, active: false },
    { id: 'push', label: 'Push Notifications', icon: Icons.Notifications, active: true },
  ]);

  const [events, setEvents] = useState<NotificationEvent[]>([
    { id: 'scores', label: 'Điểm số mới', description: 'Thông báo khi hệ thống cập nhật điểm cho học sinh', push: true, email: true },
    { id: 'billing', label: 'Yêu cầu thanh toán', description: 'Thông báo khi có hóa đơn học phí mới cần thanh toán', push: true, email: true },
    { id: 'schedule', label: 'Thay đổi thời khóa biểu', description: 'Thông báo khi lịch học hoặc giáo viên thay đổi', push: true, email: false },
    { id: 'system', label: 'Cập nhật hệ thống', description: 'Thông báo về các bảo trì hoặc tính năng mới', push: false, email: true },
  ]);

  const { accentColor, density, glassOpacity, blurStrength, texture, theme } = useCustomization();
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
    fetchAcademicYears();
    fetchGradingScales();
    fetchSecurityData();
  }, []);

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

  const fetchSettings = async () => {
    try {
      const response = await apiFetch('/api/admin/settings');
      const data = await response.json();
      const settingsData = Array.isArray(data) ? data : data?.data || [];
      if (Array.isArray(settingsData)) {
        setSettings(settingsData);
        const formData: Record<string, string> = {};
        settingsData.forEach((s: Setting) => {
          formData[s.setting_key] = s.setting_value || '';
        });
        setSettingsForm(formData);
      }
    } catch (error) {
      console.error('[Settings] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await apiFetch('/api/admin/academic-years');
      const data = await response.json();
      setAcademicYears(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error('[Settings] Academic Years Error:', error);
    }
  };

  const fetchGradingScales = async () => {
    try {
      const response = await apiFetch('/api/admin/grading-scales');
      const data = await response.json();
      setGradingScales(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error('[Settings] Grading Scales Error:', error);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setSettingsForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await apiFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      toast.success('Thành công', 'Cấu hình hệ thống đã được cập nhật');
      fetchSettings();
    } catch (error) {
      toast.error('Thất bại', 'Lỗi khi lưu cài đặt hệ thống');
    } finally {
      setSaving(false);
    }
  };

  // Auto-save logic for customization
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (loading) return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      localStorage.setItem('bh_customization', JSON.stringify({ accentColor, density, glassOpacity, blurStrength, texture, theme }));
      toast.success('Đã lưu', 'Tùy chỉnh giao diện đã được tự động lưu.');
    }, 1000);
    return () => clearTimeout(timer);
  }, [accentColor, density, glassOpacity, blurStrength, texture, theme]);

  const handleLogoutSession = async (sessionId: string) => {
    try {
      await apiFetch('/api/auth/sessions', {
        method: 'DELETE',
        body: JSON.stringify({ id: sessionId }),
      });
      toast.success('Đã đăng xuất', 'Phiên làm việc đã kết thúc');
      setSessionsData((prev) => prev.filter((s) => (s.id || s.device) !== sessionId));
    } catch (e) {
      toast.error('Lỗi', 'Không thể đăng xuất phiên này');
    }
  };

  const handleLogoutOthers = async () => {
    try {
      await apiFetch('/api/auth/sessions', {
        method: 'DELETE',
        body: JSON.stringify({ allOther: true }),
      });
      toast.success('Đã đăng xuất', 'Tất cả phiên khác đã kết thúc');
      setSessionsData((prev) => prev.filter((s) => s.current));
    } catch (e) {
      toast.error('Lỗi', 'Không thể đăng xuất các phiên khác');
    }
  };

  const tabs = [
    { id: 'general', label: 'Cấu hình', icon: Icons.Settings },
    { id: 'customization', label: 'Giao diện', icon: Icons.Layout },
    { id: 'academic', label: 'Năm học', icon: Icons.Calendar },
    { id: 'grading', label: 'Thang điểm', icon: Icons.Grades },
    { id: 'security', label: 'Bảo mật & Nhật ký', icon: Icons.Security },
    { id: 'notifications', label: 'Thông báo', icon: Icons.Notifications },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-[#080808]"><AcademicBackground /><div className="animate-spin h-8 w-8 border-2 border-red-600 border-t-transparent rounded-sharp" /></div>;

  return (
    <div className="min-h-screen relative overflow-hidden bg-stone-50 dark:bg-[#080808] font-['Be_Vietnam_Pro'] text-stone-900 dark:text-stone-100 p-4 md:p-12 lg:p-16">
      <AcademicBackground />
      <div className="max-w-[1600px] mx-auto relative z-10 space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-stone-200 dark:border-stone-800 pb-10">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">Bảng <span className="text-red-600">Điều khiển</span></h1>
            <p className="text-stone-500 font-mono text-xs tracking-widest uppercase">CONTROL CENTER • SYSTEM CALIBRATION</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group flex-1 md:flex-none">
              <input type="text" placeholder="Tìm cài đặt..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500/20 outline-none w-full md:w-64 transition-all" />
              <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            </div>
            <button onClick={saveSettings} disabled={saving} className="h-12 px-6 bg-stone-900 dark:bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:shadow-xl hover:shadow-amber-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2" style={{ backgroundColor: 'var(--color-primary)' }}>
              {saving ? <Icons.Progress className="w-4 h-4 animate-spin" /> : <Icons.Save className="w-4 h-4" />} Lưu thay đổi
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8">
          {/* Navigation Hub */}
          <div className="lg:col-span-3 space-y-4">
            <div className="glass-premium rounded-[32px] p-2 border border-stone-100 dark:border-white/5 shadow-sm">
              <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1 scroll-hide p-1">
                {tabs.map((tab) => (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }} className={cn('flex-shrink-0 flex items-center gap-4 px-5 py-4 rounded-[20px] transition-all duration-500 relative group overflow-hidden', activeTab === tab.id ? 'bg-amber-500/10 text-stone-950 dark:text-white font-black lg:translate-x-1' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-white/5')} style={activeTab === tab.id ? { backgroundColor: 'var(--color-primary-10)', color: 'var(--color-primary)' } : {}} >
                    <tab.icon className={cn('w-5 h-5', activeTab === tab.id ? '' : 'opacity-40')} style={activeTab === tab.id ? { color: 'var(--color-primary)' } : {}} />
                    <span className="text-[13px] tracking-tight whitespace-nowrap">{tab.label}</span>
                    {activeTab === tab.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-amber-500 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Dynamic Content Area */}
          <div className="lg:col-span-9 space-y-6">
            <Card className="rounded-[40px] overflow-hidden border-stone-100 dark:border-white/5 glass-premium min-h-[500px] shadow-xl shadow-black/5">
              <CardHeader className="py-8 px-10 border-b border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="text-xl font-black tracking-tighter text-stone-900 dark:text-white uppercase px-1">
                    {searchQuery ? `Kết quả tìm kiếm cho "${searchQuery}"` : tabs.find((t) => t.id === activeTab)?.label}
                  </h2>
                  {activeTab === 'academic' && !searchQuery && (
                    <Button onClick={() => { setSelectedYear(undefined); setIsYearModalOpen(true); }} className="rounded-2xl bg-stone-900 dark:bg-amber-600 text-white font-bold h-10 px-4 flex items-center gap-2">
                       <Plus size={16} /> Thêm năm học
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardBody className="p-6 md:p-10 space-y-8">
                {activeTab === 'general' || searchQuery ? (
                  <GeneralSettingsTab settings={settings} settingsForm={settingsForm} onSettingChange={handleSettingChange} isSearching={!!searchQuery} searchQuery={searchQuery} />
                ) : activeTab === 'customization' ? (
                  <CustomizationTab />
                ) : activeTab === 'academic' ? (
                  <AcademicSettingsTab academicYears={academicYears} onEditYear={(y) => { setSelectedYear(y); setIsYearModalOpen(true); }} />
                ) : activeTab === 'grading' ? (
                  <GradingSettingsTab gradingScales={gradingScales} />
                ) : activeTab === 'security' ? (
                  <SecuritySettingsTab sessions={sessionsData} logs={logsData} onLogoutSession={handleLogoutSession} onLogoutOthers={handleLogoutOthers} />
                ) : activeTab === 'notifications' ? (
                  <NotificationSettingsTab channels={channels} events={events} onToggleChannel={(i) => setChannels(prev => prev.map((c, idx) => idx === i ? { ...c, active: !c.active } : c))} onToggleEvent={(i, type) => setEvents(prev => prev.map((e, idx) => idx === i ? { ...e, [type]: !e[type] } : e))} />
                ) : null}
              </CardBody>
            </Card>
          </div>
        </div>

        <AcademicYearModal isOpen={isYearModalOpen} onClose={() => setIsYearModalOpen(false)} year={selectedYear} onSave={async (data) => {
          try {
            const method = selectedYear ? 'PUT' : 'POST';
            const url = selectedYear ? `/api/admin/academic-years/${selectedYear.id}` : '/api/admin/academic-years';
            const res = await apiFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (!res.ok) throw new Error('Failed to save');
            toast.success('Thành công', `Đã ${selectedYear ? 'cập nhật' : 'thêm'} năm học`);
            fetchAcademicYears();
          } catch (e) { toast.error('Lỗi', 'Không thể lưu năm học'); }
        }} />
      </div>
    </div>
  );
}
