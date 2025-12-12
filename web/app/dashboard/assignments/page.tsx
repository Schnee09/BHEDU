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
  const { profile, loading: profileLoading } = useProfile();
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
          throw new Error(errorData.error || "Failed to fetch assignments");
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
      header: 'Title', 
      render: (row: Assignment) => <span className="font-medium text-stone-900">{row.title}</span> 
    },
    { 
      key: 'class', 
      header: 'Class', 
      render: (row: Assignment) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-medium">
          <Icons.Classes className="w-3 h-3" />
          {row.class_name || 'Unknown Class'}
        </span>
      )
    },
    { 
      key: 'due_date', 
      header: 'Due Date', 
      render: (row: Assignment) => (
        <div className="flex items-center gap-2 text-stone-600">
          <Icons.Calendar className="w-4 h-4 text-stone-400" />
          {row.due_date ? new Date(row.due_date).toLocaleDateString() : "No due date"}
        </div>
      )
    },
    { 
      key: 'actions', 
      header: 'Actions', 
      render: (row: Assignment) => (
        <button className="text-stone-600 hover:text-stone-900 font-medium text-sm inline-flex items-center gap-1">
          View Details
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
            Assignments
          </h1>
          <p className="text-stone-500 mt-1">View and manage your class assignments</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-stone-900">Current Assignments</h2>
        </CardHeader>
        <CardBody className="p-0">
          {assignments.length === 0 ? (
            <div className="p-8 text-center text-stone-500">
              <Icons.Assignments className="w-12 h-12 mx-auto mb-3 text-stone-400" />
              <p>No assignments found.</p>
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
