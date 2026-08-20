# Development Standards

> Part of the AI Agent Development Standards (v1.1). Split from the master document into `/docs/`. This file is the project-level source of truth for approved stack, coding conventions, project process and agent working rules for this project.

---

## 1. Purpose

This document defines the standard architecture, development practices, storage strategy, security rules, deployment approach, and coding conventions that AI agents must follow when developing web or mobile applications.

The objective is to build applications that are:

- Scalable
- Secure
- Maintainable
- Modular
- Production-ready
- Cost-effective during development
- Easy to deploy and maintain

---


# Standard Technology Stack

Unless the project requirements explicitly require another technology, use the following stack.

    ## Frontend

        ### Web

        - React.js
        - Vite
        - JavaScript
        - React Router
        - Bootstrap and/or project-approved UI framework
        - Axios for API communication
        - Redux Toolkit when global state management is required
        - React Hooks
        - Component-based architecture

        ### Mobile

        Use React Native when a cross-platform mobile application is required.

    ## Backend

    - Node.js
    - Express.js
    - REST API
    - JWT authentication where applicable
    - bcrypt/bcryptjs for password hashing
    - Nodemailer or an approved email service for email communication

    ## Database

    - MongoDB Atlas
    - Mongoose where appropriate

    ## File/Object Storage

    Use object storage instead of MongoDB for binary files.

    Preferred options:

    1. Cloudflare R2 — general-purpose images/files/videos
    

    ## Hosting

    Preferred architecture:

    - Vercel — frontend
    - Render or another production-grade backend platform — Node.js/Express API
    - MongoDB Atlas — database
    - Cloudflare R2 or Cloudinary — files/media

    ## Source Control

    - Git
    - GitHub

---


# API Architecture

Use a modular backend structure.

Recommended:

```text
server/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── utils/
├── validators/
├── uploads/
├── app.js
└── server.js
```

Example:

```text
routes
   |
   v
controllers
   |
   v
services
   |
   v
models
   |
   v
MongoDB
```

Business logic should not be placed entirely inside route files.

---


# Frontend Architecture

Use reusable components.

Recommended:

```text
src/
├── assets/
├── components/
├── pages/
├── layouts/
├── routes/
├── hooks/
├── services/
├── store/
├── utils/
├── constants/
├── styles/
├── App.jsx
└── main.jsx
```

Use:

- Reusable components
- React Hooks
- Custom Hooks where useful
- Centralized API service
- Centralized constants
- Proper loading states
- Proper error states
- Empty states
- Form validation
- Responsive design

Avoid:

- Large monolithic components
- Repeated code
- Inline business logic everywhere
- Hard-coded API URLs
- Hard-coded secrets
- Excessive inline CSS

---


# API Communication

Use Axios or the project-approved HTTP client.

Centralize API configuration.

Example:

```text
src/services/api.js
```

Use environment variables:

```env
VITE_API_BASE_URL=
```

Do not hard-code production API URLs throughout components.

---


# Authentication

When authentication is required:

- Hash passwords using bcrypt/bcryptjs.
- Never store plain-text passwords.
- Use JWT or another approved authentication mechanism.
- Implement token expiration.
- Validate authentication on protected APIs.
- Implement role-based authorization where required.
- Do not trust frontend role information.
- Validate authorization on the backend.

Example:

```text
User
 |
 v
Login
 |
 v
Backend validates credentials
 |
 v
JWT issued
 |
 v
Frontend stores authentication state
 |
 v
Protected API
 |
 v
Auth middleware
 |
 v
Role/permission validation
 |
 v
Controller
```

---


# Security Rules

AI agents MUST consider security during development.

Implement:

- Input validation
- Output validation where appropriate
- Authentication
- Authorization
- Rate limiting
- CORS configuration
- Secure HTTP headers
- Password hashing
- File type validation
- File size validation
- Malware/security scanning where required
- Secure environment variables
- Protection against injection attacks
- Protection against unauthorized file access
- Audit logging for sensitive actions

Never trust:

```text
frontend validation
user input
uploaded filenames
client-provided roles
client-provided permissions
```

Backend validation is mandatory.

---


# File Upload Security

