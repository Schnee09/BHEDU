'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import Icons from '@/components/ui/Icons';
import { Button, Input, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import PageGuard from '@/components/PageGuard';
import Menu from 'lucide-react/dist/esm/icons/menu';
import { Search, Check, Palette, Droplets, Wind, Sun, Moon, Plus } from 'lucide-react';
import {
  useCustomization,
  AccentColor,
  UIDensity,
  ThemeMode,
} from '@/contexts/CustomizationContext';
import { AcademicYearModal } from '@/components/settings/AcademicYearModal';
import { useToast } from '@/hooks/useToast';

import { AcademicBackground } from '@/components/Academic/AcademicBackground';

// Types
interface Setting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  category: string;
  description: string | null;
  setting_type?: string;
}

interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_current?: boolean;
}

interface GradingScale {
  id: string;
  name: string;
  min_score?: number;
  max_score?: number;
  grade_letter?: string;
  is_default?: boolean;
  description?: string;
  scale?: Array<{
    letter: string;
    min: number;
    max: number;
  }>;
}

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

  const {
    accentColor,
    setAccentColor,
    density,
    setDensity,
    glassOpacity,
    setGlassOpacity,
    blurStrength,
    setBlurStrength,
    texture,
    setTexture,
    theme,
    setTheme,
  } = useCustomization();

  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
    fetchAcademicYears();
    fetchGradingScales();
  }, []);

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
      fetchSettings(); // Refresh from server
    } catch (error) {
      toast.error('Thất bại', 'Lỗi khi lưu cài đặt hệ thống');
    } finally {
      setSaving(false);
    }
  };

  // Auto-save logic for customization
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      // Small visual feedback that changes are saved
      console.log('Customization auto-saved');
    }, 1000);
    return () => clearTimeout(timer);
  }, [accentColor, density, glassOpacity, blurStrength, texture, theme]);

  const handleEditYear = (year: AcademicYear) => {
    setSelectedYear(year);
    setIsYearModalOpen(true);
  };

  const handleAddYear = () => {
    setSelectedYear(undefined);
    setIsYearModalOpen(true);
  };

  const handleSaveYear = async (yearData: Partial<AcademicYear>) => {
    try {
      const method = selectedYear ? 'PUT' : 'POST';
      const url = selectedYear
        ? `/api/admin/academic-years/${selectedYear.id}`
        : '/api/admin/academic-years';

      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(yearData),
      });

      if (!response.ok) throw new Error('Failed to save academic year');

      toast.success(
        'Thành công',
        `Đã ${selectedYear ? 'cập nhật' : 'thêm'} năm học ${yearData.name}`
      );
      fetchAcademicYears();
    } catch (error) {
      toast.error('Lỗi', 'Không thể lưu năm học');
    }
  };

  const tabs = [
    { id: 'general', label: 'Cấu hình', icon: Icons.Settings, color: 'text-blue-500' },
    { id: 'customization', label: 'Giao diện', icon: Icons.Layout, color: 'text-amber-500' },
    { id: 'academic', label: 'Năm học', icon: Icons.Calendar, color: 'text-emerald-500' },
    { id: 'grading', label: 'Thang điểm', icon: Icons.Grades, color: 'text-purple-500' },
    { id: 'security', label: 'Bảo mật & Nhật ký', icon: Icons.Security, color: 'text-rose-500' },
    {
      id: 'notifications',
      label: 'Thông báo',
      icon: Icons.Notifications,
      color: 'text-indigo-500',
    },
  ];

  const isSearching = searchQuery.length > 0;

  const filteredSettings = settings
    .filter((s) => (isSearching ? true : s.category === activeTab))
    .filter(
      (s) =>
        (s.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        s.setting_key.toLowerCase().includes(searchQuery.toLowerCase())
    );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-[#080808]">
        <AcademicBackground />
        <div className="animate-spin h-8 w-8 border-2 border-red-600 border-t-transparent rounded-sharp" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-stone-50 dark:bg-[#080808] font-['Be_Vietnam_Pro'] selection:bg-red-600/30 text-stone-900 dark:text-stone-100 p-4 md:p-12 lg:p-16">
      <AcademicBackground />

      <div className="max-w-[1600px] mx-auto relative z-10 space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-stone-200 dark:border-stone-800 pb-10">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Bảng <span className="text-red-600">Điều khiển</span>
            </h1>
            <p className="text-stone-500 font-mono text-xs tracking-widest uppercase flex items-center gap-2">
              CONTROL CENTER • SYSTEM CALIBRATION
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group flex-1 md:flex-none">
              <input
                type="text"
                placeholder="Tìm cài đặt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500/20 outline-none w-full md:w-64 transition-all"
              />
              <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            </div>

            <button
              onClick={saveSettings}
              disabled={saving}
              className="h-12 px-6 bg-stone-900 dark:bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:shadow-xl hover:shadow-amber-500/20 active:scale-95 disabled:opacity-50 press-effect flex items-center gap-2"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {saving ? (
                <Icons.Progress className="w-4 h-4 animate-spin" />
              ) : (
                <Icons.Save className="w-4 h-4" />
              )}
              Lưu thay đổi
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8">
          {/* Navigation Hub */}
          <div className="lg:col-span-3 space-y-4">
            <div className="glass-premium rounded-[32px] p-2 border border-stone-100 dark:border-white/5 shadow-sm">
              <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1 scroll-hide p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSearchQuery('');
                    }}
                    className={cn(
                      'flex-shrink-0 flex items-center gap-4 px-5 py-4 rounded-[20px] transition-all duration-500 relative group overflow-hidden',
                      activeTab === tab.id
                        ? 'bg-amber-500/10 text-stone-950 dark:text-white font-black lg:translate-x-1'
                        : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-white/5'
                    )}
                    style={
                      activeTab === tab.id
                        ? {
                            backgroundColor: 'var(--color-primary-10)',
                            color: 'var(--color-primary)',
                          }
                        : {}
                    }
                  >
                    <tab.icon
                      className={cn('w-5 h-5', activeTab === tab.id ? '' : 'opacity-40')}
                      style={activeTab === tab.id ? { color: 'var(--color-primary)' } : {}}
                    />
                    <span className="text-[13px] tracking-tight whitespace-nowrap">
                      {tab.label}
                    </span>
                    {activeTab === tab.id && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-amber-500 rounded-full"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                      />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Quick Links */}
            <div className="hidden lg:block glass-premium rounded-[32px] p-6 border border-stone-100 dark:border-white/5 shadow-sm space-y-4">
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                Liên kết nhanh
              </h4>
              <div className="space-y-2">
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-3 text-sm font-bold text-stone-600 dark:text-stone-400 hover:text-amber-500 transition-colors"
                >
                  <Icons.Users className="w-4 h-4" /> Hồ sơ cá nhân
                </Link>
                <Link
                  href="/dashboard/settings/sessions"
                  className="flex items-center gap-3 text-sm font-bold text-stone-600 dark:text-stone-400 hover:text-amber-500 transition-colors"
                >
                  <Icons.Security className="w-4 h-4" /> Quản lý phiên
                </Link>
              </div>
            </div>
          </div>

          {/* Dynamic Content Area */}
          <div className="lg:col-span-9 space-y-6">
            {activeTab === 'customization' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                {/* Accent Color Palette */}
                <Card className="rounded-[40px] overflow-hidden border-stone-100 dark:border-white/5 glass-premium shadow-xl shadow-black/5">
                  <CardHeader className="bg-gradient-to-br from-amber-500/5 to-transparent border-b border-stone-100 dark:border-white/5 py-6 px-8">
                    <div className="flex items-center gap-3">
                      <span className="p-2.5 bg-amber-500/10 rounded-2xl">
                        <Icons.Layout className="w-5 h-5 text-amber-500" />
                      </span>
                      <h2 className="text-xl font-black tracking-tight">Màu chủ đạo</h2>
                    </div>
                  </CardHeader>
                  <CardBody className="p-8 space-y-8">
                    <p className="text-sm text-stone-500 font-medium">
                      Chọn tông màu đặc trưng cho giao diện dashboard của bạn.
                    </p>
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { name: 'Amber', color: 'bg-amber-500', hex: '#F5A623' },
                        { name: 'Blue', color: 'bg-blue-600', hex: '#2563EB' },
                        { name: 'Emerald', color: 'bg-emerald-500', hex: '#10B981' },
                        { name: 'Rose', color: 'bg-rose-500', hex: '#F43F5E' },
                        { name: 'Slate', color: 'bg-slate-500', hex: '#64748B' },
                        { name: 'Indigo', color: 'bg-indigo-500', hex: '#6366F1' },
                      ].map((c) => (
                        <button
                          key={c.name}
                          onClick={() => setAccentColor(c.name.toLowerCase() as AccentColor)}
                          className={cn(
                            'group flex flex-col items-center gap-3 p-4 rounded-[28px] border transition-all duration-500 press-effect',
                            accentColor === c.name.toLowerCase()
                              ? 'border-stone-900 bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-2xl'
                              : 'border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/5'
                          )}
                        >
                          <div
                            className={cn(
                              'w-10 h-10 rounded-2xl shadow-lg ring-4 ring-white/20',
                              c.color
                            )}
                          />
                          <span className="text-[9px] font-black uppercase tracking-widest">
                            {c.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </CardBody>
                </Card>

                {/* Density & Layout */}
                <Card className="rounded-[40px] overflow-hidden border-stone-100 dark:border-white/5 glass-premium shadow-xl shadow-black/5">
                  <CardHeader className="bg-gradient-to-br from-blue-500/5 to-transparent border-b border-stone-100 dark:border-white/5 py-6 px-8">
                    <div className="flex items-center gap-3">
                      <span className="p-2.5 bg-blue-500/10 rounded-2xl">
                        <Icons.Columns className="w-5 h-5 text-blue-500" />
                      </span>
                      <h2 className="text-xl font-black tracking-tight">Trải nghiệm UI</h2>
                    </div>
                  </CardHeader>
                  <CardBody className="p-8 space-y-8">
                    <div className="flex gap-4 p-1.5 bg-stone-100 dark:bg-white/5 rounded-[32px]">
                      <button
                        onClick={() => setDensity('cozy')}
                        className={cn(
                          'flex-1 p-4.5 rounded-[24px] text-center transition-all duration-500 font-black uppercase tracking-widest text-[11px]',
                          density === 'cozy'
                            ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xl'
                            : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                        )}
                      >
                        Cozy
                      </button>
                      <button
                        onClick={() => setDensity('compact')}
                        className={cn(
                          'flex-1 p-4.5 rounded-[24px] text-center transition-all duration-500 font-black uppercase tracking-widest text-[11px]',
                          density === 'compact'
                            ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xl'
                            : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                        )}
                      >
                        Compact
                      </button>
                    </div>

                    <div className="space-y-6 pt-2">
                      <div className="space-y-3">
                        <div className="flex justify-between items-end px-1">
                          <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                            Kính mờ (Blur)
                          </span>
                          <span className="text-sm font-black text-stone-900 dark:text-white">
                            {blurStrength}
                            <span className="text-[10px] opacity-40 ml-0.5">PX</span>
                          </span>
                        </div>
                        <div className="relative group/slider h-6 flex items-center">
                          <input
                            type="range"
                            min="0"
                            max="64"
                            step="4"
                            value={blurStrength}
                            onChange={(e) => setBlurStrength(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-stone-100 dark:bg-white/10 rounded-full appearance-none outline-none cursor-pointer accent-amber-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-end px-1">
                          <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                            Độ trong suốt
                          </span>
                          <span className="text-sm font-black text-stone-900 dark:text-white">
                            {glassOpacity}
                            <span className="text-[10px] opacity-40 ml-0.5">%</span>
                          </span>
                        </div>
                        <div className="relative group/slider h-6 flex items-center">
                          <input
                            type="range"
                            min="10"
                            max="100"
                            step="5"
                            value={glassOpacity}
                            onChange={(e) => setGlassOpacity(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-stone-100 dark:bg-white/10 rounded-full appearance-none outline-none cursor-pointer accent-amber-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-white/5 rounded-2xl">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                            Kết cấu mặt kính (Texture)
                          </span>
                          <p className="text-[10px] text-stone-500">
                            Thêm hiệu ứng nhiễu hạt nhẹ tạo cảm giác chất liệu thật.
                          </p>
                        </div>
                        <button
                          onClick={() => setTexture(!texture)}
                          className={cn(
                            'w-12 h-6 rounded-full p-1 transition-all duration-300',
                            texture ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-700'
                          )}
                        >
                          <div
                            className={cn(
                              'w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm',
                              texture ? 'translate-x-6' : 'translate-x-0'
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in-up">
                <Card className="rounded-[40px] overflow-hidden border-stone-100 dark:border-white/5 glass-premium min-h-[500px] shadow-xl shadow-black/5">
                  <CardHeader className="py-8 px-10 border-b border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <h2 className="text-xl font-black tracking-tighter text-stone-900 dark:text-white uppercase px-1">
                        {isSearching
                          ? `Kết quả tìm kiếm cho "${searchQuery}"`
                          : tabs.find((t) => t.id === activeTab)?.label}
                      </h2>
                      {activeTab === 'academic' && !isSearching && (
                        <Button
                          onClick={handleAddYear}
                          className="rounded-2xl bg-stone-900 dark:bg-amber-600 text-white font-bold h-10 px-4 flex items-center gap-2"
                        >
                          <Plus size={16} /> Thêm năm học
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardBody className="p-6 md:p-10 space-y-8">
                    {activeTab === 'general' || activeTab === 'finance' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        {filteredSettings.map((setting) => (
                          <div key={setting.id} className="group flex flex-col gap-2">
                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.15em] px-1 transition-colors group-focus-within:text-amber-500">
                              {setting.description}
                            </label>
                            <div className="relative">
                              <input
                                type={setting.setting_type === 'number' ? 'number' : 'text'}
                                value={settingsForm[setting.setting_key] || ''}
                                onChange={(e) =>
                                  handleSettingChange(setting.setting_key, e.target.value)
                                }
                                className="w-full px-5 py-4 bg-stone-100/50 dark:bg-white/5 border border-transparent focus:border-stone-900 dark:focus:border-white/20 rounded-2xl focus:ring-4 focus:ring-amber-500/10 transition-all font-bold text-stone-800 dark:text-stone-200"
                              />
                            </div>
                            <p className="px-5 text-[9px] font-mono text-stone-400/50 lowercase italic tracking-tight">
                              {setting.setting_key}
                            </p>
                          </div>
                        ))}
                        {filteredSettings.length === 0 && (
                          <div className="md:col-span-2 py-20 text-center space-y-6">
                            <div className="w-20 h-20 bg-stone-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-stone-200 dark:text-stone-800">
                              <Icons.Search className="w-8 h-8 opacity-20" />
                            </div>
                            <p className="text-stone-400 font-medium italic">
                              Không tìm thấy cài đặt nào trong danh mục này
                            </p>
                          </div>
                        )}
                      </div>
                    ) : activeTab === 'academic' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {academicYears.map((year) => (
                          <div
                            key={year.id}
                            onClick={() => handleEditYear(year)}
                            className="p-8 rounded-[36px] border border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:shadow-2xl transition-all duration-700 group hover:-translate-y-1.5 cursor-pointer relative overflow-hidden"
                          >
                            {year.is_current && (
                              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                            )}
                            <div className="flex justify-between items-start mb-6">
                              <div className="p-4 bg-white dark:bg-stone-900 rounded-[22px] shadow-sm group-hover:bg-amber-500 transition-colors group-hover:text-white">
                                <Icons.Calendar className="w-6 h-6" />
                              </div>
                              <div className="flex flex-col items-end">
                                {year.is_current && (
                                  <span className="px-3.5 py-1.5 bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-500/20">
                                    Active Now
                                  </span>
                                )}
                                <span className="text-[11px] font-black text-stone-400 mt-3 opacity-40 group-hover:opacity-100 transition-opacity tracking-widest">
                                  {year.id.split('-')[0]}
                                </span>
                              </div>
                            </div>
                            <h3 className="text-2xl font-black text-stone-950 dark:text-white tracking-tight leading-none mb-2">
                              {year.name}
                            </h3>
                            <p className="text-sm text-stone-500 font-medium opacity-60">
                              {new Date(year.start_date).toLocaleDateString()} &mdash;{' '}
                              {new Date(year.end_date).toLocaleDateString()}
                            </p>

                            <div className="absolute bottom-6 right-8 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                              <div className="w-10 h-10 rounded-full bg-stone-900 dark:bg-amber-500 text-white flex items-center justify-center">
                                <Icons.Edit className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : activeTab === 'security' ? (
                      <div className="space-y-10">
                        <section className="space-y-6">
                          <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">
                            Phiên hoạt động
                          </h3>
                          <div className="grid grid-cols-1 gap-4">
                            {[
                              {
                                device: 'MacBook Pro 14"',
                                browser: 'Chrome',
                                ip: '192.168.1.1',
                                location: 'TP. Hồ Chí Minh',
                                current: true,
                              },
                              {
                                device: 'iPhone 15 Pro',
                                browser: 'Safari',
                                ip: '112.45.2.1',
                                location: 'TP. Hồ Chí Minh',
                                current: false,
                              },
                              {
                                device: 'Windows PC',
                                browser: 'Edge',
                                ip: '14.161.5.2',
                                location: 'Hà Nội',
                                current: false,
                              },
                            ].map((session, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-white/5 group hover:border-amber-500/30 transition-all"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="p-3 bg-stone-50 dark:bg-white/5 rounded-2xl text-stone-400 group-hover:text-amber-500 transition-colors">
                                    <Icons.Menu className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-stone-900 dark:text-stone-100 text-[15px]">
                                        {session.device}
                                      </span>
                                      {session.current && (
                                        <span className="text-[9px] font-black uppercase text-amber-500 px-2 py-0.5 bg-amber-500/10 rounded-full">
                                          Hiện tại
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-stone-500 font-medium">
                                      {session.browser} &bull; {session.ip} &bull;{' '}
                                      {session.location}
                                    </p>
                                  </div>
                                </div>
                                {!session.current && (
                                  <button className="text-[10px] font-black text-red-500 uppercase tracking-widest px-4 py-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                    Đăng xuất
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          <button className="w-full py-4 text-[10px] font-black text-stone-500 uppercase tracking-widest border border-stone-100 dark:border-white/5 rounded-2xl hover:bg-stone-50 dark:hover:bg-white/5 transition-all">
                            Đăng xuất khỏi tất cả các thiết bị khác
                          </button>
                        </section>

                        <section className="space-y-6">
                          <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">
                            Nhật ký hoạt động
                          </h3>
                          <div className="space-y-1">
                            {[
                              {
                                action: 'Đã thay đổi màu chủ đạo',
                                date: '10 phút trước',
                                category: 'Giao diện',
                              },
                              {
                                action: 'Đã cập nhật thang điểm học kỳ',
                                date: '2 giờ trước',
                                category: 'Thang điểm',
                              },
                              {
                                action: 'Đã thay đổi trạng thái năm học 2024-2025',
                                date: 'Hôm qua',
                                category: 'Năm học',
                              },
                              {
                                action: 'Đã đăng nhập từ thiết bị mới',
                                date: '2 ngày trước',
                                category: 'Bảo mật',
                              },
                            ].map((log, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-white/2 rounded-2xl transition-all group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700 group-hover:bg-amber-500 transition-colors" />
                                  <div>
                                    <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
                                      {log.action}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] font-medium text-stone-500 uppercase tracking-wider">
                                        {log.category}
                                      </span>
                                      <span className="text-[10px] text-stone-400">
                                        &bull; {log.date}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <Icons.ChevronRight className="w-4 h-4 text-stone-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>
                    ) : activeTab === 'notifications' ? (
                      <div className="space-y-10">
                        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {[
                            { label: 'Email Notifications', icon: Icons.Mail, active: true },
                            { label: 'SMS Notifications', icon: Icons.Phone, active: false },
                            {
                              label: 'Push Notifications',
                              icon: Icons.Notifications,
                              active: true,
                            },
                          ].map((channel, i) => (
                            <div
                              key={i}
                              className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-white/5 space-y-4"
                            >
                              <div className="flex justify-between items-start">
                                <div className="p-3 bg-stone-50 dark:bg-white/5 rounded-2xl text-stone-400">
                                  <channel.icon className="w-5 h-5" />
                                </div>
                                <button
                                  className={cn(
                                    'w-10 h-5 rounded-full p-1 transition-all',
                                    channel.active
                                      ? 'bg-amber-500'
                                      : 'bg-stone-200 dark:bg-stone-800'
                                  )}
                                >
                                  <div
                                    className={cn(
                                      'w-3 h-3 bg-white rounded-full transition-all',
                                      channel.active ? 'translate-x-5' : 'translate-x-0'
                                    )}
                                  />
                                </button>
                              </div>
                              <span className="block font-bold text-sm text-stone-800 dark:text-stone-200">
                                {channel.label}
                              </span>
                            </div>
                          ))}
                        </section>

                        <section className="space-y-4">
                          <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">
                            Sự kiện kích hoạt
                          </h3>
                          <div className="bg-stone-50/50 dark:bg-white/2 rounded-[32px] border border-stone-100 dark:border-white/5 overflow-hidden">
                            {[
                              {
                                label: 'Điểm số mới',
                                description: 'Thông báo khi hể thống cập nhật điểm cho học sinh',
                                push: true,
                                email: true,
                              },
                              {
                                label: 'Yêu cầu thanh toán',
                                description: 'Thông báo khi có hóa đơn học phí mới cần thanh toán',
                                push: true,
                                email: true,
                              },
                              {
                                label: 'Thay đổi thời khóa biểu',
                                description: 'Thông báo khi lịch học hoặc giáo viên thay đổi',
                                push: true,
                                email: false,
                              },
                              {
                                label: 'Cập nhật hệ thống',
                                description: 'Thông báo về các bảo trì hoặc tính năng mới',
                                push: false,
                                email: true,
                              },
                            ].map((event, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between p-6 border-b border-stone-100 dark:border-white/5 last:border-0 hover:bg-white dark:hover:bg-white/2 transition-all"
                              >
                                <div className="space-y-1">
                                  <span className="font-bold text-stone-900 dark:text-stone-100 text-[15px]">
                                    {event.label}
                                  </span>
                                  <p className="text-xs text-stone-500 font-medium">
                                    {event.description}
                                  </p>
                                </div>
                                <div className="flex items-center gap-6">
                                  <div className="flex flex-col items-center gap-2">
                                    <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">
                                      Push
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={event.push}
                                      readOnly
                                      className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500"
                                    />
                                  </div>
                                  <div className="flex flex-col items-center gap-2">
                                    <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">
                                      Email
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={event.email}
                                      readOnly
                                      className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>
                    ) : null}
                  </CardBody>
                </Card>
              </div>
            )}
          </div>
        </div>

        <AcademicYearModal
          isOpen={isYearModalOpen}
          onClose={() => setIsYearModalOpen(false)}
          year={selectedYear}
          onSave={handleSaveYear}
        />
      </div>
    </div>
  );
}
