# Deployment Checklist

Complete guide to deploying the BH-EDU system to production.

## 📋 Pre-Deployment Checklist

### 1. Database Setup ✓
- [ ] Supabase project created
- [ ] Database schema applied (see DATABASE_SETUP.md)
- [ ] RLS policies enabled and tested
- [ ] Helper functions created
- [ ] Sample data seeded (optional)
- [ ] Database backups configured

### 2. Environment Variables ✓
- [ ] All required environment variables configured
- [ ] Secrets stored securely (not in git)
- [ ] Production values different from development

### 3. Code Quality ✓
- [ ] TypeScript compilation passes (`npm run typecheck`)
- [ ] All tests passing (`npm test`)
- [ ] Production build successful (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] No console errors in development

### 4. Security ✓
- [ ] API routes protected with authentication
- [ ] Role-based access control implemented
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info
- [ ] CORS configured correctly
- [ ] Rate limiting considered

## 🔑 Required Environment Variables

Create a `.env.local` file in the `web` directory:

```bash
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# HMAC Authentication (for legacy /api/courses endpoints)
HMAC_SECRET=your-hmac-secret-here

# Next.js Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### Getting Supabase Keys

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

### Generating HMAC Secret

```bash
# Generate a secure random secret
openssl rand -base64 32
```

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the recommended platform for Next.js applications.

#### Steps:

1. **Push code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository
   - Select the `web` directory as root

3. **Configure Environment Variables**
   - Add all variables from `.env.local`
   - ⚠️ Never commit `.env.local` to git!

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy
   - You'll get a production URL

5. **Configure Custom Domain** (optional)
   - Go to Project Settings > Domains
   - Add your custom domain
   - Update DNS records as instructed

#### Vercel Configuration

Create `vercel.json` in the `web` directory:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

### Option 2: Docker

Use Docker for self-hosting or cloud providers.

#### Dockerfile

Create `Dockerfile` in the `web` directory:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Build and Run

```bash
# Build the image
docker build -t bh-edu .

# Run the container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  -e SUPABASE_SERVICE_ROLE_KEY=your-service-key \
  -e HMAC_SECRET=your-hmac-secret \
  bh-edu
```

### Option 3: Manual Node.js Deployment

Deploy directly on a VPS or cloud instance.

#### Steps:

1. **Prepare the server**
   ```bash
   # Install Node.js 20+
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2 for process management
   sudo npm install -g pm2
   ```

2. **Clone and build**
   ```bash
   git clone your-repo-url
   cd web
   npm install
   npm run build
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with production values
   nano .env.local
   ```

4. **Start with PM2**
   ```bash
   pm2 start npm --name "bh-edu" -- start
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx** (optional, for reverse proxy)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## ✅ Post-Deployment Verification

### 1. Health Checks

Test critical endpoints:

```bash
# Health check
curl https://your-domain.com/api/health

# Student endpoints (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-domain.com/api/v1/students

# Get specific student
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-domain.com/api/v1/students/STUDENT_ID
```

### 2. Test Student CRUD

Use the API client or Postman:

1. **Login** to get auth token
2. **Create student**: POST `/api/v1/students`
   ```json
   {
     "email": "test@example.com",
     "password": "SecurePass123!",
     "firstName": "Test",
     "lastName": "Student",
     "dateOfBirth": "2005-01-15"
   }
   ```
3. **Get students**: GET `/api/v1/students`
4. **Get student by ID**: GET `/api/v1/students/{id}`
5. **Update student**: PATCH `/api/v1/students/{id}`
   ```json
   {
     "phoneNumber": "+1234567890"
   }
   ```
6. **Enroll student**: POST `/api/v1/students/{id}/enroll`
   ```json
   {
     "classId": "class-uuid"
   }
   ```
7. **Get grades**: GET `/api/v1/students/{id}/grades`
8. **Get attendance**: GET `/api/v1/students/{id}/attendance`
9. **Delete student**: DELETE `/api/v1/students/{id}`

### 3. Monitor Logs

#### Vercel
- Go to your project dashboard
- Click "Logs" tab
- Monitor real-time logs

#### Docker
```bash
docker logs -f container-name
```

#### PM2
```bash
pm2 logs bh-edu
```

