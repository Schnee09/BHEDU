/**
 * Verify debug auth endpoint in a deployment or local dev
 * Usage:
 *  BASE_URL=https://your-app.vercel.app node web/scripts/verify-auth.mjs
 * Optional:
 *  ACCESS_TOKEN=eyJ... node web/scripts/verify-auth.mjs (adds Authorization: Bearer)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const ACCESS_TOKEN = process.env.ACCESS_TOKEN

async function main () {
  const headers = {}
  if (ACCESS_TOKEN) {
    headers['Authorization'] = `Bearer ${ACCESS_TOKEN}`
  }
  const res = await fetch(`${BASE_URL}/api/debug/auth`, { headers })
  const text = await res.text()
  console.log('Status:', res.status)
  console.log('Body  :', text)
}

main().catch(err => {
  console.error('verify-auth failed:', err)
  process.exit(1)
})
