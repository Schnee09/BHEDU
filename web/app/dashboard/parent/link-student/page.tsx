"use client";

import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/ui/Icons";
import {
  Loader2,
  Search,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  User,
  GraduationCap,
  Heart
} from "lucide-react";
import Link from "next/link";

const RELATIONSHIP_OPTIONS = [
  { value: 'parent', label: 'Bố/Mẹ' },
  { value: 'father', label: 'Bố' },
  { value: 'mother', label: 'Mẹ' },
  { value: 'guardian', label: 'Người giám hộ' },
  { value: 'grandparent', label: 'Ông/Bà' },
  { value: 'other', label: 'Khác' },
];

export default function LinkStudentPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const [studentCode, setStudentCode] = useState("");
  const [relationship, setRelationship] = useState("parent");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [foundStudent, setFoundStudent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const lookupStudent = async () => {
    if (!studentCode) return;

    setSearching(true);
    setError(null);
    setFoundStudent(null);

    try {
      const res = await fetch('/api/auth/student-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_code: studentCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không tìm thấy học sinh");
      }

      setFoundStudent(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundStudent || !profile) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/parent/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: foundStudent.id,
          relationship: relationship
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không thể gửi yêu cầu kết nối");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto p-12 text-center bg-white/60 dark:bg-stone-900/40 backdrop-blur-xl rounded-[40px] shadow-2xl mt-12 border border-white/20 dark:border-white/5 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner shadow-green-500/20">
          <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-3xl font-black text-stone-900 dark:text-stone-100 mb-3 uppercase tracking-tight">Đã gửi yêu cầu!</h2>
        <p className="text-stone-600 dark:text-stone-400 mb-10 font-medium leading-relaxed">
          Yêu cầu kết nối với <b>{foundStudent?.full_name}</b> đã được gửi tới hệ thống. Vui lòng chờ nhân viên trung tâm phê duyệt.
        </p>
        <button
          onClick={() => router.push('/dashboard/parent')}
          className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-purple-500/25 active:scale-95 uppercase tracking-widest text-xs"
        >
          Quay lại Bảng điều khiển
        </button>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-8 space-y-10">
      <div className="flex items-center gap-6">
        <Link
          href="/dashboard/parent"
          className="p-3 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 rounded-2xl transition-all shadow-sm active:scale-90"
        >
          <ArrowLeft className="w-6 h-6 text-stone-600 dark:text-stone-400" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">Kết nối học sinh</h1>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-1">Liên kết tài khoản phụ huynh với con em</p>
        </div>
      </div>

      <div className="bg-white/60 dark:bg-stone-900/40 backdrop-blur-xl rounded-[40px] p-6 sm:p-10 shadow-2xl border border-white/20 dark:border-white/5 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] rounded-full" />

        {!foundStudent ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative">
              <label className="block text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] mb-3 ml-2">
                Mã số học sinh
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-purple-500 transition-colors" />
                  <input
                    className="w-full h-16 bg-stone-100/50 dark:bg-white/5 border border-stone-200 dark:border-white/10 pl-12 pr-4 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all text-lg font-black uppercase tracking-widest placeholder:text-stone-300 dark:placeholder:text-stone-700"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                    placeholder="HS2025001"
                    onKeyDown={(e) => e.key === 'Enter' && lookupStudent()}
                  />
                </div>
                <button
                  onClick={lookupStudent}
                  disabled={searching || !studentCode}
                  className="h-16 px-10 bg-purple-600 text-white rounded-2xl font-black hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 active:scale-95 uppercase tracking-widest text-xs"
                >
                  {searching ? <Loader2 className="w-6 h-6 animate-spin" /> : "Tìm kiếm"}
                </button>
              </div>
              <p className="mt-4 text-[10px] text-stone-400 font-bold uppercase tracking-wider ml-2 flex items-center gap-2">
                <AlertCircle className="w-3 h-3" />
                Dùng mã học sinh in trên thẻ hoặc được trung tâm cấp.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex gap-3 text-red-700 dark:text-red-400 italic motion-safe:animate-shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleRequestLink} className="space-y-10 animate-in zoom-in-95 duration-500">
            {/* Student Info Card */}
            <div className="bg-purple-100/50 dark:bg-purple-900/20 rounded-[32px] p-8 flex flex-col sm:flex-row items-center gap-6 border border-purple-200/50 dark:border-purple-800/30 shadow-inner">
              <div className="w-20 h-20 bg-white dark:bg-stone-800 rounded-2xl flex items-center justify-center shadow-xl rotate-3">
                <GraduationCap className="w-10 h-10 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-center sm:text-left flex-1">
                <h3 className="text-2xl font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">
                  {foundStudent.full_name}
                </h3>
                <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-white/50 dark:bg-black/20 rounded-lg text-sm font-black font-mono text-purple-600 dark:text-purple-400 uppercase tracking-widest border border-purple-200/50 dark:border-purple-800/50">
                  {foundStudent.student_code}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFoundStudent(null)}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-purple-600 bg-stone-100 dark:bg-white/5 rounded-xl transition-all"
              >
                Thay đổi
              </button>
            </div>

            {/* Relationship Selection */}
            <div className="space-y-6">
              <label className="block text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] ml-2">
                Mối quan hệ với học sinh
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {RELATIONSHIP_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRelationship(opt.value)}
                    className={`h-16 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 border-2 ${relationship === opt.value
                      ? 'border-purple-600 bg-purple-600 text-white shadow-lg shadow-purple-500/25 scale-105 z-10'
                      : 'border-stone-100 bg-white dark:bg-stone-800/50 dark:border-white/5 text-stone-500 hover:border-purple-200 dark:hover:border-purple-800'
                      }`}
                  >
                    <Heart className={`w-4 h-4 ${relationship === opt.value ? 'fill-white animate-pulse' : 'text-stone-300'}`} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex gap-3 text-red-700 dark:text-red-400 italic">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-20 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-[24px] transition-all shadow-2xl shadow-purple-500/40 flex items-center justify-center gap-4 disabled:opacity-50 active:scale-[0.98] uppercase tracking-[0.2em] text-sm"
            >
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <>Gửi yêu cầu kết nối</>
              )}
            </button>
          </form>
        )}
      </div>

      <div className="bg-stone-900/5 dark:bg-white/5 rounded-[32px] p-8 border border-white/20 dark:border-white/5">
        <h4 className="font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-6 flex items-center gap-3 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          Tại sao cần kết nối?
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <Icons.Grades className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xs text-stone-500 dark:text-gray-400 font-bold leading-relaxed uppercase tracking-tighter">Xem điểm số và kết quả học tập theo thời gian thực.</p>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
              <Icons.Attendance className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-xs text-stone-500 dark:text-gray-400 font-bold leading-relaxed uppercase tracking-tighter">Theo dõi chuyên cần và báo cáo định kỳ.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
