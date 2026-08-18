# Architecture Project Management & Client Tracking Platform
## Comprehensive Project Instructions & Development Guide

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [Project Lifecycle Stages](#4-project-lifecycle-stages)
5. [Admin / Team Workflow](#5-admin--team-workflow)
6. [Client Workflow](#6-client-workflow)
7. [Core Modules](#7-core-modules)
8. [Key Features](#8-key-features)
9. [Notification System](#9-notification-system)
10. [Approval Workflow](#10-approval-workflow)
11. [Database Schema Design](#11-database-schema-design)
12. [API Architecture](#12-api-architecture)
13. [Frontend Architecture](#13-frontend-architecture)
14. [Authentication & Authorization](#14-authentication--authorization)
15. [File Storage & Document Management](#15-file-storage--document-management)
16. [UI/UX Design Guidelines](#16-uiux-design-guidelines)
17. [Project Folder Structure](#17-project-folder-structure)
18. [Development Phases & Milestones](#18-development-phases--milestones)
19. [Environment Configuration](#19-environment-configuration)
20. [Deployment Guide](#20-deployment-guide)

---

## 1. Project Overview

**Platform Name:** Architecture Project Management & Client Tracking Platform

**Purpose:**
A full-stack web application designed specifically for architecture firms to manage the complete lifecycle of architecture projects — from initial client enquiry through final submission — while providing clients with a dedicated portal for real-time project tracking, document review, approvals, and communication.

**Target Users:**
- **Admin / Architecture Team:** Project managers, architects, designers, engineers
- **Clients:** Individuals or organizations commissioning architecture projects

**Core Value Propositions:**
- Centralized project lifecycle management across 8 distinct stages
- Real-time client visibility into project progress
- Structured approval and feedback workflows
- Secure document version control and file management
- Role-based access for team members and clients
- Notification-driven communication across all stakeholders

---

## 2. Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React.js + Vite | Component-based UI framework with fast HMR build tool |
| Tailwind CSS | Utility-first CSS framework for rapid, consistent styling |
| Bootstrap | Grid system and responsive layout utilities |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime for server-side logic |
| Express.js | Lightweight REST API framework |

### Database
| Technology | Purpose |
|---|---|
| MongoDB | NoSQL document database for flexible project data |

### Cloud Storage
| Technology | Purpose |
|---|---|
| AWS S3 / Cloudinary | File storage for project documents, drawings, and media |

### Authentication
| Technology | Purpose |
|---|---|
| JWT (JSON Web Tokens) | Stateless authentication tokens |
| RBAC (Role-Based Access Control) | Permission management by user role |

### Additional Recommended Libraries
| Library | Purpose |
|---|---|
| Mongoose | MongoDB ODM for schema modeling |
| bcryptjs | Password hashing |
| multer | File upload middleware |
| nodemailer / SendGrid | Email notification service |
| socket.io | Real-time notifications and updates |
| react-router-dom | Client-side routing |
| axios | HTTP client for API calls |
| react-query / TanStack Query | Server state management and caching |
| zustand / Redux Toolkit | Global client state management |
| react-hook-form + zod | Form handling and validation |
| date-fns / dayjs | Date formatting and manipulation |
| recharts / Chart.js | Dashboard analytics and charts |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│               (Web / Mobile Browser)                        │
└─────────────────────┬───────────────────────────────────────┘
                       │
┌─────────────────────▼───────────────────────────────────────┐
│                    ADMIN / TEAM                              │
│                  (Web Application)                           │
└─────────────────────┬───────────────────────────────────────┘
                       │
┌─────────────────────▼───────────────────────────────────────┐
│                   API GATEWAY                               │
│         (Route Management, Auth Middleware,                  │
│          Rate Limiting, Request Validation)                  │
└─────────────────────┬───────────────────────────────────────┘
                       │
┌─────────────────────▼───────────────────────────────────────┐
│              APPLICATION SERVER                             │
│              (Node.js + Express.js)                         │
│   ┌──────────────────────────────────────────────────┐      │
│   │  Auth │ Projects │ Users │ Documents │ Approvals │      │
│   │  Notifications │ Messages │ Reports │ Files      │      │
│   └──────────────────────────────────────────────────┘      │
└──────────┬──────────────────────────┬───────────────────────┘
           │                          │
┌──────────▼──────────┐   ┌──────────▼──────────┐
│     DATABASE        │   │    FILE STORAGE      │
│    (MongoDB)        │   │  (AWS S3/Cloudinary) │
│                     │   │                      │
│  Collections:       │   │  Buckets:            │
│  - users            │   │  - project-docs      │
│  - projects         │   │  - drawings          │
│  - stages           │   │  - reports           │
│  - documents        │   │  - profile-images    │
│  - approvals        │   │                      │
│  - notifications    │   └──────────────────────┘
│  - messages         │
│  - feedback         │
└─────────────────────┘
```

---

## 4. Project Lifecycle Stages

The platform manages **8 sequential project stages**. Each stage has a defined status, set of tasks, and a feedback loop with the client.

---

### Stage 1 — Project Initiation
**Status Badge:** `NEW`
**Color:** Blue

**Activities:**
- Client Enquiry capture
- Requirements gathering
- Budget & Timeline definition
- Project Scope documentation

**Data to Capture:**
```
{
  clientName, clientEmail, clientPhone,
  projectTitle, projectDescription,
  budget: { min, max, currency },
  timeline: { startDate, expectedEndDate },
  scopeDocument: [fileUrl],
  status: "new"
}
```

---

### Stage 2 — Site Survey & Analysis
**Status Badge:** `IN PROGRESS`
**Color:** Green

**Activities:**
- Site Visit scheduling and logging
- Measurements recording
- Site Photos upload
- Survey Report generation
- Site Analysis documentation

**Data to Capture:**
```
{
  siteVisitDate,
  measurements: { length, width, area, units },
  sitePhotos: [fileUrls],
  surveyReport: fileUrl,
  siteAnalysisNotes: String,
  status: "in_progress"
}
```

---

### Stage 3 — Concept Design
**Status Badge:** `DESIGN DEVELOPMENT`
**Color:** Purple

**Activities:**
- Ideas & Planning sessions
- Space Planning layouts
- Concept Sketches creation
- Design Options presentation

**Data to Capture:**
```
{
  conceptSketches: [fileUrls],
  spacePlanningDocs: [fileUrls],
  designOptions: [{ title, description, fileUrl }],
  designNotes: String,
  status: "design_development"
}
```

---

### Stage 4 — Preliminary Design
**Status Badge:** `REVIEW PENDING`
**Color:** Orange

**Activities:**
- Floor Plans production
- Elevations drawings
- 3D Views rendering
- Material Selection documentation

**Data to Capture:**
```
{
  floorPlans: [fileUrls],
  elevations: [fileUrls],
  views3D: [fileUrls],
  materialSelection: { materials: [{ name, type, supplier, fileUrl }] },
  status: "review_pending"
}
```

---

### Stage 5 — Detailed Design & Documentation
**Status Badge:** `DOCUMENTATION`
**Color:** Blue

**Activities:**
- Working Drawings production
- Structural Drawings
- MEP (Mechanical, Electrical, Plumbing) Drawings
- BOQ (Bill of Quantities) Preparation

**Data to Capture:**
```
{
  workingDrawings: [fileUrls],
  structuralDrawings: [fileUrls],
  mepDrawings: [fileUrls],
  boqDocument: fileUrl,
  status: "documentation"
}
```

---

### Stage 6 — Approval & Permissions
**Status Badge:** `GOVT APPROVAL`
**Color:** Red/Orange

**Activities:**
- Submit Drawings to authorities
- Authority Review tracking
- Compliance Check monitoring
- Approval Tracking and documentation

**Data to Capture:**
```
{
  submittedDrawings: [fileUrls],
  authorityName: String,
  submissionDate: Date,
  complianceChecks: [{ item, status, notes }],
  approvalStatus: "pending" | "approved" | "rejected",
  approvalDocument: fileUrl,
  status: "govt_approval"
}
```

---

### Stage 7 — Construction Support
**Status Badge:** `EXECUTION`
**Color:** Yellow/Amber

**Activities:**
- Site Visits during construction
- Progress Reports generation
- Quality Checks documentation
- Issue Tracking and resolution

**Data to Capture:**
```
{
  siteVisits: [{ date, inspector, notes, photos: [fileUrls] }],
  progressReports: [{ date, reportUrl, completionPercent }],
  qualityChecks: [{ date, item, status, notes }],
  issues: [{ title, description, severity, status, resolvedAt }],
  status: "execution"
}
```

---

### Stage 8 — Final Review & Submission
**Status Badge:** `COMPLETED`
**Color:** Green

**Activities:**
- Final Inspection
- Final Drawings compilation
- Handover Docs preparation
- Completion Report generation

**Data to Capture:**
```
{
  finalInspectionDate: Date,
  finalDrawings: [fileUrls],
  handoverDocs: [fileUrls],
  completionReport: fileUrl,
  clientSignoff: Boolean,
  projectRating: Number (1-5),
  clientFeedback: String,
  status: "completed"
}
```

---

### Client Review & Feedback Loop

At any stage, clients can:
- **Approve** — Move project to the next stage
- **Request Changes** — Send revision requests back to the team
- **Add Comments** — Leave contextual feedback on documents or stages

This bidirectional feedback loop is central to the platform and drives stage transitions.

---

## 5. Admin / Team Workflow

### Step 1 — Admin Login
- Secure authentication with JWT
- Role-based access control (Admin, Architect, Designer, Engineer, Project Manager)
- Features unlocked post-login:
  - User Management
  - Role Management
  - Permissions Configuration

---

### Step 2 — Dashboard
**Overview panel showing:**
- Project Summary (total, active, pending, completed)
- Pending Approvals queue
- Upcoming Deadlines (sorted by urgency)
- Team Activity feed (recent actions by team members)

**UI Components Required:**
- KPI summary cards
- Project status donut/bar chart
- Deadline calendar widget
- Activity timeline feed
- Quick-action buttons (Create Project, View Reports)

---

### Step 3 — Create Project
**Form Fields:**
- Client Information (name, email, phone, company)
- Project Details (title, type, description, location)
- Budget & Timeline (min/max budget, start date, expected completion)
- Document Upload (initial brief, scope documents)

**Post-Creation:**
- Project auto-assigned a unique ID
- Status set to "NEW"
- Client account auto-created or linked
- Welcome email notification sent to client

---

### Step 4 — Assign Team
**Functionality:**
- Team Allocation (search and assign team members)
- Role Assignment per project (Architect, Designer, Engineer, Project Manager)
- Workload View (see current assignments per member to avoid overload)

**Rules:**
- Each project must have at least one Project Manager
- Team members can be assigned to multiple projects simultaneously
- Assignment triggers a notification to the assigned team member

---

### Step 5 — Manage Project Stages
**Functionality:**
- Stage Update (manually advance or revert stage)
- Progress Tracking (percentage completion per stage)
- Milestone Management (define and check off milestones within each stage)
- Document upload per stage
- Request client approval before advancing stage

---

### Step 6 — Communication & Approval
**Functionality:**
- Send Notifications to clients (stage updates, action required alerts)
- Approval Requests (formal request sent to client to review and approve)
- Comments & Feedback management (threaded conversations per project)

---

### Step 7 — Document Management
**Functionality:**
- Upload Documents (drag-and-drop, multi-file support)
- Version History (track all versions of each document)
- Access Control (set visibility: internal only vs. client-visible)
- Document categorization by stage and type

---

### Step 8 — Project Completion
**Functionality:**
- Final Files compilation and organization
- Handover Docs delivery to client
- Project Closure (archive project, generate final report)
- Post-project client rating and feedback collection

---

## 6. Client Workflow

### Step 1 — Client Login
- Secure login to dedicated client portal
- Separate login URL or subdomain from admin panel
- Post-login access:
  - View Assigned Projects only (scoped to their projects)
  - Notifications
  - Profile Management

---

### Step 2 — Client Dashboard
**Overview showing:**
- Project Progress % (visual progress bar per stage)
- Timeline Overview (Gantt-style stage timeline)
- Recent Updates (latest activity on their projects)
- Unread Notifications badge

---

### Step 3 — Project Timeline
**Visual timeline displaying:**
- All 8 lifecycle stages
- Stage Status (completed, in-progress, pending)
- Start & End Dates per stage
- Milestone Tracking within each stage

**UI:** Horizontal timeline with stage nodes, color-coded by status.

---

### Step 4 — Review & Approval
**Functionality:**
- View Drawings and documents uploaded by the team
- Approve (triggers stage advancement)
- Reject (triggers revision request with mandatory comment)
- Add Comments (annotate specific documents or stages)

**Rules:**
- Client cannot approve their own feedback
- Approval triggers automatic notification to admin team
- Rejection requires a comment explaining the reason

---

### Step 5 — Document Center
**Functionality:**
- Access all project documents organized by stage and type
- Document categories:
  - Drawings & Plans
  - Reports
  - Contracts
  - Final Documents
- Download individual files or entire stage packages

---

### Step 6 — Messages & Feedback
**Functionality:**
- Send Messages directly to the project team
- Feedback History (view all past feedback and responses)
- Discussion Thread (threaded conversation per project)

---

### Step 7 — Final Review & Feedback
**Functionality:**
- Final Confirmation of project completion
- Project Rating (1–5 stars)
- Client Feedback (open text review)
- Download final handover package

---

## 7. Core Modules

| Module | Description |
|---|---|
| **Project Management** | Create, update, manage, and archive architecture projects |
| **Task & Milestone** | Define tasks within each stage; track milestone completion |
| **Team Management** | Manage team members, roles, assignments, and workloads |
| **Client Management** | Manage client accounts, contacts, and project associations |
| **Document Management** | Upload, version, categorize, and access-control project documents |
| **Approval Workflow** | Structured review and approval chain for stage advancement |
| **Communication** | In-app messaging, comments, and feedback threads |
| **Reports & Analytics** | Project progress reports, team performance, approval timelines |
| **Notifications** | Real-time and email notifications for all key events |
| **Settings** | Platform configuration, branding, user preferences |

---

## 8. Key Features

| Feature | Description |
|---|---|
| **Real-time Project Tracking** | Live status updates across all project stages |
| **Stage-wise Progress** | Visual progress indicators per stage with percentage |
| **Document Version Control** | Track document revisions with full history |
| **Role-based Access** | Granular permissions by user role |
| **Mobile Responsive** | Fully responsive across desktop, tablet, and mobile |
| **Audit Trail & History** | Complete log of all actions, changes, and approvals |
| **Secure Data Storage** | Encrypted storage for sensitive project data |
| **Custom Notifications** | Configurable notification preferences per user |
| **Advanced Reporting** | Exportable PDF/Excel reports for projects and analytics |

---

## 9. Notification System

### Notification Triggers

| Event | Recipient | Channel |
|---|---|---|
| Stage Completed | Client + Team | In-App + Email |
| Approval Requested | Client | In-App + Email |
| New Document Uploaded | Client + Team | In-App + Email |
| Feedback Received | Team | In-App + Email |
| Deadline Reminder | Team | In-App + Email |
| Status Changes | Client + Team | In-App |

### Notification Data Model
```js
{
  _id: ObjectId,
  userId: ObjectId,          // Recipient
  projectId: ObjectId,
  type: String,              // "stage_completed" | "approval_requested" | etc.
  title: String,
  message: String,
  isRead: Boolean,
  createdAt: Date,
  link: String               // Deep link to relevant section
}
```

### Real-time Implementation
- Use **Socket.io** for real-time in-app notification delivery
- Maintain persistent notification records in MongoDB
- Email notifications via **Nodemailer** or **SendGrid**
- Notification preferences configurable per user in Settings

---

## 10. Approval Workflow

### Flow Sequence

```
Team Uploads / Updates
         ↓
    Admin Review
    (Internal QA before client sees it)
         ↓
    Client Review
    (Client views documents/drawings)
         ↓
      Approve?
     /        \
   No          Yes
(Request      (Approved)
 Changes)         ↓
    ↓       Move to Next Stage
 Revision
 Requested
    ↓
Team Revises
    ↓
(Loop back to Admin Review)
```

### Business Rules

1. **Admin must review** all documents before forwarding to client
2. **Client approval is mandatory** before stage advancement
3. **Rejection requires a comment** — cannot reject without reason
4. **Approval is stage-locked** — client approves per stage, not globally
5. **Audit trail** — all approval actions are logged with timestamp and user
6. **Concurrent approvals** — if multiple documents in a stage, all must be approved

### Approval Data Model
```js
{
  _id: ObjectId,
  projectId: ObjectId,
  stageNumber: Number,
  documentId: ObjectId,
  requestedBy: ObjectId,      // Admin/Team member
  reviewedBy: ObjectId,       // Client
  status: "pending" | "approved" | "rejected" | "revision_requested",
  comment: String,
  requestedAt: Date,
  reviewedAt: Date,
  revisionCount: Number
}
```

---

## 11. Database Schema Design

### Users Collection
```js
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "admin" | "architect" | "designer" | "engineer" | "project_manager" | "client",
  avatar: String (url),
  phone: String,
  company: String,
  isActive: Boolean,
  notificationPreferences: {
    email: Boolean,
    inApp: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Projects Collection
```js
{
  _id: ObjectId,
  projectCode: String (unique, auto-generated),
  title: String,
  description: String,
  type: String,                        // "residential" | "commercial" | etc.
  location: String,
  clientId: ObjectId (ref: Users),
  teamMembers: [{
    userId: ObjectId,
    role: String,
    assignedAt: Date
  }],
  currentStage: Number (1-8),
  status: String,
  budget: { min: Number, max: Number, currency: String },
  timeline: { startDate: Date, expectedEndDate: Date, actualEndDate: Date },
  stages: [StageSchema],
  isArchived: Boolean,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Documents Collection
```js
{
  _id: ObjectId,
  projectId: ObjectId,
  stageNumber: Number,
  name: String,
  description: String,
  fileUrl: String,
  fileType: String,
  fileSize: Number,
  category: "drawing" | "report" | "contract" | "photo" | "other",
  version: Number,
  previousVersions: [{ version: Number, fileUrl: String, uploadedAt: Date }],
  uploadedBy: ObjectId,
  isClientVisible: Boolean,
  isApproved: Boolean,
  createdAt: Date
}
```

### Messages Collection
```js
{
  _id: ObjectId,
  projectId: ObjectId,
  senderId: ObjectId,
  receiverId: ObjectId,                // or null for broadcast
  message: String,
  attachments: [String],
  isRead: Boolean,
  thread: ObjectId,                    // parent message for threads
  createdAt: Date
}
```

---

## 12. API Architecture

### Base URL
```
/api/v1
```

### Auth Endpoints
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/me
```

### Project Endpoints
```
GET    /api/v1/projects                    — List all projects (admin) / assigned (client)
POST   /api/v1/projects                    — Create new project
GET    /api/v1/projects/:id               — Get project details
PUT    /api/v1/projects/:id               — Update project
DELETE /api/v1/projects/:id               — Archive project
GET    /api/v1/projects/:id/stages        — Get all stages for a project
PUT    /api/v1/projects/:id/stages/:num   — Update a specific stage
POST   /api/v1/projects/:id/team          — Assign team member
DELETE /api/v1/projects/:id/team/:userId  — Remove team member
```

### Document Endpoints
```
GET    /api/v1/projects/:id/documents         — List all documents
POST   /api/v1/projects/:id/documents         — Upload document
GET    /api/v1/projects/:id/documents/:docId  — Get document details
PUT    /api/v1/projects/:id/documents/:docId  — Update document metadata
DELETE /api/v1/projects/:id/documents/:docId  — Delete document
POST   /api/v1/projects/:id/documents/:docId/version — Upload new version
```

### Approval Endpoints
```
GET    /api/v1/projects/:id/approvals         — List approvals for a project
POST   /api/v1/projects/:id/approvals         — Request approval
PUT    /api/v1/approvals/:approvalId          — Approve / Reject / Request revision
GET    /api/v1/approvals/pending              — Get all pending approvals (admin)
```

### User & Team Endpoints
```
GET    /api/v1/users                     — List all users
POST   /api/v1/users                     — Create user
GET    /api/v1/users/:id                 — Get user profile
PUT    /api/v1/users/:id                 — Update user
DELETE /api/v1/users/:id                 — Deactivate user
GET    /api/v1/users/team/workload       — View team workload
```

### Notification Endpoints
```
GET    /api/v1/notifications             — Get user notifications
PUT    /api/v1/notifications/:id/read    — Mark as read
PUT    /api/v1/notifications/read-all    — Mark all as read
DELETE /api/v1/notifications/:id         — Delete notification
```

### Message Endpoints
```
GET    /api/v1/projects/:id/messages     — Get project messages
POST   /api/v1/projects/:id/messages     — Send message
GET    /api/v1/messages/threads/:threadId — Get thread replies
```

### Report Endpoints
```
GET    /api/v1/reports/projects          — Project summary report
GET    /api/v1/reports/team              — Team performance report
GET    /api/v1/reports/approvals         — Approval timeline report
GET    /api/v1/reports/projects/:id      — Individual project report
```

---

## 13. Frontend Architecture

### Application Structure

The frontend application has **two distinct portals** with a shared component library:

1. **Admin Portal** — `/admin/*` routes
2. **Client Portal** — `/client/*` routes

### Routing Structure

```
/                          → Landing / Login
/login                     → Unified Login (role-based redirect)
/admin
  /dashboard               → Admin Dashboard
  /projects                → Project List
  /projects/new            → Create Project
  /projects/:id            → Project Detail
  /projects/:id/stages     → Stage Management
  /projects/:id/documents  → Document Management
  /projects/:id/team       → Team Assignment
  /projects/:id/approvals  → Approval Management
  /projects/:id/messages   → Project Messages
  /team                    → Team Management
  /clients                 → Client Management
  /reports                 → Reports & Analytics
  /notifications           → All Notifications
  /settings                → Platform Settings
/client
  /dashboard               → Client Dashboard
  /projects                → My Projects
  /projects/:id            → Project Overview
  /projects/:id/timeline   → Project Timeline
  /projects/:id/documents  → Document Center
  /projects/:id/approvals  → Review & Approvals
  /projects/:id/messages   → Messages
  /notifications           → Client Notifications
  /profile                 → Client Profile
```

### Page-by-Page Component Breakdown

#### Admin Dashboard
- `<StatsCards />` — Project summary KPIs
- `<PendingApprovalsWidget />` — Approval action queue
- `<DeadlineCalendar />` — Upcoming deadlines view
- `<TeamActivityFeed />` — Recent actions feed
- `<ProjectsQuickList />` — Recent/active projects

#### Project Detail (Admin)
- `<ProjectHeader />` — Title, client, status, actions
- `<StageProgressBar />` — 8-stage visual tracker
- `<StageDetailPanel />` — Active stage details and uploads
- `<TeamPanel />` — Assigned team members
- `<DocumentList />` — Stage-wise document listing
- `<ApprovalStatus />` — Current approval state
- `<MessageThread />` — Project communication

#### Client Dashboard
- `<ProjectProgressCard />` — Progress % with visual bar
- `<TimelineOverview />` — Mini stage timeline
- `<RecentUpdates />` — Latest changes
- `<UnreadNotifications />` — Notification summary

#### Client Project Timeline
- `<HorizontalStageline />` — Visual 8-stage timeline
- `<StageCard />` — Per-stage details with status
- `<MilestoneList />` — Stage milestone checklist

---

## 14. Authentication & Authorization

### JWT Strategy

```
1. User submits credentials → /api/v1/auth/login
2. Server validates → issues Access Token (15min) + Refresh Token (7d)
3. Access Token stored in memory (React state)
4. Refresh Token stored in httpOnly cookie
5. Every API request sends Authorization: Bearer <token> header
6. Token expiry → client silently refreshes via /auth/refresh-token
7. Logout → invalidates refresh token server-side
```

### RBAC Permission Matrix

| Permission | Admin | Project Manager | Architect | Designer | Engineer | Client |
|---|---|---|---|---|---|---|
| Create Project | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Assign Team | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update Stage | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Upload Documents | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View All Projects | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Assigned Project | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve/Reject | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Manage Users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Client Messages | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |

---

## 15. File Storage & Document Management

### Storage Strategy

- **Primary:** AWS S3 for production document storage
- **Alternative:** Cloudinary for image and media assets
- **Local:** Local disk for development environment only

### Upload Configuration

```js
// Multer config (middleware)
const storage = multer.memoryStorage(); // Buffer to S3 directly
const limits = { fileSize: 50 * 1024 * 1024 }; // 50MB max
const allowedTypes = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/dwg'                    // AutoCAD drawings
];
```

### S3 Folder Structure
```
s3://your-bucket/
  projects/
    {projectId}/
      stage-{1-8}/
        documents/
          {documentId}-v{version}.{ext}
        photos/
          {photoId}.{ext}
  users/
    avatars/
      {userId}.{ext}
  handover/
    {projectId}/
      final-package.zip
```

### Version Control Logic

1. First upload → version `1`, stored at base path
2. Subsequent uploads → version incremented, previous version URL archived in `previousVersions[]`
3. Latest version always accessible via `/api/v1/projects/:id/documents/:docId`
4. Historical versions accessible via `/api/v1/projects/:id/documents/:docId/versions`

---

## 16. UI/UX Design Guidelines

### Color Palette

| Role | Color | Hex |
|---|---|---|
| Primary Brand | Navy Blue | `#1B3A6B` |
| Secondary | Deep Green | `#1B6B3A` |
| Accent / CTA | Amber Orange | `#F59E0B` |
| Stage: New | Cornflower Blue | `#3B82F6` |
| Stage: In Progress | Emerald Green | `#10B981` |
| Stage: Design Dev | Violet | `#7C3AED` |
| Stage: Review | Orange | `#F97316` |
| Stage: Documentation | Sky Blue | `#0EA5E9` |
| Stage: Govt Approval | Red-Orange | `#EF4444` |
| Stage: Execution | Amber | `#F59E0B` |
| Stage: Completed | Green | `#22C55E` |
| Background | Off-White | `#F8F9FA` |
| Surface | White | `#FFFFFF` |
| Text Primary | Dark Navy | `#1E293B` |
| Text Secondary | Slate | `#64748B` |
| Border | Light Gray | `#E2E8F0` |

### Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Display / Page Title | Inter | 700 (Bold) | 28–36px |
| Section Heading | Inter | 600 (Semibold) | 20–24px |
| Card Title | Inter | 600 | 16–18px |
| Body Text | Inter | 400 | 14–16px |
| Caption / Label | Inter | 400 | 12px |
| Status Badge | Inter | 600 | 11px |
| Button Text | Inter | 500–600 | 14px |

### Spacing System (Tailwind-aligned)
```
4px  → space-1   (micro gaps)
8px  → space-2   (tight spacing)
12px → space-3   (compact padding)
16px → space-4   (standard padding)
24px → space-6   (section spacing)
32px → space-8   (card gaps)
48px → space-12  (section breaks)
64px → space-16  (major section separators)
```

### Component Design Standards

**Cards:**
- Border radius: `8px` (rounded-lg)
- Box shadow: `0 1px 3px rgba(0,0,0,0.08)`
- Padding: `24px`
- Hover state: elevated shadow `0 4px 12px rgba(0,0,0,0.12)`

**Buttons:**
- Primary: Navy Blue background, white text
- Secondary: White background, Navy Blue border and text
- Danger: Red background, white text
- Border radius: `6px`
- Height: `40px` (standard), `36px` (compact), `48px` (large)

**Status Badges:**
- Pill shape (`border-radius: 999px`)
- Background: 10% opacity of status color
- Text: 100% status color
- Font: 11px semibold, uppercase

**Tables:**
- Alternating row backgrounds (`#F8F9FA`)
- Sticky headers for long lists
- Inline action buttons (Edit, View, Delete)

**Forms:**
- Label above input
- Placeholder text in slate gray
- Error state: red border + red helper text below
- Success state: green border

### Responsive Breakpoints
```
sm:  640px   → Mobile landscape
md:  768px   → Tablet portrait
lg:  1024px  → Tablet landscape / Small desktop
xl:  1280px  → Desktop
2xl: 1536px  → Wide desktop
```

---

## 17. Project Folder Structure

```
architecture-platform/
├── client/                          # React Frontend
│   ├── public/
│   │   └── assets/
│   ├── src/
│   │   ├── api/                     # Axios API service functions
│   │   │   ├── auth.api.js
│   │   │   ├── projects.api.js
│   │   │   ├── documents.api.js
│   │   │   ├── approvals.api.js
│   │   │   ├── notifications.api.js
│   │   │   └── messages.api.js
│   │   ├── components/
│   │   │   ├── common/              # Shared components
│   │   │   │   ├── Button/
│   │   │   │   ├── Card/
│   │   │   │   ├── Badge/
│   │   │   │   ├── Modal/
│   │   │   │   ├── Table/
│   │   │   │   ├── Input/
│   │   │   │   ├── Select/
│   │   │   │   ├── FileUpload/
│   │   │   │   ├── Notification/
│   │   │   │   └── Avatar/
│   │   │   ├── layout/
│   │   │   │   ├── AdminLayout/
│   │   │   │   ├── ClientLayout/
│   │   │   │   ├── AdminSidebar/
│   │   │   │   ├── ClientSidebar/
│   │   │   │   ├── Header/
│   │   │   │   └── Footer/
│   │   │   ├── admin/               # Admin-specific components
│   │   │   │   ├── Dashboard/
│   │   │   │   ├── ProjectCard/
│   │   │   │   ├── TeamCard/
│   │   │   │   ├── StageManager/
│   │   │   │   ├── ApprovalQueue/
│   │   │   │   └── DocumentList/
│   │   │   └── client/              # Client-specific components
│   │   │       ├── ProjectProgress/
│   │   │       ├── StageTimeline/
│   │   │       ├── DocumentViewer/
│   │   │       ├── ApprovalActions/
│   │   │       └── FeedbackForm/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── ResetPassword.jsx
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Projects/
│   │   │   │   │   ├── ProjectList.jsx
│   │   │   │   │   ├── CreateProject.jsx
│   │   │   │   │   └── ProjectDetail.jsx
│   │   │   │   ├── Team/
│   │   │   │   ├── Clients/
│   │   │   │   ├── Reports/
│   │   │   │   ├── Notifications/
│   │   │   │   └── Settings/
│   │   │   └── client/
│   │   │       ├── Dashboard.jsx
│   │   │       ├── ProjectList.jsx
│   │   │       ├── ProjectDetail.jsx
│   │   │       ├── Timeline.jsx
│   │   │       ├── Documents.jsx
│   │   │       ├── Approvals.jsx
│   │   │       ├── Messages.jsx
│   │   │       └── Profile.jsx
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useProjects.js
│   │   │   ├── useNotifications.js
│   │   │   ├── useSocket.js
│   │   │   └── useFileUpload.js
│   │   ├── store/                   # Zustand / Redux state
│   │   │   ├── authStore.js
│   │   │   ├── projectStore.js
│   │   │   └── notificationStore.js
│   │   ├── utils/
│   │   │   ├── axiosInstance.js
│   │   │   ├── formatDate.js
│   │   │   ├── fileHelpers.js
│   │   │   ├── stageHelpers.js
│   │   │   └── validators.js
│   │   ├── constants/
│   │   │   ├── stageConfig.js       # Stage definitions, colors, labels
│   │   │   ├── roles.js
│   │   │   └── routes.js
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   └── components.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                          # Node.js + Express Backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                # MongoDB connection
│   │   │   ├── s3.js                # AWS S3 config
│   │   │   ├── cloudinary.js        # Cloudinary config
│   │   │   └── socket.js            # Socket.io config
│   │   ├── models/
│   │   │   ├── User.model.js
│   │   │   ├── Project.model.js
│   │   │   ├── Document.model.js
│   │   │   ├── Approval.model.js
│   │   │   ├── Notification.model.js
│   │   │   ├── Message.model.js
│   │   │   └── Feedback.model.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── project.controller.js
│   │   │   ├── stage.controller.js
│   │   │   ├── document.controller.js
│   │   │   ├── approval.controller.js
│   │   │   ├── team.controller.js
│   │   │   ├── client.controller.js
│   │   │   ├── notification.controller.js
│   │   │   ├── message.controller.js
│   │   │   └── report.controller.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── project.routes.js
│   │   │   ├── document.routes.js
│   │   │   ├── approval.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── notification.routes.js
│   │   │   ├── message.routes.js
│   │   │   └── report.routes.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js   # JWT verification
│   │   │   ├── rbac.middleware.js   # Role permission check
│   │   │   ├── upload.middleware.js # Multer config
│   │   │   ├── validate.middleware.js
│   │   │   └── errorHandler.js
│   │   ├── services/
│   │   │   ├── email.service.js
│   │   │   ├── notification.service.js
│   │   │   ├── storage.service.js
│   │   │   └── report.service.js
│   │   ├── utils/
│   │   │   ├── generateToken.js
│   │   │   ├── generateProjectCode.js
│   │   │   ├── paginationHelper.js
│   │   │   └── responseHelper.js
│   │   └── app.js                   # Express app setup
│   ├── server.js                    # Entry point
│   ├── .env
│   └── package.json
│
└── README.md
```

---

## 18. Development Phases & Milestones

### Phase 1 — Foundation (Week 1–2)
- [ ] Project setup (Vite + React, Node + Express)
- [ ] MongoDB connection and base models
- [ ] Authentication system (Register, Login, JWT, RBAC)
- [ ] Admin and Client portal routing
- [ ] Base layout components (Sidebar, Header, Layout wrappers)

### Phase 2 — Core Project Management (Week 3–4)
- [ ] Create Project flow (form, validation, API)
- [ ] Project list and detail pages
- [ ] Stage management (update, progress tracking)
- [ ] Team assignment functionality
- [ ] Admin dashboard with summary KPIs

### Phase 3 — Document Management (Week 5–6)
- [ ] File upload system (Multer + S3/Cloudinary)
- [ ] Document list by stage
- [ ] Version control system
- [ ] Document access control (internal vs. client-visible)
- [ ] Document Center (client portal)

### Phase 4 — Approval Workflow (Week 7)
- [ ] Approval request creation
- [ ] Client review and approve/reject UI
- [ ] Approval status tracking
- [ ] Stage advancement on approval
- [ ] Revision request loop

### Phase 5 — Communication & Notifications (Week 8)
- [ ] In-app messaging system
- [ ] Socket.io real-time notifications
- [ ] Email notifications (Nodemailer / SendGrid)
- [ ] Notification preferences settings
- [ ] Comment and feedback threads

### Phase 6 — Client Portal (Week 9)
- [ ] Client dashboard with progress indicators
- [ ] Project timeline view (visual stage tracker)
- [ ] Review & Approval client interface
- [ ] Document Center (client document access)
- [ ] Messages & Feedback interface
- [ ] Final Review & Rating submission

### Phase 7 — Reports & Settings (Week 10)
- [ ] Admin reports (project summary, team performance)
- [ ] Exportable PDF/Excel reports
- [ ] Platform settings page
- [ ] User management (admin panel)
- [ ] Audit trail and activity history

### Phase 8 — QA, Polish & Launch (Week 11–12)
- [ ] Full responsive testing (mobile, tablet, desktop)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance optimization
- [ ] Security review (XSS, CSRF, input sanitization)
- [ ] Production deployment
- [ ] User acceptance testing

---

## 19. Environment Configuration

### Client `.env`
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=ArchPro
VITE_APP_ENV=development
```

### Server `.env`
```env
# App
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/arch_platform

# JWT
JWT_ACCESS_SECRET=your_access_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=arch-platform-docs

# Cloudinary (alternative)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
EMAIL_FROM=no-reply@archpro.com
```

---

## 20. Deployment Guide

### Frontend Deployment (Vercel / Netlify)

```bash
# Build for production
npm run build

# Deploy via Vercel CLI
vercel --prod

# Environment variables required on Vercel:
# VITE_API_BASE_URL → production API URL
# VITE_SOCKET_URL → production Socket URL
```

### Backend Deployment (Railway / Render / AWS EC2)

```bash
# Install dependencies
npm install --production

# Set all environment variables on your hosting platform

# Start server
node server.js

# Or using PM2 (recommended for production)
pm2 start server.js --name arch-platform-api
```

### MongoDB (MongoDB Atlas)
1. Create a cluster on MongoDB Atlas
2. Whitelist your server IP
3. Get the connection string and set `MONGODB_URI` in server env

### Production Checklist
- [ ] HTTPS enabled (SSL certificate)
- [ ] CORS configured for production domain only
- [ ] Rate limiting enabled (express-rate-limit)
- [ ] Helmet.js security headers configured
- [ ] Environment variables secured (not in code)
- [ ] Database connection pooling configured
- [ ] Error tracking enabled (Sentry)
- [ ] Log management configured (Winston / Morgan)
- [ ] CDN configured for static assets
- [ ] Automated backups for MongoDB Atlas

---

## Appendix A — Stage Status Color Reference

| Stage | Status Label | Color Token | Hex |
|---|---|---|---|
| 1 | NEW | blue | `#3B82F6` |
| 2 | IN PROGRESS | green | `#10B981` |
| 3 | DESIGN DEVELOPMENT | purple | `#7C3AED` |
| 4 | REVIEW PENDING | orange | `#F97316` |
| 5 | DOCUMENTATION | sky | `#0EA5E9` |
| 6 | GOVT APPROVAL | red | `#EF4444` |
| 7 | EXECUTION | amber | `#F59E0B` |
| 8 | COMPLETED | green | `#22C55E` |

---

## Appendix B — User Role Summary

| Role | Portal | Scope | Key Capabilities |
|---|---|---|---|
| Admin | Admin | All projects | Full control, user management, reports |
| Project Manager | Admin | Assigned projects | Create & manage projects, assign team |
| Architect | Admin | Assigned projects | Update stages, upload drawings |
| Designer | Admin | Assigned projects | Upload design documents |
| Engineer | Admin | Assigned projects | Upload technical documents |
| Client | Client | Own projects only | View, approve, message, review |

---

*This document serves as the single source of truth for all design, development, and architecture decisions for the Architecture Project Management & Client Tracking Platform.*

*Version: 1.0 | Created: June 2026*
