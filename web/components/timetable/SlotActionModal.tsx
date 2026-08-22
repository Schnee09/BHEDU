"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui";
import { useToast } from "@/hooks";
import { apiFetch } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  BookOpen,
  MapPin,
  User,
  Clock,
  Calendar,
  Trash2,
  ExternalLink,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Save,
} from "lucide-react";
import { getDisplayName } from "@/lib/utils/names";

interface SlotActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  slot: any | null;
  teachers: any[];
  dynamicRooms: string[];
  canEdit: boolean;
}

const DAY_NAMES = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ Nhật",
];

export default function SlotActionModal({
  isOpen,
  onClose,
  onSuccess,
  slot,
  teachers,
  dynamicRooms,
  canEdit,
}: SlotActionModalProps) {
  const toast = useToast();
  const router = useRouter();

  const [targetRoom, setTargetRoom] = useState<string>("");
  const [targetTeacherId, setTargetTeacherId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  React.useEffect(() => {
    if (slot) {
      setTargetRoom(slot.room || "");
      setTargetTeacherId(slot.teacher_id || slot.teacher?.id || "");
      setShowConfirmDelete(false);
    }
  }, [slot]);

  if (!slot) return null;

  const className = slot.class?.name || "Lớp học";
  const subjectName = slot.subject?.name || "Môn học";
  const teacherName = getDisplayName(slot.teacher) || "Chưa gán giáo viên";
  const timeRange = `${slot.start_time?.substring(0, 5)} - ${slot.end_time?.substring(0, 5)}`;
  const dayName = DAY_NAMES[slot.day_of_week] || `Thứ ${slot.day_of_week + 2}`;

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const res = await apiFetch(`/api/timetable/${slot.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          room: targetRoom || null,
          teacher_id: targetTeacherId || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Không thể cập nhật tiết học");
      }

      toast.success("Cập nhật thành công", "Thông tin tiết học đã được lưu!");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error("Lỗi", err.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/timetable/${slot.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Không thể xóa tiết học");
      }

      toast.success("Đã xóa tiết học", "Tiết học đã được gỡ khỏi Thời Khóa Biểu!");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error("Lỗi", err.message || "Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi Tiết Tiết Học"
      size="lg"
    >
      <div className="space-y-6">
        {/* Class Identity Card */}
        <div className="p-5 bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-900 text-[10px] font-black uppercase tracking-wider">
                  {subjectName}
                </span>
                <span className="text-xs font-bold text-stone-400">
                  {dayName} ({timeRange})
                </span>
              </div>
              <h3 className="text-2xl font-black tracking-tight">{className}</h3>
              <p className="text-xs text-stone-300 mt-1 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>GV: {teacherName}</span>
              </p>
            </div>

            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md text-center min-w-[90px]">
              <span className="text-[10px] font-black text-stone-300 block uppercase">Phòng</span>
              <span className="text-sm font-black text-amber-400 block mt-0.5">
                {slot.room || "Chưa gán"}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons within Card */}
          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-white/10">
            {slot.class_id && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/dashboard/classes/${slot.class_id}`);
                  }}
                  className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Vào Lớp Học</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/dashboard/attendance/mark?class_id=${slot.class_id}`);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Điểm Danh Ca Này</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Management Controls for Authorized Roles */}
        {canEdit && (
          <div className="space-y-4 p-4 bg-stone-50 dark:bg-stone-900/60 rounded-2xl border border-stone-200/80 dark:border-white/5">
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-300">
              Điều Chỉnh Nhanh Phòng Học & Giáo Viên
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Room Changer */}
              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1.5">
                  Đổi Phòng Học
                </label>
                <div className="relative group">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-amber-500 z-10" />
                  <select
                    value={targetRoom}
                    onChange={(e) => setTargetRoom(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-white/10 text-xs font-bold text-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                  >
                    <option value="">-- Chưa gán phòng --</option>
                    {dynamicRooms.map((r) => (
                      <option key={r} value={r}>
                        Phòng {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Teacher Changer */}
              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1.5">
                  Đổi Giáo Viên Đứng Lớp
                </label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-amber-500 z-10" />
                  <select
                    value={targetTeacherId}
                    onChange={(e) => setTargetTeacherId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-white/10 text-xs font-bold text-stone-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                  >
                    <option value="">-- Chưa gán giáo viên --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {getDisplayName(t)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Save quick changes */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleUpdate}
                disabled={saving}
                className="px-5 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-amber-500 dark:hover:bg-amber-400 dark:hover:text-stone-900 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white dark:border-stone-900 border-t-transparent rounded-full animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu Thay Đổi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Delete Slot Confirmation or Trigger */}
        {canEdit && (
          <div className="pt-2">
            {!showConfirmDelete ? (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1.5 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa tiết học này khỏi Thời Khóa Biểu</span>
              </button>
            ) : (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800/60 space-y-3 animate-fade-in">
                <div className="flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                  <p>
                    Bạn có chắc muốn xóa tiết học <strong>{className}</strong> vào <strong>{dayName} ({timeRange})</strong> khỏi TKB không? Lớp học và danh sách học sinh vẫn được giữ nguyên.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(false)}
                    className="px-3 py-1.5 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold rounded-xl border border-stone-200 dark:border-white/10"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase rounded-xl transition-all flex items-center gap-1 shadow-sm disabled:opacity-50"
                  >
                    {deleting ? "Đang xóa..." : "Xác nhận xóa"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
