"""Exercise the actual migrations on disposable local PostgreSQL, never Supabase.

Run: python3 -m unittest discover -s tests -v
PG_BIN may point to an installed PostgreSQL bin directory. The server listens on
an isolated Unix socket only and is always stopped before its directory is removed.
"""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
PG_BIN = Path(os.environ.get('PG_BIN', '/usr/lib/postgresql/18/bin'))

@unittest.skipUnless((PG_BIN / 'initdb').exists(), 'Install local PostgreSQL or set PG_BIN')
class MemberResumeTests(unittest.TestCase):
    def test_real_migrations_require_token_and_do_not_mint_membership(self):
        with tempfile.TemporaryDirectory(prefix='common-room-auth-test-') as directory:
            base = Path(directory)
            data = base / 'data'
            self.run_pg('initdb', '-D', str(data), '-A', 'trust', '-U', 'postgres', '--no-locale', '--encoding=UTF8')
            self.run_pg('pg_ctl', '-D', str(data), '-l', str(base / 'server.log'), '-o', f"-F -h '' -k {base} -p 55439", '-w', 'start')
            try:
                self.psql(base, '''
                    create role anon; create role authenticated;
                    create type public.member_role as enum ('member','admin');
                    create table public.rooms(id uuid primary key, slug text);
                    create table public.room_members(id uuid primary key, room_id uuid, display_name text, role public.member_role);
                    create table public.member_sessions(member_id uuid primary key, token uuid default gen_random_uuid());
                    insert into public.rooms values ('00000000-0000-4000-8000-000000000001','test-room');
                    insert into public.room_members values
                      ('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','Test Member','member'),
                      ('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001','Other Member','admin');
                    insert into public.member_sessions values
                      ('00000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001'),
                      ('00000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001');
                    grant select on public.member_sessions to anon,authenticated;
                    create function public.join_from_share(text,text) returns uuid language sql security definer
                      as 'select token from public.member_sessions limit 1';
                    grant execute on function public.join_from_share(text,text) to anon,authenticated;
                ''')
                self.psql(base, (ROOT / 'supabase/migrations/20260911195500_resume_existing_room_member.sql').read_text())
                self.psql(base, '''
                    do $$ begin
                      begin
                        perform * from public.resume_room_member('test-room','Test Member');
                      exception when ambiguous_column then return;
                      end;
                      raise exception 'Expected the original ambiguous-column error under default settings';
                    end $$;
                ''')
                self.psql(base, '''
                    -- The old source has an ambiguous room_id with PostgreSQL's
                    -- default conflict mode. Exercise its intended name-only
                    -- behavior using the column-preferring setting too.
                    set plpgsql.variable_conflict = use_column;
                    do $$ begin
                      if (select count(*) from public.resume_room_member('test-room','Test Member')) <> 1
                        then raise exception 'Expected vulnerable baseline to resume by public name'; end if;
                    end $$;
                ''')
                migration = next((ROOT / 'supabase/migrations').glob('*_secure_member_resume.sql'))
                self.psql(base, migration.read_text())
                self.psql(base, '''
                    create function public.assert_denied(headers text, room_slug text, member_name text) returns void
                    language plpgsql as $$ begin
                      perform set_config('request.headers',headers,true);
                      begin
                        perform * from public.resume_room_member(room_slug,member_name);
                      exception when sqlstate '28000' then return;
                      end;
                      raise exception 'Unauthorized resume succeeded';
                    end $$;
                    set role anon;
                    select public.assert_denied('{}','test-room','Test Member');
                    select public.assert_denied('','test-room','Test Member');
                    select public.assert_denied('{"x-member-token":"invalid"}','test-room','Test Member');
                    select public.assert_denied('{"x-member-token":"30000000-0000-4000-8000-000000000001"}','test-room','Test Member');
                    select public.assert_denied('{"x-member-token":"10000000-0000-4000-8000-000000000001"}','other-room','Test Member');
                    select public.assert_denied('{"x-member-token":"10000000-0000-4000-8000-000000000001"}','test-room','Other Member');
                    select set_config('request.headers','{"x-member-token":"10000000-0000-4000-8000-000000000001"}',false);
                    do $$ declare result record; begin
                      select * into strict result from public.resume_room_member('test-room','  test MEMBER  ');
                      if result.member_id <> '00000000-0000-4000-8000-000000000002'::uuid or result.role <> 'member'
                        then raise exception 'Authorized member or role changed'; end if;
                    end $$;
                    reset role;
                    do $$ begin
                      if (select count(*) from public.member_sessions) <> 2 then raise exception 'Session was minted'; end if;
                      if has_table_privilege('anon','public.member_sessions','select') or has_table_privilege('authenticated','public.member_sessions','select')
                        then raise exception 'Token table exposed'; end if;
                      if has_function_privilege('anon','public.join_from_share(text,text)','execute') or has_function_privilege('authenticated','public.join_from_share(text,text)','execute')
                        then raise exception 'Unreviewed invite RPC exposed'; end if;
                    end $$;
                ''')
            finally:
                self.run_pg('pg_ctl', '-D', str(data), '-m', 'fast', '-w', 'stop')

    def run_pg(self, executable, *args):
        subprocess.run([str(PG_BIN / executable), *args], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)

    def psql(self, socket, sql):
        result = subprocess.run([str(PG_BIN / 'psql'), '-X', '-h', str(socket), '-p', '55439', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-q'], input=sql, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
        self.assertEqual(result.returncode, 0, result.stderr)

if __name__ == '__main__':
    unittest.main()
