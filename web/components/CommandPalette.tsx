"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    X,
    Users,
    GraduationCap,
    BookOpen,
    Calendar,
    LayoutDashboard,
    Settings,
    FileText,
    ArrowRight,
    Command
} from "lucide-react";
import { apiFetch } from "@/lib/api/client";

interface SearchResult {
    id: string;
    type: "student" | "class" | "page" | "action";
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    href?: string;
    action?: () => void;
}

const quickActions: SearchResult[] = [
    { id: "dashboard", type: "page", title: "Bảng điều khiển", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "students", type: "page", title: "Quản lý Học sinh", href: "/dashboard/students", icon: <Users className="w-4 h-4" /> },
    { id: "classes", type: "page", title: "Quản lý Lớp học", href: "/dashboard/classes", icon: <GraduationCap className="w-4 h-4" /> },
    { id: "grades", type: "page", title: "Điểm số", href: "/dashboard/grades", icon: <BookOpen className="w-4 h-4" /> },
    { id: "attendance", type: "page", title: "Điểm danh", href: "/dashboard/attendance", icon: <Calendar className="w-4 h-4" /> },
    { id: "reports", type: "page", title: "Báo cáo", href: "/dashboard/reports", icon: <FileText className="w-4 h-4" /> },
    { id: "settings", type: "page", title: "Cài đặt", href: "/dashboard/settings", icon: <Settings className="w-4 h-4" /> },
];

export default function CommandPalette() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Open/close with Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setQuery("");
            setResults(quickActions);
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Search when query changes
    useEffect(() => {
        if (!query.trim()) {
            setResults(quickActions);
            return;
        }

        const searchTimeout = setTimeout(async () => {
            setLoading(true);
            try {
                // Filter quick actions
                const filteredActions = quickActions.filter((action) =>
                    action.title.toLowerCase().includes(query.toLowerCase())
                );

                // Search API for students and classes
                const response = await apiFetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await response.json();

                const apiResults: SearchResult[] = [];

                // Add students
                if (data.students) {
                    data.students.slice(0, 5).forEach((s: { id: string; full_name: string; email?: string }) => {
                        apiResults.push({
                            id: `student-${s.id}`,
                            type: "student",
                            title: s.full_name,
                            subtitle: s.email || "Học sinh",
                            icon: <Users className="w-4 h-4" />,
                            href: `/dashboard/students/${s.id}`,
                        });
                    });
                }

                // Add classes
                if (data.classes) {
                    data.classes.slice(0, 5).forEach((c: { id: string; name: string; grade_level?: string }) => {
                        apiResults.push({
                            id: `class-${c.id}`,
                            type: "class",
                            title: c.name,
                            subtitle: c.grade_level ? `Khối ${c.grade_level}` : "Lớp học",
                            icon: <GraduationCap className="w-4 h-4" />,
                            href: `/dashboard/classes/${c.id}`,
                        });
                    });
                }

                setResults([...filteredActions, ...apiResults]);
            } catch (error) {
                console.error("Search error:", error);
                setResults(quickActions.filter((a) => a.title.toLowerCase().includes(query.toLowerCase())));
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(searchTimeout);
    }, [query]);

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === "Enter") {
                e.preventDefault();
                const selected = results[selectedIndex];
                if (selected) {
                    if (selected.href) {
                        router.push(selected.href);
                        setIsOpen(false);
                    } else if (selected.action) {
                        selected.action();
                        setIsOpen(false);
                    }
                }
            }
        },
        [results, selectedIndex, router]
    );

    const handleSelect = (result: SearchResult) => {
        if (result.href) {
            router.push(result.href);
        } else if (result.action) {
            result.action();
        }
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
                <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Search Input */}
                    <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
                        <Search className="w-5 h-5 text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Tìm kiếm học sinh, lớp học, trang..."
                            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                        />
                        {loading && (
                            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        )}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>

                    {/* Results */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {results.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                Không tìm thấy kết quả
                            </div>
                        ) : (
                            <div className="p-2">
                                {results.map((result, index) => (
                                    <button
                                        key={result.id}
                                        onClick={() => handleSelect(result)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${index === selectedIndex
                                                ? "bg-indigo-50 dark:bg-indigo-900/30"
                                                : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                            }`}
                                    >
                                        <div
                                            className={`p-2 rounded-lg ${result.type === "student"
                                                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                                                    : result.type === "class"
                                                        ? "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
                                                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                                                }`}
                                        >
                                            {result.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-white truncate">
                                                {result.title}
                                            </p>
                                            {result.subtitle && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                    {result.subtitle}
                                                </p>
                                            )}
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-400" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑</kbd>
                                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↓</kbd>
                                để di chuyển
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd>
                                để chọn
                            </span>
                        </div>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd>
                            để đóng
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}
