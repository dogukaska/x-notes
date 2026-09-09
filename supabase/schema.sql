-- Notlar tablosu, storage bucket'i ve satır bazlı güvenlik (RLS) kuralları.
-- Supabase Dashboard > SQL Editor içinde çalıştır.

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(content) between 0 and 2000),
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_not_empty check (char_length(content) > 0 or image_path is not null)
);

create index if not exists notes_user_id_created_at_idx
  on public.notes (user_id, created_at desc);

alter table public.notes enable row level security;

drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own" on public.notes
  for select using (auth.uid() = user_id);

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own" on public.notes
  for insert with check (auth.uid() = user_id);

drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own" on public.notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own" on public.notes
  for delete using (auth.uid() = user_id);

-- Realtime yayınına ekle (canlı güncellemeler için)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notes'
  ) then
    alter publication supabase_realtime add table public.notes;
  end if;
end $$;

-- Görseller için private storage bucket'i
insert into storage.buckets (id, name, public)
values ('note-images', 'note-images', false)
on conflict (id) do nothing;

drop policy if exists "note_images_select_own" on storage.objects;
create policy "note_images_select_own" on storage.objects
  for select using (bucket_id = 'note-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "note_images_insert_own" on storage.objects;
create policy "note_images_insert_own" on storage.objects
  for insert with check (bucket_id = 'note-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "note_images_delete_own" on storage.objects;
create policy "note_images_delete_own" on storage.objects
  for delete using (bucket_id = 'note-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "note_images_update_own" on storage.objects;
create policy "note_images_update_own" on storage.objects
  for update using (bucket_id = 'note-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Profil bilgileri (isim, kullanıcı adı, biyografi, avatar/kapak görseli)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Sen',
  username text not null default 'kullanici',
  bio text not null default '',
  avatar_path text,
  banner_path text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
