# Common Room architecture

Common Room is one product made from small feature modules, all sharing one room data model.

## Product flow

`Activity → options → plan → unresolved decisions → confirmed plan → calendar/reminders → attend`

The main navigation stays intentionally small: **Ideas** and **Planner**. Polls, RSVP, availability and reminders appear contextually instead of becoming permanent top-level tabs.

## Frontend

- Next.js App Router + React + TypeScript.
- FullCalendar provides arbitrary planner start/end times, drag/drop and resize on desktop; mobile retains direct Plan actions.
- Domain data is kept in `RoomSnapshot` and derived per feature.
- `useRoom` owns room membership, Supabase reads/writes, optimistic mutations, realtime refresh broadcasts and offline replay.

## Local-first behavior

The read path is `UI → IndexedDB cache → Supabase reconciliation`.

Mutations use client-generated UUIDs and are applied optimistically. Failed/offline mutations are written to an IndexedDB outbox, replayed in order when connectivity returns, then reconciled against the room snapshot. This keeps the installed/previously-loaded app usable when the network or hosting layer is temporarily unavailable.

## Backend

Supabase Postgres is the shared source of truth. Row-level security resolves a room member from an opaque per-browser member token sent in `x-member-token`. The root app can resume only an existing seeded room member by display name; share links can take a user directly into one activity, event, decision or availability request.

Feature tables cover activities/options/categories, events/options/RSVP, decision polls, weekly/event-specific availability, share links and reminder preferences.

## PWA

`public/sw.js` caches the app shell and runtime same-origin GETs, provides navigation fallback after first load, and contains a Web Push notification handler. Push subscription storage exists in Supabase; VAPID-backed background delivery must keep its private key outside the public repository.

## Calendar

Confirmed/scheduled events expose a Google Calendar action and standards-based `.ics` file. Calendar timestamps use the event/browser IANA timezone; physical location is stored separately on the event.

## Repository/deployment

- `main`: production
- feature branches: Vercel Preview
- preview QA before merging/promoting
- no member session tokens, invite codes, production private keys or server secrets are committed
