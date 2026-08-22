'use client';

import React from 'react';
import {
  Palette,
  Layout,
  Sliders,
  Sparkles,
  Eye,
  Check,
  CheckCircle2,
  Calendar,
  Award,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useCustomization,
  AccentColor,
} from '@/contexts/CustomizationContext';

export function CustomizationTab() {
  const {
    accentColor,
    setAccentColor,
    density,
    setDensity,
    glassOpacity,
    setGlassOpacity,
    blurStrength,
    setBlurStrength,
    texture,
    setTexture,
  } = useCustomization();

  const colors = [
    { name: 'Amber', color: 'bg-amber-500', hex: '#F5A623', desc: 'Vàng cam ấm áp' },
    { name: 'Emerald', color: 'bg-emerald-500', hex: '#10B981', desc: 'Xanh ngọc tươi mới' },
    { name: 'Blue', color: 'bg-blue-600', hex: '#2563EB', desc: 'Xanh dương học thuật' },
    { name: 'Rose', color: 'bg-rose-500', hex: '#F43F5E', desc: 'Đỏ hồng sang trọng' },
    { name: 'Slate', color: 'bg-slate-600', hex: '#475569', desc: 'Xám đá tối giản' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Bento Row: Colors & UI Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Accent Colors (7 cols) */}
        <div className="lg:col-span-7 p-8 rounded-[32px] bg-white dark:bg-stone-900/60 border border-stone-100 dark:border-white/5 space-y-6 shadow-sm">
          <div className="flex items-center gap-3.5 border-b border-stone-100 dark:border-white/5 pb-4">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-950 dark:text-white">
                Màu sắc chủ đạo (Brand Accent)
              </h3>
              <p className="text-xs text-stone-500">
                Tông màu nhận diện áp dụng cho nút nhấn, nhãn trạng thái và điểm nhấn giao diện
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {colors.map((c) => {
              const isSelected = accentColor === c.name.toLowerCase();

              return (
                <button
                  key={c.name}
                  onClick={() => setAccentColor(c.name.toLowerCase() as AccentColor)}
                  className={cn(
                    'group flex flex-col items-start gap-3 p-5 rounded-[24px] border transition-all duration-300 relative text-left',
                    isSelected
                      ? 'border-amber-500/40 bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xl'
                      : 'border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/[0.02] hover:border-stone-300 dark:hover:border-white/10'
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className={cn('w-8 h-8 rounded-xl shadow-md', c.color)} />
                    {isSelected && (
                      <span className="p-1 rounded-full bg-white/20 dark:bg-stone-900/20">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider block">
                      {c.name}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-medium mt-0.5 block',
                        isSelected ? 'opacity-70' : 'text-stone-400'
                      )}
                    >
                      {c.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* UI Experience & Density (5 cols) */}
        <div className="lg:col-span-5 p-8 rounded-[32px] bg-white dark:bg-stone-900/60 border border-stone-100 dark:border-white/5 space-y-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-3.5 border-b border-stone-100 dark:border-white/5 pb-4">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-950 dark:text-white">
                  Mật độ & Hiệu ứng kính
                </h3>
                <p className="text-xs text-stone-500">Tùy biến độ giãn cách và độ mờ kính mờ</p>
              </div>
            </div>

            {/* Density switch */}
            <div className="space-y-2">
              <span className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                Mật độ hiển thị (Layout Density)
              </span>
              <div className="flex gap-2 p-1.5 bg-stone-100 dark:bg-white/5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setDensity('cozy')}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-center text-xs font-black uppercase tracking-wider transition-all',
                    density === 'cozy'
                      ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-md'
                      : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-200'
                  )}
                >
                  Rộng rãi (Cozy)
                </button>
                <button
                  type="button"
                  onClick={() => setDensity('compact')}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-center text-xs font-black uppercase tracking-wider transition-all',
                    density === 'compact'
                      ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-md'
                      : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-200'
                  )}
                >
                  Thu gọn (Compact)
                </button>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-stone-500">Độ mờ kính (Blur)</span>
                  <span className="font-mono">{blurStrength}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="48"
                  step="4"
                  value={blurStrength}
                  onChange={(e) => setBlurStrength(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-stone-200 dark:bg-white/10 rounded-full appearance-none outline-none accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-stone-500">Độ trong suốt nền kính</span>
                  <span className="font-mono">{glassOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={glassOpacity}
                  onChange={(e) => setGlassOpacity(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-stone-200 dark:bg-white/10 rounded-full appearance-none outline-none accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-white/[0.02] border border-stone-100 dark:border-white/5 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
              Chất liệu vân bề mặt (Texture)
            </span>
            <input
              type="checkbox"
              checked={texture}
              onChange={(e) => setTexture(e.target.checked)}
              className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500/20"
            />
          </div>
        </div>
      </div>

      {/* Live Preview Section */}
      <div className="p-8 md:p-10 rounded-[32px] bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 text-white border border-stone-800 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black tracking-tight !text-white" style={{ color: '#ffffff' }}>
              Xem trước giao diện (Live Preview)
            </h3>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">
            Tự động lưu sau 1 giây
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                <Users className="w-4 h-4" />
              </span>
              <span className="px-2.5 py-0.5 text-[9px] font-black uppercase rounded-full bg-emerald-500/20 text-emerald-300">
                +12% tuần này
              </span>
            </div>
            <div>
              <h4 className="text-2xl font-black !text-white" style={{ color: '#ffffff' }}>
                1.248
              </h4>
              <p className="text-xs text-stone-300 font-medium">Học sinh đang theo học</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
                <Calendar className="w-4 h-4" />
              </span>
              <span className="px-2.5 py-0.5 text-[9px] font-black uppercase rounded-full bg-blue-500/20 text-blue-300">
                Học kỳ 1
              </span>
            </div>
            <div>
              <h4 className="text-2xl font-black !text-white" style={{ color: '#ffffff' }}>
                2025 - 2026
              </h4>
              <p className="text-xs text-stone-300 font-medium">Năm học chuẩn</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 backdrop-blur-md flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-stone-200">Hành động mẫu</span>
              <p className="text-[11px] text-stone-400">Nút bấm với màu nhận diện đã chọn</p>
            </div>
            <button
              type="button"
              className="w-full py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-white shadow-lg transition-transform active:scale-95 cursor-pointer"
              style={{ backgroundColor: 'var(--color-primary, #F5A623)' }}
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
