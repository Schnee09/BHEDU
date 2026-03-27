/**
 * Apply the get_class_averages fix directly to the database.
 * Run: node scripts/apply-class-averages-fix.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sql = `
CREATE OR REPLACE FUNCTION get_class_averages()
RETURNS TABLE (
    class_id UUID,
    class_name TEXT,
    teacher_name TEXT,
    student_count BIGINT,
    average_gpa NUMERIC,
    attendance_rate NUMERIC,
    pass_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH class_stats AS (
        SELECT 
            c.id AS c_id,
            c.name AS c_name,
            COALESCE(t.full_name, 'Chưa phân công') AS t_name,
            COUNT(DISTINCT e.student_id) AS s_count,
            COALESCE(AVG(g.score), 0) AS avg_gpa,
            COALESCE(
                SUM(CASE WHEN g.score >= 5.0 THEN 1 ELSE 0 END)::numeric / 
                NULLIF(COUNT(g.score), 0) * 100, 
            0) AS p_rate,
            COALESCE(
                SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)::numeric / 
                NULLIF(COUNT(a.id), 0) * 100, 
            0) AS att_rate
        FROM classes c
        LEFT JOIN profiles t ON t.id = c.teacher_id
        LEFT JOIN enrollments e ON e.class_id = c.id
        LEFT JOIN grades g ON g.student_id = e.student_id AND g.class_id = c.id
        LEFT JOIN attendance a ON a.student_id = e.student_id AND a.class_id = c.id
        GROUP BY c.id, c.name, t.full_name
    )
    SELECT 
        c_id,
        c_name,
        t_name,
        s_count,
        ROUND(avg_gpa::numeric, 2),
        ROUND(att_rate::numeric, 1),
        ROUND(p_rate::numeric, 1)
    FROM class_stats
    ORDER BY avg_gpa DESC;
END;
$$;
`;

async function apply() {
    console.log('Applying get_class_averages fix...');

    console.log('NOTE: Automatically running SQL via Supabase REST API is restricted.');
    console.log('To apply the SQL function above, you must use the Supabase SQL Editor manually.');
    console.log('File: supabase/migrations/20260303114651_global_optimization_dashboards.sql');
    console.log('');
    console.log('Or use the CLI: npx supabase db push');

    // Test the RPC
    console.log('\n--- Testing get_class_averages ---');
    const { data: classes, error } = await supabase.rpc('get_class_averages');
    if (error) {
        console.error('RPC Error:', error.message);
        return;
    }
    console.log(`Returned ${classes?.length} classes:`);
    classes?.forEach(c => {
        console.log(`  ${c.class_name} | Teacher: ${c.teacher_name} | Students: ${c.student_count} | GPA: ${c.average_gpa} | Attendance: ${c.attendance_rate}% | Pass: ${c.pass_rate}%`);
    });
}

apply().catch(console.error);
