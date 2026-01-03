"use client";

import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { createBrowserClient } from "@supabase/ssr";
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
} from "lucide-react";

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
    let device = "Desktop";
    let browser = "Unknown";
    let os = "Unknown";

    // Detect device type
    if (/mobile/i.test(ua)) device = "Mobile";
    else if (/tablet|ipad/i.test(ua)) device = "Tablet";

    // Detect browser
    if (/chrome/i.test(ua) && !/edge/i.test(ua)) browser = "Chrome";
    else if (/firefox/i.test(ua)) browser = "Firefox";
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
    else if (/edge/i.test(ua)) browser = "Edge";
    else if (/opera|opr/i.test(ua)) browser = "Opera";

    // Detect OS
    if (/windows/i.test(ua)) os = "Windows";
    else if (/mac os/i.test(ua)) os = "macOS";
    else if (/linux/i.test(ua)) os = "Linux";
    else if (/android/i.test(ua)) os = "Android";
    else if (/ios|iphone|ipad/i.test(ua)) os = "iOS";

    return { device, browser, os };
}

function getDeviceIcon(device: string) {
    switch (device) {
        case "Mobile":
            return <Smartphone className="w-5 h-5" />;
        case "Tablet":
            return <Tablet className="w-5 h-5" />;
        default:
            return <Monitor className="w-5 h-5" />;
    }
}

export default function SessionsPage() {
    const { profile, loading: profileLoading } = useProfile();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [revoking, setRevoking] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchSessions = async () => {
        setLoading(true);
        try {
            // Get current session
            const { data: { session: currentSession } } = await supabase.auth.getSession();

            // Note: Supabase doesn't expose all sessions by default
            // This is a simplified version - in production you'd track sessions in a custom table
            if (currentSession) {
                const mockSessions: Session[] = [
                    {
                        id: currentSession.access_token.slice(0, 16),
                        user_agent: navigator.userAgent,
                        ip: "Current Session",
                        created_at: new Date(currentSession.expires_at! * 1000 - 3600000).toISOString(),
                        updated_at: new Date().toISOString(),
                        is_current: true,
                    },
                ];
                setSessions(mockSessions);
            }
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const revokeSession = async (sessionId: string) => {
        if (sessions.find((s) => s.id === sessionId)?.is_current) {
            // Revoke current session = sign out
            if (!confirm("Bạn có chắc muốn đăng xuất khỏi phiên hiện tại?")) return;
            await supabase.auth.signOut();
            window.location.href = "/login";
            return;
        }

        setRevoking(sessionId);
        try {
            // In production, call API to revoke specific session
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setSessions((prev) => prev.filter((s) => s.id !== sessionId));
            setMessage({ type: "success", text: "Phiên đã được thu hồi" });
        } catch (error) {
            setMessage({ type: "error", text: "Không thể thu hồi phiên" });
        } finally {
            setRevoking(null);
        }
    };

    const revokeAllOtherSessions = async () => {
        if (!confirm("Bạn có chắc muốn đăng xuất khỏi tất cả các thiết bị khác?")) return;

        try {
            // Sign out all other sessions
            await supabase.auth.signOut({ scope: "others" });
            await fetchSessions();
            setMessage({ type: "success", text: "Đã đăng xuất khỏi tất cả thiết bị khác" });
        } catch (error) {
            setMessage({ type: "error", text: "Không thể đăng xuất" });
        }
    };

    if (profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
                            <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản lý phiên đăng nhập</h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                        Xem và quản lý các phiên đăng nhập của bạn trên các thiết bị
                    </p>
                </div>

                {/* Message */}
                {message && (
                    <div
                        className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === "success"
                                ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
                                : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800"
                            }`}
                    >
                        {message.type === "success" ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        )}
                        <p className={message.type === "success" ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
                            {message.text}
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="mb-6 flex gap-3">
                    <button
                        onClick={fetchSessions}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Làm mới
                    </button>
                    {sessions.filter((s) => !s.is_current).length > 0 && (
                        <button
                            onClick={revokeAllOtherSessions}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Đăng xuất tất cả thiết bị khác
                        </button>
                    )}
                </div>

                {/* Sessions List */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Phiên hoạt động</h2>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {loading ? (
                            Array.from({ length: 2 }).map((_, i) => (
                                <div key={i} className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-5 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : sessions.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>Không tìm thấy phiên hoạt động</p>
                            </div>
                        ) : (
                            sessions.map((session) => {
                                const { device, browser, os } = parseUserAgent(session.user_agent);
                                return (
                                    <div
                                        key={session.id}
                                        className={`p-6 ${session.is_current ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Device Icon */}
                                            <div className={`p-3 rounded-xl ${session.is_current
                                                    ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
                                                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                                                }`}>
                                                {getDeviceIcon(device)}
                                            </div>

                                            {/* Session Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                                        {browser} trên {os}
                                                    </h3>
                                                    {session.is_current && (
                                                        <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-full">
                                                            Phiên hiện tại
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Monitor className="w-4 h-4" />
                                                        {device}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        {session.ip}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        Hoạt động {new Date(session.updated_at).toLocaleString("vi-VN")}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Revoke Button */}
                                            <button
                                                onClick={() => revokeSession(session.id)}
                                                disabled={revoking === session.id}
                                                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${session.is_current
                                                        ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                                                    } disabled:opacity-50`}
                                            >
                                                {revoking === session.id ? "..." : session.is_current ? "Đăng xuất" : "Thu hồi"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Security Tips */}
                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <div className="flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-amber-800 dark:text-amber-200">Mẹo bảo mật</p>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                Nếu bạn thấy phiên đăng nhập không quen thuộc, hãy thu hồi ngay và đổi mật khẩu.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
