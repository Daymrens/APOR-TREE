# APOR Family Reunion — Next Phases Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete all remaining features for the APOR Family Reunion web app: games, admin management, notifications, countdown, member profiles, and family chat.

**Architecture:** Each phase builds on the existing Next.js 16 + Firebase stack. All pages use glassmorphism UI, Tailwind v4, and the existing type system. Firestore collections are added incrementally. No new dependencies required for Phases 6–11.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, Firebase (Firestore + Storage), TypeScript

---

## Phase 6: Games / Activities

### Task 6.1: Trivia Game Page

**Files:**
- Create: `src/app/(main)/games/page.tsx`
- Create: `src/app/(main)/games/trivia/page.tsx`
- Modify: `src/lib/firestore/games.ts` (new file)
- Modify: `src/lib/types.ts` (already has TriviaQuestion, TriviaScore)
- Modify: `src/app/(main)/layout.tsx` (add Games link)

**Step 1: Create Firestore games helper**

```ts
// src/lib/firestore/games.ts
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import type { TriviaQuestion, TriviaScore } from "@/lib/types";

export async function getTriviaQuestions(): Promise<TriviaQuestion[]> {
  try {
    const snapshot = await getDocs(collection(db, "trivia_questions"));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TriviaQuestion[];
  } catch (error) {
    console.warn("Firestore not available:", error);
    return [];
  }
}

export async function submitTriviaScore(
  data: Omit<TriviaScore, "id" | "completedAt">
): Promise<string> {
  const docRef = await addDoc(collection(db, "trivia_scores"), {
    ...data,
    completedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getTopScores(count: number = 10): Promise<TriviaScore[]> {
  try {
    const q = query(
      collection(db, "trivia_scores"),
      orderBy("score", "desc"),
      limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TriviaScore[];
  } catch (error) {
    console.warn("Firestore not available:", error);
    return [];
  }
}
```

**Step 2: Create games landing page**

```tsx
// src/app/(main)/games/page.tsx
"use client";

import Link from "next/link";
import BackButton from "@/components/ui/BackButton";

export default function GamesPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <BackButton />
      <h1 className="font-heading text-3xl text-balete mb-2 animate-fade-in">Games</h1>
      <p className="text-soft font-sans mb-8 animate-fade-in" style={{ animationDelay: "0.05s" }}>
        Fun activities for the whole family.
      </p>

      <div className="space-y-4">
        <Link
          href="/games/trivia"
          className="glass-card rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-hibiscus/40 animate-slide-up block"
        >
          <h2 className="font-heading text-xl text-balete mb-1">Family Trivia</h2>
          <p className="text-soft text-sm font-sans">
            Test how well you know the Apor family history!
          </p>
        </Link>
      </div>
    </div>
  );
}
```

**Step 3: Create trivia game page**

The trivia page should:
- Fetch questions from `trivia_questions` collection
- Present one question at a time with 4 choices
- Track score (10 points per correct answer)
- Show results at end with leaderboard
- Submit score to Firestore

Key UI elements:
- Progress bar showing question X of Y
- Animated choice buttons (green flash for correct, red for wrong)
- Score counter in header
- Results screen with score, correct count, and "Play Again" button
- Leaderboard showing top 10 scores

**Step 4: Add Games to navigation**

In `src/app/(main)/layout.tsx`, add a Games link to the nav grid.

**Step 5: Seed trivia questions**

Create `scripts/seed-trivia.js` to seed 10 family trivia questions:
```js
const questions = [
  { question: "What is the family surname?", choices: ["Apor", "Santos", "Cruz", "Reyes"], correctIndex: 0, points: 10 },
  { question: "How many branches are in the family tree?", choices: ["2", "3", "4", "5"], correctIndex: 2, points: 10 },
  // ... 8 more questions about family history
];
```

**Step 6: Add Firestore rules for trivia collections**

Add to `firestore.rules`:
```
match /trivia_questions/{doc} {
  allow read: if true;
  allow write: if false;
}
match /trivia_scores/{doc} {
  allow read: if true;
  allow create: if true;
  allow update, delete: if false;
}
```

**Step 7: Build and test**

Run: `npx next build`
Expected: Clean build, no errors

