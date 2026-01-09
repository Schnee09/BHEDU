'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Card } from '@/components/ui';
import { Icons } from '@/components/ui/Icons';
import Empty from '@/components/ui/empty';

interface Note {
    id: string;
    content: string;
    created_at: string;
    created_by?: {
        full_name: string;
    };
}

interface StudentNotesProps {
    studentId: string;
}

export default function StudentNotes({ studentId }: StudentNotesProps) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadNotes();
    }, [studentId]);

    const loadNotes = async () => {
        try {
            setLoading(true);
            const response = await apiFetch(`/api/students/${studentId}/notes`);
            if (response.ok) {
                const data = await response.json();
                setNotes(data.notes || []);
            }
        } catch (err) {
            console.error('Failed to load notes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        setSaving(true);
        try {
            const response = await apiFetch(`/api/students/${studentId}/notes`, {
                method: 'POST',
                body: JSON.stringify({ content: newNote.trim() })
            });

            if (response.ok) {
                setNewNote('');
                loadNotes();
            }
        } catch (err) {
            console.error('Failed to add note:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!confirm('Bạn có chắc muốn xóa ghi chú này?')) return;

        try {
            const response = await apiFetch(`/api/students/${studentId}/notes/${noteId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setNotes(prev => prev.filter(n => n.id !== noteId));
            }
        } catch (err) {
            console.error('Failed to delete note:', err);
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Ghi chú</h2>

            {/* Add Note Form */}
            <div className="bg-gray-50 rounded-lg p-4">
                <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Thêm ghi chú mới..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                />
                <div className="mt-2 flex justify-end">
                    <button
                        onClick={handleAddNote}
                        disabled={!newNote.trim() || saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                    >
                        {saving ? 'Đang lưu...' : 'Thêm ghi chú'}
                    </button>
                </div>
            </div>

            {/* Notes List */}
            {loading ? (
                <div className="text-center py-8">
                    <Icons.Progress className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    <p className="text-sm text-gray-500 mt-2">Đang tải...</p>
                </div>
            ) : notes.length === 0 ? (
                <Empty
                    title="Chưa có ghi chú"
                    description="Thêm ghi chú đầu tiên cho học sinh này."
                />
            ) : (
                <div className="space-y-3">
                    {notes.map((note) => (
                        <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-4 group">
                            <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
                            <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                                <span>
                                    {note.created_by?.full_name && `${note.created_by.full_name} • `}
                                    {new Date(note.created_at).toLocaleString('vi-VN')}
                                </span>
                                <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
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
