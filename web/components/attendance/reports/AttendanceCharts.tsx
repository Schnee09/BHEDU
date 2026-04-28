'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface AttendanceChartsProps {
  totalPresent: number;
  totalAbsent: number;
  byClass: Record<string, { name: string; rate: number }>;
  t: (key: string) => string;
}

export function AttendanceCharts({
  totalPresent,
  totalAbsent,
  byClass,
  t,
}: AttendanceChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <div className="glass-premium rounded-[32px] border border-white/20 shadow-xl p-8 animate-fade-in delay-200">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-stone-400 mb-8 flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          {t('attendance.report.statusChart')}
        </h2>
        <div className="h-64" style={{ minHeight: '300px' }}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: t('attendance.present'), value: totalPresent, color: '#10b981' },
                  { name: t('attendance.absent'), value: totalAbsent, color: '#ef4444' },
                ].filter((d) => d.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={8}
                dataKey="value"
              >
                {[
                  { name: t('attendance.present'), value: totalPresent, color: '#10b981' },
                  { name: t('attendance.absent'), value: totalAbsent, color: '#ef4444' },
                ]
                  .filter((d) => d.value > 0)
                  .map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth={2}
                    />
                  ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255,255,255,0.95)', 
                  backdropFilter: 'blur(8px)',
                  borderRadius: '16px',
                  border: 'none',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  fontSize: '12px'
                }}
                itemStyle={{ fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-premium rounded-[32px] border border-white/20 shadow-xl p-8 animate-fade-in delay-300">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-stone-400 mb-8 flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full" />
          {t('attendance.report.rateByClass')}
        </h2>
        <div className="h-64" style={{ minHeight: '300px' }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={Object.values(byClass)
                .slice(0, 6)
                .map((c: any) => ({
                  name: c.name.length > 10 ? c.name.substring(0, 10) + '...' : c.name,
                  rate: c.rate,
                }))}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              />
              <YAxis 
                domain={[0, 100]} 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(16,185,129,0.05)' }}
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '16px',
                  border: 'none',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  fontSize: '12px'
                }}
              />
              <Bar
                dataKey="rate"
                fill="#10b981"
                radius={[8, 8, 0, 0]}
                barSize={32}
                name={t('attendance.rate')}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
