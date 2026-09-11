# Common Room architecture

## Goal

Keep the everyday product simple while allowing several small collaborative sub-apps to share one data model.

## Product modules

- Activities — reusable things the room might do, with options, interest, categories and ownership.
- Planner — dated plans/events with arbitrary start/end times, tentative/confirmed state and RSVP.
- Decisions — contextual choice and multi-choice polls attached to an activity or plan.
- Availability — reusable weekly baseline plus event-specific date/time ranges and overlap summaries.
- Members — invite/name onboarding, role, locale and browser session identity.
- Sharing — revocable deep links for activities, events, decisions and availability requests.
- Notifications — opt-in push preferences, device subscriptions, reminders and delivery deduplication.
- Calendar — Google Calendar action plus standards-based ICS export.
- Sync — local durable cache, outbox, reconciliation and Supabase Realtime.

## Data flow

UI -> local IndexedDB cache -> sync/outbox -> Supabase

The UI should read from local state immediately. Online mutations are optimistic and queued in an outbox. Creates use client-generated UUIDs; natural/composite keys are upserted for RSVP, votes and interests. Reconnect replays pending mutations, then refreshes the room snapshot and merges Realtime updates.

## Offline/PWA

A service worker caches the app shell and safe static assets. Previously loaded/installed clients can launch while offline or during a Vercel outage. Brand-new visits and unseen deep links still require network access.

## Conflict policy

- idempotent creates via client UUID
- unique-key upserts for RSVP/votes/interests
- archive actions are idempotent
- editable rows use updated_at optimistic concurrency where practical
- true conflicts surface a small changed-elsewhere resolution instead of silent overwrite

## UX rule

Power is contextual rather than permanent navigation. Main navigation stays focused on Ideas and Planner. Polls, RSVP and availability appear in a compact Needs your response area when action is required.

## Deployment

- main: production
- feature branches / pull requests: Vercel Preview
- preview QA must pass before production promotion
- current static /app.html production remains a rollback point until the framework migration is verified
