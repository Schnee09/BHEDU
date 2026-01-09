# Scripts Directory

Essential scripts for deployment and maintenance of BH-EDU.

## Active Scripts

| Script | Purpose |
|--------|---------|
| `pre-deploy-check.ps1` | Run before deployment to verify configuration |
| `post-deployment-setup.ps1` | Run after deployment to set up initial data |
| `generate-api-key.ps1` | Generate secure API keys |
| `set-vercel-org.ps1` | Configure Vercel organization |
| `validate-migrations-schema.js` | Validate database migrations |
| `fix-payment-installments.js` | Fix payment installment data |

## Batch Scripts
| Script | Purpose |
|--------|---------|
| `check-db.bat` | Quick database health check |
| `run-seed.bat` | Run seed data |
| `setup-vietnam-edu.bat` | Setup Vietnamese education data |

## Archive

Old/one-time scripts are archived in subdirectories:
- `archive/seed/` - Seed data scripts
- `archive/check/` - Database check scripts  
- `archive/verify/` - Verification scripts
- `archive/test/` - Test scripts
- `archive/setup/` - Setup scripts
- `archive/migrations/` - Migration runner scripts
- `archive/utils/` - Utility scripts
- `archive/sql-fixes/` - SQL fix scripts

These scripts are kept for reference but are not actively used.
