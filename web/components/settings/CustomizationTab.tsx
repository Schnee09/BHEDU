'use client';

import React from 'react';
import Icons from '@/components/ui/Icons';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
      {/* Accent Color Palette */}
      <Card className="rounded-[40px] overflow-hidden border-stone-100 dark:border-white/5 glass-premium shadow-xl shadow-black/5">
        <CardHeader className="bg-gradient-to-br from-amber-500/5 to-transparent border-b border-stone-100 dark:border-white/5 py-6 px-8">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-500/10 rounded-2xl">
              <Icons.Layout className="w-5 h-5 text-amber-500" />
            </span>
            <h2 className="text-xl font-black tracking-tight">Màu chủ đạo</h2>
          </div>
        </CardHeader>
        <CardBody className="p-8 space-y-8">
          <p className="text-sm text-stone-500 font-medium">
            Chọn tông màu đặc trưng cho giao diện dashboard của bạn.
          </p>
          <div className="grid grid-cols-4 gap-4">
            {[
              { name: 'Amber', color: 'bg-amber-500', hex: '#F5A623' },
              { name: 'Blue', color: 'bg-blue-600', hex: '#2563EB' },
              { name: 'Emerald', color: 'bg-emerald-500', hex: '#10B981' },
              { name: 'Rose', color: 'bg-rose-500', hex: '#F43F5E' },
              { name: 'Slate', color: 'bg-slate-500', hex: '#64748B' },
            ].map((c) => (
              <button
                key={c.name}
                onClick={() => setAccentColor(c.name.toLowerCase() as AccentColor)}
                className={cn(
                  'group flex flex-col items-center gap-3 p-4 rounded-[28px] border transition-all duration-500 press-effect',
                  accentColor === c.name.toLowerCase()
                    ? 'border-stone-900 bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-2xl'
                    : 'border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/5'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-2xl shadow-lg ring-4 ring-white/20',
                    c.color
                  )}
                />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Density & Layout */}
      <Card className="rounded-[40px] overflow-hidden border-stone-100 dark:border-white/5 glass-premium shadow-xl shadow-black/5">
        <CardHeader className="bg-gradient-to-br from-blue-500/5 to-transparent border-b border-stone-100 dark:border-white/5 py-6 px-8">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-blue-500/10 rounded-2xl">
              <Icons.Columns className="w-5 h-5 text-blue-500" />
            </span>
            <h2 className="text-xl font-black tracking-tight">Trải nghiệm UI</h2>
          </div>
        </CardHeader>
        <CardBody className="p-8 space-y-8">
          <div className="flex gap-4 p-1.5 bg-stone-100 dark:bg-white/5 rounded-[32px]">
            <button
              onClick={() => setDensity('cozy')}
              className={cn(
                'flex-1 p-4.5 rounded-[24px] text-center transition-all duration-500 font-black uppercase tracking-widest text-[11px]',
                density === 'cozy'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xl'
                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
              )}
            >
              Cozy
            </button>
            <button
              onClick={() => setDensity('compact')}
              className={cn(
                'flex-1 p-4.5 rounded-[24px] text-center transition-all duration-500 font-black uppercase tracking-widest text-[11px]',
                density === 'compact'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xl'
                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
              )}
            >
              Compact
            </button>
          </div>

          <div className="space-y-6 pt-2">
            <div className="space-y-3">
              <div className="flex justify-between items-end px-1">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                  Kính mờ (Blur)
                </span>
                <span className="text-sm font-black text-stone-900 dark:text-white">
                  {blurStrength}
                  <span className="text-[10px] opacity-40 ml-0.5">PX</span>
                </span>
              </div>
              <div className="relative group/slider h-6 flex items-center">
                <input
                  type="range"
                  min="0"
                  max="64"
                  step="4"
                  value={blurStrength}
                  onChange={(e) => setBlurStrength(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-stone-100 dark:bg-white/10 rounded-full appearance-none outline-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end px-1">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                  Độ trong suốt
                </span>
                <span className="text-sm font-black text-stone-900 dark:text-white">
                  {glassOpacity}
                  <span className="text-[10px] opacity-40 ml-0.5">%</span>
                </span>
              </div>
              <div className="relative group/slider h-6 flex items-center">
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={glassOpacity}
                  onChange={(e) => setGlassOpacity(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-stone-100 dark:bg-white/10 rounded-full appearance-none outline-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-white/5 rounded-2xl">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  Kết cấu mặt kính (Texture)
                </span>
                <p className="text-[10px] text-stone-500">
                  Thêm hiệu ứng nhiễu hạt nhẹ tạo cảm giác chất liệu thật.
                </p>
              </div>
              <button
                onClick={() => setTexture(!texture)}
                className={cn(
                  'w-12 h-6 rounded-full p-1 transition-all duration-300',
                  texture ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-700'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm',
                    texture ? 'translate-x-6' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
