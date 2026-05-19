'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { AnnouncementForm } from '@/app/dashboard/admin/announcements/_components/AnnouncementForm';
import { LoadingState, EmptyState } from '@/components/ui';
import { AlertCircle } from 'lucide-react';

export default function EditAnnouncementPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const response = await apiFetch(`/api/admin/announcements`);
        if (response.ok) {
          const result = await response.json();
          const announcement = result.data.find((a: any) => a.id === params.id);
          if (announcement) {
            setData(announcement);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAnnouncement();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Đang tải dữ liệu bản tin..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <EmptyState
          icon={<AlertCircle className="w-12 h-12 text-error" />}
          title="Không tìm thấy bản tin"
          description="Bản tin này có thể đã bị xóa hoặc không tồn tại."
        />
      </div>
    );
  }

  return <AnnouncementForm initialData={data} />;
}
