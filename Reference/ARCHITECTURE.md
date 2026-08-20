# Vaid — Application Architecture

Architecture Project Management & Client Tracking Platform.
26 screens · 2 portals · 6 roles · per-project lifecycle.

---

## 1. Stack

| Layer | Choice |
|---|---|
| Frontend | React 18, React Router, Tailwind |
| Forms | react-hook-form + zod |
| Charts | recharts |
| Drag & drop | dnd-kit |
| Realtime | Socket.IO client |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT — 15-min access token in memory, 7-day refresh in an httpOnly cookie |
| Files | S3 (or compatible), direct upload from a buffer, 50 MB per file |
| Email | Transactional provider for invites, approvals and digests |

---

## 2. Portals

One login. The role on the token decides the shell. A client can never reach an `/admin` route; admin screens never render client-scoped queries.

### Shared

| Route | Screen |
|---|---|
| `/login` | SCR-01 Login (`/client/login` is an alias) |
| `/reset-password?token=` | SCR-02 Reset password & first-time invite |

### Admin portal — 14 screens

| Route | Screen |
|---|---|
| `/admin/dashboard` | SCR-03 Admin dashboard |
| `/admin/projects` | SCR-04 Project list |
| `/admin/projects/new` | SCR-05 Create project (5-step wizard) |
| `/admin/projects/:id` | SCR-06 Project detail |
| `/admin/projects/:id/stages` | SCR-07 Stage management |
| `/admin/projects/:id/documents` | SCR-08 Document management |
| `/admin/projects/:id/team` | SCR-09 Team assignment |
| `/admin/projects/:id/approvals` | SCR-10 Approval management |
| `/admin/projects/:id/messages` | SCR-11 Project messages |
| `/admin/team` | SCR-12 Team management |
| `/admin/clients` | SCR-13 Client management |
| `/admin/reports` | SCR-14 Reports & analytics |
| `/admin/notifications` | SCR-15 Notifications |
| `/admin/settings` | SCR-16 Platform settings |

### Client portal — 10 screens

| Route | Screen |
|---|---|
| `/client/dashboard` | SCR-17 Client dashboard |
| `/client/projects` | SCR-18 My projects |
| `/client/projects/:id` | SCR-19 Project overview |
| `/client/projects/:id/timeline` | SCR-20 Project timeline |
| `/client/projects/:id/documents` | SCR-21 Document centre |
| `/client/projects/:id/approvals` | SCR-22 Review & approval |
| `/client/projects/:id/messages` | SCR-23 Messages & feedback |
| `/client/projects/:id/final-review` | SCR-26 Final review & feedback (stage 8 only) |
| `/client/notifications` | SCR-24 Client notifications |
| `/client/profile` | SCR-25 Profile management |

---

## 3. Roles & permissions

Enforced server-side on every route and mirrored in the UI — an action a role cannot perform is **not rendered**, not rendered disabled.

| Permission | Admin | PM | Architect | Designer | Engineer | Client |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Create project | ✓ | ✓ | — | — | — | — |
| Assign team | ✓ | ✓ | — | — | — | — |
| Edit project / lifecycle | ✓ | ✓ | — | — | — | — |
| Update stage progress | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Upload documents | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| View all projects | ✓ | ✓ | — | — | — | — |
| Approve / reject | ✓ | ✓ | — | — | — | ✓ |
| Hide project | ✓ | ✓ | — | — | — | — |
| Delete project | ✓ | — | — | — | — | — |
| Manage users | ✓ | — | — | — | — | — |
| View reports | ✓ | ✓ | — | — | — | — |

Architect, designer and engineer see only their assigned projects and no KPI row. A PM sees only their own projects in every chart.

---

## 4. The lifecycle model

**Stages are per project, not global.** They differ by job — an interior fit-out has no statutory submission, a masterplan has two — so the lifecycle is defined when the project is created (SCR-05, step 3) and edited thereafter in Stage management (SCR-07).

### Templates

| Template | Stages | Note |
|---|---|---|
| Full architectural | 8 | Studio default |
| Interior fit-out | 6 | No statutory stage |
| Consultancy only | 4 | Design to GFC |
| Masterplan | 9 | Two statutory stages |
| Start blank | 0 | Build the stages yourself |

Templates are managed in Settings (SCR-16). **Editing a template never changes a live project** — each project owns its stages.

### Per-stage properties

`name` · `colour` (from the eight system colours) · `description` · `startDate` · `targetDate` · `clientGate` (bool) · `visibleToClient` (bool) · `deriveProgressFromMilestones` (bool) · `milestones[]` · `revisionCount`

### Structural rules

- A project needs at least two stages and at least one client gate.
- Stage dates must run in sequence; the builder flags gaps and overlaps.
- A stage holding documents or a recorded approval can be renamed, recoloured and re-dated but **not removed**.
- Adding a stage inserts it after the selected one and renumbers the rest; the client timeline updates immediately.
- Moving a date warns how many later stages shift and offers to cascade.
- Turning a client gate on mid-project applies from the next advance, never retroactively.
- Custom stages are first-class: same editor, tagged `CUSTOM` in the rail.

---

## 5. Approval workflow

The rule that connects five screens.

```
1  Team uploads or updates                          SCR-08
        ↓
2  Internal review — mandatory (admin or PM)        SCR-10
        ↓
3  Client review                                     SCR-22
        ↓
4  ┌─ Approved ──────────────┐  ┌─ Changes requested ───────┐
   │ Stage complete          │  │ Comment mandatory         │
   │ Next stage opens        │  │ revisionCount++           │
   │ Team notified           │  │ Stage reopens at step 1   │
   │ Record locked           │  │                           │
   └─────────────────────────┘  └───────────────────────────┘   SCR-07
```

