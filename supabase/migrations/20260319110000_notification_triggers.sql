
-- Migration: Automated Notification Triggers
-- Created: 2026-03-19
-- Purpose: Automatically generate notifications for key events:
-- 1. New/Updated Grades
-- 2. Absent Attendance
-- 3. Parent-Student Link Approval

-- ============================================
-- 1. NOTIFICATION HELPER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.create_system_notification(
  target_user_id uuid,
  title text,
  message text,
  type text DEFAULT 'info',
  category text DEFAULT 'general',
  link text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  -- We need the auth.users id. 
  -- In this system, if target_user_id is a profile_id, we must find the auth_id.
  auth_id uuid;
BEGIN
  SELECT user_id INTO auth_id FROM public.profiles WHERE id = target_user_id;
  
  IF auth_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, category, link)
    VALUES (auth_id, title, message, type, category, link);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 2. GRADE NOTIFICATION TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.on_grade_change()
RETURNS TRIGGER AS $$
DECLARE
  student_name text;
  subject_name text;
  parent_rec record;
BEGIN
  -- Get metadata
  SELECT full_name INTO student_name FROM profiles WHERE id = NEW.student_id;
  SELECT name INTO subject_name FROM subjects WHERE id = NEW.subject_id;

  -- 1. Notify Student
  PERFORM public.create_system_notification(
    NEW.student_id,
    'Điểm mới: ' || subject_name,
    'Bạn đã có điểm mới cho môn ' || subject_name || ' (' || NEW.component_type || '): ' || NEW.score,
    'success',
    'academic',
    '/dashboard/student/grades'
  );

  -- 2. Notify Parents
  FOR parent_rec IN 
    SELECT parent_id FROM parent_student_links 
    WHERE student_id = NEW.student_id AND status = 'approved' AND can_view_grades = true
  LOOP
    PERFORM public.create_system_notification(
      parent_rec.parent_id,
      'Điểm mới của ' || student_name,
      student_name || ' đã có điểm mới cho môn ' || subject_name || ' (' || NEW.component_type || '): ' || NEW.score,
      'info',
      'academic',
      '/dashboard/students/' || NEW.student_id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_on_grade_change ON public.grades;
CREATE TRIGGER trigger_on_grade_change
  AFTER INSERT OR UPDATE OF score ON public.grades
  FOR EACH ROW
  EXECUTE FUNCTION public.on_grade_change();

-- ============================================
-- 3. ATTENDANCE NOTIFICATION TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.on_attendance_absent()
RETURNS TRIGGER AS $$
DECLARE
  student_name text;
  class_name text;
  parent_rec record;
BEGIN
  -- Only trigger if status is 'absent'
  IF NEW.status = 'absent' THEN
    -- Get metadata
    SELECT full_name INTO student_name FROM profiles WHERE id = NEW.student_id;
    SELECT name INTO class_name FROM classes WHERE id = NEW.class_id;

    -- 1. Notify Parents (High Priority)
    FOR parent_rec IN 
      SELECT parent_id FROM parent_student_links 
      WHERE student_id = NEW.student_id AND status = 'approved' AND can_view_attendance = true
    LOOP
      PERFORM public.create_system_notification(
        parent_rec.parent_id,
        'Cảnh báo nghỉ học: ' || student_name,
        student_name || ' được đánh dấu vắng mặt tại lớp ' || class_name || ' ngày ' || NEW.date,
        'warning',
        'attendance',
        '/dashboard/students/' || NEW.student_id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_on_attendance_absent ON public.attendance;
CREATE TRIGGER trigger_on_attendance_absent
  AFTER INSERT OR UPDATE OF status ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.on_attendance_absent();

-- ============================================
-- 4. PARENT LINK APPROVAL TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.on_parent_link_approval()
RETURNS TRIGGER AS $$
DECLARE
  student_name text;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    SELECT full_name INTO student_name FROM profiles WHERE id = NEW.student_id;

    PERFORM public.create_system_notification(
      NEW.parent_id,
      'Liên kết thành công',
      'Tài khoản của bạn đã được kết nối với học sinh ' || student_name,
      'success',
      'system',
      '/dashboard/parent'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_on_parent_link_approval ON public.parent_student_links;
CREATE TRIGGER trigger_on_parent_link_approval
  AFTER UPDATE OF status ON public.parent_student_links
  FOR EACH ROW
  EXECUTE FUNCTION public.on_parent_link_approval();

SELECT 'Notification triggers established' as status;
