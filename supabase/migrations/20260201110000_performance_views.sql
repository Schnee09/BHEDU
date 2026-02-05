-- Migration: Performance Views
-- Created: 2026-02-01
-- Purpose: Materialized views for reporting performance (Metrics & Dashboard)

-- 1. Student Performance Summary
-- Aggregates academic performance per student per class
CREATE MATERIALIZED VIEW IF NOT EXISTS student_performance_summary AS
SELECT
    p.id AS student_id,
    p.full_name,
    p.student_code,
    e.class_id,
    c.name AS class_name,
    COUNT(DISTINCT g.subject_id) AS subjects_count,
    ROUND(AVG(g.score)::numeric, 2) AS average_score
FROM
    profiles p
    JOIN enrollments e ON p.id = e.student_id
    JOIN classes c ON e.class_id = c.id
    LEFT JOIN grades g ON p.id = g.student_id
WHERE
    p.role = 'student' AND e.status = 'active'
GROUP BY
    p.id, p.full_name, p.student_code, e.class_id, c.name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_student_perf_unique ON student_performance_summary(student_id, class_id);
CREATE INDEX IF NOT EXISTS idx_mv_student_perf_class_id ON student_performance_summary(class_id);


-- 2. Class Statistics
-- Aggregates enrollment and attendance for class dashboards
CREATE MATERIALIZED VIEW IF NOT EXISTS class_statistics AS
SELECT
    c.id AS class_id,
    c.name AS class_name,
    COUNT(DISTINCT e.student_id) AS total_students,
    COUNT(DISTINCT a.id) AS total_attendance_records,
    COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END) AS present_count,
    ROUND(
        (COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END)::numeric / 
        NULLIF(COUNT(DISTINCT a.id), 0)::numeric) * 100, 
    2) AS attendance_rate
FROM
    classes c
    LEFT JOIN enrollments e ON c.id = e.class_id AND e.status = 'active'
    LEFT JOIN attendance a ON c.id = a.class_id
GROUP BY
    c.id, c.name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_class_stats_unique ON class_statistics(class_id);


-- 3. Teacher Workload
-- Aggregates teaching load for admin insights
CREATE MATERIALIZED VIEW IF NOT EXISTS teacher_workload AS
SELECT
    p.id AS teacher_id,
    p.full_name,
    COUNT(DISTINCT c.id) AS classes_assigned,
    COUNT(DISTINCT ts.id) AS total_slots,
    COALESCE(SUM( EXTRACT(EPOCH FROM (ts.end_time::time - ts.start_time::time))/3600 ), 0) AS total_hours_per_week
FROM
    profiles p
    LEFT JOIN classes c ON p.id = c.teacher_id
    LEFT JOIN timetable_slots ts ON p.id = ts.teacher_id
WHERE
    p.role IN ('teacher', 'staff', 'admin', 'owner', 'super_admin') 
GROUP BY
    p.id, p.full_name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_teacher_workload_unique ON teacher_workload(teacher_id);


-- Refresh Function
CREATE OR REPLACE FUNCTION refresh_performance_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY student_performance_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY class_statistics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY teacher_workload;
EXCEPTION WHEN OTHERS THEN
    -- Fallback for non-concurrent if unique index is missing or initial run issues
    REFRESH MATERIALIZED VIEW student_performance_summary;
    REFRESH MATERIALIZED VIEW class_statistics;
    REFRESH MATERIALIZED VIEW teacher_workload;
END;
$$ LANGUAGE plpgsql;
