"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { api } from "@/lib/api-client";
import { showToast } from "@/components/ToastProvider";
import Link from "next/link";

interface ClassData {
  id: string;
  name: string;
  created_at: string;
  teacher_id: string;
  teacher?: {
    full_name: string;
  };
  enrollment_count?: number;
}

export default function ClassesPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profileLoading || !profile) return;

    const fetchClasses = async () => {
      console.log('[Classes] Fetching classes for profile:', profile.role, profile.id);
      setLoading(true);

      try {
        // Teachers only see their own classes
        const params = profile.role === 'teacher' 
          ? { teacher_id: profile.id }
          : undefined;

        const result = await api.classes.list(params);
        console.log('[Classes] Fetched', result.length, 'classes');
        setClasses(result);
      } catch (error) {
        console.error('[Classes] Fetch error:', error);
        showToast.error('Failed to load classes');
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [profile, profileLoading]);

  if (profileLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading classes...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Classes</h1>
        <p className="text-gray-600">
          {profile?.role === 'teacher' 
            ? 'Your assigned classes' 
            : 'All classes in the system'}
        </p>
      </div>

      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="border border-gray-200 bg-white p-5 rounded-lg shadow-sm hover:shadow-md transition"
            >
              <h2 className="font-semibold text-lg mb-2">{cls.name}</h2>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Teacher:</span>{' '}
                  {cls.teacher?.full_name || 'Not assigned'}
                </p>
                {cls.enrollment_count !== undefined && (
                  <p>
                    <span className="font-medium">Students:</span>{' '}
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {cls.enrollment_count}
                    </span>
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  Created: {new Date(cls.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/dashboard/classes/${cls.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg">No classes found</p>
          <p className="text-gray-400 text-sm mt-2">
            {profile?.role === 'teacher' 
              ? 'You have not been assigned to any classes yet' 
              : 'No classes have been created yet'}
          </p>
        </div>
      )}
    </div>
  );
}
