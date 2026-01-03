"use client";

import { useState, useRef } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import {
    Upload,
    FileSpreadsheet,
    AlertCircle,
    CheckCircle,
    Download,
    X,
    Users,
    BookOpen,
    Calendar,
} from "lucide-react";

interface ImportResult {
    success: number;
    failed: number;
    errors: string[];
}

type ImportType = "students" | "grades" | "attendance";

const importTypes: { id: ImportType; label: string; icon: React.ReactNode; description: string }[] = [
    { id: "students", label: "Học sinh", icon: <Users className="w-6 h-6" />, description: "Nhập danh sách học sinh từ file CSV" },
    { id: "grades", label: "Điểm số", icon: <BookOpen className="w-6 h-6" />, description: "Nhập điểm số từ file CSV" },
    { id: "attendance", label: "Điểm danh", icon: <Calendar className="w-6 h-6" />, description: "Nhập dữ liệu điểm danh từ file CSV" },
];

export default function BulkImportPage() {
    const { profile, loading: profileLoading } = useProfile();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedType, setSelectedType] = useState<ImportType>("students");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string[][]>([]);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Check admin access
    if (!profileLoading && profile?.role !== "admin") {
        router.replace("/unauthorized");
        return null;
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith(".csv")) {
            setError("Vui lòng chọn file CSV");
            return;
        }

        setFile(selectedFile);
        setError(null);
        setResult(null);

        // Parse preview
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split("\n").slice(0, 6); // First 5 rows + header
            const rows = lines.map((line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")));
            setPreview(rows);
        };
        reader.readAsText(selectedFile);
    };

    const handleImport = async () => {
        if (!file) return;

        setImporting(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", selectedType);

            const response = await fetch(`/api/admin/bulk-import`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Import failed");
            }

            setResult(data);
            setFile(null);
            setPreview([]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Lỗi không xác định");
        } finally {
            setImporting(false);
        }
    };

    const downloadTemplate = (type: ImportType) => {
        const templates: Record<ImportType, { headers: string[]; sample: string[] }> = {
            students: {
                headers: ["full_name", "email", "phone", "date_of_birth", "class_id"],
                sample: ["Nguyễn Văn A", "nguyenvana@email.com", "0901234567", "2005-01-15", "class-uuid-here"],
            },
            grades: {
                headers: ["student_id", "subject", "category", "score", "date"],
                sample: ["student-uuid", "Toán", "Kiểm tra 15 phút", "8.5", "2024-01-15"],
            },
            attendance: {
                headers: ["student_id", "class_id", "date", "status"],
                sample: ["student-uuid", "class-uuid", "2024-01-15", "present"],
            },
        };

        const template = templates[type];
        const csvContent = [template.headers.join(","), template.sample.join(",")].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `template_${type}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nhập dữ liệu hàng loạt</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Nhập dữ liệu từ file CSV vào hệ thống</p>
                </div>

                {/* Import Type Selection */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Chọn loại dữ liệu</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {importTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => {
                                    setSelectedType(type.id);
                                    setFile(null);
                                    setPreview([]);
                                    setResult(null);
                                }}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${selectedType === type.id
                                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                    }`}
                            >
                                <div className={`mb-2 ${selectedType === type.id ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"}`}>
                                    {type.icon}
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">{type.label}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{type.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Download Template */}
                <div className="mb-6">
                    <button
                        onClick={() => downloadTemplate(selectedType)}
                        className="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        <Download className="w-4 h-4" />
                        Tải file mẫu CSV
                    </button>
                </div>

                {/* File Upload */}
                <div className="mb-8">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${file
                                ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20"
                                : "border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500"
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        {file ? (
                            <div className="flex items-center justify-center gap-3">
                                <FileSpreadsheet className="w-8 h-8 text-green-600 dark:text-green-400" />
                                <div className="text-left">
                                    <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                        setPreview([]);
                                    }}
                                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-300">
                                    Kéo thả file CSV hoặc <span className="text-indigo-600 dark:text-indigo-400">chọn file</span>
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* Preview */}
                {preview.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Xem trước dữ liệu</h3>
                        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        {preview[0]?.map((header, i) => (
                                            <th key={i} className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {preview.slice(1).map((row, i) => (
                                        <tr key={i} className="bg-white dark:bg-gray-800">
                                            {row.map((cell, j) => (
                                                <td key={j} className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                    {cell || "-"}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Import Button */}
                {file && (
                    <div className="mb-8">
                        <button
                            onClick={handleImport}
                            disabled={importing}
                            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {importing ? "Đang nhập..." : "Nhập dữ liệu"}
                        </button>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <p className="text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nhập dữ liệu hoàn tất</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{result.success}</p>
                                <p className="text-sm text-green-700 dark:text-green-300">Thành công</p>
                            </div>
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{result.failed}</p>
                                <p className="text-sm text-red-700 dark:text-red-300">Thất bại</p>
                            </div>
                        </div>
                        {result.errors.length > 0 && (
                            <div className="mt-4">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lỗi chi tiết:</p>
                                <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                                    {result.errors.slice(0, 5).map((err, i) => (
                                        <li key={i}>• {err}</li>
                                    ))}
                                    {result.errors.length > 5 && (
                                        <li>... và {result.errors.length - 5} lỗi khác</li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
