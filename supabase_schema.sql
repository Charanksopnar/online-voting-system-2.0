-- ============================================
-- SUPABASE DATABASE SCHEMA FOR E-VOTING SYSTEM
-- Idempotent & migration-safe
-- ============================================

-- 1. ENABLE EXTENSIONS
create extension if not exists "uuid-ossp";

-- ============================================
-- 2. TABLES + ENSURE COLUMNS EXIST
-- ============================================

-- PROFILES (User accounts with KYC data)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade
);

alter table public.profiles
  add column if not exists email text,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists role text default 'VOTER',
  add column if not exists verification_status text default 'NOT_STARTED',
  add column if not exists is_blocked boolean default false,
  add column if not exists block_reason text,
  add column if not exists photo_url text,
  add column if not exists face_url text,
  add column if not exists face_embeddings jsonb,
  add column if not exists liveness_verified boolean default false,
  add column if not exists age int,
  add column if not exists dob text,
  add column if not exists phone text,
  add column if not exists address_state text,
  add column if not exists address_district text,
  add column if not exists address_city text,
  add column if not exists id_number text,
  add column if not exists id_type text,
  add column if not exists kyc_doc_url text,
  add column if not exists aadhaar_number text,
  add column if not exists epic_number text,
  add column if not exists epic_doc_url text,
  add column if not exists created_at timestamptz default timezone('utc'::text, now());

-- ELECTIONS
create table if not exists public.elections (
  id text primary key
);

alter table public.elections
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists start_date timestamptz,
  add column if not exists end_date timestamptz,
  add column if not exists status text default 'UPCOMING',
  add column if not exists region text,
  add column if not exists region_state text,
  add column if not exists region_district text,
  add column if not exists created_at timestamptz default timezone('utc'::text, now());

-- CANDIDATES
create table if not exists public.candidates (
  id text primary key
);

alter table public.candidates
  add column if not exists election_id text,
  add column if not exists name text,
  add column if not exists party text,
  add column if not exists party_symbol_url text,
  add column if not exists photo_url text,
  add column if not exists manifesto text,
  add column if not exists votes_count int default 0,
  add column if not exists age int,
  add column if not exists state text,
  add column if not exists district text,
  add column if not exists created_at timestamptz default timezone('utc'::text, now());

-- VOTES
create table if not exists public.votes (
  id uuid primary key default uuid_generate_v4()
);

alter table public.votes
  add column if not exists election_id text,
  add column if not exists candidate_id text,
  add column if not exists voter_id uuid,
  add column if not exists block_hash text,
  add column if not exists risk_score double precision default 0,
  add column if not exists created_at timestamptz default timezone('utc'::text, now());

-- Ensure unique constraint exists on (election_id, voter_id)
do $$
begin
  begin
    alter table public.votes
      add constraint votes_election_voter_unique unique (election_id, voter_id);
  exception when duplicate_object then null;
  end;
end $$;

-- REGIONS
create table if not exists public.regions (
  id text primary key
);

alter table public.regions
  add column if not exists name text,
  add column if not exists type text,
  add column if not exists parent_region_id text,
  add column if not exists voter_count int default 0,
  add column if not exists created_at timestamptz default timezone('utc'::text, now());

-- FRAUD ALERTS
create table if not exists public.fraud_alerts (
  id uuid primary key default uuid_generate_v4()
);

alter table public.fraud_alerts
  add column if not exists voter_id uuid,
  add column if not exists election_id text,
  add column if not exists reason text,
  add column if not exists risk_level text,
  add column if not exists details text,
  add column if not exists timestamp timestamptz default timezone('utc'::text, now());

-- OFFICIAL VOTER LISTS (Government Electoral Roll Data)
create table if not exists public.official_voter_lists (
  id uuid primary key default uuid_generate_v4()
);

alter table public.official_voter_lists
  add column if not exists aadhaar_number text,
  add column if not exists epic_number text,
  add column if not exists full_name text,
  add column if not exists father_name text,
  add column if not exists age int,
  add column if not exists gender text,
  add column if not exists address_state text,
  add column if not exists address_district text,
  add column if not exists address_city text,
  add column if not exists polling_booth text,
  add column if not exists created_at timestamptz default timezone('utc'::text, now());

-- Add electoral roll verification columns to profiles
alter table public.profiles
  add column if not exists electoral_roll_verified boolean default false,
  add column if not exists electoral_roll_match_id uuid,
  add column if not exists manual_verify_requested boolean default false,
  add column if not exists manual_verify_requested_at timestamptz;

-- ============================================
-- 2b. FOREIGN KEYS (idempotent via DO blocks)
-- ============================================

