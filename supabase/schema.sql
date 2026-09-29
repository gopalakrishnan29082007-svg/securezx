-- ============================================================
-- Secure Auth App v2 - Database Schema
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);


-- Brute-force protection
create table if not exists public.login_attempts (
  id bigint generated always as identity primary key,
  email text not null,
  attempted_at timestamptz default now()
);

alter table public.login_attempts enable row level security;

create or replace function public.check_login_allowed(p_email text)
returns boolean
language plpgsql
security definer
as $$
declare
  recent_failures int;
begin
  select count(*) into recent_failures
  from public.login_attempts
  where email = p_email
    and attempted_at > now() - interval '15 minutes';
  return recent_failures < 5;
end;
$$;

create or replace function public.log_failed_attempt(p_email text)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.login_attempts (email) values (p_email);
end;
$$;

grant execute on function public.check_login_allowed(text) to anon;
grant execute on function public.log_failed_attempt(text) to anon;


-- Notes table
create table if not exists public.notes (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.notes enable row level security;

create policy "Users can view own notes"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "Users can insert own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own notes"
  on public.notes for delete
  using (auth.uid() = user_id);


-- Private file storage
insert into storage.buckets (id, name, public)
values ('user-files', 'user-files', false)
on conflict (id) do nothing;

create policy "Users can view own files"
  on storage.objects for select
  using (
    bucket_id = 'user-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can upload own files"
  on storage.objects for insert
  with check (
    bucket_id = 'user-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'user-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
