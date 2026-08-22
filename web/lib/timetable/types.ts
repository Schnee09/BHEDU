export interface TimetableSlot {
  id: string;
  class_id: string;
  student_id?: string;
  teacher_id?: string;
  subject: { id: string; name: string; code: string } | null;
  teacher: { id: string; full_name: string; phone?: string } | null;
  student?: { id: string; full_name: string } | null;
  class?: { id: string; name: string } | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  notes: string | null; // Default notes
  weekly_note?: string | null; // Week-specific notes
  has_weekly_note?: boolean; // Flag for visual indicator
  status?: 'scheduled' | 'completed' | 'cancelled' | 'makeup';
}

export interface ClassOption {
  id: string;
  name: string;
  subject_id?: string;
  course?: {
    id: string;
    name: string;
    code: string;
  };
  teacher_id?: string;
  teacher?: {
    full_name: string;
    teacher_subjects?: Array<{
      subject_id: string;
      is_primary: boolean;
      subjects: {
        id: string;
        name: string;
        code: string;
      };
    }>;
  };
}

export interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

export interface TeacherOption {
  id: string;
  full_name: string;
  phone?: string;
  role?: string;
}

export interface StudentOption {
  id: string;
  full_name: string;
}
