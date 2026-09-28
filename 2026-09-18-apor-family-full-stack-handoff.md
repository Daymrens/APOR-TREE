# Apor Family Reunion — Full-Stack Implementation Plan and OpenCode Handoff

**Prepared:** 18 September 2026  
**Audience:** OpenCode or another engineer continuing this project  
**Goal:** Build a private family website that helps relatives identify one another, verify family connections, and prepare for their first reunion.  
**Architecture:** A responsive Next.js application backed by Supabase authentication, PostgreSQL, and private object storage. Server-side authorization and database policies protect family information; a review workflow separates suggestions from accepted records. The family tree becomes a browsable Family Book.  
**Proposed stack:** Next.js App Router, React, TypeScript, CSS Modules, Supabase, Zod, Vitest, Playwright, and axe-core.

> This document is self-contained and intended for OpenCode. No Codex, Claude, or proprietary skill plugin is required to implement it. The frontend prototype already exists; the backend and Family Book described here are planned work, not completed features.

---

## 1. Start here

### The owner's request

The family is preparing for its first reunion. Relatives do not yet reliably know who everyone is or how everyone is connected. They need an approachable website for collecting, finding, and checking family information.

The owner approved an Apor-branded, mobile-friendly frontend prototype. They now want a complete frontend-to-backend implementation handoff for OpenCode. Their latest suggestion is that the family tree should feel like a book.

### Confirmed requirements versus proposed defaults

**Confirmed:** Apor identity; seven family branches; directory; profiles; search; relationship exploration; information verification; reunion RSVP; private access for the eventual live system; responsive design; preservation of uncertain information.

**Design direction to implement first:** A Family Book with branch chapters. This develops the owner's suggestion, rather than treating an elaborate animated page-flip simulation as a requirement. Keep the regular directory available.

**Engineering defaults proposed in this document:** Next.js and Supabase; email-based invitations; three permission roles; reviewer-managed publication; in-app review notifications; no public directory. The owner has not independently selected a backend vendor or purchased hosting. Build locally with these defaults unless an existing owner-designated application requires integration. Ask for actual service credentials and deployment destination only when needed.

### Do not lose the existing work

- Existing prototype: `D:/Codex/apor-reunion/website-prototype`.
- Create the production application separately at `D:/Codex/apor-reunion/family-platform`.
- Preserve the prototype and original reunion artwork. Do not overwrite, rename, or delete them.
- Inspect applicable `AGENTS.md` instructions before implementing. None was found directly in `D:/Codex/apor-reunion` during this handoff.
- Do not modify any similarly named project elsewhere on the machine without the owner's instruction.
- Deliver working local increments. Do not publish the site, provision paid services, import real family data, or send real invitations merely because this document describes those eventual capabilities.

### Suggested opening prompt for OpenCode

```text
Read D:/Codex/apor-reunion/docs/plans/2026-09-18-apor-family-full-stack-handoff.md.
Inspect the existing prototype at D:/Codex/apor-reunion/website-prototype.
Implement the new application in D:/Codex/apor-reunion/family-platform, preserving the prototype and artwork.
Start with the Family Book frontend so I can review the book-style experience, then work through the backend and integration milestones.
Use the proposed stack and defaults unless inspection reveals a concrete incompatibility.
Keep uncertain relationships separate from confirmed relationships. Never import fictional sample descendants into production.
Run the stated checks, document actual progress, and leave clear local startup instructions.
Do not deploy or send real invitations until I request that step.
```

## 2. Current implementation and evidence

The current site is standalone HTML, CSS, and JavaScript. It has no framework, package dependency, authentication, database, or persistence.

| Existing file | Purpose |
| --- | --- |
| `D:/Codex/apor-reunion/website-prototype/index.html` | Document shell, navigation, footer, dialog, announcements |
| `D:/Codex/apor-reunion/website-prototype/styles.css` | Responsive visual design and design tokens |
| `D:/Codex/apor-reunion/website-prototype/app.js` | Sample records, routes, directory, profiles, tree, forms, review state |
| `D:/Codex/apor-reunion/website-prototype/assets/apor-family-artwork.jpg` | Existing Apor reunion artwork copied for web preview |
| `D:/Codex/apor-reunion/website-prototype/server.cjs` | Optional loopback-only static preview server |
| `D:/Codex/apor-reunion/website-prototype/check-preview.cjs` | Browser interaction and optional accessibility checks |
| `D:/Codex/apor-reunion/website-prototype/screenshots/` | Desktop, tablet, and phone reference screenshots |
| `D:/Codex/apor-reunion/website-prototype/README.md` | Startup and verification instructions |

Run the existing prototype:

```powershell
Set-Location 'D:/Codex/apor-reunion/website-prototype'
node server.cjs
```

Open `http://127.0.0.1:4173`. Alternatively, open `index.html` directly. If port 4173 is already occupied by this preview, reuse it rather than starting duplicate servers.

Existing routes are hash routes: `#home`, `#family`, `#person/<sample-id>`, `#tree`, `#my-profile`, `#reunion`, and `#review`.

### What works today

