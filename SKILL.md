---
name: family-event-app-dev
description: Guidance for building small, passcode-gated family/community event web apps (reunions, weddings, anniversaries) — Next.js + Firebase, RSVP tracking, generational family trees, photo galleries, and event logistics. Use for any "family event site" build, not just this reunion — the patterns (shared-passcode access, realtime RSVP counters, d3-hierarchy family trees, mobile-first collapse of wide diagrams) generalize across events.
---

# Family / Community Event App Dev

## When this applies
Small, closed-group event sites: reunions, weddings, anniversaries, barangay fiestas. Distinguishing traits: trusted closed group (no need for full per-user auth), short-lived urgency (built for one event, used intensely for a short window), and a mix of "need to know" utility (RSVP, schedule, location) with "want to explore" content (photos, family history).

## Access pattern: shared passcode, not full auth
Don't build individual sign-up/login for these. One shared passcode per audience tier (attendee vs. organizer/admin) gated behind an httpOnly cookie + middleware check is enough friction-removal without over-engineering auth for a weekend event. Reserve real per-user Firebase Auth for apps where individual identity actually matters (e.g. LendWUs-style financial apps) — it doesn't here.

## Data writes: client-read, server-write
Read access to shared content (schedule, tree, gallery, config) can be public/open since the site itself is passcode-gated at the route level. But writes to shared data (family tree edits, schedule changes) should still go through server routes with the Firebase Admin SDK, not directly from client components — keeps a single choke point for who can alter shared state, independent of the Firestore rules.

## Realtime counters
RSVP/headcount displays should use a live Firestore `onSnapshot` listener, not a page-load fetch — people check this repeatedly in the days before an event and expect the number to already be current without a refresh.

## Family tree rendering
- Model as `parentIds[]` + `spouseId` per member, not a rigid single-parent tree — real families have remarriages, adoptions, multiple children per generation.
- Use `d3-hierarchy` (or equivalent) purely for layout math; render with custom SVG/React so the visual language (node shape, connector style, color-coding) matches the rest of the app's design system instead of a library's default look.
- **Always design a mobile fallback that's a different layout, not a shrunk desktop one** — wide branching trees don't survive a 375px viewport. A generation-grouped vertical accordion/list is the standard fallback; keep the same data and filtering, just a different shape.
- Data entry for the tree is the slowest part of building one of these — build a simple admin form early rather than hand-editing Firestore documents; whoever's collecting family names/generations needs lead time before the event, not after the app is "done."

## Design grounding
Don't default to generic event-site visuals (stock confetti, cream+terracotta AI-default palette). Ground the palette and type in the actual cultural/geographic context of the family — regional colors, materials, or motifs (e.g. woven textures, local flora, heirloom/ledger typography) read as intentional rather than templated. See the `frontend-design` skill for the full process; the family tree or equivalent central artifact is usually the strongest candidate for the page's one signature element.

## Phasing that holds up under real deadlines
1. Utility first: RSVP, schedule, location — this is what people check *before* the event and is the highest-cost-of-failure if missing.
2. Gallery second — matters most during/after.
3. Family tree and games last — highest delight, lowest urgency, and the tree specifically is gated on data entry lead time (see above), so start collecting that data early even if the UI ships later.
