'use client';

import React from 'react';
import Icons from '@/components/ui/Icons';
import { Setting } from '@/lib/settings/types';

interface GeneralSettingsTabProps {
  settings: Setting[];
  settingsForm: Record<string, string>;
  onSettingChange: (key: string, value: string) => void;
  isSearching: boolean;
  searchQuery: string;
}

export function GeneralSettingsTab({
  settings,
  settingsForm,
  onSettingChange,
  isSearching,
  searchQuery,
}: GeneralSettingsTabProps) {
  const filtered = settings
    .filter((s) => (isSearching ? true : s.category === 'general'))
    .filter(
      (s) =>
        (s.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        s.setting_key.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
      {filtered.map((setting) => (
        <div key={setting.id} className="group flex flex-col gap-2">
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.15em] px-1 transition-colors group-focus-within:text-amber-500">
            {setting.description}
          </label>
          <div className="relative">
            <input
              type={setting.setting_type === 'number' ? 'number' : 'text'}
              value={settingsForm[setting.setting_key] || ''}
              onChange={(e) => onSettingChange(setting.setting_key, e.target.value)}
              className="w-full px-5 py-4 bg-stone-100/50 dark:bg-white/5 border border-transparent focus:border-stone-900 dark:focus:border-white/20 rounded-2xl focus:ring-4 focus:ring-amber-500/10 transition-all font-bold text-stone-800 dark:text-stone-200"
            />
          </div>
          <p className="px-5 text-[9px] font-mono text-stone-400/50 lowercase italic tracking-tight">
            {setting.setting_key}
          </p>
        </div>
      ))}
      {filtered.length === 0 && (
        <div className="md:col-span-2 py-20 text-center space-y-6">
          <div className="w-20 h-20 bg-stone-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-stone-200 dark:text-stone-800">
            <Icons.Search className="w-8 h-8 opacity-20" />
          </div>
          <p className="text-stone-400 font-medium italic">
            Không tìm thấy cài đặt nào trong danh mục này
          </p>
        </div>
      )}
    </div>
  );
}
