-- Name and room slug are public identifiers, never membership credentials.
-- SECURITY DEFINER is required because token storage must remain inaccessible to
-- API roles. Return only the session proven by the request's bearer capability.
create or replace function public.resume_room_member(p_room_slug text, p_display_name text)
returns table(room_id uuid, member_id uuid, member_token uuid, display_name text, role public.member_role)
language plpgsql security definer set search_path = '' as $$
declare
  v_token uuid;
begin
  begin
    v_token := (nullif(pg_catalog.current_setting('request.headers', true), '')::jsonb ->> 'x-member-token')::uuid;
  exception when invalid_text_representation then
    raise exception 'A valid member access token is required.' using errcode = '28000';
  end;
  if v_token is null then
    raise exception 'A valid member access token is required.' using errcode = '28000';
  end if;

  return query
    select r.id, m.id, s.token, m.display_name, m.role
    from public.rooms as r
    join public.room_members as m on m.room_id = r.id
    join public.member_sessions as s on s.member_id = m.id
    where r.slug = p_room_slug
      and pg_catalog.lower(m.display_name) = pg_catalog.lower(pg_catalog.btrim(p_display_name))
      and s.token = v_token;
  if not found then
    raise exception 'A valid member access token is required.' using errcode = '28000';
  end if;
end;
$$;

revoke all on function public.resume_room_member(text, text) from public;
grant execute on function public.resume_room_member(text, text) to anon, authenticated;

-- Existing tokens must never be listable through the Data API. Other member
-- operations already use SECURITY DEFINER RPCs and the X-Member-Token header.
revoke all on table public.member_sessions from public, anon, authenticated;
alter table public.member_sessions enable row level security;

-- The existing join_from_share implementation/schema is absent from source.
-- A share link may navigate; it must not mint membership based on a public name.
-- Fail closed until the owner reviews an independently authenticated invite flow.
do $$
declare v_function regprocedure;
begin
  for v_function in
    select p.oid::regprocedure from pg_catalog.pg_proc as p
    join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'join_from_share'
  loop
    execute pg_catalog.format('revoke all on function %s from public, anon, authenticated', v_function);
  end loop;
end;
$$;
