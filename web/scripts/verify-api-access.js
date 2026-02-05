const http = require('http');

const endpoints = [
  '/api/v2/students',
  '/api/v2/grades',
  '/api/v2/classes'
];

console.log('Testing API Endpoints Reachability...');

endpoints.forEach(endpoint => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: endpoint,
    method: 'GET'
  };

  const req = http.request(options, res => {
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.log(`✅ ${endpoint}: Status ${res.statusCode} (Protected & Reachable)`);
    } else if (res.statusCode === 200) {
      console.log(`⚠️ ${endpoint}: Status 200 (Accessible without auth)`);
    } else {
      console.log(`❌ ${endpoint}: Status ${res.statusCode} (Unexpected)`);
    }
  });

  req.on('error', error => {
    console.error(`❌ Error reaching ${endpoint}: ${error.message}`);
  });

  req.end();
});
