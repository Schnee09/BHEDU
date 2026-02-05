"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { Card, LoadingState, Badge, Button } from "@/components/ui";
import { Icons } from "@/components/ui/Icons";

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
                    // Handle V2 paginated structure { success, data: { data: [], ... } }
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
                return <Icons.Students className="w-5 h-5 text-blue-600" />;
            case 'class':
                return <Icons.Classes className="w-5 h-5 text-green-600" />;
            case 'user':
                return <Icons.Users className="w-5 h-5 text-purple-600" />;
            default:
                return <Icons.Search className="w-5 h-5 text-gray-600" />;
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'student':
                return <Badge variant="info">Học sinh</Badge>;
            case 'class':
                return <Badge variant="success">Lớp học</Badge>;
            case 'user':
                return <Badge variant="warning">Người dùng</Badge>;
            default:
                return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Icons.Search className="w-8 h-8 text-gray-600" />
                    Tìm kiếm
                </h1>
                {query && (
                    <p className="text-gray-600 mt-1">
                        Kết quả tìm kiếm cho: <strong>"{query}"</strong>
                    </p>
                )}
            </div>

            {/* Search Box */}
            <Card className="mb-6">
                <form action="/dashboard/search" method="GET" className="p-4">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            name="q"
                            defaultValue={query}
                            placeholder="Tìm học sinh, lớp học, người dùng..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Button type="submit">
                            Tìm kiếm
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Loading */}
            {loading && (
                <Card className="p-8 text-center">
                    <Icons.Progress className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-gray-600">Đang tìm kiếm...</p>
                </Card>
            )}

            {/* Results */}
            {!loading && searched && (
                <>
                    {results.length === 0 ? (
                        <Card className="p-8 text-center">
                            <Icons.Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600">Không tìm thấy kết quả nào cho "{query}"</p>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-500">Tìm thấy {results.length} kết quả</p>
                            {results.map((result) => (
                                <Link key={`${result.type}-${result.id}`} href={result.href}>
                                    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-gray-100 rounded-lg">
                                                {getTypeIcon(result.type)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-gray-900">{result.title}</h3>
                                                    {getTypeBadge(result.type)}
                                                </div>
                                                {result.subtitle && (
                                                    <p className="text-sm text-gray-600">{result.subtitle}</p>
                                                )}
                                            </div>
                                            <Icons.ChevronRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Initial State */}
            {!loading && !searched && (
                <Card className="p-8 text-center">
                    <Icons.Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Nhập từ khóa để tìm kiếm</p>
                    <p className="text-sm text-gray-500 mt-1">
                        Bạn có thể tìm kiếm học sinh, lớp học, hoặc người dùng
                    </p>
                </Card>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<LoadingState message="Đang tải trang tìm kiếm..." />}>
            <SearchContent />
        </Suspense>
    );
}
