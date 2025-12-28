'use client';

/**
 * Student Performance Card Component
 * 
 * Displays a compact summary of a student's performance
 * with GPA, trend indicators, risk assessment, and comparison metrics.
 */

import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';

interface StudentPerformanceCardProps {
    studentId: string;
    studentName: string;
    studentCode?: string;
    className?: string;
    currentGPA: number;
    previousGPA?: number;
    classAverage?: number;
    classRank?: number;
    classSize?: number;
    attendanceRate?: number;
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    trend?: 'improving' | 'stable' | 'declining';
    strengths?: string[];
    weaknesses?: string[];
    onClick?: () => void;
}

export default function StudentPerformanceCard({
    studentId,
    studentName,
    studentCode,
    className,
    currentGPA,
    previousGPA,
    classAverage,
    classRank,
    classSize,
    attendanceRate,
    riskLevel = 'low',
    trend = 'stable',
    strengths = [],
    weaknesses = [],
    onClick,
}: StudentPerformanceCardProps) {
    const gpaChange = previousGPA !== undefined ? currentGPA - previousGPA : 0;
    const vsClassAverage = classAverage !== undefined ? currentGPA - classAverage : 0;

    const getAcademicStanding = (gpa: number) => {
        if (gpa >= 9.0) return { label: 'Xuất sắc', color: 'emerald' };
        if (gpa >= 8.0) return { label: 'Giỏi', color: 'blue' };
        if (gpa >= 6.5) return { label: 'Khá', color: 'cyan' };
        if (gpa >= 5.0) return { label: 'Trung bình', color: 'amber' };
        return { label: 'Yếu', color: 'red' };
    };

    const standing = useMemo(() => getAcademicStanding(currentGPA), [currentGPA]);

    const getRiskBadge = () => {
        switch (riskLevel) {
            case 'critical':
                return <Badge variant="danger">Cần can thiệp</Badge>;
            case 'high':
                return <Badge variant="warning">Cảnh báo</Badge>;
            case 'medium':
                return <Badge variant="info">Theo dõi</Badge>;
            default:
                return null;
        }
    };

    const getTrendIcon = () => {
        switch (trend) {
            case 'improving':
                return (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        Tiến bộ
                    </span>
                );
            case 'declining':
                return (
                    <span className="inline-flex items-center gap-1 text-red-600 text-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        Giảm sút
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 text-blue-600 text-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                        Ổn định
                    </span>
                );
        }
    };

    return (
        <Card
            hover
            onClick={onClick}
            className={`relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
        >
            {/* Risk indicator bar */}
            {riskLevel !== 'low' && (
                <div className={`absolute top-0 left-0 right-0 h-1 ${riskLevel === 'critical' ? 'bg-red-500' :
                    riskLevel === 'high' ? 'bg-amber-500' :
                        'bg-blue-500'
                    }`} />
            )}

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-lg text-foreground">{studentName}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {studentCode && <span>{studentCode}</span>}
                            {className && (
                                <>
                                    <span>•</span>
                                    <span>{className}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        {getRiskBadge()}
                        {getTrendIcon()}
                    </div>
                </div>

                {/* GPA Section */}
                <div className="flex items-center gap-6 mb-4">
                    <div className="text-center">
                        <div className={`text-4xl font-bold text-${standing.color}-600`}>
                            {currentGPA.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">Điểm TB</div>
                    </div>

                    <div className="flex-1 space-y-2">
                        {/* Academic Standing */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Học lực:</span>
                            <Badge
                                variant={
                                    standing.color === 'emerald' || standing.color === 'blue' ? 'success' :
                                        standing.color === 'cyan' ? 'info' :
                                            standing.color === 'amber' ? 'warning' : 'error'
                                }
                            >
                                {standing.label}
                            </Badge>
                        </div>

                        {/* GPA Change */}
                        {previousGPA !== undefined && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">So với HK trước:</span>
                                <span className={`text-sm font-medium ${gpaChange > 0 ? 'text-emerald-600' : gpaChange < 0 ? 'text-red-600' : 'text-muted-foreground'
                                    }`}>
                                    {gpaChange > 0 ? '+' : ''}{gpaChange.toFixed(2)}
                                </span>
                            </div>
                        )}

                        {/* vs Class Average */}
                        {classAverage !== undefined && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">So với lớp:</span>
                                <span className={`text-sm font-medium ${vsClassAverage > 0 ? 'text-emerald-600' : vsClassAverage < 0 ? 'text-red-600' : 'text-muted-foreground'
                                    }`}>
                                    {vsClassAverage > 0 ? '+' : ''}{vsClassAverage.toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 py-3 border-t border-border">
                    {classRank !== undefined && classSize !== undefined && (
                        <div className="text-center">
                            <div className="text-lg font-semibold text-foreground">{classRank}/{classSize}</div>
                            <div className="text-xs text-muted-foreground">Xếp hạng</div>
                        </div>
                    )}
                    {attendanceRate !== undefined && (
                        <div className="text-center">
                            <div className={`text-lg font-semibold ${attendanceRate >= 90 ? 'text-emerald-600' :
                                attendanceRate >= 80 ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                {attendanceRate.toFixed(0)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Đi học</div>
                        </div>
                    )}
                    <div className="text-center">
                        <div className="text-lg font-semibold text-purple-600">
                            {strengths.length}
                        </div>
                        <div className="text-xs text-muted-foreground">Môn mạnh</div>
                    </div>
                </div>

                {/* Strengths & Weaknesses */}
                {(strengths.length > 0 || weaknesses.length > 0) && (
                    <div className="pt-3 border-t border-border space-y-2">
                        {strengths.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                <span className="text-xs text-muted-foreground mr-1">Môn mạnh:</span>
                                {strengths.slice(0, 2).map((s, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                        {s}
                                    </span>
                                ))}
                                {strengths.length > 2 && (
                                    <span className="text-xs text-muted-foreground">+{strengths.length - 2}</span>
                                )}
                            </div>
                        )}
                        {weaknesses.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                <span className="text-xs text-muted-foreground mr-1">Cần cải thiện:</span>
                                {weaknesses.slice(0, 2).map((w, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                        {w}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}

export { StudentPerformanceCard };
