"use client";

/**
 * Bulk Student Quick Create Page
 * Refactored with Purple Ban design system
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks";
import { apiFetch } from "@/lib/api/client";
import { routes } from "@/lib/routes";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

export default function BulkCreatePage() {
    const router = useRouter();
    const toast = useToast();

    const [namesInput, setNamesInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [errors, setErrors] = useState<any[]>([]);

    const handleProcess = async () => {
        const names = namesInput.split('\n').filter(n => n.trim().length > 0);

        if (names.length === 0) {
            toast.error("Thiếu thông tin", "Vui lòng nhập ít nhất một họ tên học sinh");
            return;
        }

        if (names.length > 50) {
            toast.error("Giới hạn vượt mức", "Hệ thống chỉ xử lý tối đa 50 học sinh mỗi lượt");
            return;
        }

        setLoading(true);
        setResults([]);
        setErrors([]);

        try {
            const payload = {
                students: names.map(name => ({ full_name: name.trim() }))
            };

            const response = await apiFetch('/api/admin/students/bulk', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Xử lý dữ liệu thất bại");
            }

            setResults(data.data || []);
            setErrors(data.errors || []);

            if (data.data?.length > 0) {
                toast.success("Thành công", `Đã khởi tạo ${data.data.length} hồ sơ học sinh mới`);
            }

            if (data.errors?.length > 0) {
                toast.warning("Lưu ý", `${data.errors.length} hồ sơ gặp lỗi khi khởi tạo`);
            }

        } catch (error: any) {
            toast.error("Lỗi hệ thống", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadCSV = () => {
        if (results.length === 0) return;

        // BOM for Excel/Vietnamese characters support
        const BOM = "\uFEFF";
        const headers = ["Họ và tên", "UID (Mã truy cập)", "Mật khẩu tạm thời", "Email"];
        const rows = results.map(r => [
            r.full_name,
            r.student_code,
            r.password,
            r.email
        ]);

        const csvContent = BOM + [
            headers.join(','),
            ...rows.map(r => r.map(c => `"${c}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `danh_sach_truy_cap_hoc_sinh_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-4 sm:p-8 space-y-8 bg-stone-50 dark:bg-stone-950 min-h-screen animate-in fade-in duration-700">
            {/* Header */}
            <div className="bg-white dark:bg-stone-900 rounded-[2rem] shadow-xl p-8 border border-stone-200 dark:border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32" />
                
                <div className="flex flex-col lg:flex-row items-start justify-between gap-8 relative z-10">
                    <div className="space-y-6">
                        <button
                            onClick={() => router.push(routes.students.list())}
                            className="group flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-white/5 rounded-xl text-stone-600 dark:text-stone-400 font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 hover:text-white transition-all duration-300"
                        >
                            <Icons.Back className="w-3 h-3" />
                            Quay lại danh sách
                        </button>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-5 bg-amber-500 rounded-full" />
                                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em]">Hệ thống quản trị</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight">
                                Khởi tạo <span className="text-amber-500">Nhanh</span>
                            </h1>
                            <p className="text-[11px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em] mt-2">
                                Tạo nhanh hồ sơ & Cấp quyền truy cập hàng loạt
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-stone-50 dark:bg-white/5 p-6 rounded-3xl border border-stone-100 dark:border-white/5">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600">
                            <Icons.Students className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Quy tắc xử lý</p>
                            <p className="font-serif font-black text-stone-900 dark:text-white uppercase leading-none">50 Hồ sơ / lượt</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Input Card */}
                <Card className="lg:col-span-5 p-8 border-none shadow-2xl bg-white dark:bg-stone-900 overflow-visible">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight">Danh sách nhập</h2>
                            <Badge variant="default" className="px-3 py-1 font-black text-[9px] uppercase tracking-widest opacity-50">
                                {namesInput.split('\n').filter(n => n.trim()).length} / 50
                            </Badge>
                        </div>

                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl blur opacity-10 group-focus-within:opacity-20 transition duration-1000"></div>
                            <textarea
                                value={namesInput}
                                onChange={(e) => setNamesInput(e.target.value)}
                                placeholder="Nguyễn Văn A&#10;Trần Thị B&#10;Lê Văn C"
                                className="relative w-full h-80 bg-white dark:bg-stone-950 p-6 border-stone-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-transparent font-serif text-lg text-stone-800 dark:text-stone-200 resize-none transition-all placeholder:italic placeholder:opacity-30"
                                disabled={loading}
                            />
                        </div>

                        <Button
                            variant="primary"
                            className="w-full py-6 rounded-2xl bg-stone-900 dark:bg-amber-600 hover:bg-amber-500 font-black uppercase tracking-widest text-xs shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                            onClick={handleProcess}
                            isLoading={loading}
                            disabled={loading || !namesInput.trim()}
                        >
                            <Icons.Upload className="w-4 h-4 mr-2" />
                            Khởi tạo hồ sơ & Cấp mật khẩu
                        </Button>
                        
                        <p className="text-[10px] text-center text-stone-400 font-black uppercase tracking-widest">
                            Hệ thống sẽ tự động tạo Email và UID (Mã truy cập)
                        </p>
                    </div>
                </Card>

                {/* Results Card */}
                <Card className="lg:col-span-7 flex flex-col h-full bg-stone-50 dark:bg-white/5 border-none shadow-inner p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full -mr-48 -mt-48 blur-3xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div>
                            <h2 className="text-xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight">Kết quả xử lý</h2>
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">Dữ liệu tài khoản vừa khởi tạo</p>
                        </div>
                        {results.length > 0 && (
                            <button
                                onClick={handleDownloadCSV}
                                className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all"
                            >
                                <Icons.Download className="w-4 h-4" />
                                Tải CSV tài khoản
                            </button>
                        )}
                    </div>

                    <div className="flex-1 min-h-[400px] relative z-10">
                        {results.length === 0 && errors.length === 0 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-300 dark:text-stone-700">
                                <Icons.Grades className="w-20 h-20 opacity-10 mb-6" />
                                <p className="font-serif italic text-lg decoration-amber-500/30">Dữ liệu sẽ hiển thị tại đây sau khi xử lý</p>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-700">
                                {/* Successes */}
                                {results.length > 0 && (
                                    <div className="bg-white dark:bg-stone-900 rounded-[2rem] shadow-xl overflow-hidden border border-emerald-500/20">
                                        <div className="px-8 py-4 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-3">
                                            <Icons.Success className="w-4 h-4 text-emerald-600" />
                                            <span className="font-black text-[11px] text-emerald-700 uppercase tracking-widest">
                                                Hoàn tất khởi tạo ({results.length})
                                            </span>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="bg-stone-50 dark:bg-stone-950/50 border-b border-stone-100 dark:border-white/5 uppercase tracking-widest text-[9px] font-black text-stone-400">
                                                        <th className="px-8 py-3">Họ và tên</th>
                                                        <th className="px-4 py-3 text-center">Mã UID</th>
                                                        <th className="px-8 py-3 text-right">Mật khẩu</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-stone-50 dark:divide-white/5">
                                                    {results.map((r, i) => (
                                                        <tr key={i} className="hover:bg-amber-500/5 transition-colors">
                                                            <td className="px-8 py-4 font-serif font-black text-stone-800 dark:text-white uppercase tracking-tight text-sm">
                                                                {r.full_name}
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                <code className="bg-stone-100 dark:bg-white/5 px-3 py-1 rounded-lg text-emerald-600 font-black text-xs">
                                                                    {r.student_code}
                                                                </code>
                                                            </td>
                                                            <td className="px-8 py-4 text-right">
                                                                <code className="bg-amber-500/10 px-3 py-1 rounded-lg text-amber-600 font-black text-sm select-all">
                                                                    {r.password}
                                                                </code>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Errors */}
                                {errors.length > 0 && (
                                    <div className="bg-white dark:bg-stone-900 rounded-[2rem] shadow-xl overflow-hidden border border-rose-500/20">
                                        <div className="px-8 py-4 bg-rose-500/10 border-b border-rose-500/20 flex items-center gap-3">
                                            <Icons.Error className="w-4 h-4 text-rose-600" />
                                            <span className="font-black text-[11px] text-rose-700 uppercase tracking-widest">
                                                Lỗi hệ thống ({errors.length})
                                            </span>
                                        </div>
                                        <div className="p-4">
                                            {errors.map((e, i) => (
                                                <div key={i} className="flex items-center gap-4 p-3 hover:bg-rose-50 dark:hover:bg-rose-500/5 rounded-xl transition-colors">
                                                    <Badge variant="danger" className="font-black text-[9px] h-5 px-2">LỖI</Badge>
                                                    <span className="font-serif font-black text-stone-800 dark:text-white uppercase text-xs">{e.full_name || 'Không xác định'}</span>
                                                    <span className="text-stone-500 dark:text-stone-400 text-xs italic opacity-80">— {e.error}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
