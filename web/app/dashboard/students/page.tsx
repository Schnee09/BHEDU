"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { showToast } from "@/components/ToastProvider";

type Student = {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  status: string;
  date_of_birth: string | null;
  created_at: string;
};

export default function StudentsPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 50;

  // Simple debounce to avoid spamming queries while typing
  const debouncedSearch = useMemo(() => {
    const value = search.trim();
    return value.length >= 2 ? value : "";
  }, [search]);

  useEffect(() => {
    if (profileLoading || !profile) return;

    const fetchStudents = async () => {
      console.log('[Students] Fetching students, page:', page, 'search:', debouncedSearch, 'filter:', statusFilter);
      setLoading(true);
      let query = supabase
        .from("profiles")
        .select("id, full_name, email, role, status, date_of_birth, created_at", { count: "exact" })
        .eq("role", "student");

      // Apply status filter
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
        console.log('[Students] Applying status filter:', statusFilter);
      }

      if (debouncedSearch) {
        query = query.ilike("full_name", `%${debouncedSearch}%`);
        console.log('[Students] Applying search:', debouncedSearch);
      }

      // Teachers only see students in their classes
      if (profile.role === "teacher") {
        console.log('[Students] Teacher role, fetching classes for teacher:', profile.id);
        const { data: teacherClasses } = await supabase
          .from("classes")
          .select("id")
          .eq("teacher_id", profile.id);
        console.log('[Students] Teacher classes:', teacherClasses);
        const classIds = (teacherClasses as Array<{ id: string }> | null)?.map((c) => c.id) || [];
        if (classIds.length) {
          const { data: enrollments } = await supabase
            .from("enrollments")
            .select("student_id")
            .in("class_id", classIds);
          console.log('[Students] Enrollments:', enrollments);
          const studentIds = (enrollments as Array<{ student_id: string }> | null)?.map((e) => e.student_id) || [];
          if (studentIds.length) {
            query = query.in("id", studentIds);
            console.log('[Students] Filtering to', studentIds.length, 'student IDs');
          } else {
            console.log('[Students] No students found for teacher');
            setStudents([]);
            setTotalCount(0);
            setLoading(false);
            return;
          }
        } else {
          console.log('[Students] Teacher has no classes');
        }
      }

      const from = page * pageSize;
      const to = from + pageSize - 1;
      console.log('[Students] Fetching range:', from, 'to', to);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error, count } = (query as any)
        .order("created_at", { ascending: false })
        .range(from, to);
      
      if (error) {
        console.error("[Students] ❌ Error fetching students:", error);
      } else {
        console.log('[Students] Fetched', data?.length || 0, 'students, total count:', count);
      }
      
      const mapped: Student[] = Array.isArray(data)
        ? (data as unknown[]).map((raw) => {
            const r = raw as {
              id: unknown;
              full_name?: unknown;
              email?: unknown;
              role?: unknown;
              status?: unknown;
              date_of_birth?: unknown;
              created_at?: unknown;
            };
            return {
              id: String(r.id as string | number),
              full_name: String((r.full_name as string | undefined) || "Unknown"),
              email: r.email as string | null,
              role: String((r.role as string | undefined) || "student"),
              status: String((r.status as string | undefined) || "active"),
              date_of_birth: r.date_of_birth as string | null,
              created_at: String((r.created_at as string | undefined) || new Date().toISOString()),
            };
          })
        : [];
      setStudents(mapped);
      setTotalCount(count || 0);
      setLoading(false);
    };

    fetchStudents();
  }, [profile, profileLoading, debouncedSearch, statusFilter, page]);

  const handleSelectAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map(s => s.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkArchive = async () => {
    if (selectedIds.size === 0) {
      showToast.error("No students selected");
      return;
    }

    const confirmed = window.confirm(
      `Archive ${selectedIds.size} student(s)?\n\nThis will set their status to inactive. All data will be preserved.`
    );
    if (!confirmed) return;

    const toastId = showToast.loading(`Archiving ${selectedIds.size} students...`);

    try {
      // Archive each student via API
      const results = await Promise.allSettled(
        Array.from(selectedIds).map(id =>
          fetch(`/api/admin/students/${id}`, { method: 'DELETE' })
        )
      );

      const failed = results.filter(r => r.status === 'rejected').length;
      
      showToast.dismiss(toastId);
      
      if (failed > 0) {
        showToast.error(`Archived ${selectedIds.size - failed} students, ${failed} failed`);
      } else {
        showToast.success(`Successfully archived ${selectedIds.size} student(s)`);
      }
      
      setSelectedIds(new Set());
      
      // Refresh the list
      const fetchStudents = async () => {
        setLoading(true);
        let query = supabase
          .from("profiles")
          .select("id, full_name, email, role, status, date_of_birth, created_at", { count: "exact" })
          .eq("role", "student");

        if (statusFilter !== "all") {
          query = query.eq("status", statusFilter);
        }

        if (debouncedSearch) {
          query = query.ilike("full_name", `%${debouncedSearch}%`);
        }

        const from = page * pageSize;
        const to = from + pageSize - 1;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, count } = await (query as any)
          .order("created_at", { ascending: false })
          .range(from, to);

        const mapped: Student[] = Array.isArray(data)
          ? (data as unknown[]).map((raw) => {
              const r = raw as {
                id: unknown;
                full_name?: unknown;
                email?: unknown;
                role?: unknown;
                status?: unknown;
                date_of_birth?: unknown;
                created_at?: unknown;
              };
              return {
                id: String(r.id as string | number),
                full_name: String((r.full_name as string | undefined) || "Unknown"),
                email: r.email as string | null,
                role: String((r.role as string | undefined) || "student"),
                status: String((r.status as string | undefined) || "active"),
                date_of_birth: r.date_of_birth as string | null,
                created_at: String((r.created_at as string | undefined) || new Date().toISOString()),
              };
            })
          : [];
        setStudents(mapped);
        setTotalCount(count || 0);
        setLoading(false);
      };
      await fetchStudents();
    } catch (error) {
      console.error("Error archiving students:", error);
      showToast.dismiss(toastId);
      showToast.error("Failed to archive students");
    }
  };

  const handleExportCSV = () => {
    if (students.length === 0) {
      showToast.error("No students to export");
      return;
    }

    const studentsToExport = selectedIds.size > 0 
      ? students.filter(s => selectedIds.has(s.id))
      : students;

    // Create CSV content
    const headers = ["ID", "Full Name", "Email", "Status", "Date of Birth", "Joined"];
    const rows = studentsToExport.map(s => [
      s.id,
      s.full_name,
      s.email || "",
      s.status,
      s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString() : "",
      new Date(s.created_at).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Create download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `students_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast.success(`Exported ${studentsToExport.length} student(s) to CSV`);
  };

  if (profileLoading || loading) return <p>Loading students...</p>;

  const totalPages = Math.ceil(totalCount / pageSize);
  const isAllSelected = students.length > 0 && selectedIds.size === students.length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Students</h1>
        
        {/* Filters and Actions Row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px] max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0); // Reset to first page on search
              }}
              placeholder="Search by name (min 2 characters)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-medium"
          >
            📥 Export CSV
          </button>

          {/* Bulk Archive Button */}
          {profile?.role === "admin" && selectedIds.size > 0 && (
            <button
              onClick={handleBulkArchive}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 font-medium"
            >
              🗄️ Archive ({selectedIds.size})
            </button>
          )}
        </div>

        {/* Results Info */}
        <div className="text-sm text-gray-600 mb-2">
          Showing {students.length} of {totalCount} students
          {selectedIds.size > 0 && ` • ${selectedIds.size} selected`}
        </div>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg">No students found</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  {profile?.role === "admin" && (
                    <th className="p-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </th>
                  )}
                  <th className="p-3 text-left">Full Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Date of Birth</th>
                  <th className="p-3 text-left">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    {profile?.role === "admin" && (
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(s.id)}
                          onChange={() => handleSelectOne(s.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    <td className="p-3">
                      <Link href={`/dashboard/students/${s.id}`} className="text-blue-700 hover:underline font-medium">
                        {s.full_name}
                      </Link>
                    </td>
                    <td className="p-3 text-gray-600">{s.email || "-"}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        s.status === "active" ? "bg-green-100 text-green-800" :
                        s.status === "inactive" ? "bg-gray-100 text-gray-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">
                      {s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-3 text-gray-600">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <button
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-medium"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </button>
            <div className="text-sm text-gray-600">
              Page {page + 1} of {totalPages || 1}
            </div>
            <button
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-medium"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
