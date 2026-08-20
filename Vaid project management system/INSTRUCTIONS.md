# Vaid — Development Instructions

How to build the Architecture Project Management & Client Tracking Platform.
Read alongside `DESIGN-SYSTEM.md` (visual rules), `ARCHITECTURE.md` (routes, data, API) and `Vaid PMS Documentation.dc.html` (all 26 screens drawn, with per-screen purpose, components and rules).

---

## 1. What this product is for

A ten-person architecture studio runs roughly ten live projects. Two problems cost them time: nobody is certain which drawing revision is current, and client approvals stall invisibly in email. The platform exists to fix both — every document is versioned against a stage, and every approval is a recorded decision with a timestamp and a name against it.

The team gets a working environment. The client gets a walled garden: their own progress, their own documents, their own decisions. Nothing else.

---

## 2. Non-negotiables

These are the rules the product breaks if you get them wrong.

1. **Stages are per project.** Never hardcode eight stages. A project owns its lifecycle, created from a template and edited afterwards. Everything downstream reads from it.
2. **Internal review before the client sees anything.** Admin or PM checks every document. The send-to-client action stays disabled until that passes, and names what is outstanding.
3. **A gated stage cannot advance without a recorded client decision.** Ungated stages complete on the team's own sign-off.
4. **Rejection requires a comment.** The API rejects an empty reason. A client who cannot object easily will approve something they are unhappy with, and the studio pays for that on site.
5. **Documents default to internal.** Client visibility is a deliberate act. Internal files are absent from the client's API response, not hidden in the UI.
6. **Permissions are server-side.** The UI mirrors them by not rendering the action at all.
7. **Nothing is hard-deleted.** Soft-delete projects, users and documents so history and the audit trail survive.
8. **A field has one editor.** Editing a project opens the creation form in edit mode — never a separate one-off form.

---

## 3. Content & copy

- **Say what is blocked and who holds it.** The principal's question is never "how is the project doing" — it is "what is stuck". Flags are columns, not charts.
- **Write the client's copy in plain language.** "The team is producing working drawings — the technical set a contractor builds from." Not "Stage 5: DD documentation."
- **Future dates are months, never precise days,** and labelled "expected".
- **State revision rounds plainly.** They explain slipped dates; hiding them makes the studio look late for no reason.
- **Disabled controls explain themselves in words.** "Send to client — 2 checks outstanding", not a greyed button with a tooltip.
- No filler metrics. If a number does not change a decision, leave it out.

---

## 4. Frontend conventions

```
src/
  layouts/        AdminLayout, ClientLayout
  components/     shared library — Button, Input, Badge, Table, Toggle,
                  StageTracker, ProgressBar, Avatar, FileUpload, Stepper
  features/
    auth/         Login, ResetPassword, useAuth
    projects/     list, create wizard, detail, StageManager, StageBuilder
    documents/    DocumentList, DocumentViewer, VersionHistory
    approvals/    ApprovalQueue, ApprovalChain, ApprovalActions
    messages/     MessageThread, ThreadList
    notifications/
    reports/
  hooks/          useSocket, useNotifications, useFileUpload
  lib/            api client, zod schemas, stageHelpers, format
```

- One shared component library for both portals. The shells differ; the parts do not.
- Wizard steps validate **on continue**, not on blur — a half-typed field must never nag.
- Filters and tabs live in the URL so a filtered list or a specific tab can be shared.
- Skeleton cards while loading. Never a full-page spinner.
- Every list needs three states designed: empty, loading, error.
- Derive project progress as completed stages ÷ total, plus the active stage's own percentage.

---

## 5. Backend conventions

- Validate every request body with the same zod schemas the client uses.
- Scope every query by the caller's role before it touches the database — never filter in the client.
- `stages[]` arrives with the project on create; validate sequence, minimum two stages, at least one gate.
- Uploads stream to S3 from a buffer. Re-uploading the same filename increments the version and archives the previous key.
- Write an `AuditLog` row for every project, stage, document, approval and settings change — field, previous value, new value, actor, timestamp.
- Emit the socket event and queue the email in the same transaction as the state change.

