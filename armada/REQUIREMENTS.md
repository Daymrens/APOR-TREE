# Contract: Apor Family Platform — Full-Stack Remake

Status: APPROVED
Commodore: opencode/mimo-v2.5-free
Stack: frontend: nextjs | lang: typescript | backend: supabase

## Goal

Build a private family website that helps Apor relatives identify one another, verify family
connections, and prepare for their first reunion. Replace the existing Firebase prototype with
a Supabase-backed platform featuring invite-only auth, a Family Book experience, a review
workflow for verifying family information, private photo handling, and RSVP management.

## Assumptions (recorded)

- New project at `D:\PROJECTS\APOR_WEB` — fresh scaffold, not in-place rework.
- Existing prototype at `D:\PROJECTS\FamilyReunion` is preserved; key assets copied into new project.
- Firebase data (128 members, 6 branches) migrated to Supabase PostgreSQL.
- Hosted Supabase project: ref `plvjmcsuwbxlvdqmormj`, URL `https://plvjmcsuwbxlvdqmormj.supabase.co`.
- Credentials stored in `.env.local` only, never committed.
- 7 branches from artwork: Pablo, Feliciano, Joaquin, Pedro, Panfilo, Purificasion, Consorcia.
- Design tokens preserved: Cream `#F6EBD3`, Forest `#173F32`, Brown `#603B2B`, Gold `#AA8038`, Paper `#FFFDF8`.
- No public directory, no public signup, no fictional descendants in production.
- Reunion details use "To be announced" until organizer provides actual date/venue.
- No deployment, no real invitations, no paid services until explicitly requested.

## Phases (dependency-ordered)

### Phase 1 -- Scaffold, design system & Family Book UI (no deps)

- [ ] Scaffold Next.js App Router project at `D:\PROJECTS\APOR_WEB` with TypeScript, Tailwind, ESLint.
- [ ] Copy prototype assets (artwork, screenshots) into `public/` of new project.
- [ ] Extract design tokens and typography (Georgia/serif headings, Segoe UI/sans body).
- [ ] Build reusable UI components: buttons, forms, dialogs, badges, cards, loading/empty/error states.
- [ ] Implement desktop navigation (Home, Our family, Family Book, Reunion, My profile) and mobile bottom nav.
- [ ] Port Home page with branch shortcuts and welcome artwork.
- [ ] Port Directory page with search, branch filter, pagination (fictional fixtures).
- [ ] Port Profile page with person details, relationships, verification badges (fictional fixtures).
- [ ] Implement Family Book: cover page, contents page with 7 branch chapters.
- [ ] Family Book chapter pages: branch intro, 4-card logical pages, desktop spreads, mobile single-page.
- [ ] Book pagination (Previous/Next), browser Back support, deep links (`/family-book/[slug]?page=N`).
- [ ] Book person cards with relationship links, uncertain states, unassigned people.
- [ ] Keyboard navigation, focus management, `prefers-reduced-motion` support.
- [ ] Responsive layouts: 360px, 768px, 1024px, 1440px — no horizontal overflow.
- **Success criteria:** Book is usable with fixtures; cover, contents, one complete branch, uncertain
  connection, disconnected person, and mobile pagination all work; original prototype still runs;
  tsc + lint clean; screenshots at 4 breakpoints.

### Phase 2 -- Supabase schema, auth & authorization (depends on Phase 1)

- [ ] Initialize Supabase client config with hosted project credentials.
- [ ] Create PostgreSQL migrations for all tables: families, memberships, reviewer_branches,
  invitations, branches, people, person_claims, person_branches, relationships, submissions,
  submission_revisions, review_decisions, photos, events, rsvps, notifications, audit_events.
- [ ] UUID primary keys, UTC timestamps, foreign keys, family_id scoping on all family records.
- [ ] RLS policies on every family-data table — negative tests before exposing data.
- [ ] Relationship constraints: no self-links, no duplicate active edges, no cross-family,
  no parent-child cycles (validated in transaction with per-family lock).