- Seven branch shortcuts and a searchable/filterable directory.
- Twenty-one fictional descendants plus an editable demo profile.
- Parent/child navigation and a branch accordion, not yet the proposed book.
- Profile submissions and corrections remain pending until approved.
- Organizer confirmation and clarification requests work in memory.
- Clarification preserves submitted profile values for editing.
- Approved review items retain before-and-after values.
- RSVP, reset, refresh behavior, native dialogs, and escaped text rendering.
- Automated interaction tests passed, including consistency of parent/child links.
- Seven screens checked at 390, 768, and 1440 pixel widths without horizontal page overflow.
- axe WCAG A/AA automated checks passed at those widths. This is not a claim of a complete manual accessibility audit.
- Direct file loading and image rendering were checked.

### Limitations to replace

- All state disappears on refresh; sample status labels are not real verification.
- Anyone viewing the demo can open the organizer interface.
- A person has only one parent pointer and one branch in the demo. Do not carry this simplified data model into production.
- There is no secure photo upload, real account linking, invitation flow, notification delivery, or access-controlled API.
- Prototype code is intentionally compact. Migrate behaviors into maintainable components and services rather than pasting the entire script into one React component.

## 3. Family identity and seed-data rules

Use **Gervasio & Marciana Apor**. The project contains a recorded correction from “Gervacio” to “Gervasio.” Do not revert it.

Preserve these chapter labels and their current order:

| Order | Branch | Partner label from artwork | Slug |
| --- | --- | --- | --- |
| 1 | Pablo | Victoriana | `pablo` |
| 2 | Feliciano | Flora | `feliciano` |
| 3 | Joaquin | Joaquina | `joaquin` |
| 4 | Pedro | Mercedes | `pedro` |
| 5 | Panfilo | Antonia | `panfilo` |
| 6 | Purificasion | Eutiquio | `purificasion` |
| 7 | Consorcia | Basilio | `consorcia` |

These labels come from reunion assets. Preserve the spelling “Purificasion” pending family verification. Artwork establishes presentation labels, not independently verified genealogical evidence.

- Seed the seven branch labels and artwork into production configuration.
- Do not automatically turn artwork labels into confirmed person-to-person relationships.
- Any real ancestor profiles created from these labels begin unconfirmed until reviewed.
- Keep fictional descendants in a separate local/test seed command. Never run that command against production.
- A family member may belong to multiple branches. A person must have one identity record even when they appear in multiple chapters.
- Branch affiliation does not prove a parent/child relationship.

## 4. Product scope

### Release 1

1. Invite-only account access and account recovery.
2. Member directory, search by name/nickname, branch filtering, and profiles.
3. Family Book with chapter navigation and readable relationship cards.
4. Profile claims, new-profile proposals, corrections, and relationship proposals.
5. Reviewer queue with approval, clarification, rejection, and history.
6. Optional private profile photos with consent and review.
7. Reunion details and editable RSVP.
8. Basic organizer tools for invitations, branch labels, event details, and member suspension.
9. In-app review notifications, audit history, and tested backups.

### Defer

Public family search, social feeds, chat, DNA/ancestry imports, automated kinship assertions, payments, ticketing, bulk record merging, GEDCOM import, public photo galleries, automatic email updates, downloadable family books, and elaborate 3D page flipping.

The first book is an interface over accepted records, not a PDF generator. Do not expand the work into an unrelated social network.

## 5. Frontend design system

Keep the welcoming visual identity already established:

| Token | Value / use |
| --- | --- |
| Cream | `#F6EBD3`, book pages and artwork surround |
| Forest | `#173F32`, primary actions and navigation |
| Brown | `#603B2B`, heritage illustration accents |
| Gold | `#AA8038`, decorative rules and bookmarks |
| Paper | `#FFFDF8`, primary canvas |
| White | `#FFFFFF`, form and directory surfaces |
| Body ink | `#243B32` |
| Secondary ink | `#626B61`; recheck contrast on its actual background |
| Headings | Georgia, Times New Roman, serif |
| Body and controls | Segoe UI, system sans-serif |

- Keep headings expressive; body text is at least 16px in the production UI.
- Prefer 48px interactive targets and strong visible keyboard focus.
- Use photos only when consented and available; otherwise use initials.
- Never communicate verification with color alone. Include text and icons.
- Desktop navigation: Home, Our family, Family Book, Reunion, My profile.
- Mobile bottom navigation: Home, Family, Reunion, My profile. Family includes a visible Directory / Family Book switch.
- Keep organizer navigation permission-gated in production. A demo role switch must never appear in the live build.
- Errors explain how to recover; loading states preserve layout; empty states show the next useful action.
- The original artwork can be reused as an image. Do not redraw or modify source Photoshop/Blender files.

## 6. Family Book: the proposed tree experience

### Concept

Present the family as an album you can open and explore. The cover introduces shared roots; the contents lists seven chapters; each chapter introduces a branch and the relatives associated with it. Relationships remain visible as labeled links, not just decorative portraits.

The book is a presentation layer over the same people and relationship records used by the directory. There must not be a second set of family data maintained specifically for book pages.

