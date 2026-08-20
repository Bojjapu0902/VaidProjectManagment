# Vaid — Design System

Architecture Project Management & Client Tracking Platform.
Single source of truth for colour, type, spacing and components. Reference for `Vaid PMS Documentation.dc.html`.

---

## 1. Principles

1. **Navy carries the brand, amber carries action.** Every primary control is navy; amber is reserved for the one thing a user must do next.
2. **Colour means status, never decoration.** The eight stage colours appear on badges, timeline nodes and progress bars — nowhere else.
3. **White surfaces on an off-white page.** Every panel is `#FFFFFF` on `#F8F9FA` with a `#E2E8F0` hairline.
4. **Two shells, one component library.** The team portal is navy, the client portal is green. Everything inside them is the same parts.
5. **Disabled states explain themselves.** A control a user cannot use stays visible and says why in words.

---

## 2. Colour

### Brand & interface

| Token | Hex | Use |
|---|---|---|
| `--color-primary` | `#1B3A6B` | Brand navy, admin sidebar, primary buttons |
| `--color-secondary` | `#1B6B3A` | Client portal shell, approve actions |
| `--color-accent` | `#F59E0B` | CTAs, action-required banners, badge counts |
| `--color-bg` | `#F8F9FA` | Page background, table zebra rows |
| `--color-surface` | `#FFFFFF` | Cards, panels, table body |
| `--color-border` | `#E2E8F0` | All hairlines and input borders |
| `--color-border-strong` | `#CBD5E1` | Disabled toggle track |
| `--color-text` | `#1E293B` | Primary text |
| `--color-text-muted` | `#64748B` | Secondary text, labels |
| `--color-text-subtle` | `#94A3B8` | Disabled text, timestamps |
| `--color-divider-light` | `#F1F5F9` | Row dividers inside cards |

### Stage colours

Sequence colours for the lifecycle. A custom stage must pick from this set — never a free colour picker.

| # | Stage (default template) | Hex | Badge |
|---|---|---|---|
| 1 | Project Initiation | `#3B82F6` | `NEW` |
| 2 | Site Survey & Analysis | `#10B981` | `IN PROGRESS` |
| 3 | Concept Design | `#7C3AED` | `DESIGN DEV` |
| 4 | Preliminary Design | `#F97316` | `REVIEW` |
| 5 | Detailed Design & Documentation | `#0EA5E9` | `DOCUMENTATION` |
| 6 | Approval & Permissions | `#EF4444` | `GOVT APPROVAL` |
| 7 | Construction Support | `#F59E0B` | `EXECUTION` |
| 8 | Final Review & Submission | `#22C55E` | `COMPLETED` |

### Semantic

| Meaning | Hex | Tint (badge bg) |
|---|---|---|
| Success / approved | `#22C55E` · text `#16A34A` | `rgba(34,197,94,0.10)` |
| Warning / pending | `#F97316` · text `#B97309` | `rgba(249,115,22,0.10)` |
| Danger / rejected | `#EF4444` · text `#DC2626` | `rgba(239,68,68,0.10)` |
| Info | `#0EA5E9` | `rgba(14,165,233,0.10)` |
| Danger surface | bg `#FEF2F2`, border `#FECACA` | destructive buttons |

**Badge rule:** pill at 10% tint of its status colour, text in the full colour, `font-weight: 600`, uppercase, `IBM Plex Mono` 9.5–10px, `border-radius: 999px`.

---

## 3. Typography

**Interface:** Inter. **Numerals, codes, dates, IDs:** IBM Plex Mono.

| Role | Family | Weight | Size |
|---|---|---|---|
| Page title | Inter | 700 | 28–36px |
| Section heading | Inter | 600 | 20–24px |
| Panel heading | Inter | 700 | 14.5px |
| Card title | Inter | 600 | 16–18px |
| Body | Inter | 400 | 14–16px |
| Caption / field label | Inter | 400 | 12px |
| KPI figure | Inter | 800 | 28px |
| Code / date / ID | IBM Plex Mono | 400–500 | 10–13px |
| Eyebrow label | Inter | 600–700 | 10.5–11px, uppercase, `letter-spacing: 0.04–0.08em` |

Page titles and KPI figures use `letter-spacing: -0.01em`. Body line height 1.6–1.65.

---

## 4. Spacing & shape

Tailwind-aligned scale: **4 · 8 · 16 · 24 · 32 · 48 · 64**px.

| Use | Value |
|---|---|
| Micro gaps (icon to label) | 4–8px |
| Standard padding | 16px |
| Card padding | 20–26px |
| Card gaps | 16–32px |
| Section breaks | 48px |
| Major separators | 64px |

