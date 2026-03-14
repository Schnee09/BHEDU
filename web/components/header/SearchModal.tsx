"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Icons } from "../ui/Icons";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const router = useRouter();
    // Safe client creation - memoized to prevent infinite loops in effects if used in deps
    const supabase = useMemo(() => createClient(), []);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<{ type: 'feature' | 'data', name: string, sub?: string, href: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const selectedRef = useRef<HTMLButtonElement>(null);

    // Feature mapping for search
    const appFeatures = useMemo(() => [
        { name: "Thời khóa biểu", href: routes.timetable.manage(), keywords: ["schedule", "lich hoc", "thoi khoa bieu"] },
        { name: "Điểm danh", href: routes.attendance.list(), keywords: ["attendance", "diem danh"] },
        { name: "Học sinh", href: routes.students.list(), keywords: ["students", "hoc sinh"] },
        { name: "Lớp học", href: routes.classes.list(), keywords: ["classes", "lop hoc"] },
        { name: "Nhập điểm", href: routes.grades.entry(), keywords: ["grades", "nhap diem"] },
        { name: "Hồ sơ cá nhân", href: routes.profile(), keywords: ["profile", "ca nhan", "ho so"] },
        { name: "Cài đặt", href: "/dashboard/settings", keywords: ["settings", "cai dat"] },
    ], []);

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery("");
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            const results: any[] = [];
            const q = searchQuery.toLowerCase();

            // 1. Match features
            appFeatures.forEach(f => {
                if (f.name.toLowerCase().includes(q) || f.keywords.some(k => k.includes(q))) {
                    results.push({ type: 'feature', name: f.name, href: f.href });
                }
            });

            // 2. Async data search (subset for preview)
            try {
                if (q.length > 1) {
                    const [studentsRes, classesRes] = await Promise.all([
                        supabase.from('profiles').select('id, full_name, role').eq('role', 'student').ilike('full_name', `%${q}%`).limit(3),
                        supabase.from('classes').select('id, name').ilike('name', `%${q}%`).limit(2)
                    ]);

                    studentsRes.data?.forEach((s: any) => results.push({ type: 'data', name: s.full_name, sub: 'Học sinh', href: `/dashboard/students/${s.id}` }));
                    classesRes.data?.forEach((c: any) => results.push({ type: 'data', name: c.name, sub: 'Lớp học', href: `/dashboard/classes/${c.id}` }));
                }
            } catch (e) {
                console.error("Search preview error:", e);
            }

            setSearchResults(results.slice(0, 8));
            setSelectedIndex(0);
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, appFeatures, supabase, isOpen]);

    // Handle keyboard navigation for search results
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || searchResults.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % searchResults.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
        } else if (e.key === "Enter" && selectedIndex >= 0) {
            e.preventDefault();
            const selected = searchResults[selectedIndex];
            if (selected) {
                router.push(selected.href);
                onClose();
            }
        }
    };

    // Auto-scroll into view when selectedIndex changes
    useEffect(() => {
        if (isOpen && selectedRef.current) {
            selectedRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [selectedIndex, isOpen]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-2xl animate-fade-in" onClick={onClose} />
            <div className="fixed inset-0 md:inset-auto md:top-24 md:left-1/2 md:-translate-x-1/2 md:w-[700px] md:max-h-[80vh] bg-white dark:bg-[#1C1A16] md:rounded-[32px] z-[110] animate-scale-in flex flex-col overflow-hidden shadow-[0_64px_128px_-24px_rgba(0,0,0,0.6)] border border-white/5">
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-stone-50/50 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                            <MagnifyingGlassIcon className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tighter uppercase whitespace-nowrap">Tìm kiếm nhanh</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 rounded-2xl bg-stone-100 dark:bg-white/5 text-stone-500 hover:bg-red-500 hover:text-white transition-all active:scale-90"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 md:p-10">
                    <form onSubmit={handleSearchSubmit} className="relative group">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm học sinh, lớp học, tính năng..."
                            className="w-full h-20 pl-16 pr-6 rounded-[28px] bg-stone-100/80 dark:bg-white/5 border-2 border-transparent focus:border-amber-500 transition-all text-xl md:text-2xl font-black tracking-tight placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:bg-white dark:focus:bg-stone-900 shadow-inner outline-none"
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                        <div className="absolute left-6 top-1/2 -translate-y-1/2">
                            <MagnifyingGlassIcon className="w-8 h-8 text-amber-500" />
                        </div>
                    </form>

                    <div className="mt-8 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar" ref={scrollContainerRef}>
                        {isSearching ? (
                            <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                                <p className="text-sm font-black text-stone-400 uppercase tracking-widest">Đang tìm kiếm...</p>
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2">
                                {searchResults.map((result, idx) => {
                                    const showHeader = idx === 0 || searchResults[idx - 1].type !== result.type;
                                    const isSelected = selectedIndex === idx;

                                    return (
                                        <React.Fragment key={idx}>
                                            {showHeader && (
                                                <div className={cn("px-4 py-3", idx > 0 && "mt-4")}>
                                                    <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">
                                                        {result.type === 'feature' ? "Phím tắt hệ thống" : "Hồ sơ dữ liệu"}
                                                    </p>
                                                </div>
                                            )}
                                            <button
                                                ref={isSelected ? selectedRef : null}
                                                onMouseEnter={() => setSelectedIndex(idx)}
                                                onClick={() => {
                                                    router.push(result.href);
                                                    onClose();
                                                }}
                                                className={cn(
                                                    "flex items-center gap-4 p-4 rounded-2xl transition-all text-left group border border-transparent",
                                                    isSelected
                                                        ? "bg-amber-100/50 dark:bg-amber-500/10 border-amber-500/30 scale-[1.02] shadow-sm flex-1 md:ml-2"
                                                        : "bg-stone-50/50 dark:bg-white/5 flex-1"
                                                )}
                                            >
                                                <div className={cn(
                                                    "p-2.5 rounded-xl transition-colors shrink-0",
                                                    isSelected ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "bg-amber-500/10 text-amber-600"
                                                )}>
                                                    {result.type === 'feature' ? <Icons.Settings className="w-5 h-5" /> : <Icons.User className="w-5 h-5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn(
                                                        "text-sm font-black transition-colors uppercase tracking-tight truncate",
                                                        isSelected ? "text-amber-600 dark:text-amber-500" : "text-stone-900 dark:text-white"
                                                    )}>
                                                        {result.name}
                                                    </p>
                                                    {result.sub ? (
                                                        <p className="text-[10px] font-bold text-stone-500 dark:text-stone-400 mt-0.5">{result.sub}</p>
                                                    ) : (
                                                        <p className="text-[10px] font-bold text-stone-500 dark:text-stone-400 mt-0.5">Mô-đun hệ thống</p>
                                                    )}
                                                </div>
                                                <Icons.ChevronRight className={cn(
                                                    "w-4 h-4 transition-all shrink-0",
                                                    isSelected ? "text-amber-500 translate-x-1" : "text-stone-300"
                                                )} />
                                            </button>
                                        </React.Fragment>
                                    );
                                })}

                                <button
                                    onClick={handleSearchSubmit}
                                    className="mt-6 py-4 text-center text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] hover:opacity-80 transition-opacity border-t border-white/5 mx-4"
                                >
                                    Bấm ENTER để xem tất cả kết quả →
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-px flex-1 bg-white/5"></div>
                                    <p className="text-[10px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.4em]">Truy cập nhanh</p>
                                    <div className="h-px flex-1 bg-white/5"></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { name: 'Thời khóa biểu', icon: Icons.Calendar, href: routes.timetable.manage() },
                                        { name: 'Điểm danh', icon: Icons.Clipboard, href: routes.attendance.list() },
                                        { name: 'Học sinh', icon: Icons.User, href: routes.students.list() }
                                    ].map((item, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { router.push(item.href); onClose(); }}
                                            className="flex items-center gap-4 p-4 rounded-2xl border border-stone-100 dark:border-white/5 bg-white dark:bg-white/5 hover:border-amber-500 hover:bg-amber-500/10 transition-all group"
                                        >
                                            <div className="p-2 rounded-xl bg-stone-100 dark:bg-white/5 group-hover:bg-amber-500 group-hover:text-white transition-colors shrink-0">
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-black text-stone-600 dark:text-stone-300 group-hover:text-amber-600 transition-colors uppercase tracking-tight truncate">{item.name}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-10 flex items-center gap-3 mb-6">
                                    <div className="h-px flex-1 bg-white/5"></div>
                                    <p className="text-[10px] font-black text-stone-400 dark:text-stone-600 uppercase tracking-[0.4em]">Tìm kiếm phổ biến</p>
                                    <div className="h-px flex-1 bg-white/5"></div>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {['HS2024', 'Lớp 10A1', 'Học phí quý 1', 'Nguyễn Văn A'].map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => { setSearchQuery(tag); }}
                                            className="px-5 py-2.5 rounded-xl border border-stone-100 dark:border-white/5 bg-white dark:bg-white/5 hover:border-amber-500 hover:bg-amber-500/10 hover:text-amber-600 transition-all text-xs font-black text-stone-500 dark:text-stone-400"
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
