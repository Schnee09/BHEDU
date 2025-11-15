"use client"

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'

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
    try {
      const response = await apiFetch('/api/admin/settings')
      const data = await response.json()
      if (data.success) {
        setSettings(data.data)
        // Initialize form with current values
        const formData: Record<string, string> = {}
        data.data.forEach((s: Setting) => {
          formData[s.setting_key] = s.setting_value || ''
        })
        setSettingsForm(formData)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAcademicYears = async () => {
    try {
      const response = await apiFetch('/api/admin/academic-years')
      const data = await response.json()
      if (data.success) {
        setAcademicYears(data.data)
      }
    } catch (error) {
      console.error('Error fetching academic years:', error)
    }
  }

  const fetchGradingScales = async () => {
    try {
      const response = await apiFetch('/api/admin/grading-scales')
      const data = await response.json()
      if (data.success) {
        setGradingScales(data.data)
      }
    } catch (error) {
      console.error('Error fetching grading scales:', error)
    }
  }

  const handleSaveSettings = async (category: string) => {
    setSaving(true)
    try {
      const categorySettings = settings
        .filter(s => s.category === category)
        .map(s => ({
          setting_key: s.setting_key,
          setting_value: settingsForm[s.setting_key] || s.setting_value
        }))

      const response = await apiFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: categorySettings })
      })

      const data = await response.json()
      if (data.success) {
        alert('Settings saved successfully!')
        fetchSettings()
      } else {
        alert('Error saving settings: ' + data.message)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const renderSettingInput = (setting: Setting) => {
    const value = settingsForm[setting.setting_key] || ''

    switch (setting.setting_type) {
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={value === 'true'}
            onChange={(e) => setSettingsForm({
              ...settingsForm,
              [setting.setting_key]: e.target.checked ? 'true' : 'false'
            })}
            className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
          />
        )
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => setSettingsForm({
              ...settingsForm,
              [setting.setting_key]: e.target.value
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          />
        )
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setSettingsForm({
              ...settingsForm,
              [setting.setting_key]: e.target.value
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          />
        )
    }
  }

  const renderSettingsCategory = (category: string, title: string) => {
    const categorySettings = settings.filter(s => s.category === category)

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-amber-900">{title}</h3>
          <button
            onClick={() => handleSaveSettings(category)}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:shadow-lg transition font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categorySettings.map((setting) => (
            <div key={setting.id} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {setting.setting_key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </label>
              {setting.description && (
                <p className="text-xs text-gray-500">{setting.description}</p>
              )}
              {renderSettingInput(setting)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'general', label: 'School Info', icon: '🏫' },
    { id: 'academic', label: 'Academic', icon: '📚' },
      { id: 'attendance', label: 'Attendance', icon: '📋' },
    { id: 'grading', label: 'Grading', icon: '📊' },
    { id: 'financial', label: 'Financial', icon: '💰' },
    { id: 'years', label: 'Academic Years', icon: '📅' },
    { id: 'scales', label: 'Grading Scales', icon: '📈' },
  ]

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12 text-gray-500">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-amber-900">Settings & Configuration</h1>
        <p className="text-amber-700 mt-1">Manage school-wide settings and configurations</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'border-b-2 border-amber-500 text-amber-700 bg-amber-50'
                  : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && renderSettingsCategory('general', 'School Information')}

          {/* Academic Settings */}
          {activeTab === 'academic' && renderSettingsCategory('academic', 'Academic Settings')}

          {/* Attendance Settings */}
          {activeTab === 'attendance' && renderSettingsCategory('attendance', 'Attendance Configuration')}

          {/* Grading Settings */}
          {activeTab === 'grading' && renderSettingsCategory('grading', 'Grading Configuration')}

          {/* Financial Settings */}
          {activeTab === 'financial' && renderSettingsCategory('financial', 'Financial Settings')}

          {/* Academic Years Tab */}
          {activeTab === 'years' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-amber-900">Academic Years</h3>
                <button className="px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:shadow-lg transition font-semibold">
                  + Add Academic Year
                </button>
              </div>

              <div className="space-y-4">
                {academicYears.map((year) => (
                  <div key={year.id} className="p-4 border border-gray-200 rounded-lg hover:border-amber-300 transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{year.name}</h4>
                          {year.is_current && (
                            <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(year.start_date).toLocaleDateString()} - {new Date(year.end_date).toLocaleDateString()}
                        </p>
                        {year.terms && year.terms.length > 0 && (
                          <div className="mt-2 flex gap-2 flex-wrap">
                             {year.terms.map((term, idx: number) => (
                              <span key={idx} className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded">
                                {term.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 text-sm text-amber-700 hover:bg-amber-50 rounded-lg transition">
                          Edit
                        </button>
                        {!year.is_current && (
                          <button className="px-4 py-2 text-sm text-green-700 hover:bg-green-50 rounded-lg transition">
                            Set as Current
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grading Scales Tab */}
          {activeTab === 'scales' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-amber-900">Grading Scales</h3>
                <button className="px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:shadow-lg transition font-semibold">
                  + Add Grading Scale
                </button>
              </div>

              <div className="space-y-4">
                {gradingScales.map((scale) => (
                  <div key={scale.id} className="p-4 border border-gray-200 rounded-lg hover:border-amber-300 transition">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{scale.name}</h4>
                          {scale.is_default && (
                            <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        {scale.description && (
                          <p className="text-sm text-gray-600 mt-1">{scale.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 text-sm text-amber-700 hover:bg-amber-50 rounded-lg transition">
                          Edit
                        </button>
                        {!scale.is_default && (
                          <button className="px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-lg transition">
                            Set as Default
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Scale Preview */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mt-3">
                       {scale.scale.map((grade, idx: number) => (
                        <div key={idx} className="text-center p-2 bg-gradient-to-br from-amber-50 to-yellow-50 rounded border border-amber-200">
                          <div className="font-bold text-amber-900">{grade.letter}</div>
                          <div className="text-xs text-gray-600">{grade.min}-{grade.max}%</div>
                          {grade.gpa && <div className="text-xs text-amber-700">GPA: {grade.gpa}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