### Desktop composition, 1024px and wider

```text
Apor family        Home    Our family    Family Book    Reunion

Family Book                          [Find a person] [Contents]
Gervasio & Marciana Apor

[Pablo] [Feliciano] [Joaquin] [Pedro] [Panfilo] [Purificasion] [Consorcia]

       ┌──────────────────────────┬──────────────────────────┐
       │ Pablo & Victoriana      │ Meet this branch         │
       │                         │                          │
       │ Chapter introduction    │ [Initials] Person name   │
       │ A short family story    │ Parent: linked person    │
       │ or honest empty state   │ Connection unconfirmed   │
       │                         │                          │
       │ Branch members          │ More family members      │
       │ and known connections   │ with labeled links       │
       └──────────────────────────┴──────────────────────────┘

           [Previous]       Pages 1–2 of 8       [Next]
```

Use a subtle central seam, restrained paper shadow, cream pages, serif chapter titles, and a small gold bookmark marker. Keep content aligned and readable. No aged textures behind small text, forced perspective, autoplay, sound, or canvas-rendered text.

### Mobile and tablet

- Below 1024px, display one logical page at a time in a normal vertical layout.
- Use a labeled chapter selector instead of squeezing seven tabs into a row.
- Previous/Next buttons and page position stay easy to find; they must not cover content or the bottom app navigation.
- Pages may grow vertically. Never clip stories or shrink names to preserve a fake paper size.
- Touch swiping is optional progressive enhancement, never the only navigation method.
- Maintain the selected person when switching between desktop spread and mobile page layouts.

### Book structure and pagination

1. **Cover:** Existing artwork, title, and “Open our family book.”
2. **Contents:** Seven branches, member counts, and an “Unassigned branch” section if needed.
3. **Chapter introduction:** Branch labels, optional reviewed story, and verification guidance.
4. **People pages:** At most four person cards per logical page. Desktop renders two logical pages as a spread; smaller screens render one.
5. **Connection details:** Open a person detail panel or profile route from any person card. Include parent, partner, and child links that the viewer is allowed to see.

Within a chapter, sort accepted members by display name, then immutable person ID. Do not invent generations or birth order from sample data. Relationship labels explain connections independently of page order. A future verified generational layout can be added later.

- Chapter introduction is logical page 1; person pages follow it.
- Use one-based visible page numbers. Disable Previous at the beginning and Next at the end.
- Chapter changes start at page 1. Next at the end offers an explicit “Next chapter” action rather than silently changing branches.
- Display accepted but unconfirmed relationships with dashed connectors and a text label, where the viewer has permission to see them.
- Pending relationship suggestions are visible only to their submitter and authorized reviewers, in a separate proposal area. They are not book connections.
- Unassigned or disconnected people remain reachable in the directory and contents. Never hide someone because a tree cannot place them.
- Cross-branch links navigate to the same person profile; they do not duplicate identity records.

### Book URLs and accessibility

- Cover: `/family-book`.
- Chapter: `/family-book/pablo?page=1`.
- Person deep link: `/family-book/pablo?person=<uuid>`; resolve the person's current page dynamically.
- Invalid page values reset to the first page; nonexistent chapters show a helpful not-found screen.
- Previous/Next update browser history. Back restores the previous chapter/page.
- Use semantic headings, ordered contents, native links/buttons, and real DOM text.
- Announce the chapter and page range after user navigation. Focus the new page heading without trapping focus.
- Optional keyboard arrows apply only while the book navigation region has focus, not inside inputs or anywhere globally.
- Use a brief 150–220ms opacity transition at most. Respect `prefers-reduced-motion` with an immediate change.
- No page-flip library is required for release 1. Add one only if a reviewed prototype demonstrates a clear benefit without harming accessibility or performance.

### First design checkpoint

Deliver the book with fictional sample records before connecting the backend. Show cover, contents, one complete branch, an uncertain connection, a disconnected person, and mobile pagination. Ask for feedback on the book presentation while continuing independent backend work. Do not treat the owner's suggestion as authorization for expensive visual effects or new paid libraries.

## 7. Screens and routes

| Route | Required behavior |
| --- | --- |
| `/sign-in` | Email sign-in, recovery link, invitation guidance; no public signup |
| `/auth/callback` | Validate provider callback; consume invitation when appropriate; safe local redirect |
| `/` | Authenticated welcome, artwork, branch shortcuts, profile/reunion prompts |
| `/family` | Paginated directory, name/nickname search, branch filter, loading/error/empty states |
| `/people/[id]` | Approved visible details, per-section verification, relationships, correction action |
| `/family-book` | Cover and contents |
| `/family-book/[branchSlug]` | Chapter, pagination, deep-linked person |
| `/my-profile` | Account-person link, claim/new-profile workflow, proposals and their status |
| `/my-submissions` | Saved proposals, clarification messages, resubmit action |
| `/reunion` | Current event details and the member's RSVP |
| `/organizer/review` | Filterable authorized review queue |
| `/organizer/review/[id]` | Before/after comparison, evidence note, decision and history |
| `/organizer/invitations` | Admin-only invitation management |
| `/organizer/settings` | Admin-only branch/event configuration and membership management |

