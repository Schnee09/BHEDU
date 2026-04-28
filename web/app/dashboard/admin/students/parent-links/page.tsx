"use client";

import { useEffect, useState } from "react";
import { AdminTable, Column } from "../../_components/AdminTable";
import { Badge } from "../../_components/FormElements";
import { ResponsiveTable, MobileCard, MobileCardList } from "@/components/ui/ResponsiveTable";
import { CheckIcon, XMarkIcon, UserIcon, IdentificationIcon, HeartIcon } from "@heroicons/react/24/outline";

interface ParentStudentLink {
  id: string;
  parent_id: string;
  student_id: string;
  relationship: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  parent: {
    full_name: string;
    email: string | null;
    phone: string | null;
  };
  student: {
    full_name: string;
    student_code: string;
  };
}

export default function ParentLinksPage() {
  const [links, setLinks] = useState<ParentStudentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/parent-links");
      const result = await res.json();
      setLinks(result.data || []);
    } catch (error) {
      console.error("Error fetching parent links:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleUpdateStatus = async (id: string, status: "approved" | "rejected") => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin/parent-links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        fetchLinks();
      } else {
        const result = await res.json();
        alert(result.error || "Không thể cập nhật trạng thái");
      }
    } catch (error) {
      console.error("Error updating link status:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const columns: Column<ParentStudentLink>[] = [
    {
      key: "parent",
      label: "Phụ huynh",
      render: (_, item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{item.parent.full_name}</span>
          <span className="text-xs text-gray-500">{item.parent.phone || item.parent.email}</span>
        </div>
      ),
    },
    {
      key: "student",
      label: "Học sinh",
      render: (_, item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{item.student.full_name}</span>
          <div className="flex items-center gap-1 mt-0.5">
            <IdentificationIcon className="w-3 h-3 text-blue-500" />
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-1.5 rounded uppercase">
              {item.student.student_code}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "relationship",
      label: "Mối quan hệ",
      render: (value: any) => (
        <span className="capitalize text-gray-600">{value as string}</span>
      )
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (status: any) => {
        const s = status as string;
        if (s === "pending") return <Badge variant="warning">Chờ duyệt</Badge>;
        if (s === "approved") return <Badge variant="success">Đã duyệt</Badge>;
        return <Badge variant="error">Từ chối</Badge>;
      },
    },
    {
      key: "created_at",
      label: "Ngày yêu cầu",
      render: (date: any) => new Date(date as string).toLocaleDateString("vi-VN"),
    },
    {
      key: "id",
      label: "Thao tác",
      render: (id: any, item) => {
        if (item.status !== "pending") return null;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleUpdateStatus(id as string, "approved")}
              disabled={!!actionLoading}
              className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
              title="Phê duyệt"
            >
              <CheckIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleUpdateStatus(id as string, "rejected")}
              disabled={!!actionLoading}
              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              title="Từ chối"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        );
      },
    },
  ];

  const renderMobileView = () => (
    <MobileCardList>
      {links.map((item) => (
        <MobileCard
          key={item.id}
          title={item.parent.full_name}
          subtitle={
            <div className="flex items-center gap-2">
              <IdentificationIcon className="w-3 h-3 text-blue-500" />
              <span className="font-bold text-blue-600 uppercase tracking-tighter">
                {item.student.full_name} ({item.student.student_code})
              </span>
            </div>
          }
          status={{
            label: item.status === "pending" ? "Chờ duyệt" : (item.status === "approved" ? "Đã duyệt" : "Từ chối"),
            color: item.status === "pending" ? "yellow" : (item.status === "approved" ? "green" : "red")
          }}
          fields={[
            { label: "Mối quan hệ", value: <div className="flex items-center gap-1"><HeartIcon className="w-3 h-3" /> {item.relationship}</div> },
            { label: "Liên hệ PH", value: item.parent.phone || item.parent.email || "N/A" },
            { label: "Ngày yêu cầu", value: new Date(item.created_at).toLocaleDateString("vi-VN") },
          ]}
          actions={item.status === "pending" && (
            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                onClick={() => handleUpdateStatus(item.id, "approved")}
                disabled={!!actionLoading}
                className="flex items-center justify-center gap-2 py-2.5 bg-green-50 text-green-700 rounded-xl font-bold text-sm press-effect border border-green-100"
              >
                <CheckIcon className="w-4 h-4" /> Duyệt
              </button>
              <button
                onClick={() => handleUpdateStatus(item.id, "rejected")}
                disabled={!!actionLoading}
                className="flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-700 rounded-xl font-bold text-sm press-effect border border-red-100"
              >
                <XMarkIcon className="w-4 h-4" /> Từ chối
              </button>
            </div>
          )}
        />
      ))}
    </MobileCardList>
  );

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Yêu cầu kết nối phụ huynh
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Phê duyệt hoặc từ chối các yêu cầu kết nối từ phụ huynh
          </p>
        </div>
      </div>

      <div className="bg-white/50 dark:bg-transparent backdrop-blur-sm rounded-[32px] overflow-hidden">
        <ResponsiveTable mobileView={renderMobileView()}>
          <AdminTable
            data={links}
            columns={columns}
            loading={loading}
            emptyMessage="Chưa có yêu cầu kết nối nào."
          />
        </ResponsiveTable>
      </div>
    </div>
  );
}
