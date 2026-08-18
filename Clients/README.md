# Vaid — Architecture Project Management & Client Tracking Platform

A full-stack-ready **React + Redux Toolkit + Tailwind CSS** web application implementing both the **Admin/Team Portal** and the **Client Portal** described in the project's `instructions.md`. The entire app currently runs on mock data via a swappable Axios service layer — flip one flag and it talks to a real backend with zero component changes.

---

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173/login`. Demo accounts (password for all: `password123`):

| Role | Email |
|---|---|
| Admin / Project Manager (Suresh) | `Suresh@vaid.com` |
| Admin / Architect (Sarika) | `sarika@vaid.com` |
| Client (Haritha) | `meera@client.com` |

---

## Architecture overview

```
src/
├── app/                    # Redux store
│   ├── store.js            # configureStore — combines all reducers
│   ├── authSlice.js        # auth state (user, session) — plain RTK slice
│   ├── uiSlice.js          # sidebar, theme, toast notifications
│   ├── hooks.js            # useAppDispatch / useAppSelector
│   └── api/apiSlice.js     # RTK Query — all server data (projects, docs, approvals...)
│
├── services/                # Axios + mock-aware service layer
│   ├── axiosInstance.js     # configured Axios client (JWT header, 401 handling)
│   ├── mockAdapter.js       # simulates network latency for mock responses
│   ├── authService.js
│   ├── projectService.js
│   ├── documentService.js
│   ├── approvalService.js
│   ├── notificationService.js
│   └── messageService.js
│
├── mocks/                   # Mock datasets (users, projects, documents, etc.)
│
├── components/
│   ├── common/               # Reusable primitives: Button, Card, Badge, Modal,
│   │                          # Table, FormField, FileUpload, StageTracker,
│   │                          # MessageThread, NotificationList, ToastContainer...
│   ├── layout/                # Sidebar, Topbar, AdminLayout, ClientLayout, ProtectedRoute
│   ├── admin/                 # Admin-only composites (StatCard, ApprovalQueueList...)
│   └── client/                # Client-only composites (ProgressHero, ReviewQueueList...)
│
├── pages/
│   ├── auth/LoginPage.jsx
│   ├── admin/                 # 15 admin pages
│   └── client/                # 11 client pages
│
├── constants/                # stages.js, roles.js, routes.js — single source of truth
├── hooks/useAuth.js
├── utils/                     # format.js, validators.js
└── styles/
    ├── tokens.css             # design tokens — CSS variables, edit here to re-theme
    └── index.css              # Tailwind v4 @theme mapping + base/component layers
```

---

## Design tokens — how theming works

All colors, radii, shadows, and typography live in **`src/styles/tokens.css`** as CSS variables. `src/styles/index.css` maps those variables into Tailwind v4's `@theme` block, so both plain CSS (`var(--color-navy)`) and Tailwind utilities (`bg-navy`, `text-stage-3`, `rounded-lg`) stay in sync automatically.

**To re-theme the whole app:** edit `tokens.css` only. Nothing else needs to change.

**Portal-aware theming:** the Admin layout sets `data-portal="admin"` and the Client layout sets `data-portal="client"` on their root `<div>`. `tokens.css` defines:

```css
[data-portal="client"] {
  --color-portal-primary: var(--color-green);
  ...
}
```

Every shared component (Sidebar, Topbar, buttons, stage tracker, etc.) references `var(--color-portal-primary)` instead of a hardcoded brand color, so the same component code automatically renders navy on the admin side and green on the client side.

**Dark mode** is scaffolded (`[data-theme="dark"]` block in `tokens.css` + `setTheme` action in `uiSlice.js`) but not yet wired to a toggle.

---

## State management strategy

| Concern | Tool | Why |
|---|---|---|
| Auth session (user, token) | Redux slice (`authSlice`) | Simple, global, needs to survive across the whole app and persist to `localStorage`. |
| UI state (sidebar, toasts, theme) | Redux slice (`uiSlice`) | Global but UI-only — no server roundtrip. |
| Server data (projects, documents, approvals, notifications, messages) | **RTK Query** (`apiSlice`) | Free caching, loading/error states, automatic refetching via cache tags, and optimistic-mutation support — exactly what a real backend integration needs. |
| Form state | `react-hook-form` (local) | Forms don't need to be global; keeps Redux lean. |

RTK Query's `apiSlice` uses `fakeBaseQuery()` so each endpoint just calls our own service functions (`projectService`, `documentService`, etc.) — which themselves decide whether to hit mock data or real Axios calls. This means RTK Query's caching/tags work identically in mock mode and production mode.

---

## Swapping mock data for a real backend

Every service file follows the same pattern:

```js
// src/services/projectService.js
async getProjects() {
  if (USE_MOCKS) {
    return mockResolve(MOCK_PROJECTS);
  }
  return axiosInstance.get("/projects"); // real call, already wired
},
```

To go live:

1. Set `VITE_USE_MOCKS=false` in `.env`
2. Set `VITE_API_BASE_URL=https://your-api.com/api/v1`
3. Make sure your backend's response shapes match the mock shapes in `src/mocks/*.js` (or adjust the service functions)

**No component, page, or Redux code needs to change.** The RTK Query hooks (`useGetProjectsQuery`, etc.) call the service layer either way.

---

## RBAC

`src/constants/roles.js` defines the permission matrix from the project spec. `ProtectedRoute` (in `components/layout/`) enforces portal-level access (admin roles vs. client role) and redirects mismatched users to their correct portal. Fine-grained permission checks use `hasPermission(role, PERMISSIONS.X)`.

---

## Pages implemented

**Admin / Team Portal (15):** Dashboard, Project List, Create Project, Project Detail, Stage Management, Document Management, Team Assignment, Approval Management, Project Messages, Team Management, Client Management, Reports & Analytics, Notifications, Settings.

**Client Portal (11):** Dashboard, My Projects, Project Overview, Project Timeline, Review & Approval, Document Centre, Messages, Final Review & Feedback, Notifications, Profile.

Every page is wired to the mock data layer through RTK Query — navigate freely, the data is consistent across pages (e.g. a document uploaded in Admin's Document Management shows up in the Client's Document Centre if marked client-visible).

---

## Key reusable components

| Component | Location | Used by |
|---|---|---|
| `StageTracker` | `components/common/` | Admin Project Detail/Stages, Client Overview/Timeline — the signature 8-stage visual |
| `MessageThread` | `components/common/` | Both portals' Messages pages |
| `NotificationList` | `components/common/` | Both portals' Notifications pages |
| `Table`, `Modal`, `FileUpload`, `Badge`, `Card`, `Button`, `FormField` | `components/common/` | Everywhere |
| `Icon` | `components/common/` | Inline SVG icon set — no external font/CDN dependency, so it never breaks under restrictive network policies |

---

## Known limitations (intentional, for a mock-data phase)

- File uploads are simulated — files are not actually persisted anywhere.
- Reports page uses illustrative aggregate numbers in places (clearly marked with code comments).
- Workload counts on Team Assignment are randomized for demo purposes.
- No real-time push — notifications are fetched on page load, not via WebSocket/Socket.io (the original spec's plan). Swapping in Socket.io later would slot into `notificationService.js` without touching components.
