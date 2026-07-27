# Project Spec — [FAMILY_NAME] Reunion App

## 1. Purpose
A single web app the whole extended family uses before, during, and after the reunion on **[EVENT_DATE]** at **[VENUE]**. No app install, no per-person account creation — one shared family passcode gates the site.

## 2. Tech stack
| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15, App Router, React 19 | Matches existing RagnaSys pattern, deploys clean on Vercel |
| Styling | Tailwind CSS | Fast iteration, pairs with design tokens in doc 03 |
| Data | Firebase Firestore | Free tier is plenty for a family-sized reunion, realtime updates for RSVP counts and gallery |
| File storage | Firebase Storage | Photo/video uploads |
| Access control | Single shared passcode → session cookie, no per-user Firebase Auth | Removes signup friction; this is a closed, trusted group |
| Hosting | Vercel | Zero-config with Next.js |
| Tree rendering | `d3-hierarchy` for layout math + custom React/SVG for rendering | Full control over the "tree spine" visual (see doc 03) |

## 3. Access model
- Landing page asks for a **family passcode** (set once, shared via group chat/invite).
- On success, sets an httpOnly cookie; middleware checks it on every route.
- Admin view (for the person managing RSVPs/schedule) uses a **separate, stronger admin passcode**. Don't build full role-based auth — this is a weekend project, not a SaaS.

## 4. Data model (Firestore)

### `reunion_config` (single document, id: `main`)
```
{
  familyName: string
  eventTitle: string
  eventDates: { start: Timestamp, end: Timestamp }
  venueName: string
  venueAddress: string
  mapEmbedUrl: string
  contactPerson: string
  contactNumber: string
  parkingNotes: string
  coverImageUrl: string
  passcodeHash: string
  adminPasscodeHash: string
}
```

### `rsvps`
```
{
  id: auto
  familyBranch: string        // which branch/lineage they belong to — links to family_members.branch
  respondentName: string
  attending: "yes" | "no" | "maybe"
  guestCount: number
  guestNames: string[]
  dietaryNotes: string
  contactNumber: string
  submittedAt: Timestamp
}
```

### `family_members`
```
{
  id: auto
  fullName: string
  nickname: string
  generation: number           // 0 = root couple, increments per generation down
  branch: string                // top-level branch label for color-coding, e.g. eldest child's name
  parentIds: string[]           // empty for generation 0
  spouseId: string | null
  birthOrder: number             // sibling order for consistent left-to-right layout
  photoUrl: string | null
  livingStatus: "living" | "deceased"
  notes: string                  // short bio line, optional
}
```

### `schedule_items`
```
{
  id: auto
  day: number                 // 1, 2, etc. for multi-day reunions
  startTime: string           // "14:00"
  endTime: string
  title: string
  description: string
  location: string
  icon: string                 // key into an icon map (food, game, program, etc.)
}
```

### `gallery_photos`
```
{
  id: auto
  storageUrl: string
  thumbnailUrl: string
  uploaderName: string
  caption: string
  uploadedAt: Timestamp
  approved: boolean            // default true; set false if you want light moderation
}
```

### `trivia_questions` / `trivia_scores`
```
trivia_questions: { id, question, choices: string[4], correctIndex, points }
trivia_scores: { id, playerName, score, completedAt }
```

## 5. Feature specs

### RSVP & headcount
- Public form: name, branch (dropdown populated from `family_members` branches), attending, guest count, guest names, dietary notes, contact number.
- Live counter on the homepage: "142 confirmed, 18 maybe, headcount: 187" — pulls from a Firestore aggregation query, updates in realtime.
- Admin view: table of all RSVPs, filterable by branch, exportable to CSV (client-side, no backend needed).

### Schedule / itinerary
- Timeline view grouped by day, each item shows time, title, location, icon.
- "Happening now / next up" banner if current time falls within the event window (nice touch, not required for MVP).

### Family tree (signature feature — see doc 03 for visual spec)
- Computed layout via `d3-hierarchy`, rendered as custom SVG.
- Tap/click a node → expands a card with photo, nickname, branch, notes.
- Filter by branch to highlight one lineage while dimming others.
- Mobile: collapses to a vertical accordion list grouped by generation, since a wide tree doesn't work on narrow screens — same data, different layout, not a lesser feature.

### Photo/video gallery
- Grid of thumbnails, lightbox on click.
- Upload flow: name + files + optional caption, direct to Firebase Storage, thumbnail generated client-side (canvas resize) to keep storage light.
- No moderation queue needed for MVP unless the family wants it — `approved` field exists for that later.

### Location & logistics
- Embedded map, address, parking notes, contact person block.
- "Getting there" written in plain, practical terms — treat it like the interface voice from doc 03, not a brochure.

### Games / trivia
- Multiple-choice family trivia (questions the organizer writes — e.g. "What year did Lolo and Lola get married?").
- Score saved to `trivia_scores`, simple leaderboard view.
- Optional stretch: icebreaker bingo card (static, printable-style page) — cheap to add, high fun value.

## 6. Build phases
1. **Phase 1 — Core utility:** passcode gate, RSVP form + live counter, schedule, location/logistics. This is what people check *before* the event.
2. **Phase 2 — Gallery:** upload + grid + lightbox. Matters most during/after.
3. **Phase 3 — Family tree:** data entry tooling for `family_members` (a simple admin form is fine — don't hand-write Firestore docs) + the tree visualization itself.
4. **Phase 4 — Games:** trivia + leaderboard, icebreaker page.

Family tree data entry is the most tedious part — flag it early so whoever's collecting names/generations has lead time before the event.
