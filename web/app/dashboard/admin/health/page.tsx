'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui';
import { useFetch } from '@/hooks/useFetch';

interface HealthData {
  status: string;
  duration_total_ms: number;
  timestamp: string;
  external?: {
    status: string;
    latency_ms: number;
  };
  database?: {
    status: string;
    latency_ms: number;
    connected: boolean;
    error?: string;
  };
  system?: {
    nodeVersion: string;
    env: string;
    uptime: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
    };
  };
}

export default function SystemHealthPage() {
  const { data, loading, error, refetch } = useFetch<HealthData>('/api/health');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        refetch();
      }, 30000); // 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m ${s}s`;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const isHealthy = status === 'healthy' || status === 'ok';
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
          isHealthy
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Icons.Progress className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
              Hệ thống Health
            </h1>
          </div>
          <p className="text-stone-500 font-medium tracking-wide first-letter:uppercase">
            Giám sát trạng thái thời gian thực của các dịch vụ cốt lõi
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-900 p-2 rounded-xl">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-widest px-2">
              Auto-refresh
            </span>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                autoRefresh ? 'bg-indigo-600' : 'bg-stone-300'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  autoRefresh ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <Button
            onClick={() => refetch()}
            disabled={loading}
            className="rounded-xl px-6 py-4 bg-stone-900 text-white font-bold uppercase tracking-widest text-xs hover:bg-stone-800 active:scale-95 transition-all"
          >
            {loading ? <Icons.Progress className="w-4 h-4 animate-spin" /> : 'Làm mới'}
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="border-2 border-red-500/20 bg-red-500/5 p-8 rounded-[40px]">
          <div className="flex items-center gap-4 text-red-600 font-bold">
            <Icons.Warning className="w-8 h-8" />
            <p>Không thể tải dữ liệu sức khỏe hệ thống: {error}</p>
          </div>
        </Card>
      ) : data ? (
        <>
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Database Health */}
            <Card className="rounded-[40px] border-none bg-white dark:bg-stone-900 shadow-xl overflow-hidden group">
              <div className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icons.Classes className="w-8 h-8 text-blue-600" />
                  </div>
                  <StatusBadge status={data.database?.status || 'unknown'} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                    Cơ sở dữ liệu
                  </h3>
                  <p className="text-stone-500 text-sm font-medium mt-1">
                    Supabase PostgreSQL Connection
                  </p>
                </div>
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-end justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                      Độ trễ
                    </p>
                    <p className="text-2xl font-black text-indigo-600">
                      {data.database?.latency_ms}ms
                    </p>
                  </div>
                  {data.database?.connected && (
                    <Icons.Success className="w-6 h-6 text-green-500 mb-1" />
                  )}
                </div>
                {data.database?.error && (
                  <p className="text-xs text-red-500 font-mono italic break-words p-3 bg-red-50 rounded-xl">
                    {data.database.error}
                  </p>
                )}
              </div>
            </Card>

            {/* Network Health */}
            <Card className="rounded-[40px] border-none bg-white dark:bg-stone-900 shadow-xl overflow-hidden group">
              <div className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icons.History className="w-8 h-8 text-amber-600" />
                  </div>
                  <StatusBadge status={data.external?.status || 'unknown'} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                    Kết nối mạng
                  </h3>
                  <p className="text-stone-500 text-sm font-medium mt-1">
                    External API & Google Connectivity
                  </p>
                </div>
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-end justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                      Trung bình
                    </p>
                    <p className="text-2xl font-black text-amber-600">
                      {data.external?.latency_ms}ms
                    </p>
                  </div>
                  <Icons.TrendUp className="w-6 h-6 text-amber-500 mb-1" />
                </div>
              </div>
            </Card>

            {/* Overall Latency */}
            <Card className="rounded-[40px] border-none bg-stone-900 shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[80px] rounded-full" />
              <div className="p-8 space-y-6 relative">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 bg-white/10 rounded-3xl flex items-center justify-center">
                    <Icons.Settings className="w-8 h-8 text-white" />
                  </div>
                  <StatusBadge status={data.status} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    Tổng thể
                  </h3>
                  <p className="text-stone-400 text-sm font-medium mt-1">
                    API Response & Execution Time
                  </p>
                </div>
                <div className="pt-4 border-t border-white/10 flex items-end justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                      Thời gian phản hồi
                    </p>
                    <p className="text-3xl font-black text-white">{data.duration_total_ms}ms</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* System Info */}
            <Card className="rounded-[40px] border-none bg-white dark:bg-stone-900 shadow-xl p-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center">
                  <Icons.Info className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                  Thông tin hệ thống
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                    Node Version
                  </p>
                  <p className="text-lg font-bold text-stone-800 dark:text-stone-200">
                    {data.system?.nodeVersion}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                    Environment
                  </p>
                  <p className="text-lg font-bold text-stone-800 dark:text-stone-200 uppercase">
                    {data.system?.env}
                  </p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                    Uptime
                  </p>
                  <p className="text-lg font-bold text-stone-800 dark:text-stone-200">
                    {formatUptime(data.system?.uptime || 0)}
                  </p>
                </div>
              </div>
            </Card>

            {/* Memory Allocation */}
            <Card className="rounded-[40px] border-none bg-white dark:bg-stone-900 shadow-xl p-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center">
                  <Icons.Chart className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                  Sử dụng bộ nhớ
                </h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-stone-500 uppercase tracking-widest">
                    <span>Heap Used / Total</span>
                    <span>
                      {formatBytes(data.system?.memory.heapUsed || 0)} /{' '}
                      {formatBytes(data.system?.memory.heapTotal || 0)}
                    </span>
                  </div>
                  <div className="h-3 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${((data.system?.memory.heapUsed || 0) / (data.system?.memory.heapTotal || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                    RSS (Resident Set Size)
                  </p>
                  <p className="text-lg font-bold text-stone-800 dark:text-stone-200">
                    {formatBytes(data.system?.memory.rss || 0)}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </>
      ) : (
        <div className="py-20 text-center space-y-4">
          <Icons.Progress className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
          <p className="text-stone-500 font-bold uppercase tracking-widest text-xs">
            Đang kiểm tra sức khỏe hệ thống...
          </p>
        </div>
      )}
    </div>
  );
}