**Business rules**

1. Admin or PM must review every document before it reaches the client.
2. Client approval is mandatory before a **gated** stage advances; an ungated stage completes on the team's own sign-off.
3. Rejection requires a comment — the API rejects an empty reason.
4. Approval is stage-locked: a client approves a stage, never the project as a whole.
5. All documents in one request are approved together — no partial approval.
6. One open approval per stage at a time.
7. Every transition is written to the audit trail with actor and timestamp.

Status values: `pending` · `approved` · `rejected` · `revision_requested`

---

## 6. Data model

```
User            _id, name, email, passwordHash, role, phone,
                isActive, invitedAt, lastActiveAt,
                clientMeta { company, portalAccess{ timeline, documents, budget } }

Project         _id, code (generated), title, type, location, description,
                clientId, projectManagerId, teamIds[],
                templateUsed, budgetMin, budgetMax,
                status, currentStage, progressPct,
                isVisible, isArchived, deletedAt,
                rating, feedback

Stage           _id, projectId, order, name, colour, description,
                startDate, targetDate, completedAt,
                clientGate, visibleToClient, deriveProgress,
                progressPct, revisionCount, isCustom

Milestone       _id, stageId, order, title, ownerId, dueDate, isComplete

Document        _id, projectId, stageId, name, category, version,
                s3Key, sizeBytes, mimeType, uploadedById,
                clientVisible, supersededBy, deletedAt

Approval        _id, projectId, stageId, documentIds[],
                status, internalReviewerId, internalPassedAt,
                sentToClientAt, dueDate,
                decidedById, decidedAt, comment, revisionRound

Message         _id, projectId, threadType (client|internal|consultant),
                authorId, body, attachmentIds[], editedAt, readBy[]

Notification    _id, userId, event, title, body, deepLink, isRead, createdAt

AuditLog        _id, projectId, actorId, action, field,
                previousValue, newValue, createdAt
```

---

## 7. API surface

### Auth
```
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
POST   /auth/forgot-password
POST   /auth/reset-password
```

### Projects
```
GET    /projects?status=&stage=&hidden=&page=
POST   /projects                       body includes stages[]
GET    /projects/:id
PUT    /projects/:id
PATCH  /projects/:id/visibility
DELETE /projects/:id                   soft delete, 30-day recovery
```

### Stages & milestones
```
GET    /projects/:id/stages
POST   /projects/:id/stages
PUT    /projects/:id/stages/:num
DELETE /projects/:id/stages/:num
PATCH  /projects/:id/stages/reorder
POST   /stages/:stageId/milestones
PUT    /milestones/:id
DELETE /milestones/:id
```

### Documents
```
GET    /projects/:id/documents?clientVisible=
POST   /projects/:id/documents
POST   /documents/:docId/version
PATCH  /documents/:docId/visibility
DELETE /documents/:docId               soft delete
GET    /projects/:id/documents/package?stage=
```

### Approvals
```
POST   /projects/:id/approvals
PUT    /approvals/:id                  internal pass, send, decide
GET    /approvals?status=&projectId=
```

### People, messages, notifications, reports
```
GET|POST|PUT  /users
GET    /users?role=client
GET    /users/team/workload
POST   /projects/:id/team
GET|POST  /projects/:id/messages
GET    /notifications
PUT    /notifications/:id/read
GET    /reports/projects
GET    /reports/team
GET    /reports/approvals
GET    /stage-templates
```

---

## 8. Notifications

Six events, delivered in-app over the socket and by email where the workflow depends on it. Every notification carries a deep link.

| Event | Recipient | In-app | Email | Deep link |
|---|---|:--:|:--:|---|
| Stage completed | Client + team | ✓ | ✓ | `/projects/:id/timeline` |
| Approval requested | Client | ✓ | ✓ **forced** | `/projects/:id/approvals` |
| New document uploaded | Client + team | ✓ | ✓ | `/projects/:id/documents` |
| Feedback received | Team | ✓ | ✓ | `/projects/:id/messages` |
| Deadline reminder | Team | ✓ | ✓ | `/projects/:id/stages` |
| Status change | Client + team | ✓ | — | `/projects/:id` |

Clients receive only five kinds — nothing about internal QA, team assignment or revisions between team members. Approval reminders resend at 3 and 7 days, then notify the PM instead.

Socket events: `notification:new` · `approval:updated` · `message:new` · `activity:new`

---

## 9. Visibility & deletion

**Project visibility** — one switch on SCR-04 hides a project from the admin dashboard, reports and the client portal at once. The record stays intact and reachable from the project list. Instant and reversible; the client sees no trace. A project cannot be hidden while an approval is open with its client.

**Document visibility** — every file carries `clientVisible`, defaulting to false. Internal files are absent from the client's API response, not hidden in the UI.

**Deletion** — admin only, requires typing the project code, soft delete with 30-day recovery from Settings, after which files are purged. Users and documents are also soft-deleted so history and the audit trail survive.

---

## 10. Build sequence

| Phase | Weeks | Screens |
|---|---|---|
| 1–2 Foundation & projects | 1–4 | SCR-01, 02, 03, 04, 05, 06, 07, 09 |
| 3 Documents | 5–6 | SCR-08, 21 |
| 4 Approvals | 7 | SCR-10, 22 |
| 5 Communication | 8 | SCR-11, 15, 23, 24 |
| 6 Client portal | 9 | SCR-17, 18, 19, 20, 25, 26 |
| 7 Admin & reporting | 10 | SCR-12, 13, 14, 16 |

The eight screens in phases 1–2 are enough to run a project internally. The client portal has no value until documents and approvals exist behind it.
