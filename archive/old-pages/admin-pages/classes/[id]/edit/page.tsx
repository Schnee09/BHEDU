"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { Card, LoadingState, Button, Input } from "@/components/ui";
import { useToast } from "@/hooks";

interface ClassFormData {
  name: string;
  code: string;
  description: string;
  schedule: string;
  room: string;
  teacher_id: string;
}

interface Teacher {
  id: string;
  full_name: string;
  email: string;
}

export default function EditClassPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const classId = params.id as string;

  const [formData, setFormData] = useState<ClassFormData>({
    name: "",
    code: "",
    description: "",
    schedule: "",
    room: "",
    teacher_id: "",
  });
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch class data and teachers in parallel
        const [classResponse, teachersResponse] = await Promise.all([
          apiFetch(`/api/admin/classes/${classId}`),
          apiFetch("/api/admin/teachers"),
        ]);

        if (!classResponse.ok) {
          throw new Error("Failed to fetch class details");
        }

        const classData = await classResponse.json();
        const teachersData = await teachersResponse.json();

        setFormData({
          name: classData.data?.name || classData.name || "",
          code: classData.data?.code || classData.code || "",
          description: classData.data?.description || classData.description || "",
          schedule: classData.data?.schedule || classData.schedule || "",
          room: classData.data?.room || classData.room || "",
          teacher_id: classData.data?.teacher_id || classData.teacher_id || "",
        });

        setTeachers(teachersData.data || teachersData.teachers || []);
      } catch (err: any) {
        console.error("[EditClass] Error:", err);
        setError(err.message);
        toast.error("Failed to load class data");
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchData();
    }
  }, [classId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const response = await apiFetch(`/api/admin/classes/${classId}`, {
        method: "PATCH",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update class");
      }

      toast.success("Class updated successfully!");
      router.push(`/dashboard/admin/classes/${classId}`);
    } catch (err: any) {
      console.error("[EditClass] Save error:", err);
      toast.error(err.message || "Failed to update class");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ClassFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <LoadingState message="Loading class data..." />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Class</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Class</h1>
          <p className="text-gray-600">Update class information and settings</p>
        </div>
        <Link href={`/dashboard/admin/classes/${classId}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      {/* Edit Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                placeholder="e.g., Mathematics 101"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class Code <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.code}
                onChange={(e) => handleChange("code", e.target.value)}
                required
                placeholder="e.g., MATH101"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Class description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule
              </label>
              <Input
                type="text"
                value={formData.schedule}
                onChange={(e) => handleChange("schedule", e.target.value)}
                placeholder="e.g., Mon/Wed/Fri 10:00-11:30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room
              </label>
              <Input
                type="text"
                value={formData.room}
                onChange={(e) => handleChange("room", e.target.value)}
                placeholder="e.g., Room 101"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teacher <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.teacher_id}
                onChange={(e) => handleChange("teacher_id", e.target.value)}
                required
              >
                <option value="">Select a teacher...</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name} ({teacher.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Link href={`/dashboard/admin/classes/${classId}`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