---

## Phase 7: Admin Member Management

### Task 7.1: Edit/Delete Members

**Files:**
- Modify: `src/app/admin/members/page.tsx` (add edit/delete)
- Modify: `src/lib/firestore/members.ts` (add update/delete functions)
- Create: `src/app/api/admin/delete-member/route.ts`

**Step 1: Add update/delete to members.ts**

```ts
// Add to src/lib/firestore/members.ts
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";

export async function updateMember(
  id: string,
  data: Partial<Omit<FamilyMember, "id">>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), data);
}

export async function deleteMember(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function getMembersByBranch(branch: string): Promise<FamilyMember[]> {
  const q = query(collection(db, COLLECTION), where("branch", "==", branch));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FamilyMember[];
}
```

**Step 2: Create delete member API route**

```ts
// src/app/api/admin/delete-member/route.ts
import { NextResponse } from "next/server";
import { deleteMember } from "@/lib/firestore/members";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Member ID required" }, { status: 400 });
    }
    await deleteMember(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Step 3: Rewrite admin members page**

The page should have two modes:
1. **List mode**: Shows all members in a table with edit/delete buttons
2. **Add/Edit mode**: Form to add new or edit existing member

Key features:
- Branch filter dropdown
- Member table with: name, branch, generation, status, actions
- Edit button opens form pre-filled with member data
- Delete button with confirmation dialog
- Success/error toasts

**Step 4: Build and test**

Run: `npx next build`

---

### Task 7.2: Photo Upload for Members

**Files:**
- Modify: `src/app/admin/members/page.tsx` (add photo upload)
- Create: `src/app/api/admin/upload-photo/route.ts`

**Step 1: Create photo upload API**

```ts
// src/app/api/admin/upload-photo/route.ts
import { NextResponse } from "next/server";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const memberId = formData.get("memberId") as string;

    if (!file || !memberId) {
      return NextResponse.json({ error: "File and memberId required" }, { status: 400 });
    }

    const storageRef = ref(storage, `members/${memberId}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
```

**Step 2: Add photo upload to admin form**

In the member form, add:
- File input with accept="image/*"
- Preview thumbnail
- Upload on form submit (or separate upload button)
- Store `photoUrl` in member document

**Step 3: Build and test**

Run: `npx next build`

---

## Phase 8: RSVP Notifications

### Task 8.1: Email Notifications via Resend

**Files:**
- Create: `src/app/api/notify/route.ts`
- Modify: `package.json` (add resend dependency)
- Create: `.env.local` entry for RESEND_API_KEY

**Step 1: Install Resend**

```bash
npm install resend
```

**Step 2: Create notification API**

```ts
// src/app/api/notify/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { name, branch, attending, guestCount } = await request.json();

    const status = attending === "yes" ? "confirmed" : attending === "maybe" ? "maybe" : "declined";

    await resend.emails.send({
      from: "APOR Reunion <reunion@apor.family>",
      to: process.env.ADMIN_EMAIL || "",
      subject: `New RSVP: ${name} (${status})`,
      html: `
        <h2>New RSVP Received</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Branch:</strong> ${branch || "Not specified"}</p>
        <p><strong>Status:</strong> ${status}</p>
        <p><strong>Guests:</strong> ${guestCount}</p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Notification failed" }, { status: 500 });
  }
}
```

**Step 3: Trigger notification on RSVP**

In `src/app/(main)/rsvp/page.tsx`, after `addRsvp()` succeeds:
```ts
await fetch("/api/notify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: form.respondentName,
    branch: form.familyBranch,
    attending: form.attending,
    guestCount: form.guestCount,
  }),
});
```

**Step 4: Build and test**

Run: `npx next build`

---

## Phase 9: Countdown & Event Details

### Task 9.1: Countdown Timer

**Files:**
- Create: `src/components/ui/Countdown.tsx`
- Modify: `src/app/(main)/page.tsx` (add countdown)
- Modify: `src/lib/types.ts` (ReunionConfig already has eventDates)

**Step 1: Create Countdown component**

```tsx
// src/components/ui/Countdown.tsx
"use client";

import { useState, useEffect } from "react";

