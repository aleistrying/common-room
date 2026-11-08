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


### Member access and paused-backend rollout

A room slug, display name, or shared-item link does not prove membership. New
browser sessions require the member's existing access token, shared privately by
the room owner. The browser sends it in `X-Member-Token`; the resume RPC verifies
that it belongs to the requested member and room. It never creates a session.
Existing cached sessions continue using their existing tokens. Shared links still
select the item after sign-in; they cannot create membership by name.

The `secure_member_resume` migration is a **reviewable source repair**, not an
applied production change. The Common Room Supabase project is paused and must
remain paused during this review. Before any unpause:

1. Review the actual database definitions, grants, RLS, and all token-returning
   RPCs. The repository lacks the base schema and `join_from_share` definition.
2. Apply the reviewed migration through the owner's normal process. It replaces
   name-only resume, removes direct API-role access to the token table, and
   revokes API execution of unreviewed `join_from_share` overloads. This means
   name-only invites no longer sign a visitor in.
3. Rotate previously issued member tokens through a trusted administrative path,
   then share replacements privately. Old name-based access may have disclosed
   them. Rotation invalidates cached browser sessions until members sign in again.
4. Review remaining RPC/table access and run Supabase advisors before deciding
   whether the backend is safe to resume. This source patch cannot establish
   production safety without that review and migration.

The original committed resume function also raises an ambiguous-column error on
stock PostgreSQL's default PL/pgSQL setting. Production's actual function/settings
cannot be checked while paused; its intended name-only logic remains unsafe.

Run `python3 -m unittest discover -s tests -v` to exercise the real migrations on
a disposable, socket-only PostgreSQL instance. Set `PG_BIN` to a PostgreSQL bin
directory when it is not `/usr/lib/postgresql/18/bin`. The test verifies the old
ambiguity and name-only behavior, then checks missing/malformed/wrong tokens,
cross-room/member denial, valid access, no minted sessions, token-table grants,
and revoked share-join RPC access. It never contacts Supabase.
