# Agent Instructions — [FAMILY_NAME] Reunion App

You are implementing the reunion app defined in `01-PROJECT-SPEC.md`, `02-STRUCTURE.md`, and `03-DESIGN-SYSTEM.md`. Read all three before writing code.

## Operating principles
1. **Build in phase order** (spec doc §6). Don't jump to the family tree visualization before RSVP/schedule/location work, even though the tree is the "fun" part — the utility features are what people need first.
2. **Follow the structure doc exactly** for file locations and naming. If a new file doesn't fit an existing folder, stop and ask rather than inventing a new top-level folder.
3. **Design tokens are not suggestions.** Every color, font, radius, and spacing value used in components should trace back to a token in `03-DESIGN-SYSTEM.md`. If you need a value that isn't in the token list, flag it instead of picking an arbitrary one.
4. **Writes to shared data go through server routes** using the Firebase Admin SDK (see `02-STRUCTURE.md` security rules section) — never write `family_members`, `schedule_items`, or `reunion_config` directly from client components, even though it's a small trusted-family app.
5. **Mobile-first.** Build and check the mobile layout (especially the tree spine's collapsed rail version) before polishing desktop — most family members will open this on a phone.

## Per-phase checklist

### Phase 1 — Core utility
- [ ] Passcode gate + middleware cookie check
- [ ] Homepage shell (hero node only — full spine comes in Phase 3)
- [ ] RSVP form + live counter (realtime Firestore listener)
- [ ] Admin RSVP table with CSV export
- [ ] Schedule page
- [ ] Location/logistics page
- [ ] Deploy to Vercel, confirm passcode flow works end-to-end on a real phone

### Phase 2 — Gallery
- [ ] Upload flow (client-side thumbnail resize before upload)
- [ ] Grid + lightbox
- [ ] Confirm Storage rules match `02-STRUCTURE.md`

### Phase 3 — Family tree
- [ ] Admin member data-entry form (do not hand-edit Firestore for this)
- [ ] `TreeSpine` layout engine using `d3-hierarchy`
- [ ] Desktop branching layout + mobile collapsed rail
- [ ] Branch filter with opacity + scale dim (not full hide)
- [ ] Load animation (trunk draw → generation cascade), reduced-motion fallback

### Phase 4 — Games
- [ ] Trivia question admin entry
- [ ] Trivia play flow + score submission
- [ ] Leaderboard
- [ ] (Optional) icebreaker bingo static page

## Definition of done, per phase
Before marking a phase complete: test on an actual mobile viewport (not just resized desktop Chrome), confirm empty states render sensibly (zero RSVPs, zero photos, zero tree members), and confirm no console errors on the deployed Vercel preview — not just localhost.

## What NOT to build
- No per-user accounts/full auth — shared passcode is the intended design, not a placeholder for something bigger.
- No native mobile app — this is web-only per the spec.
- No photo moderation queue unless explicitly requested later — the `approved` field exists but defaults true.
