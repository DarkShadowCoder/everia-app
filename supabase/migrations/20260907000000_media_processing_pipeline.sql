-- ============================================================
-- EVERIA — MEDIA PROCESSING PIPELINE
-- ============================================================

create table if not exists public.media_processing_jobs (
  id uuid primary key default gen_random_uuid(),

  media_id uuid not null
    references public.media(id)
    on delete cascade,

  status text not null default 'queued'
    check (
      status in (
        'queued',
        'processing',
        'completed',
        'failed'
      )
    ),

  attempts integer not null default 0,

  started_at timestamptz null,

  completed_at timestamptz null,

  last_error text null,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint media_processing_jobs_media_unique
    unique (media_id)
);

-- ============================================================
-- INDEX
-- ============================================================

create index if not exists
idx_media_processing_jobs_status_created
on public.media_processing_jobs(
  status,
  created_at
);

create index if not exists
idx_media_processing_jobs_media_id
on public.media_processing_jobs(
  media_id
);

-- ============================================================
-- MEDIA COLUMNS
-- ============================================================

alter table public.media
  add column if not exists
    display_path text;

alter table public.media
  add column if not exists
    thumbnail_path text;

alter table public.media
  add column if not exists
    mime_type text;

alter table public.media
  add column if not exists
    processing_metadata jsonb
      not null
      default '{}'::jsonb;

alter table public.media
  add column if not exists
    processing_error text;

alter table public.media
  add column if not exists
    processing_started_at timestamptz;

alter table public.media
  add column if not exists
    processed_at timestamptz;

-- ============================================================
-- UPDATED_AT
-- ============================================================

create or replace function public.touch_media_processing_job()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists
trg_media_processing_job_updated
on public.media_processing_jobs;

create trigger
trg_media_processing_job_updated
before update
on public.media_processing_jobs
for each row
execute function
public.touch_media_processing_job();

-- ============================================================
-- AUTO QUEUE ON MEDIA INSERT
-- ============================================================

create or replace function public.enqueue_media_processing_job()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  insert into public.media_processing_jobs (
    media_id,
    status
  )
  values (
    new.id,
    'queued'
  )
  on conflict (
    media_id
  )
  do nothing;

  return new;
end;
$$;

drop trigger if exists
trg_enqueue_media_processing_job
on public.media;

create trigger
trg_enqueue_media_processing_job
after insert
on public.media
for each row
execute function
public.enqueue_media_processing_job();

-- ============================================================
-- RLS
-- ============================================================

alter table public.media_processing_jobs
enable row level security;

drop policy if exists
media_processing_jobs_select_own
on public.media_processing_jobs;

create policy
media_processing_jobs_select_own
on public.media_processing_jobs
for select
to authenticated
using (
  exists (
    select 1
    from public.media m
    where m.id =
      media_processing_jobs.media_id
      and m.uploader_user_id =
        auth.uid()
  )
);

-- ============================================================
-- OPTIONAL MANUAL INSERT POLICY
-- ============================================================
--
-- En principe le trigger suffit.
-- Cette policy reste utile si un système externe crée
-- directement un job.
-- ============================================================

drop policy if exists
media_processing_jobs_insert_own
on public.media_processing_jobs;

create policy
media_processing_jobs_insert_own
on public.media_processing_jobs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.media m
    where m.id =
      media_processing_jobs.media_id
      and m.uploader_user_id =
        auth.uid()
  )
);

-- ============================================================
-- RETRY INDEX
-- ============================================================

create index if not exists
idx_media_processing_jobs_retry
on public.media_processing_jobs(
  status,
  attempts,
  created_at
)
where status in (
  'queued',
  'failed'
);