const fetch = require('node-fetch'); // fallback if native fetch isn't fully supported in old node, but node 18+ has it. Let's just use dynamic import or native fetch.
async function test() {
  const endpoints = [
    'http://localhost:3000/api/health',
    'http://localhost:3000/api/diagnostic',
    'http://localhost:3000/api/grades/rankings?limit=5',
    'http://localhost:3000/api/dashboard/stats',
    'http://localhost:3000/api/notifications/unread-count'
  ];

  for (const url of endpoints) {
    try {
      const start = Date.now();
      const res = await globalThis.fetch(url);
      const text = await res.text();
      const duration = Date.now() - start;
      console.log(`URL: ${url}`);
      console.log(`Status: ${res.status} (${res.statusText})`);
      console.log(`Duration: ${duration}ms`);
      console.log(`Response Snippet: ${text.substring(0, 200)}`);
      console.log('----------------------------------------------------');
    } catch (e) {
      console.error(`Error fetching ${url}:`, e.message);
    }
  }
}

test();
