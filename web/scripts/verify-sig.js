import crypto from 'crypto';

const key = '23685fb84b01f55cf50d871a6d71e5bc3d12e01a48b95e54986ab279521fa5b6';
const empty = '';
const hmac = crypto.createHmac('sha256', key).update(empty).digest('hex');
console.log('Expected HMAC-SHA256 signature for empty body:');
console.log(hmac);
