'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Icons } from '@/components/ui/Icons'
import { cn } from '@/lib/utils'
import { routes } from '@/lib/routes'

interface StudentQuickActionsProps {
  studentId: string
  studentName: string
  className?: string
}

export default function StudentQuickActions({ studentId, studentName, className }: StudentQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const items = [
    {
      label: 'Hồ sơ chi tiết',
      icon: <Icons.Students className="w-3.5 h-3.5" />,
      href: routes.students.detail(studentId),
      color: 'text-stone-600'
    },
    {
      label: 'Bảng điểm',
      icon: <Icons.Grades className="w-3.5 h-3.5" />,
      href: `/dashboard/students/${studentId}/transcript`,
      color: 'text-amber-600'
    },
    {
      label: 'Tiến độ học tập',
      icon: <Icons.History className="w-3.5 h-3.5" />,
      href: `/dashboard/students/${studentId}/progress`,
      color: 'text-blue-600'
    },
    {
      label: 'Chỉnh sửa',
      icon: <Icons.Edit className="w-3.5 h-3.5" />,
      href: routes.students.edit(studentId),
      color: 'text-emerald-600'
    }
  ]

  return (
    <div className={cn("relative inline-block text-left", className)}>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="w-8 h-8 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-white/5 hover:bg-amber-500/10 hover:text-amber-600 transition-all border border-transparent hover:border-amber-500/20"
      >
        <div className="flex flex-col gap-0.5">
          <div className="w-0.5 h-0.5 rounded-full bg-current" />
          <div className="w-0.5 h-0.5 rounded-full bg-current" />
          <div className="w-0.5 h-0.5 rounded-full bg-current" />
        </div>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-stone-900 shadow-2xl border border-stone-200 dark:border-white/5 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-3 py-2 border-b border-stone-100 dark:border-white/5 mb-1">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest truncate">
                {studentName}
              </p>
            </div>
            {items.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-50 dark:hover:bg-white/5 transition-colors group"
                onClick={() => setIsOpen(false)}
              >
                <div className={cn("transition-colors", item.color)}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-600 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-white">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
