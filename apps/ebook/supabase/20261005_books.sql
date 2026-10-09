-- Bibliothek: Fortschritt pro Nutzer. (Bereits am 05.10.2026 auf Projekt emxqoahtipbmumghlixb angewendet.)
-- Bucket "books" ist privat; Dateien liegen unter books/<product>/… und werden NUR vom Server
-- (Service-Role) nach Prüfung von public.neo_access als signierte Links ausgegeben.
insert into storage.buckets (id, name, public, file_size_limit)
values ('books', 'books', false, 524288000) on conflict (id) do nothing;

create table if not exists public.book_progress (
  user_id uuid not null,
  product text not null,
  kind text not null check (kind in ('ebook','audio')),
  position text,
  percent real default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, product, kind)
);
alter table public.book_progress enable row level security;
create policy "book_progress_own" on public.book_progress for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
