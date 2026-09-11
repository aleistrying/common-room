-- Public entry point for the small Common Room group.
-- It only resumes an already-seeded room member; it cannot create a member.
create or replace function public.resume_room_member(p_room_slug text, p_display_name text)
returns table(room_id uuid, member_id uuid, member_token uuid, display_name text, role public.member_role)
language plpgsql security definer set search_path=public as $$
declare v_room public.rooms%rowtype;v_member public.room_members%rowtype;v_token uuid;
begin
 if trim(coalesce(p_display_name,''))='' then raise exception 'Display name is required';end if;
 select * into v_room from public.rooms where slug=p_room_slug limit 1;if v_room.id is null then raise exception 'Room not found';end if;
 select * into v_member from public.room_members where room_id=v_room.id and lower(room_members.display_name)=lower(trim(p_display_name)) limit 1;if v_member.id is null then raise exception 'Member not found';end if;
 insert into public.member_sessions(member_id) values(v_member.id) on conflict(member_id) do nothing;select token into v_token from public.member_sessions where member_id=v_member.id;
 return query select v_room.id,v_member.id,v_token,v_member.display_name,v_member.role;
end;$$;
grant execute on function public.resume_room_member(text,text) to anon,authenticated;
