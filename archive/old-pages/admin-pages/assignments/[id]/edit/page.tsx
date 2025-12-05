"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { Card, LoadingState, Button, Input } from "@/components/ui";
import { useToast } from "@/hooks";

interface AssignmentFormData {
  title: string;
  description: string;
  class_id: string;
  category_id: string;
  total_points: number;
  due_date: string;
  published: boolean;
}

interface Class {
  id: string;
  name: string;
  code: string;
}

interface Category {
  id: string;
  name: string;
  weight: number;
}

export default function EditAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const assignmentId = params.id as string;

  const [formData, setFormData] = useState<AssignmentFormData>({
    title: "",
    description: "",
    class_id: "",
    category_id: "",
    total_points: 100,
    due_date: "",
    published: false,
  });
  const [classes, setClasses] = useState<Class[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch assignment, classes, and categories in parallel
        const [assignmentResponse, classesResponse, categoriesResponse] = await Promise.all([
          apiFetch(`/api/admin/assignments/${assignmentId}`),
          apiFetch("/api/admin/classes"),
          apiFetch("/api/grades/categories"),
        ]);

        if (!assignmentResponse.ok) {
          throw new Error("Failed to fetch assignment details");
        }

        const assignmentData = await assignmentResponse.json();
        const classesData = await classesResponse.json();
        const categoriesData = await categoriesResponse.json();

        const assignment = assignmentData.data || assignmentData;

        setFormData({
          title: assignment.title || "",
          description: assignment.description || "",
          class_id: assignment.class_id || "",
          category_id: assignment.category_id || "",
          total_points: assignment.total_points || 100,
          due_date: assignment.due_date || "",
          published: assignment.published || false,
        });

        setClasses(classesData.data || classesData.classes || []);
        setCategories(categoriesData.data || categoriesData.categories || []);
      } catch (err: any) {
        console.error("[EditAssignment] Error:", err);
        setError(err.message);
        toast.error("Failed to load assignment data");
      } finally {
        setLoading(false);
      }
    };

    if (assignmentId) {
      fetchData();
    }
  }, [assignmentId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      const response = await apiFetch(`/api/admin/assignments/${assignmentId}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update assignment");
      }

      toast.success("Assignment updated successfully!");
      router.push(`/dashboard/admin/assignments/${assignmentId}`);
    } catch (err: any) {
      console.error("[EditAssignment] Save error:", err);
      toast.error(err.message || "Failed to update assignment");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof AssignmentFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <LoadingState message="Loading assignment data..." />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Assignment</h1>
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
          <h1 className="text-3xl font-bold text-gray-900">Edit Assignment</h1>
          <p className="text-gray-600">Update assignment details and settings</p>
        </div>
        <Link href={`/dashboard/admin/assignments/${assignmentId}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      {/* Edit Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Title <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
                placeholder="e.g., Chapter 5 Quiz"
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
                placeholder="Assignment description and instructions..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.class_id}
                onChange={(e) => handleChange("class_id", e.target.value)}
                required
              >
                <option value="">Select a class...</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.category_id}
                onChange={(e) => handleChange("category_id", e.target.value)}
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.weight}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Points <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                value={formData.total_points}
                onChange={(e) => handleChange("total_points", parseInt(e.target.value) || 0)}
                required
                placeholder="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <Input
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => handleChange("due_date", e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => handleChange("published", e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Publish Assignment</span>
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Published assignments are visible to students
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Link href={`/dashboard/admin/assignments/${assignmentId}`}>
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
