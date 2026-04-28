const http = require('http');

const endpoints = [
  '/api/students',
  '/api/grades',
  '/api/classes'
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
      console.log(`笨・${endpoint}: Status ${res.statusCode} (Protected & Reachable)`);
    } else if (res.statusCode === 200) {
      console.log(`笞・・${endpoint}: Status 200 (Accessible without auth)`);
    } else {
      console.log(`笶・${endpoint}: Status ${res.statusCode} (Unexpected)`);
    }
  });

  req.on('error', error => {
    console.error(`笶・Error reaching ${endpoint}: ${error.message}`);
  });

  req.end();
});
