'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZaloCopyButtonProps {
  message: string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function ZaloCopyButton({
  message,
  label = 'Sao chép Zalo',
  className,
  size = 'sm',
}: ZaloCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Sao chép tin nhắn gửi phụ huynh qua Zalo"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-xl font-bold transition-all border cursor-pointer select-none',
        size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-4 py-2 text-xs',
        copied
          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
        className
      )}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-amber-500" />
      )}
      <span>{copied ? 'Đã sao chép' : label}</span>
    </button>
  );
}

export default ZaloCopyButton;
