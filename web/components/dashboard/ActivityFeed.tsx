"use client";

import { useFetch } from "@/hooks/useFetch";
import { Clock, Activity, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ActivityItem {
    id: string;
    type: string;
    message: string;
    user: string;
    timestamp: string;
}

export default function ActivityFeed({ limit = 10 }: { limit?: number }) {
    const { data, loading, error } = useFetch<any>(
        `/api/dashboard/stats?limit=${limit}`
    );

    // Extract activities from the unified stats response
    const activities = data?.recentActivity as ActivityItem[] | undefined;

    if (loading && !activities) {
        return (
            <div className="divide-y divide-stone-100 dark:divide-white/5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="px-8 py-5">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-3/4 bg-stone-100 dark:bg-stone-800 rounded animate-pulse" />
                                <div className="h-3 w-1/4 bg-stone-100 dark:bg-stone-800 rounded animate-pulse" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return <div className="p-8 text-center text-xs font-bold text-stone-400 uppercase tracking-widest">Không thể tải hoạt động</div>;
    }

    const items = activities || [];

    return (
        <div className="divide-y divide-stone-100 dark:divide-white/5">
            {items.length === 0 ? (
                <div className="px-8 py-12 text-center">
                    <Clock className="w-8 h-8 mx-auto mb-3 opacity-20 text-stone-400" />
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Chưa có hoạt động nào</p>
                </div>
            ) : (
                <>
                    <div className="max-h-[600px] overflow-y-auto custom-scrollbar divide-y divide-stone-100 dark:divide-white/5">
                        {items.map((activity) => (
                            <div key={activity.id} className="px-8 py-5 hover:bg-stone-50/50 dark:hover:bg-white/5 transition-all group">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-500/5 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-relaxed">
                                            <span className="text-amber-600">{activity.user}</span> {activity.message}
                                        </p>
                                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-tighter mt-1 opacity-60">
                                            {new Date(activity.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {new Date(activity.timestamp).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="px-8 py-4 border-t border-stone-100 dark:border-white/5 bg-stone-50/30 dark:bg-white/5">
                        <Link href="/dashboard/admin/audit" className="text-[10px] font-black text-amber-600 hover:text-amber-500 uppercase tracking-widest flex items-center gap-1 group">
                            Xem chi tiết <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}
