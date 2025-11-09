const crypto = require('crypto');

const key = process.env.INTERNAL_API_KEY;
console.log('Key from env:', JSON.stringify(key));
console.log('Key length:', key ? key.length : 0);

if (!key) {
  console.error('INTERNAL_API_KEY not set!');
  process.exit(1);
}

const trimmedKey = key.trim();
console.log('Trimmed key:', JSON.stringify(trimmedKey));
console.log('Trimmed length:', trimmedKey.length);

const empty = '';
const hmac = crypto.createHmac('sha256', trimmedKey).update(empty).digest('hex');
console.log('Computed HMAC with trimmed key:', hmac);
