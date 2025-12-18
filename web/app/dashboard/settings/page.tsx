"use client"

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Card, CardHeader, CardBody } from "@/components/ui/Card"
import { Icons } from "@/components/ui/Icons"

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
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState<Setting[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [gradingScales, setGradingScales] = useState<GradingScale[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchSettings()
    fetchAcademicYears()
    fetchGradingScales()
  }, [])

  const fetchSettings = async () => {
    console.log('[Settings] Fetching settings...');
    try {
      const response = await apiFetch('/api/admin/settings')
      const data = await response.json()
      console.log('[Settings] Settings response:', data);
      
      const settingsData = Array.isArray(data) ? data : (data?.data || []);
      if (Array.isArray(settingsData) && settingsData.length > 0) {
        setSettings(settingsData)
        // Initialize form with current values
        const formData: Record<string, string> = {}
        settingsData.forEach((s: Setting) => {
          formData[s.setting_key] = s.setting_value || ''
        })
        setSettingsForm(formData)
        console.log('[Settings] Loaded', settingsData.length, 'settings');
      } else {
        console.log('[Settings] No settings found or empty response');
        setSettings([])
      }
    } catch (error) {
      console.error('[Settings] Error fetching settings:', error)
      setSettings([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAcademicYears = async () => {
    console.log('[Settings] Fetching academic years...');
    try {
      const response = await apiFetch('/api/admin/academic-years')
      const data = await response.json()
      console.log('[Settings] Academic years response:', data);
      
      const yearsData = Array.isArray(data) ? data : (data?.data || []);
      if (Array.isArray(yearsData) && yearsData.length > 0) {
        setAcademicYears(yearsData)
        console.log('[Settings] Loaded', yearsData.length, 'academic years');
      } else {
        console.log('[Settings] No academic years found');
        setAcademicYears([])
      }
    } catch (error) {
      console.error('[Settings] Error fetching academic years:', error)
      setAcademicYears([])
    }
  }

  const fetchGradingScales = async () => {
    try {
      const response = await apiFetch('/api/admin/grading-scales')
      const data = await response.json()
      const scalesData = Array.isArray(data) ? data : (data?.data || []);
      if (Array.isArray(scalesData)) {
        setGradingScales(scalesData)
      }
    } catch (error) {
      console.error('[Settings] Error fetching grading scales:', error)
    }
  }

  const handleSettingChange = (key: string, value: string) => {
    setSettingsForm(prev => ({ ...prev, [key]: value }))
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      // In a real app, we would batch update or update changed fields
      // For now, we'll just log what would be saved
      console.log('Saving settings:', settingsForm)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Không thể lưu cài đặt')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'Tổng quát', icon: Icons.Settings },
    { id: 'academic', label: 'Năm học', icon: Icons.Calendar },
    { id: 'grading', label: 'Thang điểm', icon: Icons.Grades },
    { id: 'finance', label: 'Tài chính', icon: Icons.Finance },
  ]

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-stone-500">
          <Icons.Progress className="w-8 h-8 animate-spin text-stone-600" />
          <p>Đang tải cài đặt...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Icons.Settings className="w-8 h-8 text-stone-600" />
            Cài đặt hệ thống
          </h1>
          <p className="text-stone-500 mt-1">Quản lý cấu hình hệ thống toàn cầu</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:bg-stone-400 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Icons.Progress className="w-5 h-5 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Icons.Save className="w-5 h-5" />
              Lưu thay đổi
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <Card className="w-full md:w-64 flex-shrink-0 h-fit">
          <CardBody className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-stone-100 text-stone-900'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                >
                  <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-stone-900' : 'text-stone-400'}`} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </CardBody>
        </Card>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {activeTab === 'general' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-stone-900">Cài đặt tổng quát</h2>
              </CardHeader>
              <CardBody className="space-y-6">
                {settings.filter(s => s.category === 'general').map((setting) => (
                  <div key={setting.id}>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      {setting.description}
                    </label>
                    <input
                      type={setting.setting_type === 'number' ? 'number' : 'text'}
                      value={settingsForm[setting.setting_key] || ''}
                      onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                    />
                    <p className="mt-1 text-xs text-stone-500 font-mono">{setting.setting_key}</p>
                  </div>
                ))}
                {settings.filter(s => s.category === 'general').length === 0 && (
                  <p className="text-stone-500 italic">Không có cài đặt tổng quát nào.</p>
                )}
              </CardBody>
            </Card>
          )}

          {activeTab === 'academic' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-stone-900">Năm học</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {academicYears.map((year) => (
                    <div key={year.id} className="flex items-center justify-between p-4 border border-stone-200 rounded-lg hover:bg-stone-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-stone-900">{year.name}</h3>
                          {year.is_current && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              Hiện tại
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-stone-500 mt-1">
                          {new Date(year.start_date).toLocaleDateString('vi-VN')} - {new Date(year.end_date).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <button className="text-stone-600 hover:text-stone-800 text-sm font-medium">
                        Chỉnh sửa
                      </button>
                    </div>
                  ))}
                  {academicYears.length === 0 && (
                    <p className="text-stone-500 italic">Chưa cấu hình năm học nào.</p>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'grading' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-stone-900">Thang điểm</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {gradingScales.map((scale) => (
                    <div key={scale.id} className="p-4 border border-stone-200 rounded-lg hover:bg-stone-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-stone-900">{scale.name}</h3>
                          {scale.is_default && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-stone-100 text-stone-800 rounded-full">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <button className="text-stone-600 hover:text-stone-800 text-sm font-medium">
                          Chỉnh sửa
                        </button>
                      </div>
                      <p className="text-sm text-stone-500 mb-3">{scale.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {scale.scale.map((grade) => (
                          <span key={grade.letter} className="px-2 py-1 bg-stone-100 text-stone-700 text-xs rounded border border-stone-200">
                            {grade.letter}: {grade.min}-{grade.max}%
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {gradingScales.length === 0 && (
                    <p className="text-stone-500 italic">Chưa cấu hình thang điểm nào.</p>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'finance' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-stone-900">Cài đặt tài chính</h2>
              </CardHeader>
              <CardBody className="space-y-6">
                {settings.filter(s => s.category === 'finance').map((setting) => (
                  <div key={setting.id}>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      {setting.description}
                    </label>
                    <input
                      type={setting.setting_type === 'number' ? 'number' : 'text'}
                      value={settingsForm[setting.setting_key] || ''}
                      onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                    />
                    <p className="mt-1 text-xs text-stone-500 font-mono">{setting.setting_key}</p>
                  </div>
                ))}
                {settings.filter(s => s.category === 'finance').length === 0 && (
                  <p className="text-stone-500 italic">Không có cài đặt tài chính nào.</p>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
