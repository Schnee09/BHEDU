"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'teacher' | 'student'
  is_active: boolean
  last_login_at: string | null
  created_at: string
  phone?: string
  department?: string
  student_id?: string
  grade_level?: string
  notes?: string
}

interface UserStats {
  total_users: number
  active_users: number
  inactive_users: number
  admin_count: number
  teacher_count: number
  student_count: number
  recent_signups: number
}

export default function UserManagementPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [roleFilter, setRoleFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'student' as 'admin' | 'teacher' | 'student',
    phone: '',
    department: '',
    student_id: '',
    grade_level: '',
    notes: '',
    is_active: true
  })

  useEffect(() => {
    fetchUsers()
  }, [roleFilter, activeFilter, searchQuery, page])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        role: roleFilter,
        isActive: activeFilter,
        search: searchQuery,
        page: page.toString(),
        limit: '20'
      })

      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()

      if (data.success) {
        setUsers(data.data)
        setStats(data.statistics)
        setTotalPages(data.pagination.pages)
      } else {
        console.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        alert('User created successfully!')
        setShowCreateModal(false)
        resetForm()
        fetchUsers()
      } else {
        alert('Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        alert('User updated successfully!')
        setShowEditModal(false)
        setSelectedUser(null)
        resetForm()
        fetchUsers()
      } else {
        alert('Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt('Enter new password (min 6 characters):')
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    if (!confirm('Are you sure you want to reset this user\'s password?')) return

    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword })
      })

      const data = await response.json()

      if (data.success) {
        alert('Password reset successfully!')
      } else {
        alert('Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      alert('Failed to reset password')
    }
  }

  const handleToggleActive = async (user: User) => {
    if (!confirm(`Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} this user?`)) return

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, is_active: !user.is_active })
      })

      const data = await response.json()

      if (data.success) {
        alert(`User ${user.is_active ? 'deactivated' : 'activated'} successfully!`)
        fetchUsers()
      } else {
        alert('Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      alert('Failed to update user status')
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      password: '',
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      phone: user.phone || '',
      department: user.department || '',
      student_id: user.student_id || '',
      grade_level: user.grade_level || '',
      notes: user.notes || '',
      is_active: user.is_active
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'student',
      phone: '',
      department: '',
      student_id: '',
      grade_level: '',
      notes: '',
      is_active: true
    })
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'teacher': return 'bg-blue-100 text-blue-800'
      case 'student': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-amber-900">User Management</h1>
        <p className="text-amber-700 mt-1">Manage users, roles, and permissions</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-amber-500">
            <div className="text-sm text-gray-600">Total Users</div>
            <div className="text-2xl font-bold text-amber-900">{stats.total_users}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="text-sm text-gray-600">Active Users</div>
            <div className="text-2xl font-bold text-green-700">{stats.active_users}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <div className="text-sm text-gray-600">Admins</div>
            <div className="text-2xl font-bold text-red-700">{stats.admin_count}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="text-sm text-gray-600">Teachers</div>
            <div className="text-2xl font-bold text-blue-700">{stats.teacher_count}</div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="Search by name, email, or student ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          />
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>

          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:shadow-lg transition font-semibold"
          >
            + Create User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No users found</div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gradient-to-r from-amber-50 to-yellow-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-amber-900 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-amber-900 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-amber-900 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-amber-900 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-amber-900 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-amber-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white font-semibold">
                          {user.first_name[0]}{user.last_name[0]}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.student_id && <div className="text-xs text-gray-400">ID: {user.student_id}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-amber-600 hover:text-amber-900 font-medium mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        className="text-blue-600 hover:text-blue-900 font-medium mr-3"
                      >
                        Reset PW
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`font-medium ${
                          user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-amber-900">Create New User</h2>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="Min 6 characters"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {formData.role === 'teacher' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              {formData.role === 'student' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                    <input
                      type="text"
                      value={formData.student_id}
                      onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                    <input
                      type="text"
                      value={formData.grade_level}
                      onChange={(e) => setFormData({...formData, grade_level: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      placeholder="e.g., 9, 10, 11, 12"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Active (user can login)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:shadow-lg transition font-semibold disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal - Similar structure to Create, reusing the form */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-amber-900">Edit User</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedUser.email}</p>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              {/* Same form fields as Create, but password is optional */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {formData.role === 'teacher' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              {formData.role === 'student' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                    <input
                      type="text"
                      value={formData.student_id}
                      onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                    <input
                      type="text"
                      value={formData.grade_level}
                      onChange={(e) => setFormData({...formData, grade_level: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="edit_is_active" className="ml-2 text-sm text-gray-700">
                  Active (user can login)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:shadow-lg transition font-semibold disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update User'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedUser(null); resetForm(); }}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
