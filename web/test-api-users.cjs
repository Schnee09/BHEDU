const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    // Test 1: Raw count
    const { count: totalCount } = await supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true });
    console.log('Total profiles in DB (service role):', totalCount);

    // Test 2: Simulating the API query exactly
    const { data, count, error } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, 19); // limit 20

    console.log('Query returned:', data?.length, 'rows, total count:', count);
    if (error) console.log('Error:', error);

    // Test 3: Test with limit 50
    const { data: data2, count: count2 } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, 49);

    console.log('With limit 50:', data2?.length, 'rows, total:', count2);

    // Test 4: Check what the Anon key sees (RLS applied)
    const supabaseAnon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data: { session } } = await supabaseAnon.auth.signInWithPassword({ email: 'admin@bhedu.vn', password: 'test123' });

    const supabaseUser = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${session.access_token}` } }
    });

    const { data: userData, count: userCount } = await supabaseUser
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, 49);

    console.log('As authenticated user (RLS):', userData?.length, 'rows, total:', userCount);
}

test().catch(console.error);
