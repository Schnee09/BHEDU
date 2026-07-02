'use client';

import React, { memo } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { CheckCircle2, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChildAttendanceTodayWidgetProps {
  childId: string;
}

const ChildAttendanceTodayWidget = memo(function ChildAttendanceTodayWidget({ childId }: ChildAttendanceTodayWidgetProps) {
  const { data, loading } = useFetch<any>(
    childId ? `/api/parent/child/${childId}/attendance-today` : null
  );

  const getStatusDisplay = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center p-6 space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-stone-200 dark:border-stone-850 border-t-amber-500 animate-spin" />
        </div>
      );
    }

    const status = data?.status;

    if (data?.marked && status === 'present') {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="p-3 bg-emerald-500/10 rounded-2xl shadow-emerald-glow">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h4 className="font-serif font-black text-emerald-600 dark:text-emerald-400 text-lg uppercase tracking-tight">
              Có mặt hôm nay
            </h4>
            <p className="text-xs text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest mt-1">
              Đã điểm danh vào lớp
            </p>
          </div>
        </div>
      );
    }

    if (data?.marked && status === 'absent') {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="p-3 bg-rose-500/10 rounded-2xl shadow-red-glow">
            <XCircle className="w-8 h-8 text-rose-500" />
          </div>
          <div>
            <h4 className="font-serif font-black text-rose-600 dark:text-rose-400 text-lg uppercase tracking-tight">
              Vắng mặt hôm nay
            </h4>
            <p className="text-xs text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest mt-1">
              Ghi nhận vắng học
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
        <div className="p-3 bg-stone-500/10 rounded-2xl">
          <AlertCircle className="w-8 h-8 text-stone-400" />
        </div>
        <div>
          <h4 className="font-serif font-black text-stone-600 dark:text-stone-400 text-lg uppercase tracking-tight">
            Chưa điểm danh
          </h4>
          <p className="text-xs text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest mt-1">
            Chưa ghi nhận ca học hôm nay
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card padding="p-0" className="h-full">
      <CardHeader className="flex items-center justify-between border-b border-stone-200/50 dark:border-white/5 bg-stone-50/50 dark:bg-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-xl shadow-accent-glow">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-serif font-black text-lg text-stone-900 dark:text-white uppercase tracking-tight">
              Điểm danh hôm nay
            </h3>
            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mt-0.5">
              Trạng thái chuyên cần hàng ngày
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="p-0 flex items-center justify-center min-h-[180px]">
        {getStatusDisplay()}
      </CardBody>
    </Card>
  );
});

export default ChildAttendanceTodayWidget;