- [ ] Invite-only auth: no public signup, invitation acceptance, account recovery.
- [ ] Role system: Member, Branch Reviewer, Administrator — with scope checks.
- [ ] Server-only Supabase admin client isolated from browser/client code.
- [ ] Membership checks: active membership required for all data access.
- [ ] Administrator bootstrap documentation (server-side setup action, not a public endpoint).
- [ ] Migration script to import 128 members from `members.json` into Supabase.
- [ ] Separate config seeds (branches, family record) from demo/test data.
- [ ] Integration tests: anonymous, suspended, unrelated-family, member, scoped reviewer, admin access.
- **Success criteria:** Direct unauthorized API/database access is denied; role checks work;
  migration imports real member data; RLS tests pass.

### Phase 3 -- Profiles, claims & review workflow (depends on Phase 2)

- [ ] Typed Zod validators per proposal kind (person_details, branch_affiliation,
  relationship_create, relationship_remove, profile_claim, photo).
- [ ] Draft/revision storage with immutable history (submission_revisions table).
- [ ] New-profile proposals and person correction proposals.
- [ ] Profile claim workflow: member requests claim, reviewer confirms, uniqueness enforced.
- [ ] Branch affiliation proposals with reviewer scope check.
- [ ] Relationship creation/removal proposals with cycle detection.
- [ ] Before/after comparison view for reviewers with contextual notes.
- [ ] Transactional version-checked decisions: approve, clarify, reject — no self-approval.
- [ ] Clarification/resubmission flow with in-app notifications.
- [ ] Audit history (audit_events table) for all decisions.
- [ ] Replace all fixture-driven profile editing and review flows with real services.
- [ ] Unit tests: name edits can't confirm relationships, multiple parents/branches work,
  stale revisions conflict, reviewer can't escalate scope, submitter can't inject actor IDs.
- [ ] Integration tests: concurrent relationship approvals, duplicate claim prevention,
  direct DB bypass attempts.
- **Success criteria:** Suggestions cannot alter accepted data without authorized reviewer;
  unknown facts remain unknown; all proposal types work end-to-end.

### Phase 4 -- Connect Book, photos & reunion (depends on Phase 3)

- [ ] Feed Family Book from real authorized people/relationship data (same as directory).
- [ ] Private photo upload: JPEG/PNG/WebP, 5MB max, server-side validation, metadata stripping.
- [ ] Photo re-encoding, portrait derivative (1024px max), private bucket storage with opaque keys.
- [ ] Photo consent and review workflow, signed URL access (5-min expiry).
- [ ] Revoked/hidden photos stop appearing in new responses immediately.
- [ ] Event/RSVP persistence: create/update reunion details, member RSVP upsert.
- [ ] Unknown date/venue states ("To be announced"), timezone handling (default Asia/Singapore).
- [ ] Organizer settings: branch labels, event details, member management.
- [ ] Request-failure recovery, loading states, accessible announcements, permission-aware empty states.
- [ ] Phone layouts verified with portraits disabled or missing.
- **Success criteria:** Refresh preserves real data; book never leaks pending/private facts;
  photos are access-controlled; RSVP persists across sessions.

### Phase 5 -- Hardening & handoff (depends on Phase 4)

- [ ] Lint, typecheck, production build pass clean.
- [ ] Unit tests, RLS/integration tests, browser e2e journeys all pass.
- [ ] Audit: private API fields, storage access, logs, production bundles, cache behavior.
- [ ] Remove any demo role switching; production seeds exclude fictional descendants.
- [ ] Document: setup instructions, migrations, test commands, reviewer guide, backup/restore.
- [ ] Test backup restore in non-production environment.
- [ ] Write `docs/IMPLEMENTATION_STATUS.md` with completed features, test results, limitations.
- [ ] E2e test scenarios from handoff section 18 (domain, browser journeys, visual/accessibility).
- **Success criteria:** App is locally reviewable; all tests pass; documentation complete;
  ready for separately authorized deployment.

## Final success criteria

1. Existing prototype and reunion artwork preserved in new project.
2. Family Book feels like an album on desktop, readable on mobile.
3. Directory and book share the same person identities and authorized facts.
4. All 7 branch labels and spelling "Gervasio" preserved.
5. No fictional descendants imported into production.
6. Invite-only membership and account recovery work.
7. Person ownership requires a reviewed claim.
8. Field/relationship verification is separate and honest about uncertainty.
9. Review actions are authorized, transactional, version-checked, and auditable.
10. Private records and photos protected at API, database, and storage layers.
11. RSVP persists; unknown event details remain "To be announced."
12. Tests and production build pass with results documented.
13. No real invitations or public deployment without explicit owner request.
