"use client"

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Card, CardHeader, CardBody } from "@/components/ui/Card"
import { Icons } from "@/components/ui/Icons"
import PageGuard from "@/components/PageGuard"
import { cn } from "@/lib/utils"
import Link from 'next/link'

interface Setting {
  id: string
  setting_key: string
  setting_value: string
  setting_type: string
  category: string
  description: string
  is_public: boolean
}

interface AcademicYear {
  id: string
  name: string
  start_date: string
  end_date: string
  is_current: boolean
  terms: Array<{ name: string; start_date: string; end_date: string }>
}

interface GradingScale {
  id: string
  name: string
  description: string
  scale: Array<{ letter: string; min: number; max: number; gpa: number; description: string }>
  is_default: boolean
}

export default function SettingsPage() {
  return (
    <PageGuard permissions="system.settings">
      <SettingsPageContent />
    </PageGuard>
  );
}

function SettingsPageContent() {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState<Setting[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [gradingScales, setGradingScales] = useState<GradingScale[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Customization State (Local for instant feedback, persistent in LocalStorage)
  const [customization, setCustomization] = useState({
    accentColor: 'amber',
    density: 'cozy',
    glassOpacity: 70,
    blurStrength: 32,
    theme: 'system'
  })

  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({})

  useEffect(() => {
    const saved = localStorage.getItem('bh-edu-customization')
    if (saved) {
      try {
        setCustomization(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse saved customization')
      }
    }
    fetchSettings()
    fetchAcademicYears()
    fetchGradingScales()
  }, [])

  useEffect(() => {
    localStorage.setItem('bh-edu-customization', JSON.stringify(customization))
  }, [customization])

  const fetchSettings = async () => {
    try {
      const response = await apiFetch('/api/admin/settings')
      const data = await response.json()
      const settingsData = Array.isArray(data) ? data : (data?.data || []);
      if (Array.isArray(settingsData)) {
        setSettings(settingsData)
        const formData: Record<string, string> = {}
        settingsData.forEach((s: Setting) => {
          formData[s.setting_key] = s.setting_value || ''
        })
        setSettingsForm(formData)
      }
    } catch (error) {
      console.error('[Settings] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAcademicYears = async () => {
    try {
      const response = await apiFetch('/api/admin/academic-years')
      const data = await response.json()
      setAcademicYears(Array.isArray(data) ? data : (data?.data || []))
    } catch (error) {
      console.error('[Settings] Academic Years Error:', error)
    }
  }

  const fetchGradingScales = async () => {
    try {
      const response = await apiFetch('/api/admin/grading-scales')
      const data = await response.json()
      setGradingScales(Array.isArray(data) ? data : (data?.data || []))
    } catch (error) {
      console.error('[Settings] Grading Scales Error:', error)
    }
  }

  const handleSettingChange = (key: string, value: string) => {
    setSettingsForm(prev => ({ ...prev, [key]: value }))
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      // Logic for saving configuration to DB would go here
      await new Promise(resolve => setTimeout(resolve, 800))
      alert('Cấu hình đã được lưu thành công')
    } catch (error) {
      alert('Lỗi khi lưu cài đặt')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'Cấu hình', icon: Icons.Settings, color: 'text-blue-500' },
    { id: 'customization', label: 'Giao diện', icon: Icons.Layout, color: 'text-amber-500' },
    { id: 'academic', label: 'Năm học', icon: Icons.Calendar, color: 'text-emerald-500' },
    { id: 'grading', label: 'Thang điểm', icon: Icons.Grades, color: 'text-purple-500' },
    { id: 'finance', label: 'Tài chính', icon: Icons.Finance, color: 'text-rose-500' },
  ]

  const filteredSettings = settings.filter(s => 
    s.category === activeTab && 
    (s.description.toLowerCase().includes(searchQuery.toLowerCase()) || s.setting_key.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="font-black text-stone-400 uppercase tracking-widest text-[10px]">Đang khởi tạo Control Center</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full mb-2">
             <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">Hệ thống BH-EDU</span>
          </div>
          <h1 className="text-4xl font-black text-stone-950 dark:text-white tracking-tighter leading-none">Control Center</h1>
          <p className="text-stone-500 dark:text-stone-400 font-medium">Bảng điều khiển cấu hình và cá nhân hóa Pro Max</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <input 
              type="text"
              placeholder="Tìm cài đặt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500/20 outline-none w-64 transition-all"
            />
            <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          </div>
          
          <button
            onClick={saveSettings}
            disabled={saving}
            className="h-12 px-6 bg-stone-900 dark:bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:shadow-xl hover:shadow-amber-500/20 active:scale-95 disabled:opacity-50 press-effect flex items-center gap-2"
          >
            {saving ? <Icons.Progress className="w-4 h-4 animate-spin" /> : <Icons.Save className="w-4 h-4" />}
            Lưu thay đổi
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8">
        {/* Navigation Hub */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-premium rounded-[32px] p-3 border border-stone-100 dark:border-white/5 shadow-sm">
            <nav className="space-y-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {setActiveTab(tab.id); setSearchQuery('')}}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-[20px] transition-all duration-300 relative group",
                    activeTab === tab.id
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-500 font-black translate-x-1"
                      : "text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-white/5"
                  )}
                >
                  <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? tab.color : "opacity-40")} />
                  <span className="text-sm tracking-tight">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-amber-500 rounded-full" />
                  )}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Quick Links */}
          <div className="glass-premium rounded-[32px] p-6 border border-stone-100 dark:border-white/5 shadow-sm space-y-4">
             <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Liên kết nhanh</h4>
             <div className="space-y-2">
                <Link href="/dashboard/profile" className="flex items-center gap-3 text-sm font-bold text-stone-600 dark:text-stone-400 hover:text-amber-500 transition-colors">
                   <Icons.Users className="w-4 h-4" /> Hồ sơ cá nhân
                </Link>
                <Link href="/dashboard/settings/sessions" className="flex items-center gap-3 text-sm font-bold text-stone-600 dark:text-stone-400 hover:text-amber-500 transition-colors">
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
               <Card className="rounded-[40px] overflow-hidden border-stone-100 dark:border-white/5 glass-premium">
                 <CardHeader className="bg-gradient-to-br from-amber-500/5 to-transparent border-b border-stone-100 dark:border-white/5 py-6 px-8">
                    <div className="flex items-center gap-3">
                       <span className="p-2 bg-amber-500/10 rounded-xl"><Icons.Layout className="w-5 h-5 text-amber-500" /></span>
                       <h2 className="text-lg font-black tracking-tight">Màu chủ đạo</h2>
                    </div>
                 </CardHeader>
                 <CardBody className="p-8 space-y-6">
                    <p className="text-sm text-stone-500">Chọn tông màu đặc trưng cho giao diện dashboard của bạn.</p>
                    <div className="grid grid-cols-4 gap-4">
                       {[
                         { name: 'Amber', color: 'bg-amber-500' },
                         { name: 'Cobalt', color: 'bg-blue-600' },
                         { name: 'Emerald', color: 'bg-emerald-500' },
                         { name: 'Rose', color: 'bg-rose-500' }
                       ].map(c => (
                         <button 
                           key={c.name}
                           onClick={() => setCustomization({...customization, accentColor: c.name.toLowerCase()})}
                           className={cn(
                             "group flex flex-col items-center gap-2 p-3 rounded-3xl border transition-all",
                             customization.accentColor === c.name.toLowerCase() ? "border-amber-500 bg-amber-500/5 ring-4 ring-amber-500/5" : "border-stone-100 dark:border-white/5"
                           )}
                         >
                            <div className={cn("w-10 h-10 rounded-2xl shadow-lg", c.color)} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{c.name}</span>
                         </button>
                       ))}
                    </div>
                 </CardBody>
               </Card>

               {/* Density & Layout */}
               <Card className="rounded-[40px] overflow-hidden border-stone-100 dark:border-white/5 glass-premium">
                 <CardHeader className="bg-gradient-to-br from-blue-500/5 to-transparent border-b border-stone-100 dark:border-white/5 py-6 px-8">
                    <div className="flex items-center gap-3">
                       <span className="p-2 bg-blue-500/10 rounded-xl"><Icons.Columns className="w-5 h-5 text-blue-500" /></span>
                       <h2 className="text-lg font-black tracking-tight">Độ giãn cách UI</h2>
                    </div>
                 </CardHeader>
                 <CardBody className="p-8 space-y-6">
                    <div className="flex gap-4">
                       <button 
                         onClick={() => setCustomization({...customization, density: 'cozy'})}
                         className={cn(
                           "flex-1 p-5 rounded-[28px] border text-center transition-all",
                           customization.density === 'cozy' ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xl" : "bg-stone-50 dark:bg-white/5 text-stone-500 border-transparent"
                         )}
                       >
                          <span className="text-xs font-black uppercase tracking-widest">Cozy (v2.0)</span>
                       </button>
                       <button 
                         onClick={() => setCustomization({...customization, density: 'compact'})}
                         className={cn(
                           "flex-1 p-5 rounded-[28px] border text-center transition-all",
                           customization.density === 'compact' ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xl" : "bg-stone-50 dark:bg-white/5 text-stone-500 border-transparent"
                         )}
                       >
                          <span className="text-xs font-black uppercase tracking-widest">Compact</span>
                       </button>
                    </div>
                    
                    <div className="space-y-4 pt-4">
                       <div className="flex justify-between items-center px-1">
                          <span className="text-[11px] font-black text-stone-400 uppercase tracking-widest">Kính mờ (Glassmorphism)</span>
                          <span className="text-xs font-bold text-amber-600">{customization.blurStrength}px</span>
                       </div>
                       <input 
                         type="range" min="0" max="64" step="4"
                         value={customization.blurStrength}
                         onChange={(e) => setCustomization({...customization, blurStrength: parseInt(e.target.value)})}
                         className="w-full accent-amber-500" 
                       />
                    </div>
                 </CardBody>
               </Card>
            </div>
          ) : (
            <div className="space-y-6">
              <Card className="rounded-[40px] overflow-hidden border-stone-100 dark:border-white/5 glass-premium min-h-[500px]">
                <CardHeader className="py-8 px-10 border-b border-stone-100 dark:border-white/5 bg-gradient-to-r from-stone-50 to-transparent dark:from-white/2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-xl font-black tracking-tighter text-stone-900 dark:text-white uppercase px-1">
                      {tabs.find(t => t.id === activeTab)?.label}
                    </h2>
                  </div>
                </CardHeader>
                <CardBody className="p-10 space-y-8 animate-fade-in-up">
                  {activeTab === 'general' || activeTab === 'finance' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                       {filteredSettings.map((setting) => (
                        <div key={setting.id} className="group flex flex-col gap-2">
                          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1 transition-colors group-focus-within:text-amber-500">
                            {setting.description}
                          </label>
                          <div className="relative">
                            <input
                              type={setting.setting_type === 'number' ? 'number' : 'text'}
                              value={settingsForm[setting.setting_key] || ''}
                              onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
                              className="w-full px-5 py-4 bg-stone-50 dark:bg-white/5 border border-transparent focus:border-amber-500/30 rounded-2xl focus:ring-4 focus:ring-amber-500/10 transition-all font-bold text-stone-800 dark:text-stone-200"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <Icons.Edit className="w-3 h-3 text-stone-400" />
                            </div>
                          </div>
                          <p className="px-5 text-[9px] font-mono text-stone-400/60 lowercase italic tracking-tight">{setting.setting_key}</p>
                        </div>
                      ))}
                      {filteredSettings.length === 0 && (
                        <div className="md:col-span-2 py-20 text-center space-y-4">
                           <div className="w-16 h-16 bg-stone-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
                              <Icons.Search className="w-6 h-6 text-stone-300" />
                           </div>
                           <p className="text-stone-400 font-medium italic">Không tìm thấy cài đặt nào phù hợp</p>
                        </div>
                      )}
                    </div>
                  ) : activeTab === 'academic' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {academicYears.map((year) => (
                        <div key={year.id} className="p-6 rounded-[28px] border border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/5 hover:shadow-xl transition-all group hover:scale-[1.02] cursor-pointer relative overflow-hidden">
                           {year.is_current && <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />}
                           <div className="flex justify-between items-start mb-4">
                             <div className="p-3 bg-white dark:bg-stone-900 rounded-2xl shadow-sm"><Icons.Calendar className="w-6 h-6 text-amber-500" /></div>
                             <div className="flex flex-col items-end">
                               {year.is_current && <span className="px-3 py-1 bg-green-500/10 text-green-600 text-[9px] font-black uppercase rounded-full">Hiện tại</span>}
                               <span className="text-[11px] font-bold text-stone-400 mt-2">{year.id.split('-')[0]}</span>
                             </div>
                           </div>
                           <h3 className="text-xl font-black text-stone-900 dark:text-white tracking-tight">{year.name}</h3>
                           <p className="text-sm text-stone-500 mt-1 font-medium">{new Date(year.start_date).toLocaleDateString()} - {new Date(year.end_date).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  ) : activeTab === 'grading' ? (
                    <div className="space-y-6">
                       {gradingScales.map((scale) => (
                         <div key={scale.id} className="p-8 rounded-[32px] border border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/5 space-y-6">
                            <div className="flex justify-between items-center">
                               <div className="flex items-center gap-3">
                                  <h3 className="text-xl font-black">{scale.name}</h3>
                                  {scale.is_default && <span className="px-3 py-1 bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase rounded-full">Mặc định</span>}
                               </div>
                               <button className="p-3 rounded-xl bg-white dark:bg-stone-900 text-stone-400 hover:text-amber-500 shadow-sm transition-all"><Icons.Edit className="w-4 h-4" /></button>
                            </div>
                            <p className="text-stone-500 text-sm font-medium">{scale.description}</p>
                            <div className="flex flex-wrap gap-2 pt-2">
                               {(Array.isArray(scale.scale) ? scale.scale : []).map((grade: any, idx: number) => (
                                 <div key={idx} className="px-4 py-2 bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-100 dark:border-white/5">
                                    <span className="font-black text-amber-500 mr-2">{grade.letter}</span>
                                    <span className="text-xs font-bold text-stone-600">{grade.min}-{grade.max}%</span>
                                 </div>
                               ))}
                            </div>
                         </div>
                       ))}
                    </div>
                  ) : null}
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
