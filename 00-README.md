# Ugnayan — Family Reunion Web App

*"Ugnayan" (Cebuano/Filipino: connection, bond) — working name, rename freely (e.g. "Familia [Surname]").*

This folder is the full spec set for handing off to a coding agent (opencode, Kiro, Claude Code). Read in this order:

1. **01-PROJECT-SPEC.md** — features, data model, tech stack, build phases
2. **02-STRUCTURE.md** — folder layout, file naming, Firestore/Storage rules
3. **03-DESIGN-SYSTEM.md** — visual identity, tokens, components, copy voice
4. **04-AGENT.md** — operating instructions for the coding agent (paste into your agent's system prompt / AGENTS.md)
5. **SKILL.md** — drop into your skills folder (`.opencode/skills/` or equivalent) as a reusable reference for this class of app

## Quick facts
- **Stack:** Next.js 15 (App Router) + React 19 + Tailwind + Firebase (Firestore, Storage, no full Auth — shared passcode gate)
- **Platform:** Web app, mobile-first responsive, deployed on Vercel
- **Signature feature:** an interactive generational family tree that doubles as the site's visual spine and primary navigation
- **Phasing:** RSVP + Schedule + Location first (pre-event utility) → Gallery (during/after) → Family Tree + Games (can ship after launch, but tree data model should be built from day one since RSVP records reference it)

## Before the agent starts
Fill in these placeholders across the docs — search for `[FAMILY_NAME]`, `[EVENT_DATE]`, `[VENUE]`:
- Family/clan surname (used in the header, copy, and tree root)
- Reunion date(s) and venue
- Whether the family tree starts from one root couple or multiple branches merging
