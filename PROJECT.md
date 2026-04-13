# PROJECT.md — שכבת ז׳ Website

## What This Is
A grade-wide website for שכבת ז׳ at Ben Gurion Middle School, Herzliya.
Built by Nir Oz-Ari (homeroom teacher, ז׳2).

Each of the 5 classes gets its own page with identical sections, managed independently
by its homeroom teacher via a password-protected admin panel.

## Hosting
- **GitHub:** https://github.com/niroari/shichva
- **Live:** https://shichva.vercel.app (auto-deploys on every push to main)
- **Per-class:** https://shichva.vercel.app/kita1 … /kita5
- **Admin:** https://shichva.vercel.app/kita1/admin … /kita5/admin

## Classes
- kita1 — ז׳1
- kita2 — ז׳2 (Nir Oz-Ari, project owner)
- kita3 — ז׳3
- kita4 — ז׳4
- kita5 — ז׳5

## Tech Stack
- **Framework:** Next.js 16 (App Router), React, TypeScript
- **Styling:** Tailwind CSS + shadcn/ui + custom CSS in `app/globals.css`
- **Backend:** Firebase Firestore + Firebase Auth + Firebase Storage
- **Hosting:** Vercel (auto-deploy from GitHub)

## Firebase
- **Project ID:** shichva-9b284
- **Plan:** Blaze (pay-as-you-go, stays within free tier)
- **Firestore:** `classes/{classId}/{collection}`
- **Storage:** `classes/{classId}/gallery/{filename}` — for gallery photos
- **Auth:** one email+password account per teacher
- **Security rules:** public read; write only if `request.auth != null`

### Firestore Collections (per class, under `classes/{classId}/`)
| Collection | One doc per | Key fields |
|---|---|---|
| `announcements` | announcement | `order`, `date`, `title`, `body`, `important` |
| `events` | event | `date` (Timestamp), `title`, `time`, `category`, `endDate` (optional Timestamp) |
| `schedule` | lesson row | `order`, `period`, `time`, `sun`–`fri`, `type` |
| `emergency_schedule` | lesson row | same fields as `schedule` |
| `seating` | desk row | `order`, `desk1_right/left` … `desk4_right/left` |
| `teachers` | teacher | `order`, `name`, `subject`, `role`, `phone`, `email` |
| `gallery` | photo | `url`, `storagePath`, `caption`, `createdAt` |

### Firestore Meta Docs (under `classes/{classId}/meta/`)
| Doc | Fields | Purpose |
|---|---|---|
| `subjects` | `list: string[]` | Subject palette for schedule editor |
| `students` | `list: string[]` | Student roster for seating editor |
| `emergency` | `visible: boolean` | Whether emergency schedule is shown on site |

## Architecture
- Single Next.js app, single Vercel deployment
- Dynamic route: `app/[classId]/page.tsx` — class public page
- Grade hub: `app/page.tsx`
- Admin: `app/[classId]/admin/page.tsx` (auth-protected, tabbed UI)
- Components split into `components/class/sections/` (public) and `components/admin/tabs/` (admin)

## Class Page Sections
1. **הודעות** — Announcements (important flag = highlighted)
2. **מערכת בחירום** — Emergency schedule (hidden by default, orange styling, toggled from admin)
3. **מערכת שעות** — Weekly schedule (sticky columns on mobile, scrollable)
4. **אירועים** — Events (monthly view, category filter)
5. **מקומות ישיבה** — Seating chart (animated, horizontally scrollable on mobile, print button)
6. **מורים** — Teachers (expandable cards, WhatsApp/email links)
7. **קישורים חשובים** — Quick links with favicons
8. **גלריה** — Photo gallery (carousel with thumbnails + lightbox, hidden if empty)

## Admin Panel Tabs
Each tab has a collapsible "מדריך מהיר" help card with plain-Hebrew instructions.

| Tab | Key features |
|---|---|
| הודעות | Add/edit/delete announcements, important flag |
| אירועים | Add/delete events with date range support |
| מורים | Add/delete teachers |
| מערכת שעות | Drag-and-drop subject palette, inline time editing, copy times from ז׳2 |
| מקומות ישיבה | Drag-and-drop seating grid, student roster sidebar |
| חירום | Visibility toggle, drag-and-drop editor, copy-from-regular button |
| גלריה | Drag-or-click upload, progress bar, delete thumbnails |

## Schedule Editor — Key Behaviors
- Dragging a subject onto an **empty** cell sets it
- Dragging a subject onto a **filled** cell appends with ", " (supports double subjects)
- Dragging "✕ מחק תא" onto any cell clears it
- Schedule times can be copied from ז׳2 via "קבל שעות מלוח הצלצולים" button

## Removing the Emergency Schedule Section
When the emergency is over:
1. In admin → חירום tab → click "הסתר מהאתר" (hides it from students immediately)
2. Optionally delete all rows in the emergency_schedule collection via Firebase console
