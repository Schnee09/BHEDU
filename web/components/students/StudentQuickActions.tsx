'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Icons } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';
import { routes } from '@/lib/routes';

interface StudentQuickActionsProps {
  studentId: string;
  studentName: string;
  className?: string;
}

export default function StudentQuickActions({ studentId, studentName, className }: StudentQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const items = [
    {
      label: 'Hồ sơ chi tiết',
      icon: <Icons.Students className="w-3.5 h-3.5" />,
      href: routes.students.detail(studentId),
      color: 'text-stone-600 dark:text-stone-400'
    },
    {
      label: 'Bảng điểm',
      icon: <Icons.Grades className="w-3.5 h-3.5" />,
      href: `/dashboard/students/${studentId}/transcript`,
      color: 'text-amber-600 dark:text-amber-400'
    },
    {
      label: 'Tiến độ học tập',
      icon: <Icons.History className="w-3.5 h-3.5" />,
      href: `/dashboard/students/${studentId}/progress`,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Chỉnh sửa',
      icon: <Icons.Edit className="w-3.5 h-3.5" />,
      href: routes.students.edit(studentId),
      color: 'text-emerald-600 dark:text-emerald-400'
    }
  ];

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={cn(
          "w-8 h-8 flex items-center justify-center rounded-xl transition-all border cursor-pointer",
          isOpen
            ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
            : "bg-stone-100 dark:bg-white/5 text-stone-500 hover:text-stone-900 dark:hover:text-white border-transparent hover:border-stone-200 dark:hover:border-white/10"
        )}
        title="Thao tác nhanh"
        aria-label="Thao tác nhanh"
        aria-expanded={isOpen}
      >
        <div className="flex flex-col gap-0.5 pointer-events-none">
          <div className="w-1 h-1 rounded-full bg-current" />
          <div className="w-1 h-1 rounded-full bg-current" />
          <div className="w-1 h-1 rounded-full bg-current" />
        </div>
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 mt-1.5 w-48 rounded-2xl bg-white dark:bg-stone-900 shadow-2xl border border-stone-200/80 dark:border-white/10 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-1.5 border-b border-stone-100 dark:border-white/5 mb-1">
            <p className="text-[11px] font-bold text-stone-500 dark:text-stone-400 truncate">
              {studentName}
            </p>
          </div>
          {items.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-stone-50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              <div className={cn("transition-colors shrink-0", item.color)}>
                {item.icon}
              </div>
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-white">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
