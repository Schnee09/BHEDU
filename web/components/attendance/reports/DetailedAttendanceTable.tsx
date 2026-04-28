'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import { TableCellsIcon } from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/input';

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  remarks: string | null;
  student?: {
    full_name?: string;
    email?: string;
    student_code?: string;
  };
  class?: {
    name: string;
  };
}

interface DetailedAttendanceTableProps {
  records: AttendanceRecord[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  getStatusColor: (status: string) => string;
  t: (key: string) => string;
}

export function DetailedAttendanceTable({
  records,
  searchTerm,
  onSearchChange,
  getStatusColor,
  t,
}: DetailedAttendanceTableProps) {
  const filteredRecords = records.filter((r) =>
    (r.student?.full_name || r.student?.email || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="glass-premium rounded-[32px] border border-white/20 shadow-xl overflow-hidden animate-fade-in delay-200">
      <div className="px-8 py-6 border-b border-stone-100 flex flex-wrap items-center justify-between gap-6">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-stone-900">
          {t('attendance.report.details')} ({records.length})
        </h2>
        <div className="relative w-full md:w-80">
          <Input
            type="text"
            placeholder={t('attendance.report.searchStudent')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 h-12 bg-stone-50 border-stone-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
          />
          <svg
            className="absolute left-4 top-3.5 w-5 h-5 text-stone-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-stone-50/50">
              <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-stone-400">{t('common.date')}</th>
              <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-stone-400">{t('students.fullName')}</th>
              <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-stone-400">{t('students.class')}</th>
              <th className="px-8 py-4 text-center text-[10px] font-black uppercase tracking-widest text-stone-400">{t('common.status')}</th>
              <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-stone-400">{t('common.remarks')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {filteredRecords.map((record) => (
              <tr key={record.id} className="hover:bg-emerald-50/30 transition-colors group">
                <td className="px-8 py-5 text-sm font-bold text-stone-500">
                  {format(parseISO(record.date), 'dd/MM/yyyy')}
                </td>
                <td className="px-8 py-5">
                  <p className="text-sm font-bold text-stone-900 tracking-tight">{record.student?.full_name || record.student?.email}</p>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{record.student?.student_code}</p>
                </td>
                <td className="px-8 py-5 text-sm font-bold text-stone-600">{record.class?.name}</td>
                <td className="px-8 py-5 text-center">
                  <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${getStatusColor(record.status)}`}>
                    {record.status === 'present' ? t('attendance.present') : t('attendance.absent')}
                  </span>
                </td>
                <td className="px-8 py-5 text-sm text-stone-500 font-medium italic">{record.remarks || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden p-6 space-y-4">
        {filteredRecords.map((record) => (
          <div
            key={record.id}
            className="p-5 bg-white rounded-2xl border border-stone-100 shadow-sm relative overflow-hidden"
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${record.status === 'present' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-black text-stone-900 truncate tracking-tight">{record.student?.full_name || record.student?.email}</p>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{record.student?.student_code}</p>
              </div>
              <span className={`shrink-0 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${getStatusColor(record.status)}`}>
                 {record.status === 'present' ? t('attendance.present') : t('attendance.absent')}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-[10px] font-bold uppercase tracking-widest">
               <div className="text-stone-400">
                 {t('common.date')}: <span className="text-stone-600">{format(parseISO(record.date), 'dd/MM/yyyy')}</span>
               </div>
               <div className="text-stone-400 text-right">
                 {t('students.class')}: <span className="text-stone-600">{record.class?.name}</span>
               </div>
            </div>
            {record.remarks && (
              <div className="mt-4 pt-4 border-t border-stone-50 italic text-[11px] text-stone-400 font-medium">
                "{record.remarks}"
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
