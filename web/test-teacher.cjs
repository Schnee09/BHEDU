const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)/);
    if (match) env[match[1]] = match[2];
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTeacher() {
    const { data: teacher, error } = await supabase
        .from('profiles')
        .select(`
            id, full_name, role,
            teacher_subjects(subject_id, is_primary, subjects(name))
        `)
        .ilike('full_name', '%Bảo%')
        .eq('role', 'teacher');

    console.log("Error:", error);
    console.log("Teacher:", JSON.stringify(teacher, null, 2));
}

checkTeacher();
