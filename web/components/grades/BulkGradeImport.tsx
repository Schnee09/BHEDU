"use client";

import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";
import * as XLSX from "xlsx";
import {
    Upload,
    FileSpreadsheet,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Download,
    Loader2,
} from "lucide-react";

interface ParsedGrade {
    studentId: string;
    studentName?: string;
    score: number;
    category?: string;
    notes?: string;
    isValid: boolean;
    error?: string;
}

interface BulkGradeImportProps {
    classId: string;
    assignmentId?: string;
    onSuccess?: () => void;
    onClose?: () => void;
}

export default function BulkGradeImport({
    classId,
    assignmentId,
    onSuccess,
    onClose,
}: BulkGradeImportProps) {
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedGrade[]>([]);
    const [importing, setImporting] = useState(false);
    const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
    const [result, setResult] = useState<{
        success: number;
        failed: number;
        errors: string[];
    } | null>(null);

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile) {
                setFile(selectedFile);
                parseExcelFile(selectedFile);
            }
        },
        []
    );

    const parseExcelFile = async (file: File) => {
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

            // Skip header row, parse data
            const grades: ParsedGrade[] = [];
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || row.length === 0) continue;

                const studentId = String(row[0] || "").trim();
                const studentName = String(row[1] || "").trim();
                const scoreRaw = row[2];
                const category = String(row[3] || "").trim();
                const notes = String(row[4] || "").trim();

                // Validate
                let isValid = true;
                let error = "";

                if (!studentId) {
                    isValid = false;
                    error = "Thiếu mã học sinh";
                }

                const score = parseFloat(scoreRaw);
                if (isNaN(score)) {
                    isValid = false;
                    error = "Điểm không hợp lệ";
                } else if (score < 0 || score > 10) {
                    isValid = false;
                    error = "Điểm phải từ 0-10";
                }

                grades.push({
                    studentId,
                    studentName,
                    score: isNaN(score) ? 0 : score,
                    category,
                    notes,
                    isValid,
                    error,
                });
            }

            setParsedData(grades);
            setStep("preview");
        } catch (error) {
            console.error("Error parsing Excel:", error);
            alert("Không thể đọc file Excel. Vui lòng kiểm tra định dạng file.");
        }
    };

    const handleImport = async () => {
        const validGrades = parsedData.filter((g) => g.isValid);
        if (validGrades.length === 0) {
            alert("Không có dữ liệu hợp lệ để import");
            return;
        }

        setImporting(true);
        try {
            const response = await apiFetch("/api/grades/bulk-import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    class_id: classId,
                    assignment_id: assignmentId,
                    grades: validGrades.map((g) => ({
                        student_id: g.studentId,
                        score: g.score,
                        category: g.category,
                        notes: g.notes,
                    })),
                }),
            });

            const data = await response.json();

            if (data.success) {
                setResult({
                    success: data.imported || validGrades.length,
                    failed: data.failed || 0,
                    errors: data.errors || [],
                });
                setStep("result");
                onSuccess?.();
            } else {
                throw new Error(data.error || "Import thất bại");
            }
        } catch (error: any) {
            alert("Lỗi khi import: " + error.message);
        } finally {
            setImporting(false);
        }
    };

    const downloadTemplate = () => {
        const templateData = [
            ["Mã học sinh", "Tên học sinh", "Điểm", "Loại điểm", "Ghi chú"],
            ["HS001", "Nguyễn Văn A", 8.5, "Miệng", ""],
            ["HS002", "Trần Thị B", 7.0, "15 phút", "Cần cố gắng hơn"],
            ["HS003", "Lê Văn C", 9.0, "1 tiết", "Xuất sắc"],
        ];

        const ws = XLSX.utils.aoa_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "mau_nhap_diem.xlsx");
    };

    const validCount = parsedData.filter((g) => g.isValid).length;
    const invalidCount = parsedData.filter((g) => !g.isValid).length;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-500 to-purple-600">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <FileSpreadsheet className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                Import điểm từ Excel
                            </h2>
                            <p className="text-white/80 text-sm">
                                Tải lên file Excel để nhập điểm hàng loạt
                            </p>
                        </div>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <XCircle className="w-5 h-5 text-white" />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-6">
                {/* Step 1: Upload */}
                {step === "upload" && (
                    <div className="space-y-6">
                        {/* Download template */}
                        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                            <div>
                                <p className="font-medium text-blue-900 dark:text-blue-100">
                                    Tải file mẫu
                                </p>
                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                    File Excel mẫu với định dạng chuẩn
                                </p>
                            </div>
                            <button
                                onClick={downloadTemplate}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Tải mẫu
                            </button>
                        </div>

                        {/* Upload area */}
                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-12 h-12 mb-4 text-gray-400" />
                                <p className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
                                    Kéo thả file hoặc click để chọn
                                </p>
                                <p className="text-sm text-gray-500">
                                    Chỉ hỗ trợ file .xlsx, .xls
                                </p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>
                )}

                {/* Step 2: Preview */}
                {step === "preview" && (
                    <div className="space-y-4">
                        {/* Summary */}
                        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet className="w-5 h-5 text-gray-500" />
                                <span className="font-medium">{file?.name}</span>
                            </div>
                            <div className="flex items-center gap-4 ml-auto">
                                <span className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="w-4 h-4" />
                                    {validCount} hợp lệ
                                </span>
                                {invalidCount > 0 && (
                                    <span className="flex items-center gap-1 text-red-500">
                                        <XCircle className="w-4 h-4" />
                                        {invalidCount} lỗi
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Data table */}
                        <div className="max-h-96 overflow-auto border rounded-xl">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold">
                                            Mã HS
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold">
                                            Tên HS
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold">Điểm</th>
                                        <th className="px-4 py-3 text-left font-semibold">
                                            Loại
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold">
                                            Trạng thái
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {parsedData.map((grade, idx) => (
                                        <tr
                                            key={idx}
                                            className={
                                                grade.isValid
                                                    ? ""
                                                    : "bg-red-50 dark:bg-red-900/20"
                                            }
                                        >
                                            <td className="px-4 py-3 font-mono">
                                                {grade.studentId}
                                            </td>
                                            <td className="px-4 py-3">{grade.studentName}</td>
                                            <td className="px-4 py-3 font-semibold">
                                                {grade.score}
                                            </td>
                                            <td className="px-4 py-3">{grade.category}</td>
                                            <td className="px-4 py-3">
                                                {grade.isValid ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                        <CheckCircle className="w-3 h-3" />
                                                        OK
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        {grade.error}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t">
                            <button
                                onClick={() => {
                                    setStep("upload");
                                    setParsedData([]);
                                    setFile(null);
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                            >
                                ← Chọn file khác
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={importing || validCount === 0}
                                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
                            >
                                {importing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang import...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Import {validCount} điểm
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Result */}
                {step === "result" && result && (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Import thành công!
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Đã import {result.success} điểm
                            {result.failed > 0 && `, ${result.failed} thất bại`}
                        </p>

                        {result.errors.length > 0 && (
                            <div className="text-left max-w-md mx-auto mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="font-medium text-red-700 mb-2">Lỗi:</p>
                                <ul className="text-sm text-red-600 list-disc list-inside">
                                    {result.errors.slice(0, 5).map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                        >
                            Đóng
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
