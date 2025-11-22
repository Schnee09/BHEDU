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
    <div className="flex items-center gap-6 p-6 bg-white border border-gray-200 rounded-lg">
      {/* Photo Preview */}
      <div className="flex-shrink-0">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt="Student photo"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
              👤
            </div>
          )}
        </div>
      </div>

      {/* Upload Controls */}
      <div className="flex-1">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Photo</h3>
        <p className="text-sm text-gray-500 mb-4">
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
            className={`px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer ${
              uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {uploading ? "Uploading..." : photoUrl ? "Change Photo" : "Upload Photo"}
          </label>

          {photoUrl && !uploading && (
            <button
              onClick={handleRemovePhoto}
              className="px-4 py-2 border border-red-300 rounded-lg font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
