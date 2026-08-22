'use client';

import React, { useState } from 'react';
import {
  Mail,
  MessageSquare,
  Bell,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  Save,
  Send,
  Zap,
  Tag,
} from 'lucide-react';
import { NotificationChannel, NotificationEvent, NotificationTemplate } from '@/lib/settings/types';
import { NotificationTemplateModal } from './NotificationTemplateModal';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

interface NotificationSettingsTabProps {
  channels: NotificationChannel[];
  events: NotificationEvent[];
  templates?: NotificationTemplate[];
  onToggleChannel: (index: number) => void;
  onToggleEvent: (index: number, type: 'push' | 'email' | 'sms' | 'zalo') => void;
  onSaveTemplates?: (templates: NotificationTemplate[]) => void;
  onSaveNotificationConfig?: () => Promise<void>;
  savingConfig?: boolean;
}

export function NotificationSettingsTab({
  channels,
  events,
  templates: initialTemplates,
  onToggleChannel,
  onToggleEvent,
  onSaveTemplates,
  onSaveNotificationConfig,
  savingConfig = false,
}: NotificationSettingsTabProps) {
  const toast = useToast();
  const [templates, setTemplates] = useState<NotificationTemplate[]>(
    initialTemplates || [
      {
        id: 'scores-push',
        eventId: 'scores',
        eventName: 'Điểm số mới',
        channel: 'push',
        titleTemplate: 'Điểm mới môn {subject_name}',
        bodyTemplate: 'Học sinh {student_name} vừa có điểm {score_type}: {score} điểm ({assessment_title}).',
        variables: [
          { key: 'student_name', label: 'Tên học sinh', example: 'Nguyễn Văn An' },
          { key: 'subject_name', label: 'Tên môn học', example: 'Toán 10' },
          { key: 'score', label: 'Điểm số', example: '9.0' },
          { key: 'score_type', label: 'Loại điểm', example: 'Kiểm tra 1 tiết' },
          { key: 'assessment_title', label: 'Tên bài kiểm tra', example: 'Chương 1 - Đại số' },
        ],
      },
      {
        id: 'billing-email',
        eventId: 'billing',
        eventName: 'Yêu cầu học phí',
        channel: 'email',
        titleTemplate: '[{school_name}] Thông báo học phí kỳ {period_name}',
        bodyTemplate: 'Kính gửi phụ huynh học sinh {student_name},\n\nTrung tâm xin gửi thông báo học phí kỳ {period_name} với tổng số tiền {amount} VNĐ. Hạn thanh toán đến ngày {due_date}.\n\nTrân trọng cảm ơn!',
        variables: [
          { key: 'school_name', label: 'Tên trung tâm', example: 'Bùi Hoàng Edu' },
          { key: 'student_name', label: 'Tên học sinh', example: 'Nguyễn Văn An' },
          { key: 'period_name', label: 'Kỳ học phí', example: 'Tháng 10/2026' },
          { key: 'amount', label: 'Số tiền', example: '2.500.000' },
          { key: 'due_date', label: 'Hạn thanh toán', example: '25/10/2026' },
        ],
      },
      {
        id: 'attendance-sms',
        eventId: 'attendance',
        eventName: 'Điểm danh / Vắng học',
        channel: 'sms',
        titleTemplate: '[{school_name}] Báo cáo chuyên cần',
        bodyTemplate: '{school_name}: Hoc sinh {student_name} vang mat buoi hoc lop {class_name} ngay {date}. Lien he: {hotline}.',
        variables: [
          { key: 'school_name', label: 'Tên trung tâm', example: 'BH-EDU' },
          { key: 'student_name', label: 'Tên học sinh', example: 'Nguyen Van An' },
          { key: 'class_name', label: 'Lớp học', example: '10A1' },
          { key: 'date', label: 'Ngày học', example: '11/08/2026' },
          { key: 'hotline', label: 'Hotline', example: '028-1234-5678' },
        ],
      },
    ]
  );

  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const handleEditTemplate = (tmpl: NotificationTemplate) => {
    setSelectedTemplate(tmpl);
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = (updated: NotificationTemplate) => {
    const updatedList = templates.map((t) => (t.id === updated.id ? updated : t));
    setTemplates(updatedList);
    onSaveTemplates?.(updatedList);
    toast.success('Đã cập nhật', `Mẫu tin nhắn "${updated.eventName}" đã được lưu.`);
  };

  const getChannelIcon = (id: string) => {
    switch (id) {
      case 'email':
        return <Mail className="w-6 h-6 text-blue-500" />;
      case 'sms':
        return <MessageSquare className="w-6 h-6 text-emerald-500" />;
      case 'push':
        return <Bell className="w-6 h-6 text-amber-500" />;
      case 'zalo':
        return <Smartphone className="w-6 h-6 text-blue-600" />;
      default:
        return <Zap className="w-6 h-6 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* 1. Notification Channels Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-white/5 pb-4">
          <div>
            <h3 className="text-base font-black text-stone-950 dark:text-white">
              Kênh gửi thông báo
            </h3>
            <p className="text-xs text-stone-500">
              Bật hoặc tắt các phương thức gửi tin tức thời đến phụ huynh và học sinh
            </p>
          </div>
          {onSaveNotificationConfig && (
            <button
              onClick={onSaveNotificationConfig}
              disabled={savingConfig}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-stone-900 dark:bg-amber-600 text-white font-black text-xs uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {savingConfig ? 'Đang lưu...' : 'Lưu cấu hình thông báo'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {channels.map((channel, i) => {
            const isActive = channel.active;

            return (
              <div
                key={channel.id}
                onClick={() => onToggleChannel(i)}
                className={cn(
                  'p-6 rounded-[28px] border transition-all duration-500 cursor-pointer space-y-5 flex flex-col justify-between',
                  isActive
                    ? 'bg-white dark:bg-stone-900/90 border-amber-500/30 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/10'
                    : 'bg-stone-50/50 dark:bg-white/[0.02] border-stone-100 dark:border-white/5 hover:border-stone-300 dark:hover:border-white/20'
                )}
              >
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-stone-100 dark:bg-white/5 rounded-2xl">
                    {getChannelIcon(channel.id)}
                  </div>
                  <div
                    className={cn(
                      'w-11 h-6 rounded-full p-1 transition-all flex items-center',
                      isActive ? 'bg-amber-500' : 'bg-stone-200 dark:bg-stone-800'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 bg-white rounded-full transition-transform',
                        isActive ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {channel.label}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed font-medium">
                    {channel.description || 'Kênh truyền thông tự động của trung tâm'}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100 dark:border-white/5 flex items-center justify-between text-[11px]">
                  <span
                    className={cn(
                      'font-bold',
                      isActive ? 'text-emerald-500' : 'text-stone-400'
                    )}
                  >
                    {isActive ? 'Đang hoạt động' : 'Tạm tắt'}
                  </span>
                  <span className="text-[10px] font-mono text-stone-400 uppercase">
                    {channel.id}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Notification Events Matrix */}
      <div className="p-8 md:p-10 rounded-[32px] bg-white dark:bg-stone-900/60 border border-stone-100 dark:border-white/5 space-y-6 shadow-sm">
        <div className="border-b border-stone-100 dark:border-white/5 pb-4">
          <h3 className="text-base font-black text-stone-950 dark:text-white">
            Sự kiện kích hoạt thông báo
          </h3>
          <p className="text-xs text-stone-500">
            Tùy chỉnh các kênh nhận tin tương ứng cho từng sự kiện nghiệp vụ
          </p>
        </div>

        <div className="divide-y divide-stone-100 dark:divide-white/5">
          {events.map((event, idx) => (
            <div
              key={event.id}
              className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-50/50 dark:hover:bg-white/[0.01] px-3 rounded-2xl transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-sm text-stone-900 dark:text-white">
                    {event.label}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-white/5 text-[9px] font-mono text-stone-500 uppercase">
                    {event.category || 'general'}
                  </span>
                </div>
                <p className="text-xs text-stone-500 font-medium">{event.description}</p>
              </div>

              {/* Channel Checkboxes */}
              <div className="flex items-center gap-6 self-end md:self-auto">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={event.push}
                    onChange={() => onToggleEvent(idx, 'push')}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500/20"
                  />
                  <span className="text-xs font-bold text-stone-600 dark:text-stone-400 group-hover:text-amber-500 transition-colors">
                    Push
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={event.email}
                    onChange={() => onToggleEvent(idx, 'email')}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500/20"
                  />
                  <span className="text-xs font-bold text-stone-600 dark:text-stone-400 group-hover:text-amber-500 transition-colors">
                    Email
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={event.sms ?? false}
                    onChange={() => onToggleEvent(idx, 'sms')}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500/20"
                  />
                  <span className="text-xs font-bold text-stone-600 dark:text-stone-400 group-hover:text-amber-500 transition-colors">
                    SMS
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={event.zalo ?? false}
                    onChange={() => onToggleEvent(idx, 'zalo')}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500/20"
                  />
                  <span className="text-xs font-bold text-stone-600 dark:text-stone-400 group-hover:text-amber-500 transition-colors">
                    Zalo
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Notification Message Templates */}
      <div className="p-8 md:p-10 rounded-[32px] bg-white dark:bg-stone-900/60 border border-stone-100 dark:border-white/5 space-y-6 shadow-sm">
        <div className="border-b border-stone-100 dark:border-white/5 pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-stone-950 dark:text-white">
              Mẫu tin nhắn thông báo (Templates)
            </h3>
            <p className="text-xs text-stone-500">
              Tùy chỉnh câu chữ và chèn các biến dữ liệu động vào nội dung thông báo
            </p>
          </div>
          <span className="px-3 py-1 bg-stone-100 dark:bg-white/5 rounded-full text-xs font-mono font-bold text-stone-600 dark:text-stone-300">
            {templates.length} mẫu có sẵn
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => handleEditTemplate(tmpl)}
              className="group p-6 rounded-[24px] bg-stone-50 dark:bg-white/[0.02] border border-stone-100 dark:border-white/5 hover:border-amber-500/30 transition-all cursor-pointer space-y-4 flex flex-col justify-between hover:shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-black uppercase">
                    {tmpl.channel}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {tmpl.variables?.length || 0} biến
                  </span>
                </div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-amber-500 transition-colors">
                  {tmpl.eventName}
                </h4>
                <p className="text-xs text-stone-500 line-clamp-3 font-medium">
                  {tmpl.bodyTemplate}
                </p>
              </div>

              <div className="pt-3 border-t border-stone-200/60 dark:border-white/5 flex items-center justify-between text-xs text-amber-500 font-bold">
                <span>Chỉnh sửa mẫu</span>
                <FileEdit className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Template Edit Modal */}
      <NotificationTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        template={selectedTemplate}
        onSave={handleSaveTemplate}
      />
    </div>
  );
}
