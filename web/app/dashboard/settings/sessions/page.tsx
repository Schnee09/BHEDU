'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  MapPin,
  LogOut,
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Session {
  id: string;
  user_agent: string;
  ip: string;
  created_at: string;
  updated_at: string;
  is_current: boolean;
}

// Parse user agent to get device info
function parseUserAgent(ua: string): { device: string; browser: string; os: string } {
  let device = 'Desktop';
  let browser = 'Unknown';
  let os = 'Unknown';

  // Detect device type
  if (/mobile/i.test(ua)) device = 'Mobile';
  else if (/tablet|ipad/i.test(ua)) device = 'Tablet';

  // Detect browser
  if (/chrome/i.test(ua) && !/edge/i.test(ua)) browser = 'Chrome';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/edge/i.test(ua)) browser = 'Edge';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';

  // Detect OS
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac os/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/ios|iphone|ipad/i.test(ua)) os = 'iOS';

  return { device, browser, os };
}

function getDeviceIcon(device: string) {
  switch (device) {
    case 'Mobile':
      return <Smartphone className="w-5 h-5" />;
    case 'Tablet':
      return <Tablet className="w-5 h-5" />;
    default:
      return <Monitor className="w-5 h-5" />;
  }
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      if (currentSession) {
        const currentSessions: Session[] = [
          {
            id: currentSession.access_token.slice(0, 16),
            user_agent: navigator.userAgent,
            ip: 'Thiết bị hiện tại',
            created_at: currentSession.user.last_sign_in_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_current: true,
          },
        ];
        setSessions(currentSessions);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchSessions(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchSessions]);

  const signOutCurrentSession = async () => {
    if (!confirm('Bạn có chắc muốn đăng xuất khỏi phiên hiện tại?')) return;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/login');
      router.refresh();
    } catch {
      setMessage({ type: 'error', text: 'Không thể đăng xuất phiên hiện tại' });
    }
  };

  const revokeAllOtherSessions = async () => {
    if (!confirm('Bạn có chắc muốn đăng xuất khỏi tất cả các thiết bị khác?')) return;
    try {
      const { error } = await supabase.auth.signOut({ scope: 'others' });
      if (error) throw error;
      const current = sessions.find((s) => s.is_current);
      setSessions(current ? [current] : []);
      setMessage({ type: 'success', text: 'Đã thu hồi tất cả các phiên đăng nhập khác' });
    } catch {
      setMessage({ type: 'error', text: 'Không thể thu hồi các phiên khác' });
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header with Security Status */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-2">
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-3 h-3" /> Bảo mật tài khoản
            </span>
          </div>
          <h1 className="text-4xl font-black text-stone-950 dark:text-white tracking-tighter leading-none">
            Thiết bị đăng nhập
          </h1>
          <p className="text-stone-500 dark:text-stone-400 font-medium tracking-tight">
            Kiểm tra thiết bị hiện tại và đăng xuất khỏi các thiết bị khác
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSessions}
            className="p-4 bg-white dark:bg-white/5 border border-stone-100 dark:border-white/10 rounded-2xl hover:bg-stone-50 transition-all press-effect"
          >
            <RefreshCw className={cn('w-5 h-5 text-stone-400', loading && 'animate-spin')} />
          </button>
          <button
            onClick={revokeAllOtherSessions}
            className="h-14 px-6 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:shadow-xl hover:shadow-red-500/20 active:scale-95 press-effect flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Đăng xuất thiết bị khác
          </button>
        </div>
      </div>

      {/* Security Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-[32px] bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/10 space-y-2">
          <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">
            Trạng thái phiên
          </p>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg text-green-600">
              <CheckCircle className="w-5 h-5" />
            </div>
            <p className="text-lg font-black text-green-700 dark:text-green-400 tracking-tight">
              Đang hoạt động
            </p>
          </div>
        </div>
        <div className="p-6 rounded-[32px] bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/10 space-y-2">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
            Phiên đang hiển thị
          </p>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-600">
              <Monitor className="w-5 h-5" />
            </div>
            <p className="text-lg font-black text-blue-700 dark:text-blue-400 tracking-tight">
              {sessions.length} Thiết bị
            </p>
          </div>
        </div>
        <div className="p-6 rounded-[32px] bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/10 space-y-2">
          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
            Vị trí đăng nhập
          </p>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-600">
              <MapPin className="w-5 h-5" />
            </div>
            <p className="text-lg font-black text-amber-700 dark:text-amber-400 tracking-tight">
              Việt Nam
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={cn(
            'p-6 rounded-3xl flex items-center gap-4 animate-fade-in-up border',
            message.type === 'success'
              ? 'bg-green-500/10 text-green-600 border-green-500/20'
              : 'bg-red-500/10 text-red-600 border-red-500/20'
          )}
        >
          <CheckCircle className="w-6 h-6" />
          <p className="font-bold tracking-tight">{message.text}</p>
        </div>
      )}

      {/* Sessions List */}
      <div className="glass-premium rounded-[48px] overflow-hidden border border-stone-100 dark:border-white/5 shadow-sm">
        <div className="px-10 py-8 border-b border-stone-100 dark:border-white/5 flex items-center justify-between bg-stone-50/50 dark:bg-white/2">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-stone-400">
            Phiên đăng nhập hiện tại
          </h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">
              Đã xác thực
            </span>
          </div>
        </div>

        <div className="divide-y divide-stone-50 dark:divide-white/5">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-10 flex items-center gap-6 animate-pulse">
                <div className="w-16 h-16 rounded-[24px] bg-stone-100 dark:bg-white/5" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 w-1/4 bg-stone-100 dark:bg-white/5 rounded-full" />
                  <div className="h-4 w-1/2 bg-stone-50 dark:bg-white/2 rounded-full" />
                </div>
              </div>
            ))
          ) : sessions.length === 0 ? (
            <div className="p-20 text-center space-y-4">
              <Globe className="w-16 h-16 mx-auto text-stone-200" />
              <p className="text-stone-400 font-medium italic">
                Không phát hiện phiên hoạt động nào
              </p>
            </div>
          ) : (
            sessions.map((session) => {
              const { device, browser, os } = parseUserAgent(session.user_agent);
              return (
                <div
                  key={session.id}
                  className={cn(
                    'p-10 flex flex-col md:flex-row items-center gap-8 transition-all hover:bg-stone-50/40 dark:hover:bg-white/1 relative group',
                    session.is_current && 'bg-blue-500/[0.02]'
                  )}
                >
                  {/* Device Visualization */}
                  <div className="relative">
                    <div
                      className={cn(
                        'w-20 h-20 rounded-[32px] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110',
                        session.is_current
                          ? 'bg-blue-500 text-white shadow-blue-500/20'
                          : 'bg-stone-100 dark:bg-white/5 text-stone-400'
                      )}
                    >
                      {getDeviceIcon(device)}
                    </div>
                    {session.is_current && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white dark:border-[#1A1410] rounded-full" />
                    )}
                  </div>

                  {/* Session Info */}
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <h3 className="text-xl font-black text-stone-900 dark:text-white tracking-tight">
                        {browser} &bull; {os}
                      </h3>
                      {session.is_current && (
                        <span className="px-3 py-1 text-[9px] font-black uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full border border-blue-500/20">
                          Đang đăng nhập
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-sm font-medium text-stone-500 dark:text-stone-400">
                      <span className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 opacity-40" /> {device}
                      </span>
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 opacity-40" /> {session.ip}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4 opacity-40" />{' '}
                        {new Date(session.updated_at).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  {/* Revoke Button */}
                  <button
                    onClick={signOutCurrentSession}
                    className={cn(
                      'h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all press-effect',
                      session.is_current
                        ? 'text-red-500 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10'
                        : 'text-stone-400 bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10'
                    )}
                  >
                    {session.is_current ? 'Đăng xuất' : 'Thu hồi thiết bị'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Security Tips Drawer */}
      <div className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-[40px] flex items-start gap-6">
        <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-600">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-black text-amber-700 dark:text-amber-500 tracking-tight uppercase">
            Mẹo bảo mật tài khoản
          </p>
          <p className="text-sm text-amber-600/80 font-medium">
            Chúng tôi khuyên bạn nên kiểm tra danh sách này hàng tuần. Nếu phát hiện thiết bị lạ từ
            các trình duyệt cũ hoặc vị trí không xác định, hãy thu hồi ngay lập tức và kích hoạt xác
            thực 2 lớp.
          </p>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={() => router.back()}
          className="text-[10px] font-black uppercase text-stone-400 tracking-[0.3em] hover:text-stone-600 transition-colors"
        >
          Quay lại
        </button>
      </div>
    </div>
  );
}