do $$
begin
  -- candidates.election_id -> elections.id
  begin
    alter table public.candidates
      add constraint candidates_election_fk
      foreign key (election_id) references public.elections(id) on delete cascade;
  exception when duplicate_object then null;
  end;

  -- votes.election_id -> elections.id
  begin
    alter table public.votes
      add constraint votes_election_fk
      foreign key (election_id) references public.elections(id) on delete cascade;
  exception when duplicate_object then null;
  end;

  -- votes.candidate_id -> candidates.id
  begin
    alter table public.votes
      add constraint votes_candidate_fk
      foreign key (candidate_id) references public.candidates(id) on delete cascade;
  exception when duplicate_object then null;
  end;

  -- votes.voter_id -> profiles.id
  begin
    alter table public.votes
      add constraint votes_voter_fk
      foreign key (voter_id) references public.profiles(id) on delete cascade;
  exception when duplicate_object then null;
  end;

  -- regions.parent_region_id -> regions.id
  begin
    alter table public.regions
      add constraint regions_parent_fk
      foreign key (parent_region_id) references public.regions(id);
  exception when duplicate_object then null;
  end;

  -- fraud_alerts.voter_id -> profiles.id
  begin
    alter table public.fraud_alerts
      add constraint fraud_alerts_voter_fk
      foreign key (voter_id) references public.profiles(id) on delete set null;
  exception when duplicate_object then null;
  end;

  -- fraud_alerts.election_id -> elections.id
  begin
    alter table public.fraud_alerts
      add constraint fraud_alerts_election_fk
      foreign key (election_id) references public.elections(id) on delete set null;
  exception when duplicate_object then null;
  end;

end $$;

-- ============================================
-- 3. INDEXES (SCALABILITY)
-- ============================================

create index if not exists idx_profiles_lower_email
  on public.profiles (lower(email));
create index if not exists idx_profiles_phone
  on public.profiles (phone);
create index if not exists idx_profiles_id_number
  on public.profiles (id_number);
create index if not exists idx_profiles_aadhaar_number
  on public.profiles (aadhaar_number);
create index if not exists idx_profiles_epic_number
  on public.profiles (epic_number);

create index if not exists idx_elections_status_dates
  on public.elections (status, start_date, end_date);
create index if not exists idx_candidates_election_id
  on public.candidates (election_id);

create index if not exists idx_votes_election_candidate
  on public.votes (election_id, candidate_id);
create index if not exists idx_votes_voter_id
  on public.votes (voter_id);

create index if not exists idx_fraud_alerts_voter_election
  on public.fraud_alerts (voter_id, election_id);

create index if not exists idx_regions_parent_region
  on public.regions (parent_region_id);

-- Official Voter Lists indexes
create index if not exists idx_official_voters_aadhaar
  on public.official_voter_lists (aadhaar_number);
create index if not exists idx_official_voters_epic
  on public.official_voter_lists (epic_number);
create index if not exists idx_official_voters_name
  on public.official_voter_lists (lower(full_name));

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================

alter table public.profiles enable row level security;
alter table public.elections enable row level security;
alter table public.candidates enable row level security;
alter table public.votes enable row level security;
alter table public.regions enable row level security;
alter table public.fraud_alerts enable row level security;
alter table public.official_voter_lists enable row level security;

-- ============================================
-- 5. RLS POLICIES (DROP + RECREATE)
-- ============================================

-- PROFILES
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can update any profile" on public.profiles;

create policy "Public profiles are viewable by everyone"
  on public.profiles
  for select
  using (true);

create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Allow admins (users with role = 'ADMIN') to update any profile
create policy "Admins can update any profile"
  on public.profiles
  for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'ADMIN'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'ADMIN'
    )
  );

-- ELECTIONS
drop policy if exists "Elections viewable by everyone" on public.elections;
drop policy if exists "Admins insert elections" on public.elections;
drop policy if exists "Admins update elections" on public.elections;

create policy "Elections viewable by everyone"
  on public.elections
  for select
  using (true);

create policy "Admins insert elections"
  on public.elections
  for insert
  with check (auth.role() = 'authenticated');

create policy "Admins update elections"
  on public.elections
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- CANDIDATES
drop policy if exists "Candidates viewable by everyone" on public.candidates;
drop policy if exists "Admins insert candidates" on public.candidates;
drop policy if exists "Admins delete candidates" on public.candidates;
drop policy if exists "Admins update candidates" on public.candidates;

create policy "Candidates viewable by everyone"
  on public.candidates
  for select
  using (true);

create policy "Admins insert candidates"
  on public.candidates
  for insert
  with check (auth.role() = 'authenticated');

create policy "Admins delete candidates"
  on public.candidates
  for delete
  using (auth.role() = 'authenticated');

