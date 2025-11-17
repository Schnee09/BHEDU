'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'
import { showToast } from '@/components/ToastProvider'

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
  }, [studentId])

  const loadGuardians = async () => {
    try {
      setLoading(true)
      const response = await apiFetch(`/api/admin/students/${studentId}/guardians`)
      if (response.ok) {
        const result = await response.json()
        setGuardians(result.data || [])
      } else {
        showToast.error('Failed to load guardians')
      }
    } catch (error) {
      console.error('Failed to load guardians:', error)
      showToast.error('Failed to load guardians')
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
      showToast.error('Guardian name is required')
      return
    }

    setSaving(true)
    const loadingToast = showToast.loading(editingId ? 'Updating guardian...' : 'Adding guardian...')

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
        showToast.success(editingId ? 'Guardian updated!' : 'Guardian added!')
        setShowForm(false)
        setEditingId(null)
        setFormData(emptyForm)
        loadGuardians()
      } else {
        showToast.error(result.error || 'Failed to save guardian')
      }
    } catch (error) {
      showToast.dismiss(loadingToast)
      console.error('Failed to save guardian:', error)
      showToast.error('Failed to save guardian')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const loadingToast = showToast.loading('Deleting guardian...')

    try {
      const response = await apiFetch(`/api/admin/students/${studentId}/guardians/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      showToast.dismiss(loadingToast)

      if (response.ok) {
        showToast.success('Guardian deleted successfully')
        setDeleteConfirm(null)
        loadGuardians()
      } else {
        showToast.error(result.error || 'Failed to delete guardian')
      }
    } catch (error) {
      showToast.dismiss(loadingToast)
      console.error('Failed to delete guardian:', error)
      showToast.error('Failed to delete guardian')
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading guardians...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Guardians & Contacts</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + Add Guardian
        </button>
      </div>

      {guardians.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">No guardians added yet</p>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add First Guardian
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guardians.map((guardian) => (
            <div
              key={guardian.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{guardian.name}</h3>
                  <p className="text-sm text-gray-600 capitalize">{guardian.relationship}</p>
                </div>
                <div className="flex gap-2">
                  {guardian.is_primary_contact && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Primary</span>
                  )}
                  {guardian.is_emergency_contact && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Emergency</span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                {guardian.phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">📞</span>
                    <a href={`tel:${guardian.phone}`} className="text-blue-600 hover:underline">
                      {guardian.phone}
                    </a>
                  </div>
                )}
                {guardian.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">✉️</span>
                    <a href={`mailto:${guardian.email}`} className="text-blue-600 hover:underline">
                      {guardian.email}
                    </a>
                  </div>
                )}
                {guardian.occupation && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">💼</span>
                    <span>{guardian.occupation}</span>
                  </div>
                )}
                {guardian.workplace && (
                  <div className="text-xs text-gray-600 ml-6">@ {guardian.workplace}</div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleEdit(guardian)}
                  className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(guardian.id)}
                  className="flex-1 px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Edit Guardian' : 'Add New Guardian'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="mother">Mother</option>
                    <option value="father">Father</option>
                    <option value="guardian">Guardian</option>
                    <option value="grandparent">Grandparent</option>
                    <option value="sibling">Sibling</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Workplace</label>
                  <input
                    type="text"
                    value={formData.workplace}
                    onChange={(e) => setFormData({ ...formData, workplace: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Phone</label>
                  <input
                    type="tel"
                    value={formData.work_phone}
                    onChange={(e) => setFormData({ ...formData, work_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_primary_contact}
                    onChange={(e) => setFormData({ ...formData, is_primary_contact: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Set as primary contact</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_emergency_contact}
                    onChange={(e) => setFormData({ ...formData, is_emergency_contact: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Set as emergency contact</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional information..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Guardian' : 'Add Guardian'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    setFormData(emptyForm)
                  }}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Guardian?</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this guardian? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
