/**
 * Guardian Management Component
 * Refactored with premium stone/amber theme and Vietnamese localization
 */

'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'
import { showToast } from '@/components/ToastProvider'
import { Icons } from '@/components/ui/Icons'
import { Badge, Button, Card } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Guardian {
  id: string
  student_id: string
  name: string
  relationship: string
  phone: string | null
  email: string | null
  address: string | null
  is_primary_contact: boolean
  is_emergency_contact: boolean
  occupation: string | null
  workplace: string | null
  work_phone: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface GuardianFormData {
  name: string
  relationship: string
  phone: string
  email: string
  address: string
  is_primary_contact: boolean
  is_emergency_contact: boolean
  occupation: string
  workplace: string
  work_phone: string
  notes: string
}

const emptyForm: GuardianFormData = {
  name: '',
  relationship: 'mother',
  phone: '',
  email: '',
  address: '',
  is_primary_contact: false,
  is_emergency_contact: false,
  occupation: '',
  workplace: '',
  work_phone: '',
  notes: ''
}

const relationships = [
  { value: 'mother', label: 'Mẹ' },
  { value: 'father', label: 'Cha' },
  { value: 'guardian', label: 'Người giám hộ' },
  { value: 'grandparent', label: 'Ông bà' },
  { value: 'sibling', label: 'Anh/Chị/Em' },
  { value: 'other', label: 'Khác' }
]

export default function GuardianManagement({ studentId }: { studentId: string }) {
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<GuardianFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    loadGuardians()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId])

  const loadGuardians = async () => {
    try {
      setLoading(true)
      const response = await apiFetch(`/api/admin/students/${studentId}/guardians`)
      if (response.ok) {
        const result = await response.json()
        setGuardians(result.data || [])
      } else {
        showToast.error('Không thể tải danh sách người giám hộ')
      }
    } catch (error) {
      console.error('Failed to load guardians:', error)
      showToast.error('Lỗi hệ thống khi tải danh sách người giám hộ')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setFormData(emptyForm)
    setEditingId(null)
    setShowForm(true)
  }

  const handleEdit = (guardian: Guardian) => {
    setFormData({
      name: guardian.name,
      relationship: guardian.relationship,
      phone: guardian.phone || '',
      email: guardian.email || '',
      address: guardian.address || '',
      is_primary_contact: guardian.is_primary_contact,
      is_emergency_contact: guardian.is_emergency_contact,
      occupation: guardian.occupation || '',
      workplace: guardian.workplace || '',
      work_phone: guardian.work_phone || '',
      notes: guardian.notes || ''
    })
    setEditingId(guardian.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      showToast.error('Vui lòng nhập họ tên người giám hộ')
      return
    }

    setSaving(true)
    const loadingToast = showToast.loading(editingId ? 'Đang cập nhật hồ sơ...' : 'Đang thêm mới hồ sơ...')

    try {
      const url = editingId 
        ? `/api/admin/students/${studentId}/guardians/${editingId}`
        : `/api/admin/students/${studentId}/guardians`
      
      const response = await apiFetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      showToast.dismiss(loadingToast)

      if (response.ok) {
        showToast.success(editingId ? 'Đã cập nhật thành công!' : 'Đã thêm mới thành công!')
        setShowForm(false)
        setEditingId(null)
        setFormData(emptyForm)
        loadGuardians()
      } else {
        showToast.error(result.error || 'Không thể lưu thông tin')
      }
    } catch (error) {
      showToast.dismiss(loadingToast)
      console.error('Failed to save guardian:', error)
      showToast.error('Lỗi hệ thống khi lưu thông tin')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const loadingToast = showToast.loading('Đang xóa hồ sơ...')

    try {
      const response = await apiFetch(`/api/admin/students/${studentId}/guardians/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      showToast.dismiss(loadingToast)

      if (response.ok) {
        showToast.success('Đã xóa hồ sơ thành công')
        setDeleteConfirm(null)
        loadGuardians()
      } else {
        showToast.error(result.error || 'Không thể xóa hồ sơ')
      }
    } catch (error) {
      showToast.dismiss(loadingToast)
      console.error('Failed to delete guardian:', error)
      showToast.error('Lỗi hệ thống khi xóa hồ sơ')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Đang tải dữ liệu phụ huynh...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center pb-6 border-b border-stone-100 dark:border-white/5">
        <div className="space-y-1">
          <h2 className="text-xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <Icons.Parents className="w-6 h-6 text-amber-500" /> Phụ huynh & Liên hệ
          </h2>
          <p className="text-[11px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">
            Quản lý thông tin liên lạc và người giám hộ của học sinh.
          </p>
        </div>
        <Button
          onClick={handleAdd}
          className="font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-2xl shadow-amber-glow"
        >
          <Icons.Add className="w-3.5 h-3.5 mr-2" /> Thêm phụ huynh
        </Button>
      </div>

      {guardians.length === 0 ? (
        <Card borderStyle="dashed" className="p-16 text-center rounded-[2.5rem] bg-stone-50/50 dark:bg-white/[0.01]">
          <div className="w-16 h-16 bg-stone-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Icons.Parents className="w-8 h-8 text-stone-300" />
          </div>
          <p className="text-stone-500 font-medium mb-8">Chưa có thông tin phu huynh nào được ghi nhận.</p>
          <Button
            onClick={handleAdd}
            variant="outline"
            className="font-black uppercase tracking-widest text-[10px] h-11 px-8 border-stone-200"
          >
            Thêm người giám hộ đầu tiên
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guardians.map((guardian) => (
            <div
              key={guardian.id}
              className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:border-amber-500/20 transition-all duration-500 group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-stone-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                    <Icons.User className="w-6 h-6 text-stone-400 group-hover:text-amber-500 transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-serif font-black text-lg text-stone-900 dark:text-white uppercase tracking-tight">{guardian.name}</h3>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                      {relationships.find(r => r.value === guardian.relationship)?.label || guardian.relationship}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {guardian.is_primary_contact && (
                    <Badge variant="success" className="font-black text-[8px] uppercase tracking-widest px-2 h-5">Liên hệ chính</Badge>
                  )}
                  {guardian.is_emergency_contact && (
                    <Badge variant="danger" className="font-black text-[8px] uppercase tracking-widest px-2 h-5">Khẩn cấp</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-6 bg-stone-50/50 dark:bg-white/[0.02] p-4 rounded-2xl border border-stone-100/50 dark:border-white/5">
                {guardian.phone && (
                  <div className="flex items-center gap-3 text-xs">
                    <Icons.Phone className="w-3.5 h-3.5 text-amber-500" />
                    <a href={`tel:${guardian.phone}`} className="font-black text-stone-700 dark:text-stone-300 hover:text-amber-600 transition-colors">
                      {guardian.phone}
                    </a>
                  </div>
                )}
                {guardian.email && (
                  <div className="flex items-center gap-3 text-xs">
                    <Icons.Email className="w-3.5 h-3.5 text-blue-500" />
                    <a href={`mailto:${guardian.email}`} className="font-medium text-stone-600 dark:text-stone-400 hover:text-blue-600 transition-colors">
                      {guardian.email}
                    </a>
                  </div>
                )}
                {(guardian.occupation || guardian.workplace) && (
                  <div className="flex items-center gap-3 text-xs">
                    <Icons.Work className="w-3.5 h-3.5 text-stone-400" />
                    <span className="text-stone-500">
                      {guardian.occupation} {guardian.workplace && `@ ${guardian.workplace}`}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-stone-50 dark:border-white/5">
                <Button
                  onClick={() => handleEdit(guardian)}
                  variant="ghost"
                  className="flex-1 font-black uppercase tracking-widest text-[9px] h-10 hover:bg-stone-50 dark:hover:bg-white/5"
                >
                  Chỉnh sửa
                </Button>
                <Button
                  onClick={() => setDeleteConfirm(guardian.id)}
                  variant="ghost"
                  className="flex-1 font-black uppercase tracking-widest text-[9px] h-10 text-red-500 hover:bg-red-500/10"
                >
                  Xóa hồ sơ
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[2000] transition-opacity duration-150 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] max-w-2xl w-full p-10 shadow-ultra border border-stone-200 dark:border-white/5 animate-in zoom-in-95 duration-500 my-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-amber-500 rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-amber-500/20">
                <Icons.Parents className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight">
                  {editingId ? 'Cập nhật Phụ huynh' : 'Thêm Phụ huynh mới'}
                </h2>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">Thông tin người giám hộ và liên lạc</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    Họ và Tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-12 bg-stone-50 dark:bg-stone-950 rounded-2xl border-stone-100 dark:border-white/10 px-4 font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-inner"
                    placeholder="VD: Nguyễn Văn A"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    Mối quan hệ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full h-12 bg-stone-50 dark:bg-stone-950 rounded-2xl border-stone-100 dark:border-white/10 px-4 font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-inner"
                    required
                  >
                    {relationships.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2 ml-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-12 bg-stone-50 dark:bg-stone-950 rounded-2xl border-stone-100 dark:border-white/10 px-4 font-medium text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-inner"
                    placeholder="0901 234 567"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2 ml-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-12 bg-stone-50 dark:bg-stone-950 rounded-2xl border-stone-100 dark:border-white/10 px-4 font-medium text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-inner"
                    placeholder="phuhuynh@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2 ml-1">Nghề nghiệp</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full h-12 bg-stone-50 dark:bg-stone-950 rounded-2xl border-stone-100 dark:border-white/10 px-4 font-medium text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2 ml-1">Nơi làm việc</label>
                  <input
                    type="text"
                    value={formData.workplace}
                    onChange={(e) => setFormData({ ...formData, workplace: e.target.value })}
                    className="w-full h-12 bg-stone-50 dark:bg-stone-950 rounded-2xl border-stone-100 dark:border-white/10 px-4 font-medium text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2 ml-1">Địa chỉ thường trú</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full bg-stone-50 dark:bg-stone-950 rounded-2xl border-stone-100 dark:border-white/10 p-4 font-medium text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-inner resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-4 bg-stone-50 dark:bg-white/[0.02] rounded-2xl border border-stone-100 dark:border-white/5 cursor-pointer hover:bg-stone-100 dark:hover:bg-white/5 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.is_primary_contact}
                    onChange={(e) => setFormData({ ...formData, is_primary_contact: e.target.checked })}
                    className="w-5 h-5 rounded-lg border-stone-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-[10px] font-black text-stone-600 dark:text-stone-300 uppercase tracking-widest">Liên hệ chính</span>
                </label>

                <label className="flex items-center gap-3 p-4 bg-stone-50 dark:bg-white/[0.02] rounded-2xl border border-stone-100 dark:border-white/5 cursor-pointer hover:bg-stone-100 dark:hover:bg-white/5 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.is_emergency_contact}
                    onChange={(e) => setFormData({ ...formData, is_emergency_contact: e.target.checked })}
                    className="w-5 h-5 rounded-lg border-stone-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-[10px] font-black text-stone-600 dark:text-stone-300 uppercase tracking-widest">Liên hệ khẩn cấp</span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2 ml-1">Ghi chú thêm</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full bg-stone-50 dark:bg-stone-950 rounded-2xl border-stone-100 dark:border-white/10 p-4 font-medium text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-inner resize-none"
                  placeholder="Thông tin bổ sung..."
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-stone-100 dark:border-white/5">
                <Button
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    setFormData(emptyForm)
                  }}
                  variant="outline"
                  fullWidth
                  disabled={saving}
                  className="font-black uppercase tracking-widest text-[11px] h-14 rounded-2xl border-stone-200"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  fullWidth
                  disabled={saving}
                  isLoading={saving}
                  className="font-black uppercase tracking-widest text-[11px] h-14 rounded-2xl shadow-amber-glow"
                >
                  {editingId ? 'Cập nhật ngay' : 'Thêm phụ huynh'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[2000] transition-opacity duration-150">
          <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] max-w-md w-full p-10 shadow-ultra border border-stone-200 dark:border-white/5 animate-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
              <Icons.Archive className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight mb-4">Xóa phụ huynh?</h2>
            <p className="text-stone-500 font-medium mb-8 leading-relaxed">
              Bạn có chắc chắn muốn xóa thông tin phụ huynh này không? Thao tác này sẽ gỡ bỏ liên hệ khỏi hồ sơ học sinh và không thể hoàn tác.
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => setDeleteConfirm(null)}
                variant="outline"
                fullWidth
                className="font-black uppercase tracking-widest text-[11px] h-14 rounded-2xl border-stone-200"
              >
                Giữ lại
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirm)}
                variant="danger"
                fullWidth
                className="font-black uppercase tracking-widest text-[11px] h-14 rounded-2xl shadow-lg"
              >
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
