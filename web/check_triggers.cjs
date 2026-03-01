const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTriggers() {
    const { data, error } = await supabase.rpc('execute_sql', {
        sql: `
            SELECT t.tgname, p.proname, p.prosrc
            FROM pg_trigger t
            JOIN pg_proc p ON t.tgfoid = p.oid
            JOIN pg_class c ON t.tgrelid = c.oid
            WHERE c.relname = 'profiles';
        `
    });
    if (error) {
        console.error('Error:', error);
    } else {
        console.dir(data, { depth: null });
    }
}
checkTriggers();
