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
  protected override readonly tableName = 'timetable_slots';
  protected override readonly primaryKey = 'id';
  protected override readonly useSoftDelete = true;

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
                subject:subjects (id, name, code),
                teacher:profiles!timetable_slots_teacher_id_fkey (id, full_name, first_name, last_name),
                student:profiles!timetable_slots_student_id_fkey (id, full_name, first_name, last_name),
                class:classes (id, name)
            `
      )
      .order('day_of_week')
      .order('start_time')
      .limit(1000);

    if (filters.class_id) query = query.eq('class_id', filters.class_id);
    if (filters.student_id) {
      query = query.eq('student_id', filters.student_id);
    }
    if (filters.teacher_id) {
      query = query.eq('teacher_id', filters.teacher_id);
    }

    query = query.is('deleted_at', null);

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
      // Get Active Semester to scope conflicts
      const { data: activeSemester } = await this.supabase
        .from('semesters')
        .select('id')
        .eq('is_active', true)
        .maybeSingle();

      let query = this.supabase
        .from('timetable_slots')
        .select(
          `
          id, 
          start_time, 
          end_time, 
          class:classes(name),
          student:profiles!timetable_slots_student_id_fkey(full_name)
        `
        )
        .eq('room', room)
        .eq('day_of_week', day_of_week)
        .gt('end_time', start_time)
        .lt('start_time', end_time);

      if (activeSemester?.id) {
        query = query.or(`semester_id.eq.${activeSemester.id},semester_id.is.null`);
      }

      if (excludeSlotId) query = query.neq('id', excludeSlotId);

      const { data: roomConflicts } = await query;
      if (roomConflicts && roomConflicts.length > 0) {
        const first = roomConflicts[0] as any;
        const holder = first.class?.name || first.student?.full_name || 'Đối tượng khác';
        return `Phòng "${room}" đã có lịch của "${holder}" vào khung giờ này (Tiết: ${
          first?.start_time?.substring(0, 5) ?? ''
        }-${first?.end_time?.substring(0, 5) ?? ''}).`;
      }
    }

    // Teacher / Tutor Conflict
    if (teacher_id) {
      const { data: activeSemester } = await this.supabase
        .from('semesters')
        .select('id')
        .eq('is_active', true)
        .maybeSingle();

      let query = this.supabase
        .from('timetable_slots')
        .select(
          `
          id, 
          class_id,
          student_id,
          room, 
          start_time, 
          end_time,
          class:classes(name),
          student:profiles!timetable_slots_student_id_fkey(full_name)
        `
        )
        .eq('teacher_id', teacher_id)
        .eq('day_of_week', day_of_week)
        .gt('end_time', start_time)
        .lt('start_time', end_time);

      if (activeSemester?.id) {
        query = query.or(`semester_id.eq.${activeSemester.id},semester_id.is.null`);
      }

      if (excludeSlotId) query = query.neq('id', excludeSlotId);

      const { data: teacherConflicts } = await query;
      if (teacherConflicts && teacherConflicts.length > 0) {
        const isNewTutoring = !!data.student_id && (!room || room === 'Linh hoạt');

        if (isNewTutoring) {
          // Check if all existing conflicts are also tutoring sessions in the exact same time window
          const allSameTutoringWindow = teacherConflicts.every(
            (s: any) =>
              !!s.student_id &&
              !s.class_id &&
              s.start_time?.substring(0, 5) === start_time?.substring(0, 5) &&
              s.end_time?.substring(0, 5) === end_time?.substring(0, 5)
          );

          if (allSameTutoringWindow) {
            // Allow micro-group of up to 4 students per session
            if (teacherConflicts.length >= 4) {
              return `Gia sư đã nhận tối đa 4 học sinh trong ca kèm này.`;
            }
            // Valid micro-group (2-3 em) -> no teacher conflict
          } else {
            const first = teacherConflicts[0] as any;
            const holder = first.class?.name || first.student?.full_name || 'Tiết học khác';
            return `Gia sư đã có lịch "${holder}" vào khung giờ này (tại "${
              first?.room ?? ''
            }" - Tiết: ${first?.start_time?.substring(0, 5) ?? ''}-${
              first?.end_time?.substring(0, 5) ?? ''
            }).`;
          }
        } else {
          // Formal class conflict
          const first = teacherConflicts[0] as any;
          const holder = first.class?.name || first.student?.full_name || 'Tiết học khác';
          return `Giáo viên đã có lịch dạy "${holder}" vào khung giờ này (tại "${
            first?.room ?? ''
          }" - Tiết: ${first?.start_time?.substring(0, 5) ?? ''}-${
            first?.end_time?.substring(0, 5) ?? ''
          }).`;
        }
      }
    }

    // Student Conflict (Prevent student double-booking)
    if (data.student_id) {
      const { data: activeSemester } = await this.supabase
        .from('semesters')
        .select('id')
        .eq('is_active', true)
        .maybeSingle();

      let studentQuery = this.supabase
        .from('timetable_slots')
        .select('id, start_time, end_time, teacher:profiles!timetable_slots_teacher_id_fkey(full_name)')
        .eq('student_id', data.student_id)
        .eq('day_of_week', day_of_week)
        .gt('end_time', start_time)
        .lt('start_time', end_time);

      if (activeSemester?.id) {
        studentQuery = studentQuery.or(`semester_id.eq.${activeSemester.id},semester_id.is.null`);
      }
      if (excludeSlotId) studentQuery = studentQuery.neq('id', excludeSlotId);

      const { data: studentConflicts } = await studentQuery;
      if (studentConflicts && studentConflicts.length > 0) {
        const first = studentConflicts[0] as any;
        const teacherName = first.teacher?.full_name || 'Gia sư / Giáo viên khác';
        return `Học sinh này đã có lịch học kèm với "${teacherName}" vào khung giờ này (Tiết: ${
          first?.start_time?.substring(0, 5) ?? ''
        }-${first?.end_time?.substring(0, 5) ?? ''}).`;
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

    const insertPayload: Record<string, any> = {
      class_id: data.class_id || null,
      student_id: data.student_id || null,
      teacher_id: data.teacher_id || null,
      subject_id: data.subject_id || null,
      room: data.room || null,
      day_of_week: data.day_of_week,
      start_time: data.start_time,
      end_time: data.end_time,
      notes: data.notes || null,
      semester_id: activeSemester?.id || null,
    };

    const { data: slot, error } = await this.supabase
      .from('timetable_slots')
      .insert(insertPayload)
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
            subject:subjects (id, name, code),
            teacher:profiles!timetable_slots_teacher_id_fkey (id, full_name, first_name, last_name),
            student:profiles!timetable_slots_student_id_fkey (id, full_name, first_name, last_name),
            class:classes (id, name)
        `
      )
      .single();

    if (error) throw error;

    // Auto sync room and schedule to settings
    await this.syncRoomAndSchedule(slot);

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
        .in('status', ['enrolled']); // Include 'enrolled' status

      const classIds = enrollments?.map((e) => e.class_id) || [];
      classes = enrollments?.map((e: any) => e.classes).filter(Boolean) || [];

      // 2. Query Slots (Class OR Direct Student assignment)
      let query = this.supabase
        .from('timetable_slots')
        .select(
          `
                id, class_id, student_id, day_of_week, start_time, end_time, room, notes, semester_id,
                subject:subjects (id, name, code),
                teacher:profiles!timetable_slots_teacher_id_fkey (id, full_name, first_name, last_name),
                student:profiles!timetable_slots_student_id_fkey (id, full_name, first_name, last_name),
                class:classes (id, name)
            `
        )
        .order('day_of_week')
        .order('start_time')
        .limit(1000);

      // Personal schedule: filter by active semester BUT allow null semester_id
      // to catch unassigned or "eternal" slots
      if (activeSemester?.id) {
        query = query.or(`semester_id.eq.${activeSemester.id},semester_id.is.null`);
      }

      query = query.is('deleted_at', null);

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
                subject:subjects (id, name, code),
                teacher:profiles!timetable_slots_teacher_id_fkey (id, full_name, first_name, last_name),
                student:profiles!timetable_slots_student_id_fkey (id, full_name, first_name, last_name),
                class:classes (id, name)
            `
        )
        .eq('teacher_id', userId)
        .order('day_of_week')
        .order('start_time')
        .limit(1000);

      if (activeSemester?.id) {
        query = query.or(`semester_id.eq.${activeSemester.id},semester_id.is.null`);
      }

      query = query.is('deleted_at', null);

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

    const query = this.supabase
      .from('timetable_slots')
      .select(
        `
            id, class_id, student_id, day_of_week, start_time, end_time, room, notes, semester_id,
            subject:subjects (id, name, code),
            teacher:profiles!timetable_slots_teacher_id_fkey (id, full_name, first_name, last_name),
            student:profiles!timetable_slots_student_id_fkey (id, full_name, first_name, last_name),
            class:classes (id, name)
         `
      )
      .is('deleted_at', null);

    const { data, error } = await query
      .order('room')
      .order('day_of_week')
      .order('start_time')
      .limit(5000);

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

  /**
   * Update Slot and sync room/schedule to settings
   */
  override async update(id: string, input: UpdateTimetableSlotInput): Promise<TimetableSlot> {
    const cleanPayload: Record<string, any> = {};
    const allowedKeys: (keyof UpdateTimetableSlotInput)[] = [
      'class_id',
      'teacher_id',
      'student_id',
      'subject_id',
      'room',
      'day_of_week',
      'start_time',
      'end_time',
      'notes',
    ];
    for (const key of allowedKeys) {
      if (input[key] !== undefined) {
        cleanPayload[key] = input[key];
      }
    }

    const slot = await super.update(id, cleanPayload as any);
    await this.syncRoomAndSchedule(slot);
    return slot;
  }

  /**
   * Sync Room and Schedule to Settings
   */
  private async syncRoomAndSchedule(slot: any) {
    if (!slot) return;
    const { room, start_time, end_time } = slot;

    try {
      // 1. Sync Room and Branch/Campus
      if (room && typeof room === 'string' && room.trim() !== '' && room !== 'Linh hoạt') {
        const roomVal = room.trim();
        let branchName = '';
        let roomName = '';

        if (roomVal.includes(' - ')) {
          const parts = roomVal.split(' - ');
          branchName = parts[0]?.trim() || '';
          roomName = parts[1]?.trim() || '';
        } else if (roomVal.includes('-')) {
          const parts = roomVal.split('-');
          branchName = parts[0]?.trim() || '';
          roomName = parts[1]?.trim() || '';
        } else {
          roomName = roomVal;
        }

        // Sync Room Name
        if (roomName) {
          const { data: roomSetting } = await this.supabase
            .from('settings')
            .select('value_json')
            .eq('key', 'center_rooms')
            .maybeSingle();

          let roomsObj: Record<string, string[]> = {};
          if (roomSetting && roomSetting.value_json && typeof roomSetting.value_json === 'object' && !Array.isArray(roomSetting.value_json)) {
            roomsObj = roomSetting.value_json as Record<string, string[]>;
          } else if (roomSetting && Array.isArray(roomSetting.value_json)) {
            roomsObj = { "Cơ sở khác": roomSetting.value_json as string[] };
          }

          const targetBranch = branchName || "Cơ sở khác";
          if (!roomsObj[targetBranch]) {
            roomsObj[targetBranch] = [];
          }

          const roomExists = roomsObj[targetBranch].some(r => r.toLowerCase() === roomName.toLowerCase());
          if (!roomExists) {
            roomsObj[targetBranch].push(roomName);
            await this.supabase
              .from('settings')
              .upsert({
                key: 'center_rooms',
                value_json: roomsObj,
                category: 'resource',
                is_public: true,
                updated_at: new Date().toISOString()
              }, { onConflict: 'key' });
          }
        }

        // Sync Branch Name
        if (branchName) {
          const { data: branchSetting } = await this.supabase
            .from('settings')
            .select('value_json')
            .eq('key', 'center_branches')
            .maybeSingle();

          let branchesList: string[] = [];
          if (branchSetting && Array.isArray(branchSetting.value_json)) {
            branchesList = branchSetting.value_json as string[];
          }

          const branchExists = branchesList.some(b => b.toLowerCase() === branchName.toLowerCase());
          if (!branchExists) {
            branchesList.push(branchName);
            await this.supabase
              .from('settings')
              .upsert({
                key: 'center_branches',
                value_json: branchesList,
                category: 'resource',
                is_public: true,
                updated_at: new Date().toISOString()
              }, { onConflict: 'key' });
          }
        }
      }

      // 2. Sync Schedule / Shift (strictly as time range, e.g. "08:00 - 09:30")
      if (start_time && end_time && typeof start_time === 'string' && typeof end_time === 'string') {
        const start = start_time.substring(0, 5);
        const end = end_time.substring(0, 5);
        const timeStr = `${start} - ${end}`;

        const { data: scheduleSetting } = await this.supabase
          .from('settings')
          .select('value_json')
          .eq('key', 'center_schedules')
          .maybeSingle();

        let schedulesList: string[] = [];
        if (scheduleSetting && Array.isArray(scheduleSetting.value_json)) {
          schedulesList = scheduleSetting.value_json as string[];
        }

        const scheduleExists = schedulesList.some(s => s.includes(timeStr));
        if (!scheduleExists) {
          schedulesList.push(timeStr);
          await this.supabase
            .from('settings')
            .upsert({
              key: 'center_schedules',
              value_json: schedulesList,
              category: 'resource',
              is_public: true,
              updated_at: new Date().toISOString()
            }, { onConflict: 'key' });
        }
      }
    } catch (err) {
      console.error('Failed to sync room/schedule/branch to settings:', err);
    }
  }
}
