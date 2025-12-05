/**
 * Modern User Management Page - Refactored with new UI components
 * 
 * Features:
 * - Clean, consistent UI using component library
 * - Better loading states and error handling
 * - Improved accessibility
 * - Audit trail integration
 * - Better UX with proper feedback
 */

"use client"

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { 
  Button, 
  Card,
  Badge, 
  LoadingState, 
  EmptyState, 
  Alert, 
  Input, 
  Table, 
  Modal 
} from '@/components/ui';
import { Select, Textarea, Checkbox } from '@/components/ui/form';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'teacher' | 'student';
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  phone?: string;
  department?: string;
  student_id?: string;
  grade_level?: string;
  notes?: string;
}

interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  admin_count: number;
  teacher_count: number;
  student_count: number;
  recent_signups: number;
}

const roleOptions = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'admin', label: 'Administrator' },
];

export default function UserManagementPage() {
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Filter states
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'student' as 'admin' | 'teacher' | 'student',
    phone: '',
    department: '',
    student_id: '',
    grade_level: '',
    notes: '',
    is_active: true
  });

  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: ''
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      logger.info('Fetching users', { roleFilter, activeFilter, searchQuery, page });
      
      const params = new URLSearchParams({
        role: roleFilter,
        isActive: activeFilter,
        search: searchQuery,
        page: page.toString(),
        limit: '20'
      });

      const response = await apiFetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data || data.users || []);
        setStats(data.statistics || null);
        setTotalPages(data.pagination?.pages || 1);
        logger.info('Users fetched successfully', { count: data.data?.length || 0 });
      } else {
        throw new Error(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMsg);
      logger.error('Error fetching users', { error: errorMsg });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, activeFilter, searchQuery, page]);

  // Fetch users when filters change
  useEffect(() => {
    fetchUsers();
  }, [roleFilter, activeFilter, searchQuery, page, fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (!formData.email || !formData.password || !formData.full_name) {
        throw new Error('Please fill in all required fields');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      logger.info('Creating user', { email: formData.email, role: formData.role });

      const response = await apiFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('User created successfully!');
        setShowCreateModal(false);
        resetForm();
        fetchUsers();
        
        // Log to audit trail (in production, get current admin user from session)
        logger.audit('User created', {}, { 
          newUserId: data.user?.id,
          email: formData.email,
          role: formData.role 
        });
      } else {
        throw new Error(data.error || 'Failed to create user');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMsg);
      logger.error('Error creating user', { error: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);
    setError(null);

    try {
      logger.info('Updating user', { userId: selectedUser.id, email: formData.email });

      const response = await apiFetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('User updated successfully!');
        setShowEditModal(false);
        setSelectedUser(null);
        resetForm();
        fetchUsers();
        
        logger.audit('User updated', {}, { 
          userId: selectedUser.id,
          changes: formData 
        });
      } else {
        throw new Error(data.error || 'Failed to update user');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update user';
      setError(errorMsg);
      logger.error('Error updating user', { error: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: passwordData.new_password })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Password reset successfully!');
        setShowResetPasswordModal(false);
        setSelectedUser(null);
        setPasswordData({ new_password: '', confirm_password: '' });
        
        logger.audit('Password reset', {}, { userId: selectedUser.id });
      } else {
        throw new Error(data.error || 'Failed to reset password');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to reset password';
      setError(errorMsg);
      logger.error('Error resetting password', { error: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    setLoading(true);
    setError(null);

    try {
      logger.info('Toggling user active status', { 
        userId: user.id, 
        currentStatus: user.is_active 
      });

      const response = await apiFetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, is_active: !user.is_active })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`User ${user.is_active ? 'deactivated' : 'activated'} successfully!`);
        fetchUsers();
        
        logger.audit('User status changed', {}, { 
          userId: user.id,
          newStatus: !user.is_active 
        });
      } else {
        throw new Error(data.error || 'Failed to toggle user status');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to toggle user status';
      setError(errorMsg);
      logger.error('Error toggling user status', { error: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: 'student',
      phone: '',
      department: '',
      student_id: '',
      grade_level: '',
      notes: '',
      is_active: true
    });
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '',
      full_name: user.full_name,
      role: user.role,
      phone: user.phone || '',
      department: user.department || '',
      student_id: user.student_id || '',
      grade_level: user.grade_level || '',
      notes: user.notes || '',
      is_active: user.is_active
    });
    setShowEditModal(true);
  };

  const openResetPasswordModal = (user: User) => {
    setSelectedUser(user);
    setPasswordData({ new_password: '', confirm_password: '' });
    setShowResetPasswordModal(true);
  };

  // Role badge color
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'teacher': return 'info';
      case 'student': return 'success';
      default: return 'default';
    }
  };

  // Render statistics cards
  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card padding="md">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.total_users}</p>
            <p className="text-sm text-gray-600 mt-1">Total Users</p>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{stats.active_users}</p>
            <p className="text-sm text-gray-600 mt-1">Active</p>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">{stats.teacher_count}</p>
            <p className="text-sm text-gray-600 mt-1">Teachers</p>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{stats.student_count}</p>
            <p className="text-sm text-gray-600 mt-1">Students</p>
          </div>
        </Card>
      </div>
    );
  };

  // Main render
  if (loading && users.length === 0) {
    return <LoadingState message="Loading users..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">Manage users, roles, and permissions</p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert 
          variant="error" 
          title="Error" 
          message={error}
          onClose={() => setError(null)}
          className="mb-4"
        />
      )}

      {success && (
        <Alert 
          variant="success" 
          title="Success" 
          message={success}
          onClose={() => setSuccess(null)}
          className="mb-4"
        />
      )}

      {/* Statistics */}
      {renderStats()}

      {/* Filters and Search */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<span>🔍</span>}
          />

          <Select
            placeholder="All Roles"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Roles' },
              ...roleOptions
            ]}
          />

          <Select
            placeholder="All Status"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'true', label: 'Active Only' },
              { value: 'false', label: 'Inactive Only' },
            ]}
          />

          <Button 
            variant="primary" 
            onClick={() => setShowCreateModal(true)}
            leftIcon={<span>+</span>}
            fullWidth
          >
            Add User
          </Button>
        </div>
      </Card>

      {/* User Table */}
      {users.length === 0 ? (
        <EmptyState
          icon={<span className="text-6xl">👥</span>}
          title="No users found"
          description="Try adjusting your search or filters"
          action={
            <Button onClick={() => {
              setSearchQuery('');
              setRoleFilter('all');
              setActiveFilter('all');
            }}>
              Clear Filters
            </Button>
          }
        />
      ) : (
        <Card padding="none">
          <Table
            data={users}
            keyExtractor={(user) => user.id}
            columns={[
              {
                key: 'full_name',
                label: 'Name',
                render: (user) => (
                  <div>
                    <p className="font-medium text-gray-900">{user.full_name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                )
              },
              {
                key: 'role',
                label: 'Role',
                render: (user) => (
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                )
              },
              {
                key: 'is_active',
                label: 'Status',
                render: (user) => (
                  <Badge variant={user.is_active ? 'success' : 'default'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                )
              },
              {
                key: 'last_login_at',
                label: 'Last Login',
                render: (user) => (
                  <span className="text-sm text-gray-600">
                    {user.last_login_at 
                      ? new Date(user.last_login_at).toLocaleDateString() 
                      : 'Never'}
                  </span>
                )
              },
              {
                key: 'actions',
                label: 'Actions',
                render: (user) => (
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => openEditModal(user)}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => openResetPasswordModal(user)}
                    >
                      Reset Password
                    </Button>
                    <Button 
                      size="sm" 
                      variant={user.is_active ? 'danger' : 'success'}
                      onClick={() => handleToggleActive(user)}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                )
              }
            ]}
          />
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New User"
        size="lg"
      >
        <form onSubmit={handleCreateUser}>
          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="user@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              hint="Minimum 6 characters"
            />

            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />

            <Select
              label="Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              options={roleOptions}
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              placeholder="(123) 456-7890"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            {formData.role === 'teacher' && (
              <Input
                label="Department"
                type="text"
                placeholder="Mathematics, Science, etc."
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            )}

            {formData.role === 'student' && (
              <>
                <Input
                  label="Student ID"
                  type="text"
                  placeholder="STU-12345"
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                />
                <Input
                  label="Grade Level"
                  type="text"
                  placeholder="10, 11, 12"
                  value={formData.grade_level}
                  onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                />
              </>
            )}

            <Textarea
              label="Notes"
              placeholder="Additional information..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />

            <Checkbox
              label="Active"
              description="User can log in and access the system"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
          resetForm();
        }}
        title="Edit User"
        size="lg"
      >
        <form onSubmit={handleUpdateUser}>
          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              label="Full Name"
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />

            <Select
              label="Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              options={roleOptions}
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            {formData.role === 'teacher' && (
              <Input
                label="Department"
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            )}

            {formData.role === 'student' && (
              <>
                <Input
                  label="Student ID"
                  type="text"
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                />
                <Input
                  label="Grade Level"
                  type="text"
                  value={formData.grade_level}
                  onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                />
              </>
            )}

            <Textarea
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />

            <Checkbox
              label="Active"
              description="User can log in and access the system"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedUser(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={showResetPasswordModal}
        onClose={() => {
          setShowResetPasswordModal(false);
          setSelectedUser(null);
          setPasswordData({ new_password: '', confirm_password: '' });
        }}
        title="Reset Password"
        size="md"
      >
        <form onSubmit={handleResetPassword}>
          <div className="space-y-4">
            <Alert 
              variant="info" 
              title="Password Reset" 
              message={`You are resetting the password for ${selectedUser?.full_name}`}
            />

            <Input
              label="New Password"
              type="password"
              placeholder="At least 6 characters"
              value={passwordData.new_password}
              onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
              required
              hint="Minimum 6 characters"
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter password"
              value={passwordData.confirm_password}
              onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
              required
              error={
                passwordData.confirm_password && 
                passwordData.new_password !== passwordData.confirm_password 
                  ? 'Passwords do not match' 
                  : undefined
              }
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowResetPasswordModal(false);
                setSelectedUser(null);
                setPasswordData({ new_password: '', confirm_password: '' });
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="danger" isLoading={loading}>
              Reset Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