Preserve form input after network failures. Show retry actions. Prevent double submission while a request is in flight, but do not disable a submit button merely because a form is initially invalid.

## 8. Architecture and project organization

Use one Next.js application, not separate frontend and Express deployments. Supabase supplies managed PostgreSQL, Auth, and Storage. Centralize authorization in a server-only data access layer and reinforce it with database row-level security.

```text
Browser
  ├─ Server-rendered pages + interactive client components
  └─ Authenticated route handlers
         └─ Server-only services / validation / authorization
                ├─ Supabase Auth
                ├─ PostgreSQL + RLS + transactional review functions
                └─ Private Storage + short-lived authorized photo URLs
```

Production project root: `D:/Codex/apor-reunion/family-platform`.

Create these directories relative to that root:

```text
src/app/                   Routes, layouts, API route handlers
src/components/ui/         Buttons, forms, dialogs, badges, feedback states
src/features/directory/    Search, filters, cards
src/features/people/       Profiles, claims, relationship views
src/features/family-book/  Cover, contents, chapters, spreads, pagination
src/features/review/       Proposal forms, comparisons, decisions
src/features/reunion/      Event details, RSVP
src/lib/auth/              Verified sessions and membership checks
src/lib/supabase/          Browser/server clients; privileged admin client isolated
src/lib/validation/        Shared Zod input schemas
src/server/                Services and data access; server-only imports
supabase/migrations/       Version-controlled schema and RLS
supabase/seeds/            Separate configuration and demo seeds
tests/unit/                Domain rules and pagination
tests/integration/         PostgreSQL authorization and transactions
tests/e2e/                 Browser journeys and responsive checks
public/                    Public branding assets only, never private family photos
docs/                      Setup, operational guide, implementation status
```

Select mutually compatible stable package versions at implementation time and commit the lockfile. Do not blindly use old API examples or invent a version number from this handoff. The browser should not receive a privileged Supabase key.

## 9. Authentication, permissions, and account linking

### Roles

| Action | Member | Branch reviewer | Administrator |
| --- | --- | --- | --- |
| Read published family records | Yes, subject to visibility | Same | Yes |
| Read private draft/review content | Own submissions | Assigned review scope | Yes |
| Propose corrections/relationships | Yes | Yes | Yes |
| Approve proposals | No | Assigned branches only | Yes |
| Approve own submission | No | No | No; another reviewer required |
| Manage branch/event settings | No | No | Yes |
| Invite/suspend members or change roles | No | No | Yes |
| View event RSVP totals | Own response only | Own response only | Yes |

Require two review-capable accounts for real verification. During local development use two test identities. Initial administrative bootstrap is a documented server-side setup action, not a public endpoint. Recording a bootstrap action does not verify ancestor relationships.

### Invitations and login

- Disable public signup. Use the Auth provider's supported invitation and recovery flows.
- Require an active family membership in addition to an authenticated session.
- An invitation carries a verified email match, family ID, intended role, expiry, and acceptance status in application data. Start at member role by default.
- Accept an invitation once. Reissued invitations revoke the previous invitation record.
- Login alone must not auto-create family membership.
- Use secure cookie/session handling from maintained provider integration; never store passwords yourself.
- Revoking membership denies subsequent data requests even if the Auth session has not expired.
- Recovery responses must not reveal whether a given email belongs to the family.
- Do not automatically claim an existing person by matching a name or email.

### Person claims

An account and a person are different things: many relatives may exist without accounts.

After joining, a member either proposes a new person or requests a claim on an existing person. A reviewer confirms the claim. Enforce at most one active self-claim per member and one active self-owner per person. Assisted entry for nontechnical relatives is allowed through ordinary proposals; it does not grant ownership of their profile.

Never require an identity document upload for this release. Family reviewers can use a private contextual note and an offline conversation.

## 10. Data model

Use UUID primary keys, UTC timestamps, foreign keys, and `family_id` on family-scoped records. Keep family scoping even though release 1 serves a single family. Do not build multi-family billing or organization switching.

| Table | Minimum fields and responsibility |
| --- | --- |
| `families` | `id`, `name`, welcome text, artwork path, timestamps |
| `memberships` | `id`, `family_id`, `user_id`, role, active/suspended status; unique family/user |
| `reviewer_branches` | membership ID, branch ID; unique pair |
| `invitations` | family, normalized email, intended role, inviter, expiry, accepted/revoked timestamps; sensitive/admin-only |
| `branches` | family, slug, display name, partner label, display order, optional reviewed chapter story, version |
| `people` | family, display name, nickname, optional biography, deceased flag, minor flag, visibility, publication state, details verification state, version, timestamps |
| `person_claims` | family, membership, person, pending/approved/rejected state, reviewer, review time; approved uniqueness constraints |
| `person_branches` | person, branch, verification state, reviewer and date; unique pair |
| `relationships` | family, source person, target person, kind `parent_child` or `partner`, verification state, reviewer/date, version, archived timestamp |
| `submissions` | family, submitter, kind, target IDs, base versions, proposed allowlisted patch, private context note, state, version, reviewer, decision note, timestamps |
| `submission_revisions` | submission, revision number, immutable proposed patch/context snapshot, author/time |
| `review_decisions` | submission revision, reviewer, action, before/after snapshot, note, time; append-only |
| `photos` | person, private storage key, uploader, review state, consent state, timestamps; no public URL stored |
| `events` | family, name, description, nullable start time/time zone/venue, publication state, version |
| `rsvps` | event, membership, response `yes/maybe/no`, optional note, version/time; unique event/membership |
| `notifications` | recipient membership, type, related submission ID, read timestamp; no sensitive note in preview |
| `audit_events` | actor, family, action, entity IDs, request ID, timestamp; privileged access |

