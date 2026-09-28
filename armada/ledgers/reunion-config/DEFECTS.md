# Defect Ledger — reunion-config

## DEF-001: Admin config page silently blank on get-config failure

- Status: OPEN
- Severity: MEDIUM
- Found by: qa
- Phase: 4

Steps to reproduce:
1. Launch app at http://localhost:3000/admin/config while the backend get-config call fails (e.g. Firestore 503).
2. Observe the admin config page.

Expected: An error card with a Retry button (or the page loads fine).
Actual: The page is silently blank with no error indication.
Screenshot: armada/screenshots/reunion-config/admin-360.png

History:
- qa: opened
- qa: retested Phase 4b — NOT fixed. Page still blank (only sidebar renders; no skeleton, no error card, no Retry). Error card + Retry exist in src/app/admin/(dashboard)/config/page.tsx but never render. Additionally the page fires an unbounded fetch loop (26x GET /api/admin/get-config in a 5s window) while the backend 503s — see DEF-003.
- qa: retested Phase 4c — STILL OPEN. With current code (single load() + error card + Retry): page reloads ~14x/sec (145 framenavigated events in a 10s window, all 200 to same URL), get-config fired 54x in 10s (measured twice: 48, 54, 55 in three runs), error card NEVER renders (0x "Could not load config" text, 0 Retry buttons). Root cause: full-document reload storm, not the load() callback — page.tsx fires exactly one fetch per mount. Home page also loops (17-28x /api/config in 10s vs expected 1). Console shows "[Fast Refresh] rebuilding" each cycle — dev-server reload loop. Screenshots: armada/screenshots/reunion-config/admin-retest-1440.png, admin-retest-360.png.

## DEF-002: Firestore 503s on config reads

- Status: OPEN
- Severity: HIGH
- Found by: qa
- Phase: 4

Steps to reproduce:
1. Launch app at http://localhost:3000.
2. GET http://localhost:3000/api/config.

Expected: 200 with config JSON, served via public route with CDN Cache-Control header (mitigation: public /api/config route with CDN cache).
Actual: 503 Server Unavailable from Firestore backend.
Screenshot: (none)

History:
- qa: opened
- qa: retested Phase 4b — NOT fixed. GET /api/config -> 503, body {"error":"Firestore quota exceeded. Try again after the daily reset."}, no Cache-Control header. GET /api/rsvp-count -> 503 same error. GET /api/admin/get-config -> 503 same error. POST /api/admin/update-config works (200 {"ok":true}) — write path unaffected. Mitigation (public route + CDN cache) not present.
- qa: retested Phase 4c — still OPEN (backend quota condition persists, not re-verified to save Firestore reads). Note: /api/config is now hit 17-28x per 10s from the home page due to the app-wide reload storm (see DEF-003) — the reload loop actively compounds quota exhaustion beyond the single read per page load the route was designed for.

## DEF-003: Admin config page fires unbounded get-config fetch loop on backend failure

- Status: OPEN
- Severity: MEDIUM
- Found by: qa
- Phase: 4

Steps to reproduce:
1. Login as admin; open http://localhost:3000/admin/config while GET /api/admin/get-config fails (e.g. Firestore 503).
2. Watch network activity (DevTools / playwright request listener).

Expected: A single fetch attempt, then an error card with Retry.
Actual: GET /api/admin/get-config is re-fetched continuously — 26 requests in a 5-second window, page never settles, error card never renders. Compounds backend load/Firestore quota exhaustion.
Screenshot: (none)

History:
- qa: opened (found during Phase 4b DEF-001 retest)
- qa: retested Phase 4c — fetch loop CONFIRMED, mechanism corrected. 54x GET /api/admin/get-config in a 10s window (measured three runs: 48/54/55). However page.tsx is single-fetch (verified: one load() per mount); the requests come from a full-document reload storm — 145 framenavigated events / 145 document 200s to the same URL in 10s (~14/sec). Page reloads BEFORE React can render the error card (0x error card text). Home page shows the same app-wide reload loop (17-28x /api/config in 10s vs expected 1). Console logs "[Fast Refresh] rebuilding" every cycle — consistent with a next dev HMR/reload loop, not a client-side fetch loop. Loop compounds backend load as previously reported.