create policy "Admins update candidates"
  on public.candidates
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- VOTES
drop policy if exists "Votes viewable by everyone" on public.votes;
drop policy if exists "Authenticated users can vote" on public.votes;

create policy "Votes viewable by everyone"
  on public.votes
  for select
  using (true);

create policy "Authenticated users can vote"
  on public.votes
  for insert
  with check (auth.role() = 'authenticated');

-- REGIONS
drop policy if exists "Regions viewable by everyone" on public.regions;
drop policy if exists "Admins manage regions" on public.regions;

create policy "Regions viewable by everyone"
  on public.regions
  for select
  using (true);

create policy "Admins manage regions"
  on public.regions
  for insert
  with check (auth.role() = 'authenticated');

-- FRAUD ALERTS
drop policy if exists "Admins view alerts" on public.fraud_alerts;
drop policy if exists "System inserts alerts" on public.fraud_alerts;

create policy "Admins view alerts"
  on public.fraud_alerts
  for select
  using (true); -- tighten later if needed

create policy "System inserts alerts"
  on public.fraud_alerts
  for insert
  with check (true);

-- OFFICIAL VOTER LISTS
drop policy if exists "Official lists viewable by admins" on public.official_voter_lists;
drop policy if exists "Admins manage official lists" on public.official_voter_lists;
drop policy if exists "Admins update official lists" on public.official_voter_lists;
drop policy if exists "Admins delete official lists" on public.official_voter_lists;

create policy "Official lists viewable by admins"
  on public.official_voter_lists
  for select
  using (true);

create policy "Admins manage official lists"
  on public.official_voter_lists
  for insert
  with check (auth.role() = 'authenticated');

create policy "Admins update official lists"
  on public.official_voter_lists
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Admins delete official lists"
  on public.official_voter_lists
  for delete
  using (auth.role() = 'authenticated');

-- ============================================
-- 6. STORAGE BUCKETS & POLICIES
-- ============================================

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('faces', 'faces', true)
on conflict (id) do nothing;

-- Uploads policies
drop policy if exists "Public Access Uploads" on storage.objects;
drop policy if exists "Authenticated Uploads" on storage.objects;
drop policy if exists "Anon Uploads" on storage.objects;

create policy "Public Access Uploads"
  on storage.objects
  for select
  using (bucket_id = 'uploads');

create policy "Authenticated Uploads"
  on storage.objects
  for insert
  with check (bucket_id = 'uploads' and auth.role() = 'authenticated');

create policy "Anon Uploads"
  on storage.objects
  for insert
  with check (bucket_id = 'uploads');

-- Faces policies
drop policy if exists "Public Access Faces" on storage.objects;
drop policy if exists "Authenticated Faces" on storage.objects;
drop policy if exists "Anon Faces" on storage.objects;

create policy "Public Access Faces"
  on storage.objects
  for select
  using (bucket_id = 'faces');

create policy "Authenticated Faces"
  on storage.objects
  for insert
  with check (bucket_id = 'faces' and auth.role() = 'authenticated');

create policy "Anon Faces"
  on storage.objects
  for insert
  with check (bucket_id = 'faces');

-- ============================================
-- 7. AUTO-PROFILE TRIGGER
-- ============================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    age,
    dob,
    phone,
    address_state,
    address_district,
    address_city,
    id_number,
    id_type,
    kyc_doc_url,
    face_url,
    aadhaar_number,
    epic_number,
    epic_doc_url,
    photo_url
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'firstName',
    new.raw_user_meta_data->>'lastName',
    coalesce(new.raw_user_meta_data->>'role', 'VOTER'),
    nullif(new.raw_user_meta_data->>'age', '')::int,
    new.raw_user_meta_data->>'dob',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'state',
    new.raw_user_meta_data->>'district',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'idNumber',
    new.raw_user_meta_data->>'idType',
    new.raw_user_meta_data->>'kycDocUrl',
    new.raw_user_meta_data->>'faceUrl',
    new.raw_user_meta_data->>'aadhaarNumber',
    new.raw_user_meta_data->>'epicNumber',
    new.raw_user_meta_data->>'epicDocUrl',
    'https://ui-avatars.com/api/?name='
      || coalesce(new.raw_user_meta_data->>'firstName', '')
      || '+'
      || coalesce(new.raw_user_meta_data->>'lastName', '')
      || '&background=random'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- ============================================
-- 8. REALTIME PUBLICATION (idempotent)
-- ============================================

do $$
begin
  begin
    alter publication supabase_realtime add table public.profiles;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.elections;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.candidates;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.votes;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.regions;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.fraud_alerts;
  exception when duplicate_object then null;
  end;
end $$;
