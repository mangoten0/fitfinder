-- Phase 2: usage limits and private photo uploads.
-- Nothing here stores what people search for. Uploaded crops are deleted right after each search.

-- Per-user usage counters. Only the edge functions (service role) can touch this table.
create table if not exists public.usage_counters (
  user_id uuid not null references auth.users (id) on delete cascade,
  bucket text not null,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, bucket)
);

alter table public.usage_counters enable row level security;
-- No policies on purpose: the app can't read or write counters, only the server can.

-- Global counters cap total daily spend across everyone.
create table if not exists public.global_usage_counters (
  bucket text primary key,
  count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.global_usage_counters enable row level security;

-- Atomically counts one use and reports whether the user is still under the limit.
create or replace function public.consume_quota(p_user uuid, p_bucket text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_count integer;
begin
  insert into public.usage_counters (user_id, bucket, count)
  values (p_user, p_bucket, 1)
  on conflict (user_id, bucket)
  do update set count = public.usage_counters.count + 1, updated_at = now()
  returning count into new_count;
  return new_count <= p_limit;
end;
$$;

create or replace function public.consume_global_quota(p_bucket text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_count integer;
begin
  insert into public.global_usage_counters (bucket, count)
  values (p_bucket, 1)
  on conflict (bucket)
  do update set count = public.global_usage_counters.count + 1, updated_at = now()
  returning count into new_count;
  return new_count <= p_limit;
end;
$$;

revoke all on function public.consume_quota(uuid, text, integer) from public, anon, authenticated;
revoke all on function public.consume_global_quota(text, integer) from public, anon, authenticated;
grant execute on function public.consume_quota(uuid, text, integer) to service_role;
grant execute on function public.consume_global_quota(text, integer) to service_role;

-- Old counters are only needed for today; this keeps the tables small.
create or replace function public.prune_usage_counters()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.usage_counters where updated_at < now() - interval '2 days';
  delete from public.global_usage_counters where updated_at < now() - interval '2 days';
$$;

revoke all on function public.prune_usage_counters() from public, anon, authenticated;
grant execute on function public.prune_usage_counters() to service_role;

-- Private bucket for cropped pieces. JPEG only, 2 MB max.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', false, 2097152, array['image/jpeg'])
on conflict (id) do update
set public = false, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg'];

-- Signed-in users (including anonymous ones) can upload only into their own folder.
-- They can't list, read, overwrite, or delete anything; the server handles reads and cleanup.
drop policy if exists "Upload crops to own folder" on storage.objects;
create policy "Upload crops to own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'uploads'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
