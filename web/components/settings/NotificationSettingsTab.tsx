'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { NotificationChannel, NotificationEvent } from '@/lib/settings/types';

interface NotificationSettingsTabProps {
  channels: NotificationChannel[];
  events: NotificationEvent[];
  onToggleChannel: (index: number) => void;
  onToggleEvent: (index: number, type: 'push' | 'email') => void;
}

export function NotificationSettingsTab({
  channels,
  events,
  onToggleChannel,
  onToggleEvent,
}: NotificationSettingsTabProps) {
  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {channels.map((channel, i) => (
          <div
            key={channel.id}
            onClick={() => onToggleChannel(i)}
            className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-white/5 space-y-4 cursor-pointer hover:border-amber-500/30 transition-all"
          >
            <div className="flex justify-between items-start">
              <div className="p-3 bg-stone-50 dark:bg-white/5 rounded-2xl text-stone-400">
                <channel.icon className="w-5 h-5" />
              </div>
              <button
                className={cn(
                  'w-10 h-5 rounded-full p-1 transition-all',
                  channel.active
                    ? 'bg-amber-500'
                    : 'bg-stone-200 dark:bg-stone-800'
                )}
              >
                <div
                  className={cn(
                    'w-3 h-3 bg-white rounded-full transition-all',
                    channel.active ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
            <span className="block font-bold text-sm text-stone-800 dark:text-stone-200">
              {channel.label}
            </span>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">
          Sự kiện kích hoạt
        </h3>
        <div className="bg-stone-50/50 dark:bg-white/2 rounded-[32px] border border-stone-100 dark:border-white/5 overflow-hidden">
          {events.map((event, i) => (
            <div
              key={event.id}
              className="flex items-center justify-between p-6 border-b border-stone-100 dark:border-white/5 last:border-0 hover:bg-white dark:hover:bg-white/2 transition-all"
            >
              <div className="space-y-1">
                <span className="font-bold text-stone-900 dark:text-stone-100 text-[15px]">
                  {event.label}
                </span>
                <p className="text-xs text-stone-500 font-medium">
                  {event.description}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex flex-col items-center gap-2 cursor-pointer group">
                  <span className="text-[8px] font-black text-stone-400 group-hover:text-amber-500 uppercase tracking-widest transition-colors">
                    Push
                  </span>
                  <input
                    type="checkbox"
                    checked={event.push}
                    onChange={() => onToggleEvent(i, 'push')}
                    className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                  />
                </label>
                <label className="flex flex-col items-center gap-2 cursor-pointer group">
                  <span className="text-[8px] font-black text-stone-400 group-hover:text-amber-500 uppercase tracking-widest transition-colors">
                    Email
                  </span>
                  <input
                    type="checkbox"
                    checked={event.email}
                    onChange={() => onToggleEvent(i, 'email')}
                    className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
