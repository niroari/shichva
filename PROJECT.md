# PROJECT.md — אתר כיתה (Single Class Website)

## What This Is
A class website for schools (built for Ben Gurion Middle School, Herzliya).
The site serves students and parents with schedules, announcements, seating charts, teachers list, events, photo gallery, and quick links.
Managed directly by the homeroom teacher via a password-protected admin panel.

## Routing
- **Public Class Page:** `/` (`app/page.tsx`)
- **Admin Panel:** `/admin` (`app/admin/page.tsx`)

## Tech Stack
- **Framework:** Next.js 16 (App Router), React, TypeScript
- **Styling:** Tailwind CSS + shadcn/ui + custom CSS in `app/globals.css`
- **Backend:** Firebase Firestore + Firebase Auth + Firebase Storage
- **Hosting:** Vercel (auto-deploy from GitHub)

## Firebase
- **Firestore:** `classes/{classId}/{collection}` (default `classId`: `kita2` or set via `NEXT_PUBLIC_CLASS_ID`)
- **Storage:** `classes/{classId}/gallery/{filename}` — for gallery photos and announcement attachments
- **Auth:** Email + Password authentication for the teacher/admin
- **Security rules:** Public read; write only if `request.auth != null`

### Firestore Collections (under `classes/{classId}/`)
| Collection | One doc per | Key fields |
|---|---|---|
| `announcements` | announcement | `order`, `date`, `title`, `body`, `important`, `imageUrl`, `fileUrl` |
| `events` | event | `date` (Timestamp), `title`, `time`, `category`, `endDate` (optional Timestamp) |
| `schedule` | lesson row | `order`, `period`, `time`, `sun`–`fri`, `type` |
| `emergency_schedule` | lesson row | same fields as `schedule` |
| `seating` | desk row | `order`, `desk1_right/left` … `desk4_right/left` |
| `teachers` | teacher | `order`, `name`, `subject`, `role`, `phone`, `email` |
| `gallery` | photo | `url`, `storagePath`, `caption`, `createdAt` |

### Firestore Meta Docs (under `classes/{classId}/meta/`)
| Doc | Fields | Purpose |
|---|---|---|
| `settings` | `className: string, schoolName: string, theme: string` | Custom class name, school name, and color theme |
| `subjects` | `list: string[]` | Subject palette for schedule editor |
| `students` | `list: string[]` | Student roster for seating editor |
| `emergency` | `visible: boolean` | Whether emergency schedule is shown on site |

## Public Sections
1. **הודעות** — Announcements (important flag = highlighted)
2. **מערכת בחירום** — Emergency schedule (hidden by default, orange styling, toggled from admin)
3. **מערכת שעות** — Weekly schedule (sticky columns on mobile, scrollable)
4. **אירועים** — Events (monthly view, category filter)
5. **מקומות ישיבה** — Seating chart (animated, horizontally scrollable on mobile, print button)
6. **מורים** — Teachers (expandable cards, WhatsApp/email links)
7. **גלריה** — Photo gallery (carousel with thumbnails + lightbox, hidden if empty)
8. **קישורים חשובים** — Quick links with favicons

## Admin Panel Tabs
| Tab | Key features |
|---|---|
| הודעות | Add/edit/delete announcements, image & PDF attachments |
| אירועים | Add/delete events with date range support and Google Calendar import |
| מורים | Add/delete teachers |
| מערכת שעות | Drag-and-drop subject palette, inline time editing |
| מקומות ישיבה | Drag-and-drop seating grid, student roster sidebar |
| חירום | Visibility toggle, drag-and-drop editor, copy-from-regular button |
| גלריה | Drag-or-click upload, progress bar, delete thumbnails |
| ⚙️ הגדרות | Edit class name, school name, and pick color theme (blue, purple, green, orange, pink) |
