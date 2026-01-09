"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/hooks";
import { apiFetch } from "@/lib/api/client";
import { Button, Card, CardHeader } from "@/components/ui";
import { Icons } from "@/components/ui/Icons";
import { PageHeader } from "@/components/Breadcrumb";
import { ArrowLeft, Download, Upload, CheckCircle, AlertTriangle } from "lucide-react";

export default function BulkCreatePage() {
    const toast = useToast();

    const [namesInput, setNamesInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [errors, setErrors] = useState<any[]>([]);

    const handleProcess = async () => {
        const names = namesInput.split('\n').filter(n => n.trim().length > 0);

        if (names.length === 0) {
            toast.error("Error", "Please enter at least one name");
            return;
        }

        if (names.length > 50) {
            toast.error("Error", "Maximum 50 students at a time");
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
                throw new Error(data.error || "Failed to process");
            }

            setResults(data.data || []);
            setErrors(data.errors || []);

            if (data.data?.length > 0) {
                toast.success("Done", `Successfully created ${data.data.length} students`);
            }

            if (data.errors?.length > 0) {
                toast.warning("Issues", `${data.errors.length} students failed to create`);
            }

        } catch (error: any) {
            toast.error("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadCSV = () => {
        if (results.length === 0) return;

        // BOM for Excel/Vietnamese characters support
        const BOM = "\uFEFF";
        const headers = ["Full Name", "Student Code", "Password", "Email"];
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
        link.setAttribute("download", `students_credentials_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/students">
                    <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                        Back
                    </Button>
                </Link>
                <PageHeader
                    title="Bulk Create Students"
                    description="Create multiple student accounts at once and export credentials"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <Card className="p-6">
                    <CardHeader title="Input Names" className="px-0 pt-0" />
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Paste names (one per line)
                            </label>
                            <textarea
                                value={namesInput}
                                onChange={(e) => setNamesInput(e.target.value)}
                                placeholder="Nguyen Van A&#10;Tran Thi B&#10;Le Van C"
                                className="w-full h-64 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                disabled={loading}
                            />
                            <p className="text-xs text-slate-500 mt-2 text-right">
                                {namesInput.split('\n').filter(n => n.trim()).length} names / 50 max
                            </p>
                        </div>

                        <Button
                            variant="primary"
                            className="w-full"
                            onClick={handleProcess}
                            isLoading={loading}
                            disabled={loading || !namesInput.trim()}
                            leftIcon={<Upload className="w-4 h-4" />}
                        >
                            Process & Generate Credentials
                        </Button>
                    </div>
                </Card>

                {/* Results Section */}
                <Card className="p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <CardHeader title="Results" className="px-0 pt-0 mb-0" />
                        {results.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadCSV}
                                leftIcon={<Download className="w-4 h-4" />}
                                className="text-green-700 border-green-200 hover:bg-green-50"
                            >
                                Download CSV
                            </Button>
                        )}
                    </div>

                    <div className="flex-1 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden relative">
                        {results.length === 0 && errors.length === 0 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                <Upload className="w-12 h-12 mb-3 opacity-20" />
                                <p>Results will appear here</p>
                            </div>
                        ) : (
                            <div className="absolute inset-0 overflow-auto p-4 space-y-4">
                                {/* Successes */}
                                {results.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" /> Successfully Created ({results.length})
                                        </h4>
                                        <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden text-xs">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 border-b border-slate-200">
                                                    <tr>
                                                        <th className="p-2 font-medium">Name</th>
                                                        <th className="p-2 font-medium">Code</th>
                                                        <th className="p-2 font-medium">Password</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {results.map((r, i) => (
                                                        <tr key={i}>
                                                            <td className="p-2">{r.full_name}</td>
                                                            <td className="p-2 font-mono text-blue-600">{r.student_code}</td>
                                                            <td className="p-2 font-mono select-all bg-yellow-50">{r.password}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Errors */}
                                {errors.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" /> Failed ({errors.length})
                                        </h4>
                                        <div className="bg-white rounded border border-red-200 overflow-hidden text-xs">
                                            <table className="w-full text-left">
                                                <thead className="bg-red-50 border-b border-red-100">
                                                    <tr>
                                                        <th className="p-2 font-medium text-red-800">Name</th>
                                                        <th className="p-2 font-medium text-red-800">Error</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-red-50">
                                                    {errors.map((e, i) => (
                                                        <tr key={i}>
                                                            <td className="p-2">{e.full_name || 'Unknown'}</td>
                                                            <td className="p-2 text-red-600">{e.error}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
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
