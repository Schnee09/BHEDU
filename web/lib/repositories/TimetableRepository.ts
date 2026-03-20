import { BaseRepository } from './base';
import { SupabaseClient } from '@supabase/supabase-js';
import { CreateTimetableSlotInput, UpdateTimetableSlotInput } from '@/lib/schemas';

export interface TimetableSlot {
  id: string;
  class_id?: string;
  student_id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string;
  notes?: string;
  // ... relations
}

export class TimetableRepository extends BaseRepository<
  TimetableSlot,
  CreateTimetableSlotInput,
  UpdateTimetableSlotInput
> {
  protected tableName = 'timetable_slots';
  protected primaryKey = 'id';

  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  /**
   * Get timetable slots with optional filters
   */
  async getSlots(filters: {
    class_id?: string | null;
    student_id?: string | null;
    teacher_id?: string | null;
    week_start_date?: string | null;
  }) {
    let query = this.supabase
      .from('timetable_slots')
      .select(
        `
                id,
                class_id,
                student_id,
                day_of_week,
                start_time,
                end_time,
                room,
                notes,
                subject:subjects!timetable_slots_subject_id_fkey (id, name, code),
                teacher:profiles!timetable_slots_teacher_id_fkey (id, full_name),
                student:profiles!timetable_slots_student_id_fkey (id, full_name),
                class:classes!timetable_slots_class_id_fkey (id, name)
            `
      )
      .order('day_of_week')
      .order('start_time');

    if (filters.class_id) query = query.eq('class_id', filters.class_id);
    if (filters.student_id) {
      query = query.eq('student_id', filters.student_id);
    }
    if (filters.teacher_id) {
      query = query.eq('teacher_id', filters.teacher_id);
    }

    const { data: slots, error } = await query;
    if (error) throw error;

    // Fetch weekly notes if week_start_date is provided and we have slots
    let weeklyNotesMap: Record<string, string> = {};
    if (filters.week_start_date && slots && slots.length > 0) {
      const slotIds = slots.map((s: any) => s.id);
      const { data: weeklyNotes } = await this.supabase
        .from('weekly_notes')
        .select('slot_id, notes')
        .in('slot_id', slotIds)
        .eq('week_start_date', filters.week_start_date);

      if (weeklyNotes) {
        weeklyNotesMap = weeklyNotes.reduce((acc: any, wn: any) => {
          acc[wn.slot_id] = wn.notes;
          return acc;
        }, {});
      }
    }

    // Transform
    return (slots || []).map((slot: any) => ({
      ...slot,
      weekly_note: weeklyNotesMap[slot.id] || null,
      has_weekly_note: !!weeklyNotesMap[slot.id],
    }));
  }

  /**
   * Check for conflicts
   */
  async checkConflicts(data: CreateTimetableSlotInput, excludeSlotId?: string) {
    const { day_of_week, start_time, end_time, room, teacher_id } = data;

    // Room Conflict
    if (room && room !== 'Linh hoạt') {
      let query = this.supabase
        .from('timetable_slots')
        .select('id, start_time, end_time')
        .eq('room', room)
        .eq('day_of_week', day_of_week)
        .gt('end_time', start_time) // Overlap logic: existing.end > new.start AND existing.start < new.end
        .lt('start_time', end_time); // Strictly less/greater to allow back-to-back classes

      if (excludeSlotId) query = query.neq('id', excludeSlotId);

      const { data: roomConflicts } = await query;
      if (roomConflicts && roomConflicts.length > 0) {
        const first = roomConflicts[0];
        return `Phòng "${room}" đã có lịch vào khung giờ này (Tiết: ${
          first?.start_time ?? ''
        }-${first?.end_time ?? ''}).`;
      }
    }

    // Teacher Conflict
    if (teacher_id) {
      let query = this.supabase
        .from('timetable_slots')
        .select('id, room, start_time, end_time')
        .eq('teacher_id', teacher_id)
        .eq('day_of_week', day_of_week)
        .gt('end_time', start_time)
        .lt('start_time', end_time);

      if (excludeSlotId) query = query.neq('id', excludeSlotId);

      const { data: teacherConflicts } = await query;
      if (teacherConflicts && teacherConflicts.length > 0) {
        const first = teacherConflicts[0];
        return `Giáo viên đã có lịch dạy vào khung giờ này (tại "${
          first?.room ?? ''
        }" - Tiết: ${first?.start_time ?? ''}-${first?.end_time ?? ''}).`;
      }
    }

    return null; // No conflict
  }

  /**
   * Create Slot
   */
  async createSlot(data: CreateTimetableSlotInput) {
    // Get Active Semester
    const { data: activeSemester } = await this.supabase
      .from('semesters')
      .select('id')
      .eq('is_active', true)
      .maybeSingle();

    const { data: slot, error } = await this.supabase
      .from('timetable_slots')
      .insert({
        ...data,
        semester_id: activeSemester?.id || null,
      })
      .select(
        `
            id,
            class_id,
            student_id,
            day_of_week,
            start_time,
            end_time,
            room,
            notes,
            subject:subjects!timetable_slots_subject_id_fkey (id, name, code),
            teacher:profiles!timetable_slots_teacher_id_fkey (id, full_name),
            student:profiles!timetable_slots_student_id_fkey (id, full_name),
            class:classes!timetable_slots_class_id_fkey (id, name)
        `
      )
      .single();

    if (error) throw error;
    return slot;
  }

  /**
   * Get slots for a specific user based on role
   */
  async getMySlots(userId: string, role: string, weekStartDate?: string) {
    let slots = [];
    let classes: any[] = [];

    // Get active semester for filtering
    const { data: activeSemester } = await this.supabase
      .from('semesters')
      .select('id')
      .eq('is_active', true)
      .maybeSingle();

    if (role === 'student') {
      // 1. Get Enrolled/Active Classes
      const { data: enrollments } = await this.supabase
        .from('enrollments')
        .select('class_id, classes(id, name)')
        .eq('student_id', userId)
        .in('status', ['enrolled', 'active']); // Include 'active' status

      const classIds = enrollments?.map((e) => e.class_id) || [];
      classes = enrollments?.map((e: any) => e.classes).filter(Boolean) || [];

      // 2. Query Slots (Class OR Direct Student assignment)
      let query = this.supabase
        .from('timetable_slots')
        .select(
          `
                id, class_id, student_id, day_of_week, start_time, end_time, room, notes, semester_id,
                subject:subjects!timetable_slots_subject_id_fkey (id, name, code),
                teacher:profiles!timetable_slots_teacher_id_fkey (id, full_name),
                student:profiles!timetable_slots_student_id_fkey (id, full_name),
                class:classes!timetable_slots_class_id_fkey (id, name)
            `
        )
        .order('day_of_week')
        .order('start_time');

      // Personal schedule: filter by active semester BUT allow null semester_id
      // to catch unassigned or "eternal" slots
      if (activeSemester?.id) {
        query = query.or(`semester_id.eq.${activeSemester.id},semester_id.is.null`);
      }

      if (classIds.length > 0) {
        query = query.or(`class_id.in.(${classIds.join(',')}),student_id.eq.${userId}`);
      } else {
        query = query.eq('student_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      slots = data || [];
    } else {
      // Teacher/Staff/Admin -> Get assigned slots
      let query = this.supabase
        .from('timetable_slots')
        .select(
          `
                id, class_id, student_id, day_of_week, start_time, end_time, room, notes, semester_id,
                subject:subjects!timetable_slots_subject_id_fkey (id, name, code),
                teacher:profiles!timetable_slots_teacher_id_fkey (id, full_name),
                student:profiles!timetable_slots_student_id_fkey (id, full_name),
                class:classes!timetable_slots_class_id_fkey (id, name)
            `
        )
        .eq('teacher_id', userId)
        .order('day_of_week')
        .order('start_time');

      if (activeSemester?.id) {
        query = query.or(`semester_id.eq.${activeSemester.id},semester_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      slots = data || [];

      const classMap = new Map();
      slots.forEach((s: any) => {
        if (s.class && !classMap.has(s.class.id)) {
          classMap.set(s.class.id, s.class);
        }
      });
      classes = Array.from(classMap.values());
    }

    // Fetch Weekly Notes
    if (weekStartDate && slots.length > 0) {
      const slotIds = slots.map((s: any) => s.id);
      const { data: weeklyNotes } = await this.supabase
        .from('weekly_notes')
        .select('slot_id, notes')
        .in('slot_id', slotIds)
        .eq('week_start_date', weekStartDate);

      if (weeklyNotes) {
        const map = weeklyNotes.reduce((acc: any, wn: any) => {
          acc[wn.slot_id] = wn.notes;
          return acc;
        }, {});

        slots = slots.map((s: any) => ({
          ...s,
          weekly_note: map[s.id] || null,
          has_weekly_note: !!map[s.id],
        }));
      }
    } else {
      slots = slots.map((s: any) => ({
        ...s,
        weekly_note: null,
        has_weekly_note: false,
      }));
    }

    return { slots, classes };
  }

  /**
   * Get ALL slots (for room view/admin)
   */
  async getAllSlots(weekStartDate?: string) {
    // Get active semester
    const { data: activeSemester } = await this.supabase
      .from('semesters')
      .select('id')
      .eq('is_active', true)
      .maybeSingle();

    let query = this.supabase.from('timetable_slots').select(`
            id, class_id, student_id, day_of_week, start_time, end_time, room, notes, semester_id,
            subject:subjects!timetable_slots_subject_id_fkey (id, name, code),
            teacher:profiles!timetable_slots_teacher_id_fkey (id, full_name),
            student:profiles!timetable_slots_student_id_fkey (id, full_name),
            class:classes!timetable_slots_class_id_fkey (id, name)
         `);

    if (activeSemester?.id) {
      query = query.eq('semester_id', activeSemester.id);
    }

    const { data, error } = await query.order('room').order('day_of_week').order('start_time');

    if (error) throw error;
    let slots = data || [];

    // Fetch Weekly Notes
    if (weekStartDate && slots.length > 0) {
      const slotIds = slots.map((s: any) => s.id);
      const { data: weeklyNotes } = await this.supabase
        .from('weekly_notes')
        .select('slot_id, notes')
        .in('slot_id', slotIds)
        .eq('week_start_date', weekStartDate);

      if (weeklyNotes) {
        const map = weeklyNotes.reduce((acc: any, wn: any) => {
          acc[wn.slot_id] = wn.notes;
          return acc;
        }, {});

        slots = slots.map((s: any) => ({
          ...s,
          weekly_note: map[s.id] || null,
          has_weekly_note: !!map[s.id],
        }));
      }
    } else {
      slots = slots.map((s: any) => ({
        ...s,
        weekly_note: null,
        has_weekly_note: false,
      }));
    }

    return slots;
  }

  /**
   * Get single weekly note
   */
  async getWeeklyNote(slotId: string, weekStartDate: string) {
    const { data, error } = await this.supabase
      .from('weekly_notes')
      .select('*')
      .eq('slot_id', slotId)
      .eq('week_start_date', weekStartDate)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Save (Upsert) weekly note
   */
  async saveWeeklyNote(slotId: string, weekStartDate: string, notes: string) {
    // Validation handled by caller or DB constraint
    const { data, error } = await this.supabase
      .from('weekly_notes')
      .upsert(
        {
          slot_id: slotId,
          week_start_date: weekStartDate,
          notes,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'slot_id,week_start_date',
        }
      )
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Delete weekly note
   */
  async deleteWeeklyNote(slotId: string, weekStartDate: string) {
    const { error } = await this.supabase
      .from('weekly_notes')
      .delete()
      .eq('slot_id', slotId)
      .eq('week_start_date', weekStartDate);

    if (error) throw error;
  }
}
