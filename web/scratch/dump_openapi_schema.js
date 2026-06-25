const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  console.log('Fetching OpenAPI spec...');
  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        "apikey": supabaseServiceKey,
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
    });
    const spec = await resp.json();
    fs.writeFileSync('scratch_openapi_spec.json', JSON.stringify(spec, null, 2));
    console.log('OpenAPI spec saved to scratch_openapi_spec.json');

    const definitions = spec.definitions || {};
    const tablesInfo = {};

    for (const [tableName, definition] of Object.entries(definitions)) {
      tablesInfo[tableName] = {
        description: definition.description || '',
        columns: {}
      };
      
      const properties = definition.properties || {};
      for (const [colName, colProp] of Object.entries(properties)) {
        tablesInfo[tableName].columns[colName] = {
          type: colProp.type || 'unknown',
          format: colProp.format || '',
          description: colProp.description || '',
          isNullable: colProp.description?.includes('nullable') || false
        };
      }
    }

    fs.writeFileSync('live_schema_meta.json', JSON.stringify(tablesInfo, null, 2));
    console.log('Processed metadata saved to live_schema_meta.json');
    console.log('Number of tables processed:', Object.keys(tablesInfo).length);
  } catch (e) {
    console.error('Error:', e);
  }
}

run();
