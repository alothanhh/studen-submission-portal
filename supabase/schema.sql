-- Run this whole file in the Supabase SQL editor (Project > SQL Editor > New query).
-- Safe to re-run: policies and functions are dropped and recreated.

create extension if not exists "pgcrypto";

-- === Tables ===================================================

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

-- Class roster. Only the roll number and name are stored, since names are
-- shown publicly on the submit form.
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  roll_number smallint not null,
  full_name text not null,
  created_at timestamptz not null default now(),
  unique (class_id, roll_number)
);

-- One row per time a student submits; the files live in submission_files.
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_name text not null,
  student_email text,
  submitted_at timestamptz not null default now()
);

-- Links a submission to a roster entry when the class has one. student_name keeps a snapshot.
alter table public.submissions
  add column if not exists student_id uuid references public.students(id) on delete set null;

create index if not exists submissions_class_id_idx on public.submissions (class_id);
create index if not exists submissions_student_id_idx on public.submissions (student_id);

create table if not exists public.submission_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  file_size bigint,
  position smallint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists submission_files_submission_id_idx on public.submission_files (submission_id);

-- === Row Level Security ========================================

alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_files enable row level security;

-- classes: readable by anyone (students need the list to submit),
-- writable only by signed-in teachers.
drop policy if exists "classes_select_all" on public.classes;
create policy "classes_select_all" on public.classes
  for select to anon, authenticated using (true);

drop policy if exists "classes_insert_authenticated" on public.classes;
create policy "classes_insert_authenticated" on public.classes
  for insert to authenticated with check (true);

drop policy if exists "classes_delete_own" on public.classes;
create policy "classes_delete_own" on public.classes
  for delete to authenticated using (auth.uid() = created_by);

-- students: names are readable by anyone (students pick their name on the
-- submit form); only signed-in teachers can change the roster.
drop policy if exists "students_select_all" on public.students;
create policy "students_select_all" on public.students
  for select to anon, authenticated using (true);

drop policy if exists "students_write_authenticated" on public.students;
create policy "students_write_authenticated" on public.students
  for all to authenticated using (true) with check (true);

-- submissions / submission_files: only signed-in teachers can read.
-- There are no insert policies: students create submissions only through
-- public.create_submission() below, which enforces the 1–6 file limit.
drop policy if exists "submissions_insert_anyone" on public.submissions;
drop policy if exists "submissions_select_authenticated" on public.submissions;
create policy "submissions_select_authenticated" on public.submissions
  for select to authenticated using (true);

drop policy if exists "submission_files_select_authenticated" on public.submission_files;
create policy "submission_files_select_authenticated" on public.submission_files
  for select to authenticated using (true);

-- === Storage usage =============================================
-- Submitted volume per class (sum of submission_files.file_size, which
-- create_submission() reads from Storage). security_invoker makes the view
-- respect the caller's RLS, so only teachers see real numbers.

create or replace view public.class_storage_usage
with (security_invoker = true) as
select
  c.id as class_id,
  c.name,
  count(distinct s.id) as submission_count,
  count(f.id) as file_count,
  coalesce(sum(f.file_size), 0)::bigint as total_bytes
from public.classes c
left join public.submissions s on s.class_id = c.id
left join public.submission_files f on f.submission_id = s.id
group by c.id, c.name;

revoke all on public.class_storage_usage from anon;
grant select on public.class_storage_usage to authenticated;

-- === Submit RPC =================================================
-- Creates a submission and its files in one transaction.
-- p_files: [{ "file_path": "...", "file_name": "..." }, ...]  (size is read from Storage)
-- p_student_id: roster entry, required when the class has a roster. The stored
-- name then comes from the roster, not from p_student_name.