Every file upload endpoint should consider:

```text
Authentication
Authorization
Maximum file size
Allowed MIME types
Allowed extensions
Filename sanitization
Storage path isolation
Malicious file detection
Access permissions
```

Do not allow unrestricted uploads such as:

```text
.exe
.php
.js
.sh
.bat
```

unless the application specifically requires them and has an appropriate security architecture.

Do not expose private files publicly by default.

For private files, use signed URLs or authenticated download endpoints.

---


# Logging

Use structured logging for important events.

Log:

```text
Authentication events
API errors
Database errors
File uploads
File deletions
Administrative actions
Security events
```

Never log:

```text
Passwords
JWT secrets
API secrets
Storage secret keys
Sensitive personal information
```

---


# Performance

Optimize:

```text
Images
JavaScript
CSS
API calls
Database queries
Network requests
Bundle size
```

Use:

- Lazy loading
- Code splitting
- Pagination
- Caching
- CDN
- Image optimization
- Database indexes
- Debouncing for search
- Throttling where appropriate

Never load thousands of records into the browser unnecessarily.

---


# Mobile Application Rules

For React Native or another mobile framework:

- Use the same backend API where possible.
- Never connect the mobile application directly to MongoDB.
- Store tokens securely using platform-appropriate secure storage.
- Optimize image uploads.
- Compress large images/videos.
- Handle poor network conditions.
- Provide upload progress.
- Handle retry mechanisms.
- Support offline states where appropriate.

Architecture:

```text
Mobile App
    |
    v
REST API
    |
    +---- MongoDB
    |
    +---- Object Storage
```

Never:

```text
Mobile App
    |
    v
MongoDB directly
```

---


# Git Standards

Use meaningful commits.

Examples:

```text
feat: add project creation API
fix: resolve image upload issue
refactor: improve authentication middleware
docs: update deployment instructions
style: improve dashboard layout
test: add project controller tests
```

Never commit:

```text
.env
node_modules/
secret files
private certificates
large generated files
```

Use `.gitignore`.

---


# Testing

Implement testing appropriate to the project size.

Test:

```text
Authentication
Authorization
API endpoints
Database operations
Forms
File uploads
Critical UI flows
Error handling
```

At minimum, test critical business functionality before deployment.

---


# AI Agent Working Rules

When an AI agent receives a development task, it MUST follow this sequence.

## Step 1 — Understand

First identify:

```text
Application type
Target users
Features
Platforms
Authentication requirements
Database requirements
File storage requirements
Third-party integrations
Hosting requirements
Security requirements
```

## Step 2 — Inspect Existing Project

Before changing code:

- Inspect the project structure.
- Read package.json.
- Read environment configuration.
- Inspect existing routes.
- Inspect existing components.
- Inspect database models.
- Inspect API services.
- Inspect authentication.
- Identify reusable components.
- Identify existing design system.
- Identify existing deployment configuration.

Do not unnecessarily rewrite working code.

## Step 3 — Plan

Create a technical implementation plan before making major changes.

The plan should identify:

```text
Files to create
Files to modify
Database changes
API changes
Frontend changes
Storage changes
Security changes
Testing requirements
Deployment requirements
```

## Step 4 — Implement

Follow the existing architecture when it is sound.

Use reusable components and services.

Avoid duplicated code.

Do not introduce unnecessary libraries.

## Step 5 — Validate

After implementation:

```text
Run build
Run tests
Check API
Check database
Check file storage
Check UI
Check responsive behavior
Check console errors
Check security
```

## Step 6 — Report

Provide:

```text
What was changed
Files created
Files modified
Dependencies added
Environment variables required
Database changes
Storage configuration
How to run locally
How to deploy
Known limitations
```

---


# Recommended Default Stack

Unless the project specifies otherwise, use:

```text
Frontend:
React + Vite

UI:
Bootstrap / approved design system

Routing:
React Router

State:
Redux Toolkit when required

API:
Axios

Backend:
Node.js + Express

Database:
MongoDB Atlas

File Storage:
Cloudflare R2



Frontend Hosting:
Vercel

Backend Hosting:
Render or equivalent production platform

Source Control:
GitHub
```

