'use client'

/**
 * Student Progress Chart Component
 * 
 * Displays visual charts for student grade trends:
 * - Line chart for grades over time
 * - Bar chart for subject comparison
 * - Summary statistics cards
 */

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import {
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    AcademicCapIcon,
    ChartBarIcon,
    SparklesIcon
} from '@heroicons/react/24/outline'

interface TrendDataPoint {
    month: string
    label: string
    average: number
    count: number
}

interface SubjectData {
    subjectId: string
    subjectName: string
    average: number
    count: number
}

interface GradeHistoryData {
    student: {
        id: string
        name: string
        studentCode: string
        gradeLevel: string
    }
    summary: {
        totalGrades: number
        overallAverage: number
        improvement: number
        bestSubject: string | null
        weakestSubject: string | null
    }
    trendData: TrendDataPoint[]
    subjectData: SubjectData[]
}

interface StudentProgressChartProps {
    studentId: string
}

export default function StudentProgressChart({ studentId }: StudentProgressChartProps) {
    const [data, setData] = useState<GradeHistoryData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true)
                const response = await apiFetch(`/api/students/${studentId}/grade-history`)
                if (response.ok) {
                    const json = await response.json()
                    setData(json)
                } else {
                    setError('Không thể tải dữ liệu')
                }
            } catch (err) {
                setError('Lỗi khi tải dữ liệu')
            } finally {
                setLoading(false)
            }
        }

        if (studentId) {
            loadData()
        }
    }, [studentId])

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-40 bg-gray-200 rounded-xl" />
                <div className="h-64 bg-gray-200 rounded-xl" />
            </div>
        )
    }

    if (error || !data) {
        return (
            <Card className="bg-gray-50">
                <CardBody>
                    <p className="text-gray-500 text-center py-8">{error || 'Không có dữ liệu'}</p>
                </CardBody>
            </Card>
        )
    }

    const { summary, trendData, subjectData } = data
    const maxScore = Math.max(...trendData.map(d => d.average), 10)

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard
                    icon={<AcademicCapIcon className="w-5 h-5" />}
                    label="Điểm trung bình"
                    value={`${summary.overallAverage.toFixed(1)}`}
                    color="indigo"
                />
                <SummaryCard
                    icon={summary.improvement >= 0 ? <ArrowTrendingUpIcon className="w-5 h-5" /> : <ArrowTrendingDownIcon className="w-5 h-5" />}
                    label="Tiến bộ"
                    value={`${summary.improvement > 0 ? '+' : ''}${summary.improvement.toFixed(1)}`}
                    color={summary.improvement >= 0 ? 'emerald' : 'red'}
                />
                <SummaryCard
                    icon={<SparklesIcon className="w-5 h-5" />}
                    label="Môn mạnh nhất"
                    value={summary.bestSubject || '-'}
                    color="amber"
                    small
                />
                <SummaryCard
                    icon={<ChartBarIcon className="w-5 h-5" />}
                    label="Tổng số điểm"
                    value={`${summary.totalGrades}`}
                    color="blue"
                />
            </div>

            {/* Trend Line Chart */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <ArrowTrendingUpIcon className="w-5 h-5 text-indigo-600" />
                        Xu hướng điểm theo thời gian
                    </h3>
                </CardHeader>
                <CardBody>
                    {trendData.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Chưa có dữ liệu</p>
                    ) : (
                        <div className="h-64 relative">
                            {/* Y-axis labels */}
                            <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-gray-500">
                                <span>10</span>
                                <span>7.5</span>
                                <span>5</span>
                                <span>2.5</span>
                                <span>0</span>
                            </div>

                            {/* Chart Area */}
                            <div className="ml-10 h-56 flex items-end gap-1 border-b border-l border-gray-200 relative">
                                {/* Grid lines */}
                                <div className="absolute inset-0">
                                    {[0.25, 0.5, 0.75, 1].map((level) => (
                                        <div
                                            key={level}
                                            className="absolute w-full border-t border-gray-100"
                                            style={{ bottom: `${level * 100}%` }}
                                        />
                                    ))}
                                </div>

                                {/* Data points and line */}
                                <svg className="absolute inset-0 overflow-visible" preserveAspectRatio="none">
                                    {/* Line connecting points */}
                                    <polyline
                                        fill="none"
                                        stroke="#6366f1"
                                        strokeWidth="2"
                                        points={trendData.map((d, i) => {
                                            const x = ((i + 0.5) / trendData.length) * 100
                                            const y = 100 - (d.average / 10) * 100
                                            return `${x}%,${y}%`
                                        }).join(' ')}
                                    />
                                    {/* Data points */}
                                    {trendData.map((d, i) => {
                                        const x = ((i + 0.5) / trendData.length) * 100
                                        const y = 100 - (d.average / 10) * 100
                                        return (
                                            <circle
                                                key={i}
                                                cx={`${x}%`}
                                                cy={`${y}%`}
                                                r="5"
                                                fill="#6366f1"
                                                stroke="white"
                                                strokeWidth="2"
                                            />
                                        )
                                    })}
                                </svg>

                                {/* Bars for visual reference */}
                                {trendData.map((d, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 flex flex-col items-center justify-end group relative"
                                    >
                                        <div
                                            className="w-full max-w-8 bg-indigo-100 hover:bg-indigo-200 rounded-t transition-all"
                                            style={{ height: `${(d.average / 10) * 100}%` }}
                                        />

                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                            {d.label}: {d.average.toFixed(1)} ({d.count} điểm)
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* X-axis labels */}
                            <div className="ml-10 flex justify-between text-xs text-gray-500 mt-2">
                                {trendData.map((d, i) => (
                                    <span key={i} className="flex-1 text-center truncate">
                                        {d.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Subject Bar Chart */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <ChartBarIcon className="w-5 h-5 text-emerald-600" />
                        Điểm theo môn học
                    </h3>
                </CardHeader>
                <CardBody>
                    {subjectData.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Chưa có dữ liệu</p>
                    ) : (
                        <div className="space-y-4">
                            {subjectData.map((subject, i) => (
                                <div key={subject.subjectId} className="flex items-center gap-4">
                                    <span className="w-32 text-sm text-gray-600 truncate">
                                        {subject.subjectName}
                                    </span>
                                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${getBarColor(i)}`}
                                            style={{ width: `${(subject.average / 10) * 100}%` }}
                                        />
                                    </div>
                                    <span className={`w-12 text-sm font-semibold ${getScoreColor(subject.average)}`}>
                                        {subject.average.toFixed(1)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    )
}

function SummaryCard({
    icon,
    label,
    value,
    color,
    small
}: {
    icon: React.ReactNode
    label: string
    value: string
    color: 'indigo' | 'emerald' | 'red' | 'amber' | 'blue'
    small?: boolean
}) {
    const colorClasses = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        red: 'bg-red-50 text-red-600',
        amber: 'bg-amber-50 text-amber-600',
        blue: 'bg-blue-50 text-blue-600'
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
                {icon}
            </div>
            <p className="text-sm text-gray-500 mt-3">{label}</p>
            <p className={`font-bold ${small ? 'text-sm' : 'text-xl'} text-gray-900 truncate`}>{value}</p>
        </div>
    )
}

function getBarColor(index: number): string {
    const colors = [
        'bg-emerald-500',
        'bg-blue-500',
        'bg-indigo-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-amber-500',
        'bg-teal-500',
        'bg-cyan-500'
    ]
    return colors[index % colors.length]
}

function getScoreColor(score: number): string {
    if (score >= 8) return 'text-emerald-600'
    if (score >= 6.5) return 'text-blue-600'
    if (score >= 5) return 'text-amber-600'
    return 'text-red-600'
}
