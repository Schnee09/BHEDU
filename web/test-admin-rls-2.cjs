const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabaseAnon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testAdminUpdate() {
    const testEmail = 'test_admin_rls@example.com';
    const testPassword = 'password123';

    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    let uid = users.find(u => u.email === testEmail)?.id;

    const { data: { session }, error: loginErr } = await supabaseAnon.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
    });

    if (loginErr) return;

    const supabaseUser = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${session.access_token}` } }
    });

    console.log('Test 1: Updating ONLY full_name');
    let result1 = await supabaseUser.from('profiles').update({
        full_name: 'Quản Trị Viên Mới'
    }).eq('id', uid).select();

    console.log('Result 1 full_name:', result1.data?.[0]?.full_name);
    console.log('Result 1 first_name:', result1.data?.[0]?.first_name);
    console.log('Result 1 last_name:', result1.data?.[0]?.last_name);

    console.log('\nTest 2: Updating first, last, AND full_name');
    let result2 = await supabaseUser.from('profiles').update({
        full_name: 'Quản Trị Viên Mới',
        first_name: 'Viên',
        last_name: 'Quản Trị'
    }).eq('id', uid).select();

    console.log('Result 2 full_name:', result2.data?.[0]?.full_name);
    console.log('Result 2 first_name:', result2.data?.[0]?.first_name);
    console.log('Result 2 last_name:', result2.data?.[0]?.last_name);

    fs.writeFileSync('test-out-2.txt', JSON.stringify({ r1: result1.data, r2: result2.data }, null, 2));
}

testAdminUpdate().catch(console.error);
