# Test Preview Endpoints

This directory contains scripts to test the deployed Vercel preview endpoints with HMAC authentication.

## Prerequisites

1. Set the `INTERNAL_API_KEY` environment variable to match the value configured in Vercel:

   ```powershell
   $env:INTERNAL_API_KEY = "your-secret-key-here"
   ```

2. Ensure Vercel Deployment Protection is disabled for API routes (or provide a bypass token).

## Scripts

### `hmac-request.mjs`

General-purpose Node.js script for making HMAC-signed requests.

**Usage:**

```bash
node hmac-request.mjs --url <URL> [options]
```

**Options:**

- `--method GET|POST` - HTTP method (default: GET)
- `--body '{"key":"value"}'` - JSON body for POST requests
- `--no-sign` - Send request without HMAC signature (for testing 401)
- `--bypass-token <token>` - Vercel protection bypass token
- `--header-only` - Print computed headers and exit

**Examples:**

```bash
# POST with body
node hmac-request.mjs --url https://bhedu-xxx.vercel.app/api/admin/create-user --method POST --body '{"email":"test@example.com","password":"strongpass"}'

# Test without signature (expect 401)
node hmac-request.mjs --url https://bhedu-xxx.vercel.app/api/admin/create-user --method POST --body '{}' --no-sign
```

### `test-preview-endpoints.ps1`

PowerShell wrapper that runs a full suite of endpoint tests.

**Usage:**

1. Set `INTERNAL_API_KEY` in the current PowerShell session as shown above.
2. Run:
   ```powershell
   .\web\scripts\test-preview-endpoints.ps1
   ```

## API Endpoints

### `POST /api/admin/create-user`

Creates a new Supabase auth user (admin API, requires `SUPABASE_SERVICE_ROLE_KEY`).

- **Auth:** HMAC signature over raw JSON body
- **Body:** `{ "email": "user@example.com", "password": "strongpass" }`
- **Response:** `{ "data": { ... created auth user ... } }`

## Notes

- All endpoints use HMAC-SHA256 with `INTERNAL_API_KEY` for authentication.
- The signature is sent in the `x-internal-signature` header as a hex-encoded hash.
- Rate limiting: 10 authenticated requests per minute per IP (in-memory, per serverless instance).
- Vercel environment variables required:
  - `INTERNAL_API_KEY` (for HMAC auth)
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
