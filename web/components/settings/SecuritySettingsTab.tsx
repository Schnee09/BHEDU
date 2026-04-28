'use client';

import React from 'react';
import Icons from '@/components/ui/Icons';
import { SecuritySession, ActivityLog } from '@/lib/settings/types';

interface SecuritySettingsTabProps {
  sessions: SecuritySession[];
  logs: ActivityLog[];
  onLogoutSession: (sessionId: string) => void;
  onLogoutOthers: () => void;
}

export function SecuritySettingsTab({
  sessions,
  logs,
  onLogoutSession,
  onLogoutOthers,
}: SecuritySettingsTabProps) {
  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">
          Phiên hoạt động
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {sessions.length > 0 ? (
            sessions.map((session, i) => (
              <div
                key={`${session.device}-${session.ip}-${i}`}
                className="flex items-center justify-between p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-white/5 group hover:border-amber-500/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-stone-50 dark:bg-white/5 rounded-2xl text-stone-400 group-hover:text-amber-500 transition-colors">
                    <Icons.Menu className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 dark:text-stone-100 text-[15px]">
                        {session.device}
                      </span>
                      {session.current && (
                        <span className="text-[9px] font-black uppercase text-amber-500 px-2 py-0.5 bg-amber-500/10 rounded-full">
                          Hiện tại
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]" title={`${session.browser} • ${session.ip} • ${session.location}`}>
                      {session.browser} &bull; {session.ip} &bull;{' '}
                      {session.location}
                    </p>
                  </div>
                </div>
                {!session.current && (
                  <button
                    onClick={() => onLogoutSession(session.id || session.device)}
                    className="text-[10px] font-black text-red-500 uppercase tracking-widest px-4 py-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    Đăng xuất
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-sm font-medium text-stone-500">
              Chưa có dữ liệu phiên hoạt động
            </div>
          )}
        </div>
        <button
          onClick={onLogoutOthers}
          className="w-full py-4 text-[10px] font-black text-red-500/70 hover:text-red-500 uppercase tracking-widest border border-red-500/20 hover:border-red-500/50 rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/5 transition-all"
        >
          Đăng xuất khỏi tất cả thiết bị khác
        </button>
      </section>

      <section className="space-y-6">
        <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">
          Nhật ký hoạt động
        </h3>
        <div className="space-y-1">
          {logs.length > 0 ? (
            logs.map((log, i) => (
              <div
                key={`${log.action}-${log.date}-${i}`}
                className="flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-white/2 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700 group-hover:bg-amber-500 transition-colors" />
                  <div>
                    <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
                      {log.action}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-medium text-stone-500 uppercase tracking-wider">
                        {log.category}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        &bull; {log.date}
                      </span>
                    </div>
                  </div>
                </div>
                <Icons.ChevronRight className="w-4 h-4 text-stone-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-sm font-medium text-stone-500">
              Chưa có nhật ký hoạt động
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
