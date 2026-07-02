'use client';

import { memo } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Clock,
  Activity,
  ChevronRight,
  PlusCircle,
  Edit,
  Trash2,
  LogIn,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ActivityItem {
  id: string;
  type: string; // action: login, create, update, delete
  message: string;
  user: string;
  timestamp: string;
}

function ActivityIcon({ type }: { type: string }) {
  const map: Record<string, { icon: React.ReactNode; cls: string }> = {
    login: {
      icon: <LogIn className="w-4 h-4" />,
      cls: 'bg-blue-500/10 text-blue-500',
    },
    create: {
      icon: <PlusCircle className="w-4 h-4" />,
      cls: 'bg-emerald-500/10 text-emerald-500',
    },
    update: {
      icon: <Edit className="w-4 h-4" />,
      cls: 'bg-amber-500/10 text-amber-500',
    },
    delete: {
      icon: <Trash2 className="w-4 h-4" />,
      cls: 'bg-red-500/10 text-red-500',
    },
    system: {
      icon: <Activity className="w-4 h-4" />,
      cls: 'bg-stone-500/10 text-stone-500',
    },
  };

  const config = (map[type.toLowerCase()] ?? map['system'])!;

  return (
    <div
      className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 group-hover:rotate-3',
        config.cls
      )}
    >
      {config.icon}
    </div>
  );
}

export default memo(function ActivityFeed({ limit = 10 }: { limit?: number }) {
  const { isStaff } = usePermissions();
  const { data, loading, error } = useFetch<any>(`/api/dashboard/stats?limit=${limit}`);

  // Extract activities from the unified stats response
  const activities = (data?.recentActivity as ActivityItem[]) || [];

  if (loading && !data) {
    return (
      <div className="divide-y divide-stone-100 dark:divide-white/5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-8 py-6">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-white/5 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-stone-100 dark:bg-white/5 rounded-lg animate-pulse" />
                <div className="h-3 w-1/4 bg-stone-100 dark:bg-white/5 rounded-md animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center space-y-3">
        <AlertCircle className="w-8 h-8 mx-auto text-red-500/50" />
        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
          Không thể truy vấn nhật ký
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-stone-100 dark:divide-white/5">
        {activities.length === 0 ? (
          <div className="px-8 py-20 text-center">
            <div className="w-16 h-16 bg-stone-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-12 group-hover:rotate-0 transition-transform">
              <Clock className="w-8 h-8 text-stone-300 dark:text-stone-600" />
            </div>
            <p className="font-black text-stone-900 dark:text-white uppercase tracking-tight">
              Nhật ký trống
            </p>
            <p className="text-[10px] font-bold text-stone-500 mt-2 uppercase tracking-widest">
              Hệ thống chưa ghi nhận hoạt động mới.
            </p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="px-8 py-5 hover:bg-stone-50/50 dark:hover:bg-white/5 transition-all group relative overflow-hidden"
            >
              {/* Subtle glass effect on hover */}
              <div className="absolute inset-y-0 left-0 w-1 bg-amber-500 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />

              <div className="flex items-start gap-4">
                <ActivityIcon type={activity.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-relaxed group-hover:translate-x-1 transition-transform">
                    <span className="text-amber-600 dark:text-amber-500 font-black">
                      {activity.user}
                    </span>{' '}
                    {activity.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 opacity-60">
                    <Clock className="w-3 h-3 text-stone-400" />
                    <p className="text-[9px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest">
                      {new Date(activity.timestamp).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      • {new Date(activity.timestamp).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isStaff && activities.length > 0 && (
        <div className="px-8 py-5 border-t border-stone-100 dark:border-white/5 bg-stone-50/30 dark:bg-white/5">
          <Link
            href="/dashboard/admin/audit"
            className="group flex items-center justify-between text-[10px] font-black text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-500 uppercase tracking-widest transition-all"
          >
            Xem nhật ký hệ thống
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}
    </div>
  );
});