drop function if exists public.create_submission(uuid, uuid, text, jsonb);
drop function if exists public.create_submission(uuid, uuid, text, jsonb, uuid);
create function public.create_submission(
  p_id uuid,
  p_class_id uuid,
  p_student_name text,
  p_files jsonb,
  p_student_id uuid default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  file_count int := jsonb_array_length(p_files);
  item jsonb;
  idx int := 0;
  v_name text := trim(p_student_name);
  v_path text;
  v_file_name text;
  v_ext text;
  v_size bigint;
  -- Keep in sync with MIME_BY_EXTENSION in src/lib/fileRules.ts.
  allowed_ext text[] := array['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf'];
begin
  if p_student_id is not null then
    select s.full_name into v_name
    from public.students s
    where s.id = p_student_id and s.class_id = p_class_id;
    if v_name is null then
      raise exception 'Student does not belong to this class';
    end if;
  elsif exists (select 1 from public.students s where s.class_id = p_class_id) then
    raise exception 'student_id is required for classes with a roster';
  end if;

  if coalesce(v_name, '') = '' then
    raise exception 'student_name is required';
  end if;
  if file_count < 1 or file_count > 6 then
    raise exception 'A submission must have between 1 and 6 files (got %)', file_count;
  end if;

  insert into public.submissions (id, class_id, student_id, student_name)
  values (p_id, p_class_id, p_student_id, v_name);

  for item in select * from jsonb_array_elements(p_files) loop
    v_path := item ->> 'file_path';
    v_file_name := trim(coalesce(item ->> 'file_name', ''));
    v_ext := lower(substring(v_file_name from '\.([^.]+)$'));

    -- Files must live under this submission's own folder in the bucket.
    if v_path is null or v_path not like p_class_id::text || '/' || p_id::text || '/%' then
      raise exception 'Invalid file_path %', v_path;
    end if;
    if v_file_name = '' or length(v_file_name) > 255 then
      raise exception 'Invalid file_name';
    end if;
    if v_ext is null or not (v_ext = any (allowed_ext)) then
      raise exception 'File type not allowed: %', v_file_name;
    end if;
    -- The displayed name must not disguise the stored file (e.g. "baitap.docx" -> "x.exe").
    if lower(substring(v_path from '\.([^.]+)$')) is distinct from v_ext then
      raise exception 'File extension mismatch: %', v_file_name;
    end if;

    -- Proves the upload exists, and records the size Storage measured instead of the client's claim.
    select (o.metadata ->> 'size')::bigint into v_size
    from storage.objects o
    where o.bucket_id = 'submissions' and o.name = v_path;
    if not found then
      raise exception 'Uploaded file not found: %', v_path;
    end if;

    insert into public.submission_files (submission_id, file_path, file_name, file_size, position)
    values (p_id, v_path, v_file_name, v_size, idx);
    idx := idx + 1;
  end loop;
end;
$$;

revoke all on function public.create_submission(uuid, uuid, text, jsonb, uuid) from public;
grant execute on function public.create_submission(uuid, uuid, text, jsonb, uuid) to anon, authenticated;

-- === Storage ====================================================
-- Private bucket: students can upload but not list/read back other files;
-- teachers (authenticated) can read to generate download links.
-- Limits (25 MB per file, Office/PDF only) are enforced by Storage itself,
-- so they hold even for uploads that bypass the web form.
-- Keep in sync with src/lib/fileRules.ts.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submissions',
  'submissions',
  false,
  26214400,
  array[
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/pdf'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Uploads must look like "<existing class id>/<submission id>/<file>.<allowed ext>".
drop policy if exists "storage_submissions_insert_anyone" on storage.objects;
create policy "storage_submissions_insert_anyone"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'submissions'
    and array_length(storage.foldername(name), 1) = 2
    and exists (select 1 from public.classes c where c.id::text = (storage.foldername(name))[1])
    and lower(storage.extension(name)) = any (array['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf'])
  );

drop policy if exists "storage_submissions_select_authenticated" on storage.objects;
create policy "storage_submissions_select_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'submissions');

-- Make the API (PostgREST) pick up new tables/functions immediately.
notify pgrst, 'reload schema';
