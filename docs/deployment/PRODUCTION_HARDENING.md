# Production hardening

## Secrets and environment

- Store secrets only in Vercel, Supabase, or an approved secret manager.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` through a `NEXT_PUBLIC_` variable.
- Rotate any credential that appears in Git, logs, screenshots, or support messages.
- Keep production, preview, and local credentials separate.

## Authentication and authorization

- Protect business APIs with the Supabase application session.
- Require granular permissions for administrative operations.
- Reject disabled accounts and profiles that cannot be resolved.
- Provision accounts only through `/api/admin/users` so Auth and business profiles stay synchronized.
- Do not introduce shared static request keys as an alternative to user authorization.

## Database

- Apply migrations before deploying code that depends on new schema.
- Enable and review Row Level Security policies for client-accessible tables.
- Keep service-role access server-only and scoped to repository or service operations.
- Configure backups and periodically test restoration.

## Application security

- Validate request bodies, route parameters, and query strings.
- Rate-limit authentication and sensitive mutation endpoints.
- Keep security headers enabled in `next.config.ts`.
- Run `npm run security:audit` in CI and review every allowlisted advisory.
- Remove diagnostic or compatibility endpoints when their migration period ends.

## Verification before release

Run from `web`:

```powershell
npm ci
npm run typecheck
npm run lint
npm test -- --runInBand
npm run build
npm run security:audit
```

Then verify `/api/health` and the authenticated student, class, attendance, grade, and finance workflows with representative roles.

## Monitoring and incidents

- Monitor Vercel logs, health checks, and Sentry alerts.
- Avoid logging access tokens, passwords, financial details, or personal data.
- Review audit logs for sensitive administrative changes.
- When a credential is exposed, rotate it first, then remove it from the current tree and assess Git history.
- Record the incident, affected environments, remediation, and follow-up controls.