---


# Final AI Agent Instruction

Always prioritize:

```text
Security
Scalability
Maintainability
Performance
Accessibility
Responsive Design
Cost Efficiency
Clean Architecture
Reusable Components
Separation of Concerns
Production Readiness
```

When requirements conflict, explain the trade-off before implementing a risky architectural decision.

Do not assume that a free-tier service is suitable for production.

Always verify the current pricing, limits, API capabilities, and platform restrictions from the provider's official documentation before making a production recommendation.

---

## Official References

- React: https://react.dev/
- Vite: https://vite.dev/
- Node.js: https://nodejs.org/
- Express: https://expressjs.com/
- React Native: https://reactnative.dev/
- GitHub: https://github.com/

---

# Mandatory Project File Structure and Build Order

The AI agent MUST define and follow the project file structure before creating implementation files.

## Mandatory Development Order

Follow this order unless the project has a documented reason to change it:

```text
1. Requirement Analysis
        ↓
2. Project File Structure
        ↓
3. Project/Folder Creation
        ↓
4. Database Setup
        ↓
5. File Storage Setup
        ↓
6. Documentation Review (design-system.md, development-standards.md,
   architecture.md, api-specification.md, database.md, deployment.md)
        ↓
7. Frontend Design & UI Development
        ↓
8. Backend/API Development
        ↓
9. Frontend ↔ Backend Integration
        ↓
10. Authentication & Authorization
        ↓
11. Testing
        ↓
12. Security Review
        ↓
13. Performance Optimization
        ↓
14. Deployment
        ↓
15. Final Validation & Documentation
```

---

# Project File Structure

For a standard full-stack application, use a scalable structure similar to:

```text
project-root/
├── client/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       │   ├── common/
│       │   ├── forms/
│       │   ├── layout/
│       │   └── ui/
│       ├── layouts/
│       ├── pages/
│       ├── routes/
│       ├── hooks/
│       ├── services/
│       ├── store/
│       ├── utils/
│       ├── constants/
│       ├── validations/
│       ├── styles/
│       ├── App.jsx
│       └── main.jsx
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── validators/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── docs/
│   ├── design-system.md
│   ├── development-standards.md
│   ├── architecture.md
│   ├── api-specification.md
│   ├── database.md
│   └── deployment.md
├── .env.example
├── .gitignore
├── README.md
└── package.json
```

Adapt the exact structure to the selected framework, but always maintain separation of concerns.

---

# Project Documentation Requirement (/docs/)

Before detailed implementation work begins, the AI agent MUST locate and read the project's documentation set inside `/docs/`. Each file below is a single source of truth for its domain — the agent must not invent conflicting decisions once a file exists.

**Default files:**

```text
/docs/design-system.md
/docs/development-standards.md
/docs/architecture.md
/docs/api-specification.md
/docs/database.md
/docs/deployment.md
```

General rules for all six files:

- If an existing file covering that domain is located elsewhere in the repository, use that existing file instead of creating a competing one.
- If a file is missing and the upcoming task depends on it, inform the user and ask whether it should be created before proceeding.
- Each file must be kept up to date as decisions are made — a stale doc is treated as a defect, not a formality.
- These files describe the actual, current state of THIS project. They are distinct from this Development Standards document, which describes the default rules the agent follows across ALL projects unless a project's own docs say otherwise.

## design-system.md

Read before detailed frontend UI development. Source of truth for:

```text
Colors
Typography
Spacing
Grid
Breakpoints
Buttons
Forms
Cards
Tables
Navigation
Modals
Icons
Shadows
Border Radius
Components
States
Animations
Accessibility
Responsive behavior
```

## development-standards.md

The project-specific application of this AI Agent Development Standards document. Read before setting up architecture or writing implementation code. Source of truth for:

```text
Approved technology stack for THIS project (may differ from Section 2/33 defaults)
Approved deviations from the default standards, and the reason for each
Project-specific coding conventions and naming conventions
Folder/module patterns unique to this codebase
```

If `development-standards.md` conflicts with this document, `development-standards.md` governs for this project — but the agent must flag the conflict to the user before proceeding, rather than silently applying it.

