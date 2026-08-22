-- Migration: Timetable Conflict Validation
-- Created: 2026-07-02
-- Purpose: Provide DB-level validation for classroom timetable clashes

CREATE OR REPLACE FUNCTION public.check_timetable_conflict(
  p_teacher_id UUID,
  p_room TEXT,
  p_day_of_week INT,
  p_start_time TIME,
  p_end_time TIME,
  p_exclude_slot_id UUID DEFAULT NULL
)
RETURNS TABLE (
  has_conflict BOOLEAN,
  conflict_reason TEXT
) AS $$
DECLARE
  v_conflict_class TEXT;
BEGIN
  -- 1. Check room double-booking
  IF p_room IS NOT NULL AND p_room <> '' THEN
    SELECT c.name INTO v_conflict_class
    FROM public.timetable_slots ts
    JOIN public.classes c ON ts.class_id = c.id
    WHERE ts.day_of_week = p_day_of_week
      AND ts.room = p_room
      AND (p_exclude_slot_id IS NULL OR ts.id <> p_exclude_slot_id)
      AND (
        (p_start_time, p_end_time) OVERLAPS (ts.start_time, ts.end_time)
      )
    LIMIT 1;

    IF v_conflict_class IS NOT NULL THEN
      RETURN QUERY SELECT TRUE, 'Phòng ' || p_room || ' đã bị trùng lịch với lớp ' || v_conflict_class;
      RETURN;
    END IF;
  END IF;

  -- 2. Check teacher double-booking
  IF p_teacher_id IS NOT NULL THEN
    SELECT c.name INTO v_conflict_class
    FROM public.timetable_slots ts
    JOIN public.classes c ON ts.class_id = c.id
    WHERE ts.day_of_week = p_day_of_week
      AND ts.teacher_id = p_teacher_id
      AND (p_exclude_slot_id IS NULL OR ts.id <> p_exclude_slot_id)
      AND (
        (p_start_time, p_end_time) OVERLAPS (ts.start_time, ts.end_time)
      )
    LIMIT 1;

    IF v_conflict_class IS NOT NULL THEN
      RETURN QUERY SELECT TRUE, 'Giáo viên đã có lịch dạy tại lớp ' || v_conflict_class;
      RETURN;
    END IF;
  END IF;

  RETURN QUERY SELECT FALSE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
