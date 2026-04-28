/**
 * Student Notes Component
 * Refactored with premium stone/amber theme
 */

'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Card, Button, Badge } from '@/components/ui';
import { Icons } from '@/components/ui/Icons';
import Empty from '@/components/ui/empty';
import { cn } from '@/lib/utils';

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
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between pb-6 border-b border-stone-100 dark:border-white/5">
                <div className="space-y-1">
                    <h2 className="text-xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <Icons.Edit className="w-6 h-6 text-amber-500" /> Ghi chú Học vụ
                    </h2>
                    <p className="text-[11px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest leading-relaxed">
                        Lưu giữ các ghi chú quan trọng về quá trình học tập của học sinh.
                    </p>
                </div>
            </div>

            {/* Add Note Form */}
            <div className="rounded-[2rem] bg-stone-50/50 dark:bg-white/[0.02] border border-stone-100 dark:border-white/5 p-8 shadow-inner">
                <div className="relative group">
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Nhập ghi chú quan trọng tại đây..."
                        className="w-full bg-white dark:bg-stone-950 rounded-[1.5rem] border-stone-200 dark:border-white/10 p-6 font-medium text-stone-900 dark:text-white placeholder:text-stone-400 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-sm min-h-[140px] resize-none"
                    />
                    <div className="absolute right-4 bottom-4">
                        <Button
                            onClick={handleAddNote}
                            disabled={!newNote.trim() || saving}
                            isLoading={saving}
                            className="font-black uppercase tracking-widest text-[10px] h-11 px-8 rounded-2xl shadow-amber-glow"
                        >
                            <Icons.Add className="w-4 h-4 mr-2" /> Lưu Ghi chú
                        </Button>
                    </div>
                </div>
            </div>

            {/* Notes List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Đang tải ghi chú...</p>
                </div>
            ) : notes.length === 0 ? (
                <Card borderStyle="dashed" className="p-16 text-center rounded-[2.5rem] bg-stone-50/50 dark:bg-white/[0.01]">
                    <div className="w-16 h-16 bg-stone-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Icons.Edit className="w-8 h-8 text-stone-300" />
                    </div>
                    <p className="text-stone-500 font-medium mb-2">Chưa có ghi chú nào được lưu cho học sinh này.</p>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest italic">Bắt đầu bằng cách nhập ghi chú ở khung bên trên.</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {notes.map((note) => (
                        <div key={note.id} className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all duration-500 group">
                            <div className="flex items-start justify-between gap-6">
                                <p className="text-stone-800 dark:text-stone-200 whitespace-pre-wrap leading-relaxed font-serif italic text-lg">{note.content}</p>
                                <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="p-3 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100"
                                >
                                    <Icons.Trash className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="mt-6 flex items-center justify-between border-t border-stone-50 dark:border-white/5 pt-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                                        <Icons.User className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <span className="text-[10px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest">
                                        {note.created_by?.full_name || 'Người dùng hệ thống'}
                                    </span>
                                </div>
                                <Badge variant="default" className="bg-stone-50 dark:bg-white/5 text-stone-400 font-black text-[9px] uppercase tracking-widest px-3">
                                    {new Date(note.created_at).toLocaleString('vi-VN')}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
