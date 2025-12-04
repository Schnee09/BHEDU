"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { Card, LoadingState, Button, Input } from "@/components/ui";
import { useToast } from "@/hooks";

interface TeacherFormData {
  full_name: string;
  email: string;
  phone: string;
  department: string;
  specialization: string;
  hire_date: string;
  notes: string;
  is_active: boolean;
}

export default function EditTeacherPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const teacherId = params.id as string;

  const [formData, setFormData] = useState<TeacherFormData>({
    full_name: "",
    email: "",
    phone: "",
    department: "",
    specialization: "",
    hire_date: "",
    notes: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        setLoading(true);
        const response = await apiFetch(`/api/admin/teachers/${teacherId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch teacher details");
        }

        const data = await response.json();
        const teacher = data.data || data;

        setFormData({
          full_name: teacher.full_name || "",
          email: teacher.email || "",
          phone: teacher.phone || "",
          department: teacher.department || "",
          specialization: teacher.specialization || "",
          hire_date: teacher.hire_date || "",
          notes: teacher.notes || "",
          is_active: teacher.is_active !== undefined ? teacher.is_active : true,
        });
      } catch (err: any) {
        console.error("[EditTeacher] Error:", err);
        setError(err.message);
        toast.error("Failed to load teacher data");
      } finally {
        setLoading(false);
      }
    };

    if (teacherId) {
      fetchTeacher();
    }
  }, [teacherId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      const response = await apiFetch(`/api/admin/teachers/${teacherId}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update teacher");
      }

      toast.success("Teacher updated successfully!");
      router.push(`/dashboard/admin/teachers/${teacherId}`);
    } catch (err: any) {
      console.error("[EditTeacher] Save error:", err);
      toast.error(err.message || "Failed to update teacher");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof TeacherFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <LoadingState message="Loading teacher data..." />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Teacher</h1>
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
          <h1 className="text-3xl font-bold text-gray-900">Edit Teacher</h1>
          <p className="text-gray-600">Update teacher information</p>
        </div>
        <Link href={`/dashboard/admin/teachers/${teacherId}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      {/* Edit Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                required
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="(123) 456-7890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <Input
                type="text"
                value={formData.department}
                onChange={(e) => handleChange("department", e.target.value)}
                placeholder="e.g., Mathematics"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialization
              </label>
              <Input
                type="text"
                value={formData.specialization}
                onChange={(e) => handleChange("specialization", e.target.value)}
                placeholder="e.g., Algebra, Calculus"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hire Date
              </label>
              <Input
                type="date"
                value={formData.hire_date}
                onChange={(e) => handleChange("hire_date", e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Additional notes..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleChange("is_active", e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Active Teacher</span>
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Inactive teachers cannot access the system or be assigned to classes
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Link href={`/dashboard/admin/teachers/${teacherId}`}>
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
