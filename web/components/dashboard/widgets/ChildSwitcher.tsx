'use client';

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface Child {
  id: string;
  full_name: string;
  student_code: string;
}

interface ChildSwitcherProps {
  childrenList: Child[];
  selectedChildId: string;
  onSelectChild: (id: string) => void;
}

const ChildSwitcher = memo(function ChildSwitcher({
  childrenList,
  selectedChildId,
  onSelectChild,
}: ChildSwitcherProps) {
  if (childrenList.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-white/10 rounded-2xl overflow-x-auto max-w-full swipe-container">
      {childrenList.map((child) => {
        const isSelected = child.id === selectedChildId;
        return (
          <button
            key={child.id}
            onClick={() => onSelectChild(child.id)}
            className={cn(
              'flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 shrink-0 press-effect',
              isSelected
                ? 'bg-amber-500 text-stone-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white bg-stone-50 dark:bg-stone-800/60'
            )}
          >
            <div
              className={cn(
                'w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0',
                isSelected ? 'bg-stone-950 text-amber-400' : 'bg-stone-200/70 dark:bg-stone-700'
              )}
            >
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="text-left min-w-0">
              <p className="leading-tight truncate max-w-[120px]">{child.full_name}</p>
              <p
                className={cn(
                  'text-[9px] font-semibold tracking-normal',
                  isSelected ? 'text-stone-950/70' : 'text-stone-400'
                )}
              >
                {child.student_code}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
});

export default ChildSwitcher;
