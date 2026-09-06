'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Database,
  Cpu,
  Clock,
  ShieldCheck,
  Zap,
  HardDrive,
  Check,
  Radio,
  ArrowUpRight,
  AlertOctagon,
  Bug,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api/client';
import PageGuard from '@/components/PageGuard';
import type { SystemIncident } from '@/lib/incidentLogger';

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
  return (
    <PageGuard permissions="system.settings">
      <SystemHealthContent />
    </PageGuard>
  );
}

function SystemHealthContent() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { ok: boolean; time: number; note: string }>
  >({});
  const [incidents, setIncidents] = useState<SystemIncident[]>([]);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthRes, incidentsRes] = await Promise.allSettled([
        apiFetch('/api/health'),
        apiFetch('/api/admin/incidents'),
      ]);

      if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
        const json = await healthRes.value.json();
        setData(json);
        setLastRefreshed(new Date());
      } else if (healthRes.status === 'fulfilled') {
        setError('Dịch vụ giám sát trả về mã lỗi: ' + healthRes.value.status);
      }

      if (incidentsRes.status === 'fulfilled' && incidentsRes.value.ok) {
        const incidentsJson = await incidentsRes.value.json();
        if (incidentsJson.success && Array.isArray(incidentsJson.data)) {
          setIncidents(incidentsJson.data);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể kết nối đến API Health');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchHealth();
    }, 20000); // 20s auto refresh
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const runDiagnosticTest = async (testKey: string, endpoint: string) => {
    setTestingEndpoint(testKey);
    const start = performance.now();
    try {
      const res = await apiFetch(endpoint);
      const time = Math.round(performance.now() - start);
      setTestResults((prev) => ({
        ...prev,
        [testKey]: {
          ok: res.ok,
          time,
          note: res.ok ? `Phản hồi tốt (${time}ms)` : `Lỗi ${res.status} (${time}ms)`,
        },
      }));
    } catch {
      const time = Math.round(performance.now() - start);
      setTestResults((prev) => ({
        ...prev,
        [testKey]: { ok: false, time, note: `Mất kết nối (${time}ms)` },
      }));
    } finally {
      setTestingEndpoint(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) {
      return (mb / 1024).toFixed(2) + ' GB';
    }
    return mb.toFixed(1) + ' MB';
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d > 0 ? `${d} ngày ` : ''}${h} giờ ${m} phút ${s}s`;
  };

  const isHealthy = data?.status === 'healthy' || data?.status === 'ok';
  const dbLatency = data?.database?.latency_ms ?? 0;
  const memUsed = data?.system?.memory?.heapUsed || 0;
  const memTotal = data?.system?.memory?.heapTotal || 1;
  const memPercent = Math.min(Math.round((memUsed / memTotal) * 100), 100);

  return (
    <div className="min-h-screen relative overflow-hidden bg-stone-50 dark:bg-[#080808] font-['Be_Vietnam_Pro'] text-stone-900 dark:text-stone-100 p-4 md:p-10 lg:p-12">
      <div className="max-w-[1600px] mx-auto relative z-10 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-200 dark:border-stone-800 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              <Activity className="w-4 h-4" />
              <span>QUẢN TRỊ HỆ THỐNG • SYSTEM HEALTH & OBSERVABILITY</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-stone-950 dark:text-white flex items-center gap-3">
              Giám sát <span className="text-amber-500">Hệ thống</span>
              <span
                className={cn(
                  'text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 align-middle',
                  isHealthy
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                )}
              >
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  )}
                />
                {isHealthy ? 'Hoạt động tốt' : 'Cần kiểm tra'}
              </span>
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              Theo dõi tình trạng thời gian thực của Cơ sở dữ liệu Supabase, Server Node.js và các
              dịch vụ nền tảng
            </p>
          </div>

          {/* Action & Auto Refresh Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm text-xs font-bold">
              <Radio
                className={cn(
                  'w-3.5 h-3.5',
                  autoRefresh ? 'text-emerald-500 animate-pulse' : 'text-stone-400'
                )}
              />
              <span className="text-stone-600 dark:text-stone-300">Tự động làm mới (20s):</span>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={cn(
                  'px-2 py-0.5 rounded-lg text-[10px] font-black uppercase transition-all',
                  autoRefresh
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                )}
              >
                {autoRefresh ? 'BẬT' : 'TẮT'}
              </button>
            </div>

            <button
              onClick={fetchHealth}
              disabled={loading}
              className="px-4 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              Làm mới ngay
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-3 text-xs font-bold">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Top Bento Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Database Metric */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Cơ sở dữ liệu Supabase
              </span>
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
                <Database className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-stone-950 dark:text-white">
                  {dbLatency} <span className="text-sm font-bold text-stone-400">ms</span>
                </h3>
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                    dbLatency < 200
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : dbLatency < 800
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-rose-500/10 text-rose-500'
                  )}
                >
                  {dbLatency < 200 ? 'Rất nhanh' : dbLatency < 800 ? 'Bình thường' : 'Chậm'}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                {data?.database?.connected ? 'Kết nối ổn định' : 'Mất kết nối'}
              </p>
            </div>
          </div>

          {/* Memory Heap Metric */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                RAM Node.js Heap
              </span>
              <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-500">
                <Cpu className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-stone-950 dark:text-white">
                  {formatBytes(memUsed)}
                </h3>
                <span className="text-xs font-bold text-stone-400">/ {formatBytes(memTotal)}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 mt-3 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${memPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* System Uptime */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Thời gian Hoạt động
              </span>
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-black text-stone-950 dark:text-white truncate">
                {formatUptime(data?.system?.uptime)}
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                Node.js {data?.system?.nodeVersion || 'v20+'}
              </p>
            </div>
          </div>

          {/* Overall Health Status */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Môi trường & Trạng thái
              </span>
              <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-500">
                <Server className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-stone-950 dark:text-white uppercase tracking-tight">
                {data?.system?.env || 'Production'}
              </h3>
              <p className="text-xs text-stone-400 mt-1 font-mono">
                Cập nhật lúc: {lastRefreshed.toLocaleTimeString('vi-VN')}
              </p>
            </div>
          </div>
        </div>

        {/* Realtime Incident & Error Tracker */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-100 dark:border-white/5">
            <div>
              <h3 className="text-lg font-black text-stone-950 dark:text-white flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-500" />
                Nhật ký Báo lỗi & Sự cố Thời gian thực (Incident Feed)
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Tự động thu thập các lỗi người dùng, gián đoạn mạng và ngoại lệ hệ thống
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-[11px] font-bold text-stone-600 dark:text-stone-300">
                {incidents.length} sự cố ghi nhận
              </span>
            </div>
          </div>

          {incidents.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">
                Hệ thống đang hoạt động hoàn hảo
              </h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Không ghi nhận sự cố gián đoạn mạng hoặc lỗi ứng dụng nào gần đây.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[11px] text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
                        {inc.id}
                      </span>
                      <span className="font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider text-[10px] bg-stone-200 dark:bg-stone-700 px-1.5 py-0.5 rounded">
                        {inc.type}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {new Date(inc.timestamp).toLocaleTimeString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-stone-700 dark:text-stone-300 font-medium truncate">
                      {inc.message}
                    </p>
                    {inc.userEmail && (
                      <p className="text-[10px] text-stone-400">
                        Người dùng:{' '}
                        <span className="font-semibold text-stone-600 dark:text-stone-300">
                          {inc.userEmail}
                        </span>{' '}
                        ({inc.userRole || 'user'})
                      </p>
                    )}
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase shrink-0 self-start sm:self-center">
                    {inc.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diagnostic Testing Suite */}
        <div className="p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-stone-950 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Kiểm thử Chẩn đoán Dịch vụ Thời gian thực (Diagnostics)
              </h3>
              <p className="text-xs text-stone-500">
                Chủ động gửi ping và kiểm tra khả năng phản hồi của từng phân hệ độc lập
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Test 1: Health Ping */}
            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-white/5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-stone-900 dark:text-white">
                    API Health Endpoint
                  </h4>
                  <span className="text-[10px] font-mono text-stone-400">/api/health</span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Kiểm tra đường truyền trực tiếp đến server Next.js.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-200/60 dark:border-white/5">
                <span className="text-xs font-bold text-stone-600 dark:text-stone-300">
                  {testResults['health']?.note || 'Chưa chạy test'}
                </span>
                <button
                  onClick={() => runDiagnosticTest('health', '/api/health')}
                  disabled={testingEndpoint === 'health'}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {testingEndpoint === 'health' ? 'Đang test...' : 'Chạy test'}
                </button>
              </div>
            </div>

            {/* Test 2: Role Permissions API */}
            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-white/5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-stone-900 dark:text-white">
                    Phân quyền RBAC
                  </h4>
                  <span className="text-[10px] font-mono text-stone-400">/api/admin/roles</span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Kiểm tra kết nối truy xuất ma trận quyền và vai trò.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-200/60 dark:border-white/5">
                <span className="text-xs font-bold text-stone-600 dark:text-stone-300">
                  {testResults['roles']?.note || 'Chưa chạy test'}
                </span>
                <button
                  onClick={() => runDiagnosticTest('roles', '/api/admin/roles')}
                  disabled={testingEndpoint === 'roles'}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {testingEndpoint === 'roles' ? 'Đang test...' : 'Chạy test'}
                </button>
              </div>
            </div>

            {/* Test 3: Academic Timelines */}
            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-white/5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-stone-900 dark:text-white">
                    Học vụ & Năm học
                  </h4>
                  <span className="text-[10px] font-mono text-stone-400">/api/academic-years</span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Kiểm tra khả năng truy vấn cấu hình học vụ cốt lõi.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-200/60 dark:border-white/5">
                <span className="text-xs font-bold text-stone-600 dark:text-stone-300">
                  {testResults['academic']?.note || 'Chưa chạy test'}
                </span>
                <button
                  onClick={() => runDiagnosticTest('academic', '/api/academic-years')}
                  disabled={testingEndpoint === 'academic'}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {testingEndpoint === 'academic' ? 'Đang test...' : 'Chạy test'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Infrastructure Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h4 className="font-bold text-sm text-stone-900 dark:text-white">
                Bảo mật & Rate Limiting
              </h4>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              Hệ thống áp dụng cơ chế <strong>Token Bucket Rate Limit</strong> và mã hóa JWT phiên
              đăng nhập. Các thao tác nhạy cảm của Quản trị hệ thống đều được lưu vết đầy đủ trong
              Nhật ký kiểm toán (Audit Logs).
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-amber-500" />
              <h4 className="font-bold text-sm text-stone-900 dark:text-white">
                Sao lưu & Dự phòng
              </h4>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              Cơ sở dữ liệu Supabase được sao lưu liên tục (Point-in-Time Recovery). Bạn có thể tải
              về bản sao lưu JSON toàn diện bất kỳ lúc nào tại mục{' '}
              <a
                href="/dashboard/admin/backup"
                className="text-amber-500 font-bold hover:underline"
              >
                Sao lưu & Dữ liệu
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
