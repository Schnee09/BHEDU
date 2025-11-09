#!/usr/bin/env node
import crypto from 'node:crypto';
import process from 'node:process';

function parseArgs(argv) {
  const out = { method: 'GET', url: '', body: '', noSign: false, headerOnly: false, bypassToken: '', signPayload: '' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--method' || a === '-X') out.method = argv[++i]?.toUpperCase() || 'GET';
    else if (a === '--url' || a === '-U') out.url = argv[++i] || '';
    else if (a === '--body' || a === '-d') out.body = argv[++i] || '';
    else if (a === '--no-sign') out.noSign = true;
    else if (a === '--header-only') out.headerOnly = true;
    else if (a === '--bypass-token') out.bypassToken = argv[++i] || '';
    else if (a === '--sign-payload') out.signPayload = argv[++i] || '';
    else if (a === '--help' || a === '-h') {
      console.log(`Usage: node scripts/hmac-request.mjs --url <URL> [--method GET|POST] [--body '{"k":"v"}'] [--sign-payload '<string>'] [--no-sign] [--bypass-token <token>]\nReads INTERNAL_API_KEY from env to compute x-internal-signature over raw body (or --sign-payload).\nNote: For GET/HEAD requests you can pass --sign-payload to compute signature without sending a body.`);
      process.exit(0);
    }
  }
  return out;
}

const { method, url, body, noSign, headerOnly, bypassToken, signPayload } = parseArgs(process.argv);
if (!url) {
  console.error('Missing --url');
  process.exit(2);
}

const key = process.env.INTERNAL_API_KEY?.trim();
const raw = body || (method === 'GET' || method === 'HEAD' ? '' : '');
const toSign = signPayload || raw;

const headers = { 'Content-Type': 'application/json' };
if (!noSign) {
  if (!key) {
    console.error('INTERNAL_API_KEY is not set in env. Use --no-sign to send without signature.');
    process.exit(3);
  }
  const hmac = crypto.createHmac('sha256', key).update(toSign).digest('hex');
  headers['x-internal-signature'] = hmac;
}

if (headerOnly) {
  console.log(JSON.stringify(headers, null, 2));
  process.exit(0);
}

const init = { method, headers };
// Only attach body when explicitly provided and method allows/needs it
if (raw && !(method === 'GET' || method === 'HEAD')) init.body = raw;

try {
  // Optional: set Vercel protection bypass cookie
  let cookie = '';
  if (bypassToken) {
    const u = new URL(url);
    const bypassUrl = `${u.origin}${u.pathname}?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=${bypassToken}`;
    const bypassRes = await fetch(bypassUrl, { redirect: 'manual' });
    const setCookie = bypassRes.headers.get('set-cookie');
    if (setCookie) {
      cookie = setCookie.split(',')[0]; // first cookie should include the bypass cookie
    }
  }
  if (cookie) headers['Cookie'] = cookie;

  const res = await fetch(url, init);
  const text = await res.text();
  console.log('Status:', res.status);
  console.log(text);
  process.exit(res.ok ? 0 : 1);
} catch (err) {
  console.error('Request failed:', err.message || String(err));
  process.exit(1);
}