interface CountdownProps {
  targetDate: Date;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const blocks = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <div className="flex gap-3 justify-center">
      {blocks.map(({ label, value }) => (
        <div key={label} className="glass-card rounded-xl p-3 min-w-[60px] text-center">
          <p className="font-mono text-2xl text-hibiscus tabular-nums">
            {String(value).padStart(2, "0")}
          </p>
          <p className="text-soft text-xs font-sans mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Add countdown to homepage**

On the homepage, if event date is set, show countdown below the hero. If not set, show "Event date TBA".

**Step 3: Build and test**

---

### Task 9.2: Event Details Page Enhancement

**Files:**
- Modify: `src/app/(main)/schedule/page.tsx`
- Modify: `src/app/(main)/location/page.tsx`

Add dynamic data from `reunion_config` collection:
- Venue name and address
- Map embed URL
- Contact person and phone
- Parking notes
- Cover image

**Step 1: Fetch config in schedule and location pages**

```ts
import { getConfig } from "@/lib/firestore/config";

// In useEffect:
const config = await getConfig();
if (config) {
  // Use config.venueName, config.mapEmbedUrl, etc.
}
```

**Step 2: Build and test**

---

## Phase 10: Member Profile Pages

### Task 10.1: Individual Member Pages

**Files:**
- Create: `src/app/(main)/tree/[id]/page.tsx`
- Modify: `src/components/tree/MemberCard.tsx` (add link to profile)

**Step 1: Create member profile page**

```tsx
// src/app/(main)/tree/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getMembers } from "@/lib/firestore/members";
import type { FamilyMember } from "@/lib/types";
import BackButton from "@/components/ui/BackButton";

const BRANCH_COLORS: Record<string, string> = {
  Apor: "#1E3B2C",
  Jose: "#C23B6E",
  Rosa: "#E8A63D",
  Antonio: "#2E6B62",
};

export default function MemberProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [family, setFamily] = useState<{ parents: FamilyMember[]; spouse: FamilyMember | null; children: FamilyMember[] }>({
    parents: [],
    spouse: null,
    children: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const members = await getMembers();
      const found = members.find((m) => m.id === id);
      if (found) {
        setMember(found);
        const parents = members.filter((m) => found.parentIds.includes(m.id));
        const spouse = found.spouseId ? members.find((m) => m.id === found.spouseId) || null : null;
        const children = members.filter((m) => m.parentIds.includes(found.id));
        setFamily({ parents, spouse, children });
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="p-8 text-center font-sans text-soft">Loading...</div>;
  if (!member) return <div className="p-8 text-center font-sans text-soft">Member not found</div>;

  const color = BRANCH_COLORS[member.branch] || "#C9A876";

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <BackButton />

      {/* Hero */}
      <div className="text-center mb-8 animate-fade-in">
        <div
          className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4"
          style={{
            background: `linear-gradient(135deg, ${color}30, ${color}10)`,
            border: `3px solid ${color}50`,
          }}
        >
          {member.photoUrl ? (
            <img src={member.photoUrl} alt={member.fullName} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="font-heading text-3xl" style={{ color }}>{member.fullName.charAt(0)}</span>
          )}
        </div>
        <h1 className="font-heading text-2xl text-balete">{member.fullName}</h1>
        {member.nickname && <p className="text-soft text-sm font-sans">"{member.nickname}"</p>}
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-soft text-sm font-sans">{member.branch} branch</span>
        </div>
      </div>

      {/* Details */}
      <div className="glass-card rounded-2xl p-5 mb-6 space-y-3">
        <div className="flex justify-between text-sm font-sans">
          <span className="text-soft">Generation</span>
          <span className="text-ink font-medium">{member.generation}</span>
        </div>
        <div className="flex justify-between text-sm font-sans">
          <span className="text-soft">Status</span>
          <span className="text-ink font-medium capitalize">{member.livingStatus}</span>
        </div>
        {member.notes && (
          <div className="pt-2 border-t border-white/20">
            <p className="text-soft text-sm font-sans">{member.notes}</p>
          </div>
        )}
      </div>

      {/* Family connections */}
      {(family.parents.length > 0 || family.spouse || family.children.length > 0) && (
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-heading text-lg text-balete mb-3">Family</h2>
          <div className="space-y-3">
            {family.parents.map((p) => (
              <a key={p.id} href={`/tree/${p.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/50 transition-colors">
                <span className="text-soft text-xs font-sans w-16">Parent</span>
                <span className="text-ink text-sm font-sans">{p.fullName}</span>
              </a>
            ))}
            {family.spouse && (
              <a href={`/tree/${family.spouse.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/50 transition-colors">
                <span className="text-soft text-xs font-sans w-16">Spouse</span>
                <span className="text-ink text-sm font-sans">{family.spouse.fullName}</span>
              </a>
            )}
            {family.children.map((c) => (
              <a key={c.id} href={`/tree/${c.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/50 transition-colors">
                <span className="text-soft text-xs font-sans w-16">Child</span>
                <span className="text-ink text-sm font-sans">{c.fullName}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Link from MemberCard**

In `src/components/tree/MemberCard.tsx`, add a "View Profile" link:
```tsx
<a href={`/tree/${member.id}`} className="text-hibiscus text-sm font-sans hover:underline">
  View full profile →
</a>
```

**Step 3: Build and test**

---

## Phase 11: Chat / Messaging

### Task 11.1: Family Message Board

**Files:**
- Create: `src/app/(main)/chat/page.tsx`
- Create: `src/lib/firestore/messages.ts`
- Modify: `src/lib/types.ts` (add ChatMessage type)
- Modify: `firestore.rules`

**Step 1: Add ChatMessage type**

```ts
// Add to src/lib/types.ts
export interface ChatMessage {
  id: string;
  authorName: string;
  authorBranch: string | null;
  content: string;
  createdAt: Timestamp;
}
```

**Step 2: Create messages Firestore helper**

```ts
// src/lib/firestore/messages.ts
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  limit,
} from "firebase/firestore";
import type { ChatMessage } from "@/lib/types";

const COLLECTION = "chat_messages";

export function subscribeToMessages(
  callback: (messages: ChatMessage[]) => void
) {
  const q = query(
    collection(db, COLLECTION),
    orderBy("createdAt", "desc"),
    limit(100)
  );
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as ChatMessage)
      .reverse(); // oldest first
    callback(messages);
  });
}

export async function sendMessage(
  data: Omit<ChatMessage, "id" | "createdAt">
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}
```

**Step 3: Create chat page**

The chat page should:
- Show messages in a scrollable list (oldest first)
- Auto-scroll to bottom on new messages
- Input field with send button
- Read member name/branch from cookies
- Real-time updates via Firestore subscription
- Simple, clean UI matching glassmorphism theme

Key UI:
- Messages list with author name, branch color dot, content, timestamp
- Sticky input bar at bottom
- Empty state: "No messages yet. Say hello!"

**Step 4: Add to navigation**

Add Chat link to `src/app/(main)/layout.tsx` nav grid.

**Step 5: Add Firestore rules**

```
match /chat_messages/{doc} {
  allow read: if true;
  allow create: if true;
  allow update, delete: if false;
}
```

**Step 6: Build and test**

Run: `npx next build`

---

## Final: Seed All New Collections

### Task F.1: Seed Trivia Questions

**Files:**
- Create: `scripts/seed-trivia.js`

Seed 10 family trivia questions about the Apor family history.

### Task F.2: Update Firestore Rules

**Files:**
- Modify: `firestore.rules`

Add rules for:
- `trivia_questions`: public read, no write
- `trivia_scores`: public read, public create, no update/delete
- `chat_messages`: public read, public create, no update/delete

---

## Execution Order

1. Phase 6: Games (Tasks 6.1)
2. Phase 7: Admin Management (Tasks 7.1, 7.2)
3. Phase 9: Countdown & Event Details (Tasks 9.1, 9.2)
4. Phase 10: Member Profiles (Task 10.1)
5. Phase 11: Chat (Task 11.1)
6. Phase 8: Notifications (Task 8.1) — requires external service setup
7. Final: Seed data + Firestore rules

---

## Dependencies

- **No new npm packages** required for Phases 6-7, 9-11
- **Phase 8** requires `resend` package + API key
- **Firebase Storage** must be enabled for member photo uploads (Phase 7.2)
