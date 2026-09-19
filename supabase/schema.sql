-- Run this whole file once in the Supabase SQL editor (Project > SQL Editor > New query).

create extension if not exists "pgcrypto";

-- === Tables ===================================================

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_name text not null,
  student_email text,
  file_path text not null,
  file_name text not null,
  file_size bigint,
  submitted_at timestamptz not null default now()
);

create index if not exists submissions_class_id_idx on public.submissions (class_id);

-- === Row Level Security ========================================

alter table public.classes enable row level security;
alter table public.submissions enable row level security;

-- classes: readable by anyone (students need the list to submit),
-- writable only by signed-in teachers.
create policy "classes_select_all" on public.classes
  for select to anon, authenticated using (true);

create policy "classes_insert_authenticated" on public.classes
  for insert to authenticated with check (true);

create policy "classes_delete_own" on public.classes
  for delete to authenticated using (auth.uid() = created_by);

-- submissions: anyone (anon) can create a submission row (the public form),
-- only signed-in teachers can read the list.
create policy "submissions_insert_anyone" on public.submissions
  for insert to anon, authenticated with check (true);

create policy "submissions_select_authenticated" on public.submissions
  for select to authenticated using (true);

-- === Storage ====================================================
-- Private bucket: students can upload but not list/read back other files;
-- teachers (authenticated) can read to generate download links.

insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', false)
on conflict (id) do nothing;

create policy "storage_submissions_insert_anyone"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'submissions');

create policy "storage_submissions_select_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'submissions');
