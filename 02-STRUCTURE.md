# Project Structure

## Folder layout
```
reunion-app/
├── app/
│   ├── (gate)/
│   │   └── page.tsx                 # passcode entry screen
│   ├── (main)/
│   │   ├── layout.tsx                # checks cookie, wraps nav + tree spine
│   │   ├── page.tsx                  # home: hero, live RSVP count, quick links
│   │   ├── rsvp/page.tsx
│   │   ├── schedule/page.tsx
│   │   ├── tree/page.tsx             # full family tree view
│   │   ├── gallery/
│   │   │   ├── page.tsx
│   │   │   └── upload/page.tsx
│   │   ├── location/page.tsx
│   │   └── games/
│   │       ├── page.tsx
│   │       └── leaderboard/page.tsx
│   ├── admin/
│   │   ├── page.tsx                  # admin passcode gate
│   │   ├── rsvps/page.tsx
│   │   ├── members/page.tsx          # family tree data entry
│   │   └── schedule/page.tsx
│   ├── api/                          # only if you need server-side writes
│   │   └── verify-passcode/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                           # buttons, inputs, cards — design system primitives
│   ├── tree/
│   │   ├── TreeSpine.tsx             # the signature branching layout engine
│   │   ├── GenerationNode.tsx
│   │   └── MemberCard.tsx
│   ├── rsvp/
│   ├── gallery/
│   └── schedule/
├── lib/
│   ├── firebase.ts                   # client init
│   ├── firestore/
│   │   ├── rsvps.ts
│   │   ├── members.ts
│   │   ├── schedule.ts
│   │   └── gallery.ts
│   ├── auth/
│   │   └── passcode.ts
│   └── types.ts                      # shared TS types matching doc 01's data model
├── middleware.ts                     # cookie check, redirect to gate
├── public/
└── firestore.rules
```

## Naming conventions
- Components: PascalCase, one component per file, filename matches component name.
- Firestore helper functions: verb-first — `getMembers()`, `addRsvp()`, `subscribeToGallery()`.
- Route groups `(gate)` and `(main)` keep the passcode screen visually separate from the app shell without affecting the URL.

## Firestore security rules (starting point)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read for schedule, tree, gallery, config — this is a closed-passcode app,
    // rules here are a light backstop, not the primary access control.
    match /reunion_config/{doc} { allow read: if true; allow write: if false; }
    match /family_members/{doc} { allow read: if true; allow write: if false; }
    match /schedule_items/{doc} { allow read: if true; allow write: if false; }
    match /gallery_photos/{doc} { allow read: if true; allow create: if true; allow update, delete: if false; }
    match /rsvps/{doc} { allow read: if false; allow create: if true; allow update, delete: if false; }
    match /trivia_scores/{doc} { allow read: if true; allow create: if true; }
  }
}
```
Writes to `family_members`, `schedule_items`, `reunion_config` go through the admin passcode-gated `/api` routes using the Firebase Admin SDK, not directly from the client — keep the write path server-side even though the read path is open.

## Environment variables
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
FAMILY_PASSCODE_HASH=
ADMIN_PASSCODE_HASH=
```
