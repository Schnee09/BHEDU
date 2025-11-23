"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";
import { showToast } from "@/components/ToastProvider";

type Student = {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  date_of_birth: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
};

export default function StudentsPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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
      console.log('[Students] Fetching via API, search:', debouncedSearch);
      setLoading(true);

      try {
        // Build query params
        const params = new URLSearchParams();
        if (debouncedSearch) params.append("search", debouncedSearch);

        // Fetch from API route (bypasses RLS)
        const response = await fetch(`/api/admin/students?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
          console.error("[Students] API error:", result.error);
          showToast.error("Failed to load students");
          setStudents([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }

        console.log('[Students] Fetched', result.data?.length || 0, 'students from API');
        setStudents(result.data || []);
        setTotalCount(result.total || 0);
        setLoading(false);
      } catch (error) {
        console.error("[Students] Fetch error:", error);
        showToast.error("Failed to load students");
        setStudents([]);
        setTotalCount(0);
        setLoading(false);
      }
    };

    fetchStudents();
  }, [profile, profileLoading, debouncedSearch, page]);

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
      
      // Refresh the list using API
      const refreshStudents = async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams();
          if (debouncedSearch) params.append("search", debouncedSearch);

          const response = await fetch(`/api/admin/students?${params.toString()}`);
          const result = await response.json();

          if (result.success) {
            setStudents(result.data || []);
            setTotalCount(result.total || 0);
          }
        } catch (error) {
          console.error("[Students] Refresh error:", error);
        }
        setLoading(false);
      };
      await refreshStudents();
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
    const headers = ["ID", "Full Name", "Email", "Phone", "Date of Birth", "Joined"];
    const rows = studentsToExport.map(s => [
      s.id,
      s.full_name,
      s.email || "",
      s.phone || "",
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
                  <th className="p-3 text-left">Phone</th>
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
                    <td className="p-3 text-gray-600">{s.phone || "-"}</td>
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
