'use client';

import React from 'react';
import UserFormModal from '@/components/users/UserFormModal';

export interface Student {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  date_of_birth: string | null;
  phone: string | null;
  address: string | null;
  student_code?: string;
  student_id?: string;
  grade_level?: string;
  status?: string;
  gender?: string;
  created_at?: string;
}

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
  onSuccess: () => void;
}

/**
 * Unified StudentFormModal: Routes to the unified UserFormModal with role preselected as 'student'
 */
export default function StudentFormModal({
  isOpen,
  onClose,
  student,
  onSuccess,
}: StudentFormModalProps) {
  return (
    <UserFormModal
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
      initialRole="student"
      user={student}
    />
  );
}
