"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { showToast } from "@/components/ToastProvider";

interface StudentPhotoUploadProps {
  studentId: string;
  currentPhotoUrl?: string | null;
  onPhotoUpdated?: (newUrl: string) => void;
}

export default function StudentPhotoUpload({
  studentId,
  currentPhotoUrl,
  onPhotoUpdated
}: StudentPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast.error("Image size must be less than 5MB");
      return;
    }

    await uploadPhoto(file);
  };

  const uploadPhoto = async (file: File) => {
    const toastId = showToast.loading("Uploading photo...");
    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${studentId}-${Date.now()}.${fileExt}`;
      const filePath = `students/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update profile with new photo URL via API
      const updateResponse = await fetch(`/api/admin/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: publicUrl })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update profile');
      }

      // Delete old photo if exists
      if (currentPhotoUrl && currentPhotoUrl.includes("avatars/students/")) {
        const oldPath = currentPhotoUrl.split("avatars/")[1];
        if (oldPath) {
          await supabase.storage.from("avatars").remove([oldPath]);
        }
      }

      setPhotoUrl(publicUrl);
      showToast.dismiss(toastId);
      showToast.success("Photo uploaded successfully");

      if (onPhotoUpdated) {
        onPhotoUpdated(publicUrl);
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      showToast.dismiss(toastId);
      showToast.error("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!photoUrl) return;

    const confirmed = window.confirm("Remove student photo?");
    if (!confirmed) return;

    const toastId = showToast.loading("Removing photo...");

    try {
      // Update profile to remove photo URL via API
      const updateResponse = await fetch(`/api/admin/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: null })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update profile');
      }

      // Delete from storage
      if (photoUrl.includes("avatars/students/")) {
        const filePath = photoUrl.split("avatars/")[1];
        if (filePath) {
          await supabase.storage.from("avatars").remove([filePath]);
        }
      }

      setPhotoUrl(null);
      showToast.dismiss(toastId);
      showToast.success("Photo removed successfully");

      if (onPhotoUpdated) {
        onPhotoUpdated("");
      }
    } catch (error) {
      console.error("Error removing photo:", error);
      showToast.dismiss(toastId);
      showToast.error("Failed to remove photo");
    }
  };

  return (
    <div className="flex items-center gap-6 p-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
      {/* Photo Preview */}
      <div className="flex-shrink-0">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt="Student photo"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Upload Controls */}
      <div className="flex-1">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Profile Photo</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          JPG, PNG or GIF. Max size 5MB. Recommended: square image, at least 200x200px.
        </p>

        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="photo-upload"
          />

          <label
            htmlFor="photo-upload"
            className={`px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer ${uploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            {uploading ? "Uploading..." : photoUrl ? "Change Photo" : "Upload Photo"}
          </label>

          {photoUrl && !uploading && (
            <button
              onClick={handleRemovePhoto}
              className="px-4 py-2 border border-red-300 dark:border-red-700 rounded-lg font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
