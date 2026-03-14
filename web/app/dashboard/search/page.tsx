"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import { Search, Users, GraduationCap, LayoutGrid, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
    type: 'student' | 'class' | 'user';
    id: string;
    title: string;
    subtitle?: string;
    href: string;
}

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";

    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        const performSearch = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);
            setSearched(true);

            try {
                const searchResults: SearchResult[] = [];
                const q = query.toLowerCase();

                // 1. Search application features (static mapping)
                const features = [
                    { name: "Thời khóa biểu", href: "/dashboard/timetable", keywords: ["schedule", "lich hoc", "thoi khoa bieu"] },
                    { name: "Điểm danh", href: "/dashboard/attendance", keywords: ["attendance", "diem danh"] },
                    { name: "Học phí & Tài chính", href: "/dashboard/finance", keywords: ["finance", "hoc phi", "tien hoc"] },
                    { name: "Học sinh", href: "/dashboard/students", keywords: ["students", "hoc sinh"] },
                    { name: "Lớp học", href: "/dashboard/classes", keywords: ["classes", "lop hoc"] },
                    { name: "Hồ sơ của tôi", href: "/dashboard/profile", keywords: ["profile", "ca nhan", "ho so"] },
                    { name: "Cài đặt & Bảo mật", href: "/dashboard/settings", keywords: ["settings", "cai dat"] },
                ];

                features.forEach(f => {
                    if (f.name.toLowerCase().includes(q) || f.keywords.some(k => k.includes(q))) {
                        searchResults.push({
                            type: 'user', // Borrowing 'user' badge for UI
                            id: `feature-${f.href}`,
                            title: f.name,
                            subtitle: "Trang ứng dụng",
                            href: f.href
                        });
                    }
                });

                // 2. Search students (V2)
                const studentsRes = await apiFetch(`/api/v2/students?search=${encodeURIComponent(query)}&limit=10`);
                if (studentsRes.ok) {
                    const res = await studentsRes.json();
                    const students = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                    students.forEach((s: any) => {
                        searchResults.push({
                            type: 'student',
                            id: s.id,
                            title: s.full_name || `${s.first_name} ${s.last_name}`,
                            subtitle: s.email || s.student_code,
                            href: `/dashboard/students/${s.id}`
                        });
                    });
                }

                // 3. Search classes (V2)
                const classesRes = await apiFetch(`/api/v2/classes?search=${encodeURIComponent(query)}&limit=10`);
                if (classesRes.ok) {
                    const res = await classesRes.json();
                    const classes = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                    classes.forEach((c: any) => {
                        searchResults.push({
                            type: 'class',
                            id: c.id,
                            title: c.name,
                            subtitle: c.code || "Lớp học hoạt động",
                            href: `/dashboard/classes/${c.id}`
                        });
                    });
                }

                setResults(searchResults);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setLoading(false);
            }
        };

        performSearch();
    }, [query]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'student':
                return <GraduationCap className="w-5 h-5 text-blue-500" />;
            case 'class':
                return <LayoutGrid className="w-5 h-5 text-emerald-500" />;
            case 'user':
                return <Sparkles className="w-5 h-5 text-amber-500" />;
            default:
                return <Search className="w-5 h-5 text-stone-400" />;
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'student':
                return <Badge variant="info" className="text-[10px] font-black uppercase">Học sinh</Badge>;
            case 'class':
                return <Badge variant="success" className="text-[10px] font-black uppercase">Lớp học</Badge>;
            case 'user':
                return <Badge variant="warning" className="text-[10px] font-black uppercase">Tính năng</Badge>;
            default:
                return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-200/50 dark:border-white/5">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-amber-500 rounded-full shadow-accent-glow" />
                        <h1 className="text-3xl md:text-5xl font-serif font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">
                            Tìm kiếm <span className="text-amber-500">BH-EDU</span>
                        </h1>
                    </div>
                    {query && (
                        <p className="text-xs font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] pl-4">
                            Kết quả cho: <span className="text-stone-900 dark:text-stone-100 italic">"{query}"</span>
                        </p>
                    )}
                </div>
            </div>

            {/* Search Box */}
            <Card padding="p-2" className="bg-stone-50/50 dark:bg-white/5 border-stone-200/50 dark:border-white/10 shadow-sm">
                <form action="/dashboard/search" method="GET" className="p-2 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-amber-500 transition-colors" />
                        <input
                            type="text"
                            name="q"
                            defaultValue={query}
                            placeholder="Tìm học sinh, lớp học, tính năng..."
                            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-stone-900/50 border border-stone-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-black text-stone-800 dark:text-white uppercase tracking-tight text-sm placeholder:text-stone-400 transition-all shadow-sm"
                        />
                    </div>
                    <Button type="submit" variant="primary" className="px-8 py-3.5 font-black uppercase tracking-widest text-xs h-auto shadow-amber-glow">
                        Tìm kiếm ngay
                    </Button>
                </form>
            </Card>

            {/* Results Area */}
            <div className="space-y-6">
                {loading ? (
                    <div className="space-y-4 pt-10 text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto" />
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em]">Đang xử lý dữ liệu...</p>
                    </div>
                ) : searched ? (
                    <>
                        {results.length === 0 ? (
                            <div className="py-20 text-center space-y-4 opacity-50">
                                <Search className="w-16 h-16 text-stone-300 mx-auto" />
                                <div className="space-y-1">
                                    <p className="text-xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight">Không tìm thấy kết quả</p>
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Vui lòng thử từ khóa khác để có kết quả tốt hơn</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-3 border-l-4 border-emerald-500">PHÁT HIỆN {results.length} KẾT QUẢ ĐỐI CHIẾU</p>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {results.map((result) => (
                                        <Link key={`${result.type}-${result.id}`} href={result.href} className="group">
                                            <Card padding="p-4" className="hover:border-emerald-500/40 hover:shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
                                                <div className="flex items-center gap-5 relative z-10">
                                                    <div className="w-12 h-12 bg-stone-50 dark:bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-amber-500/10 transition-colors shadow-sm border border-stone-200/50 dark:border-white/5 group-hover:rotate-3">
                                                        {getTypeIcon(result.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="font-black text-stone-900 dark:text-white group-hover:text-amber-600 transition-colors uppercase tracking-tight text-base truncate">
                                                                {result.title}
                                                            </h3>
                                                            {getTypeBadge(result.type)}
                                                        </div>
                                                        {result.subtitle && (
                                                            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest truncate">
                                                                ID: {result.subtitle}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-stone-50 dark:bg-white/5 text-stone-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </div>
                                                </div>
                                                {/* Decorative background element for group hover */}
                                                <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl -mr-12 -mb-12 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="py-24 text-center space-y-6">
                        <div className="w-20 h-20 bg-amber-500/5 rounded-full flex items-center justify-center mx-auto shadow-accent-glow animate-pulse">
                            <Search className="w-10 h-10 text-amber-500" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-2xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight">Khám phá BH-EDU</p>
                            <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em]">Nhập từ khóa để bắt đầu truy vấn hệ thống</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="max-w-4xl mx-auto p-12 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto mb-4" />
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Đang tải tài nguyên trực quan...</p>
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}
