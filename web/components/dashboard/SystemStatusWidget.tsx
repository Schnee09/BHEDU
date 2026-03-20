'use client';

import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface HealthData {
  status: 'ok' | 'degraded' | 'error';
  duration_total_ms: number;
  timestamp: string;
  database?: { status: string; latency_ms: number; connected: boolean };
  external?: { status: string; latency_ms: number };
  system?: { nodeVersion: string; env: string; uptime: number };
}

type ServiceStatus = 'online' | 'degraded' | 'offline' | 'loading';

interface ServiceItem {
  label: string;
  status: ServiceStatus;
  latency?: number;
}

function uptimeLabel(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function SystemStatusWidget() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      if (!res.ok) throw new Error('health check failed');
      const data: HealthData = await res.json();
      setHealth(data);
      setLastChecked(new Date());
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  }, []);

  // Initial fetch + 30-second polling
  useEffect(() => {
    fetchHealth();
    const interval = setInterval(() => fetchHealth(), 30_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  // Derive service statuses
  const services: ServiceItem[] = loading
    ? [
        { label: 'Database Engine', status: 'loading' },
        { label: 'Auth Service', status: 'loading' },
        { label: 'External Network', status: 'loading' },
        { label: 'Edge Functions', status: 'loading' },
      ]
    : [
        {
          label: 'Database Engine',
          status:
            health?.database?.status === 'healthy'
              ? 'online'
              : health?.database?.status === 'degraded'
                ? 'degraded'
                : 'offline',
          latency: health?.database?.latency_ms,
        },
        {
          label: 'Auth Service',
          // Auth is considered healthy if DB is healthy (shared Supabase instance)
          status: health?.database?.connected === true ? 'online' : 'offline',
        },
        {
          label: 'External Network',
          status:
            health?.external?.status === 'healthy'
              ? 'online'
              : health?.external?.status === 'degraded'
                ? 'degraded'
                : 'offline',
          latency: health?.external?.latency_ms,
        },
        {
          label: 'Edge Functions',
          status: health ? 'online' : 'offline',
          latency: health?.duration_total_ms,
        },
      ];

  const overallOnline =
    !loading && health !== null && (health.status === 'ok' || health.status === 'degraded');

  const glowColor = overallOnline
    ? 'bg-green-500/10 group-hover:bg-green-500/20'
    : loading
      ? 'bg-amber-500/10'
      : 'bg-red-500/10';

  return (
    <div className="hidden xl:block bg-stone-900 dark:bg-black p-10 rounded-[40px] border border-stone-800 shadow-2xl relative overflow-hidden group">
      {/* Status glow */}
      <div
        className={cn(
          'absolute top-[-20%] right-[-20%] w-64 h-64 blur-[100px] rounded-full transition-all duration-700',
          glowColor
        )}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <h4 className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.25em] flex items-center gap-3">
          <div
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              loading
                ? 'bg-amber-500 animate-pulse'
                : overallOnline
                  ? 'bg-green-500 animate-pulse'
                  : 'bg-red-500'
            )}
          />
          Trạng thái hệ thống
        </h4>
        <button
          onClick={() => fetchHealth(true)}
          disabled={refreshing || loading}
          className="text-stone-600 hover:text-stone-400 transition-colors"
          title="Làm mới"
        >
          <RefreshCw className={cn('w-3 h-3', (refreshing || loading) && 'animate-spin')} />
        </button>
      </div>

      {/* Services */}
      <div className="space-y-7">
        {services.map((svc) => (
          <StatusRow key={svc.label} {...svc} />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-stone-800 space-y-2">
        {health?.system && (
          <p className="text-[9px] text-stone-600 font-bold uppercase tracking-[0.15em] text-center">
            Uptime: {uptimeLabel(health.system.uptime)}
          </p>
        )}
        <div className="flex items-center justify-center gap-2">
          {overallOnline ? (
            <Wifi className="w-3 h-3 text-green-600" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-600" />
          )}
          <p
            className={cn(
              'text-[10px] font-bold uppercase tracking-[0.2em] text-center italic opacity-60',
              overallOnline ? 'text-stone-400' : loading ? 'text-amber-500' : 'text-red-500'
            )}
          >
            {loading
              ? 'Đang kiểm tra...'
              : overallOnline
                ? 'Hệ thống đang hoạt động ổn định'
                : 'Hệ thống đang gặp sự cố'}
          </p>
        </div>
        {lastChecked && (
          <p className="text-[8px] text-stone-700 font-bold text-center uppercase tracking-widest">
            Kiểm tra lúc:{' '}
            {lastChecked.toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
        )}
      </div>
    </div>
  );
}

function StatusRow({ label, status, latency }: ServiceItem) {
  const isOnline = status === 'online';
  const isDegraded = status === 'degraded';
  const isLoading = status === 'loading';

  const dotClass = isLoading
    ? 'bg-amber-500/50 animate-pulse'
    : isOnline
      ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]'
      : isDegraded
        ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
        : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]';

  const labelText = isLoading
    ? 'checking'
    : isOnline
      ? 'online'
      : isDegraded
        ? 'degraded'
        : 'offline';

  const labelColor = isLoading
    ? 'text-stone-600 opacity-40'
    : isOnline
      ? 'text-stone-600 opacity-60'
      : isDegraded
        ? 'text-amber-500/80'
        : 'text-red-500/80';

  return (
    <div className="flex items-center justify-between group cursor-default">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold text-stone-400 group-hover:text-white transition-colors tracking-tight">
          {label}
        </span>
        {latency !== undefined && (
          <span className="text-[8px] text-stone-700 font-bold uppercase">{latency}ms</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'text-[9px] font-bold uppercase tracking-widest transition-colors',
            labelColor
          )}
        >
          {labelText}
        </span>
        <div
          className={cn('w-2 h-2 rounded-full transition-all group-hover:scale-125', dotClass)}
        />
      </div>
    </div>
  );
}
