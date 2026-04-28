const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

async function introspect() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
            method: 'GET',
            headers: {
                'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                'Accept': 'application/openapi+json'
            }
        });
        const openapi = await res.json();
        fs.writeFileSync('openapi-profiles.json', JSON.stringify(openapi.definitions.profiles, null, 2));
        console.log('Saved OpenAPI definition to openapi-profiles.json');
    } catch (e) { console.error(e); }
}

introspect().catch(console.error);
