# Common Room

Common Room is a lightweight shared planner for a small friend/residence group. It combines activity ideas, contextual polls, availability, a calendar planner, RSVP, shareable deep links, offline-friendly sync, reminders, and calendar export without turning into a heavy project-management app.

## Product model

- **Activities** — reusable things the group may want to do.
- **Options** — choices within an activity, e.g. movies within Movie Marathon.
- **Plans** — dated occurrences of an activity.
- **Decisions** — unresolved choices attached to an activity or plan.
- **Availability** — weekly baseline schedules plus event-specific time ranges.

The primary UI remains intentionally small: **Ideas** and **Planner**, with contextual `Needs your response` cards for polls, RSVP, and availability.

## Stack

- Next.js App Router + React + TypeScript
- Supabase Postgres + RLS + Realtime
- FullCalendar
- IndexedDB/outbox sync layer for offline-first behavior
- PWA/service worker
- Web Push reminders
- Vercel

## Repository workflow

`main` is production. Feature work is developed on branches and validated through Vercel Preview deployments before merge.

## Security

This repository is public. Production member data, room invite codes, browser member tokens, push credentials, Vercel credentials, and server secrets must never be committed. Public client configuration is supplied through environment variables.

See `.env.example` for variable names only.
