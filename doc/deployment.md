# Deployment

> Part of the AI Agent Development Standards (v1.1). Split from the master document into `/docs/`. This file is the project-level source of truth for hosting, environments, domain/DNS, environment variable names and release steps.

---

## deployment.md

Read before configuring hosting or releasing. Source of truth for the project's actual deployment configuration:

```text
Hosting providers in use (frontend/backend/database/storage)
Environments (development/staging/production) and how they differ
Domain and DNS configuration
Required environment variable NAMES (never commit values)
Deployment/release steps
Rollback procedure
```

---

# Environment Variables

Never commit secrets to GitHub.

Use:

```text
.env
.env.local
.env.production
```

where appropriate.

Typical backend variables:

```env
PORT=
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=
JWT_REFRESH_EXPIRES_IN=
CLIENT_ORIGIN=
STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_BUCKET=
```

Typical frontend variables:

```env
VITE_API_BASE_URL=
VITE_APP_NAME=
```

Only expose variables to the frontend when they are intentionally public.

Never expose:

```text
database passwords
JWT secrets
storage secret keys
SMTP passwords
private API keys
```

---


# Deployment Architecture

Preferred deployment:

```text
GitHub
   |
   +----------------------+
   |                      |
   v                      v
Vercel                 Render
Frontend               Backend API
                           |
             +-------------+-------------+
             |                           |
             v                           v
       MongoDB Atlas               Cloudflare R2
        Database                  File Storage
```

Cloudinary may replace R2 for image/video-heavy applications.

---


# Domain and DNS

Production deployment should use:

```text
www.example.com
api.example.com
```

Recommended:

```text
www.example.com  → Frontend
api.example.com  → Backend
```

Configure:

- DNS
- SSL/HTTPS
- CORS
- Environment variables
- Redirects
- Canonical domain

Always use HTTPS in production.

---


# 25. Development Environments

Maintain separate environments where appropriate:

```text
Development
Staging
Production
```

Example:

```text
Development
MongoDB Development
R2 Development Bucket

Staging
MongoDB Staging
R2 Staging Bucket

Production
MongoDB Production
R2 Production Bucket
```

Do not accidentally use production data during development.

---


# 28. Validation Before Deployment

AI agents must verify:

```text
Frontend builds successfully
Backend starts successfully
Database connection works
Environment variables are configured
API endpoints work
Authentication works
Authorization works
File upload works
File download works
File deletion works
Responsive UI works
No obvious console errors
No exposed secrets
No broken routes
No broken API URLs
```

---


# 29. Production Checklist

Before production release:

- [ ] Production environment variables configured
- [ ] Database production cluster configured
- [ ] Database indexes reviewed
- [ ] File storage production bucket configured
- [ ] CORS configured
- [ ] HTTPS enabled
- [ ] Authentication tested
- [ ] Authorization tested
- [ ] File upload security tested
- [ ] Error handling tested
- [ ] API rate limiting considered
- [ ] Backups configured
- [ ] Monitoring configured
- [ ] Logging configured
- [ ] Frontend build tested
- [ ] Mobile production build tested if applicable
- [ ] SEO configured for public websites
- [ ] Sitemap configured where applicable
- [ ] Robots.txt configured where applicable
- [ ] Accessibility reviewed
- [ ] Performance reviewed

---


## Official References

- Vercel: https://vercel.com/
- Vercel Documentation: https://vercel.com/docs
- Render: https://render.com/
- Render Documentation: https://render.com/docs
