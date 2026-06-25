// Using native fetch in Node.js
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  console.log('Fetching OpenAPI spec from:', `${supabaseUrl}/rest/v1/`);
  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        "apikey": supabaseServiceKey,
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
    });
    const spec = await resp.json();
    console.log('Paths found:');
    const rpcPaths = Object.keys(spec.paths || {}).filter(p => p.startsWith('/rpc/'));
    console.log(rpcPaths);
  } catch (e) {
    console.error('Error fetching spec:', e);
  }
}

run();
