'use client';

import React, { useMemo } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';
import { Users, BookOpen, MapPin } from 'lucide-react';

interface Student {
  id: string;
  full_name: string;
  student_code: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface TimetableSlot {
  id: string;
  student_id?: string;
  room?: string;
  notes?: string;
  subject?: Subject;
  student?: Student;
}

export default function RecentTutoringStudentsWidget() {
  const { data, loading } = useFetch<{ slots: TimetableSlot[] }>('/api/timetable/my');

  // Extract unique students and their associated tutoring subjects
  const studentsList = useMemo(() => {
    if (!data?.slots) return [];

    const uniqueStudentsMap = new Map<
      string,
      {
        student: Student;
        subjects: Set<string>;
        rooms: Set<string>;
        notesList: string[];
      }
    >();

    data.slots.forEach((slot) => {
      if (slot.student && slot.student_id) {
        if (!uniqueStudentsMap.has(slot.student_id)) {
          uniqueStudentsMap.set(slot.student_id, {
            student: slot.student,
            subjects: new Set(),
            rooms: new Set(),
            notesList: [],
          });
        }

        const record = uniqueStudentsMap.get(slot.student_id)!;
        if (slot.subject?.name) record.subjects.add(slot.subject.name);
        if (slot.room) record.rooms.add(slot.room);
        if (slot.notes) record.notesList.push(slot.notes);
      }
    });

    return Array.from(uniqueStudentsMap.values()).map((record) => ({
      ...record.student,
      subjects: Array.from(record.subjects).join(', '),
      rooms: Array.from(record.rooms).join(', '),
      latestNotes: record.notesList[0] || '-',
    }));
  }, [data]);

  return (
    <Card padding="p-0">
      <CardHeader className="flex items-center justify-between border-b border-stone-200/50 dark:border-white/5 bg-stone-50/50 dark:bg-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-xl shadow-accent-glow">
            <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-serif font-black text-lg text-stone-900 dark:text-white uppercase tracking-tight">
              Học sinh kèm gia sư
            </h3>
            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mt-0.5">
              Danh sách học sinh đang nhận dạy kèm
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        {loading ? (
          <div className="p-6 space-y-4">
            <div className="h-10 bg-stone-100 dark:bg-stone-850 animate-pulse rounded-xl" />
            <div className="h-10 bg-stone-100 dark:bg-stone-850 animate-pulse rounded-xl" />
          </div>
        ) : studentsList.length === 0 ? (
          <div className="py-12 text-center text-stone-400 font-bold uppercase tracking-widest text-xs">
            Chưa gán học sinh kèm nào
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 dark:bg-white/2 border-b border-stone-200/40 dark:border-white/5 text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">
                  <th className="p-4 text-left pl-6">Học sinh</th>
                  <th className="p-4 text-left">Môn học kèm</th>
                  <th className="p-4 text-left">Phòng học</th>
                  <th className="p-4 text-left pr-6">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-white/5 font-medium text-stone-700 dark:text-stone-300 text-sm">
                {studentsList.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-stone-500/2 dark:hover:bg-white/1 transition-colors"
                  >
                    <td className="p-4 pl-6">
                      <div className="font-black text-stone-900 dark:text-white uppercase tracking-tight">
                        {student.full_name}
                      </div>
                      <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-0.5">
                        Mã HS: {student.student_code}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-600 dark:text-stone-400">
                        <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                        {student.subjects || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-600 dark:text-stone-400">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        {student.rooms || 'Linh hoạt'}
                      </div>
                    </td>
                    <td
                      className="p-4 pr-6 text-xs text-stone-400 dark:text-stone-500 italic max-w-[200px] truncate"
                      title={student.latestNotes}
                    >
                      {student.latestNotes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