### 4. Performance Check

- [ ] Page load times < 3 seconds
- [ ] API response times < 500ms
- [ ] No memory leaks
- [ ] Database queries optimized

## 🔒 Security Checklist

- [ ] HTTPS enabled (SSL/TLS certificate)
- [ ] Environment variables not exposed in client
- [ ] Service role key never sent to client
- [ ] CORS properly configured
- [ ] Rate limiting implemented (if needed)
- [ ] SQL injection prevented (using parameterized queries)
- [ ] XSS protection enabled
- [ ] CSRF tokens for sensitive operations
- [ ] Input validation on all endpoints
- [ ] Error messages sanitized

## 📊 Monitoring & Maintenance

### Recommended Monitoring

1. **Uptime Monitoring**
   - Use UptimeRobot, Pingdom, or similar
   - Monitor `/api/health` endpoint

2. **Error Tracking**
   - Set up Sentry or similar
   - Track unhandled errors

3. **Performance Monitoring**
   - Use Vercel Analytics
   - Or Google Analytics

4. **Database Monitoring**
   - Monitor Supabase dashboard
   - Set up alerts for high usage

### Regular Maintenance

- [ ] Weekly: Check error logs
- [ ] Weekly: Review performance metrics
- [ ] Monthly: Update dependencies
- [ ] Monthly: Review and optimize database queries
- [ ] Quarterly: Security audit
- [ ] Quarterly: Backup verification

## 🐛 Troubleshooting

### Common Issues

1. **500 Internal Server Error**
   - Check environment variables
   - Verify Supabase connection
   - Check server logs

2. **401 Unauthorized**
   - Verify auth token is valid
   - Check Supabase auth configuration
   - Ensure user has correct role

3. **Database Connection Failed**
   - Verify `NEXT_PUBLIC_SUPABASE_URL`
   - Check Supabase project status
   - Verify network connectivity

4. **Build Fails**
   - Run `npm run typecheck` locally
   - Fix TypeScript errors
   - Ensure all dependencies installed

## 📝 API Documentation

All student endpoints are documented in the code. Here's a quick reference:

### Student Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/students` | List students (paginated) | Required |
| POST | `/api/v1/students` | Create student | Required |
| GET | `/api/v1/students/{id}` | Get student by ID | Required |
| PATCH | `/api/v1/students/{id}` | Update student | Required |
| DELETE | `/api/v1/students/{id}` | Delete student | Required |
| POST | `/api/v1/students/{id}/enroll` | Enroll in class | Required |
| DELETE | `/api/v1/students/{id}/enroll` | Unenroll from class | Required |
| GET | `/api/v1/students/{id}/grades` | Get student grades | Required |
| GET | `/api/v1/students/{id}/attendance` | Get attendance | Required |

### Query Parameters

- `page` (number): Page number (default: 1)
- `pageSize` (number): Items per page (default: 20)
- `search` (string): Search by name or email

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ All API endpoints return correct responses
- ✅ Student CRUD operations work correctly
- ✅ Authentication and authorization working
- ✅ Database queries execute successfully
- ✅ No errors in production logs
- ✅ Performance metrics within acceptable range
- ✅ All tests passing in CI/CD
- ✅ SSL certificate valid
- ✅ Monitoring and alerts configured

## 📞 Support

If you encounter issues:

1. Check the logs first
2. Review this checklist
3. Consult DATABASE_SETUP.md
4. Review BACKEND_INFRASTRUCTURE.md
5. Check the integration example in INTEGRATION_EXAMPLE.md

## 🔄 Updates and Rollbacks

### Deploying Updates

1. Test locally first
2. Run all checks: `npm run typecheck && npm test && npm run build`
3. Commit and push to git
4. Vercel will auto-deploy (or manually deploy for other platforms)

### Rolling Back

#### Vercel
- Go to Deployments tab
- Find previous working deployment
- Click "..." > "Promote to Production"

#### Docker
```bash
# Revert to previous image
docker pull bh-edu:previous-tag
docker stop current-container
docker run -d bh-edu:previous-tag
```

#### PM2
```bash
# Rollback git
git revert HEAD
npm install
npm run build
pm2 restart bh-edu
```

---

**Remember**: Always test in a staging environment before deploying to production!