---

## 6. Security

| Concern | Approach |
|---|---|
| Tokens | 15-min access token in memory, 7-day refresh in an httpOnly cookie. The client never reads a token from storage. |
| Login errors | One banner for wrong credentials — never say which field was wrong. Lock after 5 failed attempts for 15 minutes. |
| Password reset | Always show the same success message whether the email exists or not. Token valid 60 minutes, single use. |
| Role changes | Take effect on the user's next token refresh. Cannot deactivate the last admin. |
| Client scoping | Clients only ever receive projects they are attached to; budget figures gated per client record. |
| Email change | Requires re-verification before it becomes the login. Password change ends other sessions. |
| Uploads | Validate MIME type and 50 MB ceiling server-side. Signed URLs for downloads. |

---

## 7. Accessibility

- Colour is never the only signal — unread state is a tint **and** a dot.
- Every interactive element has a visible focus ring.
- Contrast: text on navy and on the green hero must clear 4.5:1.
- Mobile hit targets minimum 44px.
- Stage colour badges always carry their text label.
- Forms: label every input, associate errors with `aria-describedby`.

---

## 8. Definition of done, per screen

A screen ships when all of these are true.

- [ ] Matches the drawn screen in `Vaid PMS Documentation.dc.html`
- [ ] Uses only tokens and components from `DESIGN-SYSTEM.md`
- [ ] Empty, loading and error states implemented
- [ ] Permissions enforced server-side and mirrored by hiding actions
- [ ] Responsive to 375px; approval decisions above the fold
- [ ] Notifications fire with correct deep links
- [ ] Audit entries written for every mutation
- [ ] Keyboard-navigable with visible focus
- [ ] No console errors

---

## 9. Sample data

Real Vaid projects, from `uploads/architectureData.json`. Use these when seeding.

| Code | Project | Location | Type | Client |
|---|---|---|---|---|
| VA-24-07 | NandhaKishore Farmhouse | Maheshwaram | Contemporary farm house, 7 Acres | N. Kishore |
| VA-23-11 | ICHOR Research Block | Turkapally | Research & production, 10.7 Acres | ICHOR |
| VA-25-02 | BDA Apartments | Anekal & Lingapura | High-rise apartments, 50 Acres | BDA |
| VA-25-05 | Manchukonda | Maharashtra | Traditional, 25 Acres | Manchukonda Builders |
| VA-24-01 | Runway - 9 | Gajwel | Restaurant, 2.5 Acres | Runway-9 Hospitality |
| VA-25-09 | Cadbury Industrial Extension | Sri City | Industrial extension, 150 Acres | Cadbury |

Further real projects available in the same file: COCO, Manduva, Thatha Manavadu, US Manduva, Epitome, Rohit Commercial Building, Anand, Satya, Blue Bay, IMark, Kapulappada, Om Prakash Hospital, City Hospital, CCL, Rahul Factory, Kalpataru, PMJVK, Krishna, AYRA.

**Staff names in the documentation are placeholders** — R. Vaid, A. Nair, S. Iyer, K. Rao, D. Deshmukh, P. Mehta, N. Mistry — as are the consultants (Deshmukh & Co, Sahani Associates, Verde Studio, Kale Consultants) and the contractor (Shreeji Construction). Replace with real personnel before any client-facing demo.

---

## 10. Open decisions

Confirm with the studio before building the affected screen.

1. Which stages carry a client gate **by default** in each template? Currently 3, 4, 5 and 8 on the full architectural template.
2. Which templates does the studio actually need? Four named plus blank are documented.
3. Sheet numbering convention. `GFC-201`, `STR-04`, `MEP-11` are placeholders; the real convention changes how the register groups.
4. Can a PM sign off internal review, or must an admin? The chain currently assumes PM is enough.
5. Should clients see budget figures by default? Currently off, switched on per client record.
6. DWG and RVT files cannot preview in a browser. Generate a flattened PDF on upload, or have the team upload both?
