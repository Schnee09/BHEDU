import {
  Trophy,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Award,
  Medal,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useFetch } from '@/hooks/useFetch';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

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
  teacherId?: string;
}

export default function RankingWidget({
  limit = 10,
  showAtRisk = true,
  teacherId,
}: RankingWidgetProps) {
  const { data, loading, error, refetch } = useFetch<{
    topStudents: StudentRanking[];
    atRiskStudents: StudentRanking[];
  }>(
    teacherId
      ? `/api/grades/rankings?limit=${limit}&teacher_id=${teacherId}`
      : `/api/grades/rankings?limit=${limit}`
  );

  const topStudents = data?.topStudents || [];
  const atRiskStudents = data?.atRiskStudents || [];

  const getRankIcon = (rank: number) => {
    if (rank === 1)
      return (
        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shadow-accent-glow">
          <Trophy className="w-4 h-4 text-amber-500" />
        </div>
      );
    if (rank === 2)
      return (
        <div className="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center">
          <Medal className="w-4 h-4 text-slate-400" />
        </div>
      );
    if (rank === 3)
      return (
        <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
          <Medal className="w-4 h-4 text-orange-600" />
        </div>
      );
    return (
      <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-black text-stone-400">
        #{rank}
      </div>
    );
  };

  const getChangeIndicator = (change?: number) => {
    if (!change) return null;
    if (change > 0) {
      return (
        <span className="flex items-center text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
          <TrendingUp className="w-2.5 h-2.5 mr-0.5" />+{change}
        </span>
      );
    }
    if (change < 0) {
      return (
        <span className="flex items-center text-[10px] font-black text-red-600 uppercase tracking-tighter">
          <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
          {change}
        </span>
      );
    }
    return <span className="text-[10px] text-stone-400">-</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Performers */}
      <Card padding="p-0">
        <CardHeader className="flex items-center justify-between border-b border-stone-100 dark:border-white/5 bg-stone-50/30 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl shadow-accent-glow">
              <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="font-serif font-black text-lg text-stone-900 dark:text-white uppercase tracking-tight">
              Học sinh xuất sắc
            </h3>
          </div>
          <button
            onClick={refetch}
            className={cn(
              'p-2 hover:bg-stone-100 dark:hover:bg-white/10 rounded-lg transition-all',
              loading && 'opacity-50 pointer-events-none'
            )}
            disabled={loading}
          >
            <RefreshCw className={cn('w-4 h-4 text-stone-400', loading && 'animate-spin')} />
          </button>
        </CardHeader>

        <div className="divide-y divide-stone-50 dark:divide-white/5">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-white/5 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 bg-stone-100 dark:bg-white/5 rounded animate-pulse" />
                  <div className="h-3 w-1/4 bg-stone-100 dark:bg-white/5 rounded animate-pulse" />
                </div>
              </div>
            ))
          ) : topStudents.length === 0 ? (
            <div className="px-6 py-10 text-center text-stone-500 dark:text-stone-400 font-medium">
              Chưa có dữ liệu xếp hạng
            </div>
          ) : (
            topStudents.map((student) => (
              <Link
                key={student.studentId}
                href={`/dashboard/students/${student.studentId}`}
                className="group flex items-center gap-4 px-6 py-4 hover:bg-stone-50 dark:hover:bg-white/5 transition-all duration-300"
              >
                {getRankIcon(student.rank)}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-stone-900 dark:text-white truncate group-hover:text-amber-600 transition-colors uppercase text-sm tracking-tight">
                    {student.studentName}
                  </p>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">
                    {student.className}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tighter">
                    {student.average.toFixed(1)}
                  </p>
                  {getChangeIndicator(student.change)}
                </div>
              </Link>
            ))
          )}
        </div>
      </Card>

      {/* At-Risk Students */}
      {showAtRisk && (
        <Card padding="p-0" className="border-red-500/20">
          <CardHeader className="flex items-center gap-3 border-b border-stone-100 dark:border-white/5 bg-red-500/5">
            <div className="p-2 bg-red-500/10 rounded-xl shadow-red-glow">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="font-serif font-black text-lg text-stone-900 dark:text-white uppercase tracking-tight">
              Cần hỗ trợ
            </h3>
          </CardHeader>

          <div className="divide-y divide-stone-50 dark:divide-white/5">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-6 py-4">
                  <div className="h-12 bg-stone-100 dark:bg-white/5 rounded animate-pulse" />
                </div>
              ))
            ) : atRiskStudents.length === 0 ? (
              <div className="px-6 py-8 text-center text-stone-500 dark:text-stone-400">
                Không có học sinh cần hỗ trợ
              </div>
            ) : (
              atRiskStudents.map((student) => (
                <Link
                  key={student.studentId}
                  href={`/dashboard/students/${student.studentId}`}
                  className="group flex items-center gap-4 px-6 py-4 hover:bg-red-500/5 transition-all duration-300"
                >
                  <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <span className="text-[10px] font-black text-red-600 dark:text-red-400">
                      #{student.rank}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-stone-900 dark:text-white truncate uppercase text-sm tracking-tight group-hover:text-red-600 transition-colors">
                      {student.studentName}
                    </p>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">
                      {student.className}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-red-600 dark:text-red-400 tabular-nums tracking-tighter">
                      {student.average.toFixed(1)}
                    </p>
                    <span className="text-[9px] font-black text-red-500/60 uppercase tracking-tighter">
                      Dưới 5.0
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
