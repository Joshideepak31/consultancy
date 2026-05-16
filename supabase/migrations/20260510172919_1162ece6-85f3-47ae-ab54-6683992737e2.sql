
-- ROLES
create type public.app_role as enum ('superadmin', 'counselor');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_superadmin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'superadmin')
$$;

-- AUTH TRIGGER: profile + role
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email));

  if lower(new.email) = 'admin@educraft.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'superadmin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'counselor');
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profile RLS
create policy "view own profile" on public.profiles for select
  using (auth.uid() = id or public.is_superadmin());
create policy "update own profile" on public.profiles for update
  using (auth.uid() = id);
create policy "superadmin manage profiles" on public.profiles for all
  using (public.is_superadmin()) with check (public.is_superadmin());

-- user_roles RLS
create policy "view own roles" on public.user_roles for select
  using (auth.uid() = user_id or public.is_superadmin());
create policy "superadmin manage roles" on public.user_roles for all
  using (public.is_superadmin()) with check (public.is_superadmin());

-- Generic helper: auth users can read; only superadmin can write.
-- We use jsonb 'data' to preserve every optional field without exploding columns.

create table public.countries (
  id text primary key,
  name text not null,
  flag text,
  currency text,
  status text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.countries enable row level security;
create policy "auth read countries" on public.countries for select to authenticated using (true);
create policy "superadmin write countries" on public.countries for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

create table public.universities (
  id text primary key,
  country_id text references public.countries(id) on delete cascade,
  name text not null,
  status text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.universities enable row level security;
create policy "auth read universities" on public.universities for select to authenticated using (true);
create policy "superadmin write universities" on public.universities for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

create table public.programs (
  id text primary key,
  university_id text references public.universities(id) on delete cascade,
  name text not null,
  level text,
  status text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.programs enable row level security;
create policy "auth read programs" on public.programs for select to authenticated using (true);
create policy "superadmin write programs" on public.programs for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

-- Students: owner-scoped writes, all auth can read.
create table public.students (
  id text primary key,
  owner_id uuid references auth.users(id) on delete set null,
  full_name text,
  email text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.students enable row level security;
create policy "auth read students" on public.students for select to authenticated using (true);
create policy "owner or admin insert students" on public.students for insert to authenticated
  with check (auth.uid() = owner_id or public.is_superadmin());
create policy "owner or admin update students" on public.students for update to authenticated
  using (auth.uid() = owner_id or public.is_superadmin());
create policy "owner or admin delete students" on public.students for delete to authenticated
  using (auth.uid() = owner_id or public.is_superadmin());

create table public.rules (
  id text primary key, title text not null, scope text, category text,
  status text, data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now()
);
alter table public.rules enable row level security;
create policy "auth read rules" on public.rules for select to authenticated using (true);
create policy "superadmin write rules" on public.rules for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

create table public.folders (
  id text primary key, name text not null, parent_id text,
  data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
alter table public.folders enable row level security;
create policy "auth read folders" on public.folders for select to authenticated using (true);
create policy "superadmin write folders" on public.folders for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

create table public.media (
  id text primary key, title text not null, kind text, url text,
  folder_id text, country_id text, university_id text, program_id text,
  data jsonb not null default '{}'::jsonb, uploaded_at timestamptz not null default now()
);
alter table public.media enable row level security;
create policy "auth read media" on public.media for select to authenticated using (true);
create policy "superadmin write media" on public.media for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

create table public.notes (
  id text primary key, title text not null, category text, body text,
  pinned boolean default false, country_id text, university_id text,
  data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now()
);
alter table public.notes enable row level security;
create policy "auth read notes" on public.notes for select to authenticated using (true);
create policy "superadmin write notes" on public.notes for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

create table public.counselors (
  id text primary key, name text not null, email text, phone text, role text,
  active boolean default true, data jsonb not null default '{}'::jsonb,
  joined_at timestamptz not null default now()
);
alter table public.counselors enable row level security;
create policy "auth read counselors" on public.counselors for select to authenticated using (true);
create policy "superadmin write counselors" on public.counselors for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

create table public.process_maps (
  id text primary key, title text not null, country_id text, type text, status text,
  data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now()
);
alter table public.process_maps enable row level security;
create policy "auth read process_maps" on public.process_maps for select to authenticated using (true);
create policy "superadmin write process_maps" on public.process_maps for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

create table public.audit (
  id text primary key, actor text, action text, entity text,
  entity_name text, details text, at timestamptz not null default now()
);
alter table public.audit enable row level security;
create policy "superadmin read audit" on public.audit for select to authenticated using (public.is_superadmin());
create policy "auth insert audit" on public.audit for insert to authenticated with check (true);
create policy "superadmin delete audit" on public.audit for delete to authenticated using (public.is_superadmin());

create table public.settings (
  id int primary key default 1,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);
alter table public.settings enable row level security;
create policy "auth read settings" on public.settings for select to authenticated using (true);
create policy "superadmin write settings" on public.settings for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

insert into public.settings (id, data) values (1, '{"workspaceName":"EduIntel","defaultCurrency":"USD","brandTagline":"Knowledge-driven counseling","fiscalYearStart":"April"}'::jsonb)
on conflict (id) do nothing;
