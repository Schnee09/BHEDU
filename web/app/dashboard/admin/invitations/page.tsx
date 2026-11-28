'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CheckIcon,
  ClipboardIcon,
  EnvelopeIcon,
  PhoneIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { ResponsiveTable, MobileCard, MobileCardList } from '@/components/ui/ResponsiveTable';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { getRoleLabel } from '@/lib/role-utils';
import { AdminTable, Column } from '../_components/AdminTable';
import { ConfirmDialog } from '../_components/Alert';
import { CrudModal } from '../_components/CrudModal';
import { Badge, FormField, Input, Select } from '../_components/FormElements';

interface Invitation {
  id: string;
  email: string | null;
  phone: string | null;
  role: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  invited_by: { full_name: string } | null;
}

interface AssignableRole {
  code: string;
  name: string;
  assignable?: boolean;
}

const initialFormData = { email: '', phone: '', role: '', expires_in_days: 7 };

export default function InvitationsPage() {
  const { toasts, removeToast, error: showError, success: showSuccess } = useToast();
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [assignableRoles, setAssignableRoles] = useState<AssignableRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [pendingRevoke, setPendingRevoke] = useState<Invitation | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const fetchInvites = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/invitations');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể tải danh sách lời mời.');
      setInvites(data.invites || []);
      const roles = (data.assignable_roles || []) as AssignableRole[];
      setAssignableRoles(roles);
      setFormData((current) => ({
        ...current,
        role: roles.some((role) => role.code === current.role)
          ? current.role
          : roles[0]?.code || '',
      }));
    } catch (error) {
      showError('Không thể tải lời mời', error instanceof Error ? error.message : undefined);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    // Fetch callbacks update state only after their network requests resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchInvites();
  }, [fetchInvites]);

  const roleLabel = (code: string) =>
    assignableRoles.find((role) => role.code === code)?.name || getRoleLabel(code);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.role) {
      showError(
        'Chưa có vai trò phù hợp',
        'Tài khoản của bạn chưa được phép gửi lời mời cho vai trò nào.'
      );
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể tạo lời mời.');
      setIsModalOpen(false);
      setFormData({ ...initialFormData, role: assignableRoles[0]?.code || '' });
      showSuccess('Đã tạo lời mời', 'Bạn có thể sao chép liên kết và gửi cho người nhận.');
      await fetchInvites();
    } catch (error) {
      showError('Không thể tạo lời mời', error instanceof Error ? error.message : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = async (token: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/signup?token=${token}`);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch {
      showError('Không thể sao chép liên kết', 'Vui lòng thử lại.');
    }
  };

  const handleRevoke = async () => {
    if (!pendingRevoke) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/admin/invitations/${pendingRevoke.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể thu hồi lời mời.');
      setInvites((current) => current.filter((invite) => invite.id !== pendingRevoke.id));
      setPendingRevoke(null);
      showSuccess('Đã thu hồi lời mời');
    } catch (error) {
      showError('Không thể thu hồi lời mời', error instanceof Error ? error.message : undefined);
    } finally {
      setRevoking(false);
    }
  };

  const inviteActions = (item: Invitation, mobile = false) => (
    <div className={mobile ? 'grid grid-cols-2 gap-2' : 'flex items-center gap-3'}>
      <button
        type="button"
        onClick={() => void copyToClipboard(item.token)}
        aria-label={`Sao chép liên kết mời cho ${item.email || item.phone}`}
        className={`cursor-pointer rounded-lg text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${mobile ? 'flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold' : 'p-2'}`}
      >
        {copiedToken === item.token ? (
          <CheckIcon className="h-4 w-4" />
        ) : (
          <ClipboardIcon className="h-4 w-4" />
        )}
        {mobile && (copiedToken === item.token ? 'Đã sao chép' : 'Sao chép link')}
      </button>
      {!item.used_at && (
        <button
          type="button"
          onClick={() => setPendingRevoke(item)}
          aria-label={`Thu hồi lời mời của ${item.email || item.phone}`}
          className={`cursor-pointer rounded-lg text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${mobile ? 'flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold' : 'p-2'}`}
        >
          <TrashIcon className="h-4 w-4" />
          {mobile && 'Thu hồi'}
        </button>
      )}
    </div>
  );

  const columns: Column<Invitation>[] = [
    {
      key: 'email',
      label: 'Đối tượng',
      render: (_, item) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">
            {item.email || item.phone || 'Chưa có thông tin'}
          </span>
          <span className="text-xs text-gray-500">{item.email ? 'Email' : 'Số điện thoại'}</span>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Vai trò',
      render: (role) => <Badge variant="info">{roleLabel(role as string)}</Badge>,
    },
    {
      key: 'used_at',
      label: 'Trạng thái',
      render: (usedAt, item) => {
        if (usedAt) return <Badge variant="success">Đã sử dụng</Badge>;
        if (new Date(item.expires_at) < new Date()) return <Badge variant="error">Hết hạn</Badge>;
        return <Badge variant="warning">Đang chờ</Badge>;
      },
    },
    {
      key: 'expires_at',
      label: 'Ngày hết hạn',
      render: (date) => new Date(date as string).toLocaleDateString('vi-VN'),
    },
    { key: 'token', label: 'Thao tác', render: (_, item) => inviteActions(item) },
  ];

  const renderMobileView = () => (
    <MobileCardList>
      {invites.map((item) => {
        const isExpired = new Date(item.expires_at) < new Date();
        return (
          <MobileCard
            key={item.id}
            title={item.email || item.phone || 'Chưa có thông tin'}
            subtitle={
              <div className="flex items-center gap-2">
                {item.email ? (
                  <EnvelopeIcon className="h-3 w-3" />
                ) : (
                  <PhoneIcon className="h-3 w-3" />
                )}
                <span>{roleLabel(item.role)}</span>
              </div>
            }
            status={{
              label: item.used_at ? 'Đã sử dụng' : isExpired ? 'Hết hạn' : 'Đang chờ',
              color: item.used_at ? 'green' : isExpired ? 'red' : 'yellow',
            }}
            fields={[
              {
                label: 'Ngày hết hạn',
                value: new Date(item.expires_at).toLocaleDateString('vi-VN'),
              },
              { label: 'Người mời', value: item.invited_by?.full_name || 'Hệ thống' },
            ]}
            actions={inviteActions(item, true)}
          />
        );
      })}
    </MobileCardList>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            Quản lý lời mời
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tạo và theo dõi lời mời tham gia hệ thống
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={assignableRoles.length === 0}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-500/25 transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlusIcon className="h-5 w-5" /> Tạo lời mời
        </button>
      </div>

      <div className="overflow-hidden rounded-[32px] bg-white/50 backdrop-blur-sm dark:bg-transparent">
        <ResponsiveTable mobileView={renderMobileView()}>
          <AdminTable
            data={invites}
            columns={columns}
            loading={loading}
            emptyMessage="Chưa có lời mời nào."
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
          <FormField label="Địa chỉ email">
            <Input
              type="email"
              value={formData.email}
              onChange={(event) => setFormData({ ...formData, email: event.target.value })}
              placeholder="example@email.com"
            />
          </FormField>
          <div className="text-center text-xs text-gray-400">HOẶC</div>
          <FormField label="Số điện thoại">
            <Input
              type="tel"
              value={formData.phone}
              onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
              placeholder="09xx xxx xxx"
            />
          </FormField>
          <hr className="border-gray-100" />
          <FormField label="Vai trò được mời" required>
            <Select
              value={formData.role}
              onChange={(event) => setFormData({ ...formData, role: event.target.value })}
              options={assignableRoles.map((role) => ({ value: role.code, label: role.name }))}
            />
          </FormField>
          <FormField label="Thời hạn (ngày)" required>
            <Input
              type="number"
              min={1}
              max={30}
              value={formData.expires_in_days}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  expires_in_days: Number.parseInt(event.target.value, 10) || 1,
                })
              }
            />
          </FormField>
        </div>
      </CrudModal>

      <ConfirmDialog
        isOpen={Boolean(pendingRevoke)}
        title="Thu hồi lời mời?"
        message={`Liên kết mời của ${pendingRevoke?.email || pendingRevoke?.phone || 'người nhận này'} sẽ không thể sử dụng sau khi thu hồi.`}
        variant="danger"
        confirmLabel="Thu hồi"
        cancelLabel="Giữ lại"
        loading={revoking}
        onConfirm={() => void handleRevoke()}
        onCancel={() => setPendingRevoke(null)}
      />
    </div>
  );
}