**Radius:** dashboard panels and KPI cards `14px` · inner cards, buttons, inputs `6–8px` · badges and toggles `999px`.

**Elevation:** one level only — `0 1px 3px rgba(15,23,42,0.06)`. No stacked shadows, no glows.

---

## 5. Components

### Buttons

| Variant | Fill | Border | Text | Height |
|---|---|---|---|---|
| Primary | `#1B3A6B` | — | `#FFF` | 40px |
| Secondary | `#FFF` | `#1B3A6B` | `#1B3A6B` | 40px |
| Accent CTA | `#F59E0B` | — | `#FFF` | 40px |
| Approve | `#1B6B3A` | — | `#FFF` | 40px |
| Danger | `#EF4444` / `#FEF2F2` | — / `#FECACA` | `#FFF` / `#DC2626` | 40px |
| **Disabled** | `#F8F9FA` | `#E2E8F0` | `#94A3B8` | 36px |

Radius 6px, `font-weight: 500–600`, 13–14px. **The disabled treatment above is the only disabled treatment** — never dim an active-coloured button with opacity.

### Form fields

Border `1px #E2E8F0`, radius 6px, padding `10px 12px`, 14px text. Focus/filled border `#1B3A6B`, valid `#1B6B3A`, error `#EF4444` with a `#EF4444` message below at 11.5px. Label above at 12px `#64748B`; required marked with a red `*`.

### Toggle

Track 32×17 or 34×19, radius 999px. On `#1B3A6B` (or `#1B6B3A` in the client portal), off `#CBD5E1`, disabled off at `opacity: 0.5`. Knob is a white circle inset 2px.

### Table

Header row `#F8F9FA` with `#E2E8F0` bottom border, 11px `font-weight: 600` `#64748B` labels. Body rows alternate white / `#F8F9FA`, divided by `#F1F5F9`. Row actions live in a trailing column as 28×28 bordered squares. Sticky header on long lists.

### Progress bar

Track `#F1F5F9`, height 6–10px, radius 999px, fill in the active stage colour.

### Avatar

Circle 26–34px, initials at 10–12.5px `font-weight: 600–700`, white on `#1B3A6B` (PM), `#64748B` (team), `#F59E0B` (admin), `#22C55E` (client). Overlap stacks by `margin-left: -6px`; overflow shown as `+N` on `#F1F5F9`.

### Stage tracker

The signature element, identical in both portals. One node per stage: 34px circle, 3px white border, filled in the stage colour — a `✓` when complete, the stage number when active or future (`#E2E8F0` with `#94A3B8` text when future). Connector is a 2px line, green when passed, stage-coloured when current, `#E2E8F0` when ahead. Label beneath at 10.5px, `font-weight: 700` on the current stage.

---

## 6. Shells

### Admin — navy

236px sidebar, `#1B3A6B`. Amber 34px brand mark, wordmark, `TEAM WORKSPACE` eyebrow. Nav grouped **Overview** (Dashboard, Projects, Team, Clients) · **Workspace** (Approvals, Messages, Reports, Notifications) · **System** (Settings). Items 13.5px at 72% white; active item `rgba(255,255,255,0.10)` with a 3px `#F59E0B` left border. Counts as amber pills. User block pinned bottom.

Topbar: white, `18px 32px`, greeting (21px/700) plus context line, then search, bell with red dot, and one primary action.

### Client — green

Same 236px structure in `#1B6B3A`, eyebrow `CLIENT PORTAL`, active border `#FFD166`. Nav grouped **My projects** · **Workspace** · **Account**. Dashboard opens on a gradient hero — `linear-gradient(135deg,#1B6B3A,#134E2A)` — carrying stage, percentage and a white progress bar.

Larger type, one action at a time, and no internal QA, fee data or other clients' work ever rendered.

---

## 7. Responsive

| Breakpoint | Behaviour |
|---|---|
| ≥1280px | Full layout, sidebar expanded |
| 1024–1280px | KPIs 2-up, sidebar collapses to icons |
| 768–1024px | Single column, tables become cards |
| <768px | Mobile: sidebar → bottom tab bar (Dashboard, Projects, Messages, Notifications, Profile); project sub-pages push as stack screens |

Approval decision buttons must stay above the fold at 375px. Stage trackers scroll horizontally and snap to the active stage.

---

## 8. Do not

- Introduce a colour outside this document.
- Use a stage colour for anything other than stage status.
- Add a second elevation level or a gradient outside the client hero.
- Ship an enabled destructive control whose caption says it is unavailable.
- Use colour alone as a signal — unread state is a tint **and** a dot.
- Give one field two different editors in two different places.
