'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileFormData {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  date_of_birth: string;
  personal_email: string;
}

interface ProfileFormCardProps {
  formData: ProfileFormData;
  onSaveField: (fieldKey: keyof ProfileFormData, newValue: string) => Promise<boolean>;
}

interface FieldRowProps {
  label: string;
  value: string;
  fieldKey: keyof ProfileFormData;
  placeholder?: string;
  type?: string;
  isTextarea?: boolean;
  onSave: (newValue: string) => Promise<boolean>;
}

const FieldRow: React.FC<FieldRowProps> = ({ label, value, placeholder = 'Chưa thiết lập', type = 'text', isTextarea = false, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setVal(value); }, [value]);
  useEffect(() => {
    if (editing) {
      setTimeout(() => {
        inputRef.current?.focus();
        taRef.current?.focus();
      }, 50);
    }
  }, [editing]);

  const commit = async () => {
    if (val.trim() === value) { setEditing(false); return; }
    setSaving(true);
    const ok = await onSave(val.trim());
    setSaving(false);
    if (ok) {
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setVal(value);
      setEditing(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isTextarea) commit();
    if (e.key === 'Escape') { setVal(value); setEditing(false); }
  };

  return (
    <div className="flex items-start justify-between py-4 border-b border-stone-100 dark:border-stone-800/60 group last:border-0">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1.5">{label}</p>

        {editing ? (
          isTextarea ? (
            <textarea
              ref={taRef}
              value={val}
              onChange={e => setVal(e.target.value)}
              onBlur={commit}
              onKeyDown={onKey}
              disabled={saving}
              rows={3}
              className="w-full text-sm text-stone-800 dark:text-stone-200 bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
            />
          ) : (
            <input
              ref={inputRef}
              type={type}
              value={val}
              onChange={e => setVal(e.target.value)}
              onBlur={commit}
              onKeyDown={onKey}
              disabled={saving}
              className="w-full text-sm text-stone-800 dark:text-stone-200 bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          )
        ) : (
          <p
            onClick={() => setEditing(true)}
            className={cn(
              'text-sm cursor-text',
              value ? 'text-stone-800 dark:text-stone-200 font-medium' : 'text-stone-400 dark:text-stone-500 italic'
            )}
          >
            {value || placeholder}
          </p>
        )}
      </div>

      <div className="flex items-center h-6 mt-[22px]">
        {saving
          ? <Loader2 className="w-3.5 h-3.5 text-stone-400 animate-spin" />
          : saved
          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          : !editing && (
            <button
              onClick={() => setEditing(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <Pencil className="w-3.5 h-3.5 text-stone-400" />
            </button>
          )
        }
      </div>
    </div>
  );
};

export default function ProfileFormCard({ formData, onSaveField }: ProfileFormCardProps) {
  return (
    <motion.div
      key="profile-form"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-6">
        <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">Thông tin định danh</h3>
        <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Click vào bất kỳ trường nào để chỉnh sửa. Thay đổi được lưu tự động.</p>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 px-6">
        <FieldRow label="Họ và tên đầy đủ" value={formData.full_name} fieldKey="full_name" placeholder="Chưa nhập tên" onSave={v => onSaveField('full_name', v)} />
        <FieldRow label="Ngày sinh" value={formData.date_of_birth} fieldKey="date_of_birth" type="date" onSave={v => onSaveField('date_of_birth', v)} />
        <FieldRow label="Số điện thoại" value={formData.phone} fieldKey="phone" type="tel" placeholder="Chưa có số điện thoại" onSave={v => onSaveField('phone', v)} />
        <FieldRow label="Email cá nhân (phụ)" value={formData.personal_email} fieldKey="personal_email" type="email" placeholder="Chưa có email phụ" onSave={v => onSaveField('personal_email', v)} />
        <FieldRow label="Địa chỉ thường trú" value={formData.address} fieldKey="address" isTextarea placeholder="Chưa có địa chỉ" onSave={v => onSaveField('address', v)} />
      </div>
    </motion.div>
  );
}
