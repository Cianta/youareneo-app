-- Additive Phase 1. No changes to existing accounts, profiles or legacy data.
create schema if not exists trinity_private;
revoke all on schema trinity_private from public, anon, authenticated;

-- Keep this allow-list aligned with SAVE_PRODUCTS in lib/voice/contracts.ts.
create function public.trinity_can_save() returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists(select 1 from public.neo_access where user_id = (select auth.uid())
    and product = any(array['foerder','app']) and revoked_at is null);
$$;
revoke all on function public.trinity_can_save() from public, anon;
grant execute on function public.trinity_can_save() to authenticated, service_role;

create table public.trinity_projects (
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 100),
  created_at timestamptz not null default now(),
  primary key (user_id, name)
);
create table public.trinity_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  title text not null check (length(title) between 1 and 200),
  transcript text not null check (length(transcript) between 1 and 20000),
  summary text not null default '' check (length(summary) <= 4000),
  type text not null check (type in ('aufgabe','idee','notiz','termin')),
  project text,
  tags text[] not null default '{}' check (cardinality(tags) <= 20),
  due timestamptz,
  assignee text check (length(assignee) <= 100),
  audio_path text check (audio_path is null or audio_path like user_id::text || '/' || id::text || '.%'),
  source text not null check (source in ('voice','text')),
  search_document tsvector generated always as (to_tsvector('german', title || ' ' || summary || ' ' || transcript)) stored,
  foreign key (user_id, project) references public.trinity_projects(user_id,name)
);
create index trinity_notes_owner_created on public.trinity_notes(user_id, created_at desc);
create index trinity_notes_search on public.trinity_notes using gin(search_document);
create index trinity_notes_project on public.trinity_notes(user_id,project);

create table public.hermes_queue (
  note_id uuid primary key references public.trinity_notes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  instruction text not null,
  status text not null default 'wartet_auf_bestaetigung'
    check (status in ('wartet_auf_bestaetigung','freigegeben','erledigt','abgelehnt')),
  approved_at timestamptz,
  result text check (length(result) <= 10000)
);
create index hermes_queue_owner on public.hermes_queue(user_id,created_at desc);
create index hermes_queue_status on public.hermes_queue(status,created_at);

create table public.usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  voice_seconds integer not null default 0 check (voice_seconds >= 0),
  requests integer not null default 0 check (requests >= 0),
  primary key (user_id,month)
);

alter table public.trinity_projects enable row level security;
alter table public.trinity_notes enable row level security;
alter table public.hermes_queue enable row level security;
alter table public.usage enable row level security;
revoke all on public.trinity_projects, public.trinity_notes, public.hermes_queue, public.usage from public, anon, authenticated;
grant select, insert on public.trinity_projects, public.trinity_notes to authenticated;
grant select on public.hermes_queue, public.usage to authenticated;
grant all on public.trinity_projects, public.trinity_notes, public.hermes_queue, public.usage to service_role;
create policy projects_read on public.trinity_projects for select to authenticated using ((select auth.uid()) = user_id);
create policy projects_create on public.trinity_projects for insert to authenticated with check ((select auth.uid()) = user_id and (select public.trinity_can_save()));
create policy notes_read on public.trinity_notes for select to authenticated using ((select auth.uid()) = user_id);
create policy notes_create on public.trinity_notes for insert to authenticated with check ((select auth.uid()) = user_id and (select public.trinity_can_save()));
create policy queue_read on public.hermes_queue for select to authenticated using ((select auth.uid()) = user_id);
create policy usage_read on public.usage for select to authenticated using ((select auth.uid()) = user_id);

-- Atomic note + queue creation; no client can grant execution or rewrite instructions.
create function trinity_private.enqueue_note() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is distinct from new.user_id then raise exception 'owner required'; end if;
  if 'hermes' = any(new.tags) then
    insert into public.hermes_queue(note_id,user_id,instruction)
      values(new.id,new.user_id,new.transcript);
  end if;
  return new;
end $$;
revoke all on function trinity_private.enqueue_note() from public, anon, authenticated;
create trigger enqueue_note after insert on public.trinity_notes for each row execute function trinity_private.enqueue_note();

-- Called only by server service_role. Atomic UPDATE prevents parallel limit bypass.
create function public.trinity_reserve_usage(p_user uuid, p_seconds integer, p_minutes_limit integer, p_requests_limit integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare current_month date := date_trunc('month',now() at time zone 'UTC')::date;
begin
  if p_seconds < 0 or p_seconds > 300 or p_minutes_limit < 0 or p_requests_limit < 0 then
    raise exception 'invalid quota parameters';
  end if;
  insert into public.usage(user_id,month) values(p_user,current_month) on conflict do nothing;
  update public.usage set voice_seconds = voice_seconds + p_seconds, requests = requests + 1
    where user_id = p_user and month = current_month
      and voice_seconds + p_seconds <= p_minutes_limit::bigint * 60 and requests < p_requests_limit;
  return found;
end $$;
revoke all on function public.trinity_reserve_usage(uuid,integer,integer,integer) from public, anon, authenticated;
grant execute on function public.trinity_reserve_usage(uuid,integer,integer,integer) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('trinity-audio','trinity-audio',false,20971520,array['audio/webm','audio/mp4','audio/ogg']);
create policy trinity_audio_read on storage.objects for select to authenticated
using(bucket_id='trinity-audio' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy trinity_audio_create on storage.objects for insert to authenticated
with check(bucket_id='trinity-audio' and (storage.foldername(name))[1]=(select auth.uid())::text and (select public.trinity_can_save()));
create policy trinity_audio_remove on storage.objects for delete to authenticated
using(bucket_id='trinity-audio' and (storage.foldername(name))[1]=(select auth.uid())::text);
