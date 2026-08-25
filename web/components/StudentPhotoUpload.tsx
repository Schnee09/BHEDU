'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { showToast } from '@/components/ToastProvider';
import { CameraIcon, ArrowPathIcon, UserIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface StudentPhotoUploadProps {
  studentId: string;
  currentPhotoUrl?: string | null;
  onPhotoUpdated?: (newUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function StudentPhotoUpload({
  studentId,
  currentPhotoUrl,
  onPhotoUpdated,
  size = 'md',
}: StudentPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast.error('Vui lòng chọn tệp định dạng hình ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast.error('Kích thước ảnh tối đa là 5MB');
      return;
    }

    await uploadPhoto(file);
  };

  const uploadPhoto = async (file: File) => {
    const toastId = showToast.loading('Đang tải ảnh đại diện lên...');
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${studentId}-${Date.now()}.${fileExt}`;
      const filePath = `students/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      const updateResponse = await fetch(`/api/admin/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: publicUrl }),
      });

      if (!updateResponse.ok) {
        throw new Error('Không thể cập nhật ảnh vào hồ sơ');
      }

      if (currentPhotoUrl && currentPhotoUrl.includes('avatars/students/')) {
        const oldPath = currentPhotoUrl.split('avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      setPhotoUrl(publicUrl);
      showToast.dismiss(toastId);
      showToast.success('Đã cập nhật ảnh đại diện thành công!');

      if (onPhotoUpdated) {
        onPhotoUpdated(publicUrl);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      showToast.dismiss(toastId);
      showToast.error('Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const sizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20 sm:w-24 sm:h-24',
    lg: 'w-24 h-24 sm:w-28 sm:h-28',
  };

  return (
    <div className="relative inline-block group">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
        id={`photo-upload-${studentId}`}
      />

      {/* Avatar Container */}
      <div
        className={cn(
          'rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-100 dark:bg-stone-800 border-2 border-white dark:border-stone-700 shadow-md relative flex items-center justify-center transition-transform group-hover:scale-105',
          sizeClasses[size]
        )}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="Ảnh đại diện học sinh" className="w-full h-full object-cover" />
        ) : (
          <UserIcon className="w-10 h-10 text-stone-400 dark:text-stone-500" />
        )}

        {/* Uploading Overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-xs">
            <ArrowPathIcon className="w-6 h-6 text-amber-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Camera Action Trigger Button */}
      <label
        htmlFor={`photo-upload-${studentId}`}
        title="Đổi ảnh đại diện"
        className={cn(
          'absolute -bottom-1 -right-1 p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md cursor-pointer transition-all hover:scale-110 active:scale-95 border-2 border-white dark:border-stone-900 flex items-center justify-center',
          uploading && 'opacity-50 pointer-events-none'
        )}
      >
        <CameraIcon className="w-3.5 h-3.5 stroke-[2.5]" />
      </label>
    </div>
  );
}
