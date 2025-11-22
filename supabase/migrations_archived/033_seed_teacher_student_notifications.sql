-- 033: Seed teacher and student notifications for RLS-visible UI checks
-- Date: 2025-11-16

-- Teachers: simple informational notifications
INSERT INTO notifications (id, target_id, title, message, read, created_at)
SELECT gen_random_uuid(), au.id, 'Schedule Update', 'New assignments were posted to your classes.', false, NOW()
FROM auth.users au
WHERE au.email IN (
  'john.doe@bhedu.example.com',
  'emily.johnson@bhedu.example.com',
  'michael.brown@bhedu.example.com',
  'sarah.davis@bhedu.example.com'
)
ON CONFLICT DO NOTHING;

INSERT INTO notifications (id, target_id, title, message, read, created_at)
SELECT gen_random_uuid(), au.id, 'Attendance Reminder', 'Please review attendance for this week.', false, NOW() - INTERVAL '30 minutes'
FROM auth.users au
WHERE au.email IN (
  'john.doe@bhedu.example.com',
  'emily.johnson@bhedu.example.com',
  'michael.brown@bhedu.example.com',
  'sarah.davis@bhedu.example.com'
)
ON CONFLICT DO NOTHING;

-- Students: one notification per student
INSERT INTO notifications (id, target_id, title, message, read, created_at)
SELECT gen_random_uuid(), au.id, 'New Assignment', 'A new assignment has been posted. Check your dashboard.', false, NOW()
FROM auth.users au
WHERE au.email IN (
  'alice.anderson@student.bhedu.example.com',
  'bob.martinez@student.bhedu.example.com',
  'charlie.wilson@student.bhedu.example.com',
  'diana.lee@student.bhedu.example.com',
  'ethan.taylor@student.bhedu.example.com',
  'fiona.garcia@student.bhedu.example.com',
  'george.harris@student.bhedu.example.com',
  'hannah.clark@student.bhedu.example.com'
)
ON CONFLICT DO NOTHING;
