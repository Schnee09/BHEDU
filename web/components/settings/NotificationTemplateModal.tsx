'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Mail, MessageSquare, Bell, Smartphone, Sparkles, Tag, Eye } from 'lucide-react';
import { NotificationTemplate } from '@/lib/settings/types';
import { cn } from '@/lib/utils';

interface NotificationTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: NotificationTemplate | null;
  onSave: (template: NotificationTemplate) => void;
}

export function NotificationTemplateModal({
  isOpen,
  onClose,
  template,
  onSave,
}: NotificationTemplateModalProps) {
  const [titleTemplate, setTitleTemplate] = useState('');
  const [bodyTemplate, setBodyTemplate] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (template) {
      setTitleTemplate(template.titleTemplate || '');
      setBodyTemplate(template.bodyTemplate || '');
      setPreviewMode(false);
    }
  }, [template, isOpen]);

  if (!template) return null;

  const handleInsertVariable = (variableKey: string) => {
    setBodyTemplate((prev) => `${prev} {${variableKey}}`);
  };

  // Generate live preview text replacing variables with example values
  const getRenderedPreview = () => {
    let renderedTitle = titleTemplate;
    let renderedBody = bodyTemplate;

    template.variables?.forEach((v) => {
      const regex = new RegExp(`\\{${v.key}\\}`, 'g');
      renderedTitle = renderedTitle.replace(regex, v.example || `[${v.label}]`);
      renderedBody = renderedBody.replace(regex, v.example || `[${v.label}]`);
    });

    return { title: renderedTitle, body: renderedBody };
  };

  const preview = getRenderedPreview();

  const handleSave = () => {
    onSave({
      ...template,
      titleTemplate,
      bodyTemplate,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  const getChannelIcon = () => {
    switch (template.channel) {
      case 'email':
        return <Mail className="w-5 h-5 text-blue-500" />;
      case 'sms':
        return <MessageSquare className="w-5 h-5 text-emerald-500" />;
      case 'push':
        return <Bell className="w-5 h-5 text-amber-500" />;
      case 'zalo':
        return <Smartphone className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[620px] rounded-[36px] border border-stone-200 dark:border-white/10 bg-white dark:bg-stone-900 shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-8 pb-6 border-b border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/[0.02] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-stone-100 dark:bg-white/5 rounded-2xl">
                {getChannelIcon()}
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight text-stone-950 dark:text-white">
                  Mẫu thông báo: {template.eventName}
                </DialogTitle>
                <p className="text-xs text-stone-500 uppercase tracking-widest font-mono mt-0.5">
                  Kênh: {template.channel.toUpperCase()} &bull; Cấu hình mẫu nội dung
                </p>
              </div>
            </div>

            <div className="flex bg-stone-100 dark:bg-white/5 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                  !previewMode
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm'
                    : 'text-stone-400'
                )}
              >
                Chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5',
                  previewMode
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm'
                    : 'text-stone-400'
                )}
              >
                <Eye className="w-3.5 h-3.5" /> Xem trước
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {previewMode ? (
            /* Live Preview Box */
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-stone-900 text-white space-y-4 shadow-xl border border-stone-800">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                    Xem trước thông báo thực tế
                  </span>
                  <span className="text-[10px] text-stone-400">Vừa xong</span>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-base text-white">{preview.title}</h4>
                  <p className="text-sm text-stone-300 font-medium whitespace-pre-wrap leading-relaxed">
                    {preview.body}
                  </p>
                </div>
              </div>
              <p className="text-xs text-stone-500 italic text-center">
                * Các biến trong ngoặc nhọn đã được thay thế bằng dữ liệu mẫu minh họa.
              </p>
            </div>
          ) : (
            /* Editor Mode */
            <div className="space-y-6">
              {/* Title template */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Tiêu đề thông báo
                </label>
                <Input
                  value={titleTemplate}
                  onChange={(e) => setTitleTemplate(e.target.value)}
                  placeholder="Tiêu đề mẫu thông báo..."
                  className="h-12 rounded-2xl font-bold bg-stone-50 dark:bg-white/5 border-stone-200 dark:border-white/10"
                />
              </div>

              {/* Body template */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Nội dung chi tiết
                </label>
                <textarea
                  rows={5}
                  value={bodyTemplate}
                  onChange={(e) => setBodyTemplate(e.target.value)}
                  placeholder="Nhập nội dung mẫu thông báo kèm các thẻ biến..."
                  className="w-full p-4 rounded-2xl font-medium text-sm bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-amber-500/20 text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Dynamic Variables Pill selector */}
              {template.variables && template.variables.length > 0 && (
                <div className="space-y-2.5 p-4 rounded-2xl bg-stone-50 dark:bg-white/[0.02] border border-stone-100 dark:border-white/5">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">
                    Bấm để chèn biến động vào nội dung
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {template.variables.map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => handleInsertVariable(v.key)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <Tag className="w-3 h-3" />
                        {`{${v.key}}`} &bull; <span className="font-sans text-[11px] font-normal">{v.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/[0.02] flex justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-2xl h-11 px-5 font-bold"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="rounded-2xl h-11 px-6 font-black uppercase text-xs tracking-wider bg-stone-900 dark:bg-amber-600 text-white"
          >
            Lưu mẫu tin nhắn
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
