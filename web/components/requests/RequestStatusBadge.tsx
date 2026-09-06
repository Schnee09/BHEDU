'use client';

import React from 'react';
import { RequestType, RequestStatus } from '@/lib/repositories/StudentRequestRepository';

interface RequestTypeBadgeProps {
  type: RequestType;
  size?: 'sm' | 'md';
}

export function RequestTypeBadge({ type, size = 'md' }: RequestTypeBadgeProps) {
  const configs: Record<
    RequestType,
    { label: string; bg: string; text: string; border: string; icon: string }
  > = {
    leave_absence: {
      label: 'Nghỉ phép',
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-500/20',
      icon: '📄',
    },
    makeup_class: {
      label: 'Học bù',
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-500/20',
      icon: '🔄',
    },
    class_transfer: {
      label: 'Chuyển lớp',
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-500/20',
      icon: '🔀',
    },
    deferral: {
      label: 'Bảo lưu',
      bg: 'bg-stone-500/10 dark:bg-stone-500/20',
      text: 'text-stone-700 dark:text-stone-300',
      border: 'border-stone-500/20',
      icon: '⏸️',
    },
  };

  const config = configs[type] || configs.leave_absence;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

interface RequestStatusBadgeProps {
  status: RequestStatus;
  size?: 'sm' | 'md';
}

export function RequestStatusBadge({ status, size = 'md' }: RequestStatusBadgeProps) {
  const configs: Record<
    RequestStatus,
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    pending: {
      label: 'Chờ duyệt',
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/30',
      dot: 'bg-amber-500',
    },
    approved: {
      label: 'Đã duyệt',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-500',
    },
    rejected: {
      label: 'Từ chối',
      bg: 'bg-rose-500/10 dark:bg-rose-500/20',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-500/30',
      dot: 'bg-rose-500',
    },
    cancelled: {
      label: 'Đã hủy',
      bg: 'bg-stone-500/10 dark:bg-stone-500/20',
      text: 'text-stone-500 dark:text-stone-400',
      border: 'border-stone-500/30',
      dot: 'bg-stone-400',
    },
  };

  const config = configs[status] || configs.pending;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-black uppercase tracking-wider rounded-lg border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      <span>{config.label}</span>
    </span>
  );
}
