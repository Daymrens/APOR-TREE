# Apor Family Platform — Phase Dispatches

Paste these into the opencode instance at `D:\PROJECTS\APOR_WEB` after each phase completes.

---

## Phase 2 — Supabase Schema, Auth & Authorization

**Prerequisite:** Phase 1 scaffold is complete and running.

**Context:**
- Supabase hosted project ref: `plvjmcsuwbxlvdqmormj`
- Supabase URL: `https://plvjmcsuwbxlvdqmormj.supabase.co`
- Store credentials in `.env.local` only (never commit):

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://plvjmcsuwbxlvdqmormj.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your anon key>
SUPABASE_SECRET_KEY=<your service_role key>
APP_ENV=development
```

- Existing Firebase data: `D:\PROJECTS\FamilyReunion\members.json` (128 members)

**Tasks:**

1. Install `@supabase/supabase-js` and `@supabase/ssr`

2. Create Supabase client utilities:
   - `src/lib/supabase/browser.ts` (createClient for client components)
   - `src/lib/supabase/server.ts` (createClient for server components/route handlers)
   - `src/lib/supabase/admin.ts` (privileged client using SUPABASE_SECRET_KEY, server-only)

3. Create PostgreSQL migrations in `supabase/migrations/` (use timestamped filenames):

   Tables to create:
   - `families` (id uuid PK, name text, welcome_text text, artwork_path text, created_at, updated_at)
   - `memberships` (id uuid PK, family_id uuid FK families, user_id uuid, role text CHECK role IN ('member','reviewer','admin'), status text CHECK status IN ('active','suspended'), created_at, updated_at, UNIQUE(family_id, user_id))
   - `reviewer_branches` (id uuid PK, membership_id uuid FK memberships, branch_id uuid FK branches, UNIQUE(membership_id, branch_id))
   - `invitations` (id uuid PK, family_id uuid FK families, email text, normalized_email text, intended_role text, inviter_id uuid, expires_at timestamptz, accepted_at timestamptz, revoked_at timestamptz, created_at, UNIQUE(family_id, normalized_email))
   - `branches` (id uuid PK, family_id uuid FK families, slug text, display_name text, partner_label text, display_order int, chapter_story text, version int DEFAULT 1, created_at, updated_at, UNIQUE(family_id, slug))
   - `people` (id uuid PK, family_id uuid FK families, display_name text, nickname text, biography text, deceased boolean DEFAULT false, minor boolean DEFAULT false, visibility text CHECK visibility IN ('public','members','restricted') DEFAULT 'members', publication_state text CHECK publication_state IN ('draft','published','archived') DEFAULT 'draft', verification_state text CHECK verification_state IN ('unconfirmed','confirmed','disputed') DEFAULT 'unconfirmed', version int DEFAULT 1, created_at, updated_at)
   - `person_claims` (id uuid PK, family_id uuid FK families, membership_id uuid FK memberships, person_id uuid FK people, status text CHECK status IN ('pending','approved','rejected'), reviewer_id uuid, reviewed_at timestamptz, created_at, UNIQUE(membership_id) WHERE status='pending')
   - `person_branches` (id uuid PK, person_id uuid FK people, branch_id uuid FK branches, verification_state text DEFAULT 'unconfirmed', reviewer_id uuid, verified_at timestamptz, created_at, UNIQUE(person_id, branch_id))
   - `relationships` (id uuid PK, family_id uuid FK families, source_person_id uuid FK people, target_person_id uuid FK people, kind text CHECK kind IN ('parent_child','partner'), verification_state text DEFAULT 'unconfirmed', reviewer_id uuid, verified_at timestamptz, version int DEFAULT 1, archived_at timestamptz, created_at, UNIQUE(source_person_id, target_person_id, kind) WHERE archived_at IS NULL)
   - `submissions` (id uuid PK, family_id uuid FK families, submitter_id uuid FK memberships, kind text CHECK kind IN ('person_details','branch_affiliation','relationship_create','relationship_remove','profile_claim','photo'), target_person_id uuid, target_branch_id uuid, target_relationship_id uuid, base_version int, proposed jsonb, context_note text, state text CHECK state IN ('draft','submitted','needs_clarification','approved','rejected','withdrawn') DEFAULT 'draft', version int DEFAULT 1, reviewer_id uuid, decision_note text, created_at, updated_at)
   - `submission_revisions` (id uuid PK, submission_id uuid FK submissions, revision_number int, proposed_snapshot jsonb, context_snapshot text, author_id uuid, created_at)
   - `review_decisions` (id uuid PK, submission_revision_id uuid FK submission_revisions, reviewer_id uuid, action text CHECK action IN ('approved','clarification','rejected'), before_snapshot jsonb, after_snapshot jsonb, note text, created_at)
   - `photos` (id uuid PK, person_id uuid FK people, storage_key text, uploader_id uuid, review_state text DEFAULT 'pending', consent_given boolean DEFAULT false, created_at, updated_at)
   - `events` (id uuid PK, family_id uuid FK families, name text, description text, starts_at timestamptz, timezone text DEFAULT 'Asia/Singapore', venue_name text, venue_address text, publication_state text DEFAULT 'draft', version int DEFAULT 1, created_at, updated_at)
   - `rsvps` (id uuid PK, event_id uuid FK events, membership_id uuid FK memberships, response text CHECK response IN ('yes','maybe','no'), note text, version int DEFAULT 1, created_at, updated_at, UNIQUE(event_id, membership_id))
   - `notifications` (id uuid PK, recipient_id uuid FK memberships, type text, submission_id uuid, read_at timestamptz, created_at)
   - `audit_events` (id uuid PK, actor_id uuid, family_id uuid FK families, action text, entity_ids jsonb, request_id uuid, created_at)

4. Enable RLS on every family-data table. Write policies:
   - Members can read published records in their family
   - Members can read own submissions
   - Reviewers can read submissions in their assigned branches
   - Admins can read all family data
   - Anonymous cannot read any family data
   - Proposal policies: author + authorized reviewers only

5. Add relationship constraints (as database functions):
   - No self-links (source != target)
   - No duplicate active edges
   - No cross-family links
   - No parent-child cycles (validate in transaction with per-family advisory lock)

6. Implement auth:
   - `src/lib/auth/session.ts`: getMembership(session) — checks auth + active membership
   - `src/lib/auth/permissions.ts`: requireRole('admin'), requireReviewerForBranch(branchId)
   - Disable public signup — only invitation acceptance
   - Invitation flow: email match, family ID, role, expiry

7. Admin bootstrap: document a server-side setup script (not a public endpoint) to create the first admin membership

8. Migration script to import members.json:
   - Read `D:\PROJECTS\FamilyReunion\members.json`
   - Map branches: Panfilo, Feliciano, Pedro, Pablo, Purificasion, Consorcia (+ Joaquin if present)
   - Insert into branches table (7 rows) and people table (128 rows)
   - Insert person_branches relationships
   - Insert parent_child and partner relationships
   - Do NOT import as production — keep in a migration/seed file that only runs locally

9. Write integration tests in `tests/integration/`:
   - Anonymous access denied
   - Suspended member denied
   - Unrelated family member denied
   - Regular member can read published records
   - Reviewer can read submissions in their branch scope
   - Admin can read all
   - Direct DB bypass attempts fail

**Evidence required:**
- `supabase/migrations/` files created
- `.env.local` with placeholder keys
- `npm run build` passes
- Test output showing auth checks

---

## Phase 3 — Profiles, Claims & Review Workflow

**Prerequisite:** Phase 2 complete (schema, auth, RLS working).

**Tasks:**

1. Create Zod validators in `src/lib/validation/`:
   - `person-details.ts`: nickname, biography, deceased, minor, visibility
   - `branch-affiliation.ts`: branch_id, person_id
   - `relationship.ts`: source_person_id, target_person_id, kind
   - `profile-claim.ts`: person_id, context_note
   - `photo.ts`: file type (JPEG/PNG/WebP), max 5MB

2. Server services in `src/server/services/`:
   - `submissions.ts`: create, revise, submit, withdraw, getOne, list (own or reviewer queue)
   - `decisions.ts`: approve, clarify, reject — with version check, transaction, audit
   - `claims.ts`: requestClaim, approveClaim, rejectClaim — enforce uniqueness
   - `relationships.ts`: create, remove — with cycle detection (per-family lock)
   - `notifications.ts`: create, list, markRead

3. API route handlers in `src/app/api/`:
   - `POST /api/submissions` — create typed proposal
   - `PATCH /api/submissions/[id]` — revise draft/clarification
   - `POST /api/submissions/[id]/submit` — submit current revision
   - `POST /api/submissions/[id]/withdraw` — withdraw own proposal
   - `POST /api/submissions/[id]/decision` — approve/clarify/reject (reviewer only)
   - `POST /api/claims` — request person claim
   - `GET /api/submissions` — own proposals or reviewer queue (with filter)
   - `GET /api/submissions/[id]` — authorized proposal detail
   - `GET /api/notifications` — current member notifications
   - `PATCH /api/notifications/[id]` — mark own notification read

4. Implement decision transaction:
   - Lock target rows (SELECT FOR UPDATE)
   - Verify current versions match base_version
   - Apply patch to people/relationships/person_branches
   - Write submission state, review_decision, audit_event
   - Create notification for submitter
   - All in one transaction — if any step fails, all roll back

5. Before/after comparison:
   - `GET /api/submissions/[id]` returns current accepted data + proposed changes
   - Frontend shows side-by-side diff with context note

6. Clarification flow:
   - Reviewer requests clarification with reason
   - Submission moves to `needs_clarification`
   - Submitter sees notification, revises (new revision), resubmits
   - Original form values preserved

7. Replace fixture-driven flows:
   - Connect profile page to real people/relationships data
   - Connect directory to real people data
   - Connect review page to real submissions
   - Keep fictional fixtures as seed data option for local dev

8. Unit tests in `tests/unit/`:
   - Name edits can't confirm relationships
   - Multiple parents/branches work
   - Stale revisions produce VERSION_CONFLICT
   - Reviewer can't approve own submission
   - Submitter can't inject actor/reviewer IDs
   - Claim uniqueness enforced
   - No self-links, duplicate edges, cross-family edges
   - No parent-child cycles

9. Integration tests in `tests/integration/`:
   - Concurrent relationship approvals (one succeeds, one conflicts)
   - Full claim workflow: request → approve → cannot claim again
   - Relationship cycle detection catches loops
   - Direct DB operations bypass application permissions

**Evidence required:**
- API routes created and returning typed responses
- Unit test output (all passing)
- Integration test output (all passing)
- Example: create submission → approve → verify data changed

---

## Phase 4 — Connect Book, Photos & Reunion

**Prerequisite:** Phase 3 complete (profiles, claims, review working).

**Tasks:**

1. Connect Family Book to real data:
   - `GET /api/book/[slug]` serves chapter data from people + relationships + person_branches
   - Filter to published people only, with authorized visibility
   - Pagination: 4 cards per logical page
   - Include relationship labels (parent, partner, child) with verification state
   - Unconfirmed relationships shown with dashed connectors + text label
   - Pending proposals NOT shown in book (only reviewer/author can see)

2. Photo handling:
   - `POST /api/photos` — validate file (JPEG/PNG/WebP, 5MB max)
   - Server-side: decode, check dimensions (max 25 megapixels), strip metadata
   - Re-encode to reasonable size, create portrait derivative (1024px max)
   - Store in private Supabase Storage bucket with opaque keys
   - Original pending + published derivatives both in private bucket
   - `GET /api/photos/[id]` — authorize and return 5-min signed URL
   - Photo review: pending → approved/rejected by reviewer
   - Revoked/hidden photos stop appearing in new responses immediately
   - Abandoned upload cleanup after 7 days (document for future scheduled job)

3. Event/RSVP:
   - `GET /api/events/current` — published reunion details or "To be announced"
   - `PUT /api/events/current` — admin creates/updates event with version check
   - `PUT /api/events/[id]/rsvp` — upsert member's response (yes/maybe/no + note)
   - `GET /api/events/[id]/rsvp` — current member's response
   - `GET /api/organizer/events/[id]/rsvps` — admin-only totals + paginated list
   - Timezone default: `Asia/Singapore` until organizer provides actual zone

4. Organizer tools:
   - `PATCH /api/organizer/branches/[id]` — update branch label/story (version check)
   - `PATCH /api/organizer/invitations/[id]` — revoke invitation
   - `PATCH /api/organizer/memberships/[id]` — suspend/reactivate or change role

5. Frontend pages:
   - `/reunion` — event details, RSVP form, member's current response
   - `/my-profile` — account-person link, claim/new-profile workflow, proposal status
   - `/my-submissions` — saved proposals, clarification messages, resubmit action
   - `/organizer/review` — filterable review queue
   - `/organizer/review/[id]` — before/after comparison, decision, history
   - `/organizer/invitations` — admin invitation management
   - `/organizer/settings` — branch/event configuration

6. Loading/error/empty states:
   - Every data-fetching page shows loading skeleton
   - Network errors show retry button
   - Empty states show next useful action
   - Permission-aware empty states (e.g., "No pending reviews" vs "Not authorized")

7. Connect book navigation:
   - Chapter pages fetch from `/api/book/[slug]`
   - Person deep links resolve to correct page
   - Browser Back/Forward works
   - Mobile chapter selector instead of squeezed tabs

8. Integration tests:
   - RSVP persists across sessions
   - Photo rejected for wrong type/size cannot be retrieved
   - Book shows only published, authorized data
   - Pending proposals don't appear in book

**Evidence required:**
- Book loads real data from Supabase
- Photo upload → review → signed URL flow works
- RSVP creates/updates/persists
- Screenshots of connected book, photo flow, RSVP

---

## Phase 5 — Hardening & Handoff

**Prerequisite:** Phase 4 complete.

**Tasks:**

1. Run full quality checks:
   - `npm run lint` — fix all warnings
   - `npx tsc --noEmit` — zero type errors
   - `npm run build` — production build succeeds
   - `npm run test:unit` — all unit tests pass
   - `npm run test:integration` — all integration tests pass

2. E2E browser journeys in `tests/e2e/`:
   - Invited member signs in, claims/creates profile, submits correction, gets clarification, revises, sees approved result
   - Reviewer sees only authorized queue, cannot approve own submission
   - Directory search: Unicode, nicknames, no results, branch filters, pagination
   - Book: cover/contents/chapter/person links, browser Back, direct URLs
   - Page controls: one page, odd number, empty chapters, four-card boundaries
   - Unknown relationships labeled explicitly, pending proposals hidden
   - RSVP update persists after refresh
   - Photo upload rejection for wrong type/size
   - Session expiry preserves recoverable input

3. Security audit:
   - Verify no private records in public page metadata or logs
   - Verify Supabase secret key never sent to browser
   - Verify RLS denies all unauthorized access
   - Verify photo signed URLs expire and are scope-limited
   - Verify no SQL errors exposed in API responses
   - Verify CSRF protection on mutations
   - Verify rate limiting on invitations, claims, proposals, uploads

4. Responsive/accessibility verification:
   - Screenshots at 360, 768, 1024, 1440px for every page
   - No horizontal overflow anywhere
   - All tasks work without mouse
   - Dialog focus returns to invoking control
   - Reduced-motion mode removes transitions
   - Automated accessibility checks (axe-core)
   - Test at least Chromium and WebKit

5. Cleanup:
   - Remove any demo role switching that appeared in dev
   - Ensure production seeds exclude fictional descendants
   - Verify `.env.local` is in `.gitignore`
   - Verify no credentials in committed files

6. Documentation:
   - `docs/SETUP.md`: local dev setup, env vars, Supabase config
   - `docs/MIGRATIONS.md`: how to run migrations, seed data
   - `docs/REVIEWER_GUIDE.md`: how to review submissions
   - `docs/BACKUP.md`: database and storage backup/restore
   - `docs/IMPLEMENTATION_STATUS.md`: completed features, test results, limitations, next steps

7. Test backup restore:
   - Document Supabase backup availability
   - Test restore in local environment

8. Final verification:
   - All acceptance criteria from contract met
   - Prototype preserved at `D:\PROJECTS\FamilyReunion`
   - No real invitations sent
   - No public deployment

**Evidence required:**
- Lint/typecheck/build output (clean)
- Unit + integration test output (all passing)
- E2E test output
- Security audit checklist completed
- Screenshots at 4 breakpoints
- `docs/IMPLEMENTATION_STATUS.md` written
