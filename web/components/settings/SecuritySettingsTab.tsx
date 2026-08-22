'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Laptop,
  Smartphone,
  Globe,
  KeyRound,
  Lock,
  LogOut,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  RefreshCw,
  Eye,
  FileText,
} from 'lucide-react';
import { SecuritySession, ActivityLog } from '@/lib/settings/types';
import { apiFetch } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

interface SecuritySettingsTabProps {
  sessions: SecuritySession[];
  logs: ActivityLog[];
  onLogoutSession: (sessionId: string) => void;
  onLogoutOthers: () => void;
}

export function SecuritySettingsTab({
  sessions,
  logs: initialLogs,
  onLogoutSession,
  onLogoutOthers,
}: SecuritySettingsTabProps) {
  const toast = useToast();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logFilterAction, setLogFilterAction] = useState<string>('all');
  const [logFilterResource, setLogFilterResource] = useState<string>('all');
  const [logSearch, setLogSearch] = useState<string>('');

  // Security Policy State (stored in local or school_settings)
  const [sessionTimeout, setSessionTimeout] = useState<string>('24');
  const [requireStrongPassword, setRequireStrongPassword] = useState<boolean>(true);
  const [enforce2FA, setEnforce2FA] = useState<boolean>(false);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState<string>('5');
  const [savingPolicy, setSavingPolicy] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
    fetchSecurityPolicy();
  }, [logFilterAction, logFilterResource]);

  const fetchSecurityPolicy = async () => {
    try {
      const res = await apiFetch('/api/admin/settings');
      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json) ? json : json?.data || [];
        const policySetting = data.find((s: any) => (s.key || s.setting_key) === 'security_policy');
        if (policySetting && policySetting.value) {
          try {
            const parsed = JSON.parse(policySetting.value);
            if (parsed.sessionTimeout) setSessionTimeout(String(parsed.sessionTimeout));
            if (parsed.requireStrongPassword !== undefined) setRequireStrongPassword(parsed.requireStrongPassword);
            if (parsed.enforce2FA !== undefined) setEnforce2FA(parsed.enforce2FA);
            if (parsed.maxLoginAttempts) setMaxLoginAttempts(String(parsed.maxLoginAttempts));
          } catch {
            // Ignore parse error
          }
        }
      }
    } catch (e) {
      console.error('[SecuritySettings] Fetch policy error:', e);
    }
  };

  const handleSavePolicy = async () => {
    setSavingPolicy(true);
    try {
      const policyData = {
        sessionTimeout: parseInt(sessionTimeout) || 24,
        requireStrongPassword,
        enforce2FA,
        maxLoginAttempts: parseInt(maxLoginAttempts) || 5,
      };

      const res = await apiFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [
            {
              key: 'security_policy',
              value: JSON.stringify(policyData),
              description: 'Chính sách bảo mật hệ thống và phiên làm việc',
            },
          ],
        }),
      });

      if (!res.ok) throw new Error('Failed to save security policy');
      toast.success('Thành công', 'Chính sách bảo mật đã được cập nhật');
    } catch {
      toast.error('Lỗi', 'Không thể lưu chính sách bảo mật');
    } finally {
      setSavingPolicy(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '30');
      if (logFilterAction !== 'all') params.set('action', logFilterAction);
      if (logFilterResource !== 'all') params.set('resource_type', logFilterResource);

      const res = await apiFetch(`/api/admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setAuditLogs(Array.isArray(json.data) ? json.data : []);
      }
    } catch (err) {
      console.error('[SecuritySettingsTab] Fetch audit logs error:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (!logSearch.trim()) return true;
    const q = logSearch.toLowerCase();
    return (
      (log.user_email || '').toLowerCase().includes(q) ||
      (log.action || '').toLowerCase().includes(q) ||
      (log.resource_type || log.resource || '').toLowerCase().includes(q) ||
      (log.description || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Top Section: Active Sessions & Policy Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Active Sessions Bento Card (7 cols) */}
        <div className="lg:col-span-7 p-8 rounded-[32px] bg-white dark:bg-stone-900/60 border border-stone-100 dark:border-white/5 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-white/5 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-950 dark:text-white">
                  Phiên đăng nhập hoạt động
                </h3>
                <p className="text-xs text-stone-500">
                  Các thiết bị và trình duyệt hiện đang truy cập tài khoản
                </p>
              </div>
            </div>
            <button
              onClick={onLogoutOthers}
              className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Đăng xuất thiết bị khác
            </button>
          </div>

          <div className="space-y-3">
            {sessions.map((session, idx) => (
              <div
                key={session.id || idx}
                className={cn(
                  'p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all',
                  session.current
                    ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20'
                    : 'bg-stone-50 dark:bg-white/[0.02] border-stone-100 dark:border-white/5'
                )}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={cn(
                      'p-2.5 rounded-xl',
                      session.current
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                        : 'bg-stone-200/60 dark:bg-white/10 text-stone-500'
                    )}
                  >
                    {session.device?.includes('Phone') ? (
                      <Smartphone className="w-4 h-4" />
                    ) : (
                      <Laptop className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {session.device || 'Trình duyệt Web'} &bull; {session.browser}
                      </span>
                      {session.current && (
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full">
                          Hiện tại
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-stone-400 mt-0.5">
                      IP: {session.ip} &bull; {session.location || 'Việt Nam'}
                    </p>
                  </div>
                </div>

                {!session.current && (
                  <button
                    onClick={() => onLogoutSession(session.id || session.device)}
                    className="p-2 text-stone-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-xs font-bold"
                    title="Đăng xuất phiên này"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Security Policies Card (5 cols) */}
        <div className="lg:col-span-5 p-8 rounded-[32px] bg-white dark:bg-stone-900/60 border border-stone-100 dark:border-white/5 space-y-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-3.5 border-b border-stone-100 dark:border-white/5 pb-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-950 dark:text-white">
                  Chính sách bảo mật
                </h3>
                <p className="text-xs text-stone-500">Cấu hình thời gian phiên và kiểm soát truy cập</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Thời gian hết hạn phiên làm việc
                </label>
                <select
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-white/[0.03] border border-stone-200 dark:border-white/10 rounded-2xl font-bold text-sm text-stone-800 dark:text-stone-200 outline-none"
                >
                  <option value="1">1 Giờ (Bảo mật tối đa)</option>
                  <option value="8">8 Giờ (Một ngày làm việc)</option>
                  <option value="24">24 Giờ (Mặc định)</option>
                  <option value="168">7 Ngày (Thiết bị cá nhân)</option>
                </select>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-white/[0.02] border border-stone-100 dark:border-white/5 cursor-pointer">
                  <div>
                    <span className="font-bold text-xs text-stone-900 dark:text-white block">
                      Yêu cầu mật khẩu mạnh
                    </span>
                    <span className="text-[10px] text-stone-400">
                      Tối thiểu 8 ký tự, gồm chữ hoa, thường và số
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={requireStrongPassword}
                    onChange={(e) => setRequireStrongPassword(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500/20"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-white/[0.02] border border-stone-100 dark:border-white/5 cursor-pointer">
                  <div>
                    <span className="font-bold text-xs text-stone-900 dark:text-white block">
                      Bắt buộc 2FA cho Quản trị viên
                    </span>
                    <span className="text-[10px] text-stone-400">
                      Yêu cầu mã OTP khi đăng nhập role Admin
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enforce2FA}
                    onChange={(e) => setEnforce2FA(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500/20"
                  />
                </label>
              </div>
            </div>
          </div>

          <button
            onClick={handleSavePolicy}
            disabled={savingPolicy}
            className="w-full py-3 bg-stone-900 dark:bg-amber-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {savingPolicy ? 'Đang lưu chính sách...' : 'Cập nhật chính sách'}
          </button>
        </div>
      </div>

      {/* Bottom Section: Audit Logs Table */}
      <div className="p-8 md:p-10 rounded-[32px] bg-white dark:bg-stone-900/60 border border-stone-100 dark:border-white/5 space-y-6 shadow-sm">
        {/* Audit Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 dark:border-white/5 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-stone-950 dark:text-white">
                Nhật ký thao tác hệ thống (Audit Logs)
              </h3>
              <p className="text-xs text-stone-500">
                Ghi nhận mọi thao tác thêm, sửa, xóa dữ liệu và đăng nhập vào hệ thống
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm email, hành động..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20 outline-none w-48"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <select
              value={logFilterAction}
              onChange={(e) => setLogFilterAction(e.target.value)}
              className="px-3 py-2 bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 outline-none"
            >
              <option value="all">Tất cả hành động</option>
              <option value="CREATE">Tạo mới (CREATE)</option>
              <option value="UPDATE">Cập nhật (UPDATE)</option>
              <option value="DELETE">Xóa (DELETE)</option>
              <option value="LOGIN">Đăng nhập (LOGIN)</option>
            </select>

            <button
              onClick={fetchAuditLogs}
              disabled={loadingLogs}
              className="p-2 bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-600 dark:text-stone-300 rounded-xl transition-colors"
              title="Tải lại nhật ký"
            >
              <RefreshCw className={cn('w-4 h-4', loadingLogs ? 'animate-spin' : '')} />
            </button>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-100 dark:border-white/5 text-[10px] font-black text-stone-400 uppercase tracking-wider">
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Người thực hiện</th>
                <th className="py-3 px-4">Hành động</th>
                <th className="py-3 px-4">Tài nguyên</th>
                <th className="py-3 px-4">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-white/5">
              {filteredLogs.map((log, i) => {
                const actionBadgeColor = log.action?.includes('CREATE')
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : log.action?.includes('UPDATE')
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : log.action?.includes('DELETE')
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : 'bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400';

                const logTime = log.created_at || log.timestamp || log.date;
                const formattedTime = logTime
                  ? new Date(logTime).toLocaleString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : 'Vừa xong';

                return (
                  <tr
                    key={log.id || i}
                    className="hover:bg-stone-50/80 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                      {formattedTime}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span>{log.user_email || log.user?.email || 'Hệ thống'}</span>
                        <span className="text-[9px] font-mono text-stone-400 lowercase">
                          {log.user_role || 'system'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider font-mono',
                          actionBadgeColor
                        )}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-stone-700 dark:text-stone-300">
                      {log.resource_type || log.resource || log.entity_type || 'SYSTEM'}
                    </td>
                    <td className="py-3.5 px-4 text-stone-500 font-medium max-w-xs truncate">
                      {log.description ||
                        (log.metadata ? JSON.stringify(log.metadata) : 'Thao tác thành công')}
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400 font-medium">
                    {loadingLogs
                      ? 'Đang tải dữ liệu nhật ký...'
                      : 'Chưa có nhật ký hoạt động nào khớp với điều kiện lọc.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
