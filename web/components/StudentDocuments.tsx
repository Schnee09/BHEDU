/**
 * Student Documents Component
 * Refactored with premium stone/amber theme
 */

'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Icons } from '@/components/ui/Icons';
import { Button, Card, Badge } from '@/components/ui';
import Empty from '@/components/ui/empty';
import { cn } from '@/lib/utils';

interface Document {
    id: string;
    name: string;
    type: string;
    url: string;
    size?: number;
    uploaded_at: string;
    uploaded_by?: {
        full_name: string;
    };
}

interface StudentDocumentsProps {
    studentId: string;
}

export default function StudentDocuments({ studentId }: StudentDocumentsProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadDocuments();
    }, [studentId]);

    const loadDocuments = async () => {
        try {
            setLoading(true);
            const response = await apiFetch(`/api/students/${studentId}/documents`);
            if (response.ok) {
                const data = await response.json();
                setDocuments(data.documents || []);
            }
        } catch (err) {
            console.error('Failed to load documents:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`/api/students/${studentId}/documents`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                loadDocuments();
            } else {
                alert('Không thể tải lên tài liệu');
            }
        } catch (err) {
            console.error('Failed to upload document:', err);
            alert('Lỗi tải lên tài liệu');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDeleteDocument = async (docId: string) => {
        if (!confirm('Bạn có chắc muốn xóa tài liệu này?')) return;

        try {
            const response = await apiFetch(`/api/students/${studentId}/documents/${docId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setDocuments(prev => prev.filter(d => d.id !== docId));
            }
        } catch (err) {
            console.error('Failed to delete document:', err);
        }
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (type: string) => {
        const t = type.toLowerCase();
        if (t.includes('pdf')) return <Icons.Description className="w-5 h-5 text-red-500" />;
        if (t.includes('image')) return <Icons.Description className="w-5 h-5 text-emerald-500" />;
        if (t.includes('word') || t.includes('document')) return <Icons.Description className="w-5 h-5 text-blue-500" />;
        if (t.includes('excel') || t.includes('spreadsheet') || t.includes('csv')) return <Icons.Description className="w-5 h-5 text-emerald-600" />;
        return <Icons.Description className="w-5 h-5 text-stone-400" />;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between pb-6 border-b border-stone-100 dark:border-white/5">
                <div className="space-y-1">
                    <h2 className="text-xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <Icons.Download className="w-6 h-6 text-amber-500" /> Kho Tài liệu
                    </h2>
                    <p className="text-[11px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest leading-relaxed">
                        Quản lý hồ sơ, chứng chỉ và các giấy tờ liên quan.
                    </p>
                </div>
                <label className="relative group overflow-hidden">
                    <Button
                        as="span"
                        disabled={uploading}
                        isLoading={uploading}
                        className="font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-2xl shadow-amber-glow"
                    >
                        <Icons.Add className="w-3.5 h-3.5 mr-2" /> Tải lên tài liệu
                    </Button>
                    <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                </label>
            </div>

            {/* Documents List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Đang tải tài liệu...</p>
                </div>
            ) : documents.length === 0 ? (
                <Card borderStyle="dashed" className="p-16 text-center rounded-[2.5rem] bg-stone-50/50 dark:bg-white/[0.01]">
                    <div className="w-16 h-16 bg-stone-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Icons.Download className="w-8 h-8 text-stone-300" />
                    </div>
                    <p className="text-stone-500 font-medium mb-2">Chưa có tài liệu nào học sinh nào được ghi nhận.</p>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest italic text-center">Tải lên hồ sơ nhập học, bản sao CMND hoặc các chứng chỉ.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-5 p-5 bg-white dark:bg-stone-900 border border-stone-100 dark:border-white/5 rounded-[2rem] group hover:shadow-xl hover:border-amber-500/20 transition-all duration-500">
                            <div className="w-12 h-12 rounded-2xl bg-stone-50 dark:bg-white/5 flex items-center justify-center shadow-sm group-hover:bg-amber-500/10 transition-colors">
                                {getFileIcon(doc.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight truncate">{doc.name}</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">
                                        {formatFileSize(doc.size)}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-stone-200" />
                                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">
                                        {new Date(doc.uploaded_at).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                                <Button
                                    as="a"
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="ghost"
                                    size="sm"
                                    className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-white/5 hover:bg-amber-500/10 hover:text-amber-600 p-0"
                                >
                                    <Icons.Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-white/5 hover:bg-red-500/10 hover:text-red-500 p-0"
                                >
                                    <Icons.Trash className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
