# PROJECT.md — שכבת ז׳ Website

## What This Is
A grade-wide website for שכבת ז׳ at Ben Gurion Middle School, Herzliya.
Built by Nir Oz-Ari (homeroom teacher, ז׳2).

Each of the 5 classes gets its own page with identical sections, managed independently
by its homeroom teacher. A shared hub page links to all classes.

## Hosting
- **GitHub:** https://github.com/niroari/shichva
- **Live URL (Vercel):** https://shichva.vercel.app (auto-deploys on every push to main)
- **Grade hub:** https://shichva.vercel.app
- **Per-class:** https://shichva.vercel.app/kita2, /kita3, /kita4, /kita5, /kita6

## Classes
- ז׳2 — Nir Oz-Ari (project owner)
- ז׳3, ז׳4, ז׳5, ז׳6 — other homeroom teachers (to be onboarded)
- ז׳1 — special education, may need a different solution (deferred)

## Tech Stack
- **Framework:** Next.js (App Router), React, TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Firebase Firestore + Firebase Authentication
- **Hosting:** Vercel (auto-deploy from GitHub)

## Firebase
- **Project:** new dedicated Firebase project (separate from kita2's `kita-3017b`)
- **Firestore structure:** `classes/{classId}/announcements`, `classes/{classId}/events`, etc.
- **Auth:** one email+password account per teacher — each can only write to their own class
- **Security rules:** public read; write only if authenticated AND writing to own class

### Collections (per class, under `classes/{classId}/`)
| Collection | One document per | Key fields |
|---|---|---|
| `announcements` | announcement | `order`, `date`, `title`, `body`, `important` |
| `events` | event | `date` (Timestamp), `title`, `time`, `category`, `endDate` (Timestamp, optional) |
| `schedule` | lesson row | `order`, `period`, `time`, `sun`–`fri`, `type` |
| `seating` | desk row | `order`, `desk1_right/left` … `desk4_right/left` |
| `teachers` | teacher | `order`, `name`, `subject`, `role`, `phone`, `email` |

## Architecture
- Single Next.js app, single Vercel deployment
- Dynamic route: `app/[classId]/page.tsx` handles all class pages
- Grade hub: `app/page.tsx`
- Admin: `app/[classId]/admin/page.tsx` (auth-protected)
- Shared components used across all classes

## Sections (per class page)
1. **הודעות** — Announcements
2. **אירועים** — Events (monthly view, category filter)
3. **מורים** — Teachers (expandable cards, contact info)
4. **מערכת שעות** — Weekly schedule (sticky columns on mobile)
5. **מקומות ישיבה** — Seating chart (drag-and-drop)

## Build Plan

### Phase 0 — Decisions ✅
- [x] Repo name: `shichva`
- [x] URL: `shichva.vercel.app`
- [x] 5 classes (ז׳1 deferred — special ed)
- [x] New Firebase project (clean slate)
- [x] One shared Firebase project, Firestore sub-collections per class
- [x] One Vercel deployment, dynamic routing

### Phase 1 — Project Bootstrap
- [ ] Create Next.js app (TypeScript, Tailwind, App Router)
- [ ] Install and configure shadcn/ui
- [ ] Create GitHub repo and push
- [ ] Connect to Vercel

### Phase 2 — Firebase Setup
- [ ] Create new Firebase project
- [ ] Enable Firestore + Authentication
- [ ] Write security rules (per-class write isolation)
- [ ] Add Firebase config to Next.js app

### Phase 3 — Grade Hub (Home Page)
- [ ] Build `/` landing page
- [ ] Class cards linking to `/kita2` … `/kita6`
- [ ] Header: שכבת ז׳ branding

### Phase 4 — Class Page Shell
- [ ] Dynamic route `app/[classId]/page.tsx`
- [ ] Tab navigation (5 sections)
- [ ] Shared layout component
- [ ] Loading + error states

### Phase 5 — The 5 Sections
- [ ] הודעות — Announcements
- [ ] אירועים — Events
- [ ] מורים — Teachers
- [ ] מערכת שעות — Schedule
- [ ] מקומות ישיבה — Seating chart

### Phase 6 — Admin Panel
- [ ] Auth gate at `/[classId]/admin`
- [ ] Admin UI for each section
- [ ] Per-teacher login → scoped to their class only

### Phase 7 — Migration
- [ ] Migrate ז׳2 data from `kita-3017b` into new Firestore structure
- [ ] Verify live data renders correctly

### Phase 8 — Launch
- [ ] Final review of ז׳2 page
- [ ] Set up teacher accounts for other classes
- [ ] Share grade hub URL

## Relationship to kita2
- `kita2.vercel.app` (the original site) stays live until this project is stable
- Once ז׳2 is fully migrated here, the old site can be retired
- Old repo: https://github.com/niroari/kita2
