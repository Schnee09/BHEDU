'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Calendar, 
  BookOpen, 
  CheckCircle, 
  User 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Trang chủ' },
  { href: '/dashboard/calendar', icon: Calendar, label: 'Lịch' },
  { href: '/dashboard/classes', icon: BookOpen, label: 'Lớp học' },
  { href: '/dashboard/attendance/mark', icon: CheckCircle, label: 'Điểm danh' },
  { href: '/dashboard/profile', icon: User, label: 'Hồ sơ' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe pointer-events-none">
      <nav className="glass-premium rounded-[32px] h-20 flex items-center justify-around px-2 pointer-events-auto relative overflow-hidden transition-all duration-500 shadow-2xl border-t border-white/20 dark:border-white/5">
        
        {/* Animated background pill for active state */}
        <div className="absolute inset-0 z-0 pointer-events-none px-4">
           {/* We can implement a more complex sliding indicator if needed, 
               but for now, per-item indicators are cleaner for this layout */}
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 flex-1 h-full press-effect relative z-10 transition-all duration-300",
                isActive ? "text-amber-500" : "text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300"
              )}
            >
              <div className={cn(
                "p-2.5 rounded-2xl transition-all duration-500",
                isActive ? "bg-amber-500/10 scale-110" : "bg-transparent"
              )}>
                <item.icon className={cn("w-6 h-6", isActive ? "stroke-[2.5px]" : "stroke-[1.5px]")} />
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
              )}>
                {item.label}
              </span>
              
              {/* Dot indicator */}
              {isActive && (
                <div className="absolute top-1.5 w-1 h-1 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,166,35,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default BottomNav;