## architecture.md

Read before backend/API and database setup. Source of truth for:

```text
The project's actual system architecture diagram (Application, Database, File Storage, Hosting, Authentication)
Service boundaries and data flow
Third-party integrations in use
Key architectural decisions and the trade-offs behind them
```

## api-specification.md

Read before frontend ↔ backend integration, and updated whenever an endpoint changes. Source of truth for the project's actual API contract:

```text
HTTP method
Endpoint
Authentication requirement
Request parameters/body
Response structure
Error structure
Pagination
Authorization rules
```

The frontend must never be integrated against an endpoint that isn't documented here first.

## database.md

Read before building data-driven pages. Source of truth for the project's actual data model:

```text
Collections/schemas
Fields and types
Relationships
Indexes
Validation rules
Data ownership and access patterns
```

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

# No Local Storage or JSON as Application Data

The application MUST NOT use browser/device local storage or static JSON files as a substitute for the real database.

Do NOT use the following for authoritative application data:

```text
localStorage
sessionStorage
data.json
users.json
products.json
projects.json
mock JSON files
hard-coded application records
```

Persistent application data must come from the backend/API and database:

```text
Frontend → API → MongoDB
```

Local storage may only be used when explicitly appropriate for non-sensitive client preferences such as theme or language. Never store passwords, database credentials, storage secrets, or other sensitive information there.

Temporary mock data may be used during early UI prototyping only. Once the backend is available, remove all mock data and connect the UI to real APIs.

---

# Recommended Full Development Sequence

```text
Requirements
    ↓
Architecture
    ↓
Project File Structure
    ↓
Create Project/Folders
    ↓
Database Setup
    ↓
File Storage Setup
    ↓
Read /docs/ (design-system.md, development-standards.md,
architecture.md, api-specification.md, database.md, deployment.md)
    ↓
Frontend Design
    ↓
Backend/API
    ↓
Frontend ↔ Backend Integration
    ↓
Authentication & Authorization
    ↓
Testing
    ↓
Security Review
    ↓
Performance Optimization
    ↓
Deployment
    ↓
Final Validation & Documentation
```

The agent may develop backend/API code earlier when technically necessary, but the architecture, project structure, database, storage, and Design System must be established first.

---

# AI Agent Must Ask Before Major Assumptions

If missing requirements can materially affect architecture, security, cost, or implementation, the AI agent must ask rather than silently inventing requirements.

Important questions include:

1. Is this web, mobile, or both?
2. What user roles are required?
3. What authentication method is required?
4. What data needs to be stored?
5. What files/images/videos need to be uploaded?
6. What is the maximum file size?
7. Are files public or private?
8. Is image/video optimization required?
9. What is the expected number of users and data volume?
10. Is this an MVP, internal system, or production application?
11. What hosting provider is preferred?
12. Does a `/docs/` documentation set already exist (design-system.md, development-standards.md, architecture.md, api-specification.md, database.md, deployment.md)? If yes, what are the paths?
13. Is there an existing database/backend/codebase to preserve?
14. Are there third-party APIs or integrations?
15. Are there privacy/compliance requirements?

Ask only the questions needed to unblock the current task.

---

# Final Mandatory AI Agent Rule

Before writing implementation code, the agent must be able to answer:

```text
What are we building?
Where is the project file structure?
Where is the database?
Where are files stored?
Where is the Design System?
Is the project's /docs/ documentation set (design-system, development-standards, architecture, api-specification, database, deployment) complete and current?
How does the frontend communicate with the backend?
How is authentication handled?
How is authorization handled?
How is the application deployed?
How is production data protected?
```

If any critical answer is unknown, ask the user or clearly document the assumption before proceeding.

---

## Version

**Development Standard:** 1.1  
**Created:** 2026-08-19  
**Updated:** 2026-08-19 — expanded Section 38 from a single design-system.md requirement into the full six-file `/docs/` documentation set (design-system.md, development-standards.md, architecture.md, api-specification.md, database.md, deployment.md), and updated all cross-references (Sections 36.1, 44, 45, 46) accordingly.  
**Purpose:** Standard instructions for AI-assisted web and mobile application development.
