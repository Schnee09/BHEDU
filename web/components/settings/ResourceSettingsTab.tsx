'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useToast } from '@/hooks/useToast';
import { MapPin, Clock, Building, Plus, Trash2, Save, Loader2, Search, AlertTriangle } from 'lucide-react';

export function ResourceSettingsTab() {
  const toast = useToast();
  const [rooms, setRooms] = useState<Record<string, string[]>>({});
  const [schedules, setSchedules] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slotCounts, setSlotCounts] = useState<{
    rooms: Record<string, number>;
    schedules: Record<string, number>;
    branches: Record<string, number>;
  }>({ rooms: {}, schedules: {}, branches: {} });

  // Tab & Search state
  const [subTab, setSubTab] = useState<'rooms' | 'schedules' | 'branches'>('rooms');
  const [searchQuery, setSearchQuery] = useState('');

  // New item inputs
  const [newRoomBranch, setNewRoomBranch] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [newStart, setNewStart] = useState('08:00');
  const [newEnd, setNewEnd] = useState('09:30');
  const [newBranch, setNewBranch] = useState('');

  // Delete confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState('');
  const [deleteItemBranch, setDeleteItemBranch] = useState('');
  const [deleteItemType, setDeleteItemType] = useState<'room' | 'schedule' | 'branch'>('room');

  const loadResources = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/settings?category=resource&include_counts=true');
      if (res.ok) {
        const json = await res.json();
        
        let loadedBranches: string[] = [];
        if (json.settings?.center_branches?.value_json) {
          loadedBranches = json.settings.center_branches.value_json;
          setBranches(loadedBranches);
          if (loadedBranches.length > 0) {
            setNewRoomBranch(loadedBranches[0] || '');
          }
        }
        
        if (json.settings?.center_rooms?.value_json) {
          const rawRooms = json.settings.center_rooms.value_json;
          if (rawRooms && typeof rawRooms === 'object' && !Array.isArray(rawRooms)) {
            setRooms(rawRooms);
          } else if (Array.isArray(rawRooms)) {
            // Legacy conversion
            const defaultBranchName = loadedBranches[0] || 'Cơ sở khác';
            setRooms({ [defaultBranchName]: rawRooms });
          }
        }
        
        if (json.settings?.center_schedules?.value_json) {
          setSchedules(json.settings.center_schedules.value_json);
        }
        
        if (json.slotCounts) {
          setSlotCounts(json.slotCounts);
        }
      }
    } catch (error) {
      console.error('Failed to load resources:', error);
      toast.error('Lỗi', 'Không thể tải danh sách tài nguyên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const branch = newRoomBranch.trim();
    const room = newRoom.trim();
    if (!branch) {
      toast.warning('Thiếu thông tin', 'Vui lòng chọn cơ sở cho phòng học');
      return;
    }
    if (!room) return;

    const branchRooms = rooms[branch] || [];
    if (branchRooms.some(r => r.toLowerCase() === room.toLowerCase())) {
      toast.warning('Trùng lặp', 'Phòng học này đã tồn tại ở cơ sở đã chọn');
      return;
    }

    setRooms(prev => ({
      ...prev,
      [branch]: [...branchRooms, room]
    }));
    setNewRoom('');
    toast.success('Đã thêm phòng học', 'Nhớ bấm Lưu tất cả tài nguyên để cập nhật CSDL');
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStart || !newEnd) {
      toast.warning('Thiếu thông tin', 'Vui lòng chọn đầy đủ giờ bắt đầu và kết thúc');
      return;
    }
    const val = `${newStart} - ${newEnd}`;
    if (schedules.includes(val)) {
      toast.warning('Trùng lặp', 'Khung giờ này đã tồn tại');
      return;
    }
    setSchedules(prev => [...prev, val]);
    toast.success('Đã thêm ca học', 'Nhớ bấm Lưu tất cả tài nguyên để cập nhật CSDL');
  };

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newBranch.trim();
    if (!val) return;
    if (branches.includes(val)) {
      toast.warning('Trùng lặp', 'Cơ sở này đã tồn tại');
      return;
    }
    setBranches(prev => [...prev, val]);
    if (!newRoomBranch) {
      setNewRoomBranch(val);
    }
    setNewBranch('');
    toast.success('Đã thêm cơ sở', 'Nhớ bấm Lưu tất cả tài nguyên để cập nhật CSDL');
  };

  const promptDelete = (item: string, type: 'room' | 'schedule' | 'branch', branchName?: string) => {
    setDeleteItem(item);
    setDeleteItemType(type);
    setDeleteItemBranch(branchName || '');
    setConfirmOpen(true);
  };

  const getActiveUsageCount = (item: string, type: 'room' | 'schedule' | 'branch'): number => {
    if (type === 'room') return slotCounts.rooms[item] || 0;
    if (type === 'schedule') return slotCounts.schedules[item] || 0;
    return slotCounts.branches[item] || 0;
  };

  const executeDelete = () => {
    if (deleteItemType === 'room') {
      const branch = deleteItemBranch;
      if (branch) {
        setRooms(prev => {
          const copy = { ...prev };
          if (copy[branch]) {
            copy[branch] = copy[branch].filter(r => r !== deleteItem);
          }
          return copy;
        });
      }
    } else if (deleteItemType === 'schedule') {
      setSchedules(prev => prev.filter(s => s !== deleteItem));
    } else if (deleteItemType === 'branch') {
      setBranches(prev => prev.filter(b => b !== deleteItem));
      setRooms(prev => {
        const copy = { ...prev };
        delete copy[deleteItem];
        return copy;
      });
    }
    setConfirmOpen(false);
    toast.success('Đã xóa tạm thời', `Nhấn "Lưu tất cả tài nguyên" để cập nhật vào cơ sở dữ liệu`);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const [rRes, sRes, bRes] = await Promise.all([
        apiFetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'center_rooms',
            value_json: rooms,
            category: 'resource',
            is_public: true,
          }),
        }),
        apiFetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'center_schedules',
            value_json: schedules,
            category: 'resource',
            is_public: true,
          }),
        }),
        apiFetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'center_branches',
            value_json: branches,
            category: 'resource',
            is_public: true,
          }),
        }),
      ]);

      if (rRes.ok && sRes.ok && bRes.ok) {
        toast.success('Thành công', 'Đã cập nhật cấu hình tài nguyên hệ thống');
        loadResources(); // Reload values and counts
      } else {
        throw new Error('Some requests failed');
      }
    } catch (error) {
      console.error('Failed to save resources:', error);
      toast.error('Lỗi', 'Không thể lưu cấu hình tài nguyên');
    } finally {
      setSaving(false);
    }
  };

  const getFilteredItems = () => {
    const q = searchQuery.toLowerCase().trim();
    if (subTab === 'schedules') {
      return schedules.filter(s => s.toLowerCase().includes(q));
    }
    return branches.filter(b => b.toLowerCase().includes(q));
  };

  const getFilteredRooms = () => {
    const q = searchQuery.toLowerCase().trim();
    const list: { branch: string; room: string }[] = [];
    for (const [branch, rms] of Object.entries(rooms)) {
      if (Array.isArray(rms)) {
        rms.forEach(r => {
          if (r.toLowerCase().includes(q) || branch.toLowerCase().includes(q)) {
            list.push({ branch, room: r });
          }
        });
      }
    }
    return list;
  };

  const filteredItems = getFilteredItems();
  const filteredRooms = getFilteredRooms();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-sm font-medium italic">Đang tải cấu hình tài nguyên...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SUB-TABS HUB */}
      <div className="flex gap-2 border-b border-stone-250/60 dark:border-white/5 pb-px mb-6 overflow-x-auto scroll-hide">
        <button
          onClick={() => { setSubTab('rooms'); setSearchQuery(''); }}
          className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === 'rooms'
              ? 'border-amber-500 text-stone-900 dark:text-white font-black'
              : 'border-transparent text-stone-400 hover:text-stone-700 dark:hover:text-stone-255'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Phòng học ({filteredRooms.length})
        </button>
        <button
          onClick={() => { setSubTab('schedules'); setSearchQuery(''); }}
          className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === 'schedules'
              ? 'border-amber-500 text-stone-900 dark:text-white font-black'
              : 'border-transparent text-stone-400 hover:text-stone-700 dark:hover:text-stone-255'
          }`}
        >
          <Clock className="w-4 h-4" />
          Khung giờ chuẩn ({schedules.length})
        </button>
        <button
          onClick={() => { setSubTab('branches'); setSearchQuery(''); }}
          className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === 'branches'
              ? 'border-amber-500 text-stone-900 dark:text-white font-black'
              : 'border-transparent text-stone-400 hover:text-stone-700 dark:hover:text-stone-255'
          }`}
        >
          <Building className="w-4 h-4" />
          Cơ sở ({branches.length})
        </button>
      </div>

      {/* ACTION BAR (ADD FORM + SEARCH BAR) */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
        {/* Left: Add Form */}
        <div className="flex-1 w-full max-w-2xl">
          {subTab === 'rooms' && (
            <form onSubmit={handleAddRoom} className="flex flex-col sm:flex-row gap-2 w-full">
              <select
                value={newRoomBranch}
                onChange={e => setNewRoomBranch(e.target.value)}
                className="px-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20 outline-none w-full sm:w-48 shrink-0"
              >
                <option value="">-- Chọn cơ sở --</option>
                {branches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Tên phòng (VD: P.101)..."
                value={newRoom}
                onChange={e => setNewRoom(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20 outline-none min-w-0"
              />
              <button type="submit" className="px-4 bg-stone-900 dark:bg-amber-600 text-white rounded-xl flex items-center justify-center hover:opacity-90 shrink-0 font-bold text-xs gap-1.5 h-[40px]">
                <Plus className="w-4 h-4" /> Thêm phòng
              </button>
            </form>
          )}

          {subTab === 'branches' && (
            <form onSubmit={handleAddBranch} className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập tên cơ sở mới (VD: Ngô Quyền)..."
                value={newBranch}
                onChange={e => setNewBranch(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20 outline-none min-w-0"
              />
              <button type="submit" className="px-4 bg-stone-900 dark:bg-amber-600 text-white rounded-xl flex items-center justify-center hover:opacity-90 shrink-0 font-bold text-xs gap-1.5 h-[40px]">
                <Plus className="w-4 h-4" /> Thêm cơ sở
              </button>
            </form>
          )}

          {subTab === 'schedules' && (
            <form onSubmit={handleAddSchedule} className="flex flex-wrap sm:flex-nowrap items-center gap-4 bg-stone-50/50 dark:bg-white/2 p-2 px-3 rounded-xl border border-stone-200/50 dark:border-white/5 w-full">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-wider">Từ</span>
                <input
                  type="time"
                  value={newStart}
                  onChange={e => setNewStart(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20 outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-wider">Đến</span>
                <input
                  type="time"
                  value={newEnd}
                  onChange={e => setNewEnd(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20 outline-none"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-stone-900 dark:bg-amber-600 text-white rounded-xl flex items-center justify-center hover:opacity-90 font-bold text-xs gap-1.5 sm:ml-auto h-[38px] shrink-0">
                <Plus className="w-4 h-4" /> Thêm ca học
              </button>
            </form>
          )}
        </div>

        {/* Right: Search Bar */}
        <div className="relative w-full lg:w-64">
          <input
            type="text"
            placeholder="Tìm kiếm nhanh..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20 outline-none"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        </div>
      </div>

      {/* MODERN TABLE DATA VIEW */}
      <div className="overflow-x-auto rounded-[24px] border border-stone-200/50 dark:border-white/5 bg-white dark:bg-white/2 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-200/50 dark:border-white/5 bg-stone-50/50 dark:bg-white/5 text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              <th className="p-4 w-20 text-center">STT</th>
              {subTab === 'rooms' ? (
                <>
                  <th className="p-4">Cơ sở</th>
                  <th className="p-4">Phòng học</th>
                </>
              ) : (
                <th className="p-4">Tên tài nguyên</th>
              )}
              <th className="p-4 text-center">Số tiết học đang sử dụng</th>
              <th className="p-4 w-28 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-white/5 text-xs">
            {subTab === 'rooms' ? (
              filteredRooms.map((item, idx) => {
                const count = getActiveUsageCount(item.room, 'room');
                return (
                  <tr key={`${item.branch}-${item.room}`} className="hover:bg-stone-50/30 dark:hover:bg-white/2 transition-colors group">
                    <td className="p-4 text-center font-mono text-stone-400">{idx + 1}</td>
                    <td className="p-4 font-bold text-stone-850 dark:text-stone-200">{item.branch}</td>
                    <td className="p-4 font-medium text-stone-700 dark:text-stone-300">{item.room}</td>
                    <td className="p-4 text-center">
                      {count > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-wide">
                          Đang có {count} tiết học
                        </span>
                      ) : (
                        <span className="text-stone-400 dark:text-stone-500 italic text-[11px]">
                          Không sử dụng
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => promptDelete(item.room, 'room', item.branch)}
                        className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              filteredItems.map((item, idx) => {
                const count = getActiveUsageCount(item, subTab === 'schedules' ? 'schedule' : 'branch');
                return (
                  <tr key={item} className="hover:bg-stone-50/30 dark:hover:bg-white/2 transition-colors group">
                    <td className="p-4 text-center font-mono text-stone-400">{idx + 1}</td>
                    <td className="p-4 font-bold text-stone-850 dark:text-stone-200">
                      {item}
                    </td>
                    <td className="p-4 text-center">
                      {count > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-wide">
                          Đang có {count} tiết học
                        </span>
                      ) : (
                        <span className="text-stone-400 dark:text-stone-500 italic text-[11px]">
                          Không sử dụng
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => promptDelete(item, subTab === 'schedules' ? 'schedule' : 'branch')}
                        className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}

            {/* EMPTY STATE */}
            {((subTab === 'rooms' ? filteredRooms.length : filteredItems.length) === 0) && (
              <tr>
                <td colSpan={subTab === 'rooms' ? 5 : 4} className="p-12 text-center text-stone-400 italic">
                  Không tìm thấy tài nguyên nào trùng khớp
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* SAVE BUTTON */}
      <div className="flex justify-end pt-4 border-t border-stone-250/60 dark:border-white/5">
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="h-12 px-8 bg-stone-900 dark:bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:shadow-xl hover:shadow-amber-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Lưu tất cả tài nguyên
        </button>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-955 border border-stone-200/50 dark:border-white/10 rounded-[28px] p-6 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-stone-900 dark:text-white uppercase tracking-tight">Xác nhận xóa tài nguyên</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Bạn có chắc chắn muốn xóa <span className="font-bold text-stone-850 dark:text-stone-200">"{deleteItem}"</span>{deleteItemBranch && ` thuộc cơ sở "${deleteItemBranch}"`} khỏi danh sách không?
                </p>
              </div>
            </div>

            {/* Active Usage Warning */}
            {getActiveUsageCount(deleteItem, deleteItemType) > 0 && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[11px] text-red-600 dark:text-red-400 space-y-1">
                <div className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Cảnh báo quan trọng:
                </div>
                <div>
                  Tài nguyên này đang được sử dụng bởi{' '}
                  <span className="font-black underline">{getActiveUsageCount(deleteItem, deleteItemType)} tiết học</span>{' '}
                  trong hệ thống thời khóa biểu. Việc xóa có thể ảnh hưởng đến lịch học hiện tại.
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 bg-stone-100 dark:bg-white/5 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold hover:opacity-80 transition-opacity"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
