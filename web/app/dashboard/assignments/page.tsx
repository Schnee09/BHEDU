"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { apiFetch } from "@/lib/api/client";
import { Table } from "@/components/ui/table";
import { useProfile } from "@/hooks/useProfile";

type Assignment = {
  id: string;
  title: string;
  due_date: string | null;
  class_id: string;
  class_name?: string;
};

export default function AssignmentsPage() {
  const { profile: _profile, loading: profileLoading } = useProfile();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't fetch assignments until profile is loaded
    if (profileLoading) {
      return;
    }

    const fetchAssignments = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await apiFetch("/api/assignments");
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Không thể tải bài tập");
        }

        const { data } = await res.json();
        setAssignments(data || []);
      } catch (err: any) {
        console.error("[Assignments] Error:", err);
        setError(err.message);
        // Set empty assignments on error so page still displays
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [profileLoading]);

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">
          Error: {error}
        </div>
      </div>
    );
  }

  const columns = [
    { 
      key: 'title', 
      header: 'Tiêu đề', 
      render: (row: Assignment) => <span className="font-medium text-stone-900">{row.title}</span> 
    },
    { 
      key: 'class', 
      header: 'Lớp', 
      render: (row: Assignment) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-medium">
          <Icons.Classes className="w-3 h-3" />
          {row.class_name || 'Lớp không xác định'}
        </span>
      )
    },
    { 
      key: 'due_date', 
      header: 'Hạn nộp', 
      render: (r: Assignment) => (
        <div className="flex items-center gap-2 text-stone-600">
          <Icons.Calendar className="w-4 h-4 text-stone-400" />
          {r.due_date ? new Date(r.due_date).toLocaleDateString() : "Không có hạn"}
        </div>
      )
    },
    { 
      key: 'actions', 
      header: 'Hành động', 
      render: (_r: Assignment) => (
        <button className="text-stone-600 hover:text-stone-900 font-medium text-sm inline-flex items-center gap-1">
          Xem chi tiết
          <Icons.ChevronRight className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Icons.Assignments className="w-8 h-8 text-stone-600" />
            Bài tập
          </h1>
          <p className="text-stone-500 mt-1">Xem và quản lý bài tập lớp học của bạn</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-stone-900">Bài tập hiện tại</h2>
        </CardHeader>
        <CardBody className="p-0">
          {assignments.length === 0 ? (
            <div className="p-8 text-center text-stone-500">
              <Icons.Assignments className="w-12 h-12 mx-auto mb-3 text-stone-400" />
              <p>Không tìm thấy bài tập nào.</p>
            </div>
          ) : (
            <Table
              columns={columns}
              data={assignments}
              keyExtractor={(row) => row.id}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
