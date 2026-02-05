"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/lib/supabase/client";
import { StatCard } from "@/components/ui/Card";
import Link from "next/link";
import { Loader2, UserPlus, GraduationCap, ChevronRight, AlertCircle } from "lucide-react";

interface LinkedStudent {
  student_id: string;
  student_name: string;
  student_code: string;
  relationship: string;
}

export default function ParentDashboardPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { isParent, isAdmin } = usePermissions();
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinkedStudents = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const res = await fetch('/api/parent/links');
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to fetch');

      // Transform LinkService response to match UI needs
      const transformed = (data.data || []).map((link: any) => ({
        student_id: link.student.id,
        student_name: link.student.full_name,
        student_code: link.student.student_code,
        relationship: link.relationship
      }));

      setStudents(transformed);
    } catch (err: any) {
      console.error("Error fetching linked students:", err);
      setError("Không thể tải danh sách học sinh. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profileLoading) {
      if (isParent || isAdmin) {
        fetchLinkedStudents();
      } else {
        setError("Vui lòng đăng nhập với tài khoản phụ huynh");
        setLoading(false);
      }
    }
  }, [profileLoading, isParent, isAdmin]);

  if (profileLoading || (loading && !error)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-4 text-red-700">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Chào mừng, {profile?.full_name}
          </h1>
          <p className="text-slate-600 dark:text-gray-400 mt-1">
            Quản lý thông tin học tập của con em bạn
          </p>
        </div>
        <Link
          href="/dashboard/parent/link-student"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/25"
        >
          <UserPlus className="w-5 h-5" />
          Kết nối thêm học sinh
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          label="Học sinh đang theo dõi"
          value={students.length}
          icon={<GraduationCap className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Students List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          Học sinh của tôi
        </h2>

        {students.length === 0 ? (
          <div className="bg-white/60 dark:bg-stone-900/40 backdrop-blur-xl rounded-[40px] p-12 text-center border border-slate-200 dark:border-white/10 shadow-xl animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-purple-100 dark:bg-purple-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <GraduationCap className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">Chưa kết nối học sinh</h3>
            <p className="text-stone-500 dark:text-stone-400 mt-3 max-w-sm mx-auto font-medium">
              Bạn cần kết nối với tài khoản của học sinh bằng mã số học sinh để theo dõi kết quả học tập.
            </p>
            <Link
              href="/dashboard/parent/link-student"
              className="mt-8 inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold hover:gap-3 transition-all uppercase tracking-widest text-xs"
            >
              Bắt đầu kết nối ngay <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <Link
                key={student.student_id}
                href={`/dashboard/parent/student/${student.student_id}`}
                className="group relative bg-white/60 dark:bg-stone-900/40 backdrop-blur-xl rounded-[32px] p-6 border border-white/20 dark:border-white/5 hover:border-purple-500/50 shadow-xl hover:shadow-purple-500/10 transition-all duration-500 press-effect overflow-hidden block"
              >
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full group-hover:bg-purple-500/10 transition-colors" />

                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-purple-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    {student.student_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-stone-900 dark:text-stone-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate uppercase tracking-tight text-lg">
                      {student.student_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[10px] font-black font-mono bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-2 py-0.5 rounded uppercase tracking-widest border border-stone-200 dark:border-stone-700">
                        {student.student_code}
                      </span>
                      <span className="text-xs text-stone-400 dark:text-stone-500 font-bold uppercase tracking-tighter">
                        • {student.relationship}
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-white/5 flex items-center justify-center text-stone-400 group-hover:bg-purple-500 group-hover:text-white transition-all duration-500">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
