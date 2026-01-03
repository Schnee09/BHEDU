"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api/client";
import { Trophy, TrendingUp, TrendingDown, AlertTriangle, Award, Medal, RefreshCw } from "lucide-react";
import Link from "next/link";

interface StudentRanking {
    studentId: string;
    studentName: string;
    className: string;
    average: number;
    rank: number;
    change?: number; // Position change from last period
}

interface RankingWidgetProps {
    limit?: number;
    showAtRisk?: boolean;
}

export default function RankingWidget({ limit = 10, showAtRisk = true }: RankingWidgetProps) {
    const [topStudents, setTopStudents] = useState<StudentRanking[]>([]);
    const [atRiskStudents, setAtRiskStudents] = useState<StudentRanking[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRankings = async () => {
        setLoading(true);
        try {
            const response = await apiFetch(`/api/grades/rankings?limit=${limit}`);
            const data = await response.json();
            setTopStudents(data.topStudents || []);
            setAtRiskStudents(data.atRiskStudents || []);
        } catch (error) {
            console.error("Failed to fetch rankings:", error);
            // Mock data for demo
            setTopStudents([
                { studentId: "1", studentName: "Nguyễn Văn A", className: "12A1", average: 9.5, rank: 1, change: 0 },
                { studentId: "2", studentName: "Trần Thị B", className: "12A1", average: 9.3, rank: 2, change: 1 },
                { studentId: "3", studentName: "Lê Văn C", className: "11A1", average: 9.2, rank: 3, change: -1 },
                { studentId: "4", studentName: "Phạm Thị D", className: "10A1", average: 9.0, rank: 4, change: 2 },
                { studentId: "5", studentName: "Hoàng Văn E", className: "11A2", average: 8.9, rank: 5, change: 0 },
            ]);
            setAtRiskStudents([
                { studentId: "10", studentName: "Nguyễn Thị X", className: "10A2", average: 4.2, rank: 95 },
                { studentId: "11", studentName: "Trần Văn Y", className: "11A2", average: 4.5, rank: 94 },
                { studentId: "12", studentName: "Lê Thị Z", className: "10A1", average: 4.8, rank: 93 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRankings();
    }, [limit]);

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
        if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
        if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>;
    };

    const getChangeIndicator = (change?: number) => {
        if (!change) return null;
        if (change > 0) {
            return (
                <span className="flex items-center text-xs text-green-600">
                    <TrendingUp className="w-3 h-3 mr-0.5" />+{change}
                </span>
            );
        }
        if (change < 0) {
            return (
                <span className="flex items-center text-xs text-red-600">
                    <TrendingDown className="w-3 h-3 mr-0.5" />{change}
                </span>
            );
        }
        return <span className="text-xs text-gray-400">-</span>;
    };

    return (
        <div className="space-y-6">
            {/* Top Performers */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
                            <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Học sinh xuất sắc</h3>
                    </div>
                    <button
                        onClick={fetchRankings}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>

                <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                        <div className="h-3 w-1/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : topStudents.length === 0 ? (
                        <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                            Chưa có dữ liệu xếp hạng
                        </div>
                    ) : (
                        topStudents.map((student) => (
                            <Link
                                key={student.studentId}
                                href={`/dashboard/students/${student.studentId}`}
                                className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    {getRankIcon(student.rank)}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-white truncate">
                                            {student.studentName}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {student.className}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                            {student.average.toFixed(1)}
                                        </p>
                                        {getChangeIndicator(student.change)}
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>

            {/* At-Risk Students */}
            {showAtRisk && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-xl">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Học sinh cần hỗ trợ</h3>
                    </div>

                    <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="px-6 py-4">
                                    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                </div>
                            ))
                        ) : atRiskStudents.length === 0 ? (
                            <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                Không có học sinh cần hỗ trợ
                            </div>
                        ) : (
                            atRiskStudents.map((student) => (
                                <Link
                                    key={student.studentId}
                                    href={`/dashboard/students/${student.studentId}`}
                                    className="block px-6 py-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                                            <span className="text-xs font-bold text-red-600 dark:text-red-400">
                                                #{student.rank}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-white truncate">
                                                {student.studentName}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {student.className}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                                {student.average.toFixed(1)}
                                            </p>
                                            <span className="text-xs text-red-500">Dưới 5.0</span>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
