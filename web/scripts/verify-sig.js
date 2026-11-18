import crypto from 'crypto';

const key = process.env.INTERNAL_API_KEY?.trim();
if (!key) {
  console.error('INTERNAL_API_KEY is required. Set it before running this script.');
  process.exit(1);
}
const empty = '';
const hmac = crypto.createHmac('sha256', key).update(empty).digest('hex');
console.log('Expected HMAC-SHA256 signature for empty body:');
console.log(hmac);
