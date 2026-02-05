'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui';
import { Icons } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    className,
}: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center p-12 text-center rounded-[40px] border-2 border-dashed border-stone-200 dark:border-white/5 bg-stone-50/50 dark:bg-white/5",
            className
        )}>
            <div className="mb-6 p-6 rounded-[32px] bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500">
                {icon || <Icons.Search className="w-12 h-12" />}
            </div>

            <h3 className="text-xl font-bold text-stone-900 dark:text-white uppercase tracking-tight mb-2">
                {title}
            </h3>

            {description && (
                <p className="max-w-xs text-stone-500 dark:text-stone-400 font-medium leading-relaxed mb-8">
                    {description}
                </p>
            )}

            {actionLabel && onAction && (
                <Button
                    onClick={onAction}
                    className="px-8 py-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
