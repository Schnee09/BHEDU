'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Icons } from '@/components/ui/Icons';
import Empty from '@/components/ui/empty';

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
        if (type.includes('pdf')) return '📄';
        if (type.includes('image')) return '🖼️';
        if (type.includes('word') || type.includes('document')) return '📝';
        if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
        return '📎';
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Tài liệu</h2>
                <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm font-medium inline-flex items-center gap-2">
                    {uploading ? (
                        <>
                            <Icons.Progress className="w-4 h-4 animate-spin" />
                            Đang tải...
                        </>
                    ) : (
                        <>
                            <Icons.Upload className="w-4 h-4" />
                            Tải lên
                        </>
                    )}
                    <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                    />
                </label>
            </div>

            {/* Documents List */}
            {loading ? (
                <div className="text-center py-8">
                    <Icons.Progress className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    <p className="text-sm text-gray-500 mt-2">Đang tải...</p>
                </div>
            ) : documents.length === 0 ? (
                <Empty
                    title="Chưa có tài liệu"
                    description="Tải lên tài liệu đầu tiên cho học sinh này."
                />
            ) : (
                <div className="space-y-2">
                    {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg group hover:shadow-sm transition-shadow">
                            <span className="text-2xl">{getFileIcon(doc.type)}</span>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                                <p className="text-sm text-gray-500">
                                    {formatFileSize(doc.size)} • {new Date(doc.uploaded_at).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                    title="Xem"
                                >
                                    <Icons.Eye className="w-4 h-4" />
                                </a>
                                <button
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                    title="Xóa"
                                >
                                    <Icons.Trash className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