### Important modeling decisions

- Allow multiple parents and partners through relationship rows, not fixed `father_id` and `mother_id` columns.
- Use generic “Parent,” “Child,” and “Partner” labels. Do not collect or infer sensitive parentage categories in release 1.
- Parent-child edges have a canonical direction: source is parent, target is child. Child views are derived from those same rows.
- Partner edges are unordered; normalize the UUID pair before inserting so A–B and B–A cannot duplicate each other.
- Never assume a partner is a child's parent.
- Prevent self-links, duplicate active edges, cross-family links, and parent-child cycles.
- Validate cycles inside the same transaction used to approve relationships. Serialize relationship approvals per family, using an appropriate database lock, so concurrent approvals cannot jointly create a cycle.
- Names are not unique identifiers. Duplicate-name matches produce suggestions, never automatic merges.
- Do not require exact dates of birth, postal addresses, phone numbers, or email addresses on visible person profiles.
- Keep account emails in Auth/invitation data, outside directory responses.
- Unknown branch or relationship is represented as absent data, not a fictional “Unknown Person” record.
- Minor profiles default to restricted visibility. Until a dedicated guardian-consent workflow is implemented, leave them unpublished and accessible only to authorized administrators and the relevant submitter. Do not claim that a submitted checkbox establishes guardianship.

### Separate kinds of status

`publication_state`: draft, published, archived.  
`verification_state`: unconfirmed, confirmed, disputed.  
`submission_state`: draft, submitted, needs_clarification, approved, rejected, withdrawn.

An accepted name correction does not verify parentage or branch membership. Display verification per section. Avoid one universal green badge that implies the person's entire history has been validated.

## 11. Submission and verification workflow

1. Member opens a profile or the new-profile form.
2. Client submits validated proposed data, target IDs, and the version originally viewed.
3. Server verifies membership, field allowlist, target family, and input limits; saves the proposal without changing accepted data.
4. Reviewer opens an authorized before/after comparison and contextual notes.
5. Reviewer approves, requests clarification with a reason, or rejects with a reason.
6. Approval locks the proposal and relevant target rows, verifies current versions and scope, applies the patch, writes the decision/audit record, and creates an in-app notification in one transaction.
7. The frontend refreshes affected directory, profile, chapter, and review views after success.

Use separate proposal types for person details, branch affiliation, relationship creation/removal, profile claims, and photo approval. This prevents approving a spelling correction from implicitly approving a parent connection.

### State transitions

```text
draft -> submitted -> approved
                  -> rejected
                  -> needs_clarification -> submitted (new immutable revision)
draft/submitted/needs_clarification -> withdrawn (by submitter)
```

- Review only the latest submitted revision.
- For release 1, approve or reject the complete proposal; do not implement partial field approval. Separate concerns into different proposals.
- A stale target version returns a conflict and shows the updated comparison. Never overwrite a newer correction silently.
- Repeating an approval request must not duplicate a relationship or audit decision. Use proposal state and transaction constraints to make the decision idempotent.
- Keep history immutable. Correct an approved fact through a new proposal, not by editing the old review record.
- Do not infer trust from surname, branch, profile photo, or how confidently someone writes a note.
- Claims spanning reviewer scopes, unassigned people, and cross-branch relationship changes require an administrator.
- Reviewer branch scope must be checked against both existing and proposed affiliations, not just the branch selected by the submitter.
- Clarification produces an in-app notification, not an unsolicited external message. Preserve the submitted form values.

## 12. API contracts

Use Next.js route handlers under `/api`. Server-rendered pages may call the same services directly. Do not duplicate business rules in route handlers and page components.

All endpoints verify authentication, active membership, permissions, family scope, and visibility. Return only fields needed by that screen.

