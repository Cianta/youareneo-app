-- YOU ARE NEO · Bibliothek (E-Book- & Hörbuch-Player)
-- Zugriff läuft über public.neo_access (product = Ordnername im privaten Bucket "books").
-- Beispiel: product 'schoepfungsschluessel-ebook' -> Dateien unter books/schoepfungsschluessel-ebook/...

insert into storage.buckets (id, name, public, file_size_limit)
values ('books', 'books', false, 524288000)
on conflict (id) do nothing;

-- Lesen nur mit aktivem Eintrag in neo_access für den Ordner (= product)
drop policy if exists "books_read_entitled" on storage.objects;
create policy "books_read_entitled" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'books'
    and exists (
      select 1 from public.neo_access a
      where a.user_id = auth.uid()
        and a.revoked_at is null
        and a.product = (storage.foldername(name))[1]
    )
  );

-- Lesefortschritt / Hörposition pro Nutzer und Titel
create table if not exists public.book_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  product text not null,
  kind text not null check (kind in ('ebook','audio')),
  position text,            -- epubcfi bzw. Sekunden
  percent real default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, product, kind)
);
alter table public.book_progress enable row level security;

drop policy if exists "book_progress_own" on public.book_progress;
create policy "book_progress_own" on public.book_progress
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
