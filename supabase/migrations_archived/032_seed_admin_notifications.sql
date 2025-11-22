-- 032: Seed a few admin-visible notifications for verification
-- Date: 2025-11-16

-- Insert a handful of notifications targeted at the bhedu admin so they are visible under RLS
INSERT INTO notifications (id, target_id, title, message, read, created_at)
SELECT gen_random_uuid(), au.id, 'Welcome to BH-EDU', 'Your environment is seeded and ready to explore.', false, NOW()
FROM auth.users au WHERE au.email = 'admin@bhedu.example.com'
ON CONFLICT DO NOTHING;

INSERT INTO notifications (id, target_id, title, message, read, created_at)
SELECT gen_random_uuid(), au.id, 'Classes Seeded', 'Five example classes were created for Fall.', false, NOW() - INTERVAL '1 hour'
FROM auth.users au WHERE au.email = 'admin@bhedu.example.com'
ON CONFLICT DO NOTHING;

INSERT INTO notifications (id, target_id, title, message, read, created_at)
SELECT gen_random_uuid(), au.id, 'Finance Setup', 'Initial fee types, schedules, and invoices were seeded.', false, NOW() - INTERVAL '2 hours'
FROM auth.users au WHERE au.email = 'admin@bhedu.example.com'
ON CONFLICT DO NOTHING;
