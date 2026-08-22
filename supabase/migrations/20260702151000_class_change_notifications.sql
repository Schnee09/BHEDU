-- Migration: Automated Classroom Change Notifications
-- Created: 2026-07-02
-- Purpose: Automatically notify students and parents when class timetables (day, time, room) change

CREATE OR REPLACE FUNCTION public.on_timetable_change_notify()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id UUID;
  v_parent_id UUID;
  v_class_name TEXT;
  v_subject_name TEXT;
  v_message TEXT;
  v_day_name TEXT;
BEGIN
  -- Get class name and subject name
  SELECT name INTO v_class_name FROM public.classes WHERE id = NEW.class_id;
  SELECT name INTO v_subject_name FROM public.subjects WHERE id = NEW.subject_id;
  
  v_day_name := CASE NEW.day_of_week
    WHEN 0 THEN 'Thứ Hai' WHEN 1 THEN 'Thứ Ba' WHEN 2 THEN 'Thứ Tư'
    WHEN 3 THEN 'Thứ Năm' WHEN 4 THEN 'Thứ Sáu' WHEN 5 THEN 'Thứ Bảy' WHEN 6 THEN 'Chủ Nhật'
    ELSE 'chưa xác định'
  END;

  v_message := 'Lớp ' || COALESCE(v_class_name, 'chưa rõ') || ' (môn ' || COALESCE(v_subject_name, 'chưa rõ') || ') đã cập nhật lịch học mới vào ' 
               || v_day_name || ' từ ' || TO_CHAR(NEW.start_time, 'HH24:MI') || ' đến ' 
               || TO_CHAR(NEW.end_time, 'HH24:MI') || ' tại phòng ' || COALESCE(NEW.room, 'chưa xếp');

  -- Loop through all enrolled students in the class
  FOR v_student_id IN
    SELECT student_id FROM public.enrollments WHERE class_id = NEW.class_id AND status = 'enrolled'
  LOOP
    -- 1. Notify Student
    PERFORM public.create_system_notification(
      v_student_id,
      'Thay đổi lịch học lớp ' || v_class_name,
      v_message,
      'warning',
      'class',
      '/dashboard/student/classes'
    );

    -- 2. Notify Parents
    FOR v_parent_id IN
      SELECT parent_id FROM public.parent_student_links 
      WHERE student_id = v_student_id AND status = 'approved'
    LOOP
      PERFORM public.create_system_notification(
        v_parent_id,
        'Cập nhật lịch học của con',
        v_message,
        'warning',
        'class',
        '/dashboard/students/' || v_student_id
      );
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_timetable_change ON public.timetable_slots;

-- Create trigger on timetable_slots update
CREATE TRIGGER trigger_timetable_change
  AFTER UPDATE OF day_of_week, start_time, end_time, room ON public.timetable_slots
  FOR EACH ROW
  WHEN (
    OLD.day_of_week IS DISTINCT FROM NEW.day_of_week OR
    OLD.start_time IS DISTINCT FROM NEW.start_time OR
    OLD.end_time IS DISTINCT FROM NEW.end_time OR
    OLD.room IS DISTINCT FROM NEW.room
  )
  EXECUTE FUNCTION public.on_timetable_change_notify();
