-- Kursraum: additive migration. neo_access stays the single entitlement source.
-- Unlock keys per course (e.g. 'kursbibliothek', 'kurs-yoga-grundlagen', 'foerder');
-- an empty list means: free for every signed-in member. 'kurs-studio' may edit everything.
create table public.kurs_courses (
  id uuid primary key default gen_random_uuid(),
  tenant text not null default 'youareneo' check (tenant ~ '^[a-z][a-z0-9-]{0,63}$'),
  slug text not null check (slug ~ '^[a-z0-9][a-z0-9-]{0,95}$'),
  title text not null check (char_length(title) between 1 and 200),
  subtitle text check (char_length(subtitle) <= 300),
  description text check (char_length(description) <= 20000),
  category text check (char_length(category) <= 100),
  cover_url text check (cover_url ~ '^(https://|/kurse/)'),
  price_eur numeric(8,2) check (price_eur >= 0),
  products text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published')),
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant, slug)
);
create table public.kurs_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.kurs_courses(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  summary text check (char_length(summary) <= 2000),
  thumb_url text check (thumb_url ~ '^(https://|/kurse/)'),
  position int not null default 0
);
-- video_source/video_ref keep the host swappable: Riverside now, YouTube for free TV,
-- later an own server. clip_start/clip_end and chapters re-cut without re-encoding.
create table public.kurs_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.kurs_courses(id) on delete cascade,
  module_id uuid not null references public.kurs_modules(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  summary text check (char_length(summary) <= 1000),
  body text check (char_length(body) <= 100000),
  kind text not null default 'video' check (kind in ('video','pdf','text','live')),
  thumb_url text check (thumb_url ~ '^(https://|/kurse/)'),
  attachments jsonb not null default '[]' check (jsonb_typeof(attachments) = 'array'),
  status text not null default 'published' check (status in ('draft','published')),
  video_source text not null default 'none' check (video_source in ('none','riverside','youtube','vimeo','url')),
  video_ref text check (char_length(video_ref) <= 2000),
  clip_start int check (clip_start >= 0),
  clip_end int check (clip_end > 0),
  chapters jsonb not null default '[]' check (jsonb_typeof(chapters) = 'array'),
  duration_s int check (duration_s >= 0),
  free_preview boolean not null default false,
  position int not null default 0,
  check (clip_end is null or clip_start is null or clip_end > clip_start)
);
create table public.kurs_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.kurs_lessons(id) on delete cascade,
  completed_at timestamptz,
  position_s int not null default 0 check (position_s >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create index kurs_modules_course on public.kurs_modules(course_id, position);
create index kurs_lessons_module on public.kurs_lessons(module_id, position);
create index kurs_lessons_course on public.kurs_lessons(course_id);
create index kurs_progress_lesson on public.kurs_progress(lesson_id);

create function public.kurs_is_studio() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.neo_access a where a.user_id = (select auth.uid())
    and a.product = 'kurs-studio' and a.revoked_at is null);
$$;
create function public.kurs_unlocked(p_course uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.kurs_courses c where c.id = p_course and (
    cardinality(c.products) = 0 or exists (select 1 from public.neo_access a
      where a.user_id = (select auth.uid()) and a.revoked_at is null
        and (a.product = any(c.products) or a.product = 'kurs-studio'))));
$$;
-- Locked lessons stay listed (title, length) without leaking their video reference.
create function public.kurs_outline(p_course uuid)
returns table (id uuid, module_id uuid, title text, "position" int, duration_s int, free_preview boolean, unlocked boolean)
language sql stable security definer set search_path = '' as $$
  select l.id, l.module_id, l.title, l.position, l.duration_s, l.free_preview,
    (l.free_preview or public.kurs_unlocked(l.course_id))
  from public.kurs_lessons l join public.kurs_courses c on c.id = l.course_id
  where l.course_id = p_course and (select auth.uid()) is not null
    and ((c.status = 'published' and l.status = 'published') or public.kurs_is_studio())
  order by l.position;
$$;
-- Lesson counts for the library, including lessons the member has not unlocked yet.
create function public.kurs_lesson_counts()
returns table (course_id uuid, lessons int)
language sql stable security definer set search_path = '' as $$
  select l.course_id, count(*)::int from public.kurs_lessons l join public.kurs_courses c on c.id = l.course_id
  where (select auth.uid()) is not null and ((c.status = 'published' and l.status = 'published') or public.kurs_is_studio())
  group by l.course_id;
$$;
revoke all on function public.kurs_is_studio(), public.kurs_unlocked(uuid), public.kurs_outline(uuid), public.kurs_lesson_counts() from public, anon;
grant execute on function public.kurs_is_studio(), public.kurs_unlocked(uuid), public.kurs_outline(uuid), public.kurs_lesson_counts() to authenticated;

alter table public.kurs_courses enable row level security;
alter table public.kurs_modules enable row level security;
alter table public.kurs_lessons enable row level security;
alter table public.kurs_progress enable row level security;
revoke all on public.kurs_courses, public.kurs_modules, public.kurs_lessons, public.kurs_progress from public, anon;
grant select, insert, update, delete on public.kurs_courses, public.kurs_modules, public.kurs_lessons, public.kurs_progress to authenticated;
grant all on public.kurs_courses, public.kurs_modules, public.kurs_lessons, public.kurs_progress to service_role;

create policy kurs_courses_read on public.kurs_courses for select to authenticated
  using (status = 'published' or (select public.kurs_is_studio()));
create policy kurs_courses_studio on public.kurs_courses for all to authenticated
  using ((select public.kurs_is_studio())) with check ((select public.kurs_is_studio()));
create policy kurs_modules_read on public.kurs_modules for select to authenticated
  using (exists (select 1 from public.kurs_courses c where c.id = course_id and c.status = 'published') or (select public.kurs_is_studio()));
create policy kurs_modules_studio on public.kurs_modules for all to authenticated
  using ((select public.kurs_is_studio())) with check ((select public.kurs_is_studio()));
create policy kurs_lessons_read on public.kurs_lessons for select to authenticated
  using ((select public.kurs_is_studio()) or (status = 'published' and exists (select 1 from public.kurs_courses c where c.id = course_id and c.status = 'published')
    and (free_preview or public.kurs_unlocked(course_id))));
create policy kurs_lessons_studio on public.kurs_lessons for all to authenticated
  using ((select public.kurs_is_studio())) with check ((select public.kurs_is_studio()));
create policy kurs_progress_own on public.kurs_progress for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

comment on table public.kurs_courses is 'Kursraum courses. products = neo_access keys that unlock the course; empty = free for members.';
comment on column public.kurs_lessons.video_source is 'none | riverside | youtube (only free/preview content, YouTube API policy III.F.3.a) | vimeo | url (own server, mp4/HLS).';
