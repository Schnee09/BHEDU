'use client';

import { useEffect, useState } from 'react';
import { AdminTable, Column } from '../_components/AdminTable';
import { CrudModal } from '../_components/CrudModal';
import { FormField, Input, Select, Badge } from '../_components/FormElements';
import { ResponsiveTable, MobileCard, MobileCardList } from '@/components/ui/ResponsiveTable';
import { getRoleLabel, getInvitableRoles, UserRole } from '@/lib/role-utils';
import {
  PlusIcon,
  ClipboardIcon,
  CheckIcon,
  EnvelopeIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';

interface Invitation {
  id: string;
  email: string | null;
  phone: string | null;
  role: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  invited_by: {
    full_name: string;
  } | null;
}

export default function InvitationsPage() {
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    role: 'staff' as UserRole,
    expires_in_days: 7,
  });

  const fetchInvites = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/invitations');
      const data = await res.json();
      setInvites(data.invites || []);
    } catch (error) {
      console.error('Error fetching invites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ email: '', phone: '', role: 'admin' as UserRole, expires_in_days: 7 });
        fetchInvites();
      }
    } catch (error) {
      console.error('Error creating invite:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/signup?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const columns: Column<Invitation>[] = [
    {
      key: 'email',
      label: 'Đối tượng',
      render: (_, item) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{item.email || item.phone || 'N/A'}</span>
          <span className="text-xs text-gray-500">{item.email ? 'Email' : 'Số điện thoại'}</span>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Vai trò',
      render: (role) => <Badge variant="info">{getRoleLabel(role as string)}</Badge>,
    },
    {
      key: 'used_at',
      label: 'Trạng thái',
      render: (used_at, item) => {
        const isExpired = new Date(item.expires_at) < new Date();
        if (used_at) return <Badge variant="success">Đã sử dụng</Badge>;
        if (isExpired) return <Badge variant="error">Hết hạn</Badge>;
        return <Badge variant="warning">Đang chờ</Badge>;
      },
    },
    {
      key: 'expires_at',
      label: 'Ngày hết hạn',
      render: (date) => new Date(date as string).toLocaleDateString('vi-VN'),
    },
    {
      key: 'token',
      label: 'Liên kết mời',
      render: (token) => (
        <button
          onClick={() => copyToClipboard(token as string)}
          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors"
        >
          {copiedToken === token ? (
            <CheckIcon className="w-4 h-4" />
          ) : (
            <ClipboardIcon className="w-4 h-4" />
          )}
          <span className="text-xs font-medium">
            {copiedToken === token ? 'Đã chép' : 'Sao chép link'}
          </span>
        </button>
      ),
    },
  ];

  const renderMobileView = () => (
    <MobileCardList>
      {invites.map((item) => {
        const isExpired = new Date(item.expires_at) < new Date();
        const statusLabel = item.used_at ? 'Đã dùng' : isExpired ? 'Hết hạn' : 'Đang chờ';
        const statusColor = item.used_at ? 'green' : isExpired ? 'red' : 'yellow';

        return (
          <MobileCard
            key={item.id}
            title={item.email || item.phone || 'N/A'}
            subtitle={
              <div className="flex items-center gap-2">
                {item.email ? (
                  <EnvelopeIcon className="w-3 h-3" />
                ) : (
                  <PhoneIcon className="w-3 h-3" />
                )}
                <span>{getRoleLabel(item.role)}</span>
              </div>
            }
            status={{ label: statusLabel, color: statusColor as any }}
            fields={[
              {
                label: 'Ngày hết hạn',
                value: new Date(item.expires_at).toLocaleDateString('vi-VN'),
              },
              { label: 'Người mời', value: item.invited_by?.full_name || 'Hệ thống' },
            ]}
            actions={
              <button
                onClick={() => copyToClipboard(item.token)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm press-effect"
              >
                {copiedToken === item.token ? (
                  <CheckIcon className="w-4 h-4" />
                ) : (
                  <ClipboardIcon className="w-4 h-4" />
                )}
                {copiedToken === item.token ? 'Đã chép link' : 'Sao chép link mời'}
              </button>
            }
          />
        );
      })}
    </MobileCardList>
  );

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Quản lý lời mời
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tạo và theo dõi các lời mời tham gia hệ thống
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 active:scale-95"
        >
          <PlusIcon className="w-5 h-5" />
          Tạo lời mời
        </button>
      </div>

      <div className="bg-white/50 dark:bg-transparent backdrop-blur-sm rounded-[32px] overflow-hidden">
        <ResponsiveTable mobileView={renderMobileView()}>
          <AdminTable
            data={invites}
            columns={columns}
            loading={loading}
            emptyMessage="Chưa có lời mời nào được tạo."
          />
        </ResponsiveTable>
      </div>

      <CrudModal
        isOpen={isModalOpen}
        title="Tạo lời mời mới"
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        loading={submitting}
        submitLabel="Tạo lời mời"
      >
        <div className="space-y-4">
          <FormField label="Địa chỉ Email">
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="example@email.com"
            />
          </FormField>
          <div className="text-center text-xs text-gray-400">HOẶC</div>
          <FormField label="Số điện thoại">
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="09xxx..."
            />
          </FormField>
          <hr className="border-gray-100" />
          <FormField label="Vai trò được mời" required>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              options={getInvitableRoles().map((r) => ({
                value: r,
                label: getRoleLabel(r),
              }))}
            />
          </FormField>
          <FormField label="Thời hạn (ngày)" required>
            <Input
              type="number"
              min={1}
              max={30}
              value={formData.expires_in_days}
              onChange={(e) =>
                setFormData({ ...formData, expires_in_days: parseInt(e.target.value) })
              }
            />
          </FormField>
        </div>
      </CrudModal>
    </div>
  );
}
