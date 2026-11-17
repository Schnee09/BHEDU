'use client';

import { useEffect, useState } from 'react';
import {
  CheckIcon,
  IdentificationIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Badge } from '../../_components/FormElements';

type LinkStatus = 'pending' | 'approved' | 'rejected' | 'revoked';

interface ParentStudentLink {
  id: string;
  relationship: string;
  status: LinkStatus;
  created_at: string;
  parent: { full_name: string; email: string | null; phone: string | null };
  student: { full_name: string; student_code: string | null };
}

const STATUS_OPTIONS: Array<{ value: 'all' | LinkStatus; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Đã từ chối' },
  { value: 'revoked', label: 'Đã thu hồi' },
];

const RELATIONSHIP_LABELS: Record<string, string> = {
  father: 'Bố',
  mother: 'Mẹ',
  parent: 'Bố/Mẹ',
  guardian: 'Người giám hộ',
  grandparent: 'Ông/Bà',
  other: 'Khác',
};

function StatusBadge({ status }: { status: LinkStatus }) {
  if (status === 'pending') return <Badge variant="warning">Chờ duyệt</Badge>;
  if (status === 'approved') return <Badge variant="success">Đã duyệt</Badge>;
  if (status === 'revoked') return <Badge variant="default">Đã thu hồi</Badge>;
  return <Badge variant="error">Đã từ chối</Badge>;
}

export default function ParentLinksPage() {
  const [links, setLinks] = useState<ParentStudentLink[]>([]);
  const [status, setStatus] = useState<'all' | LinkStatus>('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/admin/parent-links?status=${status}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Không thể tải danh sách yêu cầu.');
        return result.data || [];
      })
      .then((data) => {
        if (!cancelled) setLinks(data);
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError(
          requestError instanceof Error ? requestError.message : 'Không thể tải danh sách yêu cầu.'
        );
        setLinks([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status]);

  const updateStatus = async (id: string, nextStatus: 'approved' | 'rejected') => {
    setActionLoading(id);
    setError(null);
    try {
      const response = await fetch('/api/admin/parent-links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không thể cập nhật trạng thái.');
      setLinks((currentLinks) =>
        status === 'all'
          ? currentLinks.map((link) => (link.id === id ? { ...link, status: nextStatus } : link))
          : currentLinks.filter((link) => link.id !== id)
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Không thể cập nhật trạng thái.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-stone-950 dark:text-white sm:text-3xl">
          Kết nối phụ huynh với học sinh
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Xác minh yêu cầu trước khi cho phép phụ huynh xem thông tin học tập của học sinh.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2" aria-label="Lọc theo trạng thái">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              if (status === option.value) return;
              setLoading(true);
              setError(null);
              setStatus(option.value);
            }}
            aria-pressed={status === option.value}
            className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              status === option.value
                ? 'border-amber-500 bg-amber-500 text-stone-950'
                : 'border-stone-200 bg-white text-stone-700 hover:border-amber-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </nav>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
        >
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
        {loading ? (
          <p className="p-10 text-center text-sm text-stone-500">Đang tải yêu cầu…</p>
        ) : links.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <UserGroupIcon className="h-10 w-10 text-stone-400" aria-hidden="true" />
            <p className="font-semibold text-stone-700 dark:text-stone-200">
              Không có yêu cầu phù hợp
            </p>
            <p className="text-sm text-stone-500">Các yêu cầu mới sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-200 dark:divide-stone-800">
            {links.map((item) => (
              <article
                key={item.id}
                className="grid gap-4 p-5 transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/50 md:grid-cols-[1fr_1fr_auto_auto] md:items-center"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Phụ huynh
                  </p>
                  <p className="mt-1 font-semibold text-stone-950 dark:text-white">
                    {item.parent.full_name}
                  </p>
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    {item.parent.phone || item.parent.email || 'Chưa có thông tin liên hệ'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Học sinh
                  </p>
                  <p className="mt-1 font-semibold text-stone-950 dark:text-white">
                    {item.student.full_name}
                  </p>
                  <p className="flex items-center gap-1 text-sm text-stone-600 dark:text-stone-400">
                    <IdentificationIcon className="h-4 w-4" aria-hidden="true" />
                    {item.student.student_code || 'Chưa có mã học sinh'}
                  </p>
                </div>
                <div className="space-y-1 text-sm">
                  <StatusBadge status={item.status} />
                  <p className="text-stone-600 dark:text-stone-400">
                    {RELATIONSHIP_LABELS[item.relationship] || 'Khác'}
                  </p>
                  <time className="block text-xs text-stone-500" dateTime={item.created_at}>
                    {new Date(item.created_at).toLocaleDateString('vi-VN')}
                  </time>
                </div>
                {item.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void updateStatus(item.id, 'approved')}
                      disabled={actionLoading !== null}
                      className="cursor-pointer rounded-xl bg-emerald-600 p-2.5 text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Phê duyệt yêu cầu"
                    >
                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      <span className="sr-only">Phê duyệt yêu cầu của {item.parent.full_name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateStatus(item.id, 'rejected')}
                      disabled={actionLoading !== null}
                      className="cursor-pointer rounded-xl bg-red-600 p-2.5 text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Từ chối yêu cầu"
                    >
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                      <span className="sr-only">Từ chối yêu cầu của {item.parent.full_name}</span>
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
