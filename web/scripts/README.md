# Deployment test helpers

The former HMAC-based account provisioning endpoint has been retired.

Create and manage accounts through `/api/admin/users`, which requires an authenticated application session and the appropriate user-management permission. Do not use the legacy HMAC helpers to provision accounts.

The remaining scripts in this directory are retained only for diagnostics and deployment verification. They must read secrets from environment variables; never place credentials directly in a script.