| Method and endpoint | Purpose |
| --- | --- |
| `GET /api/me` | Membership, role, self-claim, safe account summary |
| `GET /api/branches` | Visible branch labels, counts, stories |
| `GET /api/people?q=&branch=&cursor=&limit=` | Directory; default 24, maximum 60 results |
| `GET /api/people/:id` | Visible profile, affiliations, authorized relationships |
| `GET /api/book/:slug?cursor=&limit=` | Authorized chapter records and pagination metadata; reuse directory/person projections |
| `GET /api/submissions` | Own proposals, or authorized reviewer queue with explicit filter |
| `GET /api/submissions/:id` | Authorized proposal detail/history |
| `POST /api/submissions` | Create typed proposal, with target/base version and client request ID |
| `PATCH /api/submissions/:id` | Revise own draft/clarification proposal; never an approved revision |
| `POST /api/submissions/:id/submit` | Submit current revision |
| `POST /api/submissions/:id/withdraw` | Withdraw own eligible proposal |
| `POST /api/submissions/:id/decision` | Approve, request clarification, or reject; reviewer-only |
| `POST /api/claims` | Request a person claim; use the same review engine |
| `GET /api/events/current` | Published reunion details or explicit not-yet-configured state |
| `PUT /api/events/:id/rsvp` | Upsert current member's answer; allowlisted fields only |
| `GET /api/events/:id/rsvp` | Current member's answer |
| `GET /api/organizer/events/:id/rsvps` | Admin-only totals and paginated responses |
| `POST /api/photos` | Validate and upload image into pending private storage |
| `GET /api/photos/:id/access` | Authorize photo and issue short-lived access URL |
| `GET /api/notifications` | Current member's notifications |
| `PATCH /api/notifications/:id` | Mark own notification read |
| `POST /api/organizer/invitations` | Admin invitation creation; sending only in configured live workflow |
| `PATCH /api/organizer/invitations/:id` | Revoke invitation |
| `PATCH /api/organizer/memberships/:id` | Suspend/reactivate member or change authorized role |
| `PATCH /api/organizer/branches/:id` | Reviewed branch label/story changes with version check |
| `PUT /api/organizer/events/current` | Create/update reunion details with version check |

Example person-details proposal:

```json
{
  "kind": "person_details",
  "targetId": "person-uuid",
  "baseVersion": 3,
  "proposed": { "nickname": "Nena" },
  "contextNote": "This is the nickname relatives use.",
  "clientRequestId": "request-uuid"
}
```

Server derives family, submitter, role, reviewer, and approval timestamps from trusted context. Never accept those as writable fields from the client. Use a discriminated input schema per proposal kind; forbid arbitrary database column patches.

Success: `{ "data": ..., "nextCursor": null }` where pagination applies.  
Failure: `{ "error": { "code": "VERSION_CONFLICT", "message": "This record changed. Review the latest details.", "fieldErrors": {} }, "requestId": "..." }`.

Use 400 for malformed input, 401 for missing session, 403 for forbidden actions, 404 for missing or inaccessible private entities, 409 for stale/duplicate conflicts, 422 for field/domain validation, 429 for rate limits, and a generic 500 for unexpected errors. Do not expose SQL errors, tokens, emails, or private notes in error responses.

## 13. Database and application security

- Enable RLS on every family-data table and write negative tests before exposing real data.
- Anonymous sessions cannot read family records, pending proposals, invitation emails, or storage objects.
- Ordinary members cannot mutate accepted records, roles, decisions, or audit history directly through Supabase's API.
- Proposal policies permit the author and authorized reviewers only, with separate rules for draft and submitted content.
- Protect reviewer functions with explicit actor/scope checks. If using `SECURITY DEFINER`, fix `search_path`, schema-qualify objects, revoke inappropriate execution grants, and check authenticated membership inside the function.
- Reserve the privileged Supabase key for isolated server-only admin operations such as invitations. Do not use it for ordinary member reads as a shortcut around RLS.
- Keep private responses out of shared/static caches. Do not serialize private records into public page metadata or logs.
- Use parameterized database access, validated UUIDs, Unicode-friendly length limits, and escaped text rendering. Treat stories and context notes as plain text in release 1.
- Validate request origins for cookie-authenticated mutations and use the framework's appropriate CSRF protections; no state-changing GET routes.
- Rate-limit invitations, claims, proposals, and uploads using a shared production store or hosting-layer limits, not only per-process memory.
- Set protective HTTP headers and a tested content security policy compatible with the app.
- Do not expose family data in analytics, session replay, search engine previews, or public error telemetry.
- Add `noindex` for privacy, but never treat it as authorization.

## 14. Photo handling and privacy defaults

- Make profile photos optional, with initials as the default.
- Accept JPEG, PNG, and WebP, up to 5 MB; reject SVG and other active formats.
- Check decoded content, dimensions, and pixel count server-side; do not trust MIME type or filename.
- Re-encode accepted images, remove metadata, and produce a reasonably sized portrait derivative. Cap decoded images at 25 megapixels and output portraits at 1024px maximum dimension.
- Store original pending uploads and published derivatives in private buckets. Use opaque IDs, not personal names, for object keys.
- Only authorize the owner/reviewer to view a pending image. Members see it only after consent and approval, subject to profile visibility.
- Issue short-lived signed access URLs after checking permissions, e.g. five minutes. Document that already issued URLs can remain usable until expiry; use an authenticated proxy if immediate revocation becomes required.
- A revoked/hidden photo must stop appearing in new API responses immediately.
- Remove abandoned upload objects on a scheduled maintenance job after seven days if no live proposal references them.
- Provide a way to request correction, hiding, or removal of a profile. Administrative archival is available in release 1; permanent erasure is an explicit maintenance process that also handles stored images and backup retention.
- Explain that the live directory is visible to invited family members. Do not call it public or promise absolute confidentiality.

