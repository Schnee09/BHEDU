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
    <div className="flex flex-wrap items-center gap-3 p-2 bg-white/40 dark:bg-stone-900/40 backdrop-blur-md border border-stone-200/50 dark:border-white/5 rounded-3xl w-fit">
      {childrenList.map((child) => {
        const isSelected = child.id === selectedChildId;
        return (
          <button
            key={child.id}
            onClick={() => onSelectChild(child.id)}
            className={cn(
              'flex items-center gap-3 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 active:scale-95',
              isSelected
                ? 'bg-amber-500 text-stone-900 shadow-lg shadow-amber-500/20'
                : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5'
            )}
          >
            <div
              className={cn(
                'w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px]',
                isSelected ? 'bg-stone-900 text-amber-500' : 'bg-stone-100 dark:bg-white/5'
              )}
            >
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="leading-none text-left">{child.full_name}</p>
              <p
                className={cn(
                  'text-[9px] font-bold mt-0.5 tracking-normal lowercase',
                  isSelected ? 'text-stone-900/60' : 'text-stone-400'
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
