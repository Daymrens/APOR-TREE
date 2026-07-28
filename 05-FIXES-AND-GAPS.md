# APOR-TREE — Fix & Gap List
*Based on evaluation of github.com/Daymrens/APOR-TREE and apor-tree.vercel.app on 2026-07-28.*

**Scope note:** This review is based on `package.json`, `firestore.rules`, `dev.log`, and the route hits visible in the dev log — not a full read of `/src`. Items under "Unverified" need a direct code check before you trust either way.

---

## P0 — Critical, fix today

- [ ] **Rotate both passcodes.** `dev.log` is committed to the public repo and contains the plaintext family passcode (`APOR`) and admin passcode (`DIMEAPOR88`) from console logging during dev. Treat both as burned regardless of what else you do below.
- [ ] **Remove `dev.log` from the repo.** `git rm --cached dev.log`, commit. Add `dev.log` (and any other local-only log files) to `.gitignore`.
- [ ] **Purge it from git history**, not just future commits — the repo is public, so a deleted-but-still-in-history file is still exposed. Use `git filter-repo` (preferred) or BFG Repo-Cleaner, then force-push.
- [ ] **Audit `.gitignore`** for the usual suspects: `.env*`, `.next/`, `node_modules/`, any `*.log`. Confirm no `.env.local` was ever committed — check with `git log --all --full-history -- .env.local`.
- [ ] **Stop logging passcodes server-side.** Find the `console.log` calls in the passcode-verify route printing `passcode received`, `familyHash`, `adminHash`, `computed hash` — remove them or gate them behind a `NODE_ENV === 'development'` check that never ships to a log file that gets committed.

## P1 — Blocking, needed before this is usable

- [ ] **Provision the Firestore database.** Every page load in `dev.log` shows `Database '(default)' not found`. Go to Firebase Console → Firestore Database → confirm a database exists in **Native mode** for the project ID your env vars point to. Currently RSVP, schedule, gallery, and tree all fail silently.
- [ ] **Decide on RSVP read privacy.** `firestore.rules` currently has `rsvps: allow read: if true` — anyone with the family passcode can query every relative's phone number and dietary notes, not just a headcount. Either:
  - (a) keep it open if the family's fine with that, or
  - (b) lock `rsvps` to `read: if false` and add a separate `rsvp_stats` doc (confirmed/maybe/total counts only) that a server route updates on each new RSVP — public-readable, individual records stay private.
- [ ] **Seed `reunion_config`.** Confirm a real document exists at `reunion_config/main` with actual event name, dates, venue, and passcode hashes — not placeholder data.
- [ ] **Build the admin family-member data entry form.** No `/admin/members`-style route appears in the dev log yet. This is the slowest part of the whole project (per the original spec) — don't leave it until last, since whoever's collecting generation/branch data needs lead time before the reunion.
- [ ] **Build CSV export on the admin RSVP table.** In the original spec, not confirmed present.

## P2 — Missing features vs. the original spec

- [ ] **Family tree page (`/tree`)** — not hit anywhere in the dev log, likely not built. This is the signature feature; needs the `d3-hierarchy` layout + mobile collapsed-rail fallback per `03-DESIGN-SYSTEM.md`.
- [ ] **Games/trivia (`/games`, leaderboard)** — same, no evidence yet of these routes.
- [ ] **Live RSVP counter via `onSnapshot`** — confirm it's a realtime listener, not a one-time fetch on page load. People will check this repeatedly in the days before the event.
- [ ] **Branch filter on the tree** — dim-to-30%-opacity + slight scale-down for non-selected branches (not full hide), per the design spec.
- [ ] **Empty states** — gallery with 0 photos, tree with 0 members, RSVP admin with 0 responses. Confirm these have real copy, not a blank screen.
- [ ] **`prefers-reduced-motion` fallback** for the tree's load animation.

## P3 — Polish, do after the above

- [ ] "Happening now / next up" banner on `/schedule`.
- [ ] Icebreaker bingo static page.
- [ ] Confirm design tokens from `03-DESIGN-SYSTEM.md` (balete green, hibiscus, mango, Fraunces/Inter/IBM Plex Mono) are actually wired into Tailwind config, not left as Next.js defaults — the deployed gate page's "Loading..." state didn't give enough to confirm visually.
- [ ] Accessibility pass: visible focus rings in hibiscus, keyboard reachability on tree nodes once built, contrast check on parchment/balete-deep pairs.

## Unverified — check these directly, don't assume

- [ ] Contents of `/src` — component structure, whether it matches `02-STRUCTURE.md`'s folder layout.
- [ ] `storage.rules` — not reviewed this pass; confirm gallery upload rules match the read-open/write-restricted pattern used in `firestore.rules`.
- [ ] Whether writes to `family_members` / `schedule_items` / `reunion_config` actually go through server routes with the Admin SDK, as required by `02-STRUCTURE.md`, or whether something writes client-side despite the rules blocking it (which would just silently fail rather than confirming the pattern is followed).
- [ ] `docs/plans` folder contents — likely has agent-generated implementation notes worth cross-checking against this list for duplicated or conflicting plans.