## 15. Reunion and RSVP

- Preserve “To be announced” when the date or venue is unknown.
- Do not seed the earlier conversational example of December 2026 as a real event date.
- Store timestamps with the event's IANA time zone; initial display default is `Asia/Singapore` until the organizer supplies the actual event zone.
- One answer per invited membership per event: yes, maybe, or no. Support updates.
- Release 1 does not infer attendance for spouses or children. If household counts become necessary, add an explicit household workflow later.
- Confirmation says the response was saved; it must not imply a paid reservation or ticket.
- RSVP details and aggregate organizer reports are admin-only, apart from the member's own response.

## 16. Local setup and configuration

Provide an actual `.env.example`, never actual credentials, containing the variables used by the selected integration:

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
APP_ENV=development
```

If the selected project uses legacy `anon`/`service_role` terminology, map it explicitly in setup docs rather than mixing variable names. Any secret/service-role key remains server-only and must never have a `NEXT_PUBLIC_` prefix.

- Use a local Supabase stack where available; otherwise use a dedicated development project supplied by the owner.
- Missing service credentials should produce a useful local setup message, not silently turn production routes into a public demo.
- Keep demo fixtures in tests or an explicitly separate development-only route that is disabled in production.
- Document migrations, local seed commands, two test reviewer accounts, and storage configuration.
- Add these scripts and make them real: `dev`, `build`, `start`, `lint`, `typecheck`, `test:unit`, `test:integration`, `test:e2e`.
- Keep credentials and uploaded files out of Git. Commit migration files and the lockfile.
- If the directory is not already in an appropriate repository, ask before connecting it to an external Git remote. Local work does not depend on publishing a repository.

## 17. Ordered implementation milestones

### Milestone 1 — Preserve the visual baseline and build the Family Book

1. Inspect the prototype, assets, screenshots, and current test script.
2. Scaffold the new application in the specified separate directory.
3. Extract colors, typography, navigation, cards, badges, and forms into reusable components.
4. Port Home, directory, and profile screens with clearly labeled fictional fixtures.
5. Implement book cover, contents, chapter selector, four-card logical pages, desktop spreads, and mobile single pages.
6. Add relationship links, uncertain states, unassigned people, and deep links.
7. Test pagination boundaries, browser Back, responsive changes, keyboard navigation, and long names.
8. Capture desktop and phone screenshots for owner review.

**Done:** The book is usable with fixtures; no backend claims are made; the original prototype still runs unchanged.

### Milestone 2 — Schema, authentication, and authorization

1. Add schema migrations, relationships, constraints, and RLS policies.
2. Separate configuration seeds from fictional demo seeds.
3. Implement server/browser Auth clients, invite acceptance, recovery, and membership checks.
4. Implement role/scope checks and initial administrator bootstrap documentation.
5. Write integration tests for anonymous, suspended, unrelated-family, member, scoped reviewer, and administrator access.
6. Add read-only people/branches services and connect directory/profile queries.

**Done:** Direct unauthorized API/database access is denied, not merely hidden in the UI.

### Milestone 3 — Profiles, claims, and review

1. Implement typed proposal validators and draft/revision storage.
2. Implement new-profile proposals, claims, person corrections, branch affiliation, and relationship proposals.
3. Add immutable history and before/after comparisons.
4. Implement transactional, version-checked decisions with reviewer scope and no self-approval.
5. Add clarification/resubmission and in-app notifications.
6. Replace all fixture-driven profile editing and review flows with real services.
7. Test concurrency, repeated approval, stale records, relationship cycles, duplicate links, and role escalation attempts.

**Done:** Suggestions cannot alter accepted data without the right reviewer decision; unknown facts remain unknown.

### Milestone 4 — Connect the book, photos, and reunion

1. Feed the book from the same authorized people/relationship data as the directory.
2. Implement private photo validation, consent, review, and authorized access.
3. Implement administrator event settings, unknown date/venue states, and persistent RSVP.
4. Add request-failure recovery, loading states, accessible announcements, and permission-aware empty states.
5. Verify phone layouts and low-bandwidth behavior with portraits disabled or missing.

**Done:** Refresh preserves real data, and the book never leaks pending/private facts.

### Milestone 5 — Hardening and handoff

1. Run lint, type checks, production build, unit tests, RLS/integration tests, and browser journeys.
2. Audit private API fields, storage access, logs, production bundles, and cache behavior.
3. Document backup/restore and test a restore in a nonproduction environment.
4. Remove demo role switching and ensure production seed paths exclude fictional descendants.
5. Write operational setup, reviewer instructions, and a release checklist.
6. Summarize completed features, actual test results, remaining limitations, and the next exact command in `docs/IMPLEMENTATION_STATUS.md`.

**Done:** The application is locally reviewable and ready for a separately authorized deployment.

## 18. Required test scenarios

### Domain and database

- Name edits cannot confirm a relationship or affiliation.
- Multiple parents, missing parents, multiple branches, duplicate names, and disconnected people work.
- A self-link, duplicate edge, cross-family edge, or ancestry cycle is rejected.
- Concurrent relationship approvals cannot create a cycle.
- Two reviewers deciding the same revision cause one decision, not duplicate mutations.
- Stale revisions produce a conflict and preserve current data.
- A reviewer cannot move a target into their branch to gain approval authority.
- A submitter cannot supply actor IDs, reviewer IDs, roles, verification state, or arbitrary fields.
- An accepted profile claim cannot be duplicated by a second account.
- Direct database operations cannot bypass application permissions.

### Browser journeys

- An invited member signs in, claims/creates a profile, submits a correction, gets clarification, revises, and sees the approved result.
- A reviewer sees only their authorized queue and cannot approve their own submission.
- Directory search supports Unicode, nicknames, no results, branch filters, and pagination.
- Book cover/contents/chapter/person links work, including browser Back and direct URLs.
- Page controls work with one page, an odd number of pages, empty chapters, four-card boundaries, and changed viewport sizes.
- Unknown relationships have explicit labels; pending proposals do not appear as family facts.
- A member can update RSVP and retain it after refreshing and signing in again.
- Rejected or malformed photo uploads cannot be retrieved by another member.
- Session expiry during editing preserves recoverable input without exposing private data.

### Visual/accessibility

- Check 390px, 768px, 1024px, and 1440px widths plus 200% zoom.
- No page-wide horizontal overflow, clipped names, overlapping bottom navigation, or book text shrunk to fit.
- All tasks work without a mouse. Dialog focus returns to the invoking control.
- Reduced-motion mode removes page transitions.
- Run automated accessibility checks and manually review headings, labels, reading order, announcements, focus, and contrast.
- Test at least Chromium and WebKit where available; state which engines were actually tested.
- Check missing photos, long stories, long/unbroken names, slow network responses, and failed requests.

## 19. Deployment, backup, and operations

Default deployment proposal: a managed Next.js host with Supabase in a suitable nearby region. Hosting account, domain, costs, data region, and actual publication require the owner's decision before provisioning or deployment.

- Keep development, staging, and production data/keys separate.
- Configure HTTPS, canonical application origin, Auth callback allowlist, invitation delivery, and recovery links.
- Use provider-managed email delivery only after configuring and testing it with controlled accounts.
- Test migrations against staging before production; avoid destructive schema changes without a data migration and recovery path.
- Back up PostgreSQL and private storage separately. Database backup alone is not a photo backup.
- Document provider-specific backup availability and retention instead of assuming a free tier includes it.
- Monitor request failures, rejected uploads, review conflicts, and failed authentication flows without logging sensitive payloads.
- Include health checks and request IDs. Monitor invitation delivery once real sending is enabled.
- Pilot with a small set of consenting relatives and two reviewers before a full-family invitation rollout.
- Roll back application releases without deleting accepted records. Schema rollback must preserve newly collected data.

## 20. Acceptance checklist

- [ ] Existing prototype and original reunion artwork preserved.
- [ ] Family Book feels like an album on desktop and remains readable on mobile.
- [ ] Directory and book share the same person identities and authorized facts.
- [ ] Seven branch labels and the spelling Gervasio are preserved.
- [ ] No fictional descendants are imported into production.
- [ ] Invite-only membership and account recovery work.
- [ ] Person ownership requires a reviewed claim.
- [ ] Field/relationship verification is separate and honest about uncertainty.
- [ ] Parent, partner, and cross-branch relationships do not rely on the demo's one-parent model.
- [ ] Review actions are authorized, transactional, version-checked, and auditable.
- [ ] Private records and photos are protected at both API and database/storage layers.
- [ ] RSVP persists and unknown event details remain “To be announced.”
- [ ] Appropriate tests and a production build pass with results documented.
- [ ] Setup, migrations, test commands, backups, and remaining work are documented.
- [ ] No real invitations or public deployment occurred without a separate owner request.

## 21. Reference documentation

These official references were checked while preparing the handoff. Recheck current APIs before implementing; these links do not lock dependency versions.

- [Next.js authentication and authorization guidance](https://nextjs.org/docs/app/guides/authentication): centralize authorization near data access, not only in navigation guards.
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security): database enforcement for exposed tables.
- [Supabase user management](https://supabase.com/docs/guides/auth/managing-user-data): application records associated with Auth users.
- [Supabase Auth users](https://supabase.com/docs/guides/auth/users): invitations and server-only privileged credentials.
- [Supabase private storage buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals): private file access and signed URLs.
- [Supabase storage access control](https://supabase.com/docs/guides/storage/security/access-control): storage policies.

---

**Handoff summary:** A working static prototype exists. The next visible improvement is the Family Book. The remaining production work is authentication, durable relational data, carefully scoped verification, private media, and deployment preparation. Preserve the welcoming design and never turn an uncertain family connection into an asserted fact merely to complete a page.
